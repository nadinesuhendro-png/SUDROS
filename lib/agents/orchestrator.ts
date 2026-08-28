// PATH: lib/agents/orchestrator.ts
// AKSI: BUAT FILE BARU (koordinator — jalankan semua agent yang aktif, dipanggil dari cron)

import { runModerationAgent } from "./moderation-agent";

export async function runAllAgents() {
  const results: Record<string, unknown> = {};

  results.moderation = await runModerationAgent();

  // Agent Fase 2+ ditambahkan di sini nanti:
  // results.admin_digest = await runAdminDigestAgent();
  // results.engineering = await runEngineeringAgent();

  return results;
  }
