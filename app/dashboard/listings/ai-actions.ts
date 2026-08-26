// PATH: app/dashboard/listings/ai-actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { runAITask } from "@/lib/ai/service";
import { buildListingContentPrompt, ListingContentInput } from "@/lib/ai/prompts";

type ListingAIOutput = {
  title: string;
  description: string;
};

export async function generateListingContent(input: ListingContentInput) {
  const prompt = buildListingContentPrompt(input);
  return runAITask<ListingAIOutput>("listing.generate_description", input, prompt);
}
