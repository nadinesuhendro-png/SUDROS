// AKSI: BUAT FILE BARU
// PATH: lib/agents/usage-guardian.ts

import { createAdminClient } from "@/lib/supabase/admin";

const WARNING_THRESHOLD_DAYS = 14;

// Limit Hobby plan Vercel (per bulan) — hardcode karena API billing
// belum tentu tersedia penuh di plan gratis
const VERCEL_HOBBY_LIMITS: Record<string, number> = {
  function_invocations: 1_000_000,
  edge_requests: 1_000_000,
  fast_data_transfer_gb: 100,
  build_minutes: 6_000,
};

interface UsagePoint {
  source: "vercel" | "supabase";
  metric: string;
  current: number;
  limit: number;
}

async function fetchVercelUsage(): Promise<UsagePoint[]> {
  const token = process.env.VERCEL_ACCESS_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token) return [];

  try {
    const url = teamId
      ? `https://api.vercel.com/v1/billing/charges?teamId=${teamId}`
      : "https://api.vercel.com/v1/billing/charges";
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error("Vercel usage API gagal:", res.status);
      return [];
    }

    const text = await res.text();
    const lines = text.trim().split("\n").filter(Boolean);
    const events = lines.map((l) => JSON.parse(l));

    const totals: Record<string, number> = {};
    for (const e of events) {
      const key = e?.metric ?? e?.name;
      const qty = Number(e?.quantity ?? 0);
      if (!key) continue;
      totals[key] = (totals[key] ?? 0) + qty;
    }

    const points: UsagePoint[] = [];
    for (const [metric, limit] of Object.entries(VERCEL_HOBBY_LIMITS)) {
      if (totals[metric] !== undefined) {
        points.push({ source: "vercel", metric, current: totals[metric], limit });
      }
    }
    return points;
  } catch (err) {
    console.error("Vercel usage fetch error:", err);
    return [];
  }
}

async function fetchSupabaseUsage(): Promise<UsagePoint[]> {
  const supabase = createAdminClient();
  const points: UsagePoint[] = [];

  // DB size — Free tier Supabase limit 500MB
  const { data, error } = await supabase
    .rpc("get_database_size_bytes")
    .single<{ size_bytes: number }>();

  if (!error && data) {
    points.push({
      source: "supabase",
      metric: "database_size_mb",
      current: Math.round(data.size_bytes / 1024 / 1024),
      limit: 500,
    });
  }

  return points;
}

function projectDaysRemaining(
  currentValue: number,
  limitValue: number,
  previousValue: number,
  daysBetween: number
): number | null {
  const dailyRate = (currentValue - previousValue) / daysBetween;
  if (dailyRate <= 0) return null;
  const remaining = (limitValue - currentValue) / dailyRate;
  return remaining > 0 ? Math.round(remaining) : 0;
}

export async function runUsageGuardian() {
  const supabase = createAdminClient();
  const points = [...(await fetchVercelUsage()), ...(await fetchSupabaseUsage())];

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  for (const point of points) {
    const percentUsed = Math.round((point.current / point.limit) * 100);

    // Simpan snapshot hari ini
    await supabase.from("system_usage_snapshots").insert({
      source: point.source,
      metric: point.metric,
      current_value: point.current,
      limit_value: point.limit,
      percent_used: percentUsed,
    });

    // Ambil snapshot ~7 hari lalu buat hitung tren
    const { data: pastSnapshot } = await supabase
      .from("system_usage_snapshots")
      .select("current_value, captured_at")
      .eq("source", point.source)
      .eq("metric", point.metric)
      .lte("captured_at", sevenDaysAgo)
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ current_value: number; captured_at: string }>();

    if (!pastSnapshot) continue;

    const daysBetween =
      (Date.now() - new Date(pastSnapshot.captured_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysBetween < 1) continue;

    const daysRemaining = projectDaysRemaining(
      point.current,
      point.limit,
      pastSnapshot.current_value,
      daysBetween
    );

    if (daysRemaining !== null && daysRemaining <= WARNING_THRESHOLD_DAYS) {
      // Cek jangan spam alert yang sama dalam 24 jam terakhir
      const { data: existingAlert } = await supabase
        .from("system_usage_alerts")
        .select("id")
        .eq("source", point.source)
        .eq("metric", point.metric)
        .eq("resolved", false)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (!existingAlert) {
        await supabase.from("system_usage_alerts").insert({
          source: point.source,
          metric: point.metric,
          message: `${point.source} — ${point.metric}: diprediksi limit habis dalam ~${daysRemaining} hari (saat ini ${percentUsed}% terpakai)`,
          projected_days_remaining: daysRemaining,
        });
      }
    }
  }
  }
