-- RLS: 読み取りは社内（authenticated）全員、書き込みは最小限に制限

-- 管理者判定ヘルパー
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

alter table public.app_settings  enable row level security;
alter table public.floors        enable row level security;
alter table public.seats         enable row level security;
alter table public.profiles      enable row level security;
alter table public.seat_sessions enable row level security;

-- app_settings: 一般ユーザーはアクセス不可（トリガー/RPCはsecurity definerで読む）

-- floors / seats: 全員閲覧可、管理者のみ編集可
create policy "floors_select" on public.floors
  for select to authenticated using (true);
create policy "floors_admin_write" on public.floors
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "seats_select" on public.seats
  for select to authenticated using (true);
create policy "seats_admin_write" on public.seats
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- profiles: 全員閲覧可、自分の行のみ更新可
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- 列レベル制限: is_admin の自己昇格を防ぐ（更新可能列を限定）
revoke update on public.profiles from authenticated;
grant  update (display_name, department, status, status_changed_at)
  on public.profiles to authenticated;

-- seat_sessions: 全員閲覧可。書き込みポリシーなし = RPC（security definer）経由のみ
create policy "seat_sessions_select" on public.seat_sessions
  for select to authenticated using (true);

-- anon には一切公開しない
revoke all on public.app_settings  from anon;
revoke all on public.floors        from anon;
revoke all on public.seats         from anon;
revoke all on public.profiles      from anon;
revoke all on public.seat_sessions from anon;
