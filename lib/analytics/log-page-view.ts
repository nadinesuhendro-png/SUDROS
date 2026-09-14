import { headers } from "next/headers";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export async function logPageView(
  pageType: "site" | "seller_profile",
  path: string,
  sellerId?: string
) {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
    const ua = headersList.get("user-agent") || "unknown";

    // Hash satu-arah, tidak menyimpan IP mentah. Tidak dirotasi per-hari
    // supaya "pengunjung unik" konsisten dihitung lintas hari/bulan/tahun.
    const visitorHash = crypto
      .createHash("sha256")
      .update(`${ip}|${ua}`)
      .digest("hex");

    const supabase = await createClient();
    await supabase.from("page_views").insert({
      page_type: pageType,
      path,
      seller_id: sellerId ?? null,
      visitor_hash: visitorHash,
    });
  } catch {
    // Logging kunjungan tidak boleh pernah menjatuhkan halaman
  }
}
