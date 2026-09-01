// PATH: app/listings/[id]/page.tsx
// AKSI: GANTI SELURUH ISI FILE (tambah tombol Kirim Pesan)

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import ListingGallery from "./ListingGallery";
import ReportButton from "./ReportButton";
import FavoriteButton from "./FavoriteButton";
import WhatsAppButton from "./WhatsAppButton";
import { startConversation } from "@/app/dashboard/messages/actions";

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
  profiles: {
    username: string;
    whatsapp: string | null;
    avatar_url: string | null;
  } | null;
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, title, description, price, location_city, location_area, owner_id, listing_images(image_url, sort_order), categories(name), profiles(username, whatsapp, avatar_url)"
    )
    .eq("id", id)
    .single<ListingDetail>();

  if (!listing) {
    notFound();
  }

  await supabase.rpc("increment_listing_view", { p_listing_id: id });

  const sortedImages = [...(listing.listing_images || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.image_url);

  const whatsapp = listing.profiles?.whatsapp;
  const waMessage = encodeURIComponent(
    `Halo, saya tertarik dengan listing "${listing.title}" di SUDROS.`
  );
  const waLink = whatsapp ? `https://wa.me/${whatsapp}?text=${waMessage}` : null;

  const isOwnListing = user?.id === listing.owner_id;

  return (
    <>
      <Navbar />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
        <ListingGallery images={sortedImages} title={listing.title} />

        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-semibold" style={{ color: "var(--primary-dark)" }}>
            {listing.title}
          </h1>
          <FavoriteButton listingId={listing.id} />
        </div>

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
          <Link
            href={`/sellers/${listing.owner_id}`}
            className="mt-2 flex items-center gap-3 rounded-[var(--radius)] border border-gray-200 p-3 text-sm"
          >
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
              {listing.profiles.avatar_url ? (
                <Image
                  src={listing.profiles.avatar_url}
                  alt={listing.profiles.username}
                  fill
                  className="object-cover"
                />
              ) : null}
            </div>
            <span>
              Diposting oleh{" "}
              <span className="font-medium">{listing.profiles.username}</span>
            </span>
          </Link>
        ) : null}

        <div className="flex flex-col gap-2">
          {waLink ? (
            <WhatsAppButton listingId={listing.id} waLink={waLink} />
          ) : (
            <p className="text-center text-xs text-[var(--muted-foreground)]">
              Penjual belum menambahkan nomor WhatsApp
            </p>
          )}

          {!isOwnListing && user ? (
            <form action={startConversation}>
              <input type="hidden" name="seller_id" value={listing.owner_id} />
              <input type="hidden" name="listing_id" value={listing.id} />
              <button
                type="submit"
                className="w-full rounded-[var(--radius)] border py-2.5 text-sm font-medium"
                style={{
                  borderColor: "var(--primary)",
                  color: "var(--primary)",
                }}
              >
                💬 Kirim Pesan
              </button>
            </form>
          ) : null}

          {!isOwnListing && !user ? (
            <Link
              href="/login"
              className="block w-full rounded-[var(--radius)] border py-2.5 text-center text-sm font-medium"
              style={{
                borderColor: "var(--primary)",
                color: "var(--primary)",
              }}
            >
              💬 Masuk untuk Kirim Pesan
            </Link>
          ) : null}
        </div>

        <div className="mt-2 flex justify-center">
          <ReportButton listingId={listing.id} />
        </div>
      </main>
    </>
  );
}
