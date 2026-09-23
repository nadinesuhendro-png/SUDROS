// Taruh file ini di: app/admin/quick-add/page.tsx
// FIX: dihapus query ke tabel "kota" — skema asli listings tidak punya kota_id (FK),
// lokasi disimpan sebagai teks bebas di location_city & location_area.
import { createAdminClient } from "@/lib/supabase/admin";
import QuickAddForm from "./QuickAddForm";

export default async function QuickAddPage() {
  const supabaseAdmin = createAdminClient();

  // SESUAIKAN nama kolom kategori kalau beda (id, name)
  const { data: categories } = await supabaseAdmin
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-1">Daftarkan Usaha (Quick Add)</h1>
      <p className="text-sm text-gray-500 mb-6">
        SUDROS menemukan → SUDROS mendaftarkan. Isi seadanya, foto boleh langsung dari WA/screenshot.
      </p>
      <QuickAddForm categories={categories ?? []} />
    </div>
  );
}
