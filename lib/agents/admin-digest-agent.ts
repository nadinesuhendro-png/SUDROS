// PATH: lib/agents/admin-digest-agent.ts
// AKSI: BUAT FILE BARU (Agent Fase 2 — ringkasan harian, cron-only, tidak pakai Gemini sama sekali)

import { createAdminClient } from "@/lib/supabase/admin";

const AGENT_NAME = "admin_digest";

export async function runAdminDigestAgent() {
  const supabase = createAdminClient();
  const startTime = Date.now();

  const { data: taskRow } = await supabase
    .from("agent_tasks")
    .insert({
      agent_name: AGENT_NAME,
      trigger_event: "cron.daily_digest",
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      newListings24h,
      pendingListings,
      unresolvedReports,
      pendingPayments,
      failedAgentTasks24h,
    ] = await Promise.all([
      supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneDayAgo),
      supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("advertising_orders")
        .select("*", { count: "exact", head: true })
        .eq("payment_status", "pending"),
      supabase
        .from("agent_tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("created_at", oneDayAgo),
    ]);

    const summary = {
      newListings24h: newListings24h.count || 0,
      pendingListings: pendingListings.count || 0,
      unresolvedReports: unresolvedReports.count || 0,
      pendingPayments: pendingPayments.count || 0,
      failedAgentTasks24h: failedAgentTasks24h.count || 0,
    };

    const messageLines = [
      `📦 ${summary.newListings24h} listing baru (24 jam terakhir)`,
      `⏳ ${summary.pendingListings} listing menunggu peninjauan`,
      `🚩 ${summary.unresolvedReports} laporan belum diselesaikan`,
      `💳 ${summary.pendingPayments} pembayaran menunggu verifikasi`,
      `⚠️ ${summary.failedAgentTasks24h} task AI agent gagal (24 jam terakhir)`,
    ];

    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    for (const admin of admins || []) {
      await supabase.from("notifications").insert({
        recipient_user_id: admin.id,
        title: "Ringkasan Harian SUDROS",
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
