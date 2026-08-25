// PATH: app/page.tsx
// AKSI: UPDATE FILE (tambah pencarian & filter)

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

export default async function HomePage({
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

        <form
          method="GET"
          className="flex w-full max-w-2xl flex-col gap-2 text-left sm:flex-row"
        >
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Cari listing..."
            className="flex-1 rounded-[var(--radius)] border border-gray-300 px-4 py-2 text-sm"
          />
          <select
            name="category"
            defaultValue={category || ""}
            className="rounded-[var(--radius)] border border-gray-300 px-4 py-2 text-sm"
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
            className="rounded-[var(--radius)] border border-gray-300 px-4 py-2 text-sm sm:w-32"
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
            href="/"
            className="text-xs text-[var(--muted-foreground)] underline"
          >
            Reset filter
          </Link>
        ) : null}

        <div className="mt-2 grid w-full max-w-5xl grid-cols-2 gap-4 text-left sm:grid-cols-3 md:grid-cols-4">
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
            {hasActiveFilter
              ? "Tidak ada listing yang cocok dengan pencarian."
              : "Belum ada listing. Jadilah yang pertama membuat listing!"}
          </p>
        ) : null}
      </main>
    </>
  );
}
