// AKSI: BUAT FILE BARU
// PATH: lib/landing/media.ts
import { getAdminDb } from "@/lib/landing/helpers";

export const BUCKET = "landing-assets";

export type LandingProduct = {
  id: string;
  landing_page_id: string;
  name: string;
  price: number | null;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function formatRupiah(n: number | null): string {
  if (n === null || n === undefined) return "Hubungi untuk harga";
  return "Rp" + new Intl.NumberFormat("id-ID").format(n);
}

export async function saveImageDataUrl(
  folder: string,
  dataUrl: string
): Promise<{ url: string | null; error: string | null }> {
  const prefix = "data:image/jpeg;base64,";
  if (!dataUrl.startsWith(prefix)) {
    return { url: null, error: "Format gambar tidak valid" };
  }
  const buf = Buffer.from(dataUrl.slice(prefix.length), "base64");
  if (buf.length < 100 || buf.length > 600 * 1024) {
    return { url: null, error: "Ukuran gambar harus di bawah 600 KB" };
  }
  if (!(buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)) {
    return { url: null, error: "File bukan gambar JPEG yang valid" };
  }
  const path = folder + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
  const db = getAdminDb();
  const { error } = await db.storage.from(BUCKET).upload(path, buf, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return { url: null, error: "Gagal upload: " + error.message };
  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function removeImageByUrl(url: string | null): Promise<void> {
  if (!url) return;
  const marker = "/" + BUCKET + "/";
  const i = url.indexOf(marker);
  if (i < 0) return;
  const path = url.slice(i + marker.length);
  await getAdminDb().storage.from(BUCKET).remove([path]);
    }
