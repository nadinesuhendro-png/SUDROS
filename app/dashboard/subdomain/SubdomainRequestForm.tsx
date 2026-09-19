// AKSI: BUAT FILE BARU
// PATH: app/dashboard/subdomain/SubdomainRequestForm.tsx

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { requestSubdomain } from "./actions";

export default function SubdomainRequestForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

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
      const subdomain = String(formData.get("subdomain") || "").trim().toLowerCase();
      const file = formData.get("proof") as File;

      if (!subdomain) {
        setError("Isi nama subdomain yang diinginkan");
        setSubmitting(false);
        return;
      }
      if (!file || file.size === 0) {
        setError("Pilih file bukti transfer terlebih dahulu");
        setSubmitting(false);
        return;
      }

      const filePath = `${user.id}/subdomain-${Date.now()}-${file.name}`;

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
      submitData.set("subdomain", subdomain);
      submitData.set("proof_url", publicUrlData.publicUrl);

      const result = await requestSubdomain({}, submitData);
      if (result.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim pengajuan");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-[var(--radius)] border border-gray-200 p-4 text-sm">
        Pengajuan subdomain terkirim. Menunggu konfirmasi admin (biasanya diproses dalam 1x24 jam).
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(e.currentTarget);
      }}
      className="flex flex-col gap-3 rounded-[var(--radius)] border border-gray-200 p-4"
    >
      <div>
        <label className="text-sm font-medium">Nama Subdomain</label>
        <div className="mt-1 flex items-center gap-1">
          <input
            type="text"
            name="subdomain"
            placeholder="namatoko"
            className="w-full rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
          />
          <span className="text-sm text-[var(--muted-foreground)]">.sudros.id</span>
        </div>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          3-30 karakter, huruf/angka/strip. Rp50.000 / 30 hari.
        </p>
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <div>
        <label className="text-sm font-medium">Upload Bukti Transfer</label>
        <input
          type="file"
          name="proof"
          accept="image/*"
          className="mt-1 w-full rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{ backgroundColor: "var(--primary)" }}
      >
        {submitting ? "Mengirim..." : "Ajukan Subdomain"}
      </button>
    </form>
  );
}
