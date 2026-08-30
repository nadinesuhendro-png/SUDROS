// PATH: app/admin/marketing/templates/page.tsx
// AKSI: BUAT FILE BARU (list & kelola template)

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { toggleTemplateActive, deleteTemplate } from "./actions";

type TemplateRow = {
  id: string;
  name: string;
  description: string | null;
  platform: string | null;
  content_type: string | null;
  template_body: string;
  is_active: boolean;
};

export default async function TemplatesPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("marketing_templates")
    .select("id, name, description, platform, content_type, template_body, is_active")
    .order("created_at", { ascending: true })
    .returns<TemplateRow[]>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
          Templates ({(templates || []).length})
        </h2>
        <Link
          href="/admin/marketing/templates/new"
          className="rounded-[var(--radius)] px-3 py-1.5 text-xs font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          + Buat Template
        </Link>
      </div>

      {(templates || []).length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">Belum ada template.</p>
      ) : null}

      <div className="flex flex-col gap-2">
        {(templates || []).map((t) => (
          <div
            key={t.id}
            className="flex flex-col gap-2 rounded-[var(--radius)] border border-gray-200 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                {t.description ? (
                  <p className="text-xs text-[var(--muted-foreground)]">{t.description}</p>
                ) : null}
              </div>
              <form action={toggleTemplateActive}>
                <input type="hidden" name="id" value={t.id} />
                <input
                  type="hidden"
                  name="is_active"
                  value={(!t.is_active).toString()}
                />
                <button
                  type="submit"
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                    t.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {t.is_active ? "Aktif" : "Nonaktif"}
                </button>
              </form>
            </div>

            <pre className="whitespace-pre-wrap rounded-[var(--radius)] bg-gray-50 p-2 text-xs text-[var(--muted-foreground)]">
              {t.template_body}
            </pre>

            <div className="flex gap-2">
              <Link
                href={`/admin/marketing/templates/${t.id}/edit`}
                className="rounded-[var(--radius)] border border-gray-300 px-3 py-1 text-xs font-medium"
              >
                Edit
              </Link>
              <form action={deleteTemplate}>
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  className="rounded-[var(--radius)] border border-red-300 px-3 py-1 text-xs font-medium text-red-600"
                >
                  Hapus
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
