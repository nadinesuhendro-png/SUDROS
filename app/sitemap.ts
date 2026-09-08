// AKSI: BUAT FILE BARU
// PATH: app/sitemap.ts

import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

const SITE_URL = "https://www.sudros.id";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: categories } = await supabase.from("categories").select("name");
  const { data: listings } = await supabase
    .from("listings")
    .select("id, location_city, created_at")
    .limit(5000);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/pricing`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = (categories || []).map((c) => ({
    url: `${SITE_URL}/kategori/${slugify(c.name)}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const cities = Array.from(
    new Set((listings || []).map((l: { location_city: string }) => l.location_city))
  );
  const locationRoutes: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${SITE_URL}/lokasi/${slugify(c)}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const listingRoutes: MetadataRoute.Sitemap = (listings || []).map(
    (l: { id: string; created_at: string }) => ({
      url: `${SITE_URL}/listings/${l.id}`,
      lastModified: l.created_at ? new Date(l.created_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    })
  );

  return [...staticRoutes, ...categoryRoutes, ...locationRoutes, ...listingRoutes];
}

