-- PATH: supabase/migrations/20260911_fix_message_timestamps.sql
-- AKSI: FILE BARU (perbaikan: kolom waktu pesan bukan timestamptz, jam jadi salah 7 jam / selisih WIB)

-- Ubah messages.created_at jadi timestamptz, asumsikan data lama disimpan dalam UTC
alter table public.messages
  alter column created_at type timestamptz
  using created_at at time zone 'UTC';

-- Ubah conversations.last_message_at jadi timestamptz juga (kalau ada & masih bertipe lama)
alter table public.conversations
  alter column last_message_at type timestamptz
  using last_message_at at time zone 'UTC';

alter table public.conversations
  alter column created_at type timestamptz
  using created_at at time zone 'UTC';
