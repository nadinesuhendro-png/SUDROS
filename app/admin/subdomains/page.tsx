// AKSI: BUAT FILE BARU
// PATH: app/admin/subdomains/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";
import { confirmSubdomain, rejectSubdomain } from "./actions";

type Row = {
  id: string;
  subdomain: string;
  status: string;
  price: number;
  proof_image_url: string | null;
  created_at: string;
  profiles: { username: string } | null;
};

export default async function AdminSubdomainsPage() {
  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("seller_subdomains")
    .select("id, subdomain, status, price, proof_image_url, created_at, profiles(username)")
    .order("created_at", { ascending: false })
    .returns<Row[]>();

  const pending = rows?.filter((r) => r.status === "pending_payment") ?? [];
  const others = rows?.filter((r) => r.status !== "pending_payment") ?? [];

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Pengajuan Subdomain</h1>

      <h2 className="mb-2 text-sm font-semibold uppercase text-[var(--muted-foreground)]">
        Menunggu Konfirmasi ({pending.length})
      </h2>
      <div className="flex flex-col gap-3 mb-6">
        {pending.map((row) => (
          <div key={row.id} className="rounded-[var(--radius)] border border-gray-200 p-4">
            <p className="text-sm">
              <strong>{row.subdomain}.sudros.id</strong> — {row.profiles?.username ?? "Unknown"}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Rp{row.price.toLocaleString("id-ID")} • {new Date(row.created_at).toLocaleString("id-ID")}
            </p>
            {row.proof_image_url ? (
              <a
                href={row.proof_image_url}
                target="_blank"
                className="mt-1 inline-block text-xs underline"
                style={{ color: "var(--primary)" }}
              >
                Lihat bukti transfer
              </a>
            ) : null}
            <div className="mt-2 flex gap-2">
              <form action={confirmSubdomain}>
                <input type="hidden" name="id" value={row.id} />
                <button
                  type="submit"
                  className="rounded-[var(--radius)] bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                >
                  Konfirmasi
                </button>
              </form>
              <form action={rejectSubdomain}>
                <input type="hidden" name="id" value={row.id} />
                <button
                  type="submit"
                  className="rounded-[var(--radius)] bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
                >
                  Tolak
                </button>
              </form>
            </div>
          </div>
        ))}
        {pending.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Tidak ada pengajuan menunggu.</p>
        ) : null}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase text-[var(--muted-foreground)]">
        Riwayat
      </h2>
      <div className="flex flex-col gap-2">
        {others.map((row) => (
          <div key={row.id} className="rounded-[var(--radius)] border border-gray-100 p-3 text-xs">
            {row.subdomain}.sudros.id — {row.profiles?.username ?? "Unknown"} — {row.status}
          </div>
        ))}
      </div>
    </main>
  );
}
