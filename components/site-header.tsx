// AKSI: GANTI SELURUH ISI FILE (tambah tracking register_started)
// PATH: components/site-header.tsx

import Image from "next/image";
import Link from "next/link";
import { TrackLink } from "@/components/analytics/track-link";

const deepBlue = "#0b2a52";
const royalBlue = "#1d6fb8";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/sudros-logo.png" alt="SUDROS" width={36} height={36} className="h-8 w-auto" />
          <span className="text-lg font-extrabold tracking-tight" style={{ color: deepBlue }}>
            SUDROS
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/" style={{ color: deepBlue }}>
            Beranda
          </Link>
          <Link href="/#hasil" style={{ color: deepBlue }}>
            Jelajahi
          </Link>
          <Link href="/#kategori" style={{ color: deepBlue }}>
            Kategori
          </Link>
          <Link href="/#cara-kerja" style={{ color: deepBlue }}>
            Cara Kerja
          </Link>
          <Link href="/#umkm" style={{ color: deepBlue }}>
            Untuk Bisnis
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm font-medium" style={{ color: deepBlue }}>
            Masuk
          </Link>
          <TrackLink
            href="/register"
            event="register_started"
            eventProperties={{ source: "navbar_desktop" }}
            className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: royalBlue }}
          >
            Daftarkan Usaha
          </TrackLink>
        </div>

        {/* Mobile menu (CSS-only checkbox toggle) */}
        <input type="checkbox" id="nav-toggle" className="peer hidden" />
        <label htmlFor="nav-toggle" className="cursor-pointer md:hidden" aria-label="Buka menu">
          <span className="block h-0.5 w-6 bg-[#0b2a52]" />
          <span className="mt-1.5 block h-0.5 w-6 bg-[#0b2a52]" />
          <span className="mt-1.5 block h-0.5 w-6 bg-[#0b2a52]" />
        </label>
        <div className="fixed inset-x-0 top-[57px] hidden flex-col gap-1 border-b border-black/5 bg-white px-5 py-4 text-sm font-medium peer-checked:flex md:hidden">
          <Link href="/#hasil" style={{ color: deepBlue }}>Jelajahi</Link>
          <Link href="/#kategori" className="mt-3" style={{ color: deepBlue }}>Kategori</Link>
          <Link href="/#cara-kerja" className="mt-3" style={{ color: deepBlue }}>Cara Kerja</Link>
          <Link href="/#umkm" className="mt-3" style={{ color: deepBlue }}>Untuk Bisnis</Link>
          <Link href="/login" className="mt-3" style={{ color: deepBlue }}>Masuk</Link>
          <TrackLink
            href="/register"
            event="register_started"
            eventProperties={{ source: "navbar_mobile" }}
            className="mt-3 rounded-full px-4 py-2 text-center font-semibold text-white"
            style={{ backgroundColor: royalBlue }}
          >
            Daftarkan Usaha
          </TrackLink>
        </div>
      </div>
    </header>
  );
}
