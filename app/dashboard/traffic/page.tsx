import { createClient } from "@/lib/supabase/server";

type Stats = { views: number; unique_visitors: number };
type SeriesRow = { bucket_start: string; views: number; unique_visitors: number };

function fmt(n: number) {
  return n.toLocaleString("id-ID");
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

async function getStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sellerId: string,
  since: string | null
): Promise<Stats> {
  const { data, error } = await supabase
    .rpc("get_traffic_stats", { p_seller_id: sellerId, p_since: since })
    .single<Stats>();
  if (error || !data) return { views: 0, unique_visitors: 0 };
  return data;
}

export default async function DashboardTrafficPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sellerId = user!.id;

  const [today, last7, last30, lastYear, allTime] = await Promise.all([
    getStats(supabase, sellerId, startOfToday()),
    getStats(supabase, sellerId, daysAgo(7)),
    getStats(supabase, sellerId, daysAgo(30)),
    getStats(supabase, sellerId, daysAgo(365)),
    getStats(supabase, sellerId, null),
  ]);

  const { data: seriesData } = await supabase.rpc("get_traffic_series", {
    p_seller_id: sellerId,
    p_since: daysAgo(30),
    p_bucket: "day",
  });

  const chartRows = (seriesData as SeriesRow[] | null) || [];
  const maxViews = Math.max(1, ...chartRows.map((r) => r.views));

  const cards = [
    { label: "Hari ini", stats: today },
    { label: "7 hari terakhir", stats: last7 },
    { label: "30 hari terakhir", stats: last30 },
    { label: "1 tahun terakhir", stats: lastYear },
    { label: "Sejak toko dibuat", stats: allTime },
  ];

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--primary-dark)" }}>
          Traffic Toko Saya
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Berapa banyak orang yang mengunjungi halaman toko kamu
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-[var(--radius)] border p-4"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
          >
            <p className="text-xs text-[var(--muted-foreground)]">{card.label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: "var(--primary-dark)" }}>
              {fmt(card.stats.views)}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">kunjungan</p>
            <p className="mt-2 text-sm font-medium text-[var(--card-foreground)]">
              {fmt(card.stats.unique_visitors)}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">pengunjung unik</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)]">
          Kunjungan Harian (30 Hari Terakhir)
        </h2>
        {chartRows.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Belum ada kunjungan ke toko kamu.
          </p>
        ) : (
          <div className="flex h-40 items-end gap-1 overflow-x-auto">
            {chartRows.map((row) => {
              const heightPercent = (row.views / maxViews) * 100;
              const dateLabel = new Date(row.bucket_start).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit",
              });
              return (
                <div
                  key={row.bucket_start}
                  className="flex min-w-[20px] flex-1 flex-col items-center justify-end gap-1"
                  title={`${dateLabel}: ${row.views} kunjungan, ${row.unique_visitors} unik`}
                >
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${Math.max(heightPercent, 2)}%`,
                      backgroundColor: "var(--primary)",
                    }}
                  />
                  <span className="text-[9px] text-[var(--muted-foreground)]">{dateLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
          }
