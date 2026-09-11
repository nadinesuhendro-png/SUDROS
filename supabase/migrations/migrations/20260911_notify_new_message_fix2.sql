-- PATH: supabase/migrations/20260911_notify_new_message_fix2.sql
-- AKSI: FILE BARU (perbaikan sebenarnya: kolom asli notifications adalah type/title/message/reference_type/reference_id, BUKAN "link")

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

    insert into public.notifications (
      recipient_user_id, type, title, message, reference_type, reference_id, is_read
    )
    values (
      v_recipient_id,
      'new_message',
      'Pesan baru dari ' || coalesce(v_sender_username, 'pengguna'),
      new.content,
      'conversation',
      new.conversation_id,
      false
    );
  exception when others then
    raise warning 'notify_new_message gagal: %', sqlerrm;
  end;

  return new;
end;
$$;

