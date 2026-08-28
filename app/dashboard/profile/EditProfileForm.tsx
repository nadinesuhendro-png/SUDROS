// PATH: app/dashboard/profile/EditProfileForm.tsx
// AKSI: UPDATE FILE (ganti <main> jadi <div> agar tidak dobel wrapper)

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "./actions";

type Profile = {
  username: string;
  whatsapp: string | null;
  avatar_url: string | null;
} | null;

export default function EditProfileForm({
  profile,
  errorMessage,
  successMessage,
}: {
  profile: Profile;
  errorMessage?: string;
  successMessage?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [localError, setLocalError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile?.avatar_url || null
  );

  async function handleSubmit(formEl: HTMLFormElement) {
    setSubmitting(true);
    setLocalError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const rawFormData = new FormData(formEl);
      const whatsapp = rawFormData.get("whatsapp") as string;
      const avatarFile = rawFormData.get("avatar") as File;

      let avatarUrl = profile?.avatar_url || "";

      if (avatarFile && avatarFile.size > 0) {
        setStatusText("Mengupload foto profil...");

        const filePath = `${user.id}/${Date.now()}-${avatarFile.name}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        avatarUrl = publicUrlData.publicUrl;
      }

      setStatusText("Menyimpan profil...");

      const submitData = new FormData();
      submitData.set("whatsapp", whatsapp);
      submitData.set("avatar_url", avatarUrl);

      await updateProfile(submitData);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Terjadi kesalahan tak terduga"
      );
      setSubmitting(false);
      setStatusText("");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1
        className="text-lg font-semibold text-center"
        style={{ color: "var(--primary-dark)" }}
      >
        Edit Profil
      </h1>

      {errorMessage || localError ? (
        <div className="rounded-[var(--radius)] bg-red-50 px-4 py-3 text-sm text-red-600">
          {localError || errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-[var(--radius)] bg-green-50 px-4 py-3 text-sm text-green-600">
          Profil berhasil diperbarui
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e.currentTarget);
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-100">
            {previewUrl ? (
              <Image src={previewUrl} alt="Foto profil" fill className="object-cover" />
            ) : null}
          </div>
          <label
            htmlFor="avatar"
            className="cursor-pointer text-sm font-medium"
            style={{ color: "var(--primary)" }}
          >
            Ganti Foto Profil
          </label>
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setPreviewUrl(URL.createObjectURL(file));
              }
            }}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="whatsapp">
            Nomor WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            defaultValue={profile?.whatsapp || ""}
            placeholder="Contoh: 6281234567890"
            className="w-full rounded-[var(--radius)] border border-gray-300 px-4 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Gunakan format 62 di awal, tanpa spasi atau tanda +
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--primary)" }}
        >
          {submitting ? statusText || "Menyimpan..." : "Simpan"}
        </button>
      </form>

      <Link
        href="/dashboard"
        className="text-center text-sm text-[var(--muted-foreground)] underline"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
