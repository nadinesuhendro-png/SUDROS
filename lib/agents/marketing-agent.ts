// PATH: lib/agents/marketing-agent.ts
// AKSI: BUAT FILE BARU (Agent Fase 8 — dorong promosi listing sepi, cron-only, TIDAK pakai Gemini)

import { createAdminClient } from "@/lib/supabase/admin";

const AGENT_NAME = "marketing";
const MIN_AGE_DAYS = 3;
const MAX_AGE_DAYS = 4; // jendela sempit supaya tidak berulang tiap hari untuk listing yang sama
const LOW_VIEWS_THRESHOLD = 5;

export async function runMarketingAgent() {
  const supabase = createAdminClient();
  const startTime = Date.now();

  const { data: taskRow } = await supabase
    .from("agent_tasks")
    .insert({
      agent_name: AGENT_NAME,
      trigger_event: "cron.daily_promo_nudge",
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  try {
    const windowStart = new Date(
      Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();
    const windowEnd = new Date(
      Date.now() - MIN_AGE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: quietListings } = await supabase
      .from("listings")
      .select("id, title, owner_id, views_count, whatsapp_clicks_count")
      .eq("status", "active")
      .gte("created_at", windowStart)
      .lte("created_at", windowEnd)
      .lt("views_count", LOW_VIEWS_THRESHOLD)
      .eq("whatsapp_clicks_count", 0);

    let notified = 0;

    for (const listing of quietListings || []) {
      await supabase.from("notifications").insert({
        recipient_user_id: listing.owner_id,
        title: "Promosikan Listing Kamu",
        message: `Listing "${listing.title}" masih sepi peminat. Coba buat caption promosi dan bagikan ke grup WhatsApp atau media sosial supaya lebih banyak dilihat!`,
        link: `/dashboard/listings`,
      });
      notified += 1;
    }

    const summary = { checked: quietListings?.length || 0, notified };
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
