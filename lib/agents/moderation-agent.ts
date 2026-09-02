// PATH: lib/agents/moderation-agent.ts
// AKSI: GANTI SELURUH ISI FILE (tambah alert admin saat gagal 3x berturut-turut)

import { createAdminClient } from "@/lib/supabase/admin";
import { callGemini } from "@/lib/ai/gemini-provider";
import { buildModerationPrompt } from "@/lib/ai/prompts";
import crypto from "crypto";
import type { ModerationResult } from "@/app/admin/listings/ai-actions";

const AGENT_NAME = "moderation";
const TASK_NAME = "moderation.analyze_listing";
const BATCH_LIMIT = 10;
const FAILURE_ALERT_THRESHOLD = 3;
const FAILURE_ALERT_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 jam, cegah spam notifikasi

type ListingForModeration = {
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

// Kalau moderasi gagal berturut-turut (bukan cuma sesekali), admin perlu
// tahu — karena artinya listing baru berpotensi nyangkut "pending" tanpa
// pernah ditinjau otomatis. Cooldown 2 jam supaya tidak spam notifikasi
// tiap kali ada kegagalan baru selama masalahnya belum diperbaiki.
async function checkAndAlertOnRepeatedFailures(
  supabase: ReturnType<typeof createAdminClient>
) {
  const { data: recentTasks } = await supabase
    .from("agent_tasks")
    .select("status")
    .eq("agent_name", AGENT_NAME)
    .order("started_at", { ascending: false })
    .limit(FAILURE_ALERT_THRESHOLD);

  if (!recentTasks || recentTasks.length < FAILURE_ALERT_THRESHOLD) {
    return;
  }

  const allFailed = recentTasks.every((t) => t.status === "failed");
  if (!allFailed) {
    return;
  }

  const cooldownStart = new Date(
    Date.now() - FAILURE_ALERT_COOLDOWN_MS
  ).toISOString();

  const { data: existingAlert } = await supabase
    .from("notifications")
    .select("id")
    .eq("title", "⚠️ Moderation Agent bermasalah")
    .gte("created_at", cooldownStart)
    .limit(1)
    .maybeSingle();

  if (existingAlert) {
    return;
  }

  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  for (const admin of admins || []) {
    await supabase.from("notifications").insert({
      recipient_user_id: admin.id,
      title: "⚠️ Moderation Agent bermasalah",
      message: `${FAILURE_ALERT_THRESHOLD} percobaan moderasi listing terakhir gagal berturut-turut. Listing baru berpotensi tertahan di status pending tanpa ditinjau otomatis. Cek halaman Agents dan tinjau listing pending secara manual sementara.`,
      link: "/admin/agents",
    });
  }
}

async function analyzeAndSaveListing(
  supabase: ReturnType<typeof createAdminClient>,
  listing: ListingForModeration,
  triggerEvent: string
): Promise<{ ok: boolean; error?: string }> {
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
      trigger_event: triggerEvent,
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

    return { ok: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

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

    await checkAndAlertOnRepeatedFailures(supabase);

    return { ok: false, error: errorMessage };
  }
}

// Dipanggil langsung saat listing baru dibuat (trigger utama — realtime)
export async function runModerationAgentForListing(listingId: string) {
  const supabase = createAdminClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, description, price, categories(name)")
    .eq("id", listingId)
    .maybeSingle<ListingForModeration>();

  if (!listing) {
    return { ok: false, error: "Listing tidak ditemukan" };
  }

  return analyzeAndSaveListing(supabase, listing, "listing.created");
}

// Dipanggil dari cron harian — safety net untuk listing yang somehow terlewat trigger langsung
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
    .returns<ListingForModeration[]>();

  if (!pendingListings || pendingListings.length === 0) {
    return { ok: true, processed: 0, errors: [] };
  }

  for (const listing of pendingListings) {
    const result = await analyzeAndSaveListing(supabase, listing, "cron.daily_sweep");
    if (result.ok) {
      processed += 1;
    } else {
      errors.push(`${listing.id}: ${result.error}`);
    }
  }

  return { ok: errors.length === 0, processed, errors };
            }
