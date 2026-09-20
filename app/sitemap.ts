import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server' // sesuaikan path client Supabase kamu

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sudros.id'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ]

  const supabase = await createClient()

  // Listing aktif
  const { data: listings } = await supabase
    .from('listings')
    .select('id, updated_at')
    .eq('status', 'active')

  const listingRoutes: MetadataRoute.Sitemap = (listings ?? []).map((l) => ({
    url: `${baseUrl}/listings/${l.id}`,
    lastModified: l.updated_at ? new Date(l.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // Toko/seller
  const { data: sellers } = await supabase
    .from('profiles')
    .select('id, updated_at')
    .eq('is_seller', true) // sesuaikan nama kolom kamu kalau beda

  const sellerRoutes: MetadataRoute.Sitemap = (sellers ?? []).map((s) => ({
    url: `${baseUrl}/sellers/${s.id}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [...staticRoutes, ...listingRoutes, ...sellerRoutes]
}
