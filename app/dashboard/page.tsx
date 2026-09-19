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
  ArrowUpRight,
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
  Infinity as InfinityIcon,
  CircleDot,
  Globe,
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

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function jakartaDateOnly(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

function formatRelative(dateStr: string) {
  const target = jakartaDateOnly(new Date(dateStr));
  const today = jakartaDateOnly(new Date());

  const diffDays = Math.round(
    (new Date(today).getTime() - new Date(target).getTime()) / (1000 * 60 * 60 * 24)
  );

  const dateLabel = formatShortDate(dateStr);

  if (diffDays <= 0) return `Hari ini • ${dateLabel}`;
  if (diffDays === 1) return `Kemarin • ${dateLabel}`;
  if (diffDays < 7) return `${diffDays} hari lalu • ${dateLabel}`;
  return dateLabel;
}

function getGreeting() {
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
    10
  );
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

const STATUS_LABEL: Record<
  string,
  { text: string; color: string; dot: string; bg: string; ring: string }
> = {
  active: {
    text: "Disetujui",
    color: "text-emerald-300",
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/[0.06]",
    ring: "ring-emerald-500/15",
  },
  pending: {
    text: "Menunggu review",
    color: "text-amber-300",
    dot: "bg-amber-400",
    bg: "bg-amber-500/[0.06]",
    ring: "ring-amber-500/15",
  },
  rejected: {
    text: "Ditolak",
    color: "text-red-300",
    dot: "bg-red-400",
    bg: "bg-red-500/[0.06]",
    ring: "ring-red-500/15",
  },
  suspended: {
    text: "Disuspend",
    color: "text-slate-300",
    dot: "bg-slate-400",
    bg: "bg-slate-500/[0.06]",
    ring: "ring-slate-500/15",
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
  const totalEngagement = totalViews + totalWhatsapp + totalFavorites;

  const statCards = [
    {
      icon: CheckCircle2,
      label: "Listing Aktif",
      value: listingQuota.used,
      suffix: isUnlimited ? "" : ` / ${listingQuota.limit}`,
      accent: "text-sky-400",
      iconBg: "bg-sky-500/10",
      iconRing: "ring-sky-500/20",
      glow: "from-sky-500/20",
      href: "/dashboard/listings",
    },
    {
      icon: Eye,
      label: "Total Dilihat",
      value: totalViews,
      accent: "text-indigo-400",
      iconBg: "bg-indigo-500/10",
      iconRing: "ring-indigo-500/20",
      glow: "from-indigo-500/20",
      href: "/dashboard/traffic",
    },
    {
      icon: MessageCircle,
      label: "Klik WhatsApp",
      value: totalWhatsapp,
      accent: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      iconRing: "ring-emerald-500/20",
      glow: "from-emerald-500/20",
      href: "/dashboard/traffic",
    },
    {
      icon: Heart,
      label: "Disukai",
      value: totalFavorites,
      accent: "text-rose-400",
      iconBg: "bg-rose-500/10",
      iconRing: "ring-rose-500/20",
      glow: "from-rose-500/20",
      href: "/dashboard/traffic",
    },
  ];

  const username = profile?.username || user?.email?.split("@")[0] || "Pengguna";

  return (
    <main className="min-h-screen bg-[#05070f] text-white relative overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-blue-600/[0.06] rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-indigo-600/[0.05] rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-sky-500/[0.03] rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <Suspense fallback={null}>
          <ListingCreatedTracker />
        </Suspense>

        {/* ============ TOPBAR ============ */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:bg-white/[0.06] transition-colors"
          >
            <Image
              src="/brand/sudros-logo.png"
              alt="SUDROS"
              width={96}
              height={36}
              priority
              className="h-auto w-24 object-contain"
            />
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-[11px] font-bold text-white">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-slate-300 font-medium max-w-[120px] truncate">
                {username}
              </span>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/[0.08] hover:border-red-500/20 transition-all"
                title="Keluar"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </div>

        {/* ============ HERO GREETING ============ */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] rounded-full text-[11px] font-medium uppercase tracking-wider text-sky-300 backdrop-blur-sm border border-white/[0.06] mb-3">
            <Sparkles size={11} />
            Dashboard
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
            {getGreeting()}, {username} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Berikut ringkasan performa tokomu. Kelola listing, pantau interaksi, dan tingkatkan penjualan.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ============ KOLOM KIRI (8/12) ============ */}
          <div className="lg:col-span-8 space-y-6">
            {/* ---- Kartu Paket Aktif ---- */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-sky-600 to-indigo-700 p-6 md:p-7 shadow-2xl shadow-blue-900/30">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/15 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-sky-300/20 rounded-full blur-3xl" />
              <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-transparent via-white/40 to-transparent" />

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5 uppercase tracking-wider">
                      <Gift size={13} />
                      Paket Aktif
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${
                        entitlements.isFreeTier
                          ? "bg-white/20 text-white ring-1 ring-white/25"
                          : "bg-amber-300 text-amber-950 shadow-lg shadow-amber-500/30"
                      }`}
                    >
                      {entitlements.isFreeTier ? "GRATIS" : "★ PREMIUM"}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold mb-1.5 tracking-tight">
                    {entitlements.package?.name || "Paket Gratis"}
                  </h3>
                  <p className="text-blue-100/80 text-sm mb-5">
                    {listingQuota.used} listing aktif
                    {isUnlimited && " • Listing tak terbatas"}
                    {!entitlements.isFreeTier &&
                      !isUnlimited &&
                      entitlements.expiresAt &&
                      ` • Berlaku sampai ${formatDate(entitlements.expiresAt)}`}
                  </p>

                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl hover:bg-sky-50 transition-all shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 group text-sm"
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
                    <div className="w-24 h-24 rounded-full bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-sm shadow-inner">
                      <InfinityIcon size={36} className="text-white" strokeWidth={1.5} />
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

            {/* ---- Kartu Statistik ---- */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">
                  Statistik
                </h2>
                <Link
                  href="/dashboard/traffic"
                  className="text-xs text-slate-500 hover:text-sky-400 transition-colors flex items-center gap-1"
                >
                  Detail <ArrowUpRight size={12} />
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {statCards.map((stat, i) => (
                  <Link
                    key={i}
                    href={stat.href}
                    className="group relative overflow-hidden rounded-2xl bg-white/[0.025] border border-white/[0.06] p-4 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.14] hover:-translate-y-0.5"
                  >
                    <div
                      className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${stat.glow} to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    />
                    <div className="relative">
                      <div
                        className={`w-9 h-9 rounded-xl ${stat.iconBg} ring-1 ${stat.iconRing} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                      >
                        <stat.icon size={16} className={stat.accent} />
                      </div>
                      <p className="text-2xl font-bold text-white tabular-nums leading-none tracking-tight">
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
                  </Link>
                ))}
              </div>
            </section>

            {/* ---- Tombol Buat Listing ---- */}
            <Link
              href="/dashboard/listings/new"
              className="group relative flex items-center justify-center gap-3 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-900/20 hover:shadow-emerald-700/30 transition-all duration-300 hover:scale-[1.005] active:scale-[0.995] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
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
            <section className="rounded-3xl bg-white/[0.025] border border-white/[0.06] p-5 md:p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 tracking-tight">
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
                      {totalEngagement.toLocaleString("id-ID")}
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
              <section className="rounded-3xl bg-white/[0.025] border border-white/[0.06] p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold flex items-center gap-2 tracking-tight">
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

                <ul className="space-y-2">
                  {recentListings.map((listing) => {
                    const status = STATUS_LABEL[listing.status] || {
                      text: "Diperbarui",
                      color: "text-slate-300",
                      dot: "bg-slate-400",
                      bg: "bg-slate-500/[0.06]",
                      ring: "ring-slate-500/15",
                    };
                    return (
                      <li
                        key={listing.id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl ${status.bg} ring-1 ${status.ring} transition-all duration-200 hover:bg-white/[0.05] hover:translate-x-1`}
                      >
                        <span
                          className={`mt-1.5 w-2 h-2 rounded-full ${status.dot} flex-shrink-0 shadow-[0_0_8px_currentColor]`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-white">
                            {listing.title}
                          </p>
                          <p className={`text-xs mt-0.5 ${status.color} flex items-center gap-1.5`}>
                            <span>{status.text}</span>
                            <CircleDot size={8} className="opacity-40" />
                            <span className="text-slate-500">
                              {formatRelative(listing.updated_at)}
                            </span>
                          </p>
                        </div>
                        <ChevronRight
                          size={14}
                          className="text-slate-600 mt-1 flex-shrink-0"
                        />
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
            <section className="rounded-3xl bg-white/[0.025] border border-white/[0.06] p-5 backdrop-blur-xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 tracking-tight">
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
                  {
                    href: "/dashboard/subdomain",
                    icon: Globe,
                    label: "Subdomain Toko",
                    desc: "Punya alamat sendiri",
                    grad: "from-sky-500 to-blue-600",
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
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.04] border border-amber-400/15 p-6 text-center">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="relative">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-amber-400/10 ring-1 ring-amber-400/20 flex items-center justify-center overflow-hidden p-1.5">
                  <Image
                    src="/brand/sudros-logo.png"
                    alt="SUDROS"
                    width={40}
                    height={40}
                    className="h-full w-full object-contain"
                  />
                </div>
                
                <p className="text-sm font-semibold text-amber-100">
                  Temukan. Tawarkan. Terhubung.
                </p>
                <p className="text-xs text-amber-200/50 mt-1">
                  Bangun usahamu bersama SUDROS
                </p>
              </div>
            </div>

            {/* ---- Footer Info ---- */}
            <div className="text-center pt-2">
              <p className="text-[11px] text-slate-600">
                © {new Date().getFullYear()} SUDROS • Semua hak dilindungi
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
    }
