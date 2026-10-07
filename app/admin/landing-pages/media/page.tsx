// AKSI: BUAT FILE BARU
// PATH: app/admin/landing-pages/media/page.tsx
import type { CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDb, getAdminUserId, type LandingPage } from "@/lib/landing/helpers";
import {
  formatRupiah,
  removeImageByUrl,
  saveImageDataUrl,
  type LandingProduct,
} from "@/lib/landing/media";
import ImageCompressField from "@/components/landing/ImageCompressField";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ id?: string; err?: string; ok?: string }> };
type PageWithLogo = LandingPage & { logo_url: string | null };

const MAX_PRODUCTS = 12;

function failUrl(id: string, msg: string): string {
  return "/admin/landing-pages/media?id=" + id + "&err=" + encodeURIComponent(msg);
}
function okUrl(id: string): string {
  return "/admin/landing-pages/media?id=" + id + "&ok=" + Date.now();
}
function parsePrice(raw: string): number | null | "bad" {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return null;
  if (digits.length > 12) return "bad";
  return Number(digits);
}

const wrap: CSSProperties = { maxWidth: 600, margin: "0 auto", padding: 16 };
const h1: CSSProperties = { fontSize: 22, fontWeight: 700, margin: "0 0 4px 0" };
const h2: CSSProperties = { fontSize: 18, fontWeight: 700, margin: "0 0 8px 0" };
const meta: CSSProperties = { fontSize: 13, opacity: 0.75, marginTop: 4 };
const section: CSSProperties = { border: "1px solid rgba(128,128,128,0.35)", borderRadius: 12, padding: 14, marginTop: 16 };
const label: CSSProperties = { display: "block", fontSize: 14, fontWeight: 600, margin: "12px 0 6px 0" };
const input: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(128,128,128,0.5)", background: "transparent", color: "inherit", fontSize: 16 };
const area: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(128,128,128,0.5)", background: "transparent", color: "inherit", fontSize: 16, minHeight: 80 };
const btnPrimary: CSSProperties = { background: "#1d6fb8", color: "#ffffff", padding: "10px 16px", borderRadius: 8, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", marginTop: 14 };
const btnGhost: CSSProperties = { background: "transparent", color: "inherit", padding: "9px 14px", borderRadius: 8, fontSize: 14, border: "1px solid rgba(128,128,128,0.5)", cursor: "pointer" };
const btnDanger: CSSProperties = { background: "#dc2626", color: "#ffffff", padding: "9px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", marginTop: 10 };
const errBox: CSSProperties = { padding: 10, borderRadius: 8, border: "1px solid #dc2626", color: "#dc2626", marginTop: 12, fontSize: 14 };
const okBox: CSSProperties = { padding: 10, borderRadius: 8, border: "1px solid #16a34a", color: "#16a34a", marginTop: 12, fontSize: 14 };
const backLink: CSSProperties = { display: "inline-block", marginBottom: 12, fontSize: 14 };
const prodTop: CSSProperties = { display: "flex", gap: 12, alignItems: "center" };
const thumb: CSSProperties = { width: 64, height: 64, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(128,128,128,0.4)" };
const thumbEmpty: CSSProperties = { width: 64, height: 64, borderRadius: 10, border: "1px dashed rgba(128,128,128,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, opacity: 0.6 };
const prodName: CSSProperties = { fontWeight: 700, fontSize: 16 };
const btnRow: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 };
const details: CSSProperties = { marginTop: 10 };
const summary: CSSProperties = { cursor: "pointer", fontSize: 14, fontWeight: 600 };
const checkRow: CSSProperties = { display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 14 };
const logoPreview: CSSProperties = { width: 96, height: 96, objectFit: "contain", borderRadius: 12, border: "1px solid rgba(128,128,128,0.4)", background: "#ffffff", display: "block", marginBottom: 8 };

export default async function MediaPage({ searchParams }: Props) {
  const adminId = await getAdminUserId();
  if (!adminId) redirect("/dashboard");

  const sp = await searchParams;
  const id = sp.id || "";
  if (!id) redirect("/admin/landing-pages");

  const db = getAdminDb();
  const { data: pg } = await db
    .from("landing_pages")
    .select("*")
    .eq("id", id)
    .maybeSingle<PageWithLogo>();
  if (!pg) redirect("/admin/landing-pages");

  const { data: prodData } = await db
    .from("landing_products")
    .select("*")
    .eq("landing_page_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<LandingProduct[]>();
  const products = prodData ?? [];
  const keySalt = sp.ok || "0";

  async function saveLogo(formData: FormData) {
    "use server";
    const uid = await getAdminUserId();
    if (!uid) redirect("/dashboard");
    const lid = String(formData.get("id") || "");
    if (!lid) redirect("/admin/landing-pages");
    const dataUrl = String(formData.get("logo") || "");
    if (!dataUrl) redirect(failUrl(lid, "Pilih gambar logo dulu"));

    const sdb = getAdminDb();
    const { data: cur } = await sdb
      .from("landing_pages")
      .select("logo_url")
      .eq("id", lid)
      .maybeSingle<{ logo_url: string | null }>();
    const saved = await saveImageDataUrl(lid + "/logo", dataUrl);
    if (!saved.url) redirect(failUrl(lid, saved.error || "Gagal upload"));
    const { error } = await sdb
      .from("landing_pages")
      .update({ logo_url: saved.url, updated_at: new Date().toISOString() })
      .eq("id", lid);
    if (error) {
      await removeImageByUrl(saved.url);
      redirect(failUrl(lid, "Gagal menyimpan logo"));
    }
    await removeImageByUrl(cur ? cur.logo_url : null);
    redirect(okUrl(lid));
  }

  async function removeLogo(formData: FormData) {
    "use server";
    const uid = await getAdminUserId();
    if (!uid) redirect("/dashboard");
    const lid = String(formData.get("id") || "");
    if (!lid) redirect("/admin/landing-pages");
    const sdb = getAdminDb();
    const { data: cur } = await sdb
      .from("landing_pages")
      .select("logo_url")
      .eq("id", lid)
      .maybeSingle<{ logo_url: string | null }>();
    await sdb
      .from("landing_pages")
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq("id", lid);
    await removeImageByUrl(cur ? cur.logo_url : null);
    redirect(okUrl(lid));
  }

  async function addProduct(formData: FormData) {
    "use server";
    const uid = await getAdminUserId();
    if (!uid) redirect("/dashboard");
    const lid = String(formData.get("id") || "");
    if (!lid) redirect("/admin/landing-pages");

    const name = String(formData.get("name") || "").trim().slice(0, 80);
    if (!name) redirect(failUrl(lid, "Nama produk wajib diisi"));
    const price = parsePrice(String(formData.get("price") || ""));
    if (price === "bad") redirect(failUrl(lid, "Harga terlalu besar"));
    const description = String(formData.get("description") || "").trim().slice(0, 300);

    const sdb = getAdminDb();
    const { count } = await sdb
      .from("landing_products")
      .select("id", { count: "exact", head: true })
      .eq("landing_page_id", lid);
    if ((count ?? 0) >= MAX_PRODUCTS) {
      redirect(failUrl(lid, "Maksimal " + MAX_PRODUCTS + " produk per landing page"));
    }
    const { data: last } = await sdb
      .from("landing_products")
      .select("sort_order")
      .eq("landing_page_id", lid)
      .order("sort_order", { ascending: false })
      .limit(1)
      .returns<{ sort_order: number }[]>();
    const nextOrder = last && last.length > 0 ? last[0].sort_order + 1 : 0;

    let imageUrl: string | null = null;
    const dataUrl = String(formData.get("image") || "");
    if (dataUrl) {
      const saved = await saveImageDataUrl(lid + "/products", dataUrl);
      if (!saved.url) redirect(failUrl(lid, saved.error || "Gagal upload"));
      imageUrl = saved.url;
    }

    const { error } = await sdb.from("landing_products").insert({
      landing_page_id: lid,
      name: name,
      price: price,
      description: description || null,
      image_url: imageUrl,
      sort_order: nextOrder,
    });
    if (error) {
      await removeImageByUrl(imageUrl);
      redirect(failUrl(lid, "Gagal menyimpan produk: " + error.message));
    }
    redirect(okUrl(lid));
  }

  async function updateProduct(formData: FormData) {
    "use server";
    const uid = await getAdminUserId();
    if (!uid) redirect("/dashboard");
    const lid = String(formData.get("id") || "");
    const pid = String(formData.get("pid") || "");
    if (!lid || !pid) redirect("/admin/landing-pages");

    const name = String(formData.get("name") || "").trim().slice(0, 80);
    if (!name) redirect(failUrl(lid, "Nama produk wajib diisi"));
    const price = parsePrice(String(formData.get("price") || ""));
    if (price === "bad") redirect(failUrl(lid, "Harga terlalu besar"));
    const description = String(formData.get("description") || "").trim().slice(0, 300);

    const sdb = getAdminDb();
    const { data: cur } = await sdb
      .from("landing_products")
      .select("image_url")
      .eq("id", pid)
      .eq("landing_page_id", lid)
      .maybeSingle<{ image_url: string | null }>();
    if (!cur) redirect(failUrl(lid, "Produk tidak ditemukan"));

    let newImage: string | null = null;
    const dataUrl = String(formData.get("image") || "");
    if (dataUrl) {
      const saved = await saveImageDataUrl(lid + "/products", dataUrl);
      if (!saved.url) redirect(failUrl(lid, saved.error || "Gagal upload"));
      newImage = saved.url;
    }

    const payload: Record<string, unknown> = {
      name: name,
      price: price,
      description: description || null,
      updated_at: new Date().toISOString(),
    };
    if (newImage) payload.image_url = newImage;

    const { error } = await sdb
      .from("landing_products")
      .update(payload)
      .eq("id", pid)
      .eq("landing_page_id", lid);
    if (error) {
      await removeImageByUrl(newImage);
      redirect(failUrl(lid, "Gagal menyimpan produk: " + error.message));
    }
    if (newImage) await removeImageByUrl(cur.image_url);
    redirect(okUrl(lid));
  }

  async function toggleProduct(formData: FormData) {
    "use server";
    const uid = await getAdminUserId();
    if (!uid) redirect("/dashboard");
    const lid = String(formData.get("id") || "");
    const pid = String(formData.get("pid") || "");
    if (!lid || !pid) redirect("/admin/landing-pages");
    const active = String(formData.get("active") || "") === "1";
    await getAdminDb()
      .from("landing_products")
      .update({ is_active: active, updated_at: new Date().toISOString() })
      .eq("id", pid)
      .eq("landing_page_id", lid);
    redirect(okUrl(lid));
  }

  async function deleteProduct(formData: FormData) {
    "use server";
    const uid = await getAdminUserId();
    if (!uid) redirect("/dashboard");
    const lid = String(formData.get("id") || "");
    const pid = String(formData.get("pid") || "");
    if (!lid || !pid) redirect("/admin/landing-pages");
    if (formData.get("confirm") !== "yes") redirect(failUrl(lid, "Centang konfirmasi hapus"));
    const sdb = getAdminDb();
    const { data: cur } = await sdb
      .from("landing_products")
      .select("image_url")
      .eq("id", pid)
      .eq("landing_page_id", lid)
      .maybeSingle<{ image_url: string | null }>();
    await sdb.from("landing_products").delete().eq("id", pid).eq("landing_page_id", lid);
    await removeImageByUrl(cur ? cur.image_url : null);
    redirect(okUrl(lid));
  }

  return (
    <div style={wrap}>
      <Link href="/admin/landing-pages" style={backLink}>Kembali</Link>
      <h1 style={h1}>Logo dan Produk</h1>
      <div style={meta}>{pg.title} - {pg.subdomain}.sudros.id</div>

      {sp.ok ? <div style={okBox}>Tersimpan.</div> : null}
      {sp.err ? <div style={errBox}>{sp.err}</div> : null}

      <div style={section}>
        <h2 style={h2}>Logo Toko</h2>
        {pg.logo_url ? <img src={pg.logo_url} alt="Logo" style={logoPreview} /> : <div style={meta}>Belum ada logo.</div>}
        <form action={saveLogo}>
          <input type="hidden" name="id" value={id} />
          <ImageCompressField key={"logo-" + keySalt} name="logo" label="Pilih logo baru" maxSide={600} />
          <button type="submit" style={btnPrimary}>Simpan Logo</button>
        </form>
        {pg.logo_url ? (
          <form action={removeLogo}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" style={{ ...btnGhost, marginTop: 10 }}>Hapus Logo</button>
          </form>
        ) : null}
      </div>

      <div style={section}>
        <h2 style={h2}>Tambah Produk ({products.length}/{MAX_PRODUCTS})</h2>
        <form action={addProduct}>
          <input type="hidden" name="id" value={id} />
          <label style={label} htmlFor="p-name">Nama produk</label>
          <input style={input} id="p-name" name="name" required />
          <label style={label} htmlFor="p-price">Harga (Rp, kosongkan jika hubungi dulu)</label>
          <input style={input} id="p-price" name="price" inputMode="numeric" placeholder="25000" />
          <label style={label} htmlFor="p-desc">Deskripsi singkat</label>
          <textarea style={area} id="p-desc" name="description" />
          <ImageCompressField key={"add-" + keySalt} name="image" label="Foto produk" maxSide={800} />
          <button type="submit" style={btnPrimary}>Tambah Produk</button>
        </form>
      </div>

      <div style={section}>
        <h2 style={h2}>Daftar Produk</h2>
        {products.length === 0 ? <div style={meta}>Belum ada produk.</div> : null}
        {products.map((p) => (
          <div key={p.id} style={{ ...section, marginTop: 12 }}>
            <div style={prodTop}>
              {p.image_url ? <img src={p.image_url} alt={p.name} style={thumb} /> : <div style={thumbEmpty}>Foto</div>}
              <div>
                <div style={prodName}>{p.name}</div>
                <div style={meta}>{formatRupiah(p.price)}</div>
                <div style={meta}>{p.is_active ? "Tampil" : "Disembunyikan"}</div>
              </div>
            </div>

            <div style={btnRow}>
              <form action={toggleProduct}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="pid" value={p.id} />
                <input type="hidden" name="active" value={p.is_active ? "0" : "1"} />
                <button type="submit" style={btnGhost}>{p.is_active ? "Sembunyikan" : "Tampilkan"}</button>
              </form>
            </div>

            <details style={details}>
              <summary style={summary}>Edit atau hapus</summary>
              <form action={updateProduct}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="pid" value={p.id} />
                <label style={label}>Nama produk</label>
                <input style={input} name="name" defaultValue={p.name} required />
                <label style={label}>Harga (Rp)</label>
                <input style={input} name="price" inputMode="numeric" defaultValue={p.price === null ? "" : String(p.price)} />
                <label style={label}>Deskripsi</label>
                <textarea style={area} name="description" defaultValue={p.description || ""} />
                <ImageCompressField key={"edit-" + p.id + "-" + keySalt} name="image" label="Ganti foto (opsional)" maxSide={800} currentUrl={p.image_url} />
                <button type="submit" style={btnPrimary}>Simpan Perubahan</button>
              </form>
              <form action={deleteProduct}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="pid" value={p.id} />
                <label style={checkRow}>
                  <input type="checkbox" name="confirm" value="yes" />
                  Ya, hapus produk ini
                </label>
                <button type="submit" style={btnDanger}>Hapus Produk</button>
              </form>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
                                    }
