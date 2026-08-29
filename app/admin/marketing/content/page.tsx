// PATH: app/admin/marketing/content/page.tsx
// AKSI: BUAT FILE BARU

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ContentRow = {
  id: string;
  platform: string;
  status: string;
  generation_method: string;
  created_at: string;
  headline: string | null;
  caption: string | null;
  short_copy: string | null;
  listings: {
    title: string;
    listing_images: { image_url: string; sort_order: number }[];
  } | null;
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

export default async function ContentLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; status?: string; method?: string }>;
}) {
  const { platform, status, method } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("marketing_contents")
    .select(
      "id, platform, status, generation_method, created_at, headline, caption, short_copy, listings(title, listing_images(image_url, sort_order))"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (platform) query = query.eq("platform", platform);
  if (status) query = query.eq("status", status);
  if (method) query = query.eq("generation_method", method);

  const { data: contents } = await query.returns<ContentRow[]>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
          Content Library ({(contents || []).length})
        </h2>
        <Link
          href="/admin/marketing/generate"
          className="rounded-[var(--radius)] px-3 py-1.5 text-xs font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          + Generate
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {["instagram", "facebook", "tiktok", "whatsapp", "general"].map((p) => (
          <Link
            key={p}
            href={`/admin/marketing/content?platform=${p}`}
            className={`rounded-full px-2 py-1 ${
              platform === p ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            {platformLabel[p]}
          </Link>
        ))}
        {platform ? (
          <Link href="/admin/marketing/content" className="rounded-full bg-gray-100 px-2 py-1">
            Reset Filter
          </Link>
        ) : null}
      </div>

      {(contents || []).length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">Belum ada content.</p>
      ) : null}

      <div className="flex flex-col gap-2">
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
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-[var(--radius)] bg-gray-100">
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
                <span className="text-sm font-medium">{listing?.title || "-"}</span>
                <span className="line-clamp-1 text-xs text-[var(--muted-foreground)]">
                  {preview}
                </span>
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">
                    {platformLabel[c.platform] || c.platform}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">
                    {statusLabel[c.status] || c.status}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      c.generation_method === "ai"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.generation_method === "ai" ? "✨ AI" : "📋 Template"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
      }
