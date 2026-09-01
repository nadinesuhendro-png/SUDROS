// PATH: components/FeatureGate.tsx
// AKSI: BUAT FILE BARU

import FeatureLock from "@/components/FeatureLock";
import {
  canUserAccess,
  type BooleanFeatureKey,
  type UserEntitlements,
} from "@/lib/entitlements/service";

const FEATURE_LABELS: Record<BooleanFeatureKey, string> = {
  homepagePriority: "Prioritas Beranda",
  categoryPriority: "Prioritas Kategori",
  sellerBadge: "Badge Penjual",
  brandProfile: "Profil Brand",
  prioritySupport: "Dukungan Prioritas",
  analytics: "Analytics",
};

// Pembungkus UI: kalau entitlement mengizinkan, render children.
// Kalau tidak, tampilkan FeatureLock dengan CTA upgrade.
// PENTING: ini hanya kontrol tampilan. Action yang benar-benar
// menjalankan fitur (server action) WAJIB tetap memvalidasi
// entitlement sendiri di server — jangan andalkan komponen ini
// sebagai satu-satunya lapisan keamanan.
export default function FeatureGate({
  entitlements,
  feature,
  reason,
  children,
}: {
  entitlements: UserEntitlements;
  feature: BooleanFeatureKey;
  reason?: string;
  children: React.ReactNode;
}) {
  const allowed = canUserAccess(entitlements, feature);

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <FeatureLock
      featureName={FEATURE_LABELS[feature]}
      reason={reason}
    />
  );
}
