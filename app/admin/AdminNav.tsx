// PATH: app/admin/AdminNav.tsx
// AKSI: UPDATE FILE (tambah highlight untuk menu yang sedang aktif)

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/ai-usage", label: "AI Usage" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
      {navItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[var(--radius)] border px-3 py-1 text-xs font-medium transition-colors"
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
          </Link>
        );
      })}
    </div>
  );
}
