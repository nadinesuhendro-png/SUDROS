// PATH: app/dashboard/listings/terms-actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveTermsVersion, saveTermsAgreement } from "@/lib/terms/service";

export async function agreeToActiveTerms() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const activeTerms = await getActiveTermsVersion();

  if (!activeTerms) {
    // FAIL CLOSED — kalau versi aktif tidak ditemukan, jangan izinkan
    // agreement palsu. Balik ke halaman yang sama, akan tetap terblokir.
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent(
        "Terjadi masalah saat memuat Syarat & Ketentuan. Silakan coba lagi."
      )}`
    );
  }

  const result = await saveTermsAgreement(user.id, activeTerms.id);

  if (!result.ok) {
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent(
        "Persetujuan belum berhasil disimpan. Silakan coba lagi."
      )}`
    );
  }

  // Sukses — reload halaman /new, sekarang gate akan lolos dan form muncul
  redirect("/dashboard/listings/new");
}
