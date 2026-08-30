// PATH: app/admin/marketing/content/[id]/page.tsx
// AKSI: UPDATE FILE (tambah form assign/pindah campaign)

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { duplicateContent, archiveContent, deleteContent, markPublished } from "../../actions";
import { assignContentToCampaign } from "../../campaigns/actions";
import CopyButton from "../CopyButton";

type ContentDetail = {
  id: string;
  platform: string;
  headline: string | null;
  hook: string | null;
  caption: string | null;
  short_copy: string | null;
  video_script: string | null;
  cta: string | null;
  hashtags: string[];
  status: string;
  generation_method: string;
  campaign_id: string | null;
  created_at: string;
  updated_at: string;
  listings: {
    id: string;
    title: string;
    price: number;
    location_city: string;
    listing_images: { image_url: string; sort_order: number }[];
  } | null;
  marketing_campaigns: { name: string } | null;
};

type CampaignOption = {
  id: string;
  name: string;
};

const platformLabel: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  general: "Umum",
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  ready: "Ready",
  published: "Published",
  archived: "Archived",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: content } = await supabase
    .from("marketing_contents")
    .select(
      "id, platform, headline, hook, caption, short_copy, video_script, cta, hashtags, status, generation_method, campaign_id, created_at, updated_at, listings(id, title, price, location_city, listing_images(image_url, sort_order)), marketing_campaigns(name)"
    )
    .eq("id", id)
    .maybeSingle<ContentDetail>();

  if (!content) {
    notFound();
  }

  const { data: campaignOptions } = await supabase
    .from("marketing_campaigns")
    .select("id, name")
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .returns<CampaignOption[]>();

  const listing = content.listings;
  const sortedImages = listing
    ? [...(listing.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const coverImage = sortedImages[0]?.image_url;
  const hashtagsText = content.hashtags?.length
    ? content.hashtags.map((h) => `#${h}`).join(" ")
    : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
          Content Detail
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            content.generation_method === "ai"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {content.generation_method === "ai" ? "✨ AI Generated" : "📋 Template Generated"}
        </span>
      </div>

      {listing ? (
        <Link
          href={`/listings/${listing.id}`}
          className="flex gap-3 rounded-[var(--radius)] border border-gray-200 p-3"
        >
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-[var(--radius)] bg-gray-100">
            {coverImage ? (
              <Image src={coverImage} alt={listing.title} fill className="object-cover" />
            ) : null}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{listing.title}</span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {formatPrice(listing.price)} • {listing.location_city}
            </span>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-gray-200 p-3">
          <span className="text-lg">📣</span>
          <span className="text-sm font-medium">Promosi Platform SUDROS</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
        <span className="rounded-full bg-gray-100 px-2 py-0.5">
          {platformLabel[content.platform] || content.platform}
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5">
          {statusLabel[content.status] || content.status}
        </span>
        {content.marketing_campaigns ? (
          <span className="rounded-full bg-gray-100 px-2 py-0.5">
            📁 {content.marketing_campaigns.name}
          </span>
        ) : null}
        <span className="rounded-full bg-gray-100 px-2 py-0.5">
          {new Date(content.created_at).toLocaleDateString("id-ID")}
        </span>
      </div>

      <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">Campaign</span>
        <form action={assignContentToCampaign} className="flex gap-2">
          <input type="hidden" name="content_id" value={content.id} />
          <select
            name="campaign_id"
            defaultValue={content.campaign_id || ""}
            className="flex-1 rounded-[var(--radius)] border border-gray-300 px-2 py-1.5 text-xs"
          >
            <option value="">Tanpa campaign</option>
            {(campaignOptions || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-1.5 text-xs font-medium"
          >
            Simpan
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        {content.headline ? (
          <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                Headline
              </span>
              <CopyButton text={content.headline} label="Headline" />
            </div>
            <p className="text-sm">{content.headline}</p>
          </div>
        ) : null}

        {content.hook ? (
          <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">Hook</span>
              <CopyButton text={content.hook} label="Hook" />
            </div>
            <p className="text-sm">{content.hook}</p>
          </div>
        ) : null}

        {content.caption ? (
          <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                Caption
              </span>
              <CopyButton text={content.caption} label="Caption" />
            </div>
            <p className="whitespace-pre-wrap text-sm">{content.caption}</p>
          </div>
        ) : null}

        {content.short_copy ? (
          <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                Pesan WhatsApp
              </span>
              <CopyButton text={content.short_copy} label="Pesan" />
            </div>
            <p className="whitespace-pre-wrap text-sm">{content.short_copy}</p>
          </div>
        ) : null}

        {content.video_script ? (
          <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                Video Script
              </span>
              <CopyButton text={content.video_script} label="Script" />
            </div>
            <p className="whitespace-pre-wrap text-sm">{content.video_script}</p>
          </div>
        ) : null}

        {content.cta ? (
          <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">CTA</span>
              <CopyButton text={content.cta} label="CTA" />
            </div>
            <p className="text-sm">{content.cta}</p>
          </div>
        ) : null}

        {hashtagsText ? (
          <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                Hashtags
              </span>
              <CopyButton text={hashtagsText} label="Hashtags" />
            </div>
            <p className="text-sm text-blue-600">{hashtagsText}</p>
          </div>
        ) : null}

        {listing ? (
          <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                Listing Link
              </span>
              <CopyButton
                text={`${process.env.NEXT_PUBLIC_SITE_URL || "https://sudros-chi.vercel.app"}/listings/${listing.id}`}
                label="Link"
              />
            </div>
            <p className="text-sm text-blue-600">/listings/{listing.id}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/marketing/content/${content.id}/edit`}
          className="rounded-[var(--radius)] border border-gray-300 px-3 py-1.5 text-xs font-medium"
        >
          Edit
        </Link>
        <form action={duplicateContent}>
          <input type="hidden" name="id" value={content.id} />
          <button
            type="submit"
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-1.5 text-xs font-medium"
          >
            Duplicate
          </button>
        </form>
        {content.status !== "published" ? (
          <form action={markPublished} className="flex items-center gap-1">
            <input type="hidden" name="id" value={content.id} />
            <input type="hidden" name="platform" value={content.platform} />
            <input
              type="url"
              name="published_url"
              placeholder="Link publikasi (opsional)"
              className="w-40 rounded-[var(--radius)] border border-gray-300 px-2 py-1.5 text-xs"
            />
            <button
              type="submit"
              className="rounded-[var(--radius)] px-3 py-1.5 text-xs font-medium text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Mark Published
            </button>
          </form>
        ) : null}
        {content.status !== "archived" ? (
          <form action={archiveContent}>
            <input type="hidden" name="id" value={content.id} />
            <button
              type="submit"
              className="rounded-[var(--radius)] border border-gray-300 px-3 py-1.5 text-xs font-medium"
            >
              Archive
            </button>
          </form>
        ) : (
          <form action={deleteContent}>
            <input type="hidden" name="id" value={content.id} />
            <button
              type="submit"
              className="rounded-[var(--radius)] border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600"
            >
              Hapus
            </button>
          </form>
        )}
      </div>
    </div>
  );
        }
