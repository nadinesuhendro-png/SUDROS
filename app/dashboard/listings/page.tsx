// PATH: app/dashboard/listings/page.tsx
// AKSI: UPDATE FILE (dark mode retrofit)

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteListing } from "./actions";
import CaptionButton from "./CaptionButton";

export const maxDuration = 60;

type MyListing = {
  id: string;
  title: string;
  price: number;
  location_city: string;
  views_count: number;
  whatsapp_clicks_count: number;
  status: string;
  ai_moderation_checked_at: string | null;
  listing_images: { image_url: string; sort_order: number }[];
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

function ReviewBadge({ listing }: { listing: MyListing }) {
  if (listing.status === "rejected") {
    return (
      <span className="inline-flex w-fit items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
        Ditolak
      </span>
    );
  }
  if (listing.status === "suspended") {
    return (
      <span className="inline-flex w-fit items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
        Ditangguhkan
      </span>
    );
  }
  if (!listing.ai_moderation_checked_at || listing.status === "pending") {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Sedang dalam peninjauan
      </span>
    );
  }
  if (listing.status === "active") {
    return (
      <span className="inline-flex w-fit items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
        Aktif
      </span>
    );
  }
  return null;
}

export default async function MyListingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, title, price, location_city, views_count, whatsapp_clicks_count, status, ai_moderation_checked_at, listing_images(image_url, sort_order)"
    )
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<MyListing[]>();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--primary-dark)" }}
        >
          Listing Saya
        </h1>
        <Link
          href="/dashboard/listings/new"
          className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          + Buat Baru
        </Link>
      </div>

      {(listings || []).length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Kamu belum punya listing.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {(listings || []).map((listing) => {
          const sortedImages = [...(listing.listing_images || [])].sort(
            (a, b) => a.sort_order - b.sort_order
          );
          const coverImage = sortedImages[0]?.image_url;

          return (
            <div
              key={listing.id}
              className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-3"
            >
              <div className="flex gap-3">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[var(--radius)] bg-[var(--muted)]">
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-medium text-[var(--card-foreground)]">
                    {listing.title}
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--primary)" }}
                  >
                    {formatPrice(listing.price)}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {listing.location_city}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    👁 {listing.views_count} views • 💬 {listing.whatsapp_clicks_count} WA clicks
                  </span>
                  <ReviewBadge listing={listing} />
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href={`/dashboard/listings/${listing.id}/edit`}
                    className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-1 text-center text-xs font-medium text-[var(--card-foreground)]"
                  >
                    Edit
                  </Link>
                  <form action={deleteListing}>
                    <input type="hidden" name="id" value={listing.id} />
                    <button
                      type="submit"
                      className="w-full rounded-[var(--radius)] border px-3 py-1 text-xs font-medium"
                      style={{
                        borderColor: "var(--destructive)",
                        color: "var(--destructive)",
                      }}
                    >
                      Hapus
                    </button>
                  </form>
                </div>
              </div>

              <CaptionButton listingId={listing.id} />
            </div>
          );
        })}
      </div>
    </main>
  );
}
