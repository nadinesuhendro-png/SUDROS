// Taruh file ini di: lib/slug.ts
// PERUBAHAN: cek collision juga ke tabel seller_subdomains (subdomain aktif milik seller lain),
// bukan cuma listings.slug — karena subdomain final dipasang di seller_subdomains saat klaim.

import { createAdminClient } from "@/lib/supabase/admin"; // SESUAIKAN path createAdminClient() yang sudah dipakai

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

/**
 * Generate slug unik dari nama usaha — dicek terhadap DUA sumber:
 * 1. listings.slug (slug titipan, dipakai buat listing lain yang belum diklaim)
 * 2. seller_subdomains.subdomain (subdomain yang sudah resmi aktif milik seller lain)
 * Slug ini nanti dipakai sebagai calon subdomain begitu listing diklaim.
 */
export async function generateUniqueSlug(namaUsaha: string): Promise<string> {
  const base = slugify(namaUsaha) || "usaha";
  const supabaseAdmin = createAdminClient();

  let candidate = base;
  let suffix = 1;

  while (true) {
    const [{ data: listingHit, error: listingError }, { data: subdomainHit, error: subdomainError }] =
      await Promise.all([
        supabaseAdmin.from("listings").select("id").eq("slug", candidate).maybeSingle(),
        supabaseAdmin.from("seller_subdomains").select("id").eq("subdomain", candidate).maybeSingle(),
      ]);

    if (listingError) throw new Error(`Gagal cek slug listing: ${listingError.message}`);
    if (subdomainError) throw new Error(`Gagal cek slug subdomain: ${subdomainError.message}`);

    if (!listingHit && !subdomainHit) {
      return candidate;
    }

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}
