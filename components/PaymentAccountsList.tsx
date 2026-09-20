import { createClient } from "@/lib/supabase/server";
import type { PaymentAccount } from "@/lib/payment-accounts/types";

export default async function PaymentAccountsList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_accounts")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const accounts = (data ?? []) as unknown as PaymentAccount[];

  if (accounts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-[var(--muted-foreground)]">
        Transfer ke salah satu rekening berikut, lalu unggah bukti transfer:
      </p>
      {accounts.map((acc) => (
        <div
          key={acc.id}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] p-3"
        >
          <p className="text-sm font-semibold text-[var(--card-foreground)]">
            {acc.bank_name}
          </p>
          <p className="text-base tracking-wide text-[var(--card-foreground)]">
            {acc.account_number}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            a.n. {acc.account_holder_name}
          </p>
        </div>
      ))}
    </div>
  );
}
