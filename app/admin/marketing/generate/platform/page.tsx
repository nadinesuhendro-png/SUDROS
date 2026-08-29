// PATH: app/admin/marketing/generate/platform/page.tsx
// AKSI: BUAT FILE BARU (generate content untuk promosi SUDROS sebagai platform, bukan listing tertentu)

import { generatePlatformContentAction } from "../../actions";

const platforms = [
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "facebook", label: "Facebook", icon: "👍" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "whatsapp", label: "WhatsApp", icon: "💬" },
  { value: "general", label: "Umum", icon: "📝" },
] as const;

export default function GeneratePlatformPromotionPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
        Promosikan Platform SUDROS
      </h2>
      <p className="text-xs text-[var(--muted-foreground)]">
        Konten ini mengajak orang mengenal & mendaftar SUDROS secara umum — bukan
        mempromosikan listing tertentu.
      </p>

      <form action={generatePlatformContentAction} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          {platforms.map((p) => (
            <label
              key={p.value}
              className="flex cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-gray-300 p-3 text-sm has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50"
            >
              <input
                type="radio"
                name="platform"
                value={p.value}
                defaultChecked={p.value === "instagram"}
                className="h-4 w-4"
              />
              <span>{p.icon}</span>
              <span className="font-medium">{p.label}</span>
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          ✨ Generate Content
        </button>
        <p className="text-center text-xs text-[var(--muted-foreground)]">
          AI akan dicoba dulu — kalau tidak tersedia, konten template otomatis dibuat.
        </p>
      </form>
    </div>
  );
}

