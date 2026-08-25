// PATH: app/pricing/page.tsx
// AKSI: UPDATE FILE (tambah tombol Pilih Paket)

import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/app/orders/actions";

type PackageRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  max_active_listings: number;
  featured_limit: number;
  seller_badge: boolean;
  homepage_priority: boolean;
};

function formatPrice(price: number) {
  if (price === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function PricingPage() {
  const supabase = await createClient();

  const { data: packages } = await supabase
    .from("advertising_packages")
    .select(
      "id, name, description, price, duration_days, max_active_listings, featured_limit, seller_badge, homepage_priority"
    )
    .eq("is_active", true)
    .order("price", { ascending: true })
    .returns<PackageRow[]>();

  return (
    <>
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
        <h1
          className="text-center text-lg font-semibold"
          style={{ color: "var(--primary-dark)" }}
        >
          Paket Promosi SUDROS
        </h1>
        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Gratis untuk mulai. Murah untuk berkembang.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(packages || []).map((pkg) => (
            <div
              key={pkg.id}
              className="flex flex-col gap-2 rounded-[var(--radius)] border border-gray-200 p-4"
            >
              <h2 className="text-base font-semibold">{pkg.name}</h2>
              <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>
                {formatPrice(pkg.price)}
                {pkg.price > 0 ? (
                  <span className="text-sm font-normal text-[var(--muted-foreground)]">
                    {" "}
                    / {pkg.duration_days} hari
                  </span>
                ) : null}
              </p>
              {pkg.description ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  {pkg.description}
                </p>
              ) : null}
              <ul className="flex flex-col gap-1 text-sm">
                <li>• {pkg.max_active_listings} listing aktif</li>
                {pkg.featured_limit > 0 ? (
                  <li>• {pkg.featured_limit} featured listing</li>
                ) : null}
                {pkg.seller_badge ? <li>• Badge penjual</li> : null}
                {pkg.homepage_priority ? (
                  <li>• Prioritas tampil di homepage</li>
                ) : null}
              </ul>

              {pkg.price > 0 ? (
                <form action={createOrder} className="mt-2">
                  <input type="hidden" name="package_id" value={pkg.id} />
                  <input type="hidden" name="amount" value={pkg.price} />
                  <button
                    type="submit"
                    className="w-full rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    Pilih Paket
                  </button>
                </form>
              ) : (
                <div className="mt-2 rounded-[var(--radius)] border border-gray-300 px-4 py-2 text-center text-sm text-[var(--muted-foreground)]">
                  Paket default kamu
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
