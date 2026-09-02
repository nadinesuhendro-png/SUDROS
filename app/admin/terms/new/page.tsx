// PATH: app/admin/terms/new/page.tsx
// AKSI: BUAT FILE BARU

import { createTermsVersion } from "../actions";

export default async function NewTermsVersionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-[var(--muted-foreground)]">
        Buat Versi Terms Baru
      </h2>

      {error ? (
        <div className="rounded-[var(--radius)] bg-red-50 px-4 py-3 text-sm text-red-600">
          {error === "1" ? "Semua kolom wajib diisi" : error}
        </div>
      ) : null}

      <form action={createTermsVersion} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium">
            Nomor Versi (mis. "2.0")
          </label>
          <input
            type="text"
            name="version"
            required
            className="w-full rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Judul</label>
          <input
            type="text"
            name="title"
            required
            defaultValue="Syarat & Ketentuan SUDROS"
            className="w-full rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">
            Isi (mendukung format markdown sederhana: # / ## untuk heading, **teks** untuk bold)
          </label>
          <textarea
            name="content"
            required
            rows={16}
            className="w-full rounded-[var(--radius)] border border-gray-300 px-3 py-2 font-mono text-xs"
          />
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          Versi baru akan tersimpan sebagai draft (belum aktif). Aktifkan
          dari halaman daftar Terms setelah membuatnya.
        </p>
        <button
          type="submit"
          className="rounded-[var(--radius)] py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Simpan sebagai Draft
        </button>
      </form>
    </div>
  );
}
