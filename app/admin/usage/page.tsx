// AKSI: BUAT FILE BARU
// PATH: app/admin/usage/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";

interface SnapshotRow {
  source: string;
  metric: string;
  current_value: number;
  limit_value: number;
  percent_used: number;
  captured_at: string;
}

interface AlertRow {
  id: string;
  source: string;
  metric: string;
  message: string;
  projected_days_remaining: number | null;
  created_at: string;
}

function statusEmoji(percentUsed: number) {
  if (percentUsed >= 90) return "\u{1F534}";
  if (percentUsed >= 70) return "\u{1F7E0}";
  if (percentUsed >= 40) return "\u{1F7E1}";
  return "\u{1F7E2}";
}

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "12px",
};

const alertStyle = {
  border: "1px solid #f59e0b",
  background: "#fffbeb",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "12px",
};

const pageStyle = {
  maxWidth: "640px",
  margin: "0 auto",
  padding: "24px 16px",
};

export default async function UsageMonitorPage() {
  const supabase = createAdminClient();

  const { data: allSnapshots } = await supabase
    .from("system_usage_snapshots")
    .select("source, metric, current_value, limit_value, percent_used, captured_at")
    .order("captured_at", { ascending: false })
    .returns<SnapshotRow[]>();

  const latestByMetric = new Map<string, SnapshotRow>();
  for (const row of allSnapshots ?? []) {
    const key = `${row.source}:${row.metric}`;
    if (!latestByMetric.has(key)) {
      latestByMetric.set(key, row);
    }
  }

  const { data: alerts } = await supabase
    .from("system_usage_alerts")
    .select("id, source, metric, message, projected_days_remaining, created_at")
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .returns<AlertRow[]>();

  return (
    <div style={pageStyle}>
      <h1>Monitor Limit Vercel &amp; Supabase</h1>

      {alerts && alerts.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h2>Peringatan Aktif</h2>
          {alerts.map((alert) => (
            <div key={alert.id} style={alertStyle}>
              <strong>{alert.source} — {alert.metric}</strong>
              <p>{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      <h2>Status Terkini</h2>
      {Array.from(latestByMetric.values()).map((snap) => (
        <div key={`${snap.source}:${snap.metric}`} style={cardStyle}>
          <div>
            {statusEmoji(snap.percent_used)} <strong>{snap.source} — {snap.metric}</strong>
          </div>
          <div>
            {snap.current_value.toLocaleString("id-ID")} / {snap.limit_value.toLocaleString("id-ID")} ({snap.percent_used}%)
          </div>
        </div>
      ))}

      {latestByMetric.size === 0 && (
        <p>Belum ada data — cron pertama akan jalan sesuai jadwal di vercel.json.</p>
      )}
    </div>
  );
      }
