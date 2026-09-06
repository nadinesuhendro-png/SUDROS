-- PATH: supabase/migrations/20260907_anchor_sellers.sql
-- AKSI: BUAT FILE BARU

alter table profiles
  add column if not exists is_anchor_seller boolean not null default false,
  add column if not exists anchor_activated_at timestamptz,
  add column if not exists anchor_last_active_at timestamptz;

create table if not exists anchor_invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  created_by uuid not null references profiles(id) on delete cascade,
  used_by uuid references profiles(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

alter table anchor_invites enable row level security;

create policy "admin_manage_anchor_invites"
  on anchor_invites
  for all
  using (is_admin())
  with check (is_admin());

-- Redeem undangan, dipanggil user biasa yang sudah login via RPC
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
        anchor_last_active_at = now()
    where id = v_user_id;

  insert into notifications (user_id, title, message, link, is_read)
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

-- Catat aktivitas terakhir setiap kali penjual jangkar bikin/update listing
create or replace function update_anchor_last_active()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
    set anchor_last_active_at = now()
    where id = NEW.user_id and is_anchor_seller = true;
  return NEW;
end;
$$;

drop trigger if exists trg_update_anchor_last_active on listings;
create trigger trg_update_anchor_last_active
  after insert or update on listings
  for each row
  execute function update_anchor_last_active();

-- Nonaktifkan otomatis: tidak ada listing ATAU tidak aktif 3 bulan (OR, bukan AND)
create or replace function deactivate_inactive_anchor_sellers()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
begin
  for v_profile in
    select p.id
    from profiles p
    where p.is_anchor_seller = true
      and (
        not exists (select 1 from listings l where l.user_id = p.id)
        or coalesce(p.anchor_last_active_at, p.anchor_activated_at) < now() - interval '3 months'
      )
  loop
    update profiles
      set is_anchor_seller = false
      where id = v_profile.id;

    insert into notifications (user_id, title, message, link, is_read)
    values (
      v_profile.id,
      '⚠️ Status Penjual Jangkar dinonaktifkan',
      'Status Penjual Jangkar kamu dinonaktifkan karena belum ada listing atau tidak ada aktivitas selama 3 bulan. Hubungi admin kalau ini keliru.',
      '/dashboard/package',
      false
    );
  end loop;
end;
$$;
