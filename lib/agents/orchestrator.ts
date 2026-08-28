// PATH: lib/agents/orchestrator.ts
// AKSI: UPDATE FILE (aktifkan Security Agent — Fase 5)

import { runModerationAgent } from "./moderation-agent";
import { runAdminDigestAgent } from "./admin-digest-agent";
import { runEngineeringAgent } from "./engineering-agent";
import { runSupportAgent } from "./support-agent";
import { runSecurityAgent } from "./security-agent";

export async function runAllAgents() {
  const results: Record<string, unknown> = {};

  results.moderation = await runModerationAgent();
  results.admin_digest = await runAdminDigestAgent();
  results.engineering = await runEngineeringAgent();
  results.support = await runSupportAgent();
  results.security = await runSecurityAgent();

  // Agent selanjutnya ditambahkan di sini nanti:
  // results.listing_quality = await runListingQualityAgent();

  return results;
}
