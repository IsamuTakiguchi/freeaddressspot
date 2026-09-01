-- 集計用ビュー（JST基準の日付で正規化。security_invoker で元テーブルのRLSを適用）

-- 出社ファクト: 誰がどの日に出社（チェックイン）したか
create view public.attendance_days
  with (security_invoker = true) as
select distinct
  (ss.checked_in_at at time zone 'Asia/Tokyo')::date as day,
  ss.user_id,
  p.display_name,
  p.department
from public.seat_sessions ss
join public.profiles p on p.id = ss.user_id;

-- 座席利用ファクト: どの席がどの日に使われたか
create view public.seat_usage_days
  with (security_invoker = true) as
select distinct
  (ss.checked_in_at at time zone 'Asia/Tokyo')::date as day,
  ss.seat_id,
  s.label,
  s.floor_id,
  f.name as floor_name
from public.seat_sessions ss
join public.seats s on s.id = ss.seat_id
join public.floors f on f.id = s.floor_id;
