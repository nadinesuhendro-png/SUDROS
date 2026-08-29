// PATH: app/admin/marketing/generate/page.tsx
// AKSI: BUAT FILE BARU

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ListingRow = {
  id: string;
  title: string;
  price: number;
  location_city: string;
  status: string;
  categories: { name: string } | null;
  listing_images: { image_url: string; sort_order: number }[];
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

const statusLabel: Record<string, string> = {
  active: "Aktif",
  pending: "Pending",
  rejected: "Ditolak",
  suspended: "Ditangguhkan",
};

export default async function GenerateSelectListingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select(
      "id, title, price, location_city, status, categories(name), listing_images(image_url, sort_order)"
    )
    .order("created_at", { ascending: false })
    .limit(30);

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data: listings } = await query.returns<ListingRow[]>();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
        Pilih Listing untuk Dipromosikan
      </h2>

      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q || ""}
          placeholder="Cari judul listing..."
          className="flex-1 rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm font-medium"
        >
          Cari
        </button>
      </form>

      {(listings || []).length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Tidak ada listing ditemukan.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {(listings || []).map((listing) => {
          const sortedImages = [...(listing.listing_images || [])].sort(
            (a, b) => a.sort_order - b.sort_order
          );
          const coverImage = sortedImages[0]?.image_url;

          return (
            <Link
              key={listing.id}
              href={`/admin/marketing/generate/${listing.id}`}
              className="flex gap-3 rounded-[var(--radius)] border border-gray-200 p-3"
            >
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-[var(--radius)] bg-gray-100">
                {coverImage ? (
                  <Image
                    src={coverImage}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium">{listing.title}</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {formatPrice(listing.price)} • {listing.location_city}
                  {listing.categories?.name ? ` • ${listing.categories.name}` : ""}
                </span>
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  {statusLabel[listing.status] || listing.status}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
