-- PATH: supabase/migrations/20260913_fix_listings_status_check.sql
-- AKSI: JALANKAN DI SUPABASE SQL EDITOR (lalu simpan juga sebagai file migration di repo)
-- FIX: constraint lama cuma izinkan 'active','sold','inactive' — padahal seluruh alur moderasi
-- admin (approve/suspend/reject) dan status 'pending' baru sudah lama pakai nilai
-- 'active','pending','rejected','suspended'. Constraint diperluas (union), tidak ada nilai lama yang dihapus.

alter table public.listings
  drop constraint listings_status_check;

alter table public.listings
  add constraint listings_status_check
  check (status = any (array[
    'active'::text,
    'pending'::text,
    'rejected'::text,
    'suspended'::text,
    'sold'::text,
    'inactive'::text
  ]));

