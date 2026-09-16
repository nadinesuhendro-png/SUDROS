import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { after } from "next/server";
import { Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

import { SiteHeader } from "@/components/site-header";
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
});

const SITE_URL = "https://www.sudros.id";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "SUDROS — Temukan. Tawarkan. Terhubung.",
  description:
    "Temukan usaha, produk, jasa, tempat, dan berbagai kebutuhan lokal di SUDROS. Punya sesuatu untuk ditawarkan? Promosikan di SUDROS.",
  openGraph: {
    title: "SUDROS — Temukan. Tawarkan. Terhubung.",
    description:
      "Platform listing lokal Indonesia untuk menemukan dan mempromosikan usaha, produk, jasa, tempat, dan berbagai kebutuhan lokal.",
    url: SITE_URL,
    type: "website",
  },
};

const deepBlue = "#08264A";
const royalBlue = "#1268B3";
const mediumBlue = "#2AA9E0";
const softBlue = "#EAF5FC";
const borderBlue = "#D9E8F4";

type Category = {
  id: string;
  name: string;
};

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
    icon: "▦",
    title: "Usaha & Toko",
    body: "Toko, warung, bisnis lokal, dan berbagai jenis usaha.",
  },
  {
    icon: "◉",
    title: "Kuliner",
    body: "Warung makan, restoran, catering, makanan rumahan, kue, dan minuman.",
  },
  {
    icon: "✦",
    title: "Jasa",
    body: "Bengkel, laundry, pangkas rambut, servis, renovasi, percetakan.",
  },
  {
    icon: "◇",
    title: "Produk",
    body: "Produk UMKM, produk rumahan, kerajinan, dan produk lokal lainnya.",
  },
  {
    icon: "⌁",
    title: "Produk Lokal",
    body: "Hasil pertanian, perikanan, peternakan, dan hasil laut daerah.",
  },
  {
    icon: "◈",
    title: "Otomotif",
    body: "Kendaraan, bengkel, sparepart, aksesori, dan layanan otomotif.",
  },
  {
    icon: "⌂",
    title: "Properti",
    body: "Rumah, tanah, kos, kontrakan, ruko, dan properti lainnya.",
  },
  {
    icon: "＋",
    title: "Profesional",
    body: "Jasa profesional, freelancer, konsultan, desain, dan fotografi.",
  },
  {
    icon: "○",
    title: "Tempat & Aktivitas",
    body: "Tempat wisata, penginapan, tempat olahraga, dan event lokal.",
  },
];

const searcherSteps = [
  {
    number: "01",
    title: "Cari",
    body: "Masukkan apa yang sedang kamu butuhkan.",
  },
  {
    number: "02",
    title: "Temukan",
    body: "Lihat listing, foto, lokasi, dan informasi yang tersedia.",
  },
  {
    number: "03",
    title: "Terhubung",
    body: "Hubungi pemilik usaha atau penyedia layanan secara langsung.",
  },
];

const ownerSteps = [
  {
    number: "01",
    title: "Daftar",
    body: "Buat akun SUDROS dalam beberapa langkah.",
  },
  {
    number: "02",
    title: "Tawarkan",
    body: "Publikasikan usaha, produk, jasa, tempat, atau layananmu.",
  },
  {
    number: "03",
    title: "Ditemukan",
    body: "Bangun kehadiran digital agar lebih mudah ditemukan.",
  },
];

