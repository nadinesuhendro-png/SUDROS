// PATH: components/TermsConsentGate.tsx
// AKSI: BUAT FILE BARU

import Link from "next/link";
import { agreeToActiveTerms } from "@/app/dashboard/listings/terms-actions";

export default function TermsConsentGate({
  termsVersion,
}: {
  termsVersion: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-6">
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="mb-3 text-base font-semibold text-[var(--card-foreground)]">
          ⚠️ Sebelum Membuat Listing
        </p>

        <div className="mb-4 flex flex-col gap-2 text-sm text-[var(--card-foreground)]">
          <p>Dengan melanjutkan, Anda menyatakan bahwa:</p>
          <ul className="flex flex-col gap-1.5 pl-4 text-[var(--muted-foreground)]">
            <li>
              • Informasi listing yang Anda masukkan harus benar, akurat, dan
              tidak menyesatkan.
            </li>
            <li>
              • Anda bertanggung jawab atas barang, jasa, harga, foto,
              deskripsi, lokasi, dan informasi lain yang Anda cantumkan.
            </li>
            <li>
              • Anda tidak diperbolehkan menggunakan SUDROS untuk barang,
              jasa, konten, atau aktivitas yang melanggar hukum maupun
              kebijakan SUDROS.
            </li>
            <li>
              • SUDROS berhak meninjau, menolak, menyembunyikan, menghapus
              listing, atau membatasi akun yang melanggar ketentuan.
            </li>
            <li>
              • SUDROS merupakan platform yang mempertemukan pengguna dan
              bukan pihak dalam transaksi langsung antara pemasang listing
              dengan calon pembeli atau pelanggan.
            </li>
            <li>
              • Penggunaan paket iklan, pembayaran, pembatalan, refund, dan
              layanan lainnya mengikuti ketentuan dan kebijakan SUDROS yang
              berlaku.
            </li>
          </ul>
        </div>

        <Link
          href="/terms"
          target="_blank"
          className="mb-4 block text-center text-xs font-medium underline"
          style={{ color: "var(--primary)" }}
        >
          Baca Syarat & Ketentuan Lengkap (v{termsVersion})
        </Link>

        <div className="flex flex-col gap-2">
          <form action={agreeToActiveTerms}>
            <button
              type="submit"
              className="w-full rounded-[var(--radius)] py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >
              ✓ Saya Setuju & Lanjutkan
            </button>
          </form>
          <Link
            href="/dashboard"
            className="block w-full rounded-[var(--radius)] border border-[var(--border)] py-3 text-center text-sm font-medium text-[var(--foreground)]"
          >
            Batal
          </Link>
        </div>
      </div>
    </main>
  );
}
