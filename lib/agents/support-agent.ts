// PATH: lib/agents/support-agent.ts
// AKSI: BUAT FILE BARU (Agent Fase 4 — deteksi listing yang stuck di "pending" terlalu lama, cron-only)

import { createAdminClient } from "@/lib/supabase/admin";

const AGENT_NAME = "support";
const STUCK_THRESHOLD_HOURS = 48;

export async function runSupportAgent() {
  const supabase = createAdminClient();
  const startTime = Date.now();

  const { data: taskRow } = await supabase
    .from("agent_tasks")
    .insert({
      agent_name: AGENT_NAME,
      trigger_event: "cron.daily_stuck_check",
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  try {
    const thresholdTime = new Date(
      Date.now() - STUCK_THRESHOLD_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: stuckListings } = await supabase
      .from("listings")
      .select("id, title, created_at, ai_moderation_checked_at")
      .eq("status", "pending")
      .lt("created_at", thresholdTime)
      .order("created_at", { ascending: true })
      .limit(20);

    const summary = {
      stuckCount: stuckListings?.length || 0,
      stuckListingIds: (stuckListings || []).map((l) => l.id),
    };

    if (stuckListings && stuckListings.length > 0) {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      const titles = stuckListings
        .slice(0, 5)
        .map((l) => `"${l.title}"`)
        .join(", ");
      const extra =
        stuckListings.length > 5 ? ` dan ${stuckListings.length - 5} lainnya` : "";

      const message = `${stuckListings.length} listing sudah lebih dari ${STUCK_THRESHOLD_HOURS} jam menunggu peninjauan tanpa diproses: ${titles}${extra}. Mohon dicek manual.`;

      for (const admin of admins || []) {
        await supabase.from("notifications").insert({
          recipient_user_id: admin.id,
          title: "Listing Terlantar Butuh Perhatian",
          message,
          link: "/admin/listings",
        });
      }
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
