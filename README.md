# freeaddressspot — フリーアドレス座席マップ

フリーアドレスのオフィスで「**今、誰がどこに座っているか**」をオフィス図面上でビジュアルに可視化するWebアプリです。

各座席に貼った **NFCタグをスマホでタップするだけ** でチェックインできます（専用アプリ不要。iPhone XS以降 / Android対応）。ビーコン方式（BLE）と比べて、ネイティブアプリ開発・ビーコン機器・電池管理が不要で、タグ1枚数十円から導入できます。

## 機能

| 機能 | 説明 |
|---|---|
| 座席マップ | オフィス図面上に在席者を表示。ピンチズーム/パン対応、10秒間隔の自動更新 |
| チェックイン | 座席のNFCタグをタップ → ブラウザが開く → ワンタップで着席登録。席の移動も自動処理 |
| 人物検索 | 名前・部署で検索（かな/カナ・全角半角を吸収）→ 該当座席へ自動ズーム |
| ステータス | 離席中/会議中/在宅勤務/外出中 をワンタップ切替。在宅・外出者は「オフィス外」リストに表示 |
| 管理画面 | 図面画像のアップロード、図面クリック/ドラッグでの座席配置、NFCタグ用URL発行 |
| レポート | 日別出社人数・部署別・座席稼働率の集計とCSVダウンロード（管理者のみ） |
| 自動リセット | 毎朝4時（JST）に全員自動退席（タップ忘れ対策） |

## アーキテクチャ（Railway一本化）

- **Next.js 15**（App Router / TypeScript / Tailwind CSS）を standalone ビルドで Railway にデプロイ
- **Railway Postgres** — DBはこれ1つ。図面画像もDB内（bytea）に保存するため外部ストレージ不要
- **認証**: Auth.js (NextAuth v5) の Google プロバイダ + JWTセッション。許可ドメインはサーバ側で強制
- チェックイン等の書き込みはすべてサーバ側（Server Actions / Route Handlers）。「1人1席・1席1人」は partial unique index + トランザクションでDBレベル保証
- 座席座標は図面画像に対する相対値（0〜1）で保存するため、どの画面サイズでも正しく表示されます

```
NFCタグ（座席ごと）
  └─ https://<アプリURL>/checkin/<座席ID> を書き込み
       └─ スマホでタップ → ブラウザが開く → Googleログイン（初回のみ）→ チェックイン
            └─ 全端末のマップに約10秒以内に反映（ポーリング）
```

## セットアップ

### 1. Google OAuth クライアントの作成

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) で OAuthクライアントID（Webアプリケーション）を作成
2. 承認済みリダイレクトURI に以下を追加:
   - 本番: `https://<本番ドメイン>/api/auth/callback/google`
   - ローカル開発（Googleログインを使う場合）: `http://localhost:3000/api/auth/callback/google`

### 2. Railway プロジェクトの作成

