// PATH: app/admin/marketing/campaigns/[id]/edit/page.tsx
// AKSI: BUAT FILE BARU

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCampaign } from "../../actions";

type CampaignEdit = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
};

export default async function EditCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("marketing_campaigns")
    .select("id, name, description, status, start_date, end_date")
    .eq("id", id)
    .maybeSingle<CampaignEdit>();

  if (!campaign) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
        Edit Campaign
      </h2>

      {error ? <p className="text-sm text-red-600">Nama campaign wajib diisi.</p> : null}

      <form action={updateCampaign} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={campaign.id} />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Nama Campaign</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={campaign.name}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Deskripsi</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={campaign.description || ""}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium">Tanggal Mulai</label>
            <input
              type="date"
              name="start_date"
              defaultValue={campaign.start_date || ""}
              className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium">Tanggal Selesai</label>
            <input
              type="date"
              name="end_date"
              defaultValue={campaign.end_date || ""}
              className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Status</label>
          <select
            name="status"
            defaultValue={campaign.status}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="active">Aktif</option>
            <option value="completed">Selesai</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
}
