// PATH: app/page.tsx
// AKSI: UPDATE FILE

import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";

type ListingCard = {
  id: string;
  title: string;
  price: number;
  location_city: string;
  location_area: string | null;
  listing_images: { image_url: string; sort_order: number }[];
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function HomePage() {
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, title, price, location_city, location_area, listing_images(image_url, sort_order)"
    )
    .order("created_at", { ascending: false })
    .returns<ListingCard[]>();

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-56px)] flex-col items-center gap-4 p-6 text-center">
        <Image
          src="/brand/sudros-logo.png"
          alt="SUDROS"
          width={220}
          height={140}
          priority
          className="h-auto w-48"
        />
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--primary-dark)" }}
        >
          Temukan. Tawarkan. Terhubung.
        </h1>
        <p className="max-w-xs text-[var(--muted-foreground)]">
          Platform listing lokal untuk properti, kendaraan, elektronik,
          barang, dan jasa.
        </p>

        <div className="mt-6 grid w-full max-w-5xl grid-cols-2 gap-4 text-left sm:grid-cols-3 md:grid-cols-4">
          {(listings || []).map((listing) => {
            const sortedImages = [...(listing.listing_images || [])].sort(
              (a, b) => a.sort_order - b.sort_order
            );
            const coverImage = sortedImages[0]?.image_url;

            return (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-gray-200"
              >
                <div className="relative aspect-square w-full bg-gray-100">
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-col gap-1 p-2">
                  <span className="line-clamp-2 text-sm font-medium">
                    {listing.title}
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--primary)" }}
                  >
                    {formatPrice(listing.price)}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {listing.location_area
                      ? `${listing.location_area}, ${listing.location_city}`
                      : listing.location_city}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {(listings || []).length === 0 ? (
          <p className="mt-6 text-sm text-[var(--muted-foreground)]">
            Belum ada listing. Jadilah yang pertama membuat listing!
          </p>
        ) : null}
      </main>
    </>
  );
}
