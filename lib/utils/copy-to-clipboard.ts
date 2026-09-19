// AKSI: BUAT FILE BARU
// PATH: lib/utils/copy-to-clipboard.ts

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      document.hasFocus()
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Lanjut ke fallback di bawah
  }

  // Fallback: textarea sementara + execCommand (browser lama / fokus hilang)
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
