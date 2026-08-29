// PATH: app/admin/marketing/content/[id]/edit/page.tsx
// AKSI: BUAT FILE BARU

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateContent } from "../../../actions";

type ContentEdit = {
  id: string;
  platform: string;
  headline: string | null;
  hook: string | null;
  caption: string | null;
  short_copy: string | null;
  video_script: string | null;
  cta: string | null;
  hashtags: string[];
  status: string;
  listings: { title: string } | null;
};

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: content } = await supabase
    .from("marketing_contents")
    .select(
      "id, platform, headline, hook, caption, short_copy, video_script, cta, hashtags, status, listings(title)"
    )
    .eq("id", id)
    .maybeSingle<ContentEdit>();

  if (!content) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
        Edit Content: {content.listings?.title || "-"}
      </h2>

      <form action={updateContent} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={content.id} />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Headline</label>
          <input
            type="text"
            name="headline"
            defaultValue={content.headline || ""}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Hook</label>
          <input
            type="text"
            name="hook"
            defaultValue={content.hook || ""}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Caption</label>
          <textarea
            name="caption"
            rows={4}
            defaultValue={content.caption || ""}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Pesan WhatsApp (short copy)</label>
          <textarea
            name="short_copy"
            rows={4}
            defaultValue={content.short_copy || ""}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Video Script</label>
          <textarea
            name="video_script"
            rows={4}
            defaultValue={content.video_script || ""}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">CTA</label>
          <input
            type="text"
            name="cta"
            defaultValue={content.cta || ""}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Hashtags (pisahkan dengan koma)</label>
          <input
            type="text"
            name="hashtags"
            defaultValue={(content.hashtags || []).join(", ")}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
            placeholder="sudros, jualbeli, medan"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Status</label>
          <select
            name="status"
            defaultValue={content.status}
            className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
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
