// PATH: app/admin/marketing/campaigns/new/page.tsx
// AKSI: BUAT FILE BARU

import { createCampaign } from "../actions";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
        Buat Campaign Baru
      </h2>

      {error ? (
        <p className="text-sm text-red-600">Nama campaign wajib diisi.</p>
      ) : null}

      <form action={createCampaign} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Nama Campaign</label>
          <input
            type="text"
            name="name"
            required
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            placeholder="Misal: Rumah Kuala Tanjung Week"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Deskripsi</label>
          <textarea
            name="description"
            rows={3}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium">Tanggal Mulai</label>
            <input
              type="date"
              name="start_date"
              className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium">Tanggal Selesai</label>
            <input
              type="date"
              name="end_date"
              className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Buat Campaign
        </button>
      </form>
    </div>
  );
}
