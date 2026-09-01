// PATH: components/ListingStats.tsx
// AKSI: BUAT FILE BARU

export default function ListingStats({
  views,
  whatsappClicks,
  favorites,
}: {
  views: number;
  whatsappClicks: number;
  favorites?: number;
}) {
  return (
    <span className="text-xs text-[var(--muted-foreground)]">
      👁 {views} views • 💬 {whatsappClicks} WA clicks
      {typeof favorites === "number" ? ` • ❤ ${favorites} favorit` : ""}
    </span>
  );
}
