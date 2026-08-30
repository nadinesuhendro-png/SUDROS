// PATH: app/admin/marketing/templates/[id]/edit/page.tsx
// AKSI: BUAT FILE BARU

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateTemplate } from "../../actions";

type TemplateEdit = {
  id: string;
  name: string;
  description: string | null;
  platform: string | null;
  content_type: string | null;
  template_body: string;
};

export default async function EditTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("marketing_templates")
    .select("id, name, description, platform, content_type, template_body")
    .eq("id", id)
    .maybeSingle<TemplateEdit>();

  if (!template) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
        Edit Template
      </h2>

      {error ? (
        <p className="text-sm text-red-600">Nama dan isi template wajib diisi.</p>
      ) : null}

      <form action={updateTemplate} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={template.id} />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Nama Template</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={template.name}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Deskripsi</label>
          <input
            type="text"
            name="description"
            defaultValue={template.description || ""}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium">Platform (opsional)</label>
            <select
              name="platform"
              defaultValue={template.platform || ""}
              className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Semua platform</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="tiktok">TikTok</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="general">Umum</option>
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium">Content Type (opsional)</label>
            <input
              type="text"
              name="content_type"
              defaultValue={template.content_type || ""}
              className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Isi Template</label>
          <textarea
            name="template_body"
            rows={6}
            required
            defaultValue={template.template_body}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm font-mono"
          />
        </div>

        <button
          type="submit"
          className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
}
