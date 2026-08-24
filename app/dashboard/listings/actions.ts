// PATH: app/dashboard/listings/actions.ts
// AKSI: UPDATE FILE

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type CreateListingInput = {
  id: string;
  title: string;
  description: string;
  price: number;
  categoryId: string;
  locationCity: string;
  locationArea: string;
  imageUrls: string[];
};

export async function createListing(input: CreateListingInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = input.title.trim();
  const locationCity = input.locationCity.trim();

  if (!title) {
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent("Judul wajib diisi")}`
    );
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent("Harga tidak valid")}`
    );
  }

  if (!input.categoryId) {
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
      id: input.id,
      title,
      description: input.description.trim() || null,
      price: Math.round(input.price),
      category_id: input.categoryId,
      location_city: locationCity,
      location_area: input.locationArea.trim() || null,
      owner_id: user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !listing) {
    redirect(
      `/dashboard/listings/new?error=${encodeURIComponent(
        insertError?.message || "Gagal membuat listing"
      )}`
    );
  }

  if (input.imageUrls.length > 0) {
    const rows = input.imageUrls.map((url, index) => ({
      listing_id: listing.id,
      image_url: url,
      sort_order: index,
    }));

    await supabase.from("listing_images").insert(rows);
  }

  redirect("/dashboard");
}
