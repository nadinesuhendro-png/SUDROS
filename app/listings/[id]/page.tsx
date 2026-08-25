// PATH: app/listings/[id]/page.tsx
// AKSI: UPDATE FILE (tampilkan foto profil penjual)

import Image from "next/image";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import ListingGallery from "./ListingGallery";

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

  const sortedImages = [...(listing.listing_images || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.image_url);

  const whatsapp = listing.profiles?.whatsapp;
  const waMessage = encodeURIComponent(
    `Halo, saya tertarik dengan listing "${listing.title}" di SUDROS.`
  );
  const waLink = whatsapp ? `https://wa.me/${whatsapp}?text=${waMessage}` : null;

  return (
    <>
      <Navbar />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
        <ListingGallery images={sortedImages} title={listing.title} />

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
          <div className="mt-2 flex items-center gap-3 rounded-[var(--radius)] border border-gray-200 p-3 text-sm">
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
          </div>
        ) : null}

        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[var(--radius)] bg-green-600 px-4 py-3 text-center text-sm font-medium text-white"
          >
            Hubungi via WhatsApp
          </a>
        ) : (
          <p className="text-center text-xs text-[var(--muted-foreground)]">
            Penjual belum menambahkan nomor WhatsApp
          </p>
        )}
      </main>
    </>
  );
}
