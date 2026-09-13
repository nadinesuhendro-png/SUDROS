"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminNavCounts } from "@/lib/admin/nav-counts";

const navItems: { href: string; label: string; countKey?: keyof AdminNavCounts }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users", countKey: "users" },
  { href: "/admin/listings", label: "Listings", countKey: "listings" },
  { href: "/admin/reports", label: "Reports", countKey: "reports" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/payments", label: "Payments", countKey: "payments" },
  { href: "/admin/ai-usage", label: "AI Usage" },
  { href: "/admin/agents", label: "Agents", countKey: "agents" },
  { href: "/admin/marketing", label: "Marketing" },
  { href: "/admin/terms", label: "Legal" },
  { href: "/admin/anchor", label: "Penjual Jangkar" },
  { href: "/admin/feedback", label: "Saran & Masukan", countKey: "feedback" },
];

export default function AdminNav({ counts }: { counts: AdminNavCounts }) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-40 flex flex-wrap gap-2 border-b border-gray-200 bg-white pb-3 pt-2">
      {navItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname?.startsWith(item.href);

        const badgeCount = item.countKey ? counts[item.countKey] : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative rounded-[var(--radius)] border px-3 py-1 text-xs font-medium transition-colors"
            style={
              isActive
                ? {
                    backgroundColor: "var(--primary)",
                    borderColor: "var(--primary)",
                    color: "white",
                  }
                : {
                    borderColor: "var(--border, #d1d5db)",
                    color: "var(--foreground, inherit)",
                  }
            }
          >
            {item.label}
            {badgeCount > 0 ? (
              <span
                className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white"
              >
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
