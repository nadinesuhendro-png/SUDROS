// PATH: lib/agents/orchestrator.ts
// AKSI: UPDATE FILE (aktifkan Listing Quality Agent — Fase 6)

import { runModerationAgent } from "./moderation-agent";
import { runAdminDigestAgent } from "./admin-digest-agent";
import { runEngineeringAgent } from "./engineering-agent";
import { runSupportAgent } from "./support-agent";
import { runSecurityAgent } from "./security-agent";
import { runListingQualityAgent } from "./listing-quality-agent";

export async function runAllAgents() {
  const results: Record<string, unknown> = {};

  results.moderation = await runModerationAgent();
  results.admin_digest = await runAdminDigestAgent();
  results.engineering = await runEngineeringAgent();
  results.support = await runSupportAgent();
  results.security = await runSecurityAgent();
  results.listing_quality = await runListingQualityAgent();

  // Agent selanjutnya ditambahkan di sini nanti:
  // results.monetization = await runMonetizationAgent();

  return results;
}
