// AKSI: BUAT FILE BARU
// PATH: components/analytics/track-link.tsx

"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics/track";

type Props = ComponentProps<typeof Link> & {
  event: AnalyticsEvent;
  eventProperties?: Record<string, string | number | boolean | undefined>;
};

export function TrackLink({ event, eventProperties, onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        track(event, eventProperties);
        onClick?.(e);
      }}
    />
  );
}
