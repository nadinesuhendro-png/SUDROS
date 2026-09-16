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
  TrendingUp,
  Shield,
  Star,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { getUserEntitlements } from "@/lib/entitlements/service";
import { ListingCreatedTracker } from "@/components/analytics/listing-created-tracker";

type Profile = { username: string; role: string };
type RecentListing = { id: string; title: string; status: string; updated_at: string };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { dateStyle: "long" });
}

function formatRelative(dateStr: string) {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  return formatDate(dateStr);
}

const STATUS_LABEL: Record<string, { text: string; color: string; dot: string; bg: string }> = {
  active: { text: "Listing disetujui", color: "text-emerald-700", dot: "bg-emerald-500", bg: "bg-emerald-50" },
  pending: { text: "Menunggu review", color: "text-amber-700", dot: "bg-amber-500", bg: "bg-amber-50" },
  rejected: { text: "Listing ditolak", color: "text-red-700", dot: "bg-red-500", bg: "bg-red-50" },
  suspended: { text: "Listing disuspend", color: "text-slate-600", dot: "bg-slate-400", bg: "bg-slate-50" },
};

const animateIn = "transition-all duration-300 ease-out";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles").select("username, role").eq("id", user!.id).single<Profile>();

  const { count: listingCount } = await supabase
    .from("listings").select("*", { count: "exact", head: true }).eq("owner_id", user!.id);

  const entitlements = await getUserEntitlements(user!.id);
  const listingQuota = entitlements.quotas.listings;
  const isUnlimited = !Number.isFinite(listingQuota.limit);
  const quotaPercent = isUnlimited ? 100
    : listingQuota.limit > 0 ? Math.min(100, Math.round((listingQuota.used / listingQuota.limit) * 100)) : 0;

  const { data: statsRows } = await supabase
    .from("listings")
    .select("views_count, whatsapp_clicks, favorites_count")
    .eq("owner_id", user!.id);

  const totalViews = statsRows?.reduce((s, r) => s + (r.views_count ?? 0), 0) ?? 0;
  const totalWhatsapp = statsRows?.reduce((s, r) => s + (r.whatsapp_clicks ?? 0), 0) ?? 0;
  const totalFavorites = statsRows?.reduce((s, r) => s + (r.favorites_count ?? 0), 0) ?? 0;

  const { data: recentListings } = await supabase
    .from("listings").select("id, title, status, updated_at")
    .eq("owner_id", user!.id).order("updated_at", { ascending: false }).limit(3).returns<RecentListing[]>();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white overflow-hidden">
      {/* Efek latar belakang */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <Suspense fallback={null}>
          <ListingCreatedTracker />
        </Suspense>

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs text-sky-200 mb-2 backdrop-blur-sm border border-white/10">
              <Sparkles size={12} />
              Selamat Datang
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Halo, {profile?.username || user?.email?.split("@")[0]} 👋
            </h1>
            <p className="text-blue-200/70">Siap mengembangkan usahamu hari ini?</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
              <Image
                src="/brand/sudros-logo.png"
                alt="SUDROS"
                width={96}
                height={36}
                priority
                className="h-auto w-24 object-contain"
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri — 8/12 */}
          <div className="lg:col-span-8 space-y-6">
            {/* Kartu Paket — Mewah & Berkilau */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-500 p-6 shadow-2xl shadow-blue-500/30 group">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-sky-300/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700 delay-100" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-white/80 flex items-center gap-2">
                    <Gift size={16} />
                    Paket Aktif
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    entitlements.isFreeTier 
                      ? "bg-white/20 text-white ring-1 ring-white/20" 
                      : "bg-amber-400 text-amber-950"
                  }`}>
                    {entitlements.isFreeTier ? "✨ Gratis" : "⭐ Premium"}
                  </span>
                </div>

                <h3 className="text-2xl font-bold mb-2">
                  {entitlements.package?.name || "Paket Gratis"}
                </h3>
                <p className="text-blue-100/80 text-sm mb-5">
                  {listingQuota.used} listing aktif
                  {isUnlimited && " • Listing tak terbatas ♾️"}
                  {!entitlements.isFreeTier && !isUnlimited && entitlements.expiresAt &&
                    ` • Berlaku sampai ${formatDate(entitlements.expiresAt)}`}
                </p>

                {!isUnlimited && (
                  <div className="space-y-2 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Kouta Listing</span>
                      <span className="font-bold">{listingQuota.used} / {listingQuota.limit}</span>
                    </div>
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-white to-sky-200 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${quotaPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {isUnlimited && (
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-5">
                    <div className="h-full w-full bg-gradient-to-r from-white to-sky-200 rounded-full animate-pulse" />
                  </div>
                )}

                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl hover:bg-sky-50 transition-all shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5"
                >
                  {entitlements.isFreeTier ? "Tingkatkan Sekarang" : "Kelola Langganan"}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Statistik — Berkilau & Berwarna */}
            <section className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp size={18} className="text-sky-400" />
                  Performa Listing
                </h2>
                <span className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  Semua Waktu
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: CheckCircle2, label: "Listing Aktif", value: listingQuota.used, gradient: "from-blue-500 to-indigo-600", bg: "bg-blue-500/10", text: "text-blue-400" },
                  { icon: Eye, label: "Dilihat", value: totalViews, gradient: "from-indigo-500 to-purple-600", bg: "bg-indigo-500/10", text: "text-indigo-400" },
                  { icon: MessageCircle, label: "Klik WhatsApp", value: totalWhatsapp, gradient: "from-emerald-500 to-teal-600", bg: "bg-emerald-500/10", text: "text-emerald-400" },
                  { icon: Heart, label: "Disukai", value: totalFavorites, gradient: "from-rose-500 to-pink-600", bg: "bg-rose-500/10", text: "text-rose-400" },
                ].map((stat, i) => (
                  <div 
                    key={i} 
                    className={`rounded-2xl p-4 ${stat.bg} border border-white/5 hover:border-white/20 ${animateIn} hover:scale-[1.03] hover:shadow-lg`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                      <stat.icon size={20} className="text-white" />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className={`text-xs mt-1 ${stat.text}`}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tombol Utama — Menarik & Menonjol */}
            <Link
              href="/dashboard/listings/new"
              className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
            >
              <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
              Buat Listing Baru
              <Zap size={18} className="ml-1 group-hover:scale-125 transition-transform" />
            </Link>

            {/* Aktivitas Terbaru */}
            {recentListings && recentListings.length > 0 && (
              <section className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Clock size={18} className="text-sky-400" />
                    Aktivitas Terbaru
                  </h2>
                  <Link 
                    href="/dashboard/listings" 
                    className="text-sm text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
                  >
                    Lihat Semua <ChevronRight size={14} />
                  </Link>
                </div>

                <ul className="space-y-3">
                  {recentListings.map((listing) => {
                    const status = STATUS_LABEL[listing.status] || {
                      text: "Listing diperbarui", color: "text-slate-300", dot: "bg-slate-400", bg: "bg-slate-500/10"
                    };
                    return (
                      <li 
                        key={listing.id} 
                        className={`flex items-start gap-3 p-3 rounded-xl ${status.bg} border border-white/5 ${animateIn} hover:bg-white/10 hover:border-white/15`}
                      >
                        <span className={`mt-1.5 w-3 h-3 rounded-full ${status.dot} flex-shrink-0 shadow-sm`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{listing.title}</p>
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
            {/* Akses Cepat */}
            <section className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield size={18} className="text-sky-400" />
                Akses Cepat
              </h2>
              
              <nav className="space-y-3">
                {[
                  { href: "/dashboard/listings", icon: ClipboardList, label: "Listing Saya", desc: "Kelola semua produk", grad: "from-blue-500 to-indigo-500" },
                  { href: "/dashboard/payments", icon: CreditCard, label: "Pembayaran", desc: "Riwayat transaksi", grad: "from-emerald-500 to-teal-500" },
                  { href: "/dashboard/traffic", icon: BarChart3, label: "Analitik", desc: "Data pengunjung toko", grad: "from-amber-500 to-orange-500" },
                ].map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className={`flex items-center gap-3 p-3 rounded-xl border border-white/5 ${animateIn} hover:bg-white/10 hover:border-white/20 group`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.grad} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <item.icon size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </nav>
            </section>

            {/* Tips / Motto */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl border border-amber-400/20 p-5 text-center">
              <Star size={24} className="mx-auto text-amber-400 mb-2" />
              <p className="text-sm font-medium text-amber-200">Temukan. Tawarkan. Terhubung.</p>
              <p className="text-xs text-amber-300/60 mt-1">Bangun usahamu bersama SUDROS</p>
            </div>

            {/* Keluar */}
            <form action={logout} className="text-center">
              <button
                type="submit"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors py-2 px-4 rounded-xl hover:bg-red-500/10"
              >
                <LogOut size={14} />
                Keluar Akun
              </button>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}
