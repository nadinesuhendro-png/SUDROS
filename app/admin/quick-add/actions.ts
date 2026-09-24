// Taruh file ini di: app/admin/quick-add/actions.ts
// FIX: address & kota_id dihapus (tidak ada di skema), diganti location_city + location_area
// sesuai kolom asli tabel listings. Kolom `status` masih pakai nilai tebakan "published" —
// TUNGGU hasil query constraint sebelum anggap ini final, kemungkinan perlu diganti.
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateUniqueSlug } from "@/lib/slug";
import { runAITask } from "@/lib/ai/service";
import { revalidatePath } from "next/cache";

export type QuickAddResult =
  | { success: true; listingId: string; slug: string; claimLink: string }
  | { success: false; error: string };

export type RecentListing = {
  id: string;
  title: string;
  owner_whatsapp: string | null;
  claim_status: string;
  slug: string | null;
  owner_id: string | null;
};

export async function getRecentQuickAddListings(): Promise<RecentListing[]> {
  const supabaseAdmin = createAdminClient();
  const { data } = await supabaseAdmin
    .from("listings")
    .select("id, title, owner_whatsapp, claim_status, slug, owner_id")
    .not("owner_whatsapp", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export type DeleteResult = { success: true } | { success: false; error: string };

export async function deleteAssistedListing(listingId: string): Promise<DeleteResult> {
  const supabaseAdmin = createAdminClient();

  const { data: listing, error: findError } = await supabaseAdmin
    .from("listings")
    .select("slug, owner_id")
    .eq("id", listingId)
    .maybeSingle();

  if (findError) return { success: false, error: `Gagal cari listing: ${findError.message}` };
  if (!listing) return { success: false, error: "Listing tidak ditemukan." };

  // 1. Hapus row subdomain kalau ada
  if (listing.slug) {
    await supabaseAdmin.from("seller_subdomains").delete().eq("subdomain", listing.slug);
  }

  // 2. Hapus listing itu sendiri
  const { error: deleteListingError } = await supabaseAdmin.from("listings").delete().eq("id", listingId);
  if (deleteListingError) return { success: false, error: `Gagal hapus listing: ${deleteListingError.message}` };

  // 3. Kalau udah pernah diklaim, hapus juga akunnya (profile dulu baru auth user, biar nomor WA bisa dipakai ulang)
  if (listing.owner_id) {
    await supabaseAdmin.from("profiles").delete().eq("id", listing.owner_id);
    await supabaseAdmin.auth.admin.deleteUser(listing.owner_id);
  }

  revalidatePath("/admin/quick-add");
  return { success: true };
}

type DescriptionAIOutput = { description: string };

// Konstraint listings_status_check hanya izinkan: active, pending, rejected, suspended, sold, inactive.
// Dipilih "active" karena listing quick-add dibuat & sudah dicek manual oleh admin sendiri,
// jadi tidak perlu masuk antrian moderasi seperti listing submission user biasa (yang mungkin start dari "pending").
const DEFAULT_STATUS = "active";

export async function createAssistedListing(formData: FormData): Promise<QuickAddResult> {
  const namaUsaha = String(formData.get("nama_usaha") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const locationCity = String(formData.get("location_city") || "").trim();
  const locationArea = String(formData.get("location_area") || "").trim();
  const categoryId = String(formData.get("category_id") || "").trim();
  const priceRaw = String(formData.get("price") || "").trim();
  const price = priceRaw ? Math.max(0, Number(priceRaw) || 0) : 0;
  const photos = formData.getAll("photos") as File[];

  if (!namaUsaha || !whatsapp || !categoryId || !locationCity) {
    return { success: false, error: "Nama usaha, WA, kota, dan kategori wajib diisi." };
  }

  const supabaseAdmin = createAdminClient();

  try {
    // 0. Ambil nama kategori buat prompt AI
    const { data: category, error: categoryError } = await supabaseAdmin
      .from("categories")
      .select("name")
      .eq("id", categoryId)
      .maybeSingle();
    if (categoryError) throw new Error(`Gagal ambil kategori: ${categoryError.message}`);
    const categoryName = category?.name ?? "usaha lokal";

    // 1. Upload foto ke storage (bucket "listing-images" — SESUAIKAN nama bucket yang sudah dipakai)
    const imageUrls: string[] = [];
    for (const photo of photos) {
      if (!(photo instanceof File) || photo.size === 0) continue;
      const ext = photo.name.split(".").pop() || "jpg";
      const path = `quick-add/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("listing-images")
        .upload(path, photo, { contentType: photo.type });
      if (uploadError) throw new Error(`Upload foto gagal: ${uploadError.message}`);

      const { data: publicUrl } = supabaseAdmin.storage.from("listing-images").getPublicUrl(path);
      imageUrls.push(publicUrl.publicUrl);
    }

    // 2. Generate deskripsi pakai runAITask()
    const lokasiText = [locationArea, locationCity].filter(Boolean).join(", ");
    const prompt = `Buatkan deskripsi listing singkat (2-3 kalimat, bahasa Indonesia sehari-hari, menarik untuk calon pembeli lokal) untuk usaha bernama "${namaUsaha}" kategori "${categoryName}"${
      lokasiText ? ` yang berlokasi di ${lokasiText}` : ""
    }. Balas HANYA dalam format JSON tanpa teks lain: {"description": "..."}`;

    const aiResult = await runAITask<DescriptionAIOutput>(
      "quick_add_listing_description",
      { namaUsaha, categoryName, lokasiText },
      prompt
    );

    const deskripsi =
      aiResult.ok && aiResult.data?.description
        ? aiResult.data.description
        : `${namaUsaha} — usaha ${categoryName.toLowerCase()} lokal yang tersedia di SUDROS. Hubungi langsung via WhatsApp untuk info lebih lanjut.`;

    // 3. Generate slug unik buat subdomain
    const slug = await generateUniqueSlug(namaUsaha);

    // 4. Insert listing dengan owner_id NULL (belum diklaim)
    const { data: listing, error: insertError } = await supabaseAdmin
      .from("listings")
      .insert({
        title: namaUsaha,
        description: deskripsi,
        category_id: categoryId,
        location_city: locationCity,
        location_area: locationArea || null,
        price,
        owner_id: null,
        owner_whatsapp: whatsapp,
        claim_status: "unclaimed",
        slug,
        status: DEFAULT_STATUS,
      })
      .select("id, claim_token")
      .single();

    if (insertError) throw new Error(`Gagal buat listing: ${insertError.message}`);

    // 5. Simpan foto ke listing_images
    if (imageUrls.length > 0) {
      const rows = imageUrls.map((url, i) => ({
        listing_id: listing.id,
        image_url: url,
        sort_order: i,
      }));
      const { error: imgError } = await supabaseAdmin.from("listing_images").insert(rows);
      if (imgError) throw new Error(`Gagal simpan foto: ${imgError.message}`);
    }

    const claimLink = `https://sudros.id/klaim/${listing.claim_token}`;

    revalidatePath("/admin/quick-add");

    return { success: true, listingId: listing.id, slug, claimLink };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui." };
  }
}
