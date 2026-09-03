// Next.jsサーバー起動時に1回呼ばれるフック。
// Node.jsランタイムのときだけスケジューラ本体を読み込む
// （この形にしないとEdgeバンドルにpgが混入してビルドが壊れる）。
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
