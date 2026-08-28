// PATH: lib/agents/orchestrator.ts
// AKSI: UPDATE FILE (aktifkan Engineering Agent — Fase 3)

import { runModerationAgent } from "./moderation-agent";
import { runAdminDigestAgent } from "./admin-digest-agent";
import { runEngineeringAgent } from "./engineering-agent";

export async function runAllAgents() {
  const results: Record<string, unknown> = {};

  results.moderation = await runModerationAgent();
  results.admin_digest = await runAdminDigestAgent();
  results.engineering = await runEngineeringAgent();

  // Agent Fase 4+ ditambahkan di sini nanti:
  // results.support = await runSupportAgent();

  return results;
}
