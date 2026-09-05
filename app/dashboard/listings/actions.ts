// PATH: app/dashboard/listings/actions.ts
// AKSI: GANTI SELURUH ISI FILE (terima & simpan latitude/longitude dari pin lokasi)

"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { runModerationAgentForListing } from "@/lib/agents/moderation-agent";
import { getUserEntitlements } from "@/lib/entitlements/service";
import { getActiveTermsVersion, hasUserAgreedToActiveTerms } from "@/lib/terms/service";

type CreateListingInput = {
  id: string;
  title: string;
  description: string;
  price: number;
  categoryId: string;
  locationCity: string;
  locationArea: string;
  imageUrls: string[];
  latitude: number | null;
  longitude: number | null;
};

export async function createListing(input: CreateListingInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const entitlements = await getUserEntitlements(user.id);

  if (!entitlements.canCreateListing) {
    redirect(
      `/dashboard/package?error=${encodeURIComponent(
        "Kuota listing aktif Anda sudah habis. Upgrade paket untuk menambah kuota."
      )}`
    );
  }

  const activeTerms = await getActiveTermsVersion();

  if (!activeTerms) {
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent(
        "Terjadi masalah saat memverifikasi Syarat & Ketentuan. Silakan coba lagi."
      )}`
    );
  }

  const hasAgreed = await hasUserAgreedToActiveTerms(user.id, activeTerms.id);

  if (!hasAgreed) {
    redirect("/dashboard/listings/new");
  }

  const title = input.title.trim();
  const locationCity = input.locationCity.trim();

  if (!title) {
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent("Judul wajib diisi")}`
    );
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent("Harga tidak valid")}`
    );
  }

  if (!input.categoryId) {
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent("Kategori wajib dipilih")}`
    );
  }

  if (!locationCity) {
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent("Kota wajib diisi")}`
    );
  }

  const hasValidLatLng =
    input.latitude !== null &&
    input.longitude !== null &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude);

  const { data: listing, error: insertError } = await supabase
    .from("listings")
    .insert({
      id: input.id,
      title,
      description: input.description.trim() || null,
      price: Math.round(input.price),
      category_id: input.categoryId,
      location_city: locationCity,
      location_area: input.locationArea.trim() || null,
      latitude: hasValidLatLng ? input.latitude : null,
      longitude: hasValidLatLng ? input.longitude : null,
      owner_id: user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !listing) {
    const isRateLimit = insertError?.message.includes("RATE_LIMIT");
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent(
        isRateLimit
          ? "Anda membuat listing terlalu cepat. Silakan tunggu beberapa menit sebelum membuat listing baru."
          : insertError?.message || "Gagal membuat listing"
      )}`
    );
  }

  if (input.imageUrls.length > 0) {
    const rows = input.imageUrls.map((url, index) => ({
      listing_id: listing.id,
      image_url: url,
      sort_order: index,
    }));

    await supabase.from("listing_images").insert(rows);
  }

  after(() => runModerationAgentForListing(listing.id));

  redirect("/dashboard");
}

export async function deleteListing(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = formData.get("id") as string;
  if (!id) {
    redirect("/dashboard/listings");
  }

  await supabase.from("listings").delete().eq("id", id).eq("owner_id", user.id);

  redirect("/dashboard/listings");
}

export async function updateListing(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = formData.get("id") as string;
  const title = ((formData.get("title") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const priceRaw = formData.get("price") as string;
  const categoryId = formData.get("category_id") as string;
  const locationCity = ((formData.get("location_city") as string) || "").trim();
  const locationArea = ((formData.get("location_area") as string) || "").trim();
  const newImageUrls = formData.getAll("new_image_urls") as string[];

  if (!id) {
    redirect("/dashboard/listings");
  }

  if (!title) {
    redirect(
      `/dashboard/listings/${id}/edit?error=${encodeURIComponent("Judul wajib diisi")}`
    );
  }

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    redirect(
      `/dashboard/listings/${id}/edit?error=${encodeURIComponent("Harga tidak valid")}`
    );
  }

  if (!categoryId) {
    redirect(
      `/dashboard/listings/${id}/edit?error=${encodeURIComponent("Kategori wajib dipilih")}`
    );
  }

  if (!locationCity) {
    redirect(
      `/dashboard/listings/${id}/edit?error=${encodeURIComponent("Kota wajib diisi")}`
    );
  }

  const { error: updateError } = await supabase
    .from("listings")
    .update({
      title,
      description: description || null,
      price: Math.round(price),
      category_id: categoryId,
      location_city: locationCity,
      location_area: locationArea || null,
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (updateError) {
    redirect(
      `/dashboard/listings/${id}/edit?error=${encodeURIComponent(updateError.message)}`
    );
  }

  if (newImageUrls.length > 0) {
    const { data: existingImages } = await supabase
      .from("listing_images")
      .select("sort_order")
      .eq("listing_id", id)
      .order("sort_order", { ascending: false })
      .limit(1);

    let nextSortOrder =
      existingImages && existingImages.length > 0
        ? existingImages[0].sort_order + 1
        : 0;

    const rows = newImageUrls.map((url) => ({
      listing_id: id,
      image_url: url,
      sort_order: nextSortOrder++,
    }));

    await supabase.from("listing_images").insert(rows);
  }

  redirect("/dashboard/listings");
}

export async function deleteListingImage(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const imageId = formData.get("image_id") as string;
  const listingId = formData.get("listing_id") as string;

  if (!imageId || !listingId) {
    return;
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("owner_id", user.id)
    .single();

  if (!listing) {
    return;
  }

  await supabase.from("listing_images").delete().eq("id", imageId);

  redirect(`/dashboard/listings/${listingId}/edit`);
}
