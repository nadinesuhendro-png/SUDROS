// PATH: lib/agents/monetization-agent.ts
// AKSI: UPDATE FILE (tambah peringatan paket SUDAH expired, diulang tiap hari selama grace period 3 hari — reminder H-3 sebelum expired tetap dipertahankan)

import { createAdminClient } from "@/lib/supabase/admin";

const AGENT_NAME = "monetization";
const EXPIRY_REMINDER_DAYS = 3;
const EXPIRED_GRACE_DAYS = 3;
const STUCK_ORDER_HOURS = 24;

export async function runMonetizationAgent() {
  const supabase = createAdminClient();
  const startTime = Date.now();

  const { data: taskRow } = await supabase
    .from("agent_tasks")
    .insert({
      agent_name: AGENT_NAME,
      trigger_event: "cron.daily_monetization_check",
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  try {
    let expiryReminders = 0;
    let expiredWarnings = 0;
    let stuckOrderAlerts = 0;

    const now = new Date();

    const reminderWindowEnd = new Date(
      now.getTime() + EXPIRY_REMINDER_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: expiringPackages } = await supabase
      .from("user_active_packages")
      .select("id, user_id, expires_at, advertising_packages(name)")
      .gte("expires_at", now.toISOString())
      .lte("expires_at", reminderWindowEnd);

    for (const pkg of expiringPackages || []) {
      const packageName =
        (pkg.advertising_packages as unknown as { name: string } | null)
          ?.name || "Paket";
      const expiresDate = new Date(pkg.expires_at).toLocaleDateString(
        "id-ID",
        { day: "numeric", month: "long", year: "numeric" }
      );

      await supabase.from("notifications").insert({
        recipient_user_id: pkg.user_id,
        title: "Paket Kamu Akan Berakhir",
        message: `Paket "${packageName}" kamu akan berakhir pada ${expiresDate}. Perpanjang sekarang supaya listing kamu tetap terpromosikan.`,
        link: "/pricing",
      });

      expiryReminders += 1;
    }

    const graceWindowStart = new Date(
      now.getTime() - EXPIRED_GRACE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: expiredPackages } = await supabase
      .from("user_active_packages")
      .select("id, user_id, expires_at, advertising_packages(name)")
      .lt("expires_at", now.toISOString())
      .gte("expires_at", graceWindowStart);

    for (const pkg of expiredPackages || []) {
      const packageName =
        (pkg.advertising_packages as unknown as { name: string } | null)
          ?.name || "Paket";
      const daysAgo = Math.max(
        1,
        Math.ceil(
          (now.getTime() - new Date(pkg.expires_at).getTime()) /
            (24 * 60 * 60 * 1000)
        )
      );

      await supabase.from("notifications").insert({
        recipient_user_id: pkg.user_id,
        title: "Paket Kamu Sudah Habis",
        message: `Paket "${packageName}" kamu sudah habis sejak ${daysAgo} hari lalu. Segera perpanjang supaya listing kamu tidak kehilangan promosi.`,
        link: "/pricing",
      });

      expiredWarnings += 1;
    }

    const stuckThreshold = new Date(
      Date.now() - STUCK_ORDER_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: stuckOrders } = await supabase
      .from("advertising_orders")
      .select("id, user_id, payment_status, created_at")
      .eq("payment_status", "pending")
      .lt("created_at", stuckThreshold);

    if (stuckOrders && stuckOrders.length > 0) {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      const message = `${stuckOrders.length} order pembayaran sudah lebih dari ${STUCK_ORDER_HOURS} jam berstatus pending. Cek apakah butuh follow-up ke pembeli atau verifikasi manual.`;

      for (const admin of admins || []) {
        await supabase.from("notifications").insert({
          recipient_user_id: admin.id,
          title: "Order Pembayaran Menumpuk",
          message,
          link: "/admin/payments",
        });
      }

      stuckOrderAlerts = stuckOrders.length;
    }

    const summary = { expiryReminders, expiredWarnings, stuckOrderAlerts };
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
