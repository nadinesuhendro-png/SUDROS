// PATH: app/admin/packages/new/page.tsx
// AKSI: BUAT FILE BARU (form buat paket iklan baru)

import { createPackage } from "../actions";

export default async function NewPackagePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
        Buat Paket Baru
      </h2>

      {error ? (
        <p className="text-sm text-red-600">
          Semua field wajib diisi dengan benar.
        </p>
      ) : null}

      <form action={createPackage} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Nama Paket</label>
          <input
            type="text"
            name="name"
            required
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            placeholder="Misal: Business"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Deskripsi</label>
          <textarea
            name="description"
            rows={3}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            placeholder="Deskripsi singkat paket ini"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Harga (Rp)</label>
          <input
            type="number"
            name="price"
            required
            min={0}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            placeholder="99000"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Durasi (hari)</label>
          <input
            type="number"
            name="duration_days"
            required
            min={1}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            placeholder="30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Maks. Listing Aktif</label>
          <input
            type="number"
            name="max_active_listings"
            required
            min={1}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            placeholder="10"
          />
        </div>

        <button
          type="submit"
          className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Simpan Paket
        </button>
      </form>
    </div>
  );
}
