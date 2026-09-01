// PATH: lib/entitlements/service.ts
// AKSI: BUAT FILE BARU

import { createClient } from "@/lib/supabase/server";

export type UserEntitlements = {
  hasActivePackage: boolean;
  package: {
    id: string;
    name: string;
    slug: string;
    analyticsLevel: string;
    homepagePriority: boolean;
    categoryPriority: boolean;
    sellerBadge: boolean;
    brandProfile: boolean;
    prioritySupport: boolean;
  } | null;
  startedAt: string | null;
  expiresAt: string | null;
  daysRemaining: number | null;
  quotas: {
    listings: { limit: number; used: number; remaining: number };
    featured: { limit: number; used: number; remaining: number };
  };
  canCreateListing: boolean;
  canFeatureListing: boolean;
};

const EMPTY_ENTITLEMENTS: UserEntitlements = {
  hasActivePackage: false,
  package: null,
  startedAt: null,
  expiresAt: null,
  daysRemaining: null,
  quotas: {
    listings: { limit: 0, used: 0, remaining: 0 },
    featured: { limit: 0, used: 0, remaining: 0 },
  },
  canCreateListing: false,
  canFeatureListing: false,
};

type ActivePackageRow = {
  expires_at: string;
  started_at: string;
  advertising_packages: {
    id: string;
    name: string;
    slug: string;
    max_active_listings: number;
    featured_limit: number;
    analytics_level: string;
    homepage_priority: boolean;
    category_priority: boolean;
    seller_badge: boolean;
    brand_profile: boolean;
    priority_support: boolean;
  } | null;
};

// Sumber kebenaran tunggal untuk hak akses user. Selalu panggil ini di
// server (server component atau server action) — jangan pernah percaya
// hasil entitlement dari client.
export async function getUserEntitlements(
  userId: string
): Promise<UserEntitlements> {
  const supabase = await createClient();

  const { data: activePackage } = await supabase
    .from("user_active_packages")
    .select(
      "started_at, expires_at, advertising_packages(id, name, slug, max_active_listings, featured_limit, analytics_level, homepage_priority, category_priority, seller_badge, brand_profile, priority_support)"
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .gte("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle<ActivePackageRow>();

  if (!activePackage || !activePackage.advertising_packages) {
    return EMPTY_ENTITLEMENTS;
  }

  const pkg = activePackage.advertising_packages;

  const { count: activeListingCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("status", "active");

  const { count: featuredCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("is_featured", true);

  const listingsUsed = activeListingCount || 0;
  const featuredUsed = featuredCount || 0;

  const listingsRemaining = Math.max(0, pkg.max_active_listings - listingsUsed);
  const featuredRemaining = Math.max(0, pkg.featured_limit - featuredUsed);

  const expiresAtMs = new Date(activePackage.expires_at).getTime();
  const daysRemaining = Math.max(
    0,
    Math.ceil((expiresAtMs - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return {
    hasActivePackage: true,
    package: {
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      analyticsLevel: pkg.analytics_level,
      homepagePriority: pkg.homepage_priority,
      categoryPriority: pkg.category_priority,
      sellerBadge: pkg.seller_badge,
      brandProfile: pkg.brand_profile,
      prioritySupport: pkg.priority_support,
    },
    startedAt: activePackage.started_at,
    expiresAt: activePackage.expires_at,
    daysRemaining,
    quotas: {
      listings: {
        limit: pkg.max_active_listings,
        used: listingsUsed,
        remaining: listingsRemaining,
      },
      featured: {
        limit: pkg.featured_limit,
        used: featuredUsed,
        remaining: featuredRemaining,
      },
    },
    canCreateListing: listingsRemaining > 0,
    canFeatureListing: featuredRemaining > 0,
  };
    }
