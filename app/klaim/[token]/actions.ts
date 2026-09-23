// Taruh file ini di: app/klaim/[token]/actions.ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ClaimResult = { success: true } | { success: false; error: string };

export async function claimListing(token: string, formData: FormData): Promise<ClaimResult> {
  const password = String(formData.get("password") || "");
  const confirmWhatsapp = String(formData.get("whatsapp") || "").trim();

  if (password.length < 6) {
    return { success: false, error: "Password minimal 6 karakter." };
  }

  const supabaseAdmin = createAdminClient();

  // 1. Ambil listing berdasarkan claim_token
  const { data: listing, error: findError } = await supabaseAdmin
    .from("listings")
    .select("id, owner_whatsapp, claim_status")
    .eq("claim_token", token)
    .maybeSingle();

  if (findError || !listing) {
    return { success: false, error: "Link klaim tidak valid." };
  }

  if (listing.claim_status === "claimed") {
    return { success: false, error: "Listing ini sudah pernah diklaim." };
  }

  // 2. Konfirmasi nomor WA cocok (keamanan minimal — pastikan yang klaim benar pemiliknya)
  const normalize = (n: string) => n.replace(/\D/g, "");
  if (normalize(confirmWhatsapp) !== normalize(listing.owner_whatsapp || "")) {
    return { success: false, error: "Nomor WhatsApp tidak cocok dengan data listing." };
  }

  // 3. Buat akun baru pakai nomor WA sebagai identifier (phone_confirm: true karena kita sudah verifikasi manual di atas)
  //    PENTING: pastikan Phone auth aktif di Supabase Dashboard → Authentication → Providers
  const phone = normalize(listing.owner_whatsapp || "");
  const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    phone,
    password,
    phone_confirm: true,
  });

  if (createUserError || !newUser.user) {
    return { success: false, error: `Gagal buat akun: ${createUserError?.message ?? "unknown error"}` };
  }

  // 4. Buat row profile (SESUAIKAN kalau ada trigger otomatis yang sudah bikin profile saat auth user dibuat —
  //    kalau sudah ada trigger, skip insert ini)
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: newUser.user.id,
    phone,
  });
  if (profileError && !profileError.message.includes("duplicate")) {
    return { success: false, error: `Gagal buat profil: ${profileError.message}` };
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

  return { success: true };
}

