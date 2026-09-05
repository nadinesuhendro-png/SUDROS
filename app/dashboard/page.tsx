// PATH: app/dashboard/page.tsx
// AKSI: GANTI SELURUH ISI FILE (layout responsif desktop, ikon konsisten, logo tetap next/image)

import Image from "next/image";
import Link from "next/link";
import { Plus, ClipboardList, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { getUserEntitlements } from "@/lib/entitlements/service";

type Profile = {
  username: string;
  role: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    dateStyle: "long",
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, role")
    .eq("id", user!.id)
    .single<Profile>();

  const { count: listingCount } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user!.id);

  const entitlements = await getUserEntitlements(user!.id);
  const listingQuota = entitlements.quotas.listings;
  const quotaPercent =
    listingQuota.limit > 0
      ? Math.min(100, Math.round((listingQuota.used / listingQuota.limit) * 100))
      : 0;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6 md:max-w-5xl md:gap-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">Halo,</p>
          <h1
            className="text-lg font-semibold md:text-xl"
            style={{ color: "var(--primary-dark)" }}
          >
            {profile?.username || user?.email}
          </h1>
        </div>
        <Image
          src="/brand/sudros-logo.png"
          alt="SUDROS"
          width={80}
          height={50}
          priority
          className="h-auto w-16 md:w-20"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Kolom utama */}
        <div className="flex flex-col gap-4 md:col-span-2">
          {/* Ringkasan singkat */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                {listingCount || 0}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">Total Listing</p>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                {listingQuota.used}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">Listing Aktif</p>
            </div>
          </div>

          {/* Package Card */}
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                Paket Anda
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

            <p className="text-base font-semibold text-[var(--card-foreground)]">
              {entitlements.package?.name || "Free"}
            </p>

            {!entitlements.isFreeTier && entitlements.expiresAt ? (
              <p className="mb-3 text-xs text-[var(--muted-foreground)]">
                Berlaku sampai {formatDate(entitlements.expiresAt)}
                {entitlements.daysRemaining !== null &&
                entitlements.daysRemaining <= 3
                  ? ` (${entitlements.daysRemaining} hari lagi)`
                  : ""}
              </p>
            ) : (
              <p className="mb-3 text-xs text-[var(--muted-foreground)]">
                Upgrade paket untuk menambah kuota listing dan fitur lainnya.
              </p>
            )}

            <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>Listing</span>
              <span>
                {listingQuota.used} / {listingQuota.limit}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${quotaPercent}%`,
                  backgroundColor:
                    quotaPercent >= 100 ? "var(--destructive)" : "var(--primary)",
                }}
              />
            </div>

            <Link
              href="/pricing"
              className="mt-3 inline-block rounded-[var(--radius)] border border-[var(--border)] px-6 py-2 text-center text-xs font-medium text-[var(--card-foreground)] md:w-auto"
            >
              {entitlements.isFreeTier ? "Lihat Paket" : "Kelola Paket"}
            </Link>
          </div>

          {/* CTA utama */}
          <Link
            href="/dashboard/listings/new"
            className="flex items-center justify-center gap-2 rounded-[var(--radius)] py-4 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <Plus className="h-4 w-4" />
            Buat Listing Baru
          </Link>
        </div>

        {/* Kolom samping (jadi baris di mobile) */}
        <div className="grid grid-cols-2 gap-3 md:flex md:flex-col md:gap-4">
          <Link
            href="/dashboard/listings"
            className="flex flex-col gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 text-sm font-medium text-[var(--card-foreground)]"
          >
            <ClipboardList className="h-5 w-5" style={{ color: "var(--primary)" }} />
            Listing Saya
            <span className="text-xs font-normal text-[var(--muted-foreground)]">
              Kelola listing kamu
            </span>
          </Link>
          <Link
            href="/dashboard/payments"
            className="flex flex-col gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 text-sm font-medium text-[var(--card-foreground)]"
          >
            <CreditCard className="h-5 w-5" style={{ color: "var(--primary)" }} />
            Riwayat Pembayaran
            <span className="text-xs font-normal text-[var(--muted-foreground)]">
              Cek status paket iklan
            </span>
          </Link>
        </div>
      </div>

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Temukan. Tawarkan. Terhubung.
      </p>

      <form action={logout} className="flex justify-center">
        <button
          type="submit"
          className="text-xs text-[var(--muted-foreground)] underline"
        >
          Keluar
        </button>
      </form>
    </main>
  );
}
