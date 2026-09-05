// AKSI: BUAT FILE BARU (komponen referensi - lihat catatan integrasi di bawah)
// PATH: components/dashboard/DashboardHome.tsx
//
// CATATAN INTEGRASI:
// Ini komponen TAMPILAN saja (client component), belum tersambung ke Supabase.
// Kirim ke saya isi asli app/dashboard/page.tsx (atau path dashboard home kamu)
// biar saya gabungkan logic fetch data-nya dan kasih file "GANTI TOTAL" yang
// tinggal tempel langsung tanpa merusak data real.
//
// Cara pakai sementara di page.tsx:
//   import DashboardHome from "@/components/dashboard/DashboardHome";
//   export default function Page() {
//     return <DashboardHome
//       userName="zia"
//       totalListing={4}
//       activeListing={4}
//       packageName="Starter"
//       packageExpiry="25 September 2026"
//       quotaUsed={4}
//       quotaMax={10}
//       unreadNotifications={1}
//     />;
//   }

type DashboardHomeProps = {
  userName: string;
  totalListing: number;
  activeListing: number;
  packageName: string;
  packageExpiry: string;
  quotaUsed: number;
  quotaMax: number;
  unreadNotifications: number;
};

const navItems = [
  { key: "beranda", label: "Beranda", icon: HomeIcon },
  { key: "explore", label: "Explore", icon: CompassIcon },
  { key: "listing", label: "Listing", icon: ListIcon },
  { key: "favorit", label: "Favorit", icon: HeartIcon },
  { key: "notifikasi", label: "Notifikasi", icon: BellIcon },
  { key: "profil", label: "Profil", icon: UserIcon },
];

