-- チェックイン / 退席 RPC（整合性の核。クライアントは直接テーブルに書けない）

create or replace function public.check_in(p_seat_id uuid, p_force boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_seat     record;
  v_occupant record;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select s.id, s.is_active into v_seat
    from public.seats s where s.id = p_seat_id;
  if not found or not v_seat.is_active then
    return jsonb_build_object('status', 'invalid_seat');
  end if;

  -- 対象席のアクティブセッションを行ロックで直列化
  select ss.id, ss.user_id, p.display_name
    into v_occupant
    from public.seat_sessions ss
    join public.profiles p on p.id = ss.user_id
    where ss.seat_id = p_seat_id and ss.checked_out_at is null
    for update of ss;

  if found and v_occupant.user_id = v_uid then
    -- 同じ席の再タップは冪等
    return jsonb_build_object('status', 'already_here');
  end if;

  if found then
    if not p_force then
      return jsonb_build_object('status', 'occupied',
                                'occupant', v_occupant.display_name);
    end if;
    -- 前の利用者がタップせず離れた場合の救済（強制着席）
    update public.seat_sessions
      set checked_out_at = now(), check_out_reason = 'takeover'
      where id = v_occupant.id;
  end if;

  -- 自分の既存着席は「移動」としてクローズ
  update public.seat_sessions
    set checked_out_at = now(), check_out_reason = 'moved'
    where user_id = v_uid and checked_out_at is null;

  insert into public.seat_sessions (seat_id, user_id) values (p_seat_id, v_uid);

  -- 着席したら在宅/外出等のステータスは解除
  update public.profiles
    set status = null, status_changed_at = now()
    where id = v_uid and status is not null;

  return jsonb_build_object('status', 'ok');
exception when unique_violation then
  -- 同時タップの敗者
  return jsonb_build_object('status', 'conflict');
end;
$$;

create or replace function public.check_out()
returns void
language sql
security definer
set search_path = public
as $$
  update public.seat_sessions
    set checked_out_at = now(), check_out_reason = 'manual'
    where user_id = auth.uid() and checked_out_at is null;
$$;

revoke execute on function public.check_in(uuid, boolean) from anon, public;
revoke execute on function public.check_out() from anon, public;
grant execute on function public.check_in(uuid, boolean) to authenticated;
grant execute on function public.check_out() to authenticated;
