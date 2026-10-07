// AKSI: GANTI SELURUH ISI FILE
// PATH: app/sites/[subdomain]/page.tsx
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAdminDb, type LandingPage } from "@/lib/landing/helpers";
import { formatRupiah, type LandingProduct } from "@/lib/landing/media";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ subdomain: string }> };
type PageWithLogo = LandingPage & { logo_url: string | null };

async function loadPage(subdomain: string): Promise<PageWithLogo | null> {
  const db = getAdminDb();
  const { data } = await db
    .from("landing_pages")
    .select("*")
    .eq("subdomain", subdomain)
    .eq("status", "approved")
    .maybeSingle<PageWithLogo>();
  return data ?? null;
}

async function loadProducts(pageId: string): Promise<LandingProduct[]> {
  const db = getAdminDb();
  const { data } = await db
    .from("landing_products")
    .select("*")
    .eq("landing_page_id", pageId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<LandingProduct[]>();
  return data ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params;
  const page = await loadPage(subdomain);
  if (!page) return { title: "Tidak ditemukan" };
  return {
    title: page.title,
    description: page.tagline || undefined,
    openGraph: page.logo_url
      ? { title: page.title, description: page.tagline || undefined, images: [page.logo_url] }
      : undefined,
  };
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
  const b = Math.min(255, Math.max(0, (n & 255) + amt));
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

const PAGE_BG = "#f1f5f9";

const animCss =
  "@keyframes lpFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}" +
  "@keyframes lpPulse{0%,100%{box-shadow:0 6px 20px rgba(37,211,102,0.45)}50%{box-shadow:0 6px 30px rgba(37,211,102,0.8)}}" +
  "@media (prefers-reduced-motion:reduce){*{animation:none !important}}";

const pageWrap: CSSProperties = {
  minHeight: "100vh",
  background: PAGE_BG,
  color: "#0f172a",
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  paddingBottom: 90,
  overflowX: "hidden",
};
const circleA: CSSProperties = { position: "absolute", top: -90, right: -70, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.12)" };
const circleB: CSSProperties = { position: "absolute", bottom: -50, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.08)" };
const heroInner: CSSProperties = { position: "relative", maxWidth: 720, margin: "0 auto", animation: "lpFadeUp 0.7s ease both" };
const heroTitle: CSSProperties = { fontSize: 36, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.5, margin: "0 0 12px 0" };
const heroTag: CSSProperties = { fontSize: 18, lineHeight: 1.5, opacity: 0.92, margin: "0 0 28px 0", maxWidth: 520 };
const ctaRow: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12 };
const waveSvg: CSSProperties = { position: "absolute", bottom: -1, left: 0, width: "100%", height: 48, display: "block" };
const body: CSSProperties = { position: "relative", zIndex: 1, maxWidth: 720, margin: "-28px auto 0 auto", padding: "0 16px" };
const card: CSSProperties = { background: "#ffffff", borderRadius: 20, padding: 24, boxShadow: "0 8px 30px rgba(15,23,42,0.08)", marginBottom: 16 };
const cardHead: CSSProperties = { display: "flex", alignItems: "center", gap: 10, margin: "0 0 14px 0" };
const cardTitle: CSSProperties = { fontSize: 20, fontWeight: 700, margin: 0 };
const aboutText: CSSProperties = { fontSize: 16, lineHeight: 1.75, color: "#334155", margin: "0 0 12px 0" };
const sellerRow: CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 };
const sellerText: CSSProperties = { fontSize: 16, fontWeight: 600, margin: 0, flex: "1 1 200px" };
const contactTitle: CSSProperties = { fontSize: 22, fontWeight: 800, margin: "0 0 8px 0" };
const contactDesc: CSSProperties = { fontSize: 15, opacity: 0.9, margin: "0 0 18px 0" };
const footer: CSSProperties = { textAlign: "center", padding: "20px 16px 28px 16px", fontSize: 13, color: "#64748b" };
const floatBtn: CSSProperties = { position: "fixed", right: 16, bottom: 16, zIndex: 50, display: "flex", alignItems: "center", gap: 8, background: "#25d366", color: "#ffffff", padding: "12px 18px", borderRadius: 999, fontWeight: 700, fontSize: 15, textDecoration: "none", animation: "lpPulse 2.4s ease-in-out infinite" };

