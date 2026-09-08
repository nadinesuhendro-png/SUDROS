// AKSI: GANTI SELURUH ISI FILE (tambah tracking register_started)
// PATH: app/kategori/[slug]/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { TrackLink } from "@/components/analytics/track-link";

const SITE_URL = "https://www.sudros.id";
const deepBlue = "#0b2a52";
const royalBlue = "#1d6fb8";

type Category = { id: string; name: string };

async function getCategory(slug: string) {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .returns<Category[]>();
  return (categories || []).find((c) => slugify(c.name) === slug) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};

  const title = `${category.name} — Listing Lokal | SUDROS`;
  const description = `Temukan listing ${category.name.toLowerCase()} di sekitarmu. Cari usaha, produk, dan jasa lokal kategori ${category.name} di SUDROS.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/kategori/${slug}` },
    openGraph: { title, description, url: `${SITE_URL}/kategori/${slug}`, type: "website" },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, title, price, location_city, location_area, listing_images(image_url, sort_order)"
    )
    .eq("category_id", category.id)
    .order("created_at", { ascending: false })
    .limit(48)
    .returns<ListingCardData[]>();

  const listingList = listings || [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} - SUDROS`,
    url: `${SITE_URL}/kategori/${slug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: category.name, item: `${SITE_URL}/kategori/${slug}` },
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
          <span>{category.name}</span>
        </nav>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {category.name}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Listing {category.name.toLowerCase()} di sekitarmu, langsung terhubung ke penjualnya.
        </p>

        {listingList.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed p-10 text-center" style={{ borderColor: "#cfe0ef" }}>
            <p className="text-sm font-semibold">SUDROS sedang berkembang.</p>
            <p className="mt-1 text-sm text-slate-600">
              Belum ada listing {category.name.toLowerCase()}. Jadilah yang pertama.
            </p>
            <TrackLink
              href="/register"
              event="register_started"
              eventProperties={{ source: "kategori_empty_state", category: category.name }}
              className="mt-4 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: royalBlue }}
            >
              Buat Listing Pertama
            </TrackLink>
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
