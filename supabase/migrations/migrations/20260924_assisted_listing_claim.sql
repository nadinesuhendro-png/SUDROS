-- Taruh file ini di: supabase/migrations/20260924_assisted_listing_claim.sql
-- Jalankan lewat Supabase SQL Editor (tulis tiap statement 1 baris panjang kalau paste dari mobile browser)

-- 1. owner_id jadi boleh kosong (listing bisa dibuat sebelum pemiliknya punya akun)
alter table public.listings alter column owner_id drop not null;

-- 2. Kolom baru buat flow assisted listing
alter table public.listings add column if not exists owner_whatsapp text;
alter table public.listings add column if not exists claim_status text not null default 'claimed';
alter table public.listings add column if not exists claim_token uuid default gen_random_uuid();
alter table public.listings add column if not exists slug text;

-- 3. Listing lama (yang sudah ada owner_id) otomatis dianggap 'claimed'
update public.listings set claim_status = 'claimed' where owner_id is not null and claim_status is distinct from 'claimed';

-- 4. Constraint status hanya boleh 2 nilai
alter table public.listings drop constraint if exists listings_claim_status_check;
alter table public.listings add constraint listings_claim_status_check check (claim_status in ('unclaimed','claimed'));

-- 5. Slug harus unik (dipakai buat subdomain [slug].sudros.id)
create unique index if not exists listings_slug_unique_idx on public.listings (slug) where slug is not null;
create index if not exists listings_claim_token_idx on public.listings (claim_token) where claim_status = 'unclaimed';

-- 6. PENTING: cek constraint/RLS existing di listings jangan sampai mewajibkan owner_id NOT NULL di tempat lain
--    (mis. policy SELECT publik biasanya berbasis kolom `status`/`is_active`, bukan owner_id — pastikan listing
--    dengan owner_id NULL tetap muncul di halaman publik selama claim_status apapun & status listing = published)

