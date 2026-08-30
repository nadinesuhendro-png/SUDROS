cat > /home/claude/marketing-final/factory-page.tsx << 'EOF'
// PATH: app/admin/marketing/factory/page.tsx
// AKSI: BUAT FILE BARU (Content Factory -- pilih beberapa listing sekaligus untuk generate)

import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { generateBatchContent } from "./actions";

type ListingRow = {
  id: string;
  title: string;
  price: number;
  location_city: string;
  listing_images: { image_url: string; sort_order: number }[];
};

type CampaignOption = {
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

export default async function ContentFactoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, price, location_city, listing_images(image_url, sort_order)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<ListingRow[]>();

  const { data: campaigns } = await supabase
    .from("marketing_campaigns")
    .select("id, name")
    .neq("status", "archived")
    .returns<CampaignOption[]>();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
        Content Factory (Batch Generate)
      </h2>
      <p className="text-xs text-[var(--muted-foreground)]">
        Pilih maksimal 5 listing sekaligus untuk digenerate. Proses berjalan berurutan
        (bukan sekaligus paralel) supaya aman terhadap batas rate limit AI.
      </p>

      {error ? (
        <p className="text-sm text-red-600">
          Pilih minimal 1 listing dan 1 platform terlebih dahulu.
        </p>
      ) : null}

      <form action={generateBatchContent} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium">Pilih Listing (maks. 5)</span>
          <div className="flex flex-col gap-2">
            {(listings || []).map((listing) => {
              const sortedImages = [...(listing.listing_images || [])].sort(
                (a, b) => a.sort_order - b.sort_order
              );
              const coverImage = sortedImages[0]?.image_url;

              return (
                <label
                  key={listing.id}
                  className="flex cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-gray-300 p-2 has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50"
                >
                  <input
                    type="checkbox"
                    name="listing_ids"
                    value={listing.id}
                    className="h-4 w-4"
                  />
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-[var(--radius)] bg-gray-100">
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">{listing.title}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatPrice(listing.price)} • {listing.location_city}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Platform</label>
          <select
            name="platform"
            defaultValue="instagram"
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="general">Umum</option>
          </select>
        </div>

        {(campaigns || []).length > 0 ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Campaign (opsional)</label>
            <select
              name="campaign_id"
              defaultValue=""
              className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Tanpa campaign</option>
              {(campaigns || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <button
          type="submit"
          className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          ✨ Generate Semua
        </button>
      </form>
    </div>
  );
}
EOF
echo done
