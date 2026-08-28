// PATH: lib/agents/listing-quality-agent.ts
// AKSI: BUAT FILE BARU (Agent Fase 6 — cek kualitas listing baru, notifikasi saran ke pemilik, cron-only)

import { createAdminClient } from "@/lib/supabase/admin";

const AGENT_NAME = "listing_quality";
const MIN_DESCRIPTION_LENGTH = 20;
const CHECK_WINDOW_HOURS = 24;

type ListingRow = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  listing_images: { id: string }[];
};

export async function runListingQualityAgent() {
  const supabase = createAdminClient();
  const startTime = Date.now();

  const { data: taskRow } = await supabase
    .from("agent_tasks")
    .insert({
      agent_name: AGENT_NAME,
      trigger_event: "cron.daily_quality_check",
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  try {
    const windowStart = new Date(
      Date.now() - CHECK_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: recentListings } = await supabase
      .from("listings")
      .select("id, title, description, owner_id, listing_images(id)")
      .gte("created_at", windowStart)
      .in("status", ["active", "pending"])
      .returns<ListingRow[]>();

    let notified = 0;

    for (const listing of recentListings || []) {
      const issues: string[] = [];

      if (!listing.listing_images || listing.listing_images.length === 0) {
        issues.push("belum ada foto");
      }
      if (
        !listing.description ||
        listing.description.trim().length < MIN_DESCRIPTION_LENGTH
      ) {
        issues.push("deskripsi terlalu singkat");
      }

      if (issues.length === 0) continue;

      const message = `Listing "${listing.title}" kamu ${issues.join(
        " dan "
      )}. Tambahkan foto yang jelas dan deskripsi lengkap supaya lebih menarik pembeli!`;

      await supabase.from("notifications").insert({
        recipient_user_id: listing.owner_id,
        title: "Tips: Lengkapi Listing Kamu",
        message,
        link: `/dashboard/listings/${listing.id}/edit`,
      });

      notified += 1;
    }

    const summary = {
      checked: recentListings?.length || 0,
      notified,
    };

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
