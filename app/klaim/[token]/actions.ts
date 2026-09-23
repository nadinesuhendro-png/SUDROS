// Taruh file ini di: app/klaim/[token]/actions.ts
// PERUBAHAN: Supabase phone auth butuh SMS provider (Twilio dkk) yang aktif, kalau nggak ada
// login/signup pakai phone DITOLAK ("Phone logins are disabled") walau cuma buat password login.
// Solusi: bikin akun pakai EMAIL SINTETIS dari nomor HP (mis. 6281362381411@wa.sudros.id),
// nomor HP asli tetap disimpan normal di profiles.phone/whatsapp buat ditampilin/dipakai di UI.
"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ClaimResult = { success: true; subdomain: string | null } | { success: false; error: string };

// Normalisasi nomor ke bentuk kanonik: digit saja, diawali kode negara 62 (tanpa +)
// PENTING: fungsi ini juga dipakai di app/(auth)/actions.ts saat login — harus identik,
// biar nomor yang sama selalu menghasilkan email sintetis yang sama.
function canonicalPhoneDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  if (!digits.startsWith("62")) digits = "62" + digits;
  return digits;
}

function phoneToSyntheticEmail(phoneDigits: string): string {
  return `${phoneDigits}@wa.sudros.id`;
}

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
    .select("id, owner_whatsapp, claim_status, slug")
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

  // 3. Buat akun baru pakai email sintetis dari nomor HP (email_confirm: true — tidak perlu verifikasi,
  //    karena kepemilikan nomor sudah diverifikasi manual lewat langkah 2 di atas)
  const syntheticEmail = phoneToSyntheticEmail(ownerDigits);
  const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email: syntheticEmail,
    password,
    email_confirm: true,
  });

  if (createUserError || !newUser.user) {
    return { success: false, error: `Gagal buat akun: ${createUserError?.message ?? "unknown error"}` };
  }

  // 4. Row profile otomatis dibuat oleh trigger on_auth_user_created (username diambil dari
  //    split_part(email, '@', 1) = nomor HP-nya sendiri, jadi otomatis unik). Update field tambahan.
  const displayPhone = listing.owner_whatsapp || "";
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ phone: displayPhone, whatsapp: displayPhone })
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
  let assignedSubdomain: string | null = null;
  if (listing.slug) {
    const { error: subdomainError } = await supabaseAdmin.from("seller_subdomains").insert({
      owner_id: newUser.user.id,
      subdomain: listing.slug,
      status: "active",
    });

    if (subdomainError) {
      console.error("Gagal pasang subdomain saat klaim:", subdomainError.message);
    } else {
      assignedSubdomain = listing.slug;
    }
  }

  return { success: true, subdomain: assignedSubdomain };
}
