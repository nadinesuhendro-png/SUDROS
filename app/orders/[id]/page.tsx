// PATH: app/orders/[id]/page.tsx
// AKSI: BUAT FILE BARU

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UploadProofForm from "./UploadProofForm";

type OrderDetail = {
  id: string;
  order_number: string;
  amount: number;
  payment_status: string;
  proof_url: string | null;
  paid_at: string | null;
  expires_at: string | null;
  payment_deadline: string;
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

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: order } = await supabase
    .from("advertising_orders")
    .select(
      "id, order_number, amount, payment_status, proof_url, paid_at, expires_at, payment_deadline, advertising_packages(name)"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single<OrderDetail>();

  if (!order) {
    notFound();
  }

  const { data: bankSettings } = await supabase
    .from("admin_settings")
    .select("key, value")
    .in("key", ["bank_name", "bank_account_number", "bank_account_holder"]);

  const bankMap = Object.fromEntries(
    (bankSettings || []).map((s) => [s.key, s.value])
  );

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold" style={{ color: "var(--primary-dark)" }}>
        Order #{order.order_number}
      </h1>

      <div className="rounded-[var(--radius)] border border-gray-200 p-4 text-sm">
        <p>Paket: {order.advertising_packages?.name}</p>
        <p>Jumlah: {formatPrice(order.amount)}</p>
        <p>
          Status:{" "}
          <span className="font-medium">
            {statusLabel[order.payment_status] || order.payment_status}
          </span>
        </p>
        {order.paid_at ? <p>Dibayar: {formatDate(order.paid_at)}</p> : null}
        {order.expires_at ? (
          <p>Berlaku sampai: {formatDate(order.expires_at)}</p>
        ) : null}
      </div>

      {order.payment_status === "pending" ? (
        <>
          <div className="rounded-[var(--radius)] bg-yellow-50 p-4 text-sm">
            <p className="mb-2 font-medium">Instruksi Pembayaran</p>
            <p>Bank: {bankMap.bank_name}</p>
            <p>No. Rekening: {bankMap.bank_account_number}</p>
            <p>Atas Nama: {bankMap.bank_account_holder}</p>
            <p className="mt-2">Nominal: {formatPrice(order.amount)}</p>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Batas waktu: {formatDate(order.payment_deadline)}
            </p>
          </div>

          {order.proof_url ? (
            <p className="rounded-[var(--radius)] bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Bukti transfer sudah dikirim. Menunggu verifikasi admin.
            </p>
          ) : (
            <UploadProofForm orderId={order.id} />
          )}
        </>
      ) : null}
    </main>
  );
            }
