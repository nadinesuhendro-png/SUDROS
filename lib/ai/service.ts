// PATH: lib/ai/service.ts
// AKSI: UPDATE FILE (ai_cache read/write pindah ke admin client karena akses client biasa sudah dicabut lewat RLS)

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { callGemini, GEMINI_MODEL } from "./gemini-provider";
import crypto from "crypto";

const RATE_LIMIT_PER_MINUTE = 5;

function hashInput(task: string, input: unknown): string {
  const raw = task + JSON.stringify(input);
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export type AIRunResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export async function runAITask<T>(
  task: string,
  input: unknown,
  prompt: string
): Promise<AIRunResult<T>> {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Harus login untuk menggunakan fitur AI" };
  }

  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const { count: recentCount } = await supabase
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("task", task)
    .gte("created_at", oneMinuteAgo);

  if ((recentCount || 0) >= RATE_LIMIT_PER_MINUTE) {
    return { ok: false, error: "Terlalu banyak permintaan AI. Coba lagi sebentar lagi." };
  }

  const cacheKey = hashInput(task, input);
  const { data: cached } = await supabaseAdmin
    .from("ai_cache")
    .select("output, expires_at")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (cached && new Date(cached.expires_at) > new Date()) {
    return { ok: true, data: cached.output as T };
  }

  const startTime = Date.now();

  try {
    const result = await callGemini(prompt);
    const latency = Date.now() - startTime;

    let parsed: T;
    try {
      const cleaned = result.text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Format hasil AI tidak valid");
    }

    await supabase.from("ai_usage").insert({
      user_id: user.id,
      task,
      model: result.model,
      status: "success",
      latency_ms: latency,
    });

    await supabaseAdmin.from("ai_cache").upsert({
      cache_key: cacheKey,
      task,
      output: parsed,
    });

    return { ok: true, data: parsed };
  } catch (err) {
    const latency = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    await supabase.from("ai_usage").insert({
      user_id: user.id,
      task,
      model: GEMINI_MODEL,
      status: "error",
      latency_ms: latency,
      error_message: errorMessage.slice(0, 500),
    });

    return { ok: false, error: "AI sedang tidak tersedia. Silakan coba lagi." };
  }
}
