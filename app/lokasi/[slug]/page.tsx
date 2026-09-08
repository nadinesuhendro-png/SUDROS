// AKSI: BUAT FILE BARU
// PATH: app/lokasi/[slug]/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ListingCard, type ListingCardData } from "@/components/listing-card";

const SITE_URL = "https://www.sudros.id";
const deepBlue = "#0b2a52";
const royalBlue = "#1d6fb8";

async function getCityName(slug: string) {
  const supabase = await createClient();
  // Skema belum punya tabel lokasi terpisah, jadi kota diturunkan dari
  // listing yang ada. Ambil sampel besar lalu dedupe di JS.
  const { data: rows } = await supabase
    .from("listings")
    .select("location_city")
    .limit(1000);

  const uniqueCities = Array.from(
    new Set((rows || []).map((r: { location_city: string }) => r.location_city))
  );
  return uniqueCities.find((c) => slugify(c) === slug) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityName(slug);
  if (!city) return {};

  const title = `Listing Lokal di ${city} | SUDROS`;
  const description = `Temukan usaha, produk, jasa, dan tempat di ${city}. Jelajahi listing lokal ${city} di SUDROS.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/lokasi/${slug}` },
    openGraph: { title, description, url: `${SITE_URL}/lokasi/${slug}`, type: "website" },
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = await getCityName(slug);
  if (!city) notFound();

  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, title, price, location_city, location_area, listing_images(image_url, sort_order)"
    )
    .ilike("location_city", city)
    .order("created_at", { ascending: false })
    .limit(48)
    .returns<ListingCardData[]>();

  const listingList = listings || [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Listing di ${city} - SUDROS`,
    url: `${SITE_URL}/lokasi/${slug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: city, item: `${SITE_URL}/lokasi/${slug}` },
      ],
    },
  };

  return (
    <div style={{ color: deepBlue }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
          <Link href="/" style={{ color: royalBlue }}>Beranda</Link>
          <span className="mx-1">/</span>
          <span>{city}</span>
        </nav>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Listing di {city}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Usaha, produk, jasa, dan tempat di {city}, langsung terhubung ke penjualnya.
        </p>

        {listingList.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed p-10 text-center" style={{ borderColor: "#cfe0ef" }}>
            <p className="text-sm font-semibold">SUDROS sedang berkembang.</p>
            <p className="mt-1 text-sm text-slate-600">
              Belum ada listing di {city}. Jadilah yang pertama.
            </p>
            <Link
              href="/register"
              className="mt-4 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: royalBlue }}
            >
              Buat Listing Pertama
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {listingList.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
