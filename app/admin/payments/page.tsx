// PATH: app/admin/payments/page.tsx
// AKSI: UPDATE FILE (auth check & AdminNav dipindah ke layout.tsx, jadi tidak dobel)

import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { confirmPaymentAction, rejectPaymentAction } from "./actions";

type OrderRow = {
  id: string;
  order_number: string;
  amount: number;
  payment_status: string;
  proof_url: string | null;
  created_at: string;
  profiles: { username: string } | null;
  advertising_packages: { name: string } | null;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("advertising_orders")
    .select(
      "id, order_number, amount, payment_status, proof_url, created_at, profiles(username), advertising_packages(name)"
    )
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-[var(--muted-foreground)]">
        Payments ({(orders || []).length})
      </h2>

      {(orders || []).length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Belum ada order.
        </p>
      ) : null}

      {(orders || []).map((order) => (
        <div
          key={order.id}
          className="flex flex-col gap-2 rounded-[var(--radius)] border border-gray-200 p-3 text-sm"
        >
          <div className="flex items-center justify-between">
            <p className="font-medium">#{order.order_number}</p>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                order.payment_status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : order.payment_status === "paid"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {order.payment_status}
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {order.profiles?.username || "-"} • {order.advertising_packages?.name} •{" "}
            {formatPrice(order.amount)}
          </p>

          {order.proof_url ? (
            <a href={order.proof_url} target="_blank" rel="noopener noreferrer">
              <div className="relative h-32 w-32 overflow-hidden rounded-[var(--radius)] bg-gray-100">
                <Image
                  src={order.proof_url}
                  alt="Bukti transfer"
                  fill
                  className="object-cover"
                />
              </div>
            </a>
          ) : (
            <p className="text-xs text-[var(--muted-foreground)]">
              Belum ada bukti transfer
            </p>
          )}

          {order.payment_status === "pending" ? (
            <div className="flex gap-2">
              <form action={confirmPaymentAction}>
                <input type="hidden" name="order_id" value={order.id} />
                <button
                  type="submit"
                  className="rounded-[var(--radius)] border border-green-300 px-3 py-1 text-xs font-medium text-green-700"
                >
                  Konfirmasi Pembayaran
                </button>
              </form>
              <form action={rejectPaymentAction} className="flex gap-1">
                <input type="hidden" name="order_id" value={order.id} />
                <input
                  type="text"
                  name="reason"
                  placeholder="Alasan tolak"
                  required
                  className="rounded-[var(--radius)] border border-gray-300 px-2 py-1 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-[var(--radius)] border border-red-300 px-3 py-1 text-xs font-medium text-red-600"
                >
                  Tolak
                </button>
              </form>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
