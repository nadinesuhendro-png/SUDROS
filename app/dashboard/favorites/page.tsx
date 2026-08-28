// PATH: app/dashboard/favorites/page.tsx
// AKSI: BUAT FILE BARU (pindahan dari app/favorites/page.tsx — Navbar & redirect dihapus karena sudah dihandle app/dashboard/layout.tsx)

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type FavoriteRow = {
  id: string;
  listings: {
    id: string;
    title: string;
    price: number;
    location_city: string;
    listing_images: { image_url: string; sort_order: number }[];
  } | null;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function FavoritesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      "id, listings(id, title, price, location_city, listing_images(image_url, sort_order))"
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<FavoriteRow[]>();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold" style={{ color: "var(--primary-dark)" }}>
        Favorit Saya
      </h1>

      {(favorites || []).length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Belum ada listing favorit.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {(favorites || [])
          .filter((f) => f.listings)
          .map((f) => {
            const listing = f.listings!;
            const sortedImages = [...(listing.listing_images || [])].sort(
              (a, b) => a.sort_order - b.sort_order
            );
            const coverImage = sortedImages[0]?.image_url;

            return (
              <Link
                key={f.id}
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
    </main>
  );
}
