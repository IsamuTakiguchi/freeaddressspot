// アプリのロゴ（ホーム画面アイコンと同じ「ピン＋在席ドット」シンボル）
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5b96fa" />
          <stop offset="60%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a9f" />
        </linearGradient>
      </defs>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="url(#logo-grad)"
        d="M12 1.6c-4.2 0-7.6 3.4-7.6 7.6 0 5.6 7.6 13.6 7.6 13.6s7.6-8 7.6-13.6c0-4.2-3.4-7.6-7.6-7.6zm0 11.2a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z"
      />
      <circle cx="12" cy="9.2" r="1.7" fill="url(#logo-grad)" />
    </svg>
  );
}

export function LogoType({ size = 28 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={size} />
      <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
        座席マップ
      </span>
    </span>
  );
}
