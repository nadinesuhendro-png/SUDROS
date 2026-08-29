// PATH: app/admin/packages/page.tsx
// AKSI: UPDATE FILE (tambah tombol Buat Baru, Edit, Hapus)

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { togglePackageActive, deletePackage } from "./actions";

type PackageRow = {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  max_active_listings: number;
  is_active: boolean;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function AdminPackagesPage() {
  const supabase = await createClient();

  const { data: packages } = await supabase
    .from("advertising_packages")
    .select("id, name, price, duration_days, max_active_listings, is_active")
    .order("price", { ascending: true })
    .returns<PackageRow[]>();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)]">
          Packages ({(packages || []).length})
        </h2>
        <Link
          href="/admin/packages/new"
          className="rounded-[var(--radius)] px-3 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          + Buat Baru
        </Link>
      </div>

      {(packages || []).map((pkg) => (
        <div
          key={pkg.id}
          className="flex flex-col gap-2 rounded-[var(--radius)] border border-gray-200 p-3 text-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{pkg.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {formatPrice(pkg.price)} / {pkg.duration_days} hari •{" "}
                {pkg.max_active_listings} listing aktif
              </p>
            </div>
            <form action={togglePackageActive}>
              <input type="hidden" name="id" value={pkg.id} />
              <input
                type="hidden"
                name="is_active"
                value={(!pkg.is_active).toString()}
              />
              <button
                type="submit"
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                  pkg.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {pkg.is_active ? "Aktif" : "Nonaktif"}
              </button>
            </form>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/admin/packages/${pkg.id}/edit`}
              className="rounded-[var(--radius)] border border-gray-300 px-3 py-1 text-xs font-medium"
            >
              Edit
            </Link>
            <form action={deletePackage}>
              <input type="hidden" name="id" value={pkg.id} />
              <button
                type="submit"
                className="rounded-[var(--radius)] border border-red-300 px-3 py-1 text-xs font-medium text-red-600"
              >
                Hapus
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
