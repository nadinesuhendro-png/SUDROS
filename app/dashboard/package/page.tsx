// PATH: app/dashboard/package/page.tsx
// AKSI: GANTI SELURUH ISI FILE (refactor pakai FeatureGate)

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserEntitlements } from "@/lib/entitlements/service";
import FeatureGate from "@/components/FeatureGate";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { dateStyle: "long" });
}

function QuotaBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <span>{label}</span>
        <span>
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percent}%`,
            backgroundColor: percent >= 100 ? "#dc2626" : "var(--primary)",
          }}
        />
      </div>
    </div>
  );
}

export default async function PackageUsagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const entitlements = await getUserEntitlements(user!.id);
  const pkg = entitlements.package;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1
        className="text-lg font-semibold"
        style={{ color: "var(--primary-dark)" }}
      >
        Penggunaan Paket
      </h1>

      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-base font-semibold text-[var(--card-foreground)]">
            {pkg?.name || "Free"}
          </p>
          {entitlements.isFreeTier ? (
            <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
              Free
            </span>
          ) : (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
              Aktif
            </span>
          )}
        </div>

        {!entitlements.isFreeTier && entitlements.expiresAt ? (
          <p className="mb-1 text-xs text-[var(--muted-foreground)]">
            Berlaku sejak {entitlements.startedAt ? formatDate(entitlements.startedAt) : "-"}
            {" "}sampai {formatDate(entitlements.expiresAt)}
          </p>
        ) : null}

        {!entitlements.isFreeTier &&
        entitlements.daysRemaining !== null &&
        entitlements.daysRemaining <= 3 ? (
          <div className="mb-3 rounded-[var(--radius)] bg-yellow-50 px-3 py-2 text-xs text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400">
            Paket Anda akan berakhir dalam {entitlements.daysRemaining} hari.{" "}
            <Link href="/pricing" className="font-medium underline">
              Perpanjang Sekarang
            </Link>
          </div>
        ) : null}

        {entitlements.isFreeTier ? (
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">
            Anda belum memiliki paket berbayar aktif. Menggunakan kuota paket
            Free.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Kuota
        </p>
        <QuotaBar
          label="Listing Aktif"
          used={entitlements.quotas.listings.used}
          limit={entitlements.quotas.listings.limit}
        />
        <QuotaBar
          label="Featured Listing"
          used={entitlements.quotas.featured.used}
          limit={entitlements.quotas.featured.limit}
        />
      </div>

      <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Fitur Paket Anda
        </p>

        <p className="text-sm text-[var(--card-foreground)]">
          {pkg?.homepagePriority ? "✓" : "✕"} Prioritas Beranda
        </p>
        <p className="text-sm text-[var(--card-foreground)]">
          {pkg?.categoryPriority ? "✓" : "✕"} Prioritas Kategori
        </p>
        <p className="text-sm text-[var(--card-foreground)]">
          {pkg?.sellerBadge ? "✓" : "✕"} Badge Penjual
        </p>
        <p className="text-sm text-[var(--card-foreground)]">
          {pkg?.brandProfile ? "✓" : "✕"} Profil Brand
        </p>
        <p className="text-sm text-[var(--card-foreground)]">
          {pkg?.prioritySupport ? "✓" : "✕"} Dukungan Prioritas
        </p>

        <FeatureGate
          entitlements={entitlements}
          feature="analytics"
          reason="Upgrade paket untuk melihat performa listing Anda secara detail."
        >
          <p className="text-sm text-[var(--card-foreground)]">
            ✓ Analytics ({pkg?.analyticsLevel})
          </p>
        </FeatureGate>
      </div>

      <Link
        href="/pricing"
        className="rounded-[var(--radius)] py-3 text-center text-sm font-semibold text-white"
        style={{ backgroundColor: "var(--primary)" }}
      >
        {entitlements.isFreeTier ? "Lihat Paket" : "Upgrade Paket"}
      </Link>
    </main>
  );
}
