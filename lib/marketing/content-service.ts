import { generatePlatformFallbackContent } from "./fallback";
import { buildPlatformPromotionPrompt } from "@/lib/ai/prompts";

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
