// PATH: app/dashboard/listings/actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type NewListingResult = {
  id: string;
};

export async function createListing(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = ((formData.get("title") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const priceRaw = formData.get("price") as string;
  const categoryId = formData.get("category_id") as string;
  const locationCity = ((formData.get("location_city") as string) || "").trim();
  const locationArea = ((formData.get("location_area") as string) || "").trim();

  if (!title) {
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent("Judul wajib diisi")}`
    );
  }

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent("Harga tidak valid")}`
    );
  }

  if (!categoryId) {
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent("Kategori wajib dipilih")}`
    );
  }

  if (!locationCity) {
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent("Kota wajib diisi")}`
    );
  }

  const { data: listing, error: insertError } = await supabase
    .from("listings")
    .insert({
      title,
      description: description || null,
      price: Math.round(price),
      category_id: categoryId,
      location_city: locationCity,
      location_area: locationArea || null,
      owner_id: user.id,
    })
    .select("id")
    .single<NewListingResult>();

  if (insertError || !listing) {
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent(
        insertError?.message || "Gagal membuat listing"
      )}`
    );
  }

  const images = formData.getAll("images") as File[];
  let sortOrder = 0;

  for (const file of images) {
    if (!file || file.size === 0) {
      continue;
    }

    const filePath = `${user.id}/${listing.id}/${sortOrder}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(filePath, file);

    if (uploadError) {
      sortOrder += 1;
      continue;
    }

    const { data: publicUrlData } = supabase.storage
      .from("listing-images")
      .getPublicUrl(filePath);

    await supabase.from("listing_images").insert({
      listing_id: listing.id,
      image_url: publicUrlData.publicUrl,
      sort_order: sortOrder,
    });

    sortOrder += 1;
  }

  redirect("/dashboard");
  }
