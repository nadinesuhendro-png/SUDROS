"use server";

export const maxDuration = 30;

import { createClient } from "@/lib/supabase/server";
import { runAITask } from "@/lib/ai/service";
import {
  buildListingContentPrompt,
  buildMarketingCaptionPrompt,
  ListingContentInput,
} from "@/lib/ai/prompts";

export async function generateListingContent(input: ListingContentInput) {
  const prompt = buildListingContentPrompt(input);

  return runAITask<{ title: string; description: string }>(
    "listing.generate_title_description",
    input,
    prompt
  );
}

type ListingRow = {
  title: string;
  description: string | null;
  price: number;
  location_city: string;
  location_area: string | null;
  categories: { name: string } | null;
};

export async function generateMarketingCaption(listingId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Harus login untuk menggunakan fitur AI" };
  }

  if (!listingId) {
    return { ok: false, error: "Listing tidak ditemukan" };
  }

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "title, description, price, location_city, location_area, categories(name)"
    )
    .eq("id", listingId)
    .eq("owner_id", user.id)
    .maybeSingle<ListingRow>();

  if (!listing) {
    return {
      ok: false,
      error: "Listing tidak ditemukan atau bukan milik Anda",
    };
  }

  const captionInput = {
    title: listing.title,
    description: listing.description || "",
    price: listing.price,
    categoryName: listing.categories?.name || "",
    locationCity: listing.location_city,
    locationArea: listing.location_area || "",
  };

  const prompt = buildMarketingCaptionPrompt(captionInput);

  return runAITask<{ caption: string }>(
    "marketing.generate_caption",
    { listingId, ...captionInput },
    prompt
  );
}
