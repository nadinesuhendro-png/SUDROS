-- PATH: supabase/migrations/20260908_anchor_visit_tracking.sql
-- AKSI: BUAT FILE BARU

alter table profiles
  add column if not exists anchor_last_visit_at timestamptz;

-- Aktivitas listing sekarang HANYA dihitung saat listing BARU dibuat
-- (insert), bukan saat listing lama di-update — sesuai kebijakan
-- "tidak ada listing baru"
drop trigger if exists trg_update_anchor_last_active on listings;

create or replace function update_anchor_last_active()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
    set anchor_last_active_at = now()
    where id = NEW.owner_id and is_anchor_seller = true;
  return NEW;
end;
$$;

create trigger trg_update_anchor_last_active
  after insert on listings
  for each row
  execute function update_anchor_last_active();

-- Catat kunjungan penjual jangkar ke SUDROS, dipanggil dari dashboard
create or replace function record_anchor_visit()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
    set anchor_last_visit_at = now()
    where id = auth.uid() and is_anchor_seller = true;
end;
$$;

grant execute on function record_anchor_visit() to authenticated;

-- Kebijakan baru: nonaktif kalau SALAH SATU dari dua ini absen 3 bulan —
-- tidak ada listing baru, ATAU tidak ada kunjungan
create or replace function deactivate_inactive_anchor_sellers()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_reason text;
begin
  for v_profile in
    select p.id,
      coalesce(p.anchor_last_active_at, p.anchor_activated_at) as last_listing,
      coalesce(p.anchor_last_visit_at, p.anchor_activated_at) as last_visit
    from profiles p
    where p.is_anchor_seller = true
  loop
    if v_profile.last_listing < now() - interval '3 months'
       or v_profile.last_visit < now() - interval '3 months' then

      update profiles
        set is_anchor_seller = false
        where id = v_profile.id;

      if v_profile.last_listing < now() - interval '3 months' then
        v_reason := 'belum ada listing baru selama 3 bulan';
      else
        v_reason := 'tidak ada kunjungan ke SUDROS selama 3 bulan';
      end if;

      insert into notifications (user_id, title, message, link, is_read)
      values (
        v_profile.id,
        '⚠️ Status Penjual Jangkar dinonaktifkan',
        'Status Penjual Jangkar kamu dinonaktifkan karena ' || v_reason || '. Hubungi admin kalau ini keliru.',
        '/dashboard/package',
        false
      );
    end if;
  end loop;
end;
$$;
