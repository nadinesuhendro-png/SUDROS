// PATH: components/ListingStatusBadge.tsx
// AKSI: BUAT FILE BARU

type ListingStatusInput = {
  status: string;
  ai_moderation_checked_at: string | null;
};

export default function ListingStatusBadge({
  listing,
}: {
  listing: ListingStatusInput;
}) {
  if (listing.status === "rejected") {
    return (
      <span className="inline-flex w-fit items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
        Ditolak
      </span>
    );
  }
  if (listing.status === "suspended") {
    return (
      <span className="inline-flex w-fit items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
        Ditangguhkan
      </span>
    );
  }
  if (!listing.ai_moderation_checked_at || listing.status === "pending") {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Sedang dalam peninjauan
      </span>
    );
  }
  if (listing.status === "active") {
    return (
      <span className="inline-flex w-fit items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
        Aktif
      </span>
    );
  }
  return null;
}
