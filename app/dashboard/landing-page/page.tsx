// AKSI: BUAT FILE BARU
// PATH: app/dashboard/landing-page/page.tsx
import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import {
  cleanColor,
  cleanSubdomain,
  cleanWhatsapp,
  getAdminDb,
  getCurrentUserId,
  subdomainError,
  type LandingPage,
} from "@/lib/landing/helpers";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ err?: string; ok?: string }> };

const wrap: CSSProperties = { maxWidth: 560, margin: "0 auto", padding: 16 };
const h1: CSSProperties = { fontSize: 22, fontWeight: 700, margin: "0 0 8px 0" };
const desc: CSSProperties = { fontSize: 14, opacity: 0.8, margin: "0 0 14px 0" };
const label: CSSProperties = { display: "block", fontSize: 14, fontWeight: 600, margin: "14px 0 6px 0" };
const input: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(128,128,128,0.5)", background: "transparent", color: "inherit", fontSize: 16 };
const area: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(128,128,128,0.5)", background: "transparent", color: "inherit", fontSize: 16, minHeight: 110 };
const colorInput: CSSProperties = { width: 64, height: 40, padding: 0, border: "none", background: "transparent" };
const hint: CSSProperties = { fontSize: 12, opacity: 0.7, marginTop: 4 };
const errBox: CSSProperties = { padding: 10, borderRadius: 8, border: "1px solid #dc2626", color: "#dc2626", marginBottom: 12, fontSize: 14 };
const okBox: CSSProperties = { padding: 10, borderRadius: 8, border: "1px solid #16a34a", color: "#16a34a", marginBottom: 12, fontSize: 14 };
const infoBox: CSSProperties = { padding: 14, borderRadius: 12, border: "1px solid rgba(128,128,128,0.35)", marginBottom: 14 };
const btnPrimary: CSSProperties = { background: "#1d6fb8", color: "#ffffff", padding: "12px 18px", borderRadius: 8, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", marginTop: 20, width: "100%" };

export default async function MyLandingPage({ searchParams }: Props) {
  const uid = await getCurrentUserId();
  if (!uid) redirect("/login");

  const sp = await searchParams;
  const db = getAdminDb();
  const { data } = await db
    .from("landing_pages")
    .select("*")
    .eq("owner_id", uid)
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<LandingPage[]>();
  const existing = data && data.length > 0 ? data[0] : null;
  const canSubmit = !existing || existing.status === "rejected";

  async function submit(formData: FormData) {
    "use server";
    // TODO paket berbayar: cek entitlement fitur custom_subdomain di sini
    const userId = await getCurrentUserId();
    if (!userId) redirect("/login");
    const back = "/dashboard/landing-page?err=";

    const sdb = getAdminDb();
    const { data: cur } = await sdb
      .from("landing_pages")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .returns<LandingPage[]>();
    const current = cur && cur.length > 0 ? cur[0] : null;
    if (current && current.status !== "rejected") {
      redirect(back + encodeURIComponent("Kamu sudah punya permintaan landing page"));
    }

    const subdomain = cleanSubdomain(String(formData.get("subdomain") || ""));
    const subErr = subdomainError(subdomain);
    if (subErr) redirect(back + encodeURIComponent(subErr));

    const title = String(formData.get("title") || "").trim().slice(0, 80);
    if (!title) redirect(back + encodeURIComponent("Judul wajib diisi"));

    const tagline = String(formData.get("tagline") || "").trim().slice(0, 160);
    const about = String(formData.get("about") || "").trim().slice(0, 2000);

    const payload = {
      subdomain: subdomain,
      title: title,
      tagline: tagline || null,
      about: about || null,
      whatsapp: cleanWhatsapp(String(formData.get("whatsapp") || "")) || null,
      theme_color: cleanColor(String(formData.get("theme_color") || "")),
      status: "pending",
      owner_id: userId,
      updated_at: new Date().toISOString(),
    };

    const result = current
      ? await sdb.from("landing_pages").update(payload).eq("id", current.id)
      : await sdb.from("landing_pages").insert({ ...payload, created_by: userId });

    if (result.error) {
      const msg = result.error.code === "23505" ? "Subdomain sudah dipakai, coba nama lain" : "Gagal mengirim permintaan";
      redirect(back + encodeURIComponent(msg));
    }
    redirect("/dashboard/landing-page?ok=1");
  }

  const vSub = existing ? existing.subdomain : "";
  const vTitle = existing ? existing.title : "";
  const vTag = existing && existing.tagline ? existing.tagline : "";
  const vAbout = existing && existing.about ? existing.about : "";
  const vWa = existing && existing.whatsapp ? existing.whatsapp : "";
  const vColor = existing ? existing.theme_color : "#1d6fb8";

  return (
    <div style={wrap}>
      <h1 style={h1}>Landing Page Custom</h1>
      <p style={desc}>Ajukan halaman khusus dengan alamat sendiri, misalnya namatoko.sudros.id. Admin akan meninjau permintaanmu.</p>

      {sp.ok ? <div style={okBox}>Permintaan terkirim. Admin akan meninjau segera.</div> : null}
      {sp.err ? <div style={errBox}>{sp.err}</div> : null}

      {existing ? (
        <div style={infoBox}>
          <div><strong>{existing.title}</strong></div>
          <div>Alamat: {existing.subdomain}.sudros.id</div>
          <div>Status: {existing.status}</div>
          {existing.admin_note ? <div>Catatan admin: {existing.admin_note}</div> : null}
          {existing.status === "approved" ? (
            <div><a href={"https://" + existing.subdomain + ".sudros.id"}>Buka landing page</a></div>
          ) : null}
        </div>
      ) : null}

      {canSubmit ? (
        <form action={submit}>
          <label style={label} htmlFor="subdomain">Subdomain</label>
          <input style={input} id="subdomain" name="subdomain" defaultValue={vSub} placeholder="namatoko" autoCapitalize="none" required />
          <div style={hint}>Huruf kecil, angka, strip; 3-30 karakter</div>

          <label style={label} htmlFor="title">Judul</label>
          <input style={input} id="title" name="title" defaultValue={vTitle} required />

          <label style={label} htmlFor="tagline">Tagline</label>
          <input style={input} id="tagline" name="tagline" defaultValue={vTag} />

          <label style={label} htmlFor="about">Tentang</label>
          <textarea style={area} id="about" name="about" defaultValue={vAbout} />

          <label style={label} htmlFor="whatsapp">WhatsApp</label>
          <input style={input} id="whatsapp" name="whatsapp" defaultValue={vWa} placeholder="08123456789" inputMode="tel" />

          <label style={label} htmlFor="theme_color">Warna tema</label>
          <input style={colorInput} id="theme_color" name="theme_color" type="color" defaultValue={vColor} />

          <button type="submit" style={btnPrimary}>Kirim Permintaan</button>
        </form>
      ) : null}
    </div>
  );
                               }
