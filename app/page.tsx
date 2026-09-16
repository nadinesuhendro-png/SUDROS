import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { after } from "next/server";
import { Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

import { SiteFooter } from "@/components/site-footer";
import {
  ListingCard,
  type ListingCardData,
} from "@/components/listing-card";

import { TrackLink } from "@/components/analytics/track-link";
import { TrackedSearchForm } from "@/components/analytics/tracked-search-form";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { logPageView } from "@/lib/analytics/log-page-view";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const SITE_URL = "https://www.sudros.id";
const SITE_NAME = "SUDROS";
const SITE_TAGLINE = "Temukan. Tawarkan. Terhubung.";

/* =========================================================
   SEO METADATA
========================================================= */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "SUDROS adalah platform listing lokal Indonesia untuk menemukan usaha, produk, jasa, tempat, dan kebutuhan lokal. Gratis untuk UMKM. Daftar dan promosikan usaha Anda sekarang.",
  keywords: [
    "SUDROS",
    "listing lokal Indonesia",
    "promosi UMKM",
    "usaha lokal",
    "produk lokal",
    "jasa lokal",
    "direktori UMKM",
    "platform UMKM Indonesia",
    "temukan usaha sekitar",
    "iklan usaha gratis",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  category: "business",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "Temukan usaha, produk, jasa, tempat, dan kebutuhan lokal di sekitar Anda. Atau promosikan usaha Anda agar lebih mudah ditemukan.",
    images: [
      {
        url: "/brand/sudros-og.jpg",
        width: 1200,
        height: 630,
        alt: "SUDROS — Platform Listing Lokal Indonesia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "Platform listing lokal Indonesia untuk menemukan dan menawarkan usaha, produk, jasa, dan kebutuhan lokal.",
    images: ["/brand/sudros-og.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/brand/apple-touch-icon.png",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

/* =========================================================
   DESIGN TOKENS
========================================================= */

const deepBlue = "#08264A";
const royalBlue = "#1268B3";
const brightBlue = "#168ED0";
const cyanBlue = "#2AA9E0";
const paleBlue = "#EAF5FC";
const backgroundBlue = "#F5FAFE";
const borderBlue = "#D9E8F4";

type Category = {
  id: string;
  name: string;
};

/* =========================================================
   STATIC DATA
========================================================= */

const quickCategories = [
  "Kuliner",
  "Toko",
  "Jasa",
  "Otomotif",
  "Properti",
  "Produk Lokal",
];

const offerGrid = [
  {
    icon: "store",
    title: "Usaha & Toko",
    body: "Toko, warung, bisnis lokal, dan berbagai jenis usaha.",
  },
  {
    icon: "food",
    title: "Kuliner",
    body: "Warung makan, restoran, catering, makanan rumahan, kue, dan minuman.",
  },
  {
    icon: "tools",
    title: "Jasa",
    body: "Bengkel, laundry, pangkas rambut, servis, renovasi, percetakan.",
  },
  {
    icon: "bag",
    title: "Produk",
    body: "Produk UMKM, produk rumahan, kerajinan, dan produk lokal lainnya.",
  },
  {
    icon: "leaf",
    title: "Produk Lokal",
    body: "Hasil pertanian, perikanan, peternakan, dan hasil laut daerah.",
  },
  {
    icon: "car",
    title: "Otomotif",
    body: "Kendaraan, bengkel, sparepart, aksesori, dan layanan otomotif.",
  },
  {
    icon: "home",
    title: "Properti",
    body: "Rumah, tanah, kos, kontrakan, ruko, dan properti lainnya.",
  },
  {
    icon: "briefcase",
    title: "Profesional",
    body: "Jasa profesional, freelancer, konsultan, desain, dan fotografi.",
  },
  {
    icon: "pin",
    title: "Tempat & Aktivitas",
    body: "Tempat wisata, penginapan, tempat olahraga, dan event lokal.",
  },
];

const trustStats = [
  { value: "100%", label: "Gratis untuk memulai" },
  { value: "< 3 mnt", label: "Buat listing pertama" },
  { value: "34", label: "Provinsi di Indonesia" },
  { value: "24/7", label: "Listing tampil online" },
];

const testimonials = [
  {
    name: "Ibu Sari",
    role: "Pemilik Warung Sari Rasa",
    body: "Sejak listing di SUDROS, warung saya mulai ditemukan pelanggan baru dari luar komplek. Prosesnya gampang banget.",
    initials: "SR",
  },
  {
    name: "Bang Rian",
    role: "Owner Bengkel Rian Motor",
    body: "Awalnya cuma iseng daftar. Sekarang lumayan banyak yang datang setelah lihat listing di SUDROS.",
    initials: "RM",
  },
  {
    name: "Kak Dinda",
    role: "Crafter Dinda Handmade",
    body: "Produk handmade saya jadi lebih mudah ditemukan. Dashboard-nya simpel dan enak dipakai.",
    initials: "DH",
  },
];

const searcherSteps = [
  {
    number: "01",
    title: "Cari",
    body: "Masukkan apa yang sedang kamu butuhkan di kolom pencarian.",
  },
  {
    number: "02",
    title: "Temukan",
    body: "Lihat listing, foto, lokasi, dan informasi lengkapnya.",
  },
  {
    number: "03",
    title: "Terhubung",
    body: "Hubungi pemilik usaha atau penyedia layanan langsung.",
  },
];

const ownerSteps = [
  {
    number: "01",
    title: "Daftar",
    body: "Buat akun SUDROS gratis dalam waktu kurang dari 1 menit.",
  },
  {
    number: "02",
    title: "Tawarkan",
    body: "Buat listing usaha, produk, jasa, tempat, atau layanan.",
  },
  {
    number: "03",
    title: "Ditemukan",
    body: "Bantu calon pelanggan menemukan apa yang kamu tawarkan.",
  },
];

const faqs = [
  {
    q: "Apa itu SUDROS?",
    a: "SUDROS adalah platform listing lokal Indonesia untuk menemukan dan mempromosikan usaha, produk, jasa, tempat, dan kebutuhan lokal lainnya. Dirancang untuk mempermudah UMKM dan pelaku usaha lokal tampil secara digital.",
  },
  {
    q: "Apa saja yang bisa dipromosikan di SUDROS?",
    a: "Mulai dari usaha dan toko, kuliner, jasa, produk lokal, properti, otomotif, hingga layanan profesional. Selama legal dan relevan, Anda bisa menambahkannya sebagai listing.",
  },
  {
    q: "Apakah UMKM bisa mendaftarkan usaha secara gratis?",
    a: "Ya, bisa. UMKM merupakan bagian penting dari ekosistem SUDROS. Anda dapat membuat akun dan listing tanpa biaya untuk memulai.",
  },
  {
    q: "Bagaimana cara membuat listing di SUDROS?",
    a: "Daftar akun SUDROS terlebih dahulu, kemudian buat listing dari dashboard dengan menambahkan foto, judul, deskripsi, harga (opsional), dan lokasi usaha Anda.",
  },
  {
    q: "Bagaimana cara menghubungi pemilik usaha?",
    a: "Listing dapat menampilkan informasi kontak langsung, termasuk WhatsApp apabila pemilik memilih untuk menampilkannya. Pelanggan juga dapat menghubungi melalui kanal lain yang tersedia.",
  },
  {
    q: "Apakah data usaha saya aman di SUDROS?",
    a: "Kami berkomitmen menjaga keamanan data pengguna. Informasi yang ditampilkan hanya yang Anda pilih untuk publikasikan pada listing.",
  },
];

const HERO_IMAGE_PATH = "/images/umkm/hero-cinematic.jpg";

const hasHeroImage = fs.existsSync(
  path.join(process.cwd(), "public", HERO_IMAGE_PATH),
);

/* =========================================================
   ICON COMPONENT
========================================================= */

function Icon({
  name,
  size = 22,
}: {
  name: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M20 10.5c0 5-8 10.5-8 10.5S4 15.5 4 10.5a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10.5" r="2.5" />
        </svg>
      );
    case "store":
      return (
        <svg {...common}>
          <path d="M4 10v9h16v-9" />
          <path d="M3 10 5 4h14l2 6" />
          <path d="M3 10c.8 1 1.8 1.5 3 1.5S8.2 11 9 10c.8 1 1.8 1.5 3 1.5s2.2-.5 3-1.5c.8 1 1.8 1.5 3 1.5s2.2-.5 3-1.5" />
          <path d="M9 19v-4h6v4" />
        </svg>
      );
    case "food":
      return (
        <svg {...common}>
          <path d="M7 3v7" />
          <path d="M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3" />
          <path d="M7 10v11" />
          <path d="M17 3v18" />
          <path d="M17 3c2.2 1.5 3 4 0 7" />
        </svg>
      );
    case "tools":
      return (
        <svg {...common}>
          <path d="m14.5 6.5 3-3 3 3-3 3" />
          <path d="m17.5 9.5-8.8 8.8a2.1 2.1 0 0 1-3-3l8.8-8.8" />
          <path d="m5 5 4 4" />
          <path d="m4 4 1-1 4 4-1 1" />
        </svg>
      );
    case "bag":
      return (
        <svg {...common}>
          <path d="M5 8h14l1 12H4L5 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M20 4C11 4 6 8 6 14c0 3 2 5 5 5 6 0 9-6 9-15Z" />
          <path d="M4 20c3-4 7-7 12-9" />
        </svg>
      );
    case "car":
      return (
        <svg {...common}>
          <path d="M5 16h14l-1-6H6l-1 6Z" />
          <path d="m7 10 1.5-4h7L17 10" />
          <circle cx="8" cy="17" r="1.5" />
          <circle cx="16" cy="17" r="1.5" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="m3 11 9-7 9 7" />
          <path d="M5 10v10h14V10" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...common}>
          <rect x="4" y="7" width="16" height="12" rx="2" />
          <path d="M9 7V5h6v2" />
          <path d="M4 11h16" />
          <path d="M10 11v2h4v-2" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h13" />
          <path d="m14 7 5 5-5 5" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 13 4 4L19 7" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

/* =========================================================
   SUDROS LOGO
========================================================= */

function SudrosLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center"
      aria-label={`${SITE_NAME} — Beranda`}
    >
      <div className="relative flex items-center">
        <Image
          src="/brand/sudros-logo.png"
          alt="Logo SUDROS"
          width={80}
          height={50}
          priority
          className={
            compact ? "h-auto w-16 sm:w-20" : "h-auto w-20 sm:w-24"
          }
        />

        {!compact && (
          <div className="ml-3 leading-none">
            <div
              className="text-[21px] font-extrabold tracking-[-0.055em]"
              style={{ color: deepBlue }}
            >
              SUDROS
            </div>
            <div
              className="mt-1 text-[7px] font-semibold tracking-[0.06em]"
              style={{ color: "#6E8AA3" }}
            >
              TEMUKAN. TAWARKAN. TERHUBUNG.
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    city?: string;
  }>;
}) {
  const { q, category, city } = await searchParams;

  after(() => logPageView("site", "/"));

  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name")
    .returns<Category[]>();

  let query = supabase
    .from("listings")
    .select(
      "id, title, price, location_city, location_area, listing_images(image_url, sort_order)",
    )
    .order("created_at", { ascending: false })
    .limit(24);

  if (q) query = query.ilike("title", `%${q}%`);
  if (category) query = query.eq("category_id", category);
  if (city) query = query.ilike("location_city", `%${city}%`);

  const { data: listings } =
    await query.returns<ListingCardData[]>();

  const listingList = listings || [];
  const hasActiveFilter = Boolean(q || category || city);

  const cities = Array.from(
    new Set(
      listingList.map((l) => l.location_city).filter(Boolean),
    ),
  ).slice(0, 8);

  function categoryHref(label: string) {
    const match = (categories || []).find(
      (item) => item.name.toLowerCase() === label.toLowerCase(),
    );
    return match
      ? `/kategori/${slugify(match.name)}`
      : `/?q=${encodeURIComponent(label)}#hasil`;
  }

  /* =========================================================
     STRUCTURED DATA
  ========================================================= */

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "Sudros Indonesia",
    url: SITE_URL,
    inLanguage: "id-ID",
    description:
      "Platform listing lokal Indonesia untuk menemukan dan menawarkan usaha, produk, jasa, tempat, dan kebutuhan lokal.",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/sudros-logo.png`,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/sudros-logo.png`,
    description:
      "Platform listing lokal Indonesia untuk menemukan dan mempromosikan usaha, produk, jasa, dan kebutuhan lokal.",
    sameAs: [
      "https://www.instagram.com/sudros.id",
      "https://www.facebook.com/sudros.id",
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  const itemListJsonLd =
    listingList.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Listing terbaru di SUDROS",
          itemListElement: listingList
            .slice(0, 10)
            .map((listing, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: listing.title,
              url: `${SITE_URL}/listing/${listing.id}`,
            })),
        }
      : null;

  return (
    <div
      className={`${jakarta.variable} min-h-screen overflow-x-hidden font-sans`}
      style={{ color: deepBlue }}
    >
      {/* STRUCTURED DATA */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(itemListJsonLd),
          }}
        />
      )}

      <PageViewTracker event="landing_page_view" />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-100/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <SudrosLogo />

          <nav
            className="hidden items-center gap-7 lg:flex"
            aria-label="Navigasi utama"
          >
            <Link
              href="/"
              className="text-xs font-bold"
              style={{ color: royalBlue }}
            >
              Beranda
            </Link>
            <a
              href="#hasil"
              className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
            >
              Jelajahi
            </a>
            <a
              href="#kategori"
              className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
            >
              Kategori
            </a>
            <a
              href="#cara-kerja"
              className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
            >
              Cara Kerja
            </a>
            <a
              href="#bisnis"
              className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
            >
              Untuk Bisnis
            </a>
            <a
              href="#faq"
              className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
            >
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 sm:inline-flex"
            >
              Masuk
            </Link>

            <TrackLink
              href="/register"
              event="register_started"
              eventProperties={{ source: "header" }}
              className="rounded-full px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-900/10 transition hover:-translate-y-0.5 hover:shadow-lg sm:px-5"
              style={{
                background:
                  "linear-gradient(135deg, #1268B3, #168ED0)",
              }}
            >
              <span className="sm:hidden">Daftar</span>
              <span className="hidden sm:inline">
                Daftarkan Usaha
              </span>
            </TrackLink>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
              aria-label="Buka menu navigasi"
            >
              <Icon name="menu" size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="relative overflow-hidden"
        aria-labelledby="hero-heading"
      >
        {hasHeroImage ? (
          <>
            <Image
              src={HERO_IMAGE_PATH}
              alt="Pelaku usaha lokal Indonesia sedang melayani pelanggan"
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: "68% 42%" }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(3,20,43,.96) 0%, rgba(3,20,43,.88) 28%, rgba(3,20,43,.55) 55%, rgba(3,20,43,.15) 100%)",
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 80% 15%, rgba(42,169,224,.35), transparent 28%), linear-gradient(135deg,#061D39,#1268B3)",
            }}
          />
        )}

        <div className="relative mx-auto flex min-h-[640px] max-w-7xl items-center px-5 py-20 sm:min-h-[680px] lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-bold tracking-[.18em] text-white/85 backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              PLATFORM LOKAL INDONESIA
            </div>

            <h1
              id="hero-heading"
              className="mt-7 max-w-3xl text-[45px] font-extrabold leading-[1.02] tracking-[-.055em] text-white sm:text-6xl lg:text-7xl"
            >
              Temukan Apa yang Ada
              <span className="block" style={{ color: "#71D4F6" }}>
                di Sekitarmu.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
              Cari usaha, produk, jasa, tempat, dan berbagai
              kebutuhan lokal — atau tawarkan sesuatu agar lebih
              mudah ditemukan oleh orang yang tepat.
            </p>

            {/* SEARCH */}
            <TrackedSearchForm
              method="GET"
              action="/#hasil"
              className="mt-8 max-w-3xl rounded-[22px] border border-white/20 bg-white p-2 shadow-2xl sm:flex sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center px-3">
                <span className="mr-3" style={{ color: royalBlue }}>
                  <Icon name="search" size={21} />
                </span>
                <input
                  type="text"
                  name="q"
                  defaultValue={q || ""}
                  placeholder="Cari usaha, produk, jasa, atau tempat..."
                  aria-label="Kata kunci pencarian"
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="flex items-center px-3 sm:w-44">
                <span className="mr-2" style={{ color: royalBlue }}>
                  <Icon name="pin" size={18} />
                </span>
                <input
                  type="text"
                  name="city"
                  defaultValue={city || ""}
                  placeholder="Lokasi"
                  aria-label="Lokasi pencarian"
                  className="w-full bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-[16px] px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
                style={{
                  background:
                    "linear-gradient(135deg,#1268B3,#168ED0)",
                }}
              >
                Cari
              </button>
            </TrackedSearchForm>

            {/* QUICK CHIPS */}
            <div className="mt-5 flex flex-wrap gap-2">
              {quickCategories.map((label) => (
                <TrackLink
                  key={label}
                  href={categoryHref(label)}
                  event="category_clicked"
                  eventProperties={{
                    label,
                    source: "hero_quick_chip",
                  }}
                  className="rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[11px] font-semibold text-white/85 backdrop-blur-md transition hover:bg-white/20"
                >
                  {label}
                </TrackLink>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <TrackLink
                href="/register"
                event="register_started"
                eventProperties={{ source: "hero_primary_cta" }}
                className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-xs font-bold shadow-lg transition hover:-translate-y-0.5"
                style={{ color: deepBlue }}
              >
                Daftarkan Usaha Gratis
                <span className="ml-2">→</span>
              </TrackLink>

              <a
                href="#hasil"
                className="inline-flex items-center text-xs font-bold text-white/80 hover:text-white"
              >
                atau jelajahi listing
                <span className="ml-2">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          TRUST STATS
      ===================================================== */}

      <section
        aria-label="Keunggulan SUDROS"
        className="relative z-10 -mt-10 px-4 sm:px-6"
      >
        <div className="mx-auto max-w-6xl">
          <div
            className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border bg-white shadow-xl shadow-blue-900/5 sm:grid-cols-4"
            style={{ borderColor: borderBlue }}
          >
            {trustStats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center px-4 py-6 text-center sm:py-7"
              >
                <div
                  className="text-xl font-extrabold tracking-[-.03em] sm:text-2xl"
                  style={{ color: deepBlue }}
                >
                  {stat.value}
                </div>
                <div className="mt-1 text-[10px] font-semibold tracking-wide text-slate-500 sm:text-[11px]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          VALUE CARDS
      ===================================================== */}

      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
          <div
            className="rounded-[24px] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:p-8"
            style={{ borderColor: borderBlue }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: paleBlue,
                color: royalBlue,
              }}
            >
              <Icon name="search" size={20} />
            </div>

            <h3 className="mt-6 text-base font-bold">
              Sedang mencari?
            </h3>

            <p className="mt-2 max-w-lg text-xs leading-6 text-slate-500 sm:text-sm">
              Temukan usaha, produk, jasa, tempat, dan kebutuhan
              lokal yang tersedia di SUDROS — cepat dan relevan.
            </p>

            <a
              href="#hasil"
              className="mt-5 inline-flex items-center text-xs font-bold"
              style={{ color: royalBlue }}
            >
              Mulai mencari <span className="ml-1">→</span>
            </a>
          </div>

          <div
            className="relative overflow-hidden rounded-[24px] p-6 text-white shadow-xl sm:p-8"
            style={{
              background:
                "linear-gradient(135deg,#08264A 0%,#0B477F 55%,#1268B3 100%)",
            }}
          >
            <div
              className="absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl"
              style={{ backgroundColor: "rgba(42,169,224,.25)" }}
            />

            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <Icon name="plus" size={21} />
              </div>

              <h3 className="mt-6 text-base font-bold">
                Punya sesuatu untuk ditawarkan?
              </h3>

              <p className="mt-2 max-w-lg text-xs leading-6 text-white/65 sm:text-sm">
                Tampilkan usaha, produk, jasa, atau layananmu
                agar punya kehadiran digital di ekosistem lokal
                SUDROS.
              </p>

              <TrackLink
                href="/register"
                event="register_started"
                eventProperties={{ source: "value_card" }}
                className="mt-5 inline-flex items-center text-xs font-bold"
                style={{ color: "#71D4F6" }}
              >
                Promosikan di SUDROS
                <span className="ml-1">→</span>
              </TrackLink>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CATEGORY DISCOVERY
      ===================================================== */}

      <section
        id="kategori"
        aria-labelledby="kategori-heading"
        className="px-4 py-16 sm:px-6 sm:py-24"
        style={{ backgroundColor: paleBlue }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <div
              className="flex items-center gap-3 text-[10px] font-bold tracking-[.22em]"
              style={{ color: royalBlue }}
            >
              EXPLORE
              <span
                className="h-1 w-6 rounded-full"
                style={{ backgroundColor: cyanBlue }}
              />
            </div>

            <h2
              id="kategori-heading"
              className="mt-4 text-[30px] font-extrabold leading-tight tracking-[-.04em] sm:text-4xl"
            >
              Apa yang bisa kamu temukan?
            </h2>

            <p className="mt-3 text-xs leading-6 text-slate-500 sm:text-sm">
              Beragam kategori untuk membantu kamu menemukan
              sesuatu yang relevan dengan lebih cepat.
            </p>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {offerGrid.map((item) => (
              <TrackLink
                key={item.title}
                href={categoryHref(item.title)}
                event="category_clicked"
                eventProperties={{
                  label: item.title,
                  source: "premium_category_grid",
                }}
                className="group relative min-h-[160px] overflow-hidden rounded-[20px] border bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-h-[175px] sm:p-6"
                style={{ borderColor: "#E3EFF7" }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12"
                    style={{
                      backgroundColor: paleBlue,
                      color: royalBlue,
                    }}
                  >
                    <Icon name={item.icon} size={20} />
                  </div>

                  <div
                    className="transition duration-300 group-hover:translate-x-1"
                    style={{ color: "#9BB6C9" }}
                  >
                    <Icon name="arrow" size={17} />
                  </div>
                </div>

                <h3 className="mt-5 text-xs font-bold text-slate-800 sm:text-sm">
                  {item.title}
                </h3>

                <p className="mt-1.5 text-[10px] leading-5 text-slate-500 sm:text-xs">
                  {item.body}
                </p>

                <div
                  className="absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-300 group-hover:w-full"
                  style={{ backgroundColor: cyanBlue }}
                />
              </TrackLink>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          DISCOVERY LISTINGS
      ===================================================== */}

      <section
        id="hasil"
        aria-labelledby="hasil-heading"
        className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24"
        style={{ backgroundColor: backgroundBlue }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div
                className="text-[10px] font-bold tracking-[.2em]"
                style={{ color: royalBlue }}
              >
                DISCOVER
              </div>

              <h2
                id="hasil-heading"
                className="mt-2 text-3xl font-extrabold tracking-[-.04em]"
              >
                {hasActiveFilter
                  ? "Hasil Pencarian"
                  : "Temukan di Sekitarmu"}
              </h2>

              <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
                {hasActiveFilter
                  ? "Listing yang sesuai dengan pencarianmu."
                  : "Jelajahi usaha, produk, jasa, dan tempat yang tersedia di SUDROS."}
              </p>
            </div>

            {hasActiveFilter && (
              <Link
                href="/#hasil"
                className="text-xs font-bold"
                style={{ color: royalBlue }}
              >
                Reset pencarian →
              </Link>
            )}
          </div>

          {listingList.length === 0 ? (
            <div
              className="mt-9 rounded-[24px] border bg-white p-10 text-center sm:p-16"
              style={{ borderColor: borderBlue }}
            >
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: paleBlue,
                  color: royalBlue,
                }}
              >
                <Icon name="search" size={24} />
              </div>

              <h3 className="mt-5 text-base font-bold">
                {hasActiveFilter
                  ? "Belum menemukan listing yang cocok."
                  : "SUDROS sedang berkembang."}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500">
                {hasActiveFilter
                  ? "Coba gunakan kata kunci atau lokasi yang berbeda."
                  : "Jadilah salah satu yang pertama menawarkan sesuatu di SUDROS."}
              </p>

              <TrackLink
                href="/register"
                event="register_started"
                eventProperties={{
                  source: "listing_empty_state",
                }}
                className="mt-6 inline-flex rounded-full px-6 py-3 text-xs font-bold text-white shadow-md"
                style={{
                  background:
                    "linear-gradient(135deg,#1268B3,#168ED0)",
                }}
              >
                Buat Listing Pertama →
              </TrackLink>
            </div>
          ) : (
            <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {listingList.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          LOCAL STORY
      ===================================================== */}

      <section
        aria-labelledby="local-heading"
        className="relative overflow-hidden px-5 py-20 text-white sm:py-28"
        style={{
          background:
            "linear-gradient(135deg,#061C37 0%,#0A4276 55%,#137DBD 100%)",
        }}
      >
        <div
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(42,169,224,.15)" }}
        />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="text-[10px] font-bold tracking-[.22em] text-cyan-200">
            LOCAL × DIGITAL
          </div>

          <h2
            id="local-heading"
            className="mt-5 text-4xl font-extrabold tracking-[-.045em] sm:text-5xl"
          >
            Dari Lokal,
            <span className="text-white/55"> Untuk Lokal.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/65">
            Banyak hal hebat tumbuh di sekitar kita. SUDROS
            hadir untuk membantu usaha, produk, jasa, tempat,
            dan potensi lokal lebih mudah ditemukan oleh orang
            yang tepat.
          </p>

          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            {[
              {
                number: "01",
                title: "Potensi",
                body: "Setiap daerah memiliki sesuatu yang layak ditemukan.",
              },
              {
                number: "02",
                title: "Visibilitas",
                body: "Bantu usaha lokal memiliki kehadiran digital.",
              },
              {
                number: "03",
                title: "Koneksi",
                body: "Temukan dan terhubung secara langsung.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-3xl border border-white/10 bg-white/[.06] p-6 text-left backdrop-blur-md"
              >
                <span className="text-[10px] font-bold text-cyan-200">
                  {item.number}
                </span>

                <h3 className="mt-4 text-sm font-bold">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs leading-6 text-white/55">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          BUSINESS SECTION
      ===================================================== */}

      <section
        id="bisnis"
        aria-labelledby="bisnis-heading"
        className="px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div
            className="overflow-hidden rounded-[28px] border"
            style={{
              borderColor: borderBlue,
              backgroundColor: "#F8FBFE",
            }}
          >
            <div className="grid lg:grid-cols-[1.15fr_.85fr]">
              <div className="p-7 sm:p-12 lg:p-16">
                <div
                  className="inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold tracking-wider"
                  style={{
                    backgroundColor: paleBlue,
                    color: royalBlue,
                  }}
                >
                  UNTUK PEMILIK USAHA
                </div>

                <h2
                  id="bisnis-heading"
                  className="mt-5 max-w-xl text-3xl font-extrabold tracking-[-.04em] sm:text-4xl"
                >
                  Bantu usaha lokal lebih mudah ditemukan.
                </h2>

                <p className="mt-4 max-w-xl text-xs leading-6 text-slate-500 sm:text-sm sm:leading-7">
                  Punya warung, bengkel, toko, usaha rumahan,
                  jasa, atau produk lokal? Hadirkan usahamu di
                  SUDROS dan jangkau pelanggan baru di sekitarmu.
                </p>

                <div className="mt-7 grid gap-2 sm:grid-cols-2">
                  {[
                    "Buat listing usaha gratis",
                    "Tampilkan produk & layanan",
                    "Tambahkan lokasi & kontak",
                    "Terhubung dengan calon pelanggan",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3"
                      style={{ borderColor: borderBlue }}
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: royalBlue }}
                      >
                        <Icon name="check" size={13} />
                      </span>

                      <span className="text-xs font-semibold text-slate-600">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <TrackLink
                  href="/register"
                  event="register_started"
                  eventProperties={{
                    source: "business_section",
                  }}
                  className="mt-8 inline-flex rounded-full px-7 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-900/10 transition hover:-translate-y-0.5"
                  style={{
                    background:
                      "linear-gradient(135deg,#1268B3,#168ED0)",
                  }}
                >
                  Daftarkan Usaha Saya →
                </TrackLink>
              </div>

              {/* TESTIMONIAL SIDE */}
              <div
                className="relative min-h-[360px] p-6 sm:p-10"
                style={{
                  background:
                    "radial-gradient(circle at 50% 25%,rgba(42,169,224,.35),transparent 25%),linear-gradient(145deg,#08264A,#1268B3)",
                }}
              >
                <div className="flex h-full flex-col justify-center gap-3">
                  {testimonials.map((t) => (
                    <figure
                      key={t.name}
                      className="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur-md"
                    >
                      <blockquote className="text-[11px] leading-5 text-white/85">
                        “{t.body}”
                      </blockquote>

                      <figcaption className="mt-3 flex items-center gap-3">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: cyanBlue }}
                        >
                          {t.initials}
                        </span>

                        <div>
                          <div className="text-[11px] font-bold text-white">
                            {t.name}
                          </div>
                          <div className="text-[10px] text-white/55">
                            {t.role}
                          </div>
                        </div>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section
        id="cara-kerja"
        aria-labelledby="cara-kerja-heading"
        className="px-4 py-16 sm:px-6 sm:py-24"
        style={{ backgroundColor: backgroundBlue }}
      >
        <div className="mx-auto max-w-7xl">
          <div>
            <div
              className="text-[10px] font-bold tracking-[.2em]"
              style={{ color: royalBlue }}
            >
              HOW IT WORKS
            </div>

            <h2
              id="cara-kerja-heading"
              className="mt-3 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl"
            >
              Semudah 3 langkah.
            </h2>
          </div>

          <div className="mt-9 grid gap-5 lg:grid-cols-2">
            <div
              className="rounded-[24px] border bg-white p-7 sm:p-9"
              style={{ borderColor: borderBlue }}
            >
              <p
                className="text-xs font-bold"
                style={{ color: royalBlue }}
              >
                UNTUK PENCARI
              </p>

              <div className="mt-7 space-y-6">
                {searcherSteps.map((step) => (
                  <div key={step.number} className="flex gap-4">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ backgroundColor: royalBlue }}
                    >
                      {step.number}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-xs leading-6 text-slate-500">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-[24px] p-7 text-white shadow-xl sm:p-9"
              style={{
                background:
                  "linear-gradient(145deg,#08264A,#0C4A83)",
              }}
            >
              <p className="text-xs font-bold text-cyan-200">
                UNTUK PEMILIK USAHA
              </p>

              <div className="mt-7 space-y-6">
                {ownerSteps.map((step) => (
                  <div key={step.number} className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[9px] font-bold text-cyan-200">
                      {step.number}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-xs leading-6 text-white/55">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <TrackLink
                href="/register"
                event="register_started"
                eventProperties={{
                  source: "how_it_works_owner",
                }}
                className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-xs font-bold transition hover:-translate-y-0.5"
                style={{ color: deepBlue }}
              >
                Mulai Menawarkan →
              </TrackLink>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          LOCATIONS
      ===================================================== */}

      {cities.length > 0 && (
        <section
          aria-labelledby="lokasi-heading"
          className="px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div
              className="text-[10px] font-bold tracking-[.2em]"
              style={{ color: royalBlue }}
            >
              LOCAL DISCOVERY
            </div>

            <h2
              id="lokasi-heading"
              className="mt-3 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl"
            >
              Jelajahi berdasarkan lokasi.
            </h2>

            <p className="mt-2 text-xs text-slate-500 sm:text-sm">
              Temukan listing dari wilayah yang sudah hadir di
              SUDROS.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {cities.map((cityName) => (
                <TrackLink
                  key={cityName}
                  href={`/lokasi/${slugify(cityName)}`}
                  event="location_clicked"
                  eventProperties={{ city: cityName }}
                  className="group inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2.5 text-xs font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  style={{
                    borderColor: borderBlue,
                    color: deepBlue,
                  }}
                >
                  <span style={{ color: royalBlue }}>
                    <Icon name="pin" size={15} />
                  </span>
                  {cityName}
                  <span className="transition group-hover:translate-x-1">
                    →
                  </span>
                </TrackLink>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          FAQ
      ===================================================== */}

      <section
        id="faq"
        aria-labelledby="faq-heading"
        className="px-4 py-16 sm:px-6 sm:py-24"
        style={{ backgroundColor: paleBlue }}
      >
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <div
              className="text-[10px] font-bold tracking-[.2em]"
              style={{ color: royalBlue }}
            >
              FAQ
            </div>

            <h2
              id="faq-heading"
              className="mt-3 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl"
            >
              Pertanyaan yang sering ditanyakan.
            </h2>

            <p className="mt-3 text-xs text-slate-500 sm:text-sm">
              Belum menemukan jawaban? Hubungi tim SUDROS.
            </p>
          </div>

          <div
            className="mt-9 overflow-hidden rounded-[24px] border bg-white px-5 sm:px-8"
            style={{ borderColor: borderBlue }}
          >
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group border-b py-5 last:border-0"
                style={{ borderColor: borderBlue }}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-xs font-bold sm:text-sm">
                  {item.q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-3 pr-6 text-xs leading-6 text-slate-500 sm:text-sm">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section
        aria-labelledby="final-cta-heading"
        className="relative overflow-hidden px-5 py-20 text-center text-white sm:py-28"
        style={{
          background:
            "linear-gradient(135deg,#061C37,#0A4276 55%,#137DBD)",
        }}
      >
        <div className="relative mx-auto max-w-3xl">
          <div className="text-[10px] font-bold tracking-[.25em] text-cyan-200">
            SUDROS
          </div>

          <h2
            id="final-cta-heading"
            className="mt-5 text-4xl font-extrabold tracking-[-.045em] sm:text-5xl"
          >
            Punya Sesuatu untuk Ditawarkan?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/60">
            Promosikan di SUDROS dan bantu lebih banyak orang
            menemukan apa yang kamu tawarkan — gratis untuk
            memulai.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <TrackLink
              href="/register"
              event="register_started"
              eventProperties={{ source: "final_cta" }}
              className="rounded-full bg-white px-7 py-3.5 text-xs font-bold shadow-xl transition hover:-translate-y-0.5"
              style={{ color: deepBlue }}
            >
              Promosikan di SUDROS
            </TrackLink>

            <a
              href="#hasil"
              className="rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-xs font-bold text-white transition hover:bg-white/10"
            >
              Jelajahi Listing
            </a>
          </div>

          <p className="mt-9 text-[10px] font-semibold tracking-[.15em] text-white/35">
            TEMUKAN. TAWARKAN. TERHUBUNG.
          </p>
        </div>
      </section>

      <SiteFooter />

      {/* =====================================================
          STICKY MOBILE CTA
      ===================================================== */}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-lg sm:hidden">
        <TrackLink
          href="/register"
          event="register_started"
          eventProperties={{ source: "sticky_mobile_cta" }}
          className="flex w-full items-center justify-center rounded-full py-3 text-xs font-bold text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg,#1268B3,#168ED0)",
          }}
        >
          Daftarkan Usaha Gratis →
        </TrackLink>
      </div>
      <div className="h-16 sm:hidden" aria-hidden="true" />
    </div>
  );
    }
