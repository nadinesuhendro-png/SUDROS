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
import {
  AnimatedCounter,
  EngagementDonut,
  ProgressRing,
} from "@/components/dashboard/interactive";

type Profile = { username: string; role: string };
type RecentListing = { id: string; title: string; status: string; updated_at: string };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { dateStyle: "long" });
}

function formatRelative(dateStr: string) {
  const diffDays = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  return formatDate(dateStr);
}

const STATUS_LABEL: Record<
  string,
  { text: string; color: string; dot: string; bg: string }
> = {
  active: {
    text: "Listing disetujui",
    color: "text-emerald-300",
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  pending: {
    text: "Menunggu review",
    color: "text-amber-300",
    dot: "bg-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  rejected: {
    text: "Listing ditolak",
    color: "text-red-300",
    dot: "bg-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  suspended: {
    text: "Listing disuspend",
    color: "text-slate-300",
    dot: "bg-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
  },
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

  const { data: statsRows } = await supabase
    .from("listings")
    .select("views_count, whatsapp_clicks, favorites_count")
    .eq("owner_id", user!.id);

  const totalViews = statsRows?.reduce((s, r) => s + (r.views_count ?? 0), 0) ?? 0;
  const totalWhatsapp =
    statsRows?.reduce((s, r) => s + (r.whatsapp_clicks ?? 0), 0) ?? 0;
  const totalFavorites =
    statsRows?.reduce((s, r) => s + (r.favorites_count ?? 0), 0) ?? 0;

  const { data: recentListings } = await supabase
    .from("listings")
    .select("id, title, status, updated_at")
    .eq("owner_id", user!.id)
    .order("updated_at", { ascending: false })
    .limit(4)
    .returns<RecentListing[]>();

  const conversionRate =
    totalViews > 0 ? (totalWhatsapp / totalViews) * 100 : 0;

  const statCards = [
    {
      icon: CheckCircle2,
      label: "Listing Aktif",
      value: listingQuota.used,
      suffix: isUnlimited ? "" : ` / ${listingQuota.limit}`,
      accent: "text-sky-400",
      ring: "ring-sky-500/20",
      glow: "from-sky-500/20",
    },
    {
      icon: Eye,
      label: "Total Dilihat",
      value: totalViews,
      accent: "text-indigo-400",
      ring: "ring-indigo-500/20",
      glow: "from-indigo-500/20",
    },
    {
      icon: MessageCircle,
      label: "Klik WhatsApp",
      value: totalWhatsapp,
      accent: "text-emerald-400",
      ring: "ring-emerald-500/20",
      glow: "from-emerald-500/20",
    },
    {
      icon: Heart,
      label: "Disukai",
      value: totalFavorites,
      accent: "text-rose-400",
      ring: "ring-rose-500/20",
      glow: "from-rose-500/20",
    },
  ];

  return (
    <main className="min-h-screen bg-[#070b16] text-white relative overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-blue-600/[0.07] rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-indigo-600/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-sky-500/[0.04] rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <Suspense fallback={null}>
          <ListingCreatedTracker />
        </Suspense>

        {/* ============ HEADER ============ */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] rounded-full text-[11px] font-medium uppercase tracking-wider text-sky-300 backdrop-blur-sm border border-white/[0.06]">
              <Sparkles size={11} />
              Dashboard
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Halo, {profile?.username || user?.email?.split("@")[0]} 👋
            </h1>
            <p className="text-slate-400 text-sm">
              Siap mengembangkan usahamu hari ini?
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] rounded-2xl border border-white/[0.06] backdrop-blur-sm">
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
          {/* ============ KOLOM KIRI (8/12) ============ */}
          <div className="lg:col-span-8 space-y-6">
            {/* ---- Kartu Paket Aktif ---- */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-sky-600 to-indigo-700 p-6 md:p-7 shadow-2xl shadow-blue-900/40">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/15 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-sky-300/20 rounded-full blur-3xl" />

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5 uppercase tracking-wider">
                      <Gift size={13} />
                      Paket Aktif
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        entitlements.isFreeTier
                          ? "bg-white/20 text-white ring-1 ring-white/25"
                          : "bg-amber-300 text-amber-950 shadow-lg shadow-amber-500/30"
                      }`}
                    >
                      {entitlements.isFreeTier ? "GRATIS" : "★ PREMIUM"}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold mb-1.5">
                    {entitlements.package?.name || "Paket Gratis"}
                  </h3>
                  <p className="text-blue-100/80 text-sm mb-5">
                    {listingQuota.used} listing aktif
                    {isUnlimited && " • Listing tak terbatas ♾️"}
                    {!entitlements.isFreeTier &&
                      !isUnlimited &&
                      entitlements.expiresAt &&
                      ` • Berlaku sampai ${formatDate(entitlements.expiresAt)}`}
                  </p>

                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl hover:bg-sky-50 transition-all shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 group"
                  >
                    {entitlements.isFreeTier
                      ? "Tingkatkan Sekarang"
                      : "Kelola Langganan"}
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                </div>

                {/* Progress Ring / Unlimited */}
                <div className="flex-shrink-0 self-center">
                  {isUnlimited ? (
                    <div className="w-24 h-24 rounded-full bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-3xl">♾️</span>
                    </div>
                  ) : (
                    <ProgressRing
                      value={listingQuota.used}
                      max={listingQuota.limit}
                      size={104}
                      stroke={10}
                      color="#ffffff"
                      label="Kuota"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ---- Kartu Statistik (Animated Counters) ---- */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {statCards.map((stat, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.12] hover:-translate-y-0.5"
                >
                  <div
                    className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${stat.glow} to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />
                  <div className="relative">
                    <div
                      className={`w-9 h-9 rounded-xl bg-white/[0.05] ring-1 ${stat.ring} flex items-center justify-center mb-3`}
                    >
                      <stat.icon size={16} className={stat.accent} />
                    </div>
                    <p className="text-2xl font-bold text-white tabular-nums leading-none">
                      <AnimatedCounter value={stat.value} />
                      {stat.suffix && (
                        <span className="text-sm font-medium text-slate-500 ml-1">
                          {stat.suffix}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </section>

            {/* ---- Tombol Buat Listing ---- */}
            <Link
              href="/dashboard/listings/new"
              className="group flex items-center justify-center gap-3 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-900/30 hover:shadow-emerald-700/40 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Plus
                size={22}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
              Buat Listing Baru
              <Zap
                size={18}
                className="ml-1 group-hover:scale-125 transition-transform"
              />
            </Link>

            {/* ---- Diagram Interaktif: Engagement ---- */}
            <section className="rounded-3xl bg-white/[0.03] border border-white/[0.06] p-5 md:p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp size={18} className="text-sky-400" />
                    Ringkasan Interaksi
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Arahkan kursor ke diagram untuk detail
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      Konversi
                    </p>
                    <p className="text-sm font-bold text-emerald-400 tabular-nums">
                      {conversionRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      Total
                    </p>
                    <p className="text-sm font-bold text-white tabular-nums">
                      {(totalViews + totalWhatsapp + totalFavorites).toLocaleString(
                        "id-ID"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <EngagementDonut
                segments={[
                  { label: "Dilihat", value: totalViews, color: "#38bdf8" },
                  { label: "Klik WhatsApp", value: totalWhatsapp, color: "#34d399" },
                  { label: "Disukai", value: totalFavorites, color: "#fb7185" },
                ]}
              />
            </section>

            {/* ---- Aktivitas Terbaru ---- */}
            {recentListings && recentListings.length > 0 && (
              <section className="rounded-3xl bg-white/[0.03] border border-white/[0.06] p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Clock size={18} className="text-sky-400" />
                    Aktivitas Terbaru
                  </h2>
                  <Link
                    href="/dashboard/listings"
                    className="text-sm text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    Lihat Semua <ChevronRight size={14} />
                  </Link>
                </div>

                <ul className="space-y-2.5">
                  {recentListings.map((listing) => {
                    const status = STATUS_LABEL[listing.status] || {
                      text: "Listing diperbarui",
                      color: "text-slate-300",
                      dot: "bg-slate-400",
                      bg: "bg-slate-500/10 border-slate-500/20",
                    };
                    return (
                      <li
                        key={listing.id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border ${status.bg} transition-all duration-200 hover:bg-white/[0.06] hover:translate-x-1`}
                      >
                        <span
                          className={`mt-1.5 w-2 h-2 rounded-full ${status.dot} flex-shrink-0 ring-4 ring-white/5`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-white">
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

          {/* ============ KOLOM KANAN (4/12) ============ */}
          <aside className="lg:col-span-4 space-y-6">
            {/* ---- Akses Cepat ---- */}
            <section className="rounded-3xl bg-white/[0.03] border border-white/[0.06] p-5 backdrop-blur-xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield size={18} className="text-sky-400" />
                Akses Cepat
              </h2>

              <nav className="space-y-2.5">
                {[
                  {
                    href: "/dashboard/listings",
                    icon: ClipboardList,
                    label: "Listing Saya",
                    desc: "Kelola semua produk",
                    grad: "from-blue-500 to-indigo-500",
                  },
                  {
                    href: "/dashboard/payments",
                    icon: CreditCard,
                    label: "Pembayaran",
                    desc: "Riwayat transaksi",
                    grad: "from-emerald-500 to-teal-500",
                  },
                  {
                    href: "/dashboard/traffic",
                    icon: BarChart3,
                    label: "Analitik",
                    desc: "Data pengunjung toko",
                    grad: "from-amber-500 to-orange-500",
                  },
                ].map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.05] bg-white/[0.015] transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.12] hover:translate-x-1 group"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.grad} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <item.icon size={17} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-slate-500 group-hover:translate-x-0.5 group-hover:text-sky-400 transition-all"
                    />
                  </Link>
                ))}
              </nav>
            </section>

            {/* ---- Tips / Motto ---- */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.05] border border-amber-400/20 p-5 text-center">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl" />
              <div className="relative">
                <Star size={22} className="mx-auto text-amber-400 mb-2" />
                <p className="text-sm font-semibold text-amber-100">
                  Temukan. Tawarkan. Terhubung.
                </p>
                <p className="text-xs text-amber-200/50 mt-1">
                  Bangun usahamu bersama SUDROS
                </p>
              </div>
            </div>

            {/* ---- Logout ---- */}
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
