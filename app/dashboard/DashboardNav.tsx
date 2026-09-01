// PATH: app/dashboard/DashboardNav.tsx
// AKSI: GANTI SELURUH ISI FILE (tambah item Explore)

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, ClipboardList, Heart, Bell, User } from "lucide-react";

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-[var(--background)] border-[var(--border)]">
      <div className="mx-auto flex max-w-2xl items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-1.5 py-1 text-[10px]"
              style={{
                color: isActive ? "var(--primary)" : "var(--muted-foreground)",
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
  );
}
