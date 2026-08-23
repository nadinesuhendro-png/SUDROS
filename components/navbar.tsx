import Image from "next/image";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/sudros-logo.png"
            alt="SUDROS"
            width={120}
            height={40}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-[var(--radius)] px-4 py-2 font-medium text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Daftar
          </Link>
        </nav>
      </div>
    </header>
  );
}
