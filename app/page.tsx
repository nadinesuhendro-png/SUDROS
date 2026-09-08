// AKSI: GANTI SELURUH ISI FILE
// PATH: app/page.tsx

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ListingCard, type ListingCardData } from "@/components/listing-card";

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
      "Temukan usaha, produk, jasa, tempat, dan berbagai kebutuhan lokal. Punya sesuatu untuk ditawarkan? Promosikan di SUDROS.",
    url: SITE_URL,
    type: "website",
  },
};

const deepBlue = "#0b2a52";
const royalBlue = "#1d6fb8";
const mediumBlue = "#2aa8e0";
const skyBlueBg = "#eef6fc";

type Category = { id: string; name: string };

const quickCategories = ["Kuliner", "Toko", "Jasa", "Otomotif", "Properti", "Produk Lokal"];

const offerGrid = [
  { icon: "🏪", title: "Usaha & Toko", body: "Toko, warung, bisnis lokal, dan berbagai jenis usaha." },
  { icon: "🍜", title: "Kuliner", body: "Warung makan, restoran, catering, makanan rumahan, kue, dan minuman." },
  { icon: "🔧", title: "Jasa", body: "Bengkel, laundry, pangkas rambut, servis, renovasi, percetakan." },
  { icon: "🛍", title: "Produk", body: "Produk UMKM, produk rumahan, kerajinan, dan produk lokal lainnya." },
  { icon: "🌾", title: "Produk Lokal", body: "Hasil pertanian, perikanan, peternakan, dan hasil laut daerah." },
  { icon: "🚗", title: "Otomotif", body: "Kendaraan, bengkel, sparepart, aksesori, dan layanan otomotif." },
  { icon: "🏠", title: "Properti", body: "Rumah, tanah, kos, kontrakan, ruko, dan properti lainnya." },
  { icon: "💼", title: "Profesional", body: "Jasa profesional, freelancer, konsultan, desain, dan fotografi." },
  { icon: "📍", title: "Tempat & Aktivitas", body: "Tempat wisata, penginapan, tempat olahraga, event lokal." },
];

const heroMockCards = [
  { name: "Bengkel Motor Jaya", category: "Bengkel & Otomotif", place: "Kuala Tanjung" },
  { name: "Warung Mak Ani", category: "Kuliner", place: "Lima Puluh" },
  { name: "Ikan Segar Laut Kita", category: "Produk Lokal", place: "Tanjung Tiram" },
  { name: "Rumah Dijual", category: "Properti", place: "Batu Bara" },
];

const searcherSteps = [
  { number: "01", title: "Cari", body: "Cari apa yang kamu butuhkan." },
  { number: "02", title: "Temukan", body: "Lihat informasi, foto, lokasi, dan detail listing." },
  { number: "03", title: "Terhubung", body: "Hubungi pemilik usaha atau penyedia layanan." },
];

const ownerSteps = [
  { number: "01", title: "Daftar", body: "Buat akun SUDROS." },
  { number: "02", title: "Tawarkan", body: "Buat listing usaha, produk, jasa, atau tempat." },
  { number: "03", title: "Ditemukan", body: "Bantu calon pelanggan menemukan apa yang kamu tawarkan." },
];

