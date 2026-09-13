export const dynamic = "force-dynamic";

export default function TestSentryServerErrorPage() {
  throw new Error("Tes Sentry dari server — sengaja dipicu");
}
