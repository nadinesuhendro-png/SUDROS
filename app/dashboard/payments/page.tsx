// PATH: app/dashboard/payments/page.tsx
// AKSI: UPDATE FILE (auth check dipindah ke layout.tsx, jadi tidak dobel)

import { createClient } from "@/lib/supabase/server";

type OrderRow = {
  id: string;
  order_number: string;
  amount: number;
  payment_status: string;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
  advertising_packages: { name: string } | null;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const statusLabel: Record<string, string> = {
  pending: "Menunggu Pembayaran",
  paid: "Dibayar",
  failed: "Gagal",
  expired: "Kedaluwarsa",
  cancelled: "Dibatalkan",
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-700",
  cancelled: "bg-gray-100 text-gray-700",
};

export default async function PaymentHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("advertising_orders")
    .select(
      "id, order_number, amount, payment_status, paid_at, expires_at, created_at, advertising_packages(name)"
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  const { data: activePackage } = await supabase
    .from("user_active_packages")
    .select("expires_at, advertising_packages(name)")
    .eq("user_id", user!.id)
    .eq("is_active", true)
    .gte("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ expires_at: string; advertising_packages: { name: string } | null }>();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold" style={{ color: "var(--primary-dark)" }}>
        Riwayat Pembayaran
      </h1>

      {activePackage ? (
        <div className="rounded-[var(--radius)] bg-green-50 p-4 text-sm">
          <p className="font-medium">
            Paket aktif: {activePackage.advertising_packages?.name}
          </p>
          <p className="text-[var(--muted-foreground)]">
            Berlaku sampai {formatDate(activePackage.expires_at)}
          </p>
        </div>
      ) : (
        <div className="rounded-[var(--radius)] bg-gray-50 p-4 text-sm text-[var(--muted-foreground)]">
          Belum ada paket berbayar aktif. Masih menggunakan paket Free.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {(orders || []).length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Belum ada riwayat order.
          </p>
        ) : null}

        {(orders || []).map((order) => (
          <div
            key={order.id}
            className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium">#{order.order_number}</p>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  statusColor[order.payment_status] || "bg-gray-100 text-gray-700"
                }`}
              >
                {statusLabel[order.payment_status] || order.payment_status}
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              {order.advertising_packages?.name} • {formatPrice(order.amount)}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Dibuat: {formatDate(order.created_at)}
            </p>
            {order.paid_at ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                Dibayar: {formatDate(order.paid_at)}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </main>
  );
}
