import { ImageResponse } from "next/og";

// ブラウザタブ・Android・PWAマニフェスト用アイコン（apple-icon.tsx と同一デザイン）
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(160deg, #5b96fa 0%, #2563eb 55%, #1e3a9f 100%)",
        }}
      >
        <svg width="360" height="360" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            fill="#ffffff"
            d="M12 1.6c-4.2 0-7.6 3.4-7.6 7.6 0 5.6 7.6 13.6 7.6 13.6s7.6-8 7.6-13.6c0-4.2-3.4-7.6-7.6-7.6zm0 11.2a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z"
          />
          <circle cx="12" cy="9.2" r="1.7" fill="#ffffff" />
        </svg>
      </div>
    ),
    size
  );
}
