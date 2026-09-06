// PATH: app/admin/anchor/page.tsx
// AKSI: BUAT FILE BARU

import { createClient } from "@/lib/supabase/server";
import { createAnchorInvite, upgradeUserToAnchor, revokeAnchor } from "./actions";

const BASE_URL = "https://sudros-chi.vercel.app";

export default async function AnchorAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ generated?: string; error?: string; upgraded?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: anchors } = await supabase
    .from("profiles")
    .select("id, whatsapp, is_anchor_seller, anchor_activated_at, anchor_last_active_at")
    .eq("is_anchor_seller", true)
    .order("anchor_activated_at", { ascending: false });

  const { data: pendingInvites } = await supabase
    .from("anchor_invites")
    .select("id, token, expires_at, created_at")
    .is("used_by", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Penjual Jangkar</h1>

      {params.generated && (
        <div className="border border-gray-200 rounded p-3 bg-blue-50 text-sm break-all">
          Link undangan baru: <strong>{BASE_URL}/join-anchor/{params.generated}</strong>
        </div>
      )}
      {params.upgraded && (
        <div className="border border-gray-200 rounded p-3 bg-green-50 text-sm">
          User berhasil diupgrade jadi Penjual Jangkar.
        </div>
      )}
      {params.error && (
        <div className="border border-gray-200 rounded p-3 bg-red-50 text-sm">
          Gagal: {params.error}
        </div>
      )}

      <section className="border border-gray-200 rounded p-4 space-y-3">
        <h2 className="font-medium">Buat Link Undangan</h2>
        <form action={createAnchorInvite}>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white text-sm">
            Generate Link Undangan (berlaku 7 hari)
          </button>
        </form>

        {pendingInvites && pendingInvites.length > 0 && (
          <ul className="text-sm space-y-1 pt-2">
            {pendingInvites.map((inv) => (
              <li key={inv.id} className="break-all text-gray-600">
                {BASE_URL}/join-anchor/{inv.token} — kedaluwarsa{" "}
                {new Date(inv.expires_at).toLocaleDateString("id-ID")}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border border-gray-200 rounded p-4 space-y-3">
        <h2 className="font-medium">Upgrade Langsung User Existing</h2>
        <form action={upgradeUserToAnchor} className="flex gap-2">
          <input
            type="text"
            name="query"
            placeholder="User ID atau No. WhatsApp"
            className="border border-gray-300 rounded px-3 py-2 text-sm flex-1"
          />
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white text-sm">
            Upgrade
          </button>
        </form>
      </section>

      <section className="border border-gray-200 rounded p-4">
        <h2 className="font-medium mb-3">Daftar Penjual Jangkar Aktif ({anchors?.length ?? 0})</h2>
        <div className="space-y-2">
          {anchors?.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
              <div>
                <div className="font-medium">{a.whatsapp ?? a.id}</div>
                <div className="text-gray-500 text-xs">
                  Aktif sejak {a.anchor_activated_at ? new Date(a.anchor_activated_at).toLocaleDateString("id-ID") : "-"}
                  {" · "}
                  Terakhir aktif {a.anchor_last_active_at ? new Date(a.anchor_last_active_at).toLocaleDateString("id-ID") : "-"}
                </div>
              </div>
              <form action={revokeAnchor}>
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="text-red-600 text-xs underline">
                  Cabut Status
                </button>
              </form>
            </div>
          ))}
          {(!anchors || anchors.length === 0) && (
            <p className="text-sm text-gray-500">Belum ada Penjual Jangkar aktif.</p>
          )}
        </div>
      </section>
    </div>
  );
}
