// PATH: app/api/cron/agents/route.ts
// AKSI: BUAT FILE BARU (endpoint yang dipanggil Vercel Cron untuk menjalankan semua AI agent)

import { NextRequest, NextResponse } from "next/server";
import { runAllAgents } from "@/lib/agents/orchestrator";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runAllAgents();

  return NextResponse.json({ ok: true, results });
}
