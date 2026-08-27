// PATH: app/admin/ai-usage/page.tsx
// AKSI: BUAT FILE BARU

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "../AdminNav";

type UsageRow = {
  task: string;
  status: string;
  latency_ms: number | null;
};

type RecentRow = {
  task: string;
  status: string;
  model: string | null;
  latency_ms: number | null;
  error_message: string | null;
  created_at: string;
};

const taskLabel: Record<string, string> = {
  "listing.generate_title_description": "Listing AI (Judul & Deskripsi)",
  "marketing.generate_caption": "Marketing AI (Caption)",
  "moderation.analyze_listing": "Moderation AI (Analisis Listing)",
};

function formatTaskLabel(task: string) {
  return taskLabel[task] || task;
}

export default async function AdminAIUsagePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!myProfile || myProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  const [{ count: totalAllTime }, { count: totalToday }, { count: errorsToday }, { data: allRows }, { data: recentRows }] =
    await Promise.all([
      supabase.from("ai_usage").select("*", { count: "exact", head: true }),
      supabase
        .from("ai_usage")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart),
      supabase
        .from("ai_usage")
        .select("*", { count: "exact", head: true })
        .eq("status", "error")
        .gte("created_at", todayStart),
      supabase
        .from("ai_usage")
        .select("task, status, latency_ms")
        .returns<UsageRow[]>(),
      supabase
        .from("ai_usage")
        .select("task, status, model, latency_ms, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(20)
        .returns<RecentRow[]>(),
    ]);

  const rows = allRows || [];

  const byTask: Record<
    string,
    { total: number; success: number; error: number; latencySum: number; latencyCount: number }
  > = {};

  for (const row of rows) {
    if (!byTask[row.task]) {
      byTask[row.task] = { total: 0, success: 0, error: 0, latencySum: 0, latencyCount: 0 };
    }
    byTask[row.task].total += 1;
    if (row.status === "success") byTask[row.task].success += 1;
    if (row.status === "error") byTask[row.task].error += 1;
    if (row.latency_ms != null) {
      byTask[row.task].latencySum += row.latency_ms;
      byTask[row.task].latencyCount += 1;
    }
  }

  const taskStats = Object.entries(byTask).map(([task, s]) => ({
    task,
    total: s.total,
    successRate: s.total > 0 ? Math.round((s.success / s.total) * 100) : 0,
    avgLatency: s.latencyCount > 0 ? Math.round(s.latencySum / s.latencyCount) : null,
  }));

  const overallStats = [
    { label: "Total Pemakaian AI (Semua Waktu)", value: totalAllTime || 0 },
    { label: "Pemakaian Hari Ini", value: totalToday || 0 },
    { label: "Error Hari Ini", value: errorsToday || 0 },
  ];

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <h1
        className="text-lg font-semibold"
        style={{ color: "var(--primary-dark)" }}
      >
        AI Usage
      </h1>

      <AdminNav />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {overallStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[var(--radius)] border border-gray-200 p-4"
          >
            <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
              {stat.value}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
          Per Task
        </h2>
        {taskStats.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Belum ada pemakaian AI.
          </p>
        ) : null}
        {taskStats.map((stat) => (
          <div
            key={stat.task}
            className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3 text-sm"
          >
            <span className="font-medium">{formatTaskLabel(stat.task)}</span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {stat.total} request • {stat.successRate}% sukses
              {stat.avgLatency != null ? ` • rata-rata ${stat.avgLatency}ms` : ""}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
          Aktivitas Terbaru
        </h2>
        {(recentRows || []).length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Belum ada aktivitas.</p>
        ) : null}
        <div className="flex flex-col gap-2">
          {(recentRows || []).map((row, i) => (
            <div
              key={i}
              className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{formatTaskLabel(row.task)}</span>
                <span
                  className={
                    row.status === "success"
                      ? "font-medium text-green-700"
                      : "font-medium text-red-600"
                  }
                >
                  {row.status === "success" ? "✓ Sukses" : "✕ Error"}
                </span>
              </div>
              <span className="text-[var(--muted-foreground)]">
                {row.model || "-"} • {row.latency_ms != null ? `${row.latency_ms}ms` : "-"} •{" "}
                {new Date(row.created_at).toLocaleString("id-ID")}
              </span>
              {row.error_message ? (
                <span className="text-red-600">{row.error_message.slice(0, 150)}</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
      }
