// PATH: app/dashboard/listings/[id]/edit/page.tsx
// AKSI: BUAT FILE BARU

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditListingForm from "./EditListingForm";

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
  owner_id: string;
  listing_images: ListingImage[];
};

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, title, description, price, category_id, location_city, location_area, owner_id, listing_images(id, image_url, sort_order)"
    )
    .eq("id", id)
    .eq("owner_id", user.id)
    .single<ListingForEdit>();

  if (!listing) {
    notFound();
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name")
    .returns<Category[]>();

  const sortedImages = [...(listing.listing_images || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <EditListingForm
      listing={{ ...listing, listing_images: sortedImages }}
      categories={categories || []}
      errorMessage={error}
    />
  );
}
