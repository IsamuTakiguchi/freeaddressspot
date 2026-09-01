-- フリーアドレス座席管理: 基本テーブル

-- アプリ設定（許可メールドメイン等）
create table public.app_settings (
  key   text primary key,
  value text not null
);

-- 許可するメールドメイン（'*' で全ドメイン許可）。導入時に自社ドメインへ変更すること
insert into public.app_settings (key, value) values ('allowed_email_domain', '*');

-- フロア（オフィス図面）
create table public.floors (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  -- Storage上のパス（例: 'abc.png'）。'/' や 'http' 始まりはそのままURLとして扱う（seed用）
  image_path   text not null,
  image_width  integer not null check (image_width > 0),
  image_height integer not null check (image_height > 0),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- 座席
create table public.seats (
  id         uuid primary key default gen_random_uuid(),
  floor_id   uuid not null references public.floors(id) on delete cascade,
  label      text not null,
  -- 図面画像に対する相対座標（左上原点、0〜1）
  x          numeric(7,6) not null check (x >= 0 and x <= 1),
  y          numeric(7,6) not null check (y >= 0 and y <= 1),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (floor_id, label)
);

-- プロフィール（auth.users と 1:1）
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  display_name      text not null,
  department        text,
  avatar_url        text,
  is_admin          boolean not null default false,
  -- 在席以外のステータス（null = 通常）
  status            text check (status in ('away','meeting','remote','out')),
  status_changed_at timestamptz,
  created_at        timestamptz not null default now()
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

-- 集計・履歴参照用
create index seat_sessions_checked_in_at_idx on public.seat_sessions (checked_in_at);
create index seat_sessions_seat_id_idx on public.seat_sessions (seat_id);
