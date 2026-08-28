// PATH: lib/agents/engineering-agent.ts
// AKSI: BUAT FILE BARU (Agent Fase 3 — monitor kesehatan sistem AI, cron-only, tidak pakai Gemini)

import { createAdminClient } from "@/lib/supabase/admin";

const AGENT_NAME = "engineering";
const ERROR_RATE_THRESHOLD = 0.3; // 30%
const MIN_SAMPLE_SIZE = 5;

type TaskStat = {
  task: string;
  total: number;
  errors: number;
};

export async function runEngineeringAgent() {
  const supabase = createAdminClient();
  const startTime = Date.now();

  const { data: taskRow } = await supabase
    .from("agent_tasks")
    .insert({
      agent_name: AGENT_NAME,
      trigger_event: "cron.daily_health_check",
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: usageRows } = await supabase
      .from("ai_usage")
      .select("task, status")
      .gte("created_at", oneDayAgo);

    const statsByTask = new Map<string, TaskStat>();
    for (const row of usageRows || []) {
      const existing = statsByTask.get(row.task) || {
        task: row.task,
        total: 0,
        errors: 0,
      };
      existing.total += 1;
      if (row.status === "error") existing.errors += 1;
      statsByTask.set(row.task, existing);
    }

    const problematicTasks = Array.from(statsByTask.values()).filter(
      (s) => s.total >= MIN_SAMPLE_SIZE && s.errors / s.total >= ERROR_RATE_THRESHOLD
    );

    const { data: failedAgentRows } = await supabase
      .from("agent_tasks")
      .select("agent_name")
      .eq("status", "failed")
      .gte("created_at", oneDayAgo);

    const failedByAgent = new Map<string, number>();
    for (const row of failedAgentRows || []) {
      failedByAgent.set(row.agent_name, (failedByAgent.get(row.agent_name) || 0) + 1);
    }

    const messageLines: string[] = [];

    for (const stat of problematicTasks) {
      const rate = Math.round((stat.errors / stat.total) * 100);
      messageLines.push(
        `⚠️ Task AI "${stat.task}": ${rate}% gagal (${stat.errors}/${stat.total} dalam 24 jam)`
      );
    }

    for (const [agentName, count] of failedByAgent.entries()) {
      if (agentName === AGENT_NAME) continue;
      messageLines.push(`⚠️ Agent "${agentName}": ${count} task gagal dalam 24 jam`);
    }

    if (messageLines.length > 0) {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      for (const admin of admins || []) {
        await supabase.from("notifications").insert({
          recipient_user_id: admin.id,
          title: "Peringatan Kesehatan Sistem AI",
          message: messageLines.join("\n"),
          link: "/admin/ai-usage",
        });
      }
    }

    const summary = {
      problematicTasks,
      failedByAgent: Object.fromEntries(failedByAgent),
      alertsSent: messageLines.length,
    };

    const latency = Date.now() - startTime;

    if (taskRow) {
      await supabase
        .from("agent_tasks")
        .update({
          status: "success",
          output: summary,
          latency_ms: latency,
          finished_at: new Date().toISOString(),
        })
        .eq("id", taskRow.id);
    }

    return { ok: true, summary };
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

    return { ok: false, error: errorMessage };
  }
}
