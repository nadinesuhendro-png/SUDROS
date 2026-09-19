// AKSI: BUAT FILE BARU
// PATH: app/dashboard/subdomain/page.tsx

import { createClient } from "@/lib/supabase/server";
import SubdomainRequestForm from "./SubdomainRequestForm";

type SubdomainRow = {
  subdomain: string;
  status: string;
  expires_at: string | null;
};

export default async function SubdomainPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: current } = await supabase
    .from("seller_subdomains")
    .select("subdomain, status, expires_at")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubdomainRow>();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Subdomain Toko</h1>

      {current ? (
        <div className="rounded-[var(--radius)] border border-gray-200 p-4 text-sm">
          <p>
            Subdomain: <strong>{current.subdomain}.sudros.id</strong>
          </p>
          <p className="mt-1">
            Status:{" "}
            {current.status === "active"
              ? `Aktif sampai ${current.expires_at ? new Date(current.expires_at).toLocaleDateString("id-ID") : "-"}`
              : current.status === "pending_payment"
              ? "Menunggu konfirmasi admin"
              : current.status === "rejected"
              ? "Ditolak — ajukan ulang di bawah"
              : "Kedaluwarsa — ajukan ulang untuk perpanjang"}
          </p>
        </div>
      ) : null}

      {!current || current.status === "rejected" || current.status === "expired" ? (
        <SubdomainRequestForm />
      ) : null}
    </main>
  );
}
