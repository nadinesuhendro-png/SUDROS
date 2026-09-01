// PATH: app/dashboard/explore/page.tsx
// AKSI: BUAT FILE BARU

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ListingCard = {
  id: string;
  title: string;
  price: number;
  location_city: string;
  location_area: string | null;
  listing_images: { image_url: string; sort_order: number }[];
};

type Category = {
  id: string;
  name: string;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; city?: string }>;
}) {
  const { q, category, city } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name")
    .returns<Category[]>();

  let query = supabase
    .from("listings")
    .select(
      "id, title, price, location_city, location_area, listing_images(image_url, sort_order)"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  if (category) {
    query = query.eq("category_id", category);
  }

  if (city) {
    query = query.ilike("location_city", `%${city}%`);
  }

  const { data: listings } = await query.returns<ListingCard[]>();

  const hasActiveFilter = Boolean(q || category || city);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 p-6">
      <h1
        className="text-lg font-semibold"
        style={{ color: "var(--primary-dark)" }}
      >
        Jelajahi Listing
      </h1>

      <form
        method="GET"
        className="flex flex-col gap-2 text-left sm:flex-row"
      >
        <input
          type="text"
          name="q"
          defaultValue={q || ""}
          placeholder="Cari listing..."
          className="flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--foreground)]"
        />
        <select
          name="category"
          defaultValue={category || ""}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--foreground)]"
        >
          <option value="">Semua Kategori</option>
          {(categories || []).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="city"
          defaultValue={city || ""}
          placeholder="Kota"
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--foreground)] sm:w-32"
        />
        <button
          type="submit"
          className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Cari
        </button>
      </form>

      {hasActiveFilter ? (
        <Link
          href="/dashboard/explore"
          className="text-xs text-[var(--muted-foreground)] underline"
        >
          Reset filter
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {(listings || []).map((listing) => {
          const sortedImages = [...(listing.listing_images || [])].sort(
            (a, b) => a.sort_order - b.sort_order
          );
          const coverImage = sortedImages[0]?.image_url;

          return (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]"
            >
              <div className="relative aspect-square w-full bg-[var(--muted)]">
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
                <span className="line-clamp-2 text-sm font-medium text-[var(--card-foreground)]">
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
        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          {hasActiveFilter
            ? "Tidak ada listing yang cocok dengan pencarian."
            : "Belum ada listing aktif saat ini."}
        </p>
      ) : null}
    </main>
  );
}