export default function DashboardHome(props: DashboardHomeProps) {
  const {
    userName,
    totalListing,
    activeListing,
    packageName,
    packageExpiry,
    quotaUsed,
    quotaMax,
    unreadNotifications,
  } = props;

  const quotaPercent = Math.min(100, Math.round((quotaUsed / quotaMax) * 100));
  const quotaColor =
    quotaPercent >= 90 ? "bg-amber-500" : quotaPercent >= 100 ? "bg-red-500" : "bg-[#1d6fb8]";

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-slate-200 md:bg-[#0b2a52] md:px-4 md:py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          {/* GANTI src di bawah ini dengan path logo asli, misal /logo.png atau /logo.svg */}
          <img src="/logo.png" alt="Sudros" className="h-8 w-8 rounded-md object-contain" />
          <div>
            <p className="text-lg font-medium text-white leading-none">Sudros</p>
            <p className="mt-1 text-xs text-[#B5D4F4]">Temukan. Tawarkan. Terhubung.</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={
                item.key === "beranda"
                  ? "flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2 text-sm text-white"
                  : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#B5D4F4] hover:bg-white/5"
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {item.key === "notifikasi" && unreadNotifications > 0 ? (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                  {unreadNotifications}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="bg-[#0b2a52] px-4 py-5 md:hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {/* GANTI src di bawah ini dengan path logo asli, misal /logo.png atau /logo.svg */}
              <img src="/logo.png" alt="Sudros" className="h-8 w-8 rounded-md object-contain" />
              <div>
                <p className="text-lg font-medium text-white leading-none">Sudros</p>
                <p className="mt-1 text-xs text-[#B5D4F4]">Temukan. Tawarkan. Terhubung.</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <p className="mt-4 text-[15px] text-white">
            Halo, <span className="font-medium">{userName}</span>
          </p>
        </header>

        <header className="hidden items-center justify-between border-b border-slate-200 bg-white px-8 py-4 md:flex">
          <p className="text-[15px] text-slate-700">
            Halo, <span className="font-medium">{userName}</span>
          </p>
          <ThemeToggle />
        </header>

        <main className="mx-auto max-w-5xl px-4 py-4 md:px-8 md:py-8">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard icon={ListDetailsIcon} value={totalListing} label="Total listing" />
            <StatCard icon={CircleCheckIcon} value={activeListing} label="Listing aktif" iconColor="text-green-700" />
            <div className="col-span-2 hidden rounded-xl border border-slate-200 bg-white p-4 md:col-span-1 md:block">
              <p className="text-xs text-slate-500">Kuota terpakai</p>
              <p className="mt-2 text-2xl font-medium text-slate-900">{quotaPercent}%</p>
            </div>
            <div className="col-span-2 hidden rounded-xl border border-slate-200 bg-white p-4 md:col-span-1 md:block">
              <p className="text-xs text-slate-500">Notifikasi belum dibaca</p>
              <p className="mt-2 text-2xl font-medium text-slate-900">{unreadNotifications}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:mt-4 md:grid-cols-3">
            <section className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2 md:p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Paket kamu</span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] text-green-800">Aktif</span>
              </div>
              <p className="mt-1 text-xl font-medium text-slate-900">{packageName}</p>
              <p className="mt-1 text-xs text-slate-500">Berlaku sampai {packageExpiry}</p>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Kuota listing</span>
                <span className="font-medium text-slate-900">
                  {quotaUsed} / {quotaMax}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full ${quotaColor}`} style={{ width: `${quotaPercent}%` }} />
              </div>

              <button className="mt-4 w-full rounded-lg border border-slate-300 py-2 text-sm text-slate-700 hover:bg-slate-50 md:w-auto md:px-6">
                Kelola paket
              </button>
            </section>

            <button className="flex h-auto flex-col items-center justify-center gap-2 rounded-xl bg-[#1d6fb8] p-6 text-white hover:bg-[#185FA5] md:col-span-1">
              <PlusIcon className="h-6 w-6" />
              <span className="text-sm font-medium">Buat listing baru</span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 md:mt-4 md:grid-cols-4">
            <QuickAction icon={ClipboardListIcon} title="Listing saya" subtitle="Kelola listing kamu" />
            <QuickAction icon={CreditCardIcon} title="Riwayat bayar" subtitle="Cek status paket" />
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-slate-200 bg-white py-2 md:hidden">
        {navItems.map((item) => (
          <div
            key={item.key}
            className={
              item.key === "beranda"
                ? "relative flex flex-col items-center gap-0.5 text-[#1d6fb8]"
                : "relative flex flex-col items-center gap-0.5 text-slate-400"
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px]">{item.label}</span>
            {item.key === "notifikasi" && unreadNotifications > 0 ? (
              <span className="absolute -top-0.5 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
            ) : null}
          </div>
        ))}
      </nav>
    </div>
  );
}

function ThemeToggle() {
  return (
    <div className="flex gap-0.5 rounded-lg bg-white/10 p-0.5 md:bg-slate-100">
      <button aria-label="Mode terang" className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-[#0b2a52]">
        <SunIcon className="h-4 w-4" />
      </button>
      <button aria-label="Mode gelap" className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400">
        <MoonIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function StatCard(props: {
  icon: IconComponent;
  value: number;
  label: string;
  iconColor?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-3.5 md:border md:border-slate-200 md:p-4">
      <props.icon className={`h-4.5 w-4.5 ${props.iconColor ?? "text-[#185FA5]"}`} />
      <p className="mt-2 text-xl font-medium text-slate-900 md:text-2xl">{props.value}</p>
      <p className="text-xs text-slate-500">{props.label}</p>
    </div>
  );
}

function QuickAction(props: { icon: IconComponent; title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <props.icon className="h-4.5 w-4.5 text-[#185FA5]" />
      <p className="mt-2 text-sm font-medium text-slate-900">{props.title}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{props.subtitle}</p>
    </div>
  );
}

type IconComponent = (props: { className?: string }) => JSX.Element;

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CompassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-3 6-3-2 3-6z" strokeLinejoin="round" />
    </svg>
  );
}
function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  );
}
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s-7-4.6-9.5-9C.7 8.5 2.4 5 6 5c2 0 3.3 1 4 2 .7-1 2-2 4-2 3.6 0 5.3 3.5 3.5 7-2.5 4.4-9.5 9-9.5 9z" strokeLinejoin="round" />
    </svg>
  );
}
function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 004 0" strokeLinecap="round" />
    </svg>
  );
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}
function ListDetailsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round" />
    </svg>
  );
}
function CircleCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
function ClipboardListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1M9 10h6M9 14h6" strokeLinecap="round" />
    </svg>
  );
}
function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}
function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" strokeLinejoin="round" />
    </svg>
  );
}

