// PATH: app/dashboard/DashboardNav.tsx
// AKSI: GANTI SELURUH ISI FILE (jadi sidebar di desktop, tetap bottom nav di mobile)

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, ClipboardList, Heart, Bell, User } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/dashboard/explore", label: "Explore", icon: Compass },
  { href: "/dashboard/listings", label: "Listing", icon: ClipboardList },
  { href: "/dashboard/favorites", label: "Favorit", icon: Heart },
  { href: "/dashboard/notifications", label: "Notifikasi", icon: Bell },
  { href: "/dashboard/profile", label: "Profil", icon: User },
];

export default function DashboardNav({
  unreadCount = 0,
}: {
  unreadCount?: number;
}) {
  const pathname = usePathname();

  function isActivePath(href: string) {
    return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col md:flex"
        style={{ backgroundColor: "var(--primary-dark)" }}
      >
        <div className="flex items-center gap-2 px-5 py-6">
          <Image
            src="/brand/sudros-logo.png"
            alt="SUDROS"
            width={80}
            height={50}
            className="h-auto w-10"
          />
          <span className="text-base font-semibold text-white">Sudros</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => {
            const active = isActivePath(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: active ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "#ffffff" : "rgba(255,255,255,0.65)",
                }}
              >
                <Icon className="h-5 w-5" />
                {item.label}
                {item.href === "/dashboard/notifications" && unreadCount > 0 ? (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4">
          <ThemeToggle />
        </div>
      </aside>

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-[var(--background)] border-[var(--border)] md:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-1 py-2">
          {navItems.map((item) => {
            const active = isActivePath(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1 px-1.5 py-1 text-[10px]"
                style={{
                  color: active ? "var(--primary)" : "var(--muted-foreground)",
                }}
              >
                <Icon className="h-5 w-5" />
                {item.href === "/dashboard/notifications" && unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
