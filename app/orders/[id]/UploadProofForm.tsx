// PATH: app/orders/[id]/UploadProofForm.tsx
// AKSI: BUAT FILE BARU

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitProof } from "@/app/orders/actions";

export default function UploadProofForm({ orderId }: { orderId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formEl: HTMLFormElement) {
    setSubmitting(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const formData = new FormData(formEl);
      const file = formData.get("proof") as File;

      if (!file || file.size === 0) {
        setError("Pilih file bukti transfer terlebih dahulu");
        setSubmitting(false);
        return;
      }

      const filePath = `${user.id}/${orderId}-${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(filePath);

      const submitData = new FormData();
      submitData.set("order_id", orderId);
      submitData.set("proof_url", publicUrlData.publicUrl);

      await submitProof(submitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengupload bukti");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(e.currentTarget);
      }}
      className="flex flex-col gap-2 rounded-[var(--radius)] border border-gray-200 p-4"
    >
      <label className="text-sm font-medium">Upload Bukti Transfer</label>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <input
        type="file"
        name="proof"
        accept="image/*"
        className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{ backgroundColor: "var(--primary)" }}
      >
        {submitting ? "Mengupload..." : "Kirim Bukti Transfer"}
      </button>
    </form>
  );
}
