// AKSI: BUAT FILE BARU
// PATH: components/analytics/page-view-tracker.tsx

"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics/track";

export function PageViewTracker({ event }: { event: AnalyticsEvent }) {
  useEffect(() => {
    track(event);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
