import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-lg font-semibold" style={{ color: "var(--primary-dark)" }}>
        Cek email kamu
      </h1>
      <p className="max-w-xs text-sm text-[var(--muted-foreground)]">
        Kami sudah kirim link konfirmasi ke email kamu. Klik link tersebut
        untuk mengaktifkan akun SUDROS.
      </p>
      <Link href="/login" className="text-sm font-medium" style={{ color: "var(--primary)" }}>
        Kembali ke halaman masuk
      </Link>
    </main>
  );
}
