// Taruh file ini di: lib/slug.ts
// Dipakai server-side saja (butuh service role client)

import { createAdminClient } from "@/lib/supabase/admin"; // SESUAIKAN path import createAdminClient() sesuai yang sudah dipakai di admin/listings/actions.ts

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // hapus diakritik
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

/**
 * Generate slug unik dari nama usaha. Kalau sudah dipakai, tambahkan angka di belakang.
 * Contoh: "jagung-bakar-mas-wisnu", "jagung-bakar-mas-wisnu-2", dst.
 */
export async function generateUniqueSlug(namaUsaha: string): Promise<string> {
  const base = slugify(namaUsaha) || "usaha";
  const supabaseAdmin = createAdminClient();

  let candidate = base;
  let suffix = 1;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      // kalau error koneksi dll, jangan biarkan slug collision lolos diam-diam
      throw new Error(`Gagal cek slug: ${error.message}`);
    }

    if (!data) {
      return candidate;
    }

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}
