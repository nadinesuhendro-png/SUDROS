// PATH: app/dashboard/listings/page.tsx
// AKSI: BUAT FILE BARU

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteListing } from "./actions";

type MyListing = {
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

export default async function MyListingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, title, price, location_city, listing_images(image_url, sort_order)"
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .returns<MyListing[]>();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--primary-dark)" }}
        >
          Listing Saya
        </h1>
        <Link
          href="/dashboard/listings/new"
          className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          + Buat Baru
        </Link>
      </div>

      {(listings || []).length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Kamu belum punya listing.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {(listings || []).map((listing) => {
          const sortedImages = [...(listing.listing_images || [])].sort(
            (a, b) => a.sort_order - b.sort_order
          );
          const coverImage = sortedImages[0]?.image_url;

          return (
            <div
              key={listing.id}
              className="flex gap-3 rounded-[var(--radius)] border border-gray-200 p-3"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[var(--radius)] bg-gray-100">
                {coverImage ? (
                  <Image
                    src={coverImage}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="flex flex-1 flex-col gap-1">
                <span className="text-sm font-medium">{listing.title}</span>
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

              <div className="flex flex-col gap-2">
                <Link
                  href={`/dashboard/listings/${listing.id}/edit`}
                  className="rounded-[var(--radius)] border border-gray-300 px-3 py-1 text-center text-xs font-medium"
                >
                  Edit
                </Link>
                <form action={deleteListing}>
                  <input type="hidden" name="id" value={listing.id} />
                  <button
                    type="submit"
                    className="w-full rounded-[var(--radius)] border border-red-300 px-3 py-1 text-xs font-medium text-red-600"
                  >
                    Hapus
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
                  }
