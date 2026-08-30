// PATH: app/admin/marketing/analytics/page.tsx
// AKSI: BUAT FILE BARU (Marketing Analytics -- overview, channel performance, content performance, campaign performance)

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ContentWithListing = {
  id: string;
  platform: string;
  headline: string | null;
  listing_id: string | null;
  listings: {
    title: string;
    views_count: number;
    whatsapp_clicks_count: number;
  } | null;
};

type CampaignRow = {
  id: string;
  name: string;
};

export default async function MarketingAnalyticsPage() {
  const supabase = await createClient();

  const { count: publishedCount } = await supabase
    .from("marketing_contents")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  const { data: socialClickEvents } = await supabase
    .from("marketing_events")
    .select("utm_source")
    .eq("event_type", "social_click");

  const totalSocialClicks = socialClickEvents?.length || 0;

  const channelCounts = new Map<string, number>();
  for (const e of socialClickEvents || []) {
    const source = e.utm_source || "unknown";
    channelCounts.set(source, (channelCounts.get(source) || 0) + 1);
  }
  const channelPerformance = Array.from(channelCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  const { data: contentWithListings } = await supabase
    .from("marketing_contents")
    .select("id, platform, headline, listing_id, listings(title, views_count, whatsapp_clicks_count)")
    .not("listing_id", "is", null)
    .returns<ContentWithListing[]>();

  const totalListingViews = (contentWithListings || []).reduce(
    (sum, c) => sum + (c.listings?.views_count || 0),
    0
  );
  const totalWhatsappClicks = (contentWithListings || []).reduce(
    (sum, c) => sum + (c.listings?.whatsapp_clicks_count || 0),
    0
  );

  const topContent = [...(contentWithListings || [])]
    .filter((c) => c.listings)
    .sort((a, b) => (b.listings?.views_count || 0) - (a.listings?.views_count || 0))
    .slice(0, 10);

  const { data: campaigns } = await supabase
    .from("marketing_campaigns")
    .select("id, name")
    .neq("status", "archived")
    .limit(20)
    .returns<CampaignRow[]>();

  const campaignPerformance = await Promise.all(
    (campaigns || []).map(async (camp) => {
      const { count: contentCount } = await supabase
        .from("marketing_contents")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", camp.id);

      const { count: clicks } = await supabase
        .from("marketing_events")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", camp.id)
        .eq("event_type", "social_click");

      return { ...camp, contentCount: contentCount || 0, clicks: clicks || 0 };
    })
  );

  const hasEnoughData = totalSocialClicks >= 5;

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
        Marketing Analytics
      </h2>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)]">Overview</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[var(--radius)] border border-gray-200 p-3">
            <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>
              {publishedCount || 0}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Published Content</p>
          </div>
          <div className="rounded-[var(--radius)] border border-gray-200 p-3">
            <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>
              {totalSocialClicks}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Social Clicks</p>
          </div>
          <div className="rounded-[var(--radius)] border border-gray-200 p-3">
            <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>
              {totalListingViews}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Listing Views (listing yang punya content)
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-gray-200 p-3">
            <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>
              {totalWhatsappClicks}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">WhatsApp Clicks</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)]">
          Channel Performance
        </h3>
        {channelPerformance.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Belum ada klik tracking link tercatat.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {channelPerformance.map(([source, count]) => (
              <div
                key={source}
                className="flex items-center justify-between rounded-[var(--radius)] border border-gray-200 p-2 text-sm"
              >
                <span className="capitalize">{source}</span>
                <span className="font-medium">{count} klik</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)]">
          Content Performance (top by listing views)
        </h3>
        {topContent.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Belum ada content yang terhubung ke listing dengan data views.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {topContent.map((c) => (
              <Link
                key={c.id}
                href={`/admin/marketing/content/${c.id}`}
                className="flex items-center justify-between rounded-[var(--radius)] border border-gray-200 p-2 text-sm"
              >
                <span className="line-clamp-1">{c.listings?.title || c.headline || "-"}</span>
                <span className="whitespace-nowrap text-xs text-[var(--muted-foreground)]">
                  👁 {c.listings?.views_count || 0} • 💬 {c.listings?.whatsapp_clicks_count || 0}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)]">
          Campaign Performance
        </h3>
        {campaignPerformance.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Belum ada campaign.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {campaignPerformance.map((c) => (
              <Link
                key={c.id}
                href={`/admin/marketing/campaigns/${c.id}`}
                className="flex items-center justify-between rounded-[var(--radius)] border border-gray-200 p-2 text-sm"
              >
                <span>{c.name}</span>
                <span className="whitespace-nowrap text-xs text-[var(--muted-foreground)]">
                  📁 {c.contentCount} content • 🔗 {c.clicks} klik
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)]">
          Marketing Insight
        </h3>
        <p className="rounded-[var(--radius)] border border-gray-200 p-3 text-sm text-[var(--muted-foreground)]">
          {hasEnoughData && channelPerformance.length > 0
            ? `Channel "${channelPerformance[0][0]}" menghasilkan klik terbanyak (${channelPerformance[0][1]} klik) dalam periode ini.`
            : "Belum cukup data untuk memberikan insight."}
        </p>
      </div>
    </div>
  );
    }
