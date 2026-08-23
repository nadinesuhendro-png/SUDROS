import Image from "next/image";
import { Navbar } from "@/components/navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-4 p-6 text-center">
        <Image
          src="/brand/sudros-logo.png"
          alt="SUDROS"
          width={220}
          height={140}
          priority
          className="h-auto w-48"
        />
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--primary-dark)" }}
        >
          Temukan. Tawarkan. Terhubung.
        </h1>
        <p className="max-w-xs text-[var(--muted-foreground)]">
          Platform listing lokal untuk properti, kendaraan, elektronik,
          barang, dan jasa.
        </p>
      </main>
    </>
  );
}