[Railway](https://railway.com) で新規プロジェクトを作り、2つのサービスを構成します。

**① Postgres**: 「Add Service → Database → PostgreSQL」

**② web（アプリ本体）**: 「Add Service → GitHub Repo」でこのリポジトリを選択
- リポジトリ同梱の `railway.json` により、Dockerビルド・マイグレーション自動適用（Pre-Deploy）・ヘルスチェック（`/api/health`）は**自動設定されます**
- Settings → Networking → Generate Domain（またはカスタムドメイン設定）
- Variables に以下を設定:

| 変数 | 値 |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `AUTH_SECRET` | `npx auth secret` で生成した値 |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | 手順1のクライアントID/シークレット |
| `AUTH_TRUST_HOST` | `true`（**必須**。Railwayのプロキシ配下で動くため） |
| `ALLOWED_EMAIL_DOMAIN` | 会社ドメイン（例: `example.co.jp`）。**未設定だと誰でもログイン可能** |
| `NEXT_PUBLIC_SITE_URL` | `https://<本番ドメイン>`（ビルド時に焼き込み。変更したら再デプロイ） |
| `CRON_SECRET` | ランダム文字列（予備リセットAPI用） |

深夜リセット（毎朝4時 JST の全員自動退席）は**webサービスに内蔵**されているため、追加のcronサービスは不要です。

### 3. 初期データと管理者設定

デプロイ後、Railwayの Postgres サービス → Data（またはローカルから `railway connect postgres`）でSQLを実行:

```sql
-- 自分でGoogleログインした後、管理者権限を付与
update profiles set is_admin = true where email = 'you@example.co.jp';
```

サンプルフロア（動作確認用）を入れたい場合はローカルから:

```bash
DATABASE_URL=<RailwayのPublic接続URL> PGSSL=1 npm run db:seed
```

### 4. フロアと座席の登録

1. アプリの「管理」→ フロア名とオフィス図面画像（PNG/JPEG/SVG/WebP、8MBまで）をアップロード
2. 「座席を配置」→「＋クリックで座席追加」モードで図面上のデスク位置をクリック
3. マーカーはドラッグで微調整、選択してラベル変更（例: A-1）

### 5. NFCタグの書き込み

1. **タグの購入**: NTAG213以上（144バイト〜）のNFCタグシールを座席数分（1枚数十円〜）
2. **URLの取得**: 管理画面の「座席一覧とNFCタグ用URL」から各座席のURLをコピー
3. **書き込み**: スマホアプリ「[NFC Tools](https://www.wakdev.com/en/apps/nfc-tools.html)」(iOS/Android・無料)で
   「書く」→「レコードを追加」→「URL/URI」→ コピーしたURLを貼り付け →「書く」
4. **ロック**: 書き込み後「その他」→「読み取り専用にする」でいたずら書き換えを防止（元に戻せない点に注意）
5. タグを座席に貼り、座席ラベルを印字したシールを併貼りすると運用しやすいです

**動作確認**: iPhoneは画面点灯状態でタグに近づけると通知バナー→タップでSafariが開きます。AndroidはNFCをオンにしてタップするとChromeが開きます。初回のみGoogleログインが必要で、以降はタップ→ボタン1回でチェックイン完了です。

**注意**: タグにはドメイン入りURLが焼き込まれるため、**独自ドメインを先に決めてから**書き込むのがおすすめです。

## ローカル開発

PostgreSQLをローカルに用意し（Docker等）、`.env.example` をコピーして設定します。

```bash
cp .env.example .env.local
# DATABASE_URL を自分のPostgresに合わせ、AUTH_SECRET を設定し、
# ENABLE_DEV_LOGIN=1 のコメントを外す（Googleクレデンシャルなしでログイン可能になる）

npm install
npm run db:migrate   # マイグレーション適用
npm run db:seed      # サンプルフロア+30席（任意）
npm run dev
```

`ENABLE_DEV_LOGIN=1` を設定すると、ログイン画面にメールアドレスだけで入れる開発用フォームが出ます（productionビルドでは環境変数を設定しても常に無効です）。

## 運用メモ

- **退席**: マップ画面の「退席する」ボタン。押し忘れても毎朝4時（JST）に自動リセット（アプリ内蔵スケジューラ。手動実行は `POST /api/cron/reset` でも可）
- **席の乗っ取り防止**: 他人が着席中の席をタップすると確認画面が出ます。「この席を使う」で前の人を退席扱いにできます（帰宅時のタップ忘れ救済）
- **座席の削除・移動**: NFCタグにはURL（座席ID）が焼き込まれているため、座席を削除するとそのタグは無効になります。レイアウト変更時は座席を「移動」（ドラッグ）すればタグはそのまま使えます
- **大型モニタ表示**: PCブラウザで `/map` を開けば入口サイネージとしても使えます（10秒ごとに自動更新）
- **リセットの予備経路**: `POST /api/cron/reset`（`Authorization: Bearer <CRON_SECRET>`）でも同じリセットを実行できます

## 開発コマンド

```bash
npm run dev          # 開発サーバー
npm run build        # 本番ビルド（standalone）
npm run lint         # ESLint
npm run db:migrate   # db/migrations/*.sql を適用（適用済み管理付き）
npm run db:seed      # サンプルデータ投入（冪等）
```

- DBスキーマ変更は `db/migrations/` に連番SQLを追加（Railwayでは Pre-Deploy Command が自動適用）
- サンプル図面の再生成: `node scripts/gen-sample-floor.mjs`（座席座標の定義は `scripts/seed.mjs` と一致させること）

## ライセンス / 参考

- 参考にしたサービス: [Beacapp Here](https://jp.beacapp-here.com/)（BLEビーコン方式の商用サービス）。本アプリはNFCタグ方式による社内向け実装です
