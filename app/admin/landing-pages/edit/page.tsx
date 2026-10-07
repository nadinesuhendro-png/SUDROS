// AKSI: BUAT FILE BARU
// PATH: app/admin/landing-pages/edit/page.tsx
import type { CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  cleanColor,
  cleanSubdomain,
  cleanWhatsapp,
  getAdminDb,
  getAdminUserId,
  STATUS_LIST,
  subdomainError,
  type LandingPage,
} from "@/lib/landing/helpers";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ id?: string; err?: string }> };

const wrap: CSSProperties = { maxWidth: 560, margin: "0 auto", padding: 16 };
const h1: CSSProperties = { fontSize: 22, fontWeight: 700, margin: "0 0 14px 0" };
const label: CSSProperties = { display: "block", fontSize: 14, fontWeight: 600, margin: "14px 0 6px 0" };
const input: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(128,128,128,0.5)", background: "transparent", color: "inherit", fontSize: 16 };
const area: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(128,128,128,0.5)", background: "transparent", color: "inherit", fontSize: 16, minHeight: 110 };
const colorInput: CSSProperties = { width: 64, height: 40, padding: 0, border: "none", background: "transparent" };
const hint: CSSProperties = { fontSize: 12, opacity: 0.7, marginTop: 4 };
const errBox: CSSProperties = { padding: 10, borderRadius: 8, border: "1px solid #dc2626", color: "#dc2626", marginBottom: 12, fontSize: 14 };
const btnPrimary: CSSProperties = { background: "#1d6fb8", color: "#ffffff", padding: "12px 18px", borderRadius: 8, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", marginTop: 20, width: "100%" };
const btnDanger: CSSProperties = { background: "#dc2626", color: "#ffffff", padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", marginTop: 10 };
const backLink: CSSProperties = { display: "inline-block", marginBottom: 12, fontSize: 14 };
const dangerBox: CSSProperties = { marginTop: 36, paddingTop: 16, borderTop: "1px solid rgba(128,128,128,0.35)" };
const checkRow: CSSProperties = { display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 14 };

export default async function EditLandingPage({ searchParams }: Props) {
  const adminId = await getAdminUserId();
  if (!adminId) redirect("/dashboard");

  const sp = await searchParams;
  const id = sp.id || "";
  const adb = getAdminDb();

  let row: LandingPage | null = null;
  let ownerEmail = "";
  if (id) {
    const { data } = await adb
      .from("landing_pages")
      .select("*")
      .eq("id", id)
      .maybeSingle<LandingPage>();
    row = data ?? null;
    if (row && row.owner_id) {
      const { data: u } = await adb.auth.admin.getUserById(row.owner_id);
      ownerEmail = u && u.user && u.user.email ? u.user.email : "";
    }
  }

  async function save(formData: FormData) {
    "use server";
    const uid = await getAdminUserId();
    if (!uid) redirect("/dashboard");

    const saveId = String(formData.get("id") || "");
    const back = saveId
      ? "/admin/landing-pages/edit?id=" + saveId + "&err="
      : "/admin/landing-pages/edit?err=";

    const subdomain = cleanSubdomain(String(formData.get("subdomain") || ""));
    const subErr = subdomainError(subdomain);
    if (subErr) redirect(back + encodeURIComponent(subErr));

    const title = String(formData.get("title") || "").trim().slice(0, 80);
    if (!title) redirect(back + encodeURIComponent("Judul wajib diisi"));

    const status = String(formData.get("status") || "approved");
    if (!STATUS_LIST.includes(status)) redirect(back + encodeURIComponent("Status tidak valid"));

    const ownerEmailIn = String(formData.get("owner_email") || "").trim().toLowerCase();
    const sdb = getAdminDb();
    let ownerId: string | null = null;
    if (ownerEmailIn) {
      const { data: list } = await sdb.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = list.users.find((u) => (u.email || "").toLowerCase() === ownerEmailIn);
      if (!found) {
        redirect(back + encodeURIComponent("Email belum terdaftar. Kosongkan jika pemilik belum daftar."));
      }
      ownerId = found.id;
    }

    const tagline = String(formData.get("tagline") || "").trim().slice(0, 160);
    const about = String(formData.get("about") || "").trim().slice(0, 2000);
    const contactName = String(formData.get("contact_name") || "").trim().slice(0, 80);
    const adminNote = String(formData.get("admin_note") || "").trim().slice(0, 300);

    const payload = {
      subdomain: subdomain,
      title: title,
      tagline: tagline || null,
      about: about || null,
      whatsapp: cleanWhatsapp(String(formData.get("whatsapp") || "")) || null,
      contact_name: contactName || null,
      theme_color: cleanColor(String(formData.get("theme_color") || "")),
      show_seller_link: formData.get("show_seller_link") === "on",
      status: status,
      admin_note: adminNote || null,
      owner_id: ownerId,
      updated_at: new Date().toISOString(),
    };

    const result = saveId
      ? await sdb.from("landing_pages").update(payload).eq("id", saveId)
      : await sdb.from("landing_pages").insert({ ...payload, created_by: uid });

    if (result.error) {
      const msg = result.error.code === "23505" ? "Subdomain sudah dipakai" : "Gagal menyimpan: " + result.error.message;
      redirect(back + encodeURIComponent(msg));
    }
    redirect("/admin/landing-pages");
  }

  async function remove(formData: FormData) {
    "use server";
    const uid = await getAdminUserId();
    if (!uid) redirect("/dashboard");
    const delId = String(formData.get("id") || "");
    if (!delId || formData.get("confirm") !== "yes") redirect("/admin/landing-pages");
    await getAdminDb().from("landing_pages").delete().eq("id", delId);
    redirect("/admin/landing-pages");
  }

  const vSub = row ? row.subdomain : "";
  const vTitle = row ? row.title : "";
  const vTag = row && row.tagline ? row.tagline : "";
  const vAbout = row && row.about ? row.about : "";
  const vWa = row && row.whatsapp ? row.whatsapp : "";
  const vContact = row && row.contact_name ? row.contact_name : "";
  const vColor = row ? row.theme_color : "#1d6fb8";
  const vStatus = row ? row.status : "approved";
  const vNote = row && row.admin_note ? row.admin_note : "";
  const vShow = row ? row.show_seller_link : true;

  return (
    <div style={wrap}>
      <Link href="/admin/landing-pages" style={backLink}>Kembali</Link>
      <h1 style={h1}>{id ? "Edit Landing Page" : "Buat Landing Page"}</h1>

      {sp.err ? <div style={errBox}>{sp.err}</div> : null}

      <form action={save}>
        <input type="hidden" name="id" value={id} />

        <label style={label} htmlFor="subdomain">Subdomain</label>
        <input style={input} id="subdomain" name="subdomain" defaultValue={vSub} placeholder="namatoko" autoCapitalize="none" required />
        <div style={hint}>Hasil: namatoko.sudros.id (huruf kecil, angka, strip; 3-30 karakter)</div>

        <label style={label} htmlFor="title">Judul</label>
        <input style={input} id="title" name="title" defaultValue={vTitle} required />

        <label style={label} htmlFor="tagline">Tagline</label>
        <input style={input} id="tagline" name="tagline" defaultValue={vTag} />

        <label style={label} htmlFor="about">Tentang</label>
        <textarea style={area} id="about" name="about" defaultValue={vAbout} />

        <label style={label} htmlFor="whatsapp">WhatsApp</label>
        <input style={input} id="whatsapp" name="whatsapp" defaultValue={vWa} placeholder="08123456789" inputMode="tel" />

        <label style={label} htmlFor="contact_name">Nama kontak (internal)</label>
        <input style={input} id="contact_name" name="contact_name" defaultValue={vContact} />

        <label style={label} htmlFor="owner_email">Email pemilik (opsional)</label>
        <input style={input} id="owner_email" name="owner_email" defaultValue={ownerEmail} type="email" autoCapitalize="none" />
        <div style={hint}>Kosongkan jika pemilik belum daftar. Bisa diisi nanti lewat Edit.</div>

        <label style={label} htmlFor="theme_color">Warna tema</label>
        <input style={colorInput} id="theme_color" name="theme_color" type="color" defaultValue={vColor} />

        <label style={checkRow}>
          <input type="checkbox" name="show_seller_link" defaultChecked={vShow} />
          Tampilkan tautan ke toko di SUDROS
        </label>

        <label style={label} htmlFor="status">Status</label>
        <select style={input} id="status" name="status" defaultValue={vStatus}>
          <option value="approved">approved</option>
          <option value="pending">pending</option>
          <option value="rejected">rejected</option>
          <option value="disabled">disabled</option>
        </select>

        <label style={label} htmlFor="admin_note">Catatan admin</label>
        <input style={input} id="admin_note" name="admin_note" defaultValue={vNote} />

        <button type="submit" style={btnPrimary}>Simpan</button>
      </form>

      {id ? (
        <div style={dangerBox}>
          <form action={remove}>
            <input type="hidden" name="id" value={id} />
            <label style={checkRow}>
              <input type="checkbox" name="confirm" value="yes" required />
              Ya, hapus landing page ini permanen
            </label>
            <button type="submit" style={btnDanger}>Hapus</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
