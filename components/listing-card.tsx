// AKSI: GANTI SELURUH ISI FILE (tambah tracking listing_clicked)
// PATH: components/listing-card.tsx

import Image from "next/image";
import { TrackLink } from "@/components/analytics/track-link";

const royalBlue = "#1d6fb8";

export type ListingCardData = {
  id: string;
  title: string;
  price: number;
  location_city: string;
  location_area: string | null;
  listing_images: { image_url: string; sort_order: number }[];
};

export function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const sortedImages = [...(listing.listing_images || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const coverImage = sortedImages[0]?.image_url;

  return (
    <TrackLink
      href={`/listings/${listing.id}`}
      event="listing_clicked"
      eventProperties={{ listing_id: listing.id, title: listing.title }}
      className="flex flex-col overflow-hidden rounded-xl border bg-white"
      style={{ borderColor: "#e2ecf6" }}
    >
      <div className="relative aspect-square w-full bg-slate-100">
        {coverImage ? (
          <Image src={coverImage} alt={listing.title} fill className="object-cover" />
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-2.5">
        <span className="line-clamp-2 text-sm font-medium">{listing.title}</span>
        <span className="text-sm font-semibold" style={{ color: royalBlue }}>
          {formatPrice(listing.price)}
        </span>
        <span className="text-xs text-slate-500">
          {listing.location_area
            ? `${listing.location_area}, ${listing.location_city}`
            : listing.location_city}
        </span>
      </div>
    </TrackLink>
  );
}
