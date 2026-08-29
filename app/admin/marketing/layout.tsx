// PATH: app/admin/marketing/layout.tsx
// AKSI: BUAT FILE BARU

import MarketingSubNav from "./MarketingSubNav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <MarketingSubNav />
      {children}
    </div>
  );
}
