-- 新規ユーザー登録時: 会社ドメイン検証 + プロフィール自動作成
-- Google OAuth の hd パラメータはクライアント側ヒントに過ぎないため、サーバ側で強制する

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domain text;
begin
  select value into v_domain
    from public.app_settings where key = 'allowed_email_domain';

  if v_domain is not null and v_domain <> '*'
     and lower(split_part(new.email, '@', 2)) <> lower(v_domain) then
    raise exception '会社のGoogleアカウント（@%）でログインしてください', v_domain;
  end if;

  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
