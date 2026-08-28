// PATH: lib/agents/security-agent.ts
// AKSI: BUAT FILE BARU (Agent Fase 5 — deteksi listing multi-laporan & pola spam pembuatan listing, cron-only)

import { createAdminClient } from "@/lib/supabase/admin";

const AGENT_NAME = "security";
const MULTI_REPORT_THRESHOLD = 2;
const SPAM_LISTING_THRESHOLD = 5;
const SPAM_WINDOW_HOURS = 1;

export async function runSecurityAgent() {
  const supabase = createAdminClient();
  const startTime = Date.now();

  const { data: taskRow } = await supabase
    .from("agent_tasks")
    .insert({
      agent_name: AGENT_NAME,
      trigger_event: "cron.daily_security_scan",
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  try {
    const messageLines: string[] = [];

    const { data: pendingReports } = await supabase
      .from("reports")
      .select("listing_id, listings(title)")
      .eq("status", "pending");

    const reportCountByListing = new Map<
      string,
      { count: number; title: string }
    >();
    for (const r of pendingReports || []) {
      const listingTitle =
        (r.listings as unknown as { title: string } | null)?.title || "?";
      const existing = reportCountByListing.get(r.listing_id) || {
        count: 0,
        title: listingTitle,
      };
      existing.count += 1;
      reportCountByListing.set(r.listing_id, existing);
    }

    const multiReportListings = Array.from(reportCountByListing.entries())
      .filter(([, v]) => v.count >= MULTI_REPORT_THRESHOLD)
      .map(([id, v]) => ({ id, ...v }));

    for (const listing of multiReportListings) {
      messageLines.push(
        `🚨 Listing "${listing.title}" menerima ${listing.count} laporan — butuh peninjauan segera`
      );
    }

    const windowStart = new Date(
      Date.now() - SPAM_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: recentListings } = await supabase
      .from("listings")
      .select("owner_id, profiles(username)")
      .gte("created_at", windowStart);

    const countByOwner = new Map<
      string,
      { count: number; username: string }
    >();
    for (const l of recentListings || []) {
      const username =
        (l.profiles as unknown as { username: string } | null)?.username ||
        "?";
      const existing = countByOwner.get(l.owner_id) || {
        count: 0,
        username,
      };
      existing.count += 1;
      countByOwner.set(l.owner_id, existing);
    }

    const spammyOwners = Array.from(countByOwner.entries())
      .filter(([, v]) => v.count >= SPAM_LISTING_THRESHOLD)
      .map(([id, v]) => ({ id, ...v }));

    for (const owner of spammyOwners) {
      messageLines.push(
        `🚨 User "${owner.username}" membuat ${owner.count} listing dalam ${SPAM_WINDOW_HOURS} jam terakhir — kemungkinan spam`
      );
    }

    if (messageLines.length > 0) {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      for (const admin of admins || []) {
        await supabase.from("notifications").insert({
          recipient_user_id: admin.id,
          title: "Peringatan Keamanan Platform",
          message: messageLines.join("\n"),
          link: "/admin/reports",
        });
      }
    }

    const summary = {
      multiReportListings,
      spammyOwners,
      alertsSent: messageLines.length,
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
