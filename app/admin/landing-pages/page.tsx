// AKSI: GANTI SELURUH ISI FILE
// PATH: app/admin/landing-pages/page.tsx
import type { CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getAdminDb,
  getAdminUserId,
  STATUS_LIST,
  type LandingPage,
} from "@/lib/landing/helpers";

export const dynamic = "force-dynamic";

const wrap: CSSProperties = { maxWidth: 760, margin: "0 auto", padding: 16 };
const topRow: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 };
const h1: CSSProperties = { fontSize: 22, fontWeight: 700, margin: 0 };
const card: CSSProperties = { border: "1px solid rgba(128,128,128,0.35)", borderRadius: 12, padding: 14, marginBottom: 12 };
const cardTitle: CSSProperties = { fontWeight: 700, fontSize: 16 };
const meta: CSSProperties = { fontSize: 13, opacity: 0.75, marginTop: 4 };
const btnRow: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 };
const btnPrimary: CSSProperties = { background: "#1d6fb8", color: "#ffffff", padding: "9px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", border: "none", cursor: "pointer" };
const btnGhost: CSSProperties = { background: "transparent", color: "inherit", padding: "8px 13px", borderRadius: 8, fontSize: 14, border: "1px solid rgba(128,128,128,0.5)", textDecoration: "none", cursor: "pointer" };

export default async function AdminLandingPages() {
  const adminId = await getAdminUserId();
  if (!adminId) redirect("/dashboard");

  const db = getAdminDb();
  const { data } = await db
    .from("landing_pages")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<LandingPage[]>();
  const rows = data ?? [];

  async function setStatus(formData: FormData) {
    "use server";
    const uid = await getAdminUserId();
    if (!uid) return;
    const id = String(formData.get("id") || "");
    const status = String(formData.get("status") || "");
    if (!id || !STATUS_LIST.includes(status)) return;
    const adb = getAdminDb();
    await adb
      .from("landing_pages")
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq("id", id);
    revalidatePath("/admin/landing-pages");
  }

  return (
    <div style={wrap}>
      <div style={topRow}>
        <h1 style={h1}>Landing Page Custom</h1>
        <Link href="/admin/landing-pages/edit" style={btnPrimary}>
          Buat Baru
        </Link>
      </div>

      {rows.length === 0 ? <p>Belum ada landing page.</p> : null}

      {rows.map((r) => (
        <div key={r.id} style={card}>
          <div style={cardTitle}>{r.title}</div>
          <div style={meta}>{r.subdomain}.sudros.id</div>
          <div style={meta}>
            Status: {r.status} | {r.owner_id ? "Ada pemilik" : "Belum ada pemilik"}
          </div>
          {r.admin_note ? <div style={meta}>Catatan: {r.admin_note}</div> : null}

          <div style={btnRow}>
            {r.status !== "approved" ? (
              <form action={setStatus}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value="approved" />
                <button type="submit" style={btnPrimary}>Setujui</button>
              </form>
            ) : (
              <form action={setStatus}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value="disabled" />
                <button type="submit" style={btnGhost}>Nonaktifkan</button>
              </form>
            )}
            {r.status === "pending" ? (
              <form action={setStatus}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value="rejected" />
                <button type="submit" style={btnGhost}>Tolak</button>
              </form>
            ) : null}
            <Link href={"/admin/landing-pages/edit?id=" + r.id} style={btnGhost}>Edit</Link>
            <Link href={"/admin/landing-pages/media?id=" + r.id} style={btnGhost}>Logo dan Produk</Link>
            <a href={"/sites/" + r.subdomain} target="_blank" rel="noreferrer" style={btnGhost}>Pratinjau</a>
          </div>
        </div>
      ))}
    </div>
  );
            }
