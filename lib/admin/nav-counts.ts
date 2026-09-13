import { createAdminClient } from "@/lib/supabase/admin";

export type AdminNavCounts = {
  listings: number;
  users: number;
  reports: number;
  payments: number;
  agents: number;
  feedback: number;
};

const EMPTY_COUNTS: AdminNavCounts = {
  listings: 0,
  users: 0,
  reports: 0,
  payments: 0,
  agents: 0,
  feedback: 0,
};

// Semua query dibuat "gagal aman": kalau satu query error (misal kolom belum ada),
// count-nya jatuh ke 0 dan tidak menjatuhkan seluruh admin panel.
async function safeCount(
  queryFn: () => Promise<{ count: number | null; error: unknown }>
): Promise<number> {
  try {
    const { count, error } = await queryFn();
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getAdminNavCounts(): Promise<AdminNavCounts> {
  const supabase = createAdminClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [listings, users, reports, payments, agents, feedback] =
    await Promise.all([
      safeCount(async () => {
        const result = await supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        return result;
      }),
      safeCount(async () => {
        const result = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since24h);
        return result;
      }),
      safeCount(async () => {
        const result = await supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        return result;
      }),
      safeCount(async () => {
        const result = await supabase
          .from("advertising_orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        return result;
      }),
      safeCount(async () => {
        const result = await supabase
          .from("agent_tasks")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed")
          .gte("created_at", since24h);
        return result;
      }),
      safeCount(async () => {
        const result = await supabase
          .from("feedback")
          .select("id", { count: "exact", head: true })
          .eq("is_read", false);
        return result;
      }),
    ]);

  return { listings, users, reports, payments, agents, feedback };
}

export { EMPTY_COUNTS };
