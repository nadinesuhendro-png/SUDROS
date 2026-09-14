-- 1. Notifications: user boleh hapus notifikasi miliknya sendiri
create policy "Users can delete own notifications"
  on notifications for delete
  using (auth.uid() = recipient_user_id);

-- 2. Feedback: soft-delete (bukan hard delete) supaya audit trail tetap ada
alter table feedback add column if not exists is_deleted boolean not null default false;

-- 3. Conversations: flag hide per-partisipan (bukan langsung hapus baris)
alter table conversations add column if not exists deleted_by_buyer boolean not null default false;
alter table conversations add column if not exists deleted_by_seller boolean not null default false;

-- 4. RPC: sembunyikan percakapan buat user yang memanggil.
--    Kalau kedua pihak (buyer & seller) sudah sama-sama hapus, baris beneran dihapus.
create or replace function hide_conversation_for_user(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_seller_id uuid;
  v_deleted_by_buyer boolean;
  v_deleted_by_seller boolean;
begin
  select buyer_id, seller_id, deleted_by_buyer, deleted_by_seller
    into v_buyer_id, v_seller_id, v_deleted_by_buyer, v_deleted_by_seller
    from conversations
    where id = p_conversation_id;

  if v_buyer_id is null then
    return;
  end if;

  if auth.uid() = v_buyer_id then
    v_deleted_by_buyer := true;
  elsif auth.uid() = v_seller_id then
    v_deleted_by_seller := true;
  else
    raise exception 'not a participant of this conversation';
  end if;

  if v_deleted_by_buyer and v_deleted_by_seller then
    delete from conversations where id = p_conversation_id;
  else
    update conversations
      set deleted_by_buyer = v_deleted_by_buyer,
          deleted_by_seller = v_deleted_by_seller
      where id = p_conversation_id;
  end if;
end;
$$;

-- 5. RPC: sembunyikan SEMUA percakapan milik user yang memanggil
create or replace function hide_all_conversations_for_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv record;
begin
  for v_conv in
    select id from conversations
    where (buyer_id = auth.uid() and deleted_by_buyer = false)
       or (seller_id = auth.uid() and deleted_by_seller = false)
  loop
    perform hide_conversation_for_user(v_conv.id);
  end loop;
end;
$$;

grant execute on function hide_conversation_for_user(uuid) to authenticated;
grant execute on function hide_all_conversations_for_user() to authenticated;
