// PATH: lib/agents/analytics-agent.ts
// AKSI: BUAT FILE BARU (Agent Fase 9 — laporan mingguan pertumbuhan platform, cron-only, TIDAK pakai Gemini)

import { createAdminClient } from "@/lib/supabase/admin";

const AGENT_NAME = "analytics";
const REPORT_INTERVAL_DAYS = 7;

export async function runAnalyticsAgent() {
  const supabase = createAdminClient();
  const startTime = Date.now();

  const { data: taskRow } = await supabase
    .from("agent_tasks")
    .insert({
      agent_name: AGENT_NAME,
      trigger_event: "cron.weekly_report_check",
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  try {
    const { data: lastReport } = await supabase
      .from("agent_tasks")
      .select("finished_at")
      .eq("agent_name", AGENT_NAME)
      .eq("status", "success")
      .not("output", "is", null)
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const intervalMs = REPORT_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
    const shouldSkip =
      lastReport?.finished_at &&
      Date.now() - new Date(lastReport.finished_at).getTime() < intervalMs;

    if (shouldSkip) {
      const latency = Date.now() - startTime;
      if (taskRow) {
        await supabase
          .from("agent_tasks")
          .update({
            status: "success",
            output: { skipped: true, reason: "belum 7 hari sejak laporan terakhir" },
            latency_ms: latency,
            finished_at: new Date().toISOString(),
          })
          .eq("id", taskRow.id);
      }
      return { ok: true, summary: { skipped: true } };
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      newListingsWeek,
      newUsersWeek,
      paidOrdersWeek,
      totalActiveListings,
      totalUsers,
    ] = await Promise.all([
      supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      supabase
        .from("advertising_orders")
        .select("*", { count: "exact", head: true })
        .eq("payment_status", "paid")
        .gte("created_at", weekAgo),
      supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

    const summary = {
      newListingsWeek: newListingsWeek.count || 0,
      newUsersWeek: newUsersWeek.count || 0,
      paidOrdersWeek: paidOrdersWeek.count || 0,
      totalActiveListings: totalActiveListings.count || 0,
      totalUsers: totalUsers.count || 0,
    };

    const messageLines = [
      `📈 ${summary.newListingsWeek} listing baru minggu ini`,
      `👤 ${summary.newUsersWeek} user baru minggu ini`,
      `💰 ${summary.paidOrdersWeek} order iklan lunas minggu ini`,
      `📦 Total ${summary.totalActiveListings} listing aktif`,
      `👥 Total ${summary.totalUsers} user terdaftar`,
    ];

    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    for (const admin of admins || []) {
      await supabase.from("notifications").insert({
        recipient_user_id: admin.id,
        title: "Laporan Mingguan SUDROS",
        message: messageLines.join("\n"),
        link: "/admin",
      });
    }

    const latency = Date.now() - startTime;

    if (taskRow) {
      await supabase
        .from("agent_tasks")
        .update({
          status: "success",
          output: summary,
          latency_ms: latency,
          finished_at: new Date().toISOString(),
        })
        .eq("id", taskRow.id);
    }

    return { ok: true, summary };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    if (taskRow) {
      await supabase
        .from("agent_tasks")
        .update({
          status: "failed",
          error_message: errorMessage.slice(0, 500),
          latency_ms: Date.now() - startTime,
          finished_at: new Date().toISOString(),
        })
        .eq("id", taskRow.id);
    }

    return { ok: false, error: errorMessage };
  }
      }
