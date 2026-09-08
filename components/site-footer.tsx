// AKSI: BUAT FILE BARU
// PATH: components/site-footer.tsx

import Link from "next/link";

const deepBlue = "#0b2a52";

export function SiteFooter() {
  return (
    <footer className="px-5 py-12 text-sm" style={{ backgroundColor: deepBlue, color: "#c7d7ea" }}>
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-4">
        <div>
          <span className="text-lg font-extrabold text-white">SUDROS</span>
          <p className="mt-2 text-xs">Temukan. Tawarkan. Terhubung.</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/60">SUDROS</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/#hasil">Jelajahi</Link></li>
            <li><Link href="/#kategori">Kategori</Link></li>
            <li><Link href="/#hasil">Lokasi</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/60">Untuk Bisnis</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/register">Daftarkan Usaha</Link></li>
            <li><Link href="/dashboard/listings/new">Buat Listing</Link></li>
            <li><Link href="/pricing">Paket Promosi</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/60">Legal</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/terms">Syarat &amp; Ketentuan</Link></li>
            <li><Link href="/privacy">Kebijakan Privasi</Link></li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-xs text-white/50">
        &copy; {new Date().getFullYear()} SUDROS. All rights reserved.
      </p>
    </footer>
  );
}

