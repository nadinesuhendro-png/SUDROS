// PATH: app/admin/terms/[id]/page.tsx
// AKSI: BUAT FILE BARU

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { activateTermsVersion } from "../actions";

type TermsVersionRow = {
  id: string;
  version: string;
  title: string;
  content: string;
  is_active: boolean;
  effective_at: string;
  created_at: string;
};

type AgreementRow = {
  agreed_at: string;
  profiles: { username: string } | null;
};

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function TermsVersionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: version } = await supabase
    .from("terms_versions")
    .select("id, version, title, content, is_active, effective_at, created_at")
    .eq("id", id)
    .single<TermsVersionRow>();

  if (!version) {
    notFound();
  }

  // Audit trail — least privilege: cuma username + waktu setuju, tidak
  // tampilkan data pribadi lain (email, dll)
  const { data: agreements } = await supabase
    .from("user_terms_agreements")
    .select("agreed_at, profiles(username)")
    .eq("terms_version_id", id)
    .order("agreed_at", { ascending: false })
    .limit(50)
    .returns<AgreementRow[]>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">
            v{version.version} — {version.title}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Effective: {formatDateTime(version.effective_at)}
          </p>
        </div>
        <span
          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
            version.is_active
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {version.is_active ? "Active" : "Archived"}
        </span>
      </div>

      {!version.is_active ? (
        <form action={activateTermsVersion}>
          <input type="hidden" name="id" value={version.id} />
          <button
            type="submit"
            className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Aktifkan Versi Ini
          </button>
        </form>
      ) : null}

      <div className="rounded-[var(--radius)] border border-gray-200 p-3">
        <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
          Isi (raw)
        </p>
        <pre className="whitespace-pre-wrap text-xs">{version.content}</pre>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
          User yang sudah menyetujui ({(agreements || []).length}
          {(agreements || []).length === 50 ? "+, menampilkan 50 terbaru" : ""})
        </p>
        <div className="flex flex-col gap-1">
          {(agreements || []).map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-[var(--radius)] border border-gray-200 px-3 py-2 text-xs"
            >
              <span>{a.profiles?.username || "Pengguna"}</span>
              <span className="text-[var(--muted-foreground)]">
                {formatDateTime(a.agreed_at)}
              </span>
            </div>
          ))}
          {(agreements || []).length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              Belum ada yang menyetujui versi ini.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
