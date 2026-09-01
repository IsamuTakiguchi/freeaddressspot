# freeaddressspot — フリーアドレス座席マップ

フリーアドレスのオフィスで「**今、誰がどこに座っているか**」をオフィス図面上でリアルタイムに可視化するWebアプリです。

各座席に貼った **NFCタグをスマホでタップするだけ** でチェックインできます（専用アプリ不要。iPhone XS以降 / Android対応）。ビーコン方式（BLE）と比べて、ネイティブアプリ開発・ビーコン機器・電池管理が不要で、タグ1枚数十円から導入できます。

## 機能

| 機能 | 説明 |
|---|---|
| 座席マップ | オフィス図面上に在席者を表示。ピンチズーム/パン対応、リアルタイム更新 |
| チェックイン | 座席のNFCタグをタップ → ブラウザが開く → ワンタップで着席登録。席の移動も自動処理 |
| 人物検索 | 名前・部署で検索（かな/カナ・全角半角を吸収）→ 該当座席へ自動ズーム |
| ステータス | 離席中/会議中/在宅勤務/外出中 をワンタップ切替。在宅・外出者は「オフィス外」リストに表示 |
| 管理画面 | 図面画像のアップロード、図面クリック/ドラッグでの座席配置、NFCタグ用URL発行 |
| レポート | 日別出社人数・部署別・座席稼働率の集計とCSVダウンロード（管理者のみ） |
| 自動リセット | 毎朝4時（JST）に全員自動退席（タップ忘れ対策） |

## アーキテクチャ

- **Next.js 15**（App Router / TypeScript / Tailwind CSS）— Vercelデプロイ想定
- **Supabase** — Postgres / Google SSO認証 / Realtime / Storage / pg_cron
- チェックイン等の書き込みは security definer の Postgres関数（RPC）経由。「1人1席・1席1人」は partial unique index でDBレベル保証
- 座席座標は図面画像に対する相対値（0〜1）で保存するため、どの画面サイズでも正しく表示されます

```
NFCタグ（座席ごと）
  └─ https://<アプリURL>/checkin/<座席ID> を書き込み
       └─ スマホでタップ → ブラウザが開く → Googleログイン（初回のみ）→ チェックイン
            └─ Supabase Realtime → 全員のマップに即時反映
```

## セットアップ

### 1. Supabaseプロジェクト作成

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. Project Settings → API から `Project URL` と `anon public` キーを控える

### 2. Google OAuth（Google Workspace SSO）設定

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) で OAuthクライアントID（Webアプリケーション）を作成
   - 承認済みリダイレクトURI: `https://<プロジェクトref>.supabase.co/auth/v1/callback`
2. Supabaseダッシュボード → Authentication → Providers → Google を有効化し、クライアントIDとシークレットを設定
3. ローカル開発する場合は、Supabase → Authentication → URL Configuration の Redirect URLs に `http://localhost:3000/auth/callback` を追加

### 3. データベースのセットアップ

