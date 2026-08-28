// PATH: lib/agents/orchestrator.ts
// AKSI: UPDATE FILE (aktifkan Support Agent — Fase 4)

import { runModerationAgent } from "./moderation-agent";
import { runAdminDigestAgent } from "./admin-digest-agent";
import { runEngineeringAgent } from "./engineering-agent";
import { runSupportAgent } from "./support-agent";

export async function runAllAgents() {
  const results: Record<string, unknown> = {};

  results.moderation = await runModerationAgent();
  results.admin_digest = await runAdminDigestAgent();
  results.engineering = await runEngineeringAgent();
  results.support = await runSupportAgent();

  // Agent Fase 5+ ditambahkan di sini nanti:
  // results.security = await runSecurityAgent();

  return results;
}
