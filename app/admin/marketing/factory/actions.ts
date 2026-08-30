// PATH: app/admin/marketing/factory/actions.ts
// AKSI: BUAT FILE BARU (batch generation -- sequential, TIDAK paralel, aman terhadap rate limit)

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateMarketingContent } from "@/lib/marketing/content-service";
import type { MarketingListingFacts } from "@/lib/marketing/fallback";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sudros-chi.vercel.app";
const MAX_BATCH_SIZE = 5;

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!myProfile || myProfile.role !== "admin") {
    redirect("/dashboard");
  }

  return { supabase, userId: user.id };
}

type ListingForGeneration = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  location_city: string;
  location_area: string | null;
  categories: { name: string } | null;
};

export async function generateBatchContent(formData: FormData) {
  const { supabase, userId } = await requireAdmin();

  const listingIds = formData.getAll("listing_ids") as string[];
  const platform = formData.get("platform") as
    | "instagram"
    | "facebook"
    | "tiktok"
    | "whatsapp"
    | "general";
  const campaignId = (formData.get("campaign_id") as string) || null;

  if (listingIds.length === 0 || !platform) {
    redirect("/admin/marketing/factory?error=1");
  }

  const limitedIds = listingIds.slice(0, MAX_BATCH_SIZE);

  const results: { listingTitle: string; status: "ai" | "fallback" | "failed" }[] = [];

  for (const listingId of limitedIds) {
    try {
      const { data: listing } = await supabase
        .from("listings")
        .select("id, title, description, price, location_city, location_area, categories(name)")
        .eq("id", listingId)
        .maybeSingle<ListingForGeneration>();

      if (!listing) {
        results.push({ listingTitle: "(listing tidak ditemukan)", status: "failed" });
        continue;
      }

      const facts: MarketingListingFacts = {
        title: listing.title,
        description: listing.description || "",
        price: listing.price,
        locationCity: listing.location_city,
        locationArea: listing.location_area || "",
        categoryName: listing.categories?.name || "",
        listingUrl: `${SITE_URL}/listings/${listing.id}`,
      };

      const { content, generationMethod } = await generateMarketingContent(facts, platform);

      await supabase.from("marketing_contents").insert({
        listing_id: listing.id,
        campaign_id: campaignId,
        platform,
        headline: content.headline,
        hook: content.hook,
        caption: content.caption,
        short_copy: content.short_copy,
        video_script: content.video_script,
        cta: content.cta,
        hashtags: content.hashtags,
        status: "draft",
        generation_method: generationMethod,
        created_by: userId,
      });

      results.push({ listingTitle: listing.title, status: generationMethod });
    } catch {
      results.push({ listingTitle: "(gagal diproses)", status: "failed" });
    }
  }

  const aiCount = results.filter((r) => r.status === "ai").length;
  const fallbackCount = results.filter((r) => r.status === "fallback").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  await supabase.from("notifications").insert({
    recipient_user_id: userId,
    title: "Marketing Content Selesai Dibuat",
    message: `Batch generate untuk ${limitedIds.length} listing selesai: ${aiCount} via AI, ${fallbackCount} via template${
      failedCount > 0 ? `, ${failedCount} gagal` : ""
    }.`,
    link: "/admin/marketing/content",
  });

  redirect("/admin/marketing/content");
        }
