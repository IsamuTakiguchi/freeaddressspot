-- 個別許可メールアドレス（ALLOWED_EMAIL_DOMAIN のドメイン一致に加えて、
-- このテーブルに登録されたメールアドレスもログインを許可する）
create table public.allowed_emails (
  email      text primary key,
  note       text,
  created_at timestamptz not null default now()
);
