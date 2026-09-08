// AKSI: BUAT FILE BARU
// PATH: lib/analytics/track.ts

export type AnalyticsEvent =
  | "landing_page_view"
  | "search_submitted"
  | "category_clicked"
  | "location_clicked"
  | "listing_clicked"
  | "business_cta_clicked"
  | "register_started"
  | "listing_created"
  | "whatsapp_clicked"
  | "social_share_clicked";

type AnalyticsProperties = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function track(event: AnalyticsEvent, properties?: AnalyticsProperties) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...properties });

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, properties);
  }
}
