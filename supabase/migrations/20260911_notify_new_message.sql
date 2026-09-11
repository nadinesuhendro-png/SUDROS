-- PATH: supabase/migrations/20260911_notify_new_message.sql
-- AKSI: FILE BARU

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_seller_id uuid;
  v_recipient_id uuid;
  v_sender_username text;
begin
  select buyer_id, seller_id
  into v_buyer_id, v_seller_id
  from public.conversations
  where id = new.conversation_id;

  if v_buyer_id is null then
    return new;
  end if;

  v_recipient_id := case
    when new.sender_id = v_buyer_id then v_seller_id
    else v_buyer_id
  end;

  select username into v_sender_username
  from public.profiles
  where id = new.sender_id;

  insert into public.notifications (recipient_user_id, title, link, is_read)
  values (
    v_recipient_id,
    'Pesan baru dari ' || coalesce(v_sender_username, 'pengguna'),
    '/dashboard/messages/' || new.conversation_id,
    false
  );

  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;

create trigger on_message_created
  after insert on public.messages
  for each row
  execute function public.notify_new_message();

