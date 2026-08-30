// PATH: app/admin/marketing/campaigns/[id]/page.tsx
// AKSI: BUAT FILE BARU

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { archiveCampaign } from "../actions";

type CampaignDetail = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
};

type ContentRow = {
  id: string;
  platform: string;
  status: string;
  headline: string | null;
  caption: string | null;
  short_copy: string | null;
  listings: {
    title: string;
    listing_images: { image_url: string; sort_order: number }[];
  } | null;
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  active: "Aktif",
  completed: "Selesai",
  archived: "Archived",
};

const platformLabel: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  general: "Umum",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("marketing_campaigns")
    .select("id, name, description, status, start_date, end_date")
    .eq("id", id)
    .maybeSingle<CampaignDetail>();

  if (!campaign) {
    notFound();
  }

  const { data: contents } = await supabase
    .from("marketing_contents")
    .select(
      "id, platform, status, headline, caption, short_copy, listings(title, listing_images(image_url, sort_order))"
    )
    .eq("campaign_id", id)
    .order("created_at", { ascending: false })
    .returns<ContentRow[]>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
          {campaign.name}
        </h2>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">
          {statusLabel[campaign.status] || campaign.status}
        </span>
      </div>

      {campaign.description ? (
        <p className="text-sm text-[var(--muted-foreground)]">{campaign.description}</p>
      ) : null}

      {campaign.start_date || campaign.end_date ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          📅 {campaign.start_date || "?"} → {campaign.end_date || "?"}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Link
          href={`/admin/marketing/campaigns/${campaign.id}/edit`}
          className="rounded-[var(--radius)] border border-gray-300 px-3 py-1.5 text-xs font-medium"
        >
          Edit
        </Link>
        {campaign.status !== "archived" ? (
          <form action={archiveCampaign}>
            <input type="hidden" name="id" value={campaign.id} />
            <button
              type="submit"
              className="rounded-[var(--radius)] border border-gray-300 px-3 py-1.5 text-xs font-medium"
            >
              Archive
            </button>
          </form>
        ) : null}
        <Link
          href={`/admin/marketing/generate?campaign=${campaign.id}`}
          className="rounded-[var(--radius)] px-3 py-1.5 text-xs font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          + Tambah Content
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)]">
          Content dalam Campaign ini ({(contents || []).length})
        </h3>

        {(contents || []).length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Belum ada content di campaign ini. Generate content baru lalu pilih campaign
            ini, atau assign content yang sudah ada lewat halaman Content Detail.
          </p>
        ) : null}

        {(contents || []).map((c) => {
          const listing = c.listings;
          const sortedImages = listing
            ? [...(listing.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)
            : [];
          const coverImage = sortedImages[0]?.image_url;
          const preview = c.headline || c.caption || c.short_copy || "-";

          return (
            <Link
              key={c.id}
              href={`/admin/marketing/content/${c.id}`}
              className="flex gap-3 rounded-[var(--radius)] border border-gray-200 p-3"
            >
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-[var(--radius)] bg-gray-100">
                {coverImage ? (
                  <Image
                    src={coverImage}
                    alt={listing?.title || ""}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {listing?.title || "Promosi Platform SUDROS"}
                </span>
                <span className="line-clamp-1 text-xs text-[var(--muted-foreground)]">
                  {preview}
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {platformLabel[c.platform] || c.platform}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
