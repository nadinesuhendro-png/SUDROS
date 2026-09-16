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
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { TrackLink } from "@/components/analytics/track-link";
import { TrackedSearchForm } from "@/components/analytics/tracked-search-form";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { logPageView } from "@/lib/analytics/log-page-view";
import { ArrowRight, Search, MapPin, Star, Shield, Zap, ChevronRight } from "lucide-react";

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
    "Temukan usaha, produk, jasa, tempat, dan kebutuhan lokal di SUDROS. Punya sesuatu untuk ditawarkan? Promosikan di SUDROS.",
  openGraph: {
    title: "SUDROS — Temukan. Tawarkan. Terhubung.",
    description:
      "Temukan usaha, produk, jasa, tempat, dan kebutuhan lokal. Punya sesuatu untuk ditawarkan? Promosikan di SUDROS.",
    url: SITE_URL,
    type: "website",
  },
};

// Palet warna premium
const deepBlue = "#051B3F";
const royalBlue = "#0B4BA3";
const brightBlue = "#1677FF";
const skyBlue = "#36BFFA";
const softBlue = "#E6F4FF";
const darkBg = "#041229";

type Category = { id: string; name: string };

const quickCategories = ["Kuliner", "Toko", "Jasa", "Otomotif", "Properti", "Produk Lokal"];

const offerGrid = [
  { icon: "🏪", title: "Usaha & Toko", body: "Toko, warung, bisnis lokal, dan berbagai usaha." },
  { icon: "🍜", title: "Kuliner", body: "Warung makan, restoran, catering, kue, dan minuman." },
  { icon: "🔧", title: "Jasa", body: "Bengkel, laundry, pangkas rambut, servis, renovasi." },
  { icon: "🛍", title: "Produk", body: "Produk UMKM, kerajinan, dan produk rumahan." },
  { icon: "🌾", title: "Produk Lokal", body: "Hasil pertanian, perikanan, peternakan daerah." },
  { icon: "🚗", title: "Otomotif", body: "Kendaraan, bengkel, sparepart, aksesori." },
  { icon: "🏠", title: "Properti", body: "Rumah, tanah, kos, kontrakan, ruko." },
  { icon: "💼", title: "Profesional", body: "Freelancer, konsultan, desain, fotografi." },
  { icon: "📍", title: "Tempat & Aktivitas", body: "Wisata, penginapan, olahraga, event lokal." },
];

const HERO_IMAGE_PATH = "/images/umkm/hero-cinematic.jpg";
const hasHeroImage = fs.existsSync(
  path.join(process.cwd(), "public", HERO_IMAGE_PATH)
);

const searcherSteps = [
  { number: "01", title: "Cari", body: "Temukan apa yang kamu butuhkan dengan mudah." },
  { number: "02", title: "Temukan", body: "Lihat foto, lokasi, harga, dan detail lengkap." },
  { number: "03", title: "Terhubung", body: "Hubungi langsung pemilik usaha." },
];

const ownerSteps = [
  { number: "01", title: "Daftar", body: "Buat akun SUDROS secara gratis." },
  { number: "02", title: "Tawarkan", body: "Buat listing usaha, produk, atau jasa." },
  { number: "03", title: "Ditemukan", body: "Calon pelanggan menemukanmu." },
];

const faqs = [
  { q: "Apa itu SUDROS?", a: "SUDROS adalah platform listing lokal Indonesia untuk menemukan dan mempromosikan usaha, produk, jasa, tempat, dan kebutuhan lokal lainnya." },
  { q: "Apa saja yang bisa dipromosikan di SUDROS?", a: "Mulai dari usaha dan toko, kuliner, jasa, produk lokal, properti, hingga layanan profesional — apa pun yang bisa ditawarkan secara legal dan relevan." },
  { q: "Apakah UMKM bisa mendaftarkan usaha?", a: "Bisa. UMKM adalah bagian penting dari ekosistem SUDROS, sekaligus terbuka untuk usaha dan jasa dalam skala apa pun." },
  { q: "Bagaimana cara membuat listing?", a: "Daftar akun, lalu buat listing dari dashboard dengan menambahkan foto, deskripsi, harga, dan lokasi." },
  { q: "Apakah saya bisa mencari usaha di sekitar saya?", a: "Bisa. Gunakan kolom pencarian dan filter lokasi di beranda untuk menemukan listing terdekat." },
  { q: "Bagaimana cara menghubungi pemilik usaha?", a: "Setiap listing menampilkan kontak langsung, biasanya lewat WhatsApp, agar kamu bisa terhubung tanpa perantara." },
];

