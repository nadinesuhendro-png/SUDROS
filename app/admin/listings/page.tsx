// PATH: app/admin/listings/page.tsx
// AKSI: GANTI TOTAL (tambah: baca ?highlight=id dari notifikasi, sorot + auto-scroll ke listing itu)

import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { moderateListing } from "./actions";
import ModerationButton from "./ModerationButton";
import ScrollToHighlight from "./ScrollToHighlight";

type AdminListing = {
  id: string;
  title: string;
  price: number;
  status: string;
  location_city: string;
  listing_images: { image_url: string; sort_order: number }[];
  profiles: { username: string } | null;
};

const statusLabel: Record<string, string> = {
  active: "Aktif",
  pending: "Pending",
  rejected: "Ditolak",
  suspended: "Ditangguhkan",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    highlight?: string;
    debug?: string;
    detail?: string;
    is_admin_rpc?: string;
    is_admin_rpc_error?: string;
    my_id?: string;
    owner_id?: string;
    role?: string;
    listing_id?: string;
  }>;
}) {
  const params = await searchParams;
  const highlightId = params.highlight || null;

  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, title, price, status, location_city, listing_images(image_url, sort_order), profiles(username)"
    )
    .order("created_at", { ascending: false })
    .returns<AdminListing[]>();

  return (
    <div className="flex flex-col gap-2">
      <ScrollToHighlight id={highlightId} />

      {params.debug ? (
        <div
          className="rounded-[var(--radius)] border p-3 text-xs"
          style={{ borderColor: "#dc2626", backgroundColor: "#fef2f2", color: "#7f1d1d" }}
        >
          <p className="font-bold">DEBUG: {params.debug}</p>
          {params.detail ? <p>detail: {decodeURIComponent(params.detail)}</p> : null}
          {params.is_admin_rpc ? <p>is_admin_rpc: {params.is_admin_rpc}</p> : null}
          {params.is_admin_rpc_error ? (
            <p>is_admin_rpc_error: {decodeURIComponent(params.is_admin_rpc_error)}</p>
          ) : null}
          {params.my_id ? <p>my_id (admin): {params.my_id}</p> : null}
          {params.owner_id ? <p>owner_id (listing): {params.owner_id}</p> : null}
          {params.role ? <p>role: {params.role}</p> : null}
          {params.listing_id ? <p>listing_id: {params.listing_id}</p> : null}
        </div>
      ) : null}

      <h2 className="text-sm font-semibold text-[var(--muted-foreground)]">
        Listings ({(listings || []).length})
      </h2>

      {(listings || []).map((listing) => {
        const sortedImages = [...(listing.listing_images || [])].sort(
          (a, b) => a.sort_order - b.sort_order
        );
        const coverImage = sortedImages[0]?.image_url;
        const isHighlighted = highlightId === listing.id;

        return (
          <div
            key={listing.id}
            id={`listing-${listing.id}`}
            className="flex flex-col gap-2 rounded-[var(--radius)] border p-3 text-sm transition-colors"
            style={
              isHighlighted
                ? {
                    borderColor: "var(--primary)",
                    backgroundColor: "var(--muted)",
                    boxShadow: "0 0 0 2px var(--primary)",
                  }
                : { borderColor: "var(--border, #e5e7eb)" }
            }
          >
            <div className="flex gap-3">
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

              <div className="flex flex-1 flex-col gap-1">
                <span className="font-medium">{listing.title}</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {formatPrice(listing.price)} • {listing.location_city} •{" "}
                  {listing.profiles?.username || "-"}
                </span>
                <span className="text-xs font-medium">
                  Status: {statusLabel[listing.status] || listing.status}
                </span>
              </div>

              <form action={moderateListing} className="flex flex-col gap-1">
                <input type="hidden" name="id" value={listing.id} />
                {listing.status !== "active" ? (
                  <button
                    type="submit"
                    name="status"
                    value="active"
                    className="rounded-[var(--radius)] border border-green-300 px-2 py-1 text-xs text-green-700"
                  >
                    Approve
                  </button>
                ) : null}
                {listing.status !== "suspended" ? (
                  <button
                    type="submit"
                    name="status"
                    value="suspended"
                    className="rounded-[var(--radius)] border border-yellow-300 px-2 py-1 text-xs text-yellow-700"
                  >
                    Suspend
                  </button>
                ) : null}
                {listing.status !== "rejected" ? (
                  <button
                    type="submit"
                    name="status"
                    value="rejected"
                    className="rounded-[var(--radius)] border border-red-300 px-2 py-1 text-xs text-red-700"
                  >
                    Reject
                  </button>
                ) : null}
              </form>
            </div>

            <ModerationButton listingId={listing.id} />
          </div>
        );
      })}
    </div>
  );
}
