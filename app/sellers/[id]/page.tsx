// Taruh file ini di: app/sellers/[id]/page.tsx (timpa total)
// PERUBAHAN:
// 1. Desain di-redesign — hero header dengan gradient navy (samain palet sama homepage: #08264A/#1268B3/#168ED0),
//    kartu listing lebih rapi dengan shadow & hover effect.
// 2. Nama toko sekarang ambil profiles.full_name dulu, fallback ke username (nomor HP) kalau kosong —
//    sama pola fix yang dipakai di dashboard.
// 3. Tombol "Hubungi via WhatsApp" ditambahkan di header toko (pakai profiles.phone, format kanonik 62xxx)
//    dan di tiap kartu listing (pakai listings.owner_whatsapp, di-canonical-in dulu).

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { logPageView } from "@/lib/analytics/log-page-view";

type SellerProfile = {
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
};

type SellerListing = {
  id: string;
  title: string;
  price: number;
  location_city: string;
  location_area: string | null;
  owner_whatsapp: string | null;
  listing_images: { image_url: string; sort_order: number }[];
};

const deepBlue = "#08264A";
const royalBlue = "#1268B3";
const brightBlue = "#168ED0";
const paleBlue = "#EAF5FC";
const borderBlue = "#D9E8F4";

function formatPrice(price: number) {
  if (!price) return "Hubungi untuk harga";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

// Format nomor jadi digit kanonik (62xxx) buat link wa.me
function toWaDigits(value: string | null): string | null {
  if (!value) return null;
  let digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  if (!digits.startsWith("62")) digits = "62" + digits;
  return digits;
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.29-1.39a9.9 9.9 0 0 0 4.7 1.2h.01c5.46 0 9.91-4.45 9.91-9.9C21.96 6.45 17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.13.11-1.82-.12-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.16-4.94-4.35-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.2-.15.32-.3.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.24.66-.15.27.1 1.71.81 2 .96.29.14.48.21.55.33.07.13.07.72-.17 1.4Z" />
    </svg>
  );
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: seller } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url, phone")
    .eq("id", id)
    .single<SellerProfile>();

  if (!seller) {
    notFound();
  }

  after(() => logPageView("seller_profile", `/sellers/${id}`, id));

  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, title, price, location_city, location_area, owner_whatsapp, listing_images(image_url, sort_order)"
    )
    .eq("owner_id", id)
    .order("created_at", { ascending: false })
    .returns<SellerListing[]>();

  const listingList = listings || [];
  const storeName = seller.full_name || seller.username || "Toko";
  const initials = storeName.charAt(0).toUpperCase();
  const sellerWaDigits = toWaDigits(seller.phone);
  const sellerWaLink = sellerWaDigits
    ? `https://wa.me/${sellerWaDigits}?text=${encodeURIComponent(`Halo, saya lihat toko ${storeName} di SUDROS`)}`
    : null;

  return (
    <>
      <Navbar />

      {/* HERO HEADER */}
      <section
        className="relative overflow-hidden px-5 py-14 text-white sm:py-20"
        style={{
          background: "linear-gradient(135deg,#061C37 0%,#0A4276 55%,#137DBD 100%)",
        }}
      >
        <div
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(42,169,224,.18)" }}
        />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white/20 bg-white shadow-xl">
            {seller.avatar_url ? (
              <Image src={seller.avatar_url} alt={storeName} fill className="object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-3xl font-extrabold"
                style={{ color: royalBlue }}
              >
                {initials}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{storeName}</h1>
            <p className="mt-1 text-sm text-white/60">
              {listingList.length} listing aktif
            </p>
          </div>

          {sellerWaLink && (
            <a
              href={sellerWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <WhatsAppIcon size={17} />
              Hubungi via WhatsApp
            </a>
          )}
        </div>
      </section>

      {/* LISTINGS */}
      <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        {listingList.length === 0 ? (
          <div
            className="rounded-3xl border border-dashed p-12 text-center"
            style={{ borderColor: borderBlue }}
          >
            <p className="text-sm font-semibold" style={{ color: deepBlue }}>
              Belum ada listing.
            </p>
            <p className="mt-1 text-sm text-slate-500">Penjual ini belum menambahkan listing.</p>
          </div>
        ) : (
          <>
            <h2 className="mb-5 text-lg font-extrabold tracking-tight" style={{ color: deepBlue }}>
              Listing dari {storeName}
            </h2>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
              {listingList.map((listing) => {
                const sortedImages = [...(listing.listing_images || [])].sort(
                  (a, b) => a.sort_order - b.sort_order
                );
                const coverImage = sortedImages[0]?.image_url;
                const listingWaDigits = toWaDigits(listing.owner_whatsapp);
                const listingWaLink = listingWaDigits
                  ? `https://wa.me/${listingWaDigits}?text=${encodeURIComponent(
                      `Halo, saya tertarik dengan "${listing.title}" di SUDROS`
                    )}`
                  : null;

                return (
                  <div
                    key={listing.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                    style={{ borderColor: borderBlue }}
                  >
                    <Link href={`/listings/${listing.id}`} className="block">
                      <div className="relative aspect-square w-full" style={{ backgroundColor: paleBlue }}>
                        {coverImage ? (
                          <Image
                            src={coverImage}
                            alt={listing.title}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center text-xs font-medium"
                            style={{ color: "#9BB6C9" }}
                          >
                            Tidak ada foto
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <Link href={`/listings/${listing.id}`}>
                        <span
                          className="line-clamp-2 text-sm font-semibold"
                          style={{ color: deepBlue }}
                        >
                          {listing.title}
                        </span>
                      </Link>

                      <span className="text-sm font-bold" style={{ color: royalBlue }}>
                        {formatPrice(listing.price)}
                      </span>

                      <span className="text-xs text-slate-500">
                        {[listing.location_area, listing.location_city].filter(Boolean).join(", ")}
                      </span>

                      {listingWaLink && (
                        <a
                          href={listingWaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] py-2 text-[11px] font-bold text-white transition hover:opacity-90"
                        >
                          <WhatsAppIcon size={13} />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </>
  );
}
