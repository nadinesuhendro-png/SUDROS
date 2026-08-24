// PATH: app/listings/[id]/page.tsx
// AKSI: UPDATE FILE

import Image from "next/image";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";

type ListingDetail = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  location_city: string;
  location_area: string | null;
  owner_id: string;
  listing_images: { image_url: string; sort_order: number }[];
  categories: { name: string } | null;
  profiles: { username: string } | null;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, title, description, price, location_city, location_area, owner_id, listing_images(image_url, sort_order), categories(name), profiles(username)"
    )
    .eq("id", id)
    .single<ListingDetail>();

  if (!listing) {
    notFound();
  }

  const sortedImages = [...(listing.listing_images || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <>
      <Navbar />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
        {sortedImages.length > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius)] bg-gray-100">
              <Image
                src={sortedImages[0].image_url}
                alt={listing.title}
                fill
                priority
                className="object-cover"
              />
            </div>
            {sortedImages.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto">
                {sortedImages.slice(1).map((img) => (
                  <div
                    key={img.image_url}
                    className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[var(--radius)] bg-gray-100"
                  >
                    <Image
                      src={img.image_url}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <h1 className="text-xl font-semibold" style={{ color: "var(--primary-dark)" }}>
          {listing.title}
        </h1>

        <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>
          {formatPrice(listing.price)}
        </span>

        <div className="flex flex-wrap gap-2 text-sm text-[var(--muted-foreground)]">
          <span>
            {listing.location_area
              ? `${listing.location_area}, ${listing.location_city}`
              : listing.location_city}
          </span>
          {listing.categories?.name ? (
            <>
              <span>•</span>
              <span>{listing.categories.name}</span>
            </>
          ) : null}
        </div>

        {listing.description ? (
          <p className="whitespace-pre-line text-sm">{listing.description}</p>
        ) : null}

        {listing.profiles?.username ? (
          <div className="mt-2 rounded-[var(--radius)] border border-gray-200 p-3 text-sm">
            Diposting oleh <span className="font-medium">{listing.profiles.username}</span>
          </div>
        ) : null}
      </main>
    </>
  );
              }
