// PATH: app/dashboard/listings/ai-actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { runAITask } from "@/lib/ai/service";
import { buildListingContentPrompt, ListingContentInput } from "@/lib/ai/prompts";

export async function generateListingContent(input: ListingContentInput) {
  const prompt = buildListingContentPrompt(input);

  return runAITask<{ title: string; description: string }>(
    "listing.generate_title_description",
    input,
    prompt
  );
}
