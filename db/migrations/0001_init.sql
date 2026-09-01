-- freeaddressspot 初期スキーマ（Railway Postgres用）

-- プロフィール（Googleアカウントと1:1。認証はAuth.js JWT、ここはアプリの名簿）
create table public.profiles (
  id                uuid primary key default gen_random_uuid(),
  google_sub        text unique not null,  -- Googleのsub（開発ログインは 'dev:<email>'）
  email             text unique not null,
  display_name      text not null,
  department        text,
  avatar_url        text,
  is_admin          boolean not null default false,
  -- 在席以外のステータス（null = 通常）
  status            text check (status in ('away','meeting','remote','out')),
  status_changed_at timestamptz,
  created_at        timestamptz not null default now()
);

-- フロア（オフィス図面。画像はDB内に保持し /api/floors/[id]/image で配信）
create table public.floors (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  image_data       bytea not null,
  image_mime       text not null,
  image_updated_at timestamptz not null default now(),
  image_width      integer not null check (image_width > 0),
  image_height     integer not null check (image_height > 0),
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now()
);

-- 座席（x/y は図面画像に対する相対座標 0〜1、左上原点）
create table public.seats (
  id         uuid primary key default gen_random_uuid(),
  floor_id   uuid not null references public.floors(id) on delete cascade,
  label      text not null,
  x          numeric(7,6) not null check (x >= 0 and x <= 1),
  y          numeric(7,6) not null check (y >= 0 and y <= 1),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (floor_id, label)
);

-- 着席セッション（履歴保持型）
create table public.seat_sessions (
  id               uuid primary key default gen_random_uuid(),
  seat_id          uuid not null references public.seats(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  checked_in_at    timestamptz not null default now(),
  checked_out_at   timestamptz,
  check_out_reason text check (check_out_reason in ('manual','moved','auto_reset','takeover'))
);

-- 「1人1席・1席1人」をDBレベルで保証（アクティブ行のみ一意）
create unique index one_active_session_per_user
  on public.seat_sessions (user_id) where checked_out_at is null;
create unique index one_active_session_per_seat
  on public.seat_sessions (seat_id) where checked_out_at is null;

create index seat_sessions_checked_in_at_idx on public.seat_sessions (checked_in_at);
create index seat_sessions_seat_id_idx on public.seat_sessions (seat_id);

-- 集計用ビュー（JST基準の日付で正規化）
create view public.attendance_days as
select distinct
  (ss.checked_in_at at time zone 'Asia/Tokyo')::date as day,
  ss.user_id,
  p.display_name,
  p.department
from public.seat_sessions ss
join public.profiles p on p.id = ss.user_id;

create view public.seat_usage_days as
select distinct
  (ss.checked_in_at at time zone 'Asia/Tokyo')::date as day,
  ss.seat_id,
  s.label,
  s.floor_id,
  f.name as floor_name
from public.seat_sessions ss
join public.seats s on s.id = ss.seat_id
join public.floors f on f.id = s.floor_id;
