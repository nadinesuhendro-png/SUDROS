// Taruh file ini di: app/klaim/[token]/actions.ts
// PERUBAHAN: setelah listing berhasil diklaim, otomatis insert ke seller_subdomains
// pakai slug titipan yang sudah direservasi saat quick-add — subdomain langsung aktif,
// konsisten sama link yang sudah dijanjikan ke seller di pesan outreach.
"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ClaimResult = { success: true; subdomain: string | null } | { success: false; error: string };

export async function claimListing(token: string, formData: FormData): Promise<ClaimResult> {
  const password = String(formData.get("password") || "");
  const confirmWhatsapp = String(formData.get("whatsapp") || "").trim();

  if (password.length < 6) {
    return { success: false, error: "Password minimal 6 karakter." };
  }

  const supabaseAdmin = createAdminClient();

  // 1. Ambil listing berdasarkan claim_token (termasuk slug titipan)
  const { data: listing, error: findError } = await supabaseAdmin
    .from("listings")
    .select("id, owner_whatsapp, claim_status, slug")
    .eq("claim_token", token)
    .maybeSingle();

  if (findError || !listing) {
    return { success: false, error: "Link klaim tidak valid." };
  }

  if (listing.claim_status === "claimed") {
    return { success: false, error: "Listing ini sudah pernah diklaim." };
  }

  // 2. Konfirmasi nomor WA cocok (bandingkan digit polos dulu)
  const digitsOnly = (n: string) => n.replace(/\D/g, "");
  if (digitsOnly(confirmWhatsapp) !== digitsOnly(listing.owner_whatsapp || "")) {
    return { success: false, error: "Nomor WhatsApp tidak cocok dengan data listing." };
  }

  // 3. Buat akun baru pakai nomor WA sebagai identifier — Supabase wajib format E.164 (+62...)
  //    PENTING: Phone auth harus aktif di Supabase Dashboard → Authentication → Providers
  function toE164(n: string): string {
    let digits = digitsOnly(n);
    if (digits.startsWith("0")) digits = "62" + digits.slice(1); // 0812... -> 62812...
    if (!digits.startsWith("62")) digits = "62" + digits; // jaga-jaga kalau nomor tanpa 0 di depan
    return `+${digits}`;
  }
  const phone = toE164(listing.owner_whatsapp || "");

  // Username wajib diisi karena trigger `handle_new_user` di DB otomatis insert ke profiles
  // dan ambil username dari raw_user_meta_data->>'username' (fallback ke email, yang kita nggak punya).
  // Bikin username unik dari nomor HP biar nggak collide.
  const generatedUsername = `usaha${phone.replace(/\D/g, "")}`;

  const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    phone,
    password,
    phone_confirm: true,
    user_metadata: { username: generatedUsername },
  });

  if (createUserError || !newUser.user) {
    return { success: false, error: `Gagal buat akun: ${createUserError?.message ?? "unknown error"}` };
  }

  // 4. Row profile SUDAH otomatis dibuat oleh trigger on_auth_user_created (id, username).
  //    Tinggal update field tambahan yang relevan — JANGAN insert lagi, bakal bentrok primary key.
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ phone, whatsapp: phone })
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

  // 6. Pasang subdomain resmi (kalau ada slug titipan) — status "active" langsung karena
  //    konteksnya listing assisted/anchor, tidak perlu approval manual tambahan.
  //    SESUAIKAN nama kolom seller_subdomains kalau beda dari (owner_id, subdomain, status)
  let assignedSubdomain: string | null = null;
  if (listing.slug) {
    const { error: subdomainError } = await supabaseAdmin.from("seller_subdomains").insert({
      owner_id: newUser.user.id,
      subdomain: listing.slug,
      status: "active",
    });

    if (subdomainError) {
      // Jangan gagalkan seluruh proses klaim cuma karena subdomain bentrok/gagal —
      // listing tetap sah diklaim, subdomain bisa di-assign manual belakangan oleh admin.
      console.error("Gagal pasang subdomain saat klaim:", subdomainError.message);
    } else {
      assignedSubdomain = listing.slug;
    }
  }

  return { success: true, subdomain: assignedSubdomain };
}
