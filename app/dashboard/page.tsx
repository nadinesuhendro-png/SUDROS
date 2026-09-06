// PATH: app/dashboard/page.tsx
// AKSI: GANTI TOTAL (header sticky saat scroll)

import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  ClipboardList,
  CreditCard,
  CheckCircle2,
  Eye,
  MessageCircle,
  Heart,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { getUserEntitlements } from "@/lib/entitlements/service";

type Profile = {
  username: string;
  role: string;
};

type RecentListing = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    dateStyle: "long",
  });
}

function formatRelative(dateStr: string) {
  const diffDays = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  return formatDate(dateStr);
}

const STATUS_LABEL: Record<string, string> = {
  active: "Listing disetujui",
  pending: "Listing menunggu review",
  rejected: "Listing ditolak",
  suspended: "Listing disuspend",
};

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
  const isUnlimited = !Number.isFinite(listingQuota.limit);
  const quotaPercent = isUnlimited
    ? 100
    : listingQuota.limit > 0
      ? Math.min(100, Math.round((listingQuota.used / listingQuota.limit) * 100))
      : 0;

  const { data: statsRows } = await supabase
    .from("listings")
    .select("views_count, whatsapp_clicks, favorites_count")
    .eq("owner_id", user!.id);

  const totalViews =
    statsRows?.reduce((sum, row: any) => sum + (row.views_count ?? 0), 0) ?? 0;
  const totalWhatsapp =
    statsRows?.reduce((sum, row: any) => sum + (row.whatsapp_clicks ?? 0), 0) ?? 0;
  const totalFavorites =
    statsRows?.reduce((sum, row: any) => sum + (row.favorites_count ?? 0), 0) ?? 0;

  const { data: recentListings } = await supabase
    .from("listings")
    .select("id, title, status, updated_at")
    .eq("owner_id", user!.id)
    .order("updated_at", { ascending: false })
    .limit(3)
    .returns<RecentListing[]>();

  return (
    <main
      className="mx-auto flex max-w-2xl flex-col gap-4 p-6 md:max-w-5xl md:gap-6 md:p-8"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Header — sticky, tidak ikut scroll */}
      <div
        className="sticky top-0 z-30 -mx-6 flex items-center justify-between px-6 py-3 md:-mx-8 md:px-8"
        style={{
          backgroundColor: "var(--background)",
          borderBottom: "1px solid #DCEEFF",
        }}
      >
        <div>
          <h1
            className="text-lg font-semibold md:text-xl"
            style={{ color: "var(--primary-dark)" }}
          >
            Halo, {profile?.username || user?.email} 👋
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Kelola listing dan usahamu hari ini
          </p>
        </div>
        <Image
          src="/brand/sudros-logo.png"
          alt="SUDROS"
          width={80}
          height={50}
          priority
          className="h-auto w-16"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Kolom utama */}
        <div className="flex flex-col gap-4 md:col-span-2">
          {/* Package Card — elemen paling biru */}
          <div
            className="relative overflow-hidden rounded-[var(--radius)] p-5 text-white"
            style={{
              background:
                "linear-gradient(135deg, #062B68 0%, #0757C9 55%, #0878F9 100%)",
            }}
          >
            <span
              className="pointer-events-none absolute -right-6 -top-6 text-[10rem] font-black leading-none opacity-10"
              aria-hidden
            >
              S
            </span>

            <div className="relative mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                Paket Anda
              </p>
              {entitlements.isFreeTier ? (
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">
                  Free
                </span>
              ) : (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                  Aktif
                </span>
              )}
            </div>

            <p className="relative text-lg font-semibold">
              {entitlements.package?.name || "Free"}
            </p>

            <p className="relative mb-3 text-xs text-white/75">
              {listingQuota.used} listing aktif
              {isUnlimited ? " • Unlimited listing" : ""}
              {!entitlements.isFreeTier && !isUnlimited && entitlements.expiresAt
                ? ` • Berlaku sampai ${formatDate(entitlements.expiresAt)}`
                : ""}
            </p>

            {!isUnlimited && (
              <>
                <div className="relative mb-1 flex items-center justify-between text-xs text-white/75">
                  <span>Listing</span>
                  <span>
                    {listingQuota.used} / {listingQuota.limit}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-[#1695FF]"
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>
              </>
            )}
            {isUnlimited && (
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-full rounded-full bg-[#1695FF]" />
              </div>
            )}

            <Link
              href="/pricing"
              className="relative mt-3 inline-flex items-center gap-1 text-xs font-medium text-white"
            >
              {entitlements.isFreeTier ? "Lihat Paket" : "Kelola Paket"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Performa Listing */}
          <div>
            <h2 className="mb-2 text-sm font-semibold text-[var(--card-foreground)]">
              Performa Listing
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-[var(--radius)] border p-4"
                style={{ backgroundColor: "#F1F7FF", borderColor: "#DCEEFF" }}
              >
                <CheckCircle2 className="mb-2 h-5 w-5" style={{ color: "#0757C9" }} />
                <p className="text-2xl font-bold" style={{ color: "#08254D" }}>
                  {listingQuota.used}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Listing aktif</p>
              </div>
              <div
                className="rounded-[var(--radius)] border p-4"
                style={{ backgroundColor: "#F1F7FF", borderColor: "#DCEEFF" }}
              >
                <Eye className="mb-2 h-5 w-5" style={{ color: "#0757C9" }} />
                <p className="text-2xl font-bold" style={{ color: "#08254D" }}>
                  {totalViews}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Dilihat</p>
              </div>
              <div
                className="rounded-[var(--radius)] border p-4"
                style={{ backgroundColor: "#F1F7FF", borderColor: "#DCEEFF" }}
              >
                <MessageCircle className="mb-2 h-5 w-5" style={{ color: "#0757C9" }} />
                <p className="text-2xl font-bold" style={{ color: "#08254D" }}>
                  {totalWhatsapp}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">WhatsApp</p>
              </div>
              <div
                className="rounded-[var(--radius)] border p-4"
                style={{ backgroundColor: "#F1F7FF", borderColor: "#DCEEFF" }}
              >
                <Heart className="mb-2 h-5 w-5" style={{ color: "#0757C9" }} />
                <p className="text-2xl font-bold" style={{ color: "#08254D" }}>
                  {totalFavorites}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Favorit</p>
              </div>
            </div>
          </div>

          {/* CTA utama */}
          <Link
            href="/dashboard/listings/new"
            className="flex items-center justify-center gap-2 rounded-[var(--radius)] py-4 text-sm font-semibold text-white"
            style={{
              backgroundColor: "#0878F9",
              boxShadow: "0 8px 20px -8px rgba(7, 87, 201, 0.5)",
            }}
          >
            <Plus className="h-4 w-4" />
            Buat Listing Baru
          </Link>

          {/* Aktivitas Terbaru */}
          {recentListings && recentListings.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-[var(--card-foreground)]">
                Aktivitas Terbaru
              </h2>
              <ul className="space-y-3 border-l pl-4" style={{ borderColor: "#DCEEFF" }}>
                {recentListings.map((listing) => (
                  <li key={listing.id} className="relative">
                    <span
                      className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          listing.status === "active" ? "#16A34A" : "#0878F9",
                      }}
                    />
                    <p className="text-sm" style={{ color: "#08254D" }}>
                      <span className="font-medium">
                        {STATUS_LABEL[listing.status] || "Listing diperbarui"}
                      </span>{" "}
                      — {listing.title}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatRelative(listing.updated_at)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Kolom samping — Akses Cepat */}
        <div>
          <h2 className="mb-2 text-sm font-semibold text-[var(--card-foreground)] md:mt-0">
            Akses Cepat
          </h2>
          <div className="grid grid-cols-2 gap-3 md:flex md:flex-col">
            <Link
              href="/dashboard/listings"
              className="flex flex-col gap-1 rounded-[var(--radius)] border p-4 text-sm font-medium"
              style={{ backgroundColor: "#F1F7FF", borderColor: "#DCEEFF", color: "#08254D" }}
            >
              <ClipboardList className="h-5 w-5" style={{ color: "#0757C9" }} />
              Listing Saya
              <span className="flex items-center gap-1 text-xs font-normal text-[var(--muted-foreground)]">
                Kelola semua listing <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
            <Link
              href="/dashboard/payments"
              className="flex flex-col gap-1 rounded-[var(--radius)] border p-4 text-sm font-medium"
              style={{ backgroundColor: "#F1F7FF", borderColor: "#DCEEFF", color: "#08254D" }}
            >
              <CreditCard className="h-5 w-5" style={{ color: "#0757C9" }} />
              Riwayat Pembayaran
              <span className="flex items-center gap-1 text-xs font-normal text-[var(--muted-foreground)]">
                Lihat transaksi <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>
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
