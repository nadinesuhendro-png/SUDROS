// PATH: app/dashboard/listings/[id]/edit/EditListingForm.tsx
// AKSI: BUAT FILE BARU

"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  updateListing,
  deleteListingImage,
} from "@/app/dashboard/listings/actions";

type Category = {
  id: string;
  name: string;
};

type ListingImage = {
  id: string;
  image_url: string;
  sort_order: number;
};

type ListingForEdit = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category_id: string;
  location_city: string;
  location_area: string | null;
  listing_images: ListingImage[];
};

const inputClassName =
  "w-full rounded-[var(--radius)] border border-gray-300 px-4 py-2 text-sm";

const labelClassName = "block text-sm font-medium text-left mb-1";

export default function EditListingForm({
  listing,
  categories,
  errorMessage,
}: {
  listing: ListingForEdit;
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

      const rawFormData = new FormData(formEl);
      const files = rawFormData.getAll("images") as File[];
      const validFiles = files.filter((f) => f && f.size > 0);
      const newImageUrls: string[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setStatusText(`Mengupload foto baru ${i + 1} dari ${validFiles.length}...`);

        const filePath = `${user.id}/${listing.id}/${Date.now()}-${i}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(filePath, file);

        if (uploadError) {
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from("listing-images")
          .getPublicUrl(filePath);

        newImageUrls.push(publicUrlData.publicUrl);
      }

      setStatusText("Menyimpan perubahan...");

      const submitData = new FormData();
      submitData.set("id", listing.id);
      submitData.set("title", rawFormData.get("title") as string);
      submitData.set("description", rawFormData.get("description") as string);
      submitData.set("price", rawFormData.get("price") as string);
      submitData.set("category_id", rawFormData.get("category_id") as string);
      submitData.set("location_city", rawFormData.get("location_city") as string);
      submitData.set("location_area", rawFormData.get("location_area") as string);
      newImageUrls.forEach((url) => submitData.append("new_image_urls", url));

      await updateListing(submitData);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Terjadi kesalahan tak terduga"
      );
      setSubmitting(false);
      setStatusText("");
    }
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 p-6">
      <h1
        className="text-lg font-semibold text-center"
        style={{ color: "var(--primary-dark)" }}
      >
        Edit Listing
      </h1>

      {errorMessage || localError ? (
        <div className="rounded-[var(--radius)] bg-red-50 px-4 py-3 text-sm text-red-600">
          {localError || errorMessage}
        </div>
      ) : null}

      {listing.listing_images.length > 0 ? (
        <div>
          <label className={labelClassName}>Foto Saat Ini</label>
          <div className="flex flex-wrap gap-2">
            {listing.listing_images.map((img) => (
              <div key={img.id} className="relative h-20 w-20">
                <Image
                  src={img.image_url}
                  alt="Foto listing"
                  fill
                  className="rounded-[var(--radius)] object-cover"
                />
                <form action={deleteListingImage} className="absolute -right-1 -top-1">
                  <input type="hidden" name="image_id" value={img.id} />
                  <input type="hidden" name="listing_id" value={listing.id} />
                  <button
                    type="submit"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                  >
                    ✕
                  </button>
                </form>
              </div>
            ))}
          </div>
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
            defaultValue={listing.title}
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
            defaultValue={listing.description || ""}
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
            defaultValue={listing.price}
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
            defaultValue={listing.category_id}
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
            defaultValue={listing.location_city}
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
            defaultValue={listing.location_area || ""}
            className={inputClassName}
          />
        </div>

        <div>
          <label className={labelClassName} htmlFor="images">
            Tambah Foto Baru (opsional)
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
          {submitting ? statusText || "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </main>
  );
      }