const faqs = [
  {
    q: "Apa itu SUDROS?",
    a: "SUDROS adalah platform listing lokal Indonesia untuk menemukan dan mempromosikan usaha, produk, jasa, tempat, dan kebutuhan lokal lainnya.",
  },
  {
    q: "Apa saja yang bisa dipromosikan di SUDROS?",
    a: "Mulai dari usaha dan toko, kuliner, jasa, produk lokal, properti, hingga layanan profesional — selama legal dan relevan dengan platform.",
  },
  {
    q: "Apakah UMKM bisa mendaftarkan usaha?",
    a: "Bisa. UMKM merupakan bagian penting dari ekosistem SUDROS dan platform juga terbuka untuk usaha serta jasa dalam berbagai skala.",
  },
  {
    q: "Bagaimana cara membuat listing?",
    a: "Daftar akun, kemudian buat listing dari dashboard dengan menambahkan informasi seperti foto, deskripsi, harga, dan lokasi.",
  },
  {
    q: "Apakah saya bisa mencari usaha di sekitar saya?",
    a: "Gunakan kolom pencarian dan filter lokasi untuk menemukan listing berdasarkan wilayah yang tersedia.",
  },
  {
    q: "Bagaimana cara menghubungi pemilik usaha?",
    a: "Listing dapat menyediakan informasi kontak langsung, termasuk WhatsApp apabila pemilik memilih untuk menampilkannya.",
  },
];

const HERO_IMAGE_PATH = "/images/umkm/hero-cinematic.jpg";

