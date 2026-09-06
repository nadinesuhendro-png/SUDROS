-- PATH: supabase/migrations/20260908_anchor_visit_tracking.sql
-- AKSI: BUAT FILE BARU

alter table profiles
  add column if not exists anchor_last_visit_at timestamptz;

-- PERBAIKAN BUG: redeem_anchor_invite() di migration sebelumnya salah
-- pakai kolom user_id, seharusnya recipient_user_id
create or replace function redeem_anchor_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite anchor_invites%rowtype;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'reason', 'not_logged_in');
  end if;

  select * into v_invite
  from anchor_invites
  where token = p_token
  for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'invalid');
  end if;

  if v_invite.used_at is not null then
    return jsonb_build_object('success', false, 'reason', 'used');
  end if;

  if v_invite.expires_at < now() then
    return jsonb_build_object('success', false, 'reason', 'expired');
  end if;

  update anchor_invites
    set used_by = v_user_id, used_at = now()
    where id = v_invite.id;

  update profiles
    set is_anchor_seller = true,
        anchor_activated_at = now(),
        anchor_last_active_at = now(),
        anchor_last_visit_at = now()
    where id = v_user_id;

  insert into notifications (recipient_user_id, title, message, link, is_read)
  values (
    v_user_id,
    '🎉 Kamu resmi jadi Penjual Jangkar',
    'Selamat! Akun kamu sekarang punya listing tanpa batas dan gratis biaya paket sebagai Penjual Jangkar SUDROS.',
    '/dashboard/package',
    false
  );

  return jsonb_build_object('success', true);
end;
$$;

-- Aktivitas listing HANYA dihitung saat listing BARU dibuat (insert),
-- bukan update
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

-- Catat kunjungan penjual jangkar ke SUDROS
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

-- Kebijakan nonaktif: butuh DUA-DUANYA aktif (listing baru DAN kunjungan)
-- dalam 3 bulan — salah satu absen -> nonaktifkan. Juga perbaikan bug
-- recipient_user_id di sini
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

      insert into notifications (recipient_user_id, title, message, link, is_read)
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
