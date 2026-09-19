// AKSI: BUAT FILE BARU
// PATH: lib/subdomains/reserved.ts

export const RESERVED_SUBDOMAINS = [
  "www", "admin", "api", "app", "dashboard", "mail", "ftp",
  "blog", "shop", "store", "support", "help", "static", "cdn",
  "assets", "sudros", "sellers", "listings", "pricing", "login",
  "register", "auth", "cron", "webhook", "webhooks", "test",
  "staging", "dev", "docs", "status",
];

const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

export function isValidSubdomain(value: string): boolean {
  const lower = value.toLowerCase();
  if (!SUBDOMAIN_PATTERN.test(lower)) return false;
  if (RESERVED_SUBDOMAINS.includes(lower)) return false;
  return true;
}
