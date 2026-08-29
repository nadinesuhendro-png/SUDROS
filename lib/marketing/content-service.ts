// PATH: lib/marketing/content-service.ts
// AKSI: BUAT FILE BARU (orkestrasi AI + fallback — SELALU berhasil, tidak pernah throw ke caller)

import { runAITask } from "@/lib/ai/service";
import { buildMarketingContentPrompt, buildPlatformPromotionPrompt, type MarketingContentInput } from "@/lib/ai/prompts";
import {
  generateFallbackContent,
  generatePlatformFallbackContent,
  type MarketingListingFacts,
  type MarketingContentOutput,
} from "./fallback";

export type GenerateContentResult = {
  content: MarketingContentOutput;
  generationMethod: "ai" | "fallback";
};

function isValidContentShape(data: unknown): data is MarketingContentOutput {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  const stringFields = ["headline", "hook", "caption", "short_copy", "video_script", "cta"];
  for (const field of stringFields) {
    if (typeof d[field] !== "string") return false;
  }
  if (!Array.isArray(d.hashtags)) return false;
  if (!d.hashtags.every((h) => typeof h === "string")) return false;
  return true;
}

export async function generateMarketingContent(
  facts: MarketingListingFacts,
  platform: MarketingContentInput["platform"]
): Promise<GenerateContentResult> {
  try {
    const prompt = buildMarketingContentPrompt({
      title: facts.title,
      description: facts.description,
      price: facts.price,
      categoryName: facts.categoryName,
      locationCity: facts.locationCity,
      locationArea: facts.locationArea,
      platform,
    });

    const result = await runAITask<MarketingContentOutput>(
      "marketing.generate_content",
      { platform, title: facts.title, price: facts.price, locationCity: facts.locationCity },
      prompt
    );

    if (result.ok && result.data && isValidContentShape(result.data)) {
      return { content: result.data, generationMethod: "ai" };
    }

    return {
      content: generateFallbackContent(facts, platform),
      generationMethod: "fallback",
    };
  } catch {
    return {
      content: generateFallbackContent(facts, platform),
      generationMethod: "fallback",
    };
  }
}

export async function generatePlatformContent(
  siteUrl: string,
  platform: MarketingContentInput["platform"]
): Promise<GenerateContentResult> {
  try {
    const prompt = buildPlatformPromotionPrompt({ platform });

    const result = await runAITask<MarketingContentOutput>(
      "marketing.generate_platform_content",
      { platform, type: "platform_promotion" },
      prompt
    );

    if (result.ok && result.data && isValidContentShape(result.data)) {
      return { content: result.data, generationMethod: "ai" };
    }

    return {
      content: generatePlatformFallbackContent(siteUrl, platform),
      generationMethod: "fallback",
    };
  } catch {
    return {
      content: generatePlatformFallbackContent(siteUrl, platform),
      generationMethod: "fallback",
    };
  }
}
