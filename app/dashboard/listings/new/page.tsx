// PATH: app/dashboard/listings/new/page.tsx
// AKSI: BUAT FILE BARU

import { createClient } from "@/lib/supabase/server";
import { createListing } from "@/app/dashboard/listings/actions";
import { redirect } from "next/navigation";

type Category = {
  id: string;
  name: string;
};

const cardStyle = {
  maxWidth: "480px",
};

const inputClassName =
  "w-full rounded-[var(--radius)] border border-gray-300 px-4 py-2 text-sm";

const labelClassName = "block text-sm font-medium text-left mb-1";

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name")
    .returns<Category[]>();

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-6">
      <div className="w-full" style={cardStyle}>
        <h1
          className="text-lg font-semibold mb-4 text-center"
          style={{ color: "var(--primary-dark)" }}
        >
          Buat Listing Baru
        </h1>

        {params.error ? (
          <div className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-3 text-sm text-red-600">
            {params.error}
          </div>
        ) : null}

        <form action={createListing} className="flex flex-col gap-4">
          <div>
            <label className={labelClassName} htmlFor="title">
              Judul
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className={inputClassName}
            />
          </div>

          <div>
            <label className={labelClassName} htmlFor="description">
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className={inputClassName}
            />
          </div>

          <div>
            <label className={labelClassName} htmlFor="price">
              Harga (Rp)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              required
              className={inputClassName}
            />
          </div>

          <div>
            <label className={labelClassName} htmlFor="category_id">
              Kategori
            </label>
            <select
              id="category_id"
              name="category_id"
              required
              className={inputClassName}
            >
              <option value="">Pilih kategori</option>
              {(categories || []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClassName} htmlFor="location_city">
              Kota
            </label>
            <input
              id="location_city"
              name="location_city"
              type="text"
              required
              className={inputClassName}
            />
          </div>

          <div>
            <label className={labelClassName} htmlFor="location_area">
              Area (opsional)
            </label>
            <input
              id="location_area"
              name="location_area"
              type="text"
              className={inputClassName}
            />
          </div>

          <div>
            <label className={labelClassName} htmlFor="images">
              Foto
            </label>
            <input
              id="images"
              name="images"
              type="file"
              accept="image/*"
              multiple
              className={inputClassName}
            />
          </div>

          <button
            type="submit"
            className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Simpan Listing
          </button>
        </form>
      </div>
    </main>
  );
}
