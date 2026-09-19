// AKSI: GANTI SELURUH ISI FILE
// PATH: app/api/cron/usage-guardian/route.ts

import { NextRequest, NextResponse } from "next/server";
import { runUsageGuardian } from "@/lib/agents/usage-guardian";
import { runSubdomainExpiryNotifications } from "@/lib/subdomains/expiry-notifications";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await runUsageGuardian();
    await runSubdomainExpiryNotifications();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Cron guardian error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