const brandRow: CSSProperties = { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 20 };
const logoBox: CSSProperties = { width: 84, height: 84, borderRadius: 22, background: "#ffffff", padding: 6, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 6px 18px rgba(0,0,0,0.2)" };
const logoImg: CSSProperties = { width: "100%", height: "100%", objectFit: "contain", display: "block" };
const sudrosBox: CSSProperties = { width: 128, height: 84, borderRadius: 22, background: "#ffffff", padding: 8, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 6px 18px rgba(0,0,0,0.2)", textDecoration: "none" };
const sudrosImg: CSSProperties = { width: "100%", height: "100%", objectFit: "contain", display: "block" };

const grid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 };
const prodCard: CSSProperties = { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" };
const prodImg: CSSProperties = { width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block", background: "#e2e8f0" };
const prodNoImg: CSSProperties = { width: "100%", aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center", background: "#e2e8f0", color: "#64748b", fontSize: 32, fontWeight: 800 };
const prodBody: CSSProperties = { padding: 12, display: "flex", flexDirection: "column", gap: 6, flex: 1 };
const prodName: CSSProperties = { fontSize: 15, fontWeight: 700, lineHeight: 1.3, margin: 0 };
const prodDesc: CSSProperties = { fontSize: 13, color: "#64748b", lineHeight: 1.4, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" };

export default async function SitePage({ params }: Props) {
  const { subdomain } = await params;
  const page = await loadPage(subdomain);
  if (!page) notFound();
  const products = await loadProducts(page.id);

  const color = page.theme_color;
  const light = isLight(color);
  const fg = light ? "#0f172a" : "#ffffff";
  const priceColor = light ? "#0f172a" : color;
  const waHref = page.whatsapp ? "https://wa.me/" + page.whatsapp : "";
  const sellerHref =
    page.show_seller_link && page.owner_id ? "https://sudros.id/sellers/" + page.owner_id : "";
  const initial = page.title.trim().charAt(0).toUpperCase() || "S";
  const paragraphs = page.about ? page.about.split(/\n+/).filter((p) => p.trim().length > 0) : [];

  const gradient =
    "linear-gradient(135deg, " + shade(color, -55) + " 0%, " + color + " 55%, " + shade(color, 45) + " 100%)";

  const heroOuter: CSSProperties = { position: "relative", overflow: "hidden", padding: "64px 20px 96px 20px", background: gradient, color: fg };
  const badge: CSSProperties = {
    width: 64, height: 64, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 30, fontWeight: 800,
    background: light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)",
    border: light ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(255,255,255,0.3)",
  };
  const divider: CSSProperties = { width: 2, height: 40, borderRadius: 2, background: fg, opacity: 0.35 };
  const primaryBtn: CSSProperties = {
    display: "inline-block", background: light ? "#0f172a" : "#ffffff", color: light ? "#ffffff" : shade(color, -40),
    padding: "14px 26px", borderRadius: 999, fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
  };
  const ghostBtn: CSSProperties = { display: "inline-block", background: "transparent", color: fg, padding: "12px 24px", borderRadius: 999, fontWeight: 700, fontSize: 16, textDecoration: "none", border: "2px solid " + fg };
  const accentBar: CSSProperties = { width: 5, height: 22, borderRadius: 4, background: color };
  const sellerBtn: CSSProperties = { display: "inline-block", background: color, color: fg, padding: "11px 20px", borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: "none" };
  const contactCard: CSSProperties = { borderRadius: 20, padding: 28, marginBottom: 16, textAlign: "center", background: gradient, color: fg, boxShadow: "0 8px 30px rgba(15,23,42,0.15)" };
  const footerLink: CSSProperties = { color: shade(color, -30), fontWeight: 700, textDecoration: "none" };
  const prodPrice: CSSProperties = { fontSize: 15, fontWeight: 800, color: priceColor, margin: 0 };
  const orderBtn: CSSProperties = { marginTop: "auto", display: "block", textAlign: "center", background: color, color: fg, padding: "9px 10px", borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: "none" };

  return (
    <div style={pageWrap}>
      <style>{animCss}</style>

      <div style={heroOuter}>
        <div style={circleA} />
        <div style={circleB} />
        <div style={heroInner}>
          <div style={brandRow}>
            {page.logo_url ? (
              <div style={logoBox}>
                <img src={page.logo_url} alt={page.title} style={logoImg} />
              </div>
            ) : (
              <div style={badge}>{initial}</div>
            )}
            <div style={divider} />
            <a href="https://sudros.id" style={sudrosBox} aria-label="SUDROS">
              <Image
                src="/brand/sudros-logo.png"
                alt="Logo SUDROS"
                width={112}
                height={70}
                priority
                style={sudrosImg}
              />
            </a>
          </div>
          <h1 style={heroTitle}>{page.title}</h1>
          {page.tagline ? <p style={heroTag}>{page.tagline}</p> : null}
          <div style={ctaRow}>
            {waHref ? (
              <a href={waHref} style={primaryBtn} target="_blank" rel="noreferrer">
                Hubungi via WhatsApp
              </a>
            ) : null}
            {sellerHref ? (
              <a href={sellerHref} style={ghostBtn}>
                Lihat Listing
              </a>
            ) : null}
          </div>
        </div>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={waveSvg}>
          <path d="M0,30 C240,70 480,0 720,25 C960,50 1200,70 1440,20 L1440,60 L0,60 Z" fill={PAGE_BG} />
        </svg>
      </div>

      <div style={body}>
        {products.length > 0 ? (
          <div style={card}>
            <div style={cardHead}>
              <div style={accentBar} />
              <h2 style={cardTitle}>Etalase Produk</h2>
            </div>
            <div style={grid}>
              {products.map((p) => {
                const orderHref = waHref
                  ? waHref + "?text=" + encodeURIComponent("Halo, saya tertarik dengan " + p.name + " (" + page.title + ")")
                  : "";
                return (
                  <div key={p.id} style={prodCard}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} style={prodImg} loading="lazy" />
                    ) : (
                      <div style={prodNoImg}>{p.name.trim().charAt(0).toUpperCase()}</div>
                    )}
                    <div style={prodBody}>
                      <p style={prodName}>{p.name}</p>
                      <p style={prodPrice}>{formatRupiah(p.price)}</p>
                      {p.description ? <p style={prodDesc}>{p.description}</p> : null}
                      {orderHref ? (
                        <a href={orderHref} style={orderBtn} target="_blank" rel="noreferrer">
                          Pesan via WhatsApp
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {paragraphs.length > 0 ? (
          <div style={card}>
            <div style={cardHead}>
              <div style={accentBar} />
              <h2 style={cardTitle}>Tentang Kami</h2>
            </div>
            {paragraphs.map((p, i) => (
              <p key={i} style={aboutText}>
                {p}
              </p>
            ))}
          </div>
        ) : null}

        {sellerHref ? (
          <div style={card}>
            <div style={sellerRow}>
              <p style={sellerText}>Lihat semua produk dan penawaran kami di SUDROS</p>
              <a href={sellerHref} style={sellerBtn}>
                Kunjungi Toko
              </a>
            </div>
          </div>
        ) : null}

        {waHref ? (
          <div style={contactCard}>
            <h2 style={contactTitle}>Tertarik? Ayo ngobrol</h2>
            <p style={contactDesc}>Hubungi kami langsung lewat WhatsApp, kami siap membantu.</p>
            <a href={waHref} style={primaryBtn} target="_blank" rel="noreferrer">
              Chat Sekarang
            </a>
          </div>
        ) : null}

        <div style={footer}>
          Dibuat dengan{" "}
          <a href="https://sudros.id" style={footerLink}>
            SUDROS
          </a>{" "}
          - Temukan. Tawarkan. Terhubung.
        </div>
      </div>

      {waHref ? (
        <a href={waHref} style={floatBtn} target="_blank" rel="noreferrer">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 2C6.48 2 2 6.04 2 11c0 2.1.8 4.03 2.14 5.57L3 22l5.7-1.9c1.04.3 2.15.46 3.3.46 5.52 0 10-4.04 10-9S17.52 2 12 2z" />
          </svg>
          Chat
        </a>
      ) : null}
    </div>
  );
  }
