-- Realtime: 着席変更とステータス変更をクライアントに通知
alter publication supabase_realtime add table public.seat_sessions;
alter publication supabase_realtime add table public.profiles;

-- Storage: フロア図面バケット（読み取りは公開URL、書き込みは管理者のみ）
insert into storage.buckets (id, name, public)
values ('floors', 'floors', true)
on conflict (id) do nothing;

create policy "floors_storage_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'floors' and public.is_admin());
create policy "floors_storage_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'floors' and public.is_admin());
create policy "floors_storage_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'floors' and public.is_admin());

-- 深夜リセット: JST 4:00（= 19:00 UTC）に全アクティブ着席をクローズし、ステータスも解除
create extension if not exists pg_cron;

select cron.schedule(
  'nightly-reset',
  '0 19 * * *',
  $cron$
    update public.seat_sessions
      set checked_out_at = now(), check_out_reason = 'auto_reset'
      where checked_out_at is null;
    update public.profiles
      set status = null, status_changed_at = now()
      where status is not null;
  $cron$
);
