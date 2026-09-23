// Taruh file ini di: app/admin/quick-add/QuickAddForm.tsx
// FIX: field "Alamat" (1 field) diganti jadi "Kota" + "Area/Detail Lokasi" (2 field teks bebas)
// sesuai skema asli listings (location_city, location_area) — bukan dropdown kota.
"use client";

import { useState, useTransition } from "react";
import { createAssistedListing, type QuickAddResult } from "./actions";

type Option = { id: string; name: string };

export default function QuickAddForm({ categories }: { categories: Option[] }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<QuickAddResult | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setResult(null);
    setCopied(false);
    startTransition(async () => {
      const res = await createAssistedListing(formData);
      setResult(res);
    });
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nama Usaha *</label>
          <input name="nama_usaha" required className="w-full border rounded px-3 py-2" placeholder="Jagung Bakar Mas Wisnu" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">No. WhatsApp *</label>
          <input name="whatsapp" required className="w-full border rounded px-3 py-2" placeholder="628xxxxxxxxxx" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Kota *</label>
            <input name="location_city" required className="w-full border rounded px-3 py-2" placeholder="Medan" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Area/Detail Lokasi</label>
            <input name="location_area" className="w-full border rounded px-3 py-2" placeholder="Indrapura" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Kategori *</label>
          <select name="category_id" required className="w-full border rounded px-3 py-2">
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Harga (Rp, opsional)</label>
          <input name="price" type="number" min="0" className="w-full border rounded px-3 py-2" placeholder="Kosongkan kalau nego/hubungi WA" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Foto Produk</label>
          <input type="file" name="photos" accept="image/*" multiple className="w-full" />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#1d6fb8] text-white rounded px-4 py-2 font-medium disabled:opacity-50"
        >
          {isPending ? "Memproses..." : "Buat Listing"}
        </button>
      </form>

      {result && !result.success && (
        <div className="border border-red-300 bg-red-50 text-red-700 rounded p-3 text-sm">
          {result.error}
        </div>
      )}

      {result && result.success && (
        <div className="border border-green-300 bg-green-50 rounded p-4 space-y-2">
          <p className="text-sm text-green-800 font-medium">Listing berhasil dibuat 🎉</p>
          <p className="text-sm">
            Link etalase: <span className="font-mono">https://{result.slug}.sudros.id</span>
          </p>
          <div className="flex items-center gap-2">
            <input readOnly value={result.claimLink} className="flex-1 border rounded px-2 py-1 text-sm font-mono" />
            <button
              type="button"
              onClick={() => copyLink(result.claimLink)}
              className="text-sm bg-gray-800 text-white px-3 py-1 rounded"
            >
              {copied ? "Tersalin!" : "Salin"}
            </button>
          </div>
          <p className="text-xs text-gray-500">Kirim link klaim ini ke WA pemilik usaha.</p>
        </div>
      )}
    </div>
  );
}