const hasHeroImage = fs.existsSync(
  path.join(process.cwd(), "public", HERO_IMAGE_PATH),
);

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

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  if (category) {
    query = query.eq("category_id", category);
  }

  if (city) {
    query = query.ilike("location_city", `%${city}%`);
  }

  const { data: listings } = await query.returns<ListingCardData[]>();

  const listingList = listings || [];
  const hasActiveFilter = Boolean(q || category || city);

  const cities = Array.from(
    new Set(
      listingList
        .map((listing) => listing.location_city)
        .filter(Boolean),
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SUDROS",
    url: SITE_URL,
    description:
      "Platform listing lokal Indonesia untuk menemukan dan menawarkan usaha, produk, jasa, tempat, dan kebutuhan lokal.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div
      className={`${jakarta.variable} min-h-screen bg-white font-sans`}
      style={{ color: deepBlue }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <PageViewTracker event="landing_page_view" />

      <SiteHeader />

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative isolate overflow-hidden">
        {hasHeroImage ? (
          <>
            <Image
              src={HERO_IMAGE_PATH}
              alt="Pelaku usaha lokal Indonesia"
              fill
              priority
              className="object-cover"
              style={{ objectPosition: "68% 42%" }}
            />

            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(3,20,43,0.96) 0%, rgba(3,20,43,0.88) 28%, rgba(3,20,43,0.55) 52%, rgba(3,20,43,0.18) 76%, rgba(3,20,43,0.05) 100%)",
              }}
            />

            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(3,20,43,0.10) 0%, rgba(3,20,43,0.38) 100%)",
              }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 75% 20%, rgba(42,169,224,0.45), transparent 30%), linear-gradient(135deg, #061D39 0%, #0B3767 52%, #1268B3 100%)",
              }}
            />

            <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl" />
          </>
        )}

        <div className="relative mx-auto flex min-h-[650px] max-w-7xl items-center px-5 py-20 sm:min-h-[720px] lg:px-8">
          <div className="w-full max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-white backdrop-blur-md">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: mediumBlue }}
              />
              PLATFORM LOKAL INDONESIA
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-extrabold leading-[1.03] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              Temukan Apa yang Ada
              <span
                className="block"
                style={{ color: "#72D4F7" }}
              >
                di Sekitarmu.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
              Cari usaha, produk, jasa, tempat, dan berbagai kebutuhan lokal.
              Atau tawarkan sesuatu agar lebih mudah ditemukan.
            </p>

            {/* Search */}
            <TrackedSearchForm
              method="GET"
              action="/#hasil"
              className="mt-9 max-w-3xl rounded-3xl border border-white/20 bg-white/95 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl sm:flex sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center px-3">
                <span className="mr-3 text-xl text-slate-400">
                  ⌕
                </span>

                <input
                  type="text"
                  name="q"
                  defaultValue={q || ""}
                  placeholder="Cari usaha, produk, jasa, atau tempat..."
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:text-base"
                />
              </div>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="flex items-center px-3 sm:w-48">
                <span className="mr-2 text-base text-slate-400">
                  ◉
                </span>

                <input
                  type="text"
                  name="city"
                  defaultValue={city || ""}
                  placeholder="Lokasi"
                  className="w-full bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
                style={{
                  background:
                    "linear-gradient(135deg, #1268B3 0%, #168ED0 100%)",
                }}
              >
                Cari
              </button>
            </TrackedSearchForm>

            {/* Quick categories */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="mr-1 py-2 text-xs font-medium text-white/55">
                Populer:
              </span>

              {quickCategories.map((label) => (
                <TrackLink
                  key={label}
                  href={categoryHref(label)}
                  event="category_clicked"
                  eventProperties={{
                    label,
                    source: "hero_quick_chip",
                  }}
                  className="rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/90 backdrop-blur-md transition hover:border-white/30 hover:bg-white/20"
                >
                  {label}
                </TrackLink>
              ))}
            </div>

            {/* Hero CTA */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="#hasil"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-xl"
                style={{ color: deepBlue }}
              >
                Jelajahi SUDROS
                <span className="ml-2">↓</span>
              </a>

              <TrackLink
                href="/register"
                event="register_started"
                eventProperties={{
                  source: "hero_secondary",
                }}
                className="inline-flex items-center justify-center text-sm font-semibold text-white/90 transition hover:text-white"
              >
                Punya sesuatu untuk ditawarkan?
                <span className="ml-2" style={{ color: "#72D4F7" }}>
                  Promosikan di SUDROS →
                </span>
              </TrackLink>
            </div>
          </div>
        </div>

        {/* Bottom glass strip */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/10 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
            <p className="text-xs font-medium text-white/65">
              Dari lokal, untuk lokal.
            </p>

            <div className="flex items-center gap-5 text-xs text-white/60">
              <span>Usaha</span>
              <span>Produk</span>
              <span>Jasa</span>
              <span>Tempat</span>
              <span>Komunitas lokal</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          DISCOVERY
      ========================================================= */}
      <section
        id="hasil"
        className="scroll-mt-20 px-5 py-20 sm:py-24"
        style={{ backgroundColor: "#F7FAFD" }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div
                className="mb-3 text-xs font-bold uppercase tracking-[0.18em]"
                style={{ color: royalBlue }}
              >
                LOCAL DISCOVERY
              </div>

              <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
                {hasActiveFilter
                  ? "Hasil Pencarian"
                  : "Temukan di Sekitarmu"}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                {hasActiveFilter
                  ? "Berikut listing yang sesuai dengan pencarianmu."
                  : "Jelajahi berbagai usaha, produk, jasa, dan tempat yang tersedia di SUDROS."}
              </p>
            </div>

            {hasActiveFilter && (
              <Link
                href="/#hasil"
                className="text-sm font-semibold"
                style={{ color: royalBlue }}
              >
                Reset pencarian →
              </Link>
            )}
          </div>

          {listingList.length === 0 ? (
            <div className="mt-10 overflow-hidden rounded-3xl border bg-white p-10 text-center shadow-sm sm:p-16"
              style={{ borderColor: borderBlue }}
            >
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl"
                style={{
                  backgroundColor: softBlue,
                  color: royalBlue,
                }}
              >
                ⌕
              </div>

              <h3 className="mt-6 text-lg font-bold">
                {hasActiveFilter
                  ? "Belum menemukan listing yang cocok."
                  : "SUDROS sedang membangun ekosistem lokal."}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {hasActiveFilter
                  ? "Coba gunakan kata kunci atau lokasi yang berbeda."
                  : "Jadilah salah satu yang pertama menawarkan sesuatu di SUDROS."}
              </p>

              <TrackLink
                href="/register"
                event="register_started"
                eventProperties={{
                  source: "discovery_empty_state",
                }}
                className="mt-7 inline-flex rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                style={{ backgroundColor: royalBlue }}
              >
                Buat Listing Pertama →
              </TrackLink>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-5">
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

      {/* =========================================================
          VALUE PROPOSITION
      ========================================================= */}
      <section className="px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <div
                className="mb-3 text-xs font-bold uppercase tracking-[0.18em]"
                style={{ color: royalBlue }}
              >
                SATU EKOSISTEM
              </div>

              <h2 className="max-w-xl text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">
                Satu tempat untuk menemukan dan menawarkan.
              </h2>

              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-500">
                SUDROS mempertemukan orang yang sedang mencari dengan mereka
                yang memiliki sesuatu untuk ditawarkan.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
                  Temukan
                </span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
                  Tawarkan
                </span>
                <span
                  className="rounded-full px-4 py-2 text-xs font-semibold text-white"
                  style={{ backgroundColor: royalBlue }}
                >
                  Terhubung
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className="group rounded-3xl border bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                style={{ borderColor: borderBlue }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
                  style={{
                    backgroundColor: softBlue,
                    color: royalBlue,
                  }}
                >
                  ⌕
                </div>

                <h3 className="mt-6 text-lg font-bold">
                  Sedang mencari?
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Temukan usaha, produk, jasa, tempat, dan kebutuhan lokal
                  yang tersedia di SUDROS.
                </p>

                <a
                  href="#hasil"
                  className="mt-6 inline-flex text-sm font-bold"
                  style={{ color: royalBlue }}
                >
                  Mulai mencari →
                </a>
              </div>

              <div
                className="group rounded-3xl p-7 text-white shadow-xl"
                style={{
                  background:
                    "linear-gradient(145deg, #08264A 0%, #0E477F 100%)",
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl">
                  +
                </div>

                <h3 className="mt-6 text-lg font-bold">
                  Punya sesuatu?
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/70">
                  Tampilkan usaha, produk, jasa, atau layananmu agar memiliki
                  kehadiran di ekosistem lokal SUDROS.
                </p>

                <TrackLink
                  href="/register"
                  event="register_started"
                  eventProperties={{
                    source: "value_proposition",
                  }}
                  className="mt-6 inline-flex text-sm font-bold"
                  style={{ color: "#72D4F7" }}
                >
                  Promosikan di SUDROS →
                </TrackLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CATEGORIES
      ========================================================= */}
      <section
        id="kategori"
        className="px-5 py-20 sm:py-24"
        style={{ backgroundColor: softBlue }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <div
              className="mb-3 text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: royalBlue }}
            >
              EXPLORE
            </div>

            <h2 className="text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">
              Apa yang bisa kamu temukan?
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              Beragam kategori untuk membantu kamu menemukan sesuatu yang
              relevan dengan lebih cepat.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offerGrid.map((item) => (
              <TrackLink
                key={item.title}
                href={categoryHref(item.title)}
                event="category_clicked"
                eventProperties={{
                  label: item.title,
                  source: "premium_category_grid",
                }}
                className="group relative overflow-hidden rounded-3xl border bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ borderColor: borderBlue }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold transition group-hover:scale-105"
                    style={{
                      backgroundColor: softBlue,
                      color: royalBlue,
                    }}
                  >
                    {item.icon}
                  </div>

                  <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-500">
                    →
                  </span>
                </div>

                <h3 className="mt-6 text-base font-bold">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.body}
                </p>
              </TrackLink>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          LOCAL STORY
      ========================================================= */}
      <section className="relative overflow-hidden px-5 py-24 text-white sm:py-28"
        style={{
          background:
            "linear-gradient(135deg, #061B35 0%, #082F5B 52%, #0E69AE 100%)",
        }}
      >
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.18em] text-white/80">
            LOCAL × DIGITAL
          </div>

          <h2 className="mx-auto mt-7 max-w-3xl text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
            Dari Lokal,
            <span className="text-white/60"> Untuk Lokal.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
            Banyak hal hebat tumbuh di sekitar kita. SUDROS hadir untuk
            membantu usaha, produk, jasa, tempat, dan potensi lokal menjadi
            lebih mudah ditemukan.
          </p>

          <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
            {[
              {
                number: "01",
                title: "Potensi",
                body: "Setiap daerah memiliki sesuatu yang layak ditemukan.",
              },
              {
                number: "02",
                title: "Visibilitas",
                body: "Kehadiran digital membantu sesuatu lebih mudah ditemukan.",
              },
              {
                number: "03",
                title: "Koneksi",
                body: "Temukan dan terhubung langsung dengan pihak yang relevan.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm"
              >
                <span className="text-xs font-bold text-cyan-200">
                  {item.number}
                </span>

                <h3 className="mt-4 text-base font-bold">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/60">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FOR BUSINESS / UMKM
      ========================================================= */}
      <section
        id="umkm"
        className="px-5 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div
            className="overflow-hidden rounded-[2rem] border"
            style={{
              borderColor: borderBlue,
              backgroundColor: "#F8FBFE",
            }}
          >
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-8 sm:p-12 lg:p-16">
                <div
                  className="inline-flex rounded-full px-3 py-1.5 text-xs font-bold"
                  style={{
                    backgroundColor: softBlue,
                    color: royalBlue,
                  }}
                >
                  UNTUK PEMILIK USAHA
                </div>

                <h2 className="mt-6 max-w-2xl text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">
                  Bantu usaha lokal lebih mudah ditemukan.
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500">
                  Punya warung, bengkel, toko, usaha rumahan, jasa, produk
                  lokal, atau layanan profesional? Hadirkan usahamu di
                  SUDROS.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    "Buat listing usaha",
                    "Tampilkan produk & layanan",
                    "Tambahkan lokasi & informasi",
                    "Terhubung dengan calon pelanggan",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3"
                      style={{ borderColor: borderBlue }}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: royalBlue }}
                      >
                        ✓
                      </span>

                      <span className="text-sm font-semibold text-slate-700">
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
                  className="mt-9 inline-flex rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #1268B3, #168ED0)",
                  }}
                >
                  Daftarkan Usaha Saya →
                </TrackLink>
              </div>

              <div
                className="relative min-h-[320px] overflow-hidden lg:min-h-full"
                style={{
                  background:
                    "radial-gradient(circle at 50% 30%, rgba(42,169,224,0.45), transparent 28%), linear-gradient(145deg, #092C54, #0D6EAE)",
                }}
              >
                <div className="absolute inset-0 opacity-20">
                  <div
                    className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                    style={{ borderColor: "white" }}
                  />

                  <div
                    className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                    style={{ borderColor: "white" }}
                  />

                  <div
                    className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                    style={{ borderColor: "white" }}
                  />
                </div>

                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="max-w-xs text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-3xl shadow-2xl backdrop-blur-md">
                      S
                    </div>

                    <p className="mt-6 text-lg font-bold text-white">
                      Setiap usaha punya cerita.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-white/60">
                      Setiap daerah punya potensi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS
      ========================================================= */}
      <section
        id="cara-kerja"
        className="px-5 py-20 sm:py-24"
        style={{ backgroundColor: "#F7FAFD" }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <div
              className="mb-3 text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: royalBlue }}
            >
              HOW IT WORKS
            </div>

            <h2 className="text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">
              Semudah 3 langkah.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {/* Searcher */}
            <div
              className="rounded-3xl border bg-white p-7 sm:p-9"
              style={{ borderColor: borderBlue }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
                  style={{
                    backgroundColor: softBlue,
                    color: royalBlue,
                  }}
                >
                  ⌕
                </div>

                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: royalBlue }}
                  >
                    Untuk Pencari
                  </p>

                  <p className="text-sm font-semibold text-slate-500">
                    Temukan apa yang kamu butuhkan.
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                {searcherSteps.map((step, index) => (
                  <div
                    key={step.number}
                    className="relative flex gap-5"
                  >
                    {index < searcherSteps.length - 1 && (
                      <div
                        className="absolute left-[17px] top-9 h-[calc(100%+8px)] w-px"
                        style={{ backgroundColor: borderBlue }}
                      />
                    )}

                    <div
                      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: royalBlue }}
                    >
                      {step.number}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold">
                        {step.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Owner */}
            <div
              className="rounded-3xl p-7 text-white shadow-xl sm:p-9"
              style={{
                background:
                  "linear-gradient(145deg, #08264A 0%, #0C4A83 100%)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">
                  +
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                    Untuk Pemilik Usaha
                  </p>

                  <p className="text-sm font-semibold text-white/60">
                    Tawarkan sesuatu kepada dunia lokal.
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                {ownerSteps.map((step, index) => (
                  <div
                    key={step.number}
                    className="relative flex gap-5"
                  >
                    {index < ownerSteps.length - 1 && (
                      <div className="absolute left-[17px] top-9 h-[calc(100%+8px)] w-px bg-white/10" />
                    )}

                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[10px] font-bold text-cyan-200">
                      {step.number}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold">
                        {step.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-white/60">
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
                className="mt-9 inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold"
                style={{ color: deepBlue }}
              >
                Mulai Menawarkan →
              </TrackLink>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          LOCATION DISCOVERY
      ========================================================= */}
      {cities.length > 0 && (
        <section className="px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <div
                  className="mb-3 text-xs font-bold uppercase tracking-[0.18em]"
                  style={{ color: royalBlue }}
                >
                  LOCAL DISCOVERY
                </div>

                <h2 className="text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">
                  Jelajahi berdasarkan lokasi.
                </h2>

                <p className="mt-3 text-sm text-slate-500">
                  Temukan listing dari wilayah yang sudah hadir di SUDROS.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {cities.map((cityName) => (
                <TrackLink
                  key={cityName}
                  href={`/lokasi/${slugify(cityName)}`}
                  event="location_clicked"
                  eventProperties={{
                    city: cityName,
                  }}
                  className="group inline-flex items-center gap-2 rounded-full border bg-white px-5 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  style={{
                    borderColor: borderBlue,
                    color: deepBlue,
                  }}
                >
                  <span
                    className="text-sm"
                    style={{ color: royalBlue }}
                  >
                    ◉
                  </span>

                  {cityName}

                  <span className="text-slate-300 transition group-hover:translate-x-1">
                    →
                  </span>
                </TrackLink>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          FAQ
      ========================================================= */}
      <section
        className="px-5 py-20 sm:py-24"
        style={{ backgroundColor: softBlue }}
      >
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div
              className="mb-3 text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: royalBlue }}
            >
              FAQ
            </div>

            <h2 className="text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">
              Pertanyaan yang sering ditanyakan.
            </h2>
          </div>

          <div
            className="mt-10 overflow-hidden rounded-3xl border bg-white px-6 sm:px-8"
            style={{ borderColor: borderBlue }}
          >
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group border-b py-5 last:border-b-0"
                style={{ borderColor: borderBlue }}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-sm font-bold">
                  <span>{item.q}</span>

                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-3 max-w-3xl pr-8 text-sm leading-7 text-slate-500">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section
        className="relative overflow-hidden px-5 py-24 text-center text-white sm:py-28"
        style={{
          background:
            "linear-gradient(135deg, #061C37 0%, #0A4276 55%, #137DBD 100%)",
        }}
      >
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <div className="mx-auto inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.18em] text-white/75">
            SUDROS
          </div>

          <h2 className="mt-7 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
            Punya Sesuatu untuk Ditawarkan?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
            Promosikan di SUDROS dan bantu lebih banyak orang menemukan apa
            yang kamu tawarkan.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <TrackLink
              href="/register"
              event="register_started"
              eventProperties={{
                source: "final_cta",
              }}
              className="rounded-full bg-white px-7 py-3.5 text-sm font-bold shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
              style={{ color: deepBlue }}
            >
              Promosikan di SUDROS
            </TrackLink>

            <a
              href="#hasil"
              className="rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              Jelajahi Listing
            </a>
          </div>

          <div className="mt-10 flex items-center justify-center gap-3 text-xs font-semibold tracking-wide text-white/40">
            <span>Temukan.</span>
            <span>•</span>
            <span>Tawarkan.</span>
            <span>•</span>
            <span>Terhubung.</span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
            }
