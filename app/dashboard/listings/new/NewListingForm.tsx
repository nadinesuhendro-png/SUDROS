// PATH: app/dashboard/listings/new/NewListingForm.tsx
// AKSI: BUAT FILE BARU

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createListing } from "@/app/dashboard/listings/actions";

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

export default function NewListingForm({
  categories,
  errorMessage,
}: {
  categories: Category[];
  errorMessage?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [localError, setLocalError] = useState("");

  async function handleSubmit(formEl: HTMLFormElement) {
    setSubmitting(true);
    setLocalError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const formData = new FormData(formEl);
      const title = (formData.get("title") as string) || "";
      const description = (formData.get("description") as string) || "";
      const price = Number(formData.get("price"));
      const categoryId = (formData.get("category_id") as string) || "";
      const locationCity = (formData.get("location_city") as string) || "";
      const locationArea = (formData.get("location_area") as string) || "";
      const files = formData.getAll("images") as File[];
      const validFiles = files.filter((f) => f && f.size > 0);

      const listingId = crypto.randomUUID();
      const imageUrls: string[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setStatusText(`Mengupload foto ${i + 1} dari ${validFiles.length}...`);

        const filePath = `${user.id}/${listingId}/${i}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(filePath, file);

        if (uploadError) {
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from("listing-images")
          .getPublicUrl(filePath);

        imageUrls.push(publicUrlData.publicUrl);
      }

      setStatusText("Menyimpan listing...");

      await createListing({
        id: listingId,
        title,
        description,
        price,
        categoryId,
        locationCity,
        locationArea,
        imageUrls,
      });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Terjadi kesalahan tak terduga"
      );
      setSubmitting(false);
      setStatusText("");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-6">
      <div className="w-full" style={cardStyle}>
        <h1
          className="text-lg font-semibold mb-4 text-center"
          style={{ color: "var(--primary-dark)" }}
        >
          Buat Listing Baru
        </h1>

        {errorMessage || localError ? (
          <div className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-3 text-sm text-red-600">
            {localError || errorMessage}
          </div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e.currentTarget);
          }}
          className="flex flex-col gap-4"
        >
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
              {categories.map((category) => (
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
            disabled={submitting}
            className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {submitting ? statusText || "Menyimpan..." : "Simpan Listing"}
          </button>
        </form>
      </div>
    </main>
  );
}
