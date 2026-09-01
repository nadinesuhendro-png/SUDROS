// PATH: lib/entitlements/service.ts
// AKSI: GANTI SELURUH ISI FILE (tambah canUserAccess & getFeatureLimit reusable)

import { createClient } from "@/lib/supabase/server";

export type UserEntitlements = {
  hasActivePackage: boolean;
  isFreeTier: boolean;
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

// Fitur boolean paket (nyala/mati) yang bisa dicek dengan canUserAccess()
export type BooleanFeatureKey =
  | "homepagePriority"
  | "categoryPriority"
  | "sellerBadge"
  | "brandProfile"
  | "prioritySupport"
  | "analytics";

// Fitur berbasis kuota (angka) yang bisa dicek dengan getFeatureLimit()
export type QuotaFeatureKey = "listings" | "featured";

type PackageRow = {
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
};

type ActivePackageRow = {
  started_at: string;
  expires_at: string;
  advertising_packages: PackageRow | null;
};

function buildQuotaEntitlements(
  pkg: PackageRow,
  listingsUsed: number,
  featuredUsed: number,
  startedAt: string | null,
  expiresAt: string | null,
  isFreeTier: boolean
): UserEntitlements {
  const listingsRemaining = Math.max(0, pkg.max_active_listings - listingsUsed);
  const featuredRemaining = Math.max(0, pkg.featured_limit - featuredUsed);

  let daysRemaining: number | null = null;
  if (expiresAt) {
    const expiresAtMs = new Date(expiresAt).getTime();
    daysRemaining = Math.max(
      0,
      Math.ceil((expiresAtMs - Date.now()) / (1000 * 60 * 60 * 24))
    );
  }

  return {
    hasActivePackage: !isFreeTier,
    isFreeTier,
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
    startedAt,
    expiresAt,
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

// Sumber kebenaran tunggal untuk hak akses user. Selalu panggil ini di
// server (server component atau server action) — jangan pernah percaya
// hasil entitlement dari client. Jika user tidak punya langganan
// berbayar aktif, otomatis fallback ke limit paket "free".
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

  if (activePackage && activePackage.advertising_packages) {
    return buildQuotaEntitlements(
      activePackage.advertising_packages,
      listingsUsed,
      featuredUsed,
      activePackage.started_at,
      activePackage.expires_at,
      false
    );
  }

  // Tidak ada langganan berbayar aktif — fallback ke paket Free
  const { data: freePackage } = await supabase
    .from("advertising_packages")
    .select(
      "id, name, slug, max_active_listings, featured_limit, analytics_level, homepage_priority, category_priority, seller_badge, brand_profile, priority_support"
    )
    .eq("slug", "free")
    .eq("is_active", true)
    .maybeSingle<PackageRow>();

  if (!freePackage) {
    // Fallback darurat kalau paket Free tidak ditemukan/dinonaktifkan admin —
    // jangan biarkan seluruh dashboard error, tapi tetap tidak bisa apa-apa
    return buildQuotaEntitlements(
      {
        id: "",
        name: "Free",
        slug: "free",
        max_active_listings: 0,
        featured_limit: 0,
        analytics_level: "none",
        homepage_priority: false,
        category_priority: false,
        seller_badge: false,
        brand_profile: false,
        priority_support: false,
      },
      listingsUsed,
      featuredUsed,
      null,
      null,
      true
    );
  }

  return buildQuotaEntitlements(
    freePackage,
    listingsUsed,
    featuredUsed,
    null,
    null,
    true
  );
}

// Cek satu fitur boolean tertentu dari entitlement yang SUDAH diambil.
// Operasi murni (tidak query DB lagi) — panggil getUserEntitlements() sekali
// di server component/action, lalu pakai hasilnya untuk semua pengecekan.
export function canUserAccess(
  entitlements: UserEntitlements,
  feature: BooleanFeatureKey
): boolean {
  if (!entitlements.package) return false;

  switch (feature) {
    case "homepagePriority":
      return entitlements.package.homepagePriority;
    case "categoryPriority":
      return entitlements.package.categoryPriority;
    case "sellerBadge":
      return entitlements.package.sellerBadge;
    case "brandProfile":
      return entitlements.package.brandProfile;
    case "prioritySupport":
      return entitlements.package.prioritySupport;
    case "analytics":
      return (
        entitlements.package.analyticsLevel !== "none" &&
        Boolean(entitlements.package.analyticsLevel)
      );
    default:
      return false;
  }
}

// Ambil limit/usage/remaining untuk satu fitur berbasis kuota, dari
// entitlement yang sudah diambil. Sama seperti canUserAccess — tidak
// query DB lagi.
export function getFeatureLimit(
  entitlements: UserEntitlements,
  feature: QuotaFeatureKey
): { limit: number; used: number; remaining: number } {
  return entitlements.quotas[feature];
      }
