// PATH: app/admin/packages/[id]/edit/page.tsx
// AKSI: BUAT FILE BARU (form edit paket iklan yang sudah ada)

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePackage } from "../../actions";

type PackageDetail = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  max_active_listings: number;
};

export default async function EditPackagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();

  const { data: pkg } = await supabase
    .from("advertising_packages")
    .select("id, name, description, price, duration_days, max_active_listings")
    .eq("id", id)
    .maybeSingle<PackageDetail>();

  if (!pkg) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
        Edit Paket: {pkg.name}
      </h2>

      {error ? (
        <p className="text-sm text-red-600">
          Semua field wajib diisi dengan benar.
        </p>
      ) : null}

      <form action={updatePackage} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={pkg.id} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Nama Paket</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={pkg.name}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Deskripsi</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={pkg.description || ""}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Harga (Rp)</label>
          <input
            type="number"
            name="price"
            required
            min={0}
            defaultValue={pkg.price}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Durasi (hari)</label>
          <input
            type="number"
            name="duration_days"
            required
            min={1}
            defaultValue={pkg.duration_days}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Maks. Listing Aktif</label>
          <input
            type="number"
            name="max_active_listings"
            required
            min={1}
            defaultValue={pkg.max_active_listings}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
}
