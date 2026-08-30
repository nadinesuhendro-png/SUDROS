// PATH: app/admin/marketing/templates/new/page.tsx
// AKSI: BUAT FILE BARU

import { createTemplate } from "../actions";

export default async function NewTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
        Buat Template Baru
      </h2>

      {error ? (
        <p className="text-sm text-red-600">Nama dan isi template wajib diisi.</p>
      ) : null}

      <form action={createTemplate} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Nama Template</label>
          <input
            type="text"
            name="name"
            required
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            placeholder="Misal: Diskon Musiman"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Deskripsi</label>
          <input
            type="text"
            name="description"
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium">Platform (opsional)</label>
            <select
              name="platform"
              className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Semua platform</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="tiktok">TikTok</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="general">Umum</option>
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium">Content Type (opsional)</label>
            <input
              type="text"
              name="content_type"
              placeholder="general"
              className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">
            Isi Template (pakai placeholder: {"{headline} {property_facts} {price} {location} {cta}"})
          </label>
          <textarea
            name="template_body"
            rows={6}
            required
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm font-mono"
            placeholder={"{headline}\n\n{property_facts}\n\n{cta}"}
          />
        </div>

        <button
          type="submit"
          className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Simpan Template
        </button>
      </form>
    </div>
  );
                  }
