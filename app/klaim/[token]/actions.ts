// Taruh file ini di: app/klaim/[token]/actions.ts
// PERUBAHAN dari versi sebelumnya: profiles.phone sekarang disimpan dalam format KANONIK
// (digit saja, diawali 62, tanpa +) — bukan format tampilan asli — supaya login lewat nomor HP
// bisa LOOKUP persis ke baris ini (bukan nebak/reconstruct email dari nomor lagi).
"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ClaimResult = { success: true; subdomain: string | null } | { success: false; error: string };

// HARUS identik dengan canonicalPhoneDigits di app/(auth)/actions.ts
function canonicalPhoneDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  if (!digits.startsWith("62")) digits = "62" + digits;
  return digits;
}

export async function claimListing(token: string, formData: FormData): Promise<ClaimResult> {
  const password = String(formData.get("password") || "");
  const confirmWhatsapp = String(formData.get("whatsapp") || "").trim();

  if (password.length < 6) {
    return { success: false, error: "Password minimal 6 karakter." };
  }

  const supabaseAdmin = createAdminClient();

  // 1. Ambil listing berdasarkan claim_token (termasuk title buat nama tampilan profil)
  const { data: listing, error: findError } = await supabaseAdmin
    .from("listings")
    .select("id, title, owner_whatsapp, claim_status, slug")
    .eq("claim_token", token)
    .maybeSingle();

  if (findError || !listing) {
    return { success: false, error: "Link klaim tidak valid." };
  }

  if (listing.claim_status === "claimed") {
    return { success: false, error: "Listing ini sudah pernah diklaim." };
  }

  // 2. Konfirmasi nomor WA cocok
  const inputDigits = canonicalPhoneDigits(confirmWhatsapp);
  const ownerDigits = canonicalPhoneDigits(listing.owner_whatsapp || "");
  if (inputDigits !== ownerDigits) {
    return { success: false, error: "Nomor WhatsApp tidak cocok dengan data listing." };
  }

  // 3. Buat akun baru pakai email sintetis dari nomor HP (email_confirm: true — kepemilikan nomor
  //    sudah diverifikasi manual di langkah 2). Email ini boleh format apapun sebenarnya —
  //    yang penting login nanti LOOKUP dari profiles.phone, bukan reconstruct dari nomor.
  const syntheticEmail = `${ownerDigits}@wa.sudros.id`;
  const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email: syntheticEmail,
    password,
    email_confirm: true,
  });

  if (createUserError || !newUser.user) {
    return { success: false, error: `Gagal buat akun: ${createUserError?.message ?? "unknown error"}` };
  }

  // 4. Row profile otomatis dibuat oleh trigger on_auth_user_created.
  //    PENTING: phone disimpan format KANONIK (dipakai buat lookup login),
  //    whatsapp disimpan format asli/tampilan (dipakai buat ditampilkan di UI).
  //    full_name diisi dari nama usaha (listing.title) biar dashboard nampilin nama toko, bukan nomor HP.
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ phone: ownerDigits, whatsapp: listing.owner_whatsapp, full_name: listing.title })
    .eq("id", newUser.user.id);
  if (profileError) {
    return { success: false, error: `Gagal update profil: ${profileError.message}` };
  }

  // 5. Pindahkan kepemilikan listing
  const { error: updateError } = await supabaseAdmin
    .from("listings")
    .update({
      owner_id: newUser.user.id,
      claim_status: "claimed",
    })
    .eq("id", listing.id);

  if (updateError) {
    return { success: false, error: `Gagal update listing: ${updateError.message}` };
  }

  // 6. Pasang subdomain resmi (kalau ada slug titipan)
  //    PENTING: policy RLS public_read_active_subdomain butuh status='active' DAN expires_at > now() —
  //    kalau expires_at kosong (NULL), row nggak lolos SELECT publik walau status aktif.
  //    Anchor seller dianggap unlimited, jadi expires_at di-set jauh ke depan (10 tahun).
  let assignedSubdomain: string | null = null;
  if (listing.slug) {
    const farFutureExpiry = new Date();
    farFutureExpiry.setFullYear(farFutureExpiry.getFullYear() + 10);

    const { error: subdomainError } = await supabaseAdmin.from("seller_subdomains").insert({
      owner_id: newUser.user.id,
      subdomain: listing.slug,
      status: "active",
      expires_at: farFutureExpiry.toISOString(),
    });

    if (subdomainError) {
      console.error("Gagal pasang subdomain saat klaim:", subdomainError.message);
    } else {
      assignedSubdomain = listing.slug;
    }
  }

  return { success: true, subdomain: assignedSubdomain };
}
