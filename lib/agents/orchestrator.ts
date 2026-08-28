// PATH: lib/agents/orchestrator.ts
// AKSI: UPDATE FILE (aktifkan Admin Digest Agent — Fase 2)

import { runModerationAgent } from "./moderation-agent";
import { runAdminDigestAgent } from "./admin-digest-agent";

export async function runAllAgents() {
  const results: Record<string, unknown> = {};

  results.moderation = await runModerationAgent();
  results.admin_digest = await runAdminDigestAgent();

  // Agent Fase 3+ ditambahkan di sini nanti:
  // results.engineering = await runEngineeringAgent();

  return results;
}
