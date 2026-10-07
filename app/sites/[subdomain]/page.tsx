// AKSI: BUAT FILE BARU
// PATH: app/sites/[subdomain]/page.tsx
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminDb, type LandingPage } from "@/lib/landing/helpers";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };

async function loadPage(subdomain: string): Promise<LandingPage | null> {
  const db = getAdminDb();
  const { data } = await db
    .from("landing_pages")
    .select("*")
    .eq("subdomain", subdomain)
    .eq("status", "approved")
    .maybeSingle<LandingPage>();
  return data ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params;
  const page = await loadPage(subdomain);
  if (!page) return { title: "Tidak ditemukan" };
  return { title: page.title, description: page.tagline || undefined };
}

const pageWrap: CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  color: "#0f172a",
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
};
const heroInner: CSSProperties = { maxWidth: 720, margin: "0 auto" };
const heroTitle: CSSProperties = { fontSize: 32, fontWeight: 800, margin: "0 0 10px 0", lineHeight: 1.2 };
const heroTag: CSSProperties = { fontSize: 17, margin: "0 0 22px 0", opacity: 0.92 };
const btnWhite: CSSProperties = {
  display: "inline-block",
  background: "#ffffff",
  color: "#0f172a",
  padding: "12px 22px",
  borderRadius: 999,
  fontWeight: 700,
  textDecoration: "none",
};
const section: CSSProperties = { maxWidth: 720, margin: "0 auto", padding: "28px 20px" };
const sectionTitle: CSSProperties = { fontSize: 20, fontWeight: 700, margin: "0 0 12px 0" };
const aboutText: CSSProperties = { fontSize: 16, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 };
const sellerLink: CSSProperties = { fontWeight: 600 };
const footer: CSSProperties = { textAlign: "center", padding: "24px 20px", fontSize: 13, color: "#64748b" };

export default async function SitePage({ params }: Props) {
  const { subdomain } = await params;
  const page = await loadPage(subdomain);
  if (!page) notFound();

  const heroStyle: CSSProperties = {
    background: page.theme_color,
    color: "#ffffff",
    padding: "56px 20px",
  };
  const waHref = page.whatsapp ? "https://wa.me/" + page.whatsapp : "";

  return (
    <div style={pageWrap}>
      <div style={heroStyle}>
        <div style={heroInner}>
          <h1 style={heroTitle}>{page.title}</h1>
          {page.tagline ? <p style={heroTag}>{page.tagline}</p> : null}
          {waHref ? (
            <a href={waHref} style={btnWhite} target="_blank" rel="noreferrer">
              Hubungi via WhatsApp
            </a>
          ) : null}
        </div>
      </div>

      {page.about ? (
        <div style={section}>
          <h2 style={sectionTitle}>Tentang Kami</h2>
          <p style={aboutText}>{page.about}</p>
        </div>
      ) : null}

      {page.show_seller_link && page.owner_id ? (
        <div style={section}>
          <a href={"https://sudros.id/sellers/" + page.owner_id} style={sellerLink}>
            Lihat semua listing kami di SUDROS
          </a>
        </div>
      ) : null}

      <div style={footer}>Dibuat dengan SUDROS - Temukan. Tawarkan. Terhubung.</div>
    </div>
  );
                                  }
