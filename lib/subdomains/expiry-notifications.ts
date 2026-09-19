// AKSI: BUAT FILE BARU
// PATH: lib/subdomains/expiry-notifications.ts

import { createAdminClient } from "@/lib/supabase/admin";

const GRACE_PERIOD_DAYS = 7;

interface SubdomainRow {
  id: string;
  owner_id: string;
  subdomain: string;
  status: string;
  expires_at: string | null;
  grace_started_at: string | null;
  last_notice_date: string | null;
}

function todayJakartaDateString(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function daysBetween(later: Date, earlier: Date): number {
  return Math.ceil((later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24));
}

export async function runSubdomainExpiryNotifications() {
  const supabase = createAdminClient();
  const today = todayJakartaDateString();
  const now = new Date();

  // 1. active -> grace_period kalau sudah lewat expires_at
  const { data: expiredActive } = await supabase
    .from("seller_subdomains")
    .select("id")
    .eq("status", "active")
    .lt("expires_at", now.toISOString());

  if (expiredActive && expiredActive.length > 0) {
    await supabase
      .from("seller_subdomains")
      .update({ status: "grace_period", grace_started_at: now.toISOString() })
      .in("id", expiredActive.map((r) => r.id));
  }

  // 2. grace_period -> expired kalau masa tenggang 7 hari habis (subdomain dilepas)
  const graceDeadline = new Date(
    now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  await supabase
    .from("seller_subdomains")
    .update({ status: "expired" })
    .eq("status", "grace_period")
    .lt("grace_started_at", graceDeadline);

  // 3. Peringatan H-3 / H-2 / H-1 buat yang masih aktif
  const { data: activeRows } = await supabase
    .from("seller_subdomains")
    .select("id, owner_id, subdomain, status, expires_at, grace_started_at, last_notice_date")
    .eq("status", "active")
    .returns<SubdomainRow[]>();

  for (const row of activeRows ?? []) {
    if (!row.expires_at || row.last_notice_date === today) continue;
    const daysLeft = daysBetween(new Date(row.expires_at), now);

    if (daysLeft === 3 || daysLeft === 2 || daysLeft === 1) {
      await supabase.from("notifications").insert({
        recipient_user_id: row.owner_id,
        type: "subdomain_expiring",
        title: "Subdomain akan berakhir",
        message: `Subdomain ${row.subdomain}.sudros.id akan berakhir dalam ${daysLeft} hari. Perpanjang sekarang di menu Subdomain Toko.`,
        reference_type: "seller_subdomains",
        reference_id: row.id,
      });
      await supabase
        .from("seller_subdomains")
        .update({ last_notice_date: today })
        .eq("id", row.id);
    }
  }

  // 4. Peringatan harian selama masa tenggang
  const { data: graceRows } = await supabase
    .from("seller_subdomains")
    .select("id, owner_id, subdomain, status, expires_at, grace_started_at, last_notice_date")
    .eq("status", "grace_period")
    .returns<SubdomainRow[]>();

  for (const row of graceRows ?? []) {
    if (row.last_notice_date === today) continue;
    const graceStart = row.grace_started_at ? new Date(row.grace_started_at) : now;
    const daysIntoGrace = daysBetween(now, graceStart);
    const daysRemainingGrace = Math.max(GRACE_PERIOD_DAYS - daysIntoGrace, 0);

    await supabase.from("notifications").insert({
      recipient_user_id: row.owner_id,
      type: "subdomain_grace_period",
      title: "Subdomain dalam masa tenggang",
      message: `Subdomain ${row.subdomain}.sudros.id sudah berakhir dan dalam masa tenggang. Sisa ${daysRemainingGrace} hari sebelum subdomain dilepas — perpanjang sekarang di menu Subdomain Toko.`,
      reference_type: "seller_subdomains",
      reference_id: row.id,
    });
    await supabase
      .from("seller_subdomains")
      .update({ last_notice_date: today })
      .eq("id", row.id);
  }
    }
