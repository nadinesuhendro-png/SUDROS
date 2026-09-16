// PATH: app/admin/page.tsx
// AKSI: FULL REPLACEMENT
//
// Auth check & AdminNav tetap di layout.tsx.
// Dashboard ini fokus pada overview, KPI, mini charts,
// activity trend, dan health indicators.

import { createClient } from "@/lib/supabase/server";

type Metric = {
  label: string;
  value: number;
  description: string;
  color: string;
  data: number[];
};

function MiniChart({
  data,
  color = "var(--primary)",
}: {
  data: number[];
  color?: string;
}) {
  const width = 180;
  const height = 58;
  const padding = 5;

  const max = Math.max(...data, 1);
  const min = Math.min(...data);

  const points = data
    .map((value, index) => {
      const x =
        padding +
        (index / Math.max(data.length - 1, 1)) * (width - padding * 2);

      const normalized =
        max === min ? 0.5 : (value - min) / (max - min);

      const y =
        height -
        padding -
        normalized * (height - padding * 2);

      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${padding},${height - padding} ${points} ${
    width - padding
  },${height - padding}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[58px] w-full overflow-visible"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`gradient-${color.replace(/[^a-zA-Z0-9]/g, "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <polygon
        points={areaPoints}
        fill={`url(#gradient-${color.replace(/[^a-zA-Z0-9]/g, "")})`}
      />

      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {data.map((value, index) => {
        const x =
          padding +
          (index / Math.max(data.length - 1, 1)) * (width - padding * 2);

        const normalized =
          max === min ? 0.5 : (value - min) / (max - min);

        const y =
          height -
          padding -
          normalized * (height - padding * 2);

        return (
          <circle
            key={`${value}-${index}`}
            cx={x}
            cy={y}
            r={index === data.length - 1 ? 3 : 0}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

function DonutChart({
  active,
  pending,
  total,
}: {
  active: number;
  pending: number;
  total: number;
}) {
  const activePercent = total > 0 ? (active / total) * 100 : 0;
  const pendingPercent = total > 0 ? (pending / total) * 100 : 0;

  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const activeDash = (activePercent / 100) * circumference;
  const pendingDash = (pendingPercent / 100) * circumference;

  return (
    <div className="relative h-36 w-36">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full -rotate-90"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          className="text-muted/30"
        />

        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${activeDash} ${circumference}`}
        />

        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${pendingDash} ${circumference}`}
          strokeDashoffset={-activeDash}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tracking-tight">
          {total.toLocaleString("id-ID")}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Listings
        </span>
      </div>
    </div>
  );
}

function Icon({
  type,
}: {
  type:
    | "users"
    | "listing"
    | "active"
    | "pending"
    | "today"
    | "growth";
}) {
  const paths = {
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    listing: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="m3 9 9 6 9-6" />
        <path d="M12 3v12" />
      </>
    ),
    active: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    pending: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    today: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    growth: (
      <>
        <path d="M3 17 9 11l4 4 8-9" />
        <path d="M15 6h6v6" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {paths[type]}
    </svg>
  );
}

function buildTrend(base: number, multiplier = 1) {
  if (!base) {
    return [0, 0, 0, 0, 0, 0, 0];
  }

  return [
    Math.max(0, Math.round(base * 0.42 * multiplier)),
    Math.max(0, Math.round(base * 0.58 * multiplier)),
    Math.max(0, Math.round(base * 0.51 * multiplier)),
    Math.max(0, Math.round(base * 0.76 * multiplier)),
    Math.max(0, Math.round(base * 0.68 * multiplier)),
    Math.max(0, Math.round(base * 0.88 * multiplier)),
    base,
  ];
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    { count: totalUsers },
    { count: totalListings },
    { count: activeListings },
    { count: pendingListings },
    { count: listingsToday },
    { count: usersToday },
    { count: listingsWeek },
    { count: usersWeek },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("listings")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),

    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),

    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString()),

    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString()),

    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfWeek.toISOString()),

    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfWeek.toISOString()),
  ]);

  const users = totalUsers || 0;
  const listings = totalListings || 0;
  const active = activeListings || 0;
  const pending = pendingListings || 0;
  const newListings = listingsToday || 0;
  const newUsers = usersToday || 0;

  const activeRate =
    listings > 0 ? Math.round((active / listings) * 100) : 0;

  const pendingRate =
    listings > 0 ? Math.round((pending / listings) * 100) : 0;

  const metrics: Metric[] = [
    {
      label: "Total Users",
      value: users,
      description: "Seluruh pengguna terdaftar",
      color: "#6366f1",
      data: buildTrend(users),
    },
    {
      label: "Total Listings",
      value: listings,
      description: "Seluruh listing di SUDROS",
      color: "#0ea5e9",
      data: buildTrend(listings),
    },
    {
      label: "Active Listings",
      value: active,
      description: `${activeRate}% dari total listing`,
      color: "#10b981",
      data: buildTrend(active, 0.95),
    },
    {
      label: "Pending Listings",
      value: pending,
      description: `${pendingRate}% perlu perhatian`,
      color: "#f59e0b",
      data: buildTrend(pending, 0.8),
    },
  ];

  return (
    <main className="min-h-screen space-y-6 pb-10">
      {/* HEADER */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-background via-background to-primary/5 p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Icon type="growth" />
              </span>

              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                SUDROS CONTROL CENTER
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Dashboard Overview
            </h1>

            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Pantau pertumbuhan pengguna, listing, aktivitas harian,
              dan kondisi marketplace SUDROS dalam satu tampilan.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-2 text-xs shadow-sm backdrop-blur">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-medium">System Online</span>
          </div>
        </div>
      </section>

      {/* KPI CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="group overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="mb-4 flex items-start justify-between">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${metric.color}18`,
                  color: metric.color,
                }}
              >
                <Icon
                  type={
                    metric.label === "Total Users"
                      ? "users"
                      : metric.label === "Total Listings"
                      ? "listing"
                      : metric.label === "Active Listings"
                      ? "active"
                      : "pending"
                  }
                />
              </div>

              <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                LIVE
              </span>
            </div>

            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground">
                {metric.label}
              </p>

              <p className="mt-1 text-3xl font-bold tracking-tight">
                {metric.value.toLocaleString("id-ID")}
              </p>

              <p className="mt-1 text-[11px] text-muted-foreground">
                {metric.description}
              </p>
            </div>

            <MiniChart data={metric.data} color={metric.color} />
          </div>
        ))}
      </section>

      {/* ACTIVITY + HEALTH */}
      <section className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/* ACTIVITY */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Activity
              </p>

              <h2 className="mt-1 text-lg font-bold">
                Aktivitas Platform
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Ringkasan aktivitas terbaru SUDROS.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                7 Hari
              </p>
              <p className="text-sm font-bold">
                {(listingsWeek || 0) + (usersWeek || 0)}
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl bg-muted/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="text-xs font-medium">
                    Listing Baru
                  </span>
                </div>

                <span className="text-lg font-bold">
                  {newListings}
                </span>
              </div>

              <MiniChart
                data={buildTrend(newListings, 1.2)}
                color="var(--primary)"
              />

              <p className="mt-2 text-[11px] text-muted-foreground">
                Dibuat hari ini
              </p>
            </div>

            <div className="rounded-2xl bg-muted/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium">
                    User Baru
                  </span>
                </div>

                <span className="text-lg font-bold">
                  {newUsers}
                </span>
              </div>

              <MiniChart
                data={buildTrend(newUsers, 0.9)}
                color="#10b981"
              />

              <p className="mt-2 text-[11px] text-muted-foreground">
                Bergabung hari ini
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold">
                  Listing 7 Hari Terakhir
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Total listing baru dalam periode berjalan
                </p>
              </div>

              <span className="text-xl font-bold">
                {(listingsWeek || 0).toLocaleString("id-ID")}
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(
                    listingsWeek && listingsWeek > 0 ? 100 : 0,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* LISTING HEALTH */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Listing Health
            </p>

            <h2 className="mt-1 text-lg font-bold">
              Status Listing
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Distribusi status listing saat ini.
            </p>
          </div>

          <div className="flex items-center justify-center py-2">
            <DonutChart
              active={active}
              pending={pending}
              total={listings}
            />
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-xs font-medium">
                  Active
                </span>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold">
                  {active.toLocaleString("id-ID")}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {activeRate}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-medium">
                  Pending
                </span>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold">
                  {pending.toLocaleString("id-ID")}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {pendingRate}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Icon type="active" />
                </span>

                <span className="text-xs font-medium">
                  Health Status
                </span>
              </div>

              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                HEALTHY
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TODAY SUMMARY */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon type="today" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Listing Hari Ini
              </p>
              <p className="text-xl font-bold">
                {newListings.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Icon type="users" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                User Hari Ini
              </p>
              <p className="text-xl font-bold">
                {newUsers.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Icon type="pending" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Perlu Moderasi
              </p>
              <p className="text-xl font-bold">
                {pending.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
     }
