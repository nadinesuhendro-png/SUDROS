// PATH: app/admin/listings/ai-actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { createClient } from "@/lib/supabase/server";
import { runAITask } from "@/lib/ai/service";
import { buildModerationPrompt } from "@/lib/ai/prompts";

type ListingRow = {
  title: string;
  description: string | null;
  price: number;
  categories: { name: string } | null;
};

export type ModerationResult = {
  riskLevel: "aman" | "perlu_ditinjau" | "berisiko_tinggi";
  reasons: string[];
  summary: string;
};

export async function analyzeListingModeration(listingId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Harus login untuk menggunakan fitur AI" };
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!myProfile || myProfile.role !== "admin") {
    return { ok: false, error: "Hanya admin yang dapat menggunakan fitur ini" };
  }

  if (!listingId) {
    return { ok: false, error: "Listing tidak ditemukan" };
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("title, description, price, categories(name)")
    .eq("id", listingId)
    .maybeSingle<ListingRow>();

  if (!listing) {
    return { ok: false, error: "Listing tidak ditemukan" };
  }

  const moderationInput = {
    title: listing.title,
    description: listing.description || "",
    price: listing.price,
    categoryName: listing.categories?.name || "",
  };

  const prompt = buildModerationPrompt(moderationInput);

  return runAITask<ModerationResult>(
    "moderation.analyze_listing",
    { listingId, ...moderationInput },
    prompt
  );
}
