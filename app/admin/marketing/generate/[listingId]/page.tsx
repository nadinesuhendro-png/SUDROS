// PATH: app/admin/marketing/generate/[listingId]/page.tsx
// AKSI: BUAT FILE BARU

import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateContent } from "../../actions";

type ListingDetail = {
  id: string;
  title: string;
  price: number;
  location_city: string;
  status: string;
  categories: { name: string } | null;
  listing_images: { image_url: string; sort_order: number }[];
};

const platforms = [
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "facebook", label: "Facebook", icon: "👍" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "whatsapp", label: "WhatsApp", icon: "💬" },
  { value: "general", label: "Umum", icon: "📝" },
] as const;

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function GeneratePlatformPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, title, price, location_city, status, categories(name), listing_images(image_url, sort_order)"
    )
    .eq("id", listingId)
    .maybeSingle<ListingDetail>();

  if (!listing) {
    notFound();
  }

  const sortedImages = [...(listing.listing_images || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const coverImage = sortedImages[0]?.image_url;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
        Pilih Platform
      </h2>

      <div className="flex gap-3 rounded-[var(--radius)] border border-gray-200 p-3">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[var(--radius)] bg-gray-100">
          {coverImage ? (
            <Image src={coverImage} alt={listing.title} fill className="object-cover" />
          ) : null}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{listing.title}</span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {formatPrice(listing.price)} • {listing.location_city}
            {listing.categories?.name ? ` • ${listing.categories.name}` : ""}
          </span>
        </div>
      </div>

      <form action={generateContent} className="flex flex-col gap-3">
        <input type="hidden" name="listing_id" value={listing.id} />

        <div className="flex flex-col gap-2">
          {platforms.map((p) => (
            <label
              key={p.value}
              className="flex cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-gray-300 p-3 text-sm has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50"
            >
              <input
                type="radio"
                name="platform"
                value={p.value}
                defaultChecked={p.value === "instagram"}
                className="h-4 w-4"
              />
              <span>{p.icon}</span>
              <span className="font-medium">{p.label}</span>
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          ✨ Generate Content
        </button>
        <p className="text-center text-xs text-[var(--muted-foreground)]">
          AI akan dicoba dulu — kalau tidak tersedia, konten template otomatis dibuat
          sehingga kamu tetap bisa lanjut.
        </p>
      </form>
    </div>
  );
            }
