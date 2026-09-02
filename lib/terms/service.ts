// PATH: lib/terms/service.ts
// AKSI: BUAT FILE BARU

import { createClient } from "@/lib/supabase/server";

export type ActiveTermsVersion = {
  id: string;
  version: string;
  title: string;
  content: string;
  effectiveAt: string;
};

type TermsVersionRow = {
  id: string;
  version: string;
  title: string;
  content: string;
  effective_at: string;
};

// Ambil versi Terms yang sedang aktif. Return null kalau tidak ada
// (kasus darurat — harus di-treat sebagai FAIL CLOSED oleh pemanggil,
// bukan diizinkan lewat begitu saja).
export async function getActiveTermsVersion(): Promise<ActiveTermsVersion | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("terms_versions")
    .select("id, version, title, content, effective_at")
    .eq("is_active", true)
    .maybeSingle<TermsVersionRow>();

  if (!data) return null;

  return {
    id: data.id,
    version: data.version,
    title: data.title,
    content: data.content,
    effectiveAt: data.effective_at,
  };
}

// Cek apakah user sudah menyetujui versi Terms yang SEDANG aktif
// (bukan versi lama). Sumber kebenaran tunggal — dipakai baik untuk
// menampilkan/menyembunyikan consent gate maupun untuk enforcement
// server-side di createListing.
export async function hasUserAgreedToActiveTerms(
  userId: string,
  activeTermsVersionId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_terms_agreements")
    .select("id")
    .eq("user_id", userId)
    .eq("terms_version_id", activeTermsVersionId)
    .maybeSingle<{ id: string }>();

  return Boolean(data);
}

// Simpan agreement. Aman dipanggil berulang (double-click, network
// retry) berkat unique constraint (user_id, terms_version_id) — insert
// kedua akan gagal karena duplikat, itu dianggap sukses (idempotent).
export async function saveTermsAgreement(
  userId: string,
  termsVersionId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("user_terms_agreements").insert({
    user_id: userId,
    terms_version_id: termsVersionId,
  });

  if (error) {
    // Kode 23505 = unique_violation — berarti user sudah pernah setuju
    // (misal klik dua kali). Ini bukan kegagalan sesungguhnya.
    if (error.code === "23505") {
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
            }
