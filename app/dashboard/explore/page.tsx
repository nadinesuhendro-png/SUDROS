// PATH: app/dashboard/explore/page.tsx
// AKSI: GANTI SELURUH ISI FILE (tambah sorting & pagination)

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

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "price_asc", label: "Harga Terendah" },
  { value: "price_desc", label: "Harga Tertinggi" },
  { value: "popular", label: "Populer" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

function buildPageHref(
  params: Record<string, string | undefined>,
  page: number
) {
  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  if (params.category) usp.set("category", params.category);
  if (params.city) usp.set("city", params.city);
  if (params.sort) usp.set("sort", params.sort);
  usp.set("page", String(page));
  return `/dashboard/explore?${usp.toString()}`;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    city?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const { q, category, city, sort, page } = await searchParams;
  const supabase = await createClient();

  const sortValue: SortValue = SORT_OPTIONS.some((o) => o.value === sort)
    ? (sort as SortValue)
    : "newest";

  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name")
    .returns<Category[]>();

  let query = supabase
    .from("listings")
    .select(
      "id, title, price, location_city, location_area, listing_images(image_url, sort_order)",
      { count: "exact" }
    )
    .eq("status", "active");

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  if (category) {
    query = query.eq("category_id", category);
  }

  if (city) {
    query = query.ilike("location_city", `%${city}%`);
  }

  if (sortValue === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sortValue === "price_desc") {
    query = query.order("price", { ascending: false });
  } else if (sortValue === "popular") {
    query = query.order("views_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const {
    data: listings,
    count,
  } = await query.range(from, to).returns<ListingCard[]>();

  const hasActiveFilter = Boolean(q || category || city);
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;
  const paramsForHref = { q, category, city, sort: sortValue };

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
        <select
          name="sort"
          defaultValue={sortValue}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--foreground)]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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

      {totalPages > 1 ? (
        <div className="mt-2 flex items-center justify-center gap-3 text-sm">
          {currentPage > 1 ? (
            <Link
              href={buildPageHref(paramsForHref, currentPage - 1)}
              className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-1.5 text-[var(--foreground)]"
            >
              ← Sebelumnya
            </Link>
          ) : null}
          <span className="text-[var(--muted-foreground)]">
            Halaman {currentPage} dari {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link
              href={buildPageHref(paramsForHref, currentPage + 1)}
              className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-1.5 text-[var(--foreground)]"
            >
              Selanjutnya →
            </Link>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
