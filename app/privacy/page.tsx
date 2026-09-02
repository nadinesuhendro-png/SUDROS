// PATH: app/privacy/page.tsx
// AKSI: BUAT FILE BARU

import { Navbar } from "@/components/navbar";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="mb-1 text-xl font-bold" style={{ color: "var(--primary-dark)" }}>
          Kebijakan Privasi SUDROS
        </h1>
        <p className="mb-4 text-xs text-[var(--muted-foreground)]">
          Versi 1.0 • Berlaku mulai 2 September 2026
        </p>

        <div className="flex flex-col gap-4 text-sm text-[var(--foreground)]">
          <section>
            <h2 className="mb-1 text-base font-semibold text-[var(--card-foreground)]">
              1. Data yang Kami Kumpulkan
            </h2>
            <p>
              SUDROS mengumpulkan data yang Anda berikan secara langsung saat
              mendaftar dan menggunakan layanan, meliputi: nama pengguna,
              alamat email, nomor WhatsApp, foto profil, serta informasi
              listing (judul, deskripsi, harga, lokasi, foto) yang Anda
              unggah.
            </p>
          </section>

          <section>
            <h2 className="mb-1 text-base font-semibold text-[var(--card-foreground)]">
              2. Penggunaan Data
            </h2>
            <p>
              Data digunakan untuk: menampilkan listing kepada pengguna lain,
              memfasilitasi komunikasi antar pengguna (pesan dalam aplikasi,
              tautan WhatsApp), memproses pembayaran paket iklan, mengirim
              notifikasi terkait akun/listing/paket, dan meningkatkan
              kualitas layanan.
            </p>
          </section>

          <section>
            <h2 className="mb-1 text-base font-semibold text-[var(--card-foreground)]">
              3. Berbagi Data
            </h2>
            <p>
              Informasi listing dan nama pengguna yang Anda tandai publik
              akan terlihat oleh pengguna lain. Nomor WhatsApp hanya
              ditampilkan jika Anda mencantumkannya pada listing. SUDROS
              tidak menjual data pribadi Anda kepada pihak ketiga.
            </p>
          </section>

          <section>
            <h2 className="mb-1 text-base font-semibold text-[var(--card-foreground)]">
              4. Penyimpanan Data
            </h2>
            <p>
              Data disimpan menggunakan infrastruktur Supabase (PostgreSQL)
              dengan kontrol akses berbasis Row Level Security. Foto dan
              lampiran disimpan melalui Supabase Storage.
            </p>
          </section>

          <section>
            <h2 className="mb-1 text-base font-semibold text-[var(--card-foreground)]">
              5. Hak Pengguna
            </h2>
            <p>
              Anda berhak mengakses, memperbarui, atau menghapus data pribadi
              Anda kapan saja melalui halaman Profil dan Pengaturan Akun,
              termasuk opsi penghapusan akun secara permanen.
            </p>
          </section>

          <section>
            <h2 className="mb-1 text-base font-semibold text-[var(--card-foreground)]">
              6. Keamanan
            </h2>
            <p>
              SUDROS menerapkan otentikasi aman (Supabase Auth), enkripsi
              data dalam transit (HTTPS), dan pembatasan akses data melalui
              Row Level Security di tingkat database.
            </p>
          </section>

          <section>
            <h2 className="mb-1 text-base font-semibold text-[var(--card-foreground)]">
              7. Perubahan Kebijakan
            </h2>
            <p>
              Kebijakan Privasi ini dapat diperbarui sewaktu-waktu. Perubahan
              signifikan akan diinformasikan melalui platform.
            </p>
          </section>

          <section>
            <h2 className="mb-1 text-base font-semibold text-[var(--card-foreground)]">
              8. Kontak
            </h2>
            <p>
              Pertanyaan terkait privasi dapat disampaikan melalui kanal
              dukungan yang tersedia di platform SUDROS.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
