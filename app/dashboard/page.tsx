import { Suspense } from "react";
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
  BarChart3,
  LogOut,
  Gift,
  Zap,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { getUserEntitlements } from "@/lib/entitlements/service";
import { ListingCreatedTracker } from "@/components/analytics/listing-created-tracker";

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

const STATUS_LABEL: Record<string, { text: string; color: string; dot: string }> = {
  active: { text: "Listing disetujui", color: "text-emerald-600", dot: "bg-emerald-500" },
  pending: { text: "Menunggu review", color: "text-amber-600", dot: "bg-amber-500" },
  rejected: { text: "Listing ditolak", color: "text-red-600", dot: "bg-red-500" },
  suspended: { text: "Listing disuspend", color: "text-slate-500", dot: "bg-slate-400" },
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <Suspense fallback={null}>
          <ListingCreatedTracker />
        </Suspense>

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Halo, {profile?.username || user?.email?.split("@")[0]} 👋
            </h1>
            <p className="text-slate-500">
              Kelola listing dan kembangkan usahamu hari ini
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Image
              src="/brand/sudros-logo.png"
              alt="SUDROS"
              width={96}
              height={36}
              priority
              className="h-auto w-24 object-contain"
            />
          </div>
        </header>

        {/* Grid Utama */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri — 8/12 */}
          <div className="lg:col-span-8 space-y-6">
            {/* Kartu Paket — Premium Style */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#062B68] via-[#0757C9] to-[#0878F9] p-6 text-white shadow-xl shadow-blue-500/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-blue-100 flex items-center gap-2">
                    <Gift size={16} />
                    Paket Aktif
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    entitlements.isFreeTier 
                      ? "bg-white/15 text-white" 
                      : "bg-white/20 text-white"
                  }`}>
                    {entitlements.isFreeTier ? "Gratis" : "Premium"}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-1">
                  {entitlements.package?.name || "Paket Gratis"}
                </h3>
                <p className="text-blue-100 text-sm mb-4">
                  {listingQuota.used} listing aktif
                  {isUnlimited && " • Listing tak terbatas"}
                  {!entitlements.isFreeTier && !isUnlimited && entitlements.expiresAt &&
                    ` • Berlaku sampai ${formatDate(entitlements.expiresAt)}`}
                </p>

                {!isUnlimited && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-100">Kouta Listing</span>
                      <span className="font-medium">
                        {listingQuota.used} / {listingQuota.limit}
                      </span>
                    </div>
                    <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-300 rounded-full transition-all duration-500"
                        style={{ width: `${quotaPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {isUnlimited && (
                  <div className="h-2.5 bg-white/20 rounded-full overflow-hidden mb-4">
                    <div className="h-full w-full bg-sky-300 rounded-full" />
                  </div>
                )}

                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-all rounded-lg px-4 py-2 text-sm font-medium mt-1"
                >
                  {entitlements.isFreeTier ? "Tingkatkan Paket" : "Kelola Langganan"}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Statistik Performa */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-slate-900">Performa Listing</h2>
                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                  Semua Waktu
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: CheckCircle2, label: "Listing Aktif", value: listingQuota.used, color: "text-blue-600", bg: "bg-blue-50" },
                  { icon: Eye, label: "Dilihat", value: totalViews, color: "text-indigo-600", bg: "bg-indigo-50" },
                  { icon: MessageCircle, label: "Klik WhatsApp", value: totalWhatsapp, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { icon: Heart, label: "Disukai", value: totalFavorites, color: "text-rose-600", bg: "bg-rose-50" },
                ].map((stat, i) => (
                  <div key={i} className="rounded-xl p-4 bg-slate-50/80 hover:bg-slate-50 transition-colors">
                    <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                      <stat.icon size={18} className={stat.color} />
                    </div>
                    <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tombol Buat Listing Baru */}
            <Link
              href="/dashboard/listings/new"
              className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              <Plus size={20} />
              Buat Listing Baru
              <Zap size={16} className="ml-1 opacity-80" />
            </Link>

            {/* Aktivitas Terbaru */}
            {recentListings && recentListings.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Clock size={18} className="text-slate-400" />
                    Aktivitas Terbaru
                  </h2>
                  <Link 
                    href="/dashboard/listings" 
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Lihat Semua
                  </Link>
                </div>

                <ul className="space-y-3">
                  {recentListings.map((listing) => {
                    const status = STATUS_LABEL[listing.status] || {
                      text: "Listing diperbarui",
                      color: "text-slate-600",
                      dot: "bg-slate-400",
                    };
                    return (
                      <li 
                        key={listing.id} 
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <span className={`mt-1.5 w-2.5 h-2.5 rounded-full ${status.dot} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {listing.title}
                          </p>
                          <p className={`text-xs mt-0.5 ${status.color}`}>
                            {status.text} • {formatRelative(listing.updated_at)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>

          {/* Kolom Kanan — 4/12 */}
          <aside className="lg:col-span-4 space-y-6">
            <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Akses Cepat</h2>
              
              <nav className="space-y-3">
                {[
                  { href: "/dashboard/listings", icon: ClipboardList, label: "Listing Saya", desc: "Kelola semua produk" },
                  { href: "/dashboard/payments", icon: CreditCard, label: "Pembayaran", desc: "Riwayat transaksi" },
                  { href: "/dashboard/traffic", icon: BarChart3, label: "Analitik", desc: "Data pengunjung toko" },
                ].map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-blue-100 hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <item.icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </nav>
            </section>

            {/* Branding Footer */}
            <div className="text-center space-y-4 pt-2">
              <p className="text-sm text-slate-400 italic">
                Temukan. Tawarkan. Terhubung.
              </p>
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors py-2 px-4 rounded-lg hover:bg-red-50"
                >
                  <LogOut size={14} />
                  Keluar Akun
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
