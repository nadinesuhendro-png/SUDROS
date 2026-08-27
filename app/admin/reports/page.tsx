// PATH: app/admin/reports/page.tsx
// AKSI: UPDATE FILE (auth check & AdminNav dipindah ke layout.tsx, jadi tidak dobel)

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resolveReport } from "./actions";

type ReportRow = {
  id: string;
  reason: string;
  detail: string | null;
  status: string;
  created_at: string;
  listing_id: string;
  listings: { title: string; owner_id: string } | null;
  profiles: { username: string } | null;
};

export default async function AdminReportsPage() {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select(
      "id, reason, detail, status, created_at, listing_id, listings(title, owner_id), profiles!reports_reporter_id_fkey(username)"
    )
    .order("created_at", { ascending: false })
    .returns<ReportRow[]>();

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-[var(--muted-foreground)]">
        Reports ({(reports || []).length})
      </h2>

      {(reports || []).length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Belum ada laporan.
        </p>
      ) : null}

      {(reports || []).map((report) => (
        <div
          key={report.id}
          className="flex flex-col gap-2 rounded-[var(--radius)] border border-gray-200 p-3 text-sm"
        >
          <div className="flex items-center justify-between">
            <Link
              href={`/listings/${report.listing_id}`}
              className="font-medium underline"
            >
              {report.listings?.title || "(listing dihapus)"}
            </Link>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                report.status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : report.status === "resolved"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {report.status}
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Alasan: {report.reason} • Dilaporkan oleh{" "}
            {report.profiles?.username || "-"}
          </p>
          {report.detail ? <p className="text-xs">{report.detail}</p> : null}

          {report.status === "pending" ? (
            <form action={resolveReport} className="flex gap-2">
              <input type="hidden" name="id" value={report.id} />
              <button
                type="submit"
                name="status"
                value="resolved"
                className="rounded-[var(--radius)] border border-green-300 px-3 py-1 text-xs text-green-700"
              >
                Resolve
              </button>
              <button
                type="submit"
                name="status"
                value="dismissed"
                className="rounded-[var(--radius)] border border-gray-300 px-3 py-1 text-xs"
              >
                Dismiss
              </button>
            </form>
          ) : null}
        </div>
      ))}
    </div>
  );
}
