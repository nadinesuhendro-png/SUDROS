// PATH: app/listings/[id]/ListingGallery.tsx
// AKSI: BUAT FILE BARU

"use client";

import Image from "next/image";
import { useState } from "react";

export default function ListingGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return null;
  }

  function showPrev() {
    setOpenIndex((current) =>
      current === null ? null : (current - 1 + images.length) % images.length
    );
  }

  function showNext() {
    setOpenIndex((current) =>
      current === null ? null : (current + 1) % images.length
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpenIndex(0)}
        className="relative aspect-square w-full overflow-hidden rounded-[var(--radius)] bg-gray-100"
      >
        <Image
          src={images[0]}
          alt={title}
          fill
          priority
          className="object-cover"
        />
      </button>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {images.slice(1).map((url, index) => (
            <button
              type="button"
              key={url}
              onClick={() => setOpenIndex(index + 1)}
              className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[var(--radius)] bg-gray-100"
            >
              <Image src={url} alt={title} fill className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {openIndex !== null ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute right-4 top-4 text-2xl text-white"
          >
            ✕
          </button>

          <span className="absolute top-4 left-4 text-sm text-white">
            {openIndex + 1} / {images.length}
          </span>

          <div
            className="relative h-[70vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[openIndex]}
              alt={title}
              fill
              className="object-contain"
            />
          </div>

          {images.length > 1 ? (
            <div
              className="absolute inset-x-0 bottom-8 flex justify-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={showPrev}
                className="rounded-full bg-white/20 px-4 py-2 text-white"
              >
                ← Sebelumnya
              </button>
              <button
                type="button"
                onClick={showNext}
                className="rounded-full bg-white/20 px-4 py-2 text-white"
              >
                Berikutnya →
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
          }
