// PATH: app/admin/agents/page.tsx
// AKSI: BUAT FILE BARU (dashboard status 9 agent dari tabel agent_tasks)

import { createClient } from "@/lib/supabase/server";

type TaskRow = {
  id: string;
  agent_name: string;
  trigger_event: string;
  status: string;
  error_message: string | null;
  latency_ms: number | null;
  output: unknown;
  created_at: string;
  finished_at: string | null;
};

const agentLabel: Record<string, string> = {
  moderation: "Moderation Agent",
  admin_digest: "Admin Digest Agent",
  engineering: "Engineering Agent",
  support: "Support Agent",
  security: "Security Agent",
  listing_quality: "Listing Quality Agent",
  monetization: "Monetization Agent",
  marketing: "Marketing Agent",
  analytics: "Analytics Agent",
};

const ALL_AGENTS = Object.keys(agentLabel);

function formatLabel(agentName: string) {
  return agentLabel[agentName] || agentName;
}

function formatOutput(output: unknown): string {
  if (!output) return "-";
  try {
    return JSON.stringify(output);
  } catch {
    return "-";
  }
}

export default async function AdminAgentsPage() {
  const supabase = await createClient();

  const { data: allTasks } = await supabase
    .from("agent_tasks")
    .select(
      "id, agent_name, trigger_event, status, error_message, latency_ms, output, created_at, finished_at"
    )
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<TaskRow[]>();

  const rows = allTasks || [];

  const latestByAgent = new Map<string, TaskRow>();
  for (const row of rows) {
    if (!latestByAgent.has(row.agent_name)) {
      latestByAgent.set(row.agent_name, row);
    }
  }

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const failedCount24h = new Map<string, number>();
  for (const row of rows) {
    if (
      row.status === "failed" &&
      new Date(row.created_at).getTime() >= oneDayAgo
    ) {
      failedCount24h.set(
        row.agent_name,
        (failedCount24h.get(row.agent_name) || 0) + 1
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
        Status 9 Agent
      </h2>

      <div className="flex flex-col gap-2">
        {ALL_AGENTS.map((agentName) => {
          const latest = latestByAgent.get(agentName);
          const failCount = failedCount24h.get(agentName) || 0;

          return (
            <div
              key={agentName}
              className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{formatLabel(agentName)}</span>
                {latest ? (
                  <span
                    className={
                      latest.status === "success"
                        ? "text-xs font-medium text-green-700"
                        : latest.status === "failed"
                        ? "text-xs font-medium text-red-600"
                        : "text-xs font-medium text-amber-600"
                    }
                  >
                    {latest.status === "success"
                      ? "✓ Sukses"
                      : latest.status === "failed"
                      ? "✕ Gagal"
                      : "⏳ Berjalan"}
                  </span>
                ) : (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Belum pernah jalan
                  </span>
                )}
              </div>

              {latest ? (
                <>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Terakhir jalan: {new Date(latest.created_at).toLocaleString("id-ID")}
                    {latest.latency_ms != null ? ` • ${latest.latency_ms}ms` : ""}
                    {" • trigger: "}
                    {latest.trigger_event}
                  </span>
                  {failCount > 0 ? (
                    <span className="text-xs font-medium text-red-600">
                      ⚠️ {failCount}x gagal dalam 24 jam terakhir
                    </span>
                  ) : null}
                  {latest.status === "failed" && latest.error_message ? (
                    <span className="text-xs text-red-600">
                      {latest.error_message.slice(0, 200)}
                    </span>
                  ) : null}
                  {latest.status === "success" ? (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Output: {formatOutput(latest.output).slice(0, 200)}
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
          Riwayat Terbaru (Semua Agent)
        </h2>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Belum ada agent yang pernah jalan.
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          {rows.slice(0, 30).map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{formatLabel(row.agent_name)}</span>
                <span
                  className={
                    row.status === "success"
                      ? "font-medium text-green-700"
                      : row.status === "failed"
                      ? "font-medium text-red-600"
                      : "font-medium text-amber-600"
                  }
                >
                  {row.status === "success"
                    ? "✓ Sukses"
                    : row.status === "failed"
                    ? "✕ Gagal"
                    : "⏳ Berjalan"}
                </span>
              </div>
              <span className="text-[var(--muted-foreground)]">
                {row.trigger_event} •{" "}
                {row.latency_ms != null ? `${row.latency_ms}ms` : "-"} •{" "}
                {new Date(row.created_at).toLocaleString("id-ID")}
              </span>
              {row.error_message ? (
                <span className="text-red-600">{row.error_message.slice(0, 150)}</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
