// 深夜リセットのアプリ内蔵スケジューラ（別途cronサービス不要）。
// instrumentation.ts から Node.js ランタイム時のみ読み込まれる。
import { runAutoReset } from "@/lib/auto-reset";

const tick = async () => {
  try {
    await runAutoReset();
  } catch (e) {
    console.error("[auto-reset] failed:", e);
  }
};

// 起動直後に1回（再起動やスリープで4時を逃した場合のキャッチアップ）、以後は毎分チェック
void tick();
setInterval(tick, 60_000);
console.log("[auto-reset] scheduler started (daily reset at 04:00 JST)");