const faqs = [
  { q: "Apa itu SUDROS?", a: "SUDROS adalah platform listing lokal Indonesia untuk menemukan dan mempromosikan usaha, produk, jasa, tempat, dan kebutuhan lokal lainnya." },
  { q: "Apa saja yang bisa dipromosikan di SUDROS?", a: "Mulai dari usaha dan toko, kuliner, jasa, produk lokal, properti, hingga layanan profesional — apa pun yang bisa ditawarkan secara legal dan relevan." },
  { q: "Apakah UMKM bisa mendaftarkan usaha?", a: "Bisa. UMKM adalah bagian penting dari ekosistem SUDROS, sekaligus terbuka untuk usaha dan jasa dalam skala apa pun." },
  { q: "Bagaimana cara membuat listing?", a: "Daftar akun, lalu buat listing dari dashboard dengan menambahkan foto, deskripsi, harga, dan lokasi." },
  { q: "Apakah saya bisa mencari usaha di sekitar saya?", a: "Bisa. Gunakan kolom pencarian dan filter lokasi di beranda untuk menemukan listing terdekat." },
  { q: "Bagaimana cara menghubungi pemilik usaha?", a: "Setiap listing menampilkan kontak langsung, biasanya lewat WhatsApp, agar kamu bisa terhubung tanpa perantara." },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; city?: string }>;
}) {
  const { q, category, city } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name")
    .returns<Category[]>();

  let query = supabase
    .from("listings")
    .select(
      "id, title, price, location_city, location_area, listing_images(image_url, sort_order)"
    )
    .order("created_at", { ascending: false })
    .limit(24);

  if (q) query = query.ilike("title", `%${q}%`);
  if (category) query = query.eq("category_id", category);
  if (city) query = query.ilike("location_city", `%${city}%`);

  const { data: listings } = await query.returns<ListingCardData[]>();

  const hasActiveFilter = Boolean(q || category || city);
  const listingList = listings || [];
  const cities = Array.from(new Set(listingList.map((l) => l.location_city))).slice(0, 8);

  // Kategori/lokasi punya rute SEO sendiri (/kategori/[slug], /lokasi/[slug]);
  // fallback ke pencarian teks kalau nama kategorinya belum ada di database.
  function categoryHref(label: string) {
    const match = (categories || []).find(
      (c) => c.name.toLowerCase() === label.toLowerCase()
    );
    return match ? `/kategori/${slugify(match.name)}` : `/?q=${encodeURIComponent(label)}#hasil`;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SUDROS",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className={`${jakarta.variable} font-sans`} style={{ color: deepBlue }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeader />

      {/* Hero */}
      <section className="px-5 pb-14 pt-12 sm:pt-16" style={{ backgroundColor: skyBlueBg }}>
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-bold tracking-widest" style={{ color: royalBlue }}>
              PLATFORM LOKAL INDONESIA
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
              Temukan yang Ada di Sekitarmu.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed" style={{ color: "#3a5578" }}>
              Cari usaha, produk, jasa, tempat, dan berbagai kebutuhan lokal dengan lebih mudah bersama SUDROS.
            </p>

            <form method="GET" action="/#hasil" className="mt-7 flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-lg sm:flex-row">
              <input
                type="text"
                name="q"
                defaultValue={q || ""}
                placeholder="Cari usaha, produk, jasa, atau tempat..."
                className="flex-1 rounded-xl border-0 px-4 py-3 text-sm focus:outline-none"
              />
              <input
                type="text"
                name="city"
                defaultValue={city || ""}
                placeholder="📍 Di mana?"
                className="rounded-xl border-0 px-4 py-3 text-sm focus:outline-none sm:w-40"
              />
              <button
                type="submit"
                className="rounded-xl px-6 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: royalBlue }}
              >
                Cari
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickCategories.map((label) => (
                <Link
                  key={label}
                  href={categoryHref(label)}
                  className="rounded-full border bg-white px-3 py-1.5 text-xs font-medium"
                  style={{ borderColor: "#cfe0ef", color: deepBlue }}
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-5">
              <a
                href="#hasil"
                className="rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: deepBlue }}
              >
                Jelajahi SUDROS
              </a>
              <Link href="/register" className="text-sm font-semibold" style={{ color: royalBlue }}>
                Punya sesuatu untuk ditawarkan? Promosikan di SUDROS →
              </Link>
            </div>
          </div>

          {/* Mockup listing cards - ilustratif, bukan data terdaftar */}
          <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid">
            {heroMockCards.map((card, i) => (
              <div
                key={card.name}
                className={`rounded-2xl bg-white p-4 shadow-md ${i % 2 === 1 ? "sm:translate-y-6" : ""}`}
              >
                <div
                  className="h-24 w-full rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${skyBlueBg}, #cfe4f5)` }}
                />
                <p className="mt-3 text-sm font-bold">{card.name}</p>
                <p className="text-xs" style={{ color: mediumBlue }}>{card.category}</p>
                <p className="mt-1 text-xs text-slate-500">📍 {card.place}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value proposition */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Satu Tempat untuk Menemukan dan Menawarkan.
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border p-6" style={{ borderColor: "#dbe8f4" }}>
            <p className="text-sm font-bold" style={{ color: royalBlue }}>Sedang mencari sesuatu?</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Cari usaha, produk, jasa, tempat, dan kebutuhan lokal di sekitar Anda.
            </p>
            <a href="#hasil" className="mt-4 inline-block text-sm font-semibold" style={{ color: royalBlue }}>
              Mulai Mencari →
            </a>
          </div>
          <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: deepBlue }}>
            <p className="text-sm font-bold">Punya sesuatu untuk ditawarkan?</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              Promosikan usaha, produk, jasa, atau layanan Anda agar lebih mudah ditemukan.
            </p>
            <Link href="/register" className="mt-4 inline-block text-sm font-semibold text-white underline">
              Promosikan di SUDROS →
            </Link>
          </div>
        </div>
      </section>

      {/* Core message */}
      <section className="px-5 py-20 text-center text-white" style={{ backgroundColor: royalBlue }}>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Punya Sesuatu untuk Ditawarkan?
          </h2>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-white/90 sm:text-4xl">
            Promosikan di SUDROS.
          </p>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/85">
            Dari usaha kecil hingga bisnis yang sedang berkembang, dari produk lokal hingga jasa profesional.
            SUDROS membantu membuat apa yang Anda tawarkan lebih mudah ditemukan.
          </p>
          <Link
            href="/register"
            className="mt-7 inline-block rounded-full bg-white px-7 py-3 text-sm font-semibold"
            style={{ color: royalBlue }}
          >
            Daftarkan Listing
          </Link>
          <p className="mt-4 text-xs text-white/70">
            Temukan pelanggan. Bangun kehadiran digital. Tumbuh bersama lokal.
          </p>
        </div>
      </section>

      {/* Apa yang bisa ditawarkan */}
      <section id="kategori" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Apa yang Bisa Kamu Tawarkan?
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {offerGrid.map((item) => (
            <Link
              key={item.title}
              href={categoryHref(item.title)}
              className="rounded-2xl border p-5 transition hover:shadow-md"
              style={{ borderColor: "#dbe8f4" }}
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="mt-2 text-sm font-bold">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Dari lokal untuk lokal */}
      <section className="px-5 py-16" style={{ backgroundColor: skyBlueBg }}>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Dari Lokal, Untuk Lokal.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
            Banyak hal hebat tumbuh di sekitar kita. SUDROS hadir untuk membantu usaha, produk, jasa,
            dan potensi lokal lebih mudah ditemukan.
          </p>
          <p className="mt-5 text-sm font-semibold" style={{ color: royalBlue }}>
            Setiap usaha punya cerita. Setiap daerah punya potensi.
          </p>
        </div>
      </section>

      {/* UMKM */}
      <section id="umkm" className="px-5 py-16 text-white" style={{ backgroundColor: deepBlue }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Bantu Usaha Lokal Lebih Mudah Ditemukan.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/85">
            Punya warung, bengkel, toko, usaha rumahan, jasa, atau produk lokal? Hadirkan usaha Anda di SUDROS.
          </p>
          <ul className="mx-auto mt-6 grid max-w-md gap-2 text-left text-sm text-white/90">
            <li>✓ Buat listing usaha</li>
            <li>✓ Tampilkan produk dan layanan</li>
            <li>✓ Tambahkan lokasi dan informasi usaha</li>
            <li>✓ Terhubung langsung dengan calon pelanggan</li>
          </ul>
          <Link
            href="/register"
            className="mt-7 inline-block rounded-full bg-white px-7 py-3 text-sm font-semibold"
            style={{ color: deepBlue }}
          >
            Daftarkan Usaha Saya
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Semudah 3 Langkah.</h2>
        <div className="mt-8 grid gap-10 sm:grid-cols-2">
          <div>
            <p className="text-sm font-bold" style={{ color: royalBlue }}>Untuk Pencari</p>
            <div className="mt-4 space-y-4">
              {searcherSteps.map((s) => (
                <div key={s.number}>
                  <span className="text-xs font-bold" style={{ color: mediumBlue }}>{s.number}</span>
                  <p className="text-sm font-bold">{s.title}</p>
                  <p className="text-sm text-slate-600">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: royalBlue }}>Untuk Pemilik Usaha</p>
            <div className="mt-4 space-y-4">
              {ownerSteps.map((s) => (
                <div key={s.number}>
                  <span className="text-xs font-bold" style={{ color: mediumBlue }}>{s.number}</span>
                  <p className="text-sm font-bold">{s.title}</p>
                  <p className="text-sm text-slate-600">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured / hasil pencarian - data asli */}
      <section id="hasil" className="px-5 py-16" style={{ backgroundColor: skyBlueBg }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {hasActiveFilter ? "Hasil Pencarian" : "Temukan di Sekitarmu"}
          </h2>

          {hasActiveFilter ? (
            <Link href="/#hasil" className="mt-2 inline-block text-xs text-slate-500 underline">
              Reset filter
            </Link>
          ) : null}

          {listingList.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed p-10 text-center" style={{ borderColor: "#cfe0ef" }}>
              <p className="text-sm font-semibold" style={{ color: deepBlue }}>
                {hasActiveFilter
                  ? "Tidak ada listing yang cocok dengan pencarian."
                  : "SUDROS sedang berkembang."}
              </p>
              {!hasActiveFilter && (
                <p className="mt-1 text-sm text-slate-600">
                  Jadilah salah satu yang pertama menawarkan sesuatu di SUDROS.
                </p>
              )}
              <Link
                href="/register"
                className="mt-4 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: royalBlue }}
              >
                Buat Listing Pertama
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {listingList.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Local discovery - hanya kota yang benar-benar ada listingnya */}
      {cities.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Temukan Berdasarkan Lokasi.
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {cities.map((c) => (
              <Link
                key={c}
                href={`/lokasi/${slugify(c)}`}
                className="rounded-full border px-4 py-2 text-sm font-medium"
                style={{ borderColor: "#dbe8f4", color: deepBlue }}
              >
                📍 {c}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="px-5 py-16" style={{ backgroundColor: skyBlueBg }}>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Pertanyaan yang Sering Ditanyakan.
          </h2>
          <div className="mt-6 divide-y" style={{ borderColor: "#dbe8f4" }}>
            {faqs.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="cursor-pointer list-none text-sm font-semibold" style={{ color: deepBlue }}>
                  {item.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-16 text-center text-white" style={{ backgroundColor: royalBlue }}>
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Punya Sesuatu untuk Ditawarkan?
          </h2>
          <p className="mt-3 text-sm text-white/85">
            Promosikan di SUDROS dan bantu lebih banyak orang menemukan apa yang kamu tawarkan.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold"
              style={{ color: royalBlue }}
            >
              Promosikan di SUDROS
            </Link>
            <a href="#hasil" className="rounded-full border border-white px-6 py-3 text-sm font-semibold text-white">
              Jelajahi SUDROS
            </a>
          </div>
          <p className="mt-5 text-xs font-medium tracking-wide text-white/70">
            Temukan. Tawarkan. Terhubung.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
