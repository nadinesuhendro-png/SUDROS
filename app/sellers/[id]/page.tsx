// PATH: app/sellers/[id]/page.tsx
// AKSI: BUAT FILE BARU

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";

type SellerProfile = {
  username: string;
  avatar_url: string | null;
};

type SellerListing = {
  id: string;
  title: string;
  price: number;
  location_city: string;
  listing_images: { image_url: string; sort_order: number }[];
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: seller } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", id)
    .single<SellerProfile>();

  if (!seller) {
    notFound();
  }

  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, title, price, location_city, listing_images(image_url, sort_order)"
    )
    .eq("owner_id", id)
    .order("created_at", { ascending: false })
    .returns<SellerListing[]>();

  return (
    <>
      <Navbar />
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 p-6">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-100">
          {seller.avatar_url ? (
            <Image
              src={seller.avatar_url}
              alt={seller.username}
              fill
              className="object-cover"
            />
          ) : null}
        </div>

        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--primary-dark)" }}
        >
          {seller.username}
        </h1>

        <p className="text-sm text-[var(--muted-foreground)]">
          {(listings || []).length} listing aktif
        </p>

        <div className="mt-2 grid w-full grid-cols-2 gap-4 text-left sm:grid-cols-3">
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
                    {listing.location_city}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {(listings || []).length === 0 ? (
          <p className="mt-6 text-sm text-[var(--muted-foreground)]">
            Penjual ini belum memiliki listing.
          </p>
        ) : null}
      </main>
    </>
  );
    }
