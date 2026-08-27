// PATH: app/dashboard/DashboardNav.tsx
// AKSI: BUAT FILE BARU (bottom nav untuk dashboard user, konsisten dengan pola AdminNav)

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Beranda", icon: "🏠" },
  { href: "/dashboard/listings", label: "Listing", icon: "📋" },
  { href: "/favorites", label: "Favorit", icon: "❤️" },
  { href: "/notifications", label: "Notifikasi", icon: "🔔" },
  { href: "/dashboard/profile", label: "Profil", icon: "👤" },
];

export default function DashboardNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white"
      style={{ borderColor: "var(--border, #e5e7eb)" }}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium"
              style={{
                color: isActive ? "var(--primary)" : "var(--muted-foreground)",
              }}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
              {item.href === "/notifications" && unreadCount > 0 ? (
                <span className="absolute right-3 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] text-white">
                  {unreadCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
