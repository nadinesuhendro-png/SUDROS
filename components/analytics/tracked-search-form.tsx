// AKSI: BUAT FILE BARU
// PATH: components/analytics/tracked-search-form.tsx

"use client";

import type { ComponentProps, FormEvent } from "react";
import { track } from "@/lib/analytics/track";

export function TrackedSearchForm(props: ComponentProps<"form">) {
  return (
    <form
      {...props}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        const form = e.currentTarget;
        const q = (form.elements.namedItem("q") as HTMLInputElement | null)?.value || undefined;
        const city =
          (form.elements.namedItem("city") as HTMLInputElement | null)?.value || undefined;
        track("search_submitted", { q, city });
        // Tidak preventDefault - form tetap submit GET seperti biasa
      }}
    />
  );
}
