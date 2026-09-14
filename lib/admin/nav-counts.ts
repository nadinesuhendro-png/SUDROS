import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

type ViewedMap = Partial<Record<keyof AdminNavCounts, string>>;

async function getViewedMap(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  adminUserId: string
): Promise<ViewedMap> {
  try {
    const { data } = await supabaseAdmin
      .from("admin_nav_views")
      .select("category, last_viewed_at")
      .eq("admin_user_id", adminUserId);

    const map: ViewedMap = {};
    (data || []).forEach((row: { category: string; last_viewed_at: string }) => {
      map[row.category as keyof AdminNavCounts] = row.last_viewed_at;
    });
    return map;
  } catch {
    return {};
  }
}

export async function getAdminNavCounts(): Promise<AdminNavCounts> {
  const sessionSupabase = await createClient();
  const {
    data: { user },
  } = await sessionSupabase.auth.getUser();

  if (!user) {
    return EMPTY_COUNTS;
  }

  const supabase = createAdminClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const viewed = await getViewedMap(supabase, user.id);

  const [listings, users, reports, payments, agents, feedback] =
    await Promise.all([
      safeCount(async () => {
        let q = supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        if (viewed.listings) q = q.gt("created_at", viewed.listings);
        return q;
      }),
      safeCount(async () => {
        let q = supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since24h);
        if (viewed.users) q = q.gt("created_at", viewed.users);
        return q;
      }),
      safeCount(async () => {
        let q = supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        if (viewed.reports) q = q.gt("created_at", viewed.reports);
        return q;
      }),
      safeCount(async () => {
        let q = supabase
          .from("advertising_orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        if (viewed.payments) q = q.gt("created_at", viewed.payments);
        return q;
      }),
      safeCount(async () => {
        let q = supabase
          .from("agent_tasks")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed")
          .gte("created_at", since24h);
        if (viewed.agents) q = q.gt("created_at", viewed.agents);
        return q;
      }),
      safeCount(async () => {
        let q = supabase
          .from("feedback")
          .select("id", { count: "exact", head: true })
          .eq("is_read", false)
          .eq("is_deleted", false);
        if (viewed.feedback) q = q.gt("created_at", viewed.feedback);
        return q;
      }),
    ]);

  return { listings, users, reports, payments, agents, feedback };
}

// Dipanggil dari tiap halaman admin (reports/users/listings/payments/agents/feedback)
// saat halaman dibuka, supaya badge kategori itu langsung hilang di kunjungan berikutnya.
export async function markAdminSectionViewed(category: keyof AdminNavCounts) {
  const sessionSupabase = await createClient();
  const {
    data: { user },
  } = await sessionSupabase.auth.getUser();

  if (!user) return;

  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.from("admin_nav_views").upsert(
    {
      admin_user_id: user.id,
      category,
      last_viewed_at: new Date().toISOString(),
    },
    { onConflict: "admin_user_id,category" }
  );
}

export { EMPTY_COUNTS };
