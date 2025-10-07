# 🔧 セットアップガイド

## 1. X API の準備

### 1-1. X Developer Portal でアプリ作成

1. https://developer.x.com/ にアクセス
2. 「Create Project」→「Create App」
3. アプリ名を入力（例: `whiskey-ai-agent`）

### 1-2. OAuth2.0 設定

1. App Settings → User authentication settings
2. **OAuth 2.0** を有効化
3. **Type of App**: Web App
4. **Callback URL**: `http://localhost:3000/callback`
5. **Website URL**: あなたのウェブサイトURL（なければGitHubリポジトリURL）

### 1-3. API Keys を取得

- **Client ID**: `xxxxx`
- **Client Secret**: `xxxxx`（表示されたら必ず保存）

### 1-4. OAuth2 リフレッシュトークン取得

```bash
npm install

# 環境変数を設定
export X_CLIENT_ID="your_client_id"
export X_CLIENT_SECRET="your_client_secret"

# 認証スクリプト実行
node scripts/auth/get-oauth-token.js
```

ブラウザが開くので、X アカウントで認証を許可。

ターミナルに表示される **Refresh Token** を保存。

## 2. Claude API の準備

### 2-1. Anthropic にサインアップ

1. https://console.anthropic.com/ にアクセス
2. アカウント作成
3. クレジットカード登録（従量課金）

### 2-2. API Key 取得

1. Console → API Keys
2. 「Create Key」
3. Key をコピー（`sk-ant-xxxxx`）

## 3. GitHub Secrets の設定

### 3-1. リポジトリの Settings

1. GitHub リポジトリを開く
2. Settings → Secrets and variables → Actions
3. 「New repository secret」

### 3-2. 以下の4つを登録

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-xxxxx` |
| `X_CLIENT_ID` | X API の Client ID |
| `X_CLIENT_SECRET` | X API の Client Secret |
| `X_OAUTH2_REFRESH_TOKEN` | OAuth2 で取得したリフレッシュトークン |

**注意**: `GITHUB_TOKEN` は自動生成されるので設定不要

## 4. ローカルテスト

### 4-1. .env ファイル作成

```bash
cp .env.example .env
```

`.env` を編集：

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
X_CLIENT_ID=xxxxx
X_CLIENT_SECRET=xxxxx
X_OAUTH2_REFRESH_TOKEN=xxxxx
GITHUB_TOKEN=ghp_xxxxx  # ローカルテスト用（GitHub Personal Access Token）
GITHUB_REPOSITORY=your-username/github-actions-x
```

### 4-2. テスト実行

```bash
npm install

# 日次投稿テスト
npm run post:daily

# レジェンド対話テスト
npm run post:legend

# ペアリング投稿テスト
npm run post:pairing
```

**注意**: テスト実行時は実際に X に投稿されます。まずは文字数チェックだけしたい場合は、`scripts/lib/x-client.js` の `postToX` 関数をコメントアウトしてください。

## 5. GitHub Actions 有効化

### 5-1. ワークフローの確認

`.github/workflows/` に以下が存在するか確認：

- `daily-post.yaml` - 毎日6:30
- `legend-post.yaml` - 火金23:00
- `pairing-post.yaml` - 水土18:00

### 5-2. 手動実行でテスト

1. GitHub リポジトリの **Actions** タブ
2. 左メニューから任意のワークフローを選択
3. 「Run workflow」→「Run workflow」
4. 実行ログを確認

### 5-3. スケジュール実行の確認

- 設定した時刻に自動実行される
- 投稿後、Issues に履歴が記録される

## 6. トラブルシューティング

### エラー: "Invalid OAuth token"

→ リフレッシュトークンが期限切れ。再取得してください。

```bash
node scripts/auth/get-oauth-token.js
```

### エラー: "Rate limit exceeded"

→ X API Free プランの制限（月500投稿）に達しています。翌月まで待つか、Basic プランにアップグレード。

### エラー: "ANTHROPIC_API_KEY is not set"

→ GitHub Secrets に正しく設定されているか確認。

### ワークフローが実行されない

- Actions が有効化されているか確認
- cron の時刻が正しいか確認（UTC表記）
- ワークフローファイルに構文エラーがないか確認

## 7. 運用開始

すべてのテストが成功したら、あとは放置でOK！

定期的に確認すること：
- 投稿が正常に実行されているか（Actions ログ）
- API使用量（X API Dashboard, Claude Console）
- 投稿履歴（GitHub Issues）

---

質問・バグ報告は GitHub Issues へ。