[Supabase CLI](https://supabase.com/docs/guides/cli) を使ってマイグレーションを適用します。

```bash
supabase login
supabase link --project-ref <プロジェクトref>
supabase db push          # supabase/migrations/ を適用
```

> pg_cron 拡張が有効化できない場合は、ダッシュボードの Database → Extensions で `pg_cron` を有効にしてから再実行してください。

**会社ドメインの制限**（重要）: SQL Editor で自社ドメインを設定します。

```sql
update public.app_settings set value = 'your-company.co.jp'
 where key = 'allowed_email_domain';
```

`'*'`（初期値）のままだと任意のGoogleアカウントでログインできてしまいます。

**サンプルデータ**（任意・動作確認用）: SQL Editor で `supabase/seed.sql` の内容を実行すると、サンプル図面と30席が登録されます。

### 4. アプリの起動（ローカル）

```bash
cp .env.local.example .env.local   # URL/anonキーを記入
npm install
npm run dev
```

http://localhost:3000 を開き、Googleログインできれば成功です。

### 5. 最初の管理者を設定

自分でログインした後、SQL Editor で:

```sql
update public.profiles set is_admin = true
 where id = (select id from auth.users where email = 'you@your-company.co.jp');
```

マップ右上に「管理」「レポート」リンクが表示されます。

### 6. フロアと座席の登録

1. 「管理」→ フロア名とオフィス図面画像（PNG/JPEG/SVG/WebP）をアップロード
2. 「座席を配置」→「＋クリックで座席追加」モードで図面上のデスク位置をクリック
3. マーカーはドラッグで微調整、選択してラベル変更（例: A-1）

### 7. NFCタグの書き込み

1. **タグの購入**: NTAG213以上（144バイト〜）のNFCタグシールを座席数分（1枚数十円〜）
2. **URLの取得**: 管理画面の「座席一覧とNFCタグ用URL」から各座席のURLをコピー
3. **書き込み**: スマホアプリ「[NFC Tools](https://www.wakdev.com/en/apps/nfc-tools.html)」（iOS/Android・無料）で
   「書く」→「レコードを追加」→「URL/URI」→ コピーしたURLを貼り付け →「書く」
4. **ロック**: 書き込み後「その他」→「読み取り専用にする」でいたずら書き換えを防止（元に戻せない点に注意）
5. タグを座席に貼り、座席ラベルを印字したシールを併貼りすると運用しやすいです

**動作確認**: iPhoneは画面点灯状態でタグに近づけると通知バナー→タップでSafariが開きます。AndroidはNFCをオンにしてタップするとChromeが開きます。初回のみGoogleログインが必要で、以降はタップ→ボタン1回でチェックイン完了です。

### 8. 本番デプロイ

Cloudflare Workers と Vercel のどちらにもデプロイできます。いずれの場合も、デプロイ後に:

- Supabase → Authentication → URL Configuration:
  - Site URL: 本番URL
  - Redirect URLs: `https://<本番ドメイン>/auth/callback` を追加
- 本番URLで座席URLを発行してからNFCタグに書き込んでください（タグにはドメインが焼き込まれるため、**独自ドメインを先に決めてから**書き込むのがおすすめです）

#### A. Cloudflare Workers（OpenNextアダプタ）

[@opennextjs/cloudflare](https://opennext.js.org/cloudflare) 設定済み（`wrangler.jsonc` / `open-next.config.ts`）。

```bash
npx wrangler login
npm run cf:deploy        # ビルドしてWorkersへデプロイ
```

- 環境変数（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SITE_URL`）は
  **ビルド時にインライン化される**ため、ローカルからデプロイする場合は `.env.local` に、
  [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)（Gitpush連動）を使う場合は
  ビルド環境変数として設定します
- ローカルでWorkersランタイム上の動作確認: `npm run cf:preview`
- カスタムドメインは Workers → Settings → Domains & Routes から設定
- 無料枠（10万リクエスト/日）で社内利用には十分です

> 旧方式の Cloudflare Pages + next-on-pages は非推奨です。Workers + OpenNext を使ってください。

#### B. Vercel

1. リポジトリをVercelにインポートし、環境変数を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`（例: `https://seatmap.your-company.co.jp` — NFCタグ用URLの生成に使用）
2. そのままデプロイできます（追加設定不要）

## 運用メモ

- **退席**: マップ画面の「退席する」ボタン。押し忘れても毎朝4時（JST）に自動リセットされます
- **席の乗っ取り防止**: 他人が着席中の席をタップすると確認画面が出ます。「この席を使う」で前の人を退席扱いにできます（帰宅時のタップ忘れ救済）
- **座席の削除・移動**: NFCタグにはURL（座席ID）が焼き込まれているため、座席を削除するとそのタグは無効になります。レイアウト変更時は座席を「移動」（ドラッグ）すればタグはそのまま使えます
- **大型モニタ表示**: PCブラウザで `/map` を開けば入口サイネージとしても使えます（30秒ごとのポーリング＋Realtimeで自動更新）

## 開発

```bash
npm run dev     # 開発サーバー
npm run build   # 本番ビルド
npm run lint    # ESLint
```

- DBスキーマ変更は `supabase/migrations/` にSQLを追加して `supabase db push`
- 型の再生成: `supabase gen types typescript --linked > lib/database.types.ts`
- サンプル図面の再生成: `node scripts/gen-sample-floor.mjs`

## ライセンス / 参考

- 参考にしたサービス: [Beacapp Here](https://jp.beacapp-here.com/)（BLEビーコン方式の商用サービス）。本アプリはNFCタグ方式による社内向け実装です
