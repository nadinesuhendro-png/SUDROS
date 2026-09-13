"use client";

export default function TestSentryPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-lg font-semibold">Halaman Tes Sentry</h1>
      <p className="max-w-sm text-center text-sm text-[var(--muted-foreground)]">
        Halaman ini sengaja dibuat untuk memicu error dan mengecek apakah
        Sentry menangkapnya. Hapus file ini setelah tes berhasil.
      </p>
      <button
        onClick={() => {
          throw new Error("Tes Sentry dari client — sengaja dipicu");
        }}
        className="rounded-md px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "var(--primary)" }}
      >
        Picu Error (Client)
      </button>
      <a
        href="/test-sentry/server-error"
        className="text-sm font-medium underline"
        style={{ color: "var(--primary)" }}
      >
        Picu Error (Server) →
      </a>
    </main>
  );
}
