// PATH: app/terms/page.tsx
// AKSI: BUAT FILE BARU

import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";

type TermsRow = {
  version: string;
  title: string;
  content: string;
  effective_at: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { dateStyle: "long" });
}

// Parser markdown minimal — tidak menambah dependency besar.
// Dukung: heading (# / ##), paragraf biasa, dan **bold** inline.
function renderContent(content: string) {
  const lines = content.split("\n");

  return lines.map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith("## ")) {
      return (
        <h2
          key={index}
          className="mt-5 mb-2 text-base font-semibold text-[var(--card-foreground)]"
        >
          {trimmed.replace(/^##\s+/, "")}
        </h2>
      );
    }

    if (trimmed.startsWith("# ")) {
      return (
        <h1
          key={index}
          className="mb-3 text-xl font-bold text-[var(--primary-dark)]"
        >
          {trimmed.replace(/^#\s+/, "")}
        </h1>
      );
    }

    // Inline **bold**
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);

    return (
      <p key={index} className="mb-2 text-sm text-[var(--foreground)]">
        {parts.map((part, i) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
    );
  });
}

export default async function TermsPage() {
  const supabase = await createClient();

  const { data: terms } = await supabase
    .from("terms_versions")
    .select("version, title, content, effective_at")
    .eq("is_active", true)
    .maybeSingle<TermsRow>();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl p-6">
        {!terms ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Syarat & Ketentuan sedang tidak tersedia. Silakan coba lagi nanti.
          </p>
        ) : (
          <>
            <p className="mb-4 text-xs text-[var(--muted-foreground)]">
              Versi {terms.version} • Berlaku mulai {formatDate(terms.effective_at)}
            </p>
            <div>{renderContent(terms.content)}</div>
          </>
        )}
      </main>
    </>
  );
}
