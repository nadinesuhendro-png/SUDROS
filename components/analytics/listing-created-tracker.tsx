// AKSI: BUAT FILE BARU
// PATH: components/analytics/listing-created-tracker.tsx

"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { track } from "@/lib/analytics/track";

export function ListingCreatedTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("listing_created") !== "1") return;

    track("listing_created", {
      listing_id: searchParams.get("listing_id") || undefined,
    });

    // Bersihkan query param supaya tidak fire lagi kalau halaman di-refresh
    const remaining = new URLSearchParams(searchParams.toString());
    remaining.delete("listing_created");
    remaining.delete("listing_id");
    const query = remaining.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

