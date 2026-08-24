import Link from "next/link";
import Image from "next/image";
import { login } from "@/app/(auth)/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <Link href="/">
        <Image
          src="/brand/sudros-logo.png"
          alt="SUDROS"
          width={140}
          height={90}
          className="h-auto w-28"
        />
      </Link>

      <div className="w-full max-w-sm rounded-[var(--radius)] border border-[var(--border)] p-6">
        <h1 className="mb-4 text-lg font-semibold" style={{ color: "var(--primary-dark)" }}>
          Masuk ke SUDROS
        </h1>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <form action={login} className="flex flex-col gap-3">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            minLength={6}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-[var(--radius)] py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Masuk
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium" style={{ color: "var(--primary)" }}>
            Daftar
          </Link>
        </p>
      </div>
    </main>
  );
}
