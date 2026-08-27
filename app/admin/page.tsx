// PATH: app/admin/page.tsx
// AKSI: UPDATE FILE (auth check & AdminNav dipindah ke layout.tsx, jadi tidak dobel)

import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalListings },
    { count: activeListings },
    { count: pendingListings },
    { count: listingsToday },
    { count: usersToday },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }),
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
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ]);

  const stats = [
    { label: "Total Users", value: totalUsers || 0 },
    { label: "Total Listings", value: totalListings || 0 },
    { label: "Active Listings", value: activeListings || 0 },
    { label: "Pending Listings", value: pendingListings || 0 },
    { label: "Listing Baru Hari Ini", value: listingsToday || 0 },
    { label: "User Baru Hari Ini", value: usersToday || 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[var(--radius)] border border-gray-200 p-4"
        >
          <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
            {stat.value}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
