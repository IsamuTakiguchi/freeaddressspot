"use client";

import { useRef, useState } from "react";
import {
  addAllowedEmailAction,
  removeAllowedEmailAction,
  type AllowedEmail,
} from "@/app/admin/actions";

// 会社ドメイン以外で個別にログインを許可するメールアドレスの管理
export default function AllowedEmailList({
  initialEmails,
  allowedDomain,
}: {
  initialEmails: AllowedEmail[];
  allowedDomain: string | null;
}) {
  const [emails, setEmails] = useState(initialEmails);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const email = emailRef.current?.value ?? "";
    if (!email) return;
    setBusy(true);
    setError(null);
    try {
      const result = await addAllowedEmailAction({
        email,
        note: noteRef.current?.value,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEmails([...emails, result.data]);
      if (emailRef.current) emailRef.current.value = "";
      if (noteRef.current) noteRef.current.value = "";
    } finally {
      setBusy(false);
    }
  }

  async function remove(email: string) {
    if (
      !confirm(
        `${email} の許可を取り消しますか？\n（次回以降の新規ログインができなくなります）`
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const result = await removeAllowedEmailAction(email);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEmails(emails.filter((x) => x.email !== email));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-bold text-gray-900">
        個別許可メールアドレス
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        {allowedDomain && allowedDomain !== "*"
          ? `@${allowedDomain} のアカウントは自動で許可されます。それ以外（Gmail等）でログインさせたい人をここに登録してください。`
          : "現在は全ドメイン許可の設定です（ALLOWED_EMAIL_DOMAIN 未設定）。"}
      </p>

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="mt-3 divide-y divide-gray-100">
        {emails.map((x) => (
          <li
            key={x.email}
            className="flex items-center justify-between gap-2 py-2 text-sm"
          >
            <div className="min-w-0">
              <span className="font-medium text-gray-900">{x.email}</span>
              {x.note && (
                <span className="ml-2 text-xs text-gray-500">{x.note}</span>
              )}
            </div>
            <button
              onClick={() => remove(x.email)}
              disabled={busy}
              className="shrink-0 rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              削除
            </button>
          </li>
        ))}
        {emails.length === 0 && (
          <li className="py-2 text-sm text-gray-400">登録はありません</li>
        )}
      </ul>

      <form onSubmit={add} className="mt-3 flex flex-wrap gap-2">
        <input
          ref={emailRef}
          type="email"
          required
          placeholder="taro@gmail.com"
          className="min-w-52 flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
        <input
          ref={noteRef}
          placeholder="メモ（例: 山田さん・業務委託）"
          className="min-w-40 flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
        <button
          disabled={busy}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          追加
        </button>
      </form>
    </section>
  );
}