const animate = "transition-all duration-300 ease-out";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; city?: string }>;
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
    <div className={`${jakarta.variable} font-sans`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageViewTracker event="landing_page_view" />

      <SiteHeader />

      {/* Hero — Premium Dark Gradient */}
      <section className="relative overflow-hidden min-h-screen">
        {/* Efek latar belakang */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#1677FF]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#36BFFA]/10 rounded-full blur-3xl" />
        </div>

        {hasHeroImage ? (
          <>
            <Image
              src={HERO_IMAGE_PATH}
              alt="Pelaku usaha lokal Indonesia"
              fill
              priority
              className="object-cover"
              style={{ objectPosition: "68% 40%" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#041229]/95 via-[#041229]/75 to-[#041229]/30" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#041229] via-[#051B3F] to-[#0B4BA3]" />
        )}

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-5 py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm text-sky-200 backdrop-blur-sm border border-white/10 mb-6">
              <Star size={14} className="text-amber-400" />
              Platform Lokal Terpercaya
            </span>
            
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white mb-6">
              Temukan yang Ada di{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-300 to-cyan-300">
                Sekitarmu
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-blue-100/80 mb-8 max-w-xl leading-relaxed">
              Cari usaha, produk, jasa, tempat, dan kebutuhan lokal dengan lebih mudah.
              Bangun koneksi dengan bisnis-bisnis di sekitar Anda.
            </p>

            {/* Form Pencarian Premium */}
            <TrackedSearchForm 
              method="GET" 
              action="/#hasil" 
              className="mt-2 bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/15 shadow-2xl"
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="q"
                    defaultValue={q || ""}
                    placeholder="Cari usaha, produk, jasa..."
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/95 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="city"
                    defaultValue={city || ""}
                    placeholder="Lokasi..."
                    className="w-full sm:w-44 pl-10 pr-4 py-3.5 rounded-xl bg-white/95 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#1677FF] to-[#0B4BA3] hover:from-[#0B4BA3] hover:to-[#1677FF] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Cari
                </button>
              </div>
            </TrackedSearchForm>

            {/* Kategori Cepat */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              {quickCategories.map((label) => (
                <TrackLink
                  key={label}
                  href={categoryHref(label)}
                  event="category_clicked"
                  eventProperties={{ label, source: "quick_chip" }}
                  className={`px-4 py-2 rounded-full text-sm font-medium text-white border border-white/20 bg-white/5 hover:bg-white/15 ${animate} hover:border-white/40`}
                >
                  {label}
                </TrackLink>
              ))}
            </div>

            {/* Tombol Utama */}
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#hasil"
                className="px-8 py-3.5 rounded-full text-sm font-bold bg-white text-[#051B3F] hover:bg-sky-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Jelajahi Sekarang
              </a>
              <TrackLink
                href="/register"
                event="register_started"
                eventProperties={{ source: "hero_secondary" }}
                className="px-8 py-3.5 rounded-full text-sm font-bold text-white border border-white/25 bg-white/5 hover:bg-white/15 transition-all flex items-center gap-2"
              >
                Daftarkan Usaha
                <ArrowRight size={16} />
              </TrackLink>
            </div>
          </div>
        </div>
      </section>

      {/* Nilai Utama — Dua Kolom Premium */}
      <section className="py-24 px-5 bg-gradient-to-b from-white to-sky-50/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#051B3F] mb-4">
              Satu Tempat untuk Menemukan & Menawarkan
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Platform yang menghubungkan usaha lokal dengan pelanggan di sekitarnya
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="group p-8 rounded-3xl border border-sky-100 bg-white shadow-sm hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center mb-5">
                <Search size={24} className="text-[#1677FF]" />
              </div>
              <h3 className="text-xl font-bold text-[#051B3F] mb-3">Sedang Mencari Sesuatu?</h3>
              <p className="text-slate-600 leading-relaxed mb-5">
                Temukan usaha, produk, jasa, dan tempat terbaik di sekitar Anda. Semua dalam satu platform.
              </p>
              <a href="#hasil" className="inline-flex items-center gap-2 font-semibold text-[#1677FF] hover:gap-3 transition-all">
                Mulai Mencari <ChevronRight size={16} />
              </a>
            </div>

            <div className="group p-8 rounded-3xl bg-gradient-to-br from-[#051B3F] to-[#0B4BA3] text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-5">
                <Zap size={24} className="text-sky-300" />
              </div>
              <h3 className="text-xl font-bold mb-3">Punya Sesuatu untuk Ditawarkan?</h3>
              <p className="text-blue-100/80 leading-relaxed mb-5">
                Promosikan usaha Anda agar lebih mudah ditemukan oleh calon pelanggan di sekitar Anda.
              </p>
              <TrackLink
                href="/register"
                event="register_started"
                eventProperties={{ source: "value_prop" }}
                className="inline-flex items-center gap-2 font-semibold text-sky-300 hover:text-sky-200 hover:gap-3 transition-all"
              >
                Promosikan Sekarang <ArrowRight size={16} />
              </TrackLink>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Utama — Gelap & Elegan */}
      <section className="py-24 px-5 bg-[#041229] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-[#1677FF]/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
            Siap Ditemukan oleh <span className="text-sky-400">Pelangganmu</span>?
          </h2>
          <p className="text-lg text-blue-200/80 mb-8 max-w-xl mx-auto">
            Dari usaha kecil hingga bisnis berkembang. SUDROS membantu produk & jasa lokal makin dikenal.
          </p>
          <TrackLink
            href="/register"
            event="register_started"
            eventProperties={{ source: "core_message" }}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-[#1677FF] to-[#0B4BA3] text-white font-bold text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105"
          >
            Daftarkan Usaha Saya
            <ArrowRight size={20} />
          </TrackLink>
          <p className="mt-5 text-sm text-slate-400">Gratis • Cepat • Langsung Aktif</p>
        </div>
      </section>

      {/* Kategori — Grid Modern */}
      <section id="kategori" className="py-24 px-5 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#051B3F] mb-4">
              Apa yang Bisa Kamu Tawarkan?
            </h2>
            <p className="text-slate-500">Berbagai jenis usaha & produk bisa tumbuh bersama SUDROS</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {offerGrid.map((item, i) => (
              <TrackLink
                key={item.title}
                href={categoryHref(item.title)}
                event="category_clicked"
                eventProperties={{ label: item.title, source: "offer_grid" }}
                className={`group p-6 rounded-2xl border border-slate-100 hover:border-sky-200 bg-white hover:bg-sky-50/50 ${animate} hover:shadow-lg hover:shadow-sky-100/50 hover:-translate-y-1`}
              >
                <span className="text-3xl group-hover:scale-110 inline-block transition-transform">
                  {item.icon}
                </span>
                <h3 className="mt-3 font-bold text-[#051B3F]">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-500 line-clamp-2">{item.body}</p>
              </TrackLink>
            ))}
          </div>
        </div>
      </section>

      {/* Filosofi — Dari Lokal untuk Lokal */}
      <section className="py-24 px-5 bg-gradient-to-r from-sky-50 to-blue-50">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#051B3F] mb-6">
            Dari Lokal, Untuk Lokal.
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-4">
            Banyak hal hebat tumbuh di sekitar kita. SUDROS hadir untuk membantu usaha, produk, jasa,
            dan potensi lokal lebih mudah ditemukan oleh siapa saja.
          </p>
          <p className="font-semibold text-[#1677FF] text-lg">
            Setiap usaha punya cerita. Setiap daerah punya potensi.
          </p>
        </div>
      </section>

      {/* Keunggulan UMKM */}
      <section className="py-24 px-5 bg-[#051B3F] text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
            Bantu Usaha Lokal Lebih Mudah Ditemukan
          </h2>
          <p className="text-blue-200/80 mb-8">
            Punya warung, bengkel, toko, atau produk rumahan? Hadirkan di SUDROS dan jangkau lebih banyak pelanggan.
          </p>
          <ul className="text-left max-w-md mx-auto space-y-3 mb-8">
            {[
              "Buat listing usaha secara gratis",
              "Tampilkan foto, harga, dan lokasi",
              "Terhubung langsung lewat WhatsApp",
              "Ditemukan orang di sekitarmu",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-blue-100/90">
                <Shield size={18} className="text-sky-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <TrackLink
            href="/register"
            event="register_started"
            eventProperties={{ source: "umkm_section" }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#051B3F] font-bold hover:bg-sky-50 transition-all shadow-lg hover:shadow-xl"
          >
            Daftarkan Usaha Saya
            <ArrowRight size={18} />
          </TrackLink>
        </div>
      </section>

      {/* Cara Kerja — Langkah Mudah */}
      <section className="py-24 px-5 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#051B3F] mb-4">
              Semudah 3 Langkah
            </h2>
            <p className="text-slate-500">Baik mencari maupun menawarkan, semua proses dibuat sederhana</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-sm font-bold text-[#1677FF] mb-5">Untuk Pencari</p>
              <div className="space-y-6">
                {searcherSteps.map((s) => (
                  <div key={s.number} className="flex gap-4 group">
                    <span className="text-xl font-extrabold text-sky-200 group-hover:text-sky-400 transition-colors">
                      {s.number}
                    </span>
                    <div>
                      <h3 className="font-bold text-[#051B3F]">{s.title}</h3>
                      <p className="text-slate-500 text-sm mt-1">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1677FF] mb-5">Untuk Pemilik Usaha</p>
              <div className="space-y-6">
                {ownerSteps.map((s) => (
                  <div key={s.number} className="flex gap-4 group">
                    <span className="text-xl font-extrabold text-sky-200 group-hover:text-sky-400 transition-colors">
                      {s.number}
                    </span>
                    <div>
                      <h3 className="font-bold text-[#051B3F]">{s.title}</h3>
                      <p className="text-slate-500 text-sm mt-1">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hasil Pencarian / Listing */}
      <section id="hasil" className="py-24 px-5 bg-sky-50/50">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-[#051B3F]">
                {hasActiveFilter ? "Hasil Pencarian" : "Temukan di Sekitarmu"}
              </h2>
              {hasActiveFilter && (
                <Link href="/#hasil" className="mt-2 inline-block text-sm text-slate-500 hover:text-[#1677FF]">
                  ← Reset Pencarian
                </Link>
              )}
            </div>
          </div>

          {listingList.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-sky-200 rounded-3xl bg-white">
              <p className="text-lg font-semibold text-[#051B3F]">
                {hasActiveFilter
                  ? "Belum ada hasil yang cocok"
                  : "SUDROS sedang berkembang"}
              </p>
              <p className="mt-2 text-slate-500 max-w-md mx-auto">
                {hasActiveFilter
                  ? "Coba gunakan kata kunci atau lokasi yang lebih umum"
                  : "Jadilah yang pertama menawarkan sesuatu di SUDROS"}
              </p>
              <TrackLink
                href="/register"
                event="register_started"
                eventProperties={{ source: "hasil_empty_state" }}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1677FF] text-white font-semibold hover:bg-[#0B4BA3] transition-all"
              >
                Buat Listing Pertama
                <ArrowRight size={16} />
              </TrackLink>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {listingList.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lokasi */}
      {cities.length > 0 && (
        <section className="py-24 px-5 bg-white">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-extrabold text-[#051B3F] mb-8 text-center">
              Temukan Berdasarkan Lokasi
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {cities.map((c) => (
                <TrackLink
                  key={c}
                  href={`/lokasi/${slugify(c)}`}
                  event="location_clicked"
                  eventProperties={{ city: c }}
                  className="px-5 py-2.5 rounded-full border border-sky-100 text-[#051B3F] font-medium hover:bg-sky-50 hover:border-sky-300 transition-all"
                >
                  📍 {c}
                </TrackLink>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-24 px-5 bg-sky-50/50">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-extrabold text-[#051B3F] mb-10 text-center">
            Pertanyaan yang Sering Ditanyakan
          </h2>
          <div className="space-y-4">
            {faqs.map((item) => (
              <details 
                key={item.q} 
                className="group bg-white rounded-2xl border border-sky-100 p-5 open:shadow-md"
              >
                <summary className="cursor-pointer list-none font-semibold text-[#051B3F] flex items-center justify-between">
                  {item.q}
                  <ChevronRight size={18} className="group-open:rotate-90 transition-transform text-slate-400" />
                </summary>
                <p className="mt-3 text-slate-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Akhir */}
      <section className="py-24 px-5 bg-gradient-to-r from-[#0B4BA3] to-[#1677FF] text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
            Punya Sesuatu untuk Ditawarkan?
          </h2>
          <p className="text-lg text-blue-100/80 mb-8">
            Promosikan di SUDROS dan biarkan lebih banyak orang menemukan apa yang kamu tawarkan.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <TrackLink
              href="/register"
              event="register_started"
              eventProperties={{ source: "final_cta" }}
              className="px-8 py-3.5 rounded-full bg-white text-[#0B4BA3] font-bold hover:bg-sky-50 transition-all shadow-lg"
            >
              Daftar Sekarang — Gratis
            </TrackLink>
            <a 
              href="#hasil" 
              className="px-8 py-3.5 rounded-full border border-white/30 text-white font-semibold hover:bg-white/10 transition-all"
            >
              Jelajahi Dulu
            </a>
          </div>
          <p className="mt-8 text-sm text-blue-200/60 tracking-wide">
            Temukan. Tawarkan. Terhubung. — SUDROS © {new Date().getFullYear()}
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
