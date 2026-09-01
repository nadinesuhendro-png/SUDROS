// PATH: components/FeatureLock.tsx
// AKSI: BUAT FILE BARU

import Link from "next/link";

export default function FeatureLock({
  featureName,
  reason,
}: {
  featureName: string;
  reason?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] p-4 text-center">
      <p className="text-sm font-medium text-[var(--card-foreground)]">
        🔒 {featureName}
      </p>
      <p className="text-xs text-[var(--muted-foreground)]">
        {reason || "Fitur ini belum tersedia di paket Anda."}
      </p>
      <Link
        href="/pricing"
        className="mt-1 rounded-[var(--radius)] px-4 py-1.5 text-xs font-medium text-white"
        style={{ backgroundColor: "var(--primary)" }}
      >
        Lihat Paket
      </Link>
    </div>
  );
}
