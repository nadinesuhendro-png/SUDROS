// PATH: app/admin/marketing/page.tsx
// AKSI: BUAT FILE BARU

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MarketingOverviewPage() {
  const supabase = await createClient();

  const [
    { count: totalContent },
    { count: draftCount },
    { count: readyCount },
    { count: publishedCount },
    { count: archivedCount },
    { count: activeCampaigns },
    { count: completedCampaigns },
    { count: totalCampaigns },
  ] = await Promise.all([
    supabase.from("marketing_contents").select("*", { count: "exact", head: true }),
    supabase
      .from("marketing_contents")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("marketing_contents")
      .select("*", { count: "exact", head: true })
      .eq("status", "ready"),
    supabase
      .from("marketing_contents")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("marketing_contents")
      .select("*", { count: "exact", head: true })
      .eq("status", "archived"),
    supabase
      .from("marketing_campaigns")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("marketing_campaigns")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase.from("marketing_campaigns").select("*", { count: "exact", head: true }),
  ]);

  const { count: socialClicks } = await supabase
    .from("marketing_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "social_click");

  const contentStats = [
    { label: "Total Content", value: totalContent || 0 },
    { label: "Draft", value: draftCount || 0 },
    { label: "Ready", value: readyCount || 0 },
    { label: "Published", value: publishedCount || 0 },
    { label: "Archived", value: archivedCount || 0 },
  ];

  const campaignStats = [
    { label: "Active Campaigns", value: activeCampaigns || 0 },
    { label: "Completed Campaigns", value: completedCampaigns || 0 },
    { label: "Total Campaigns", value: totalCampaigns || 0 },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
          Marketing Center Overview
        </h2>
        <Link
          href="/admin/marketing/generate"
          className="rounded-[var(--radius)] px-3 py-1.5 text-xs font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          + Generate Content
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)]">Content</h3>
        <div className="grid grid-cols-3 gap-2">
          {contentStats.map((s) => (
            <div key={s.label} className="rounded-[var(--radius)] border border-gray-200 p-3">
              <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>
                {s.value}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)]">Campaign</h3>
        <div className="grid grid-cols-3 gap-2">
          {campaignStats.map((s) => (
            <div key={s.label} className="rounded-[var(--radius)] border border-gray-200 p-3">
              <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>
                {s.value}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)]">Traffic</h3>
        <div className="rounded-[var(--radius)] border border-gray-200 p-3">
          <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>
            {socialClicks || 0}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Social Clicks (dari tracking link campaign)
          </p>
        </div>
      </div>

      {(totalContent || 0) === 0 ? (
        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Belum ada content. Mulai dengan generate content pertama kamu.
        </p>
      ) : null}
    </div>
  );
    }
