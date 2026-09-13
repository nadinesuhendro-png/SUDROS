// PATH: app/admin/terms/page.tsx
// AKSI: GANTI TOTAL (tambah: tampilkan error dari ?error= kalau ada mutasi gagal)

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type TermsVersionRow = {
  id: string;
  version: string;
  title: string;
  is_active: boolean;
  effective_at: string;
  created_at: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { dateStyle: "medium" });
}

export default async function AdminTermsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();

  const { data: versions } = await supabase
    .from("terms_versions")
    .select("id, version, title, is_active, effective_at, created_at")
    .order("created_at", { ascending: false })
    .returns<TermsVersionRow[]>();

  // Hitung jumlah agreement per versi (query terpisah per versi — jumlah
  // versi Terms biasanya kecil, tidak masalah dari sisi performa)
  const counts = new Map<string, number>();
  for (const v of versions || []) {
    const { count } = await supabase
      .from("user_terms_agreements")
      .select("id", { count: "exact", head: true })
      .eq("terms_version_id", v.id);
    counts.set(v.id, count || 0);
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <div
          className="rounded-[var(--radius)] border p-3 text-xs"
          style={{ borderColor: "#dc2626", backgroundColor: "#fef2f2", color: "#7f1d1d" }}
        >
          <p className="font-bold">Gagal: {decodeURIComponent(error)}</p>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)]">
          Legal / Terms & Conditions ({(versions || []).length})
        </h2>
        <Link
          href="/admin/terms/new"
          className="rounded-[var(--radius)] px-3 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          + Buat Versi Baru
        </Link>
      </div>

      {(versions || []).length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Belum ada versi Terms & Conditions.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {(versions || []).map((v) => (
          <Link
            key={v.id}
            href={`/admin/terms/${v.id}`}
            className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">v{v.version} — {v.title}</p>
              <span
                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                  v.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {v.is_active ? "Active" : "Archived"}
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Effective: {formatDate(v.effective_at)} • {counts.get(v.id) || 0} user setuju
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
