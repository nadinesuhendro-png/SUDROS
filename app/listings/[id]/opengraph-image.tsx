// AKSI: BUAT FILE BARU
// PATH: app/listings/[id]/opengraph-image.tsx

import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type ListingOgData = {
  title: string;
  price: number;
  location_city: string;
  location_area: string | null;
  listing_images: { image_url: string; sort_order: number }[];
};

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("title, price, location_city, location_area, listing_images(image_url, sort_order)")
    .eq("id", id)
    .single<ListingOgData>();

  const title = listing?.title || "Listing SUDROS";
  const location = listing
    ? listing.location_area
      ? `${listing.location_area}, ${listing.location_city}`
      : listing.location_city
    : "";
  const price = listing
    ? new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(listing.price)
    : "";

  const sortedImages = listing
    ? [...(listing.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const coverImage = sortedImages[0]?.image_url;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0b2a52",
          color: "white",
        }}
      >
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            width={500}
            height={630}
            style={{ objectFit: "cover" }}
            alt=""
          />
        ) : (
          <div style={{ display: "flex", width: 500, height: 630, background: "#1d6fb8" }} />
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px",
            flex: 1,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: "#7fc4ec" }}>SUDROS</div>
          <div style={{ fontSize: 46, fontWeight: 800, marginTop: 20, lineHeight: 1.15 }}>
            {title}
          </div>
          {price ? (
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 20, color: "#7fc4ec" }}>
              {price}
            </div>
          ) : null}
          {location ? (
            <div style={{ fontSize: 24, marginTop: 10, color: "#c7d7ea" }}>📍 {location}</div>
          ) : null}
        </div>
      </div>
    ),
    { ...size }
  );
}

