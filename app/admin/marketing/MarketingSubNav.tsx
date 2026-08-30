cat > /home/claude/marketing-final/subnav-final.tsx << 'EOF'
// PATH: app/admin/marketing/MarketingSubNav.tsx
// AKSI: UPDATE FILE (tambah tab Factory)

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const subNavItems = [
  { href: "/admin/marketing", label: "Overview" },
  { href: "/admin/marketing/generate", label: "Generate" },
  { href: "/admin/marketing/factory", label: "Factory" },
  { href: "/admin/marketing/content", label: "Library" },
  { href: "/admin/marketing/campaigns", label: "Campaigns" },
  { href: "/admin/marketing/templates", label: "Templates" },
  { href: "/admin/marketing/analytics", label: "Analytics" },
];

export default function MarketingSubNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-2">
      {subNavItems.map((item) => {
        const isActive =
          item.href === "/admin/marketing"
            ? pathname === "/admin/marketing"
            : pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={
              isActive
                ? { backgroundColor: "var(--primary-dark, #1e3a5f)", color: "white" }
                : { backgroundColor: "#f3f4f6", color: "var(--muted-foreground)" }
            }
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
EOF
echo done
