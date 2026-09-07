// AKSI: GANTI SELURUH ISI FILE (atau BUAT FILE BARU kalau app/page.tsx belum ada)
// PATH: app/page.tsx

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "SUDROS - Pasar Lokal Dekat Rumahmu",
  description:
    "Temukan, tawarkan, dan terhubung langsung dengan penjual di kotamu. SUDROS adalah pasar lokal digital, tanpa ongkir mahal dan tanpa perantara.",
};

const brand = {
  primary: "#1d6fb8",
  light: "#2aa8e0",
  navy: "#0b2a52",
  amber: "#f2a93b",
  ink: "#10192b",
  paper: "#f7f8fa",
};

const listingMocks = [
  {
    label: "Peralatan Makan",
    price: "Rp120.000",
    city: "Medan",
    rotate: "-rotate-3",
    top: "top-2",
    gradient: "from-[#dfe9f3] to-[#c7d7ea]",
  },
  {
    label: "Dijual Meja",
    price: "Rp500.000",
    city: "Medan",
    rotate: "rotate-2",
    top: "top-8",
    gradient: "from-[#f4e2c7] to-[#ecd0a4]",
  },
  {
    label: "Topi",
    price: "Rp15.000",
    city: "Medan",
    rotate: "-rotate-1",
    top: "top-0",
    gradient: "from-[#d9ecdd] to-[#bfe0c7]",
  },
];

const steps = [
  {
    number: "01",
    title: "Temukan",
    body: "Cari barang atau jasa di sekitarmu. Difilter berdasarkan kota, jadi hasilnya memang dekat rumah.",
  },
  {
    number: "02",
    title: "Tawarkan",
    body: "Pasang listingmu sendiri lengkap dengan foto dan harga, selesai dalam hitungan menit.",
  },
  {
    number: "03",
    title: "Terhubung",
    body: "Chat langsung ke WhatsApp penjual atau pembeli. Tidak ada perantara, tidak ada antrian tiket.",
  },
];

const categories = [
  "Makanan & Katering",
  "Perabotan Rumah",
  "Fashion",
  "Elektronik",
  "Jasa",
  "Kendaraan",
  "Properti",
  "Lainnya",
];

const reasons = [
  {
    title: "Bukan pasar raksasa",
    body: "SUDROS dibuat untuk transaksi dekat rumah, bukan tempat kamu bersaing dengan penjual dari luar pulau.",
  },
  {
    title: "Langsung ke WhatsApp",
    body: "Tidak ada sistem chat rumit di dalam aplikasi. Satu ketukan, langsung ngobrol seperti biasa.",
  },
  {
    title: "Harga yang kamu lihat, itu yang kamu bayar",
    body: "Tanpa biaya kirim yang tiba-tiba lebih mahal dari barangnya. Ambil sendiri kalau memang dekat.",
  },
];

export default function LandingPage() {
  return (
    <div className={`${jakarta.variable} font-sans`} style={{ color: brand.ink }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="text-lg font-extrabold tracking-tight" style={{ color: brand.navy }}>
            SUDROS
          </span>
          <nav className="flex items-center gap-3">
            <Link
              href="/masuk"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Masuk
            </Link>
            <Link
              href="/daftar"
              className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: brand.primary }}
            >
              Daftar
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-14 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: brand.primary }}
            >
              Temukan. Tawarkan. Terhubung.
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              Beli-jual dekat rumah, tanpa basa-basi ongkir.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600">
              SUDROS menghubungkan kamu langsung dengan penjual di kotamu.
              Lihat barangnya, chat lewat WhatsApp, ambil sendiri kalau mau.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/daftar"
                className="rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: brand.amber, color: brand.ink }}
              >
                Mulai Jual
              </Link>
              <Link
                href="/dashboard/explore"
                className="rounded-full border px-6 py-3 text-sm font-semibold transition hover:bg-slate-50"
                style={{ borderColor: brand.navy, color: brand.navy }}
              >
                Lihat Listing
              </Link>
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Sudah dipakai penjual di Medan dan sekitarnya.
            </p>
          </div>

          {/* Collage: mading digital ala papan pengumuman */}
          <div className="relative mx-auto h-[340px] w-full max-w-sm sm:h-[380px]">
            {listingMocks.map((item) => (
              <div
                key={item.label}
                className={`absolute ${item.top} ${item.rotate} w-52 rounded-xl border border-black/5 bg-white p-3 shadow-lg transition hover:-translate-y-1`}
                style={{
                  left: item.label === "Topi" ? "40%" : item.label === "Dijual Meja" ? "8%" : "auto",
                  right: item.label === "Peralatan Makan" ? "4%" : "auto",
                }}
              >
                <div
                  className={`h-28 w-full rounded-lg bg-gradient-to-br ${item.gradient}`}
                />
                <p className="mt-3 text-sm font-semibold">{item.label}</p>
                <p
                  className="text-sm font-bold"
                  style={{ color: brand.primary }}
                >
                  {item.price}
                </p>
                <p className="text-xs text-slate-500">{item.city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Langkah */}
      <section className="border-t border-black/5" style={{ backgroundColor: brand.paper }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Tiga langkah, itu saja.
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number}>
                <span
                  className="text-sm font-bold"
                  style={{ color: brand.light }}
                >
                  {step.number}
                </span>
                <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kategori */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Apa saja bisa dijual.
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <span
              key={cat}
              className="rounded-full border px-4 py-2 text-sm font-medium"
              style={{ borderColor: "#dbe4ee", color: brand.navy }}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Kenapa SUDROS */}
      <section className="border-t border-black/5 px-5 py-16" style={{ backgroundColor: brand.navy }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Kenapa bukan pasar besar saja?
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {reasons.map((reason) => (
              <div key={reason.title}>
                <h3 className="text-base font-bold text-white">
                  {reason.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {reason.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Harga */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Mulai gratis, upgrade kalau perlu.
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/5 p-6">
            <p className="text-sm font-semibold text-slate-500">Free</p>
            <p className="mt-2 text-2xl font-extrabold">Rp0</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Pasang listing dasar dan mulai jualan tanpa biaya apa pun.
            </p>
          </div>
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: brand.primary, backgroundColor: "#eef5fb" }}
          >
            <p className="text-sm font-semibold" style={{ color: brand.primary }}>
              Business
            </p>
            <p className="mt-2 text-2xl font-extrabold">
              Rp149.000<span className="text-sm font-medium text-slate-500">/bulan</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Untuk penjual yang butuh listing lebih banyak dan tampil lebih menonjol.
            </p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="mt-6 inline-block text-sm font-semibold"
          style={{ color: brand.primary }}
        >
          Lihat semua paket
        </Link>
      </section>

      {/* CTA Footer */}
      <section className="px-5 py-16" style={{ backgroundColor: brand.amber }}>
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: brand.ink }}>
            Jadi penjual pertama di lingkunganmu.
          </h2>
          <Link
            href="/daftar"
            className="mt-6 inline-block rounded-full px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: brand.navy }}
          >
            Daftar Sekarang
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 px-5 py-10 text-sm text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span>&copy; {new Date().getFullYear()} SUDROS</span>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-slate-800">
              Syarat &amp; Ketentuan
            </Link>
            <Link href="/privacy" className="hover:text-slate-800">
              Kebijakan Privasi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
