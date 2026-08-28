// PATH: lib/agents/moderation-agent.ts
// AKSI: BUAT FILE BARU (Moderation Agent — versi otomatis dari analisis AI moderasi manual yang sudah ada)

import { createAdminClient } from "@/lib/supabase/admin";
import { callGemini } from "@/lib/ai/gemini-provider";
import { buildModerationPrompt } from "@/lib/ai/prompts";
import crypto from "crypto";
import type { ModerationResult } from "@/app/admin/listings/ai-actions";

const AGENT_NAME = "moderation";
const TASK_NAME = "moderation.analyze_listing";
const BATCH_LIMIT = 10;

type PendingListing = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  categories: { name: string } | null;
};

function hashInput(task: string, input: unknown): string {
  const raw = task + JSON.stringify(input);
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function runModerationAgent() {
  const supabase = createAdminClient();
  let processed = 0;
  const errors: string[] = [];

  const { data: pendingListings } = await supabase
    .from("listings")
    .select("id, title, description, price, categories(name)")
    .eq("status", "pending")
    .is("ai_moderation_checked_at", null)
    .limit(BATCH_LIMIT)
    .returns<PendingListing[]>();

  if (!pendingListings || pendingListings.length === 0) {
    return { ok: true, processed: 0, errors: [] };
  }

  for (const listing of pendingListings) {
    const moderationInput = {
      title: listing.title,
      description: listing.description || "",
      price: listing.price,
      categoryName: listing.categories?.name || "",
    };
    const taskInput = { listingId: listing.id, ...moderationInput };

    const { data: taskRow } = await supabase
      .from("agent_tasks")
      .insert({
        agent_name: AGENT_NAME,
        trigger_event: "listing.created",
        status: "running",
        input: taskInput,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    const startTime = Date.now();

    try {
      const cacheKey = hashInput(TASK_NAME, taskInput);
      const { data: cached } = await supabase
        .from("ai_cache")
        .select("output, expires_at")
        .eq("cache_key", cacheKey)
        .maybeSingle();

      let result: ModerationResult;

      if (cached && new Date(cached.expires_at) > new Date()) {
        result = cached.output as ModerationResult;
      } else {
        const prompt = buildModerationPrompt(moderationInput);
        const aiResult = await callGemini(prompt);
        const cleaned = aiResult.text.replace(/```json|```/g, "").trim();
        result = JSON.parse(cleaned);

        await supabase.from("ai_cache").upsert({
          cache_key: cacheKey,
          task: TASK_NAME,
          output: result,
        });
      }

      const latency = Date.now() - startTime;

      await supabase
        .from("listings")
        .update({
          ai_moderation_risk_level: result.riskLevel,
          ai_moderation_checked_at: new Date().toISOString(),
        })
        .eq("id", listing.id);

      if (taskRow) {
        await supabase
          .from("agent_tasks")
          .update({
            status: "success",
            output: result,
            latency_ms: latency,
            finished_at: new Date().toISOString(),
          })
          .eq("id", taskRow.id);
      }

      if (result.riskLevel !== "aman") {
        const { data: admins } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "admin");

        for (const admin of admins || []) {
          await supabase.from("notifications").insert({
            recipient_user_id: admin.id,
            title: "Listing perlu ditinjau",
            message: `"${listing.title}" ditandai ${result.riskLevel} oleh Moderation Agent.`,
            link: `/admin/listings`,
          });
        }
      }

      processed += 1;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${listing.id}: ${errorMessage}`);

      if (taskRow) {
        await supabase
          .from("agent_tasks")
          .update({
            status: "failed",
            error_message: errorMessage.slice(0, 500),
            latency_ms: Date.now() - startTime,
            finished_at: new Date().toISOString(),
          })
          .eq("id", taskRow.id);
      }
    }
  }

  return { ok: errors.length === 0, processed, errors };
  }
