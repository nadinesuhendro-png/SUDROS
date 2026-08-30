// PATH: app/admin/marketing/campaigns/page.tsx
// AKSI: BUAT FILE BARU

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type CampaignRow = {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  active: "Aktif",
  completed: "Selesai",
  archived: "Archived",
};

const statusColor: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  archived: "bg-gray-100 text-gray-500",
};

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("marketing_campaigns")
    .select("id, name, status, start_date, end_date, created_at")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data: campaigns } = await query.returns<CampaignRow[]>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
          Campaigns ({(campaigns || []).length})
        </h2>
        <Link
          href="/admin/marketing/campaigns/new"
          className="rounded-[var(--radius)] px-3 py-1.5 text-xs font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          + Buat Campaign
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {["draft", "active", "completed", "archived"].map((s) => (
          <Link
            key={s}
            href={`/admin/marketing/campaigns?status=${s}`}
            className={`rounded-full px-2 py-1 ${
              status === s ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            {statusLabel[s]}
          </Link>
        ))}
        {status ? (
          <Link
            href="/admin/marketing/campaigns"
            className="rounded-full bg-gray-100 px-2 py-1"
          >
            Reset Filter
          </Link>
        ) : null}
      </div>

      {(campaigns || []).length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">Belum ada campaign.</p>
      ) : null}

      <div className="flex flex-col gap-2">
        {(campaigns || []).map((c) => (
          <Link
            key={c.id}
            href={`/admin/marketing/campaigns/${c.id}`}
            className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{c.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  statusColor[c.status] || "bg-gray-100 text-gray-700"
                }`}
              >
                {statusLabel[c.status] || c.status}
              </span>
            </div>
            {c.start_date || c.end_date ? (
              <span className="text-xs text-[var(--muted-foreground)]">
                {c.start_date || "?"} → {c.end_date || "?"}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
