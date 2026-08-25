// PATH: app/admin/AdminNav.tsx
// AKSI: UPDATE FILE (tambah link Packages)

import Link from "next/link";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/packages", label: "Packages" },
];

export default function AdminNav() {
  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-[var(--radius)] border border-gray-300 px-3 py-1 text-xs font-medium"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
