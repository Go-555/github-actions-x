# 🥃🍩 Whiskey AI Agent

**ウィスキー×ドーナツ×AI で大人の贅沢時間**

X API Free プランで完全自動運用するAIエージェント。Claude APIでコンテンツ生成、GitHub Actionsで定期投稿。

## 📋 概要

- **ターゲット**: 20代後半〜30代のハイボール好き
- **コンセプト**: ウィスキーの深みとドーナツのペアリング提案
- **運用方針**: X API Free プラン（月500投稿）内で完全自動化

## 🤖 機能

| 投稿タイプ | 頻度 | 時刻（JST） | 月間投稿数 |
|-----------|------|------------|-----------|
| 日次投稿（ウィスキー豆知識） | 毎日 | 6:30 | 30件 |
| レジェンド対話 | 火・金 | 23:00 | 8件 |
| ペアリング提案 | 水・土 | 18:00 | 8件 |
| ウィスキーニュース | 月5回（月曜） | 12:00 | 5件 |
| note記事投稿 | 月1回（第1日曜） | 21:00 | 1件 |
| **合計** | - | - | **52件/月** |

**余裕**: 500件 - 52件 = 448件（突発投稿可能）

### 対話可能なレジェンド

1. **竹鶴政孝** - ニッカウヰスキー創業者、日本のウイスキーの父
2. **鳥井信治郎** - サントリー創業者、「やってみなはれ」の精神
3. **肥土伊知郎** - ベンチャーウイスキー創業者、イチローズモルト

## 🛠️ セットアップ

### 1. 必須の環境変数設定

GitHub リポジトリの Settings → Secrets and variables → Actions で以下を設定：

| 変数名 | 説明 | 取得方法 |
|--------|------|---------|
| `ANTHROPIC_API_KEY` | Claude API キー | https://console.anthropic.com/ |
| `X_CLIENT_ID` | X API Client ID | https://developer.x.com/ |
| `X_CLIENT_SECRET` | X API Client Secret | https://developer.x.com/ |
| `X_OAUTH2_REFRESH_TOKEN` | OAuth2 リフレッシュトークン | [OAuth2認証](#x-oauth2認証) |
| `NOTE_STORAGE_STATE_JSON` | note.com ログイン状態 | [note認証](#note認証) |

### 1-2. リフレッシュトークン自動更新（オプション）

X APIのリフレッシュトークンを自動更新したい場合、追加で以下を設定：

| 変数名 | 説明 | 取得方法 |
|--------|------|---------|
| `SECRET_UPDATE_TOKEN` | GitHub Personal Access Token | [PAT作成方法](./SETUP.md#3-3-リフレッシュトークン自動更新オプション) |

**メリット**: 一度設定すれば、リフレッシュトークンの再認証が不要になります。

### 2. X OAuth2認証

```bash
npm install
node scripts/auth/get-oauth-token.js
```

### 3. note 認証

```bash
npm run login:note
# ブラウザでnoteにログイン後、storageStateを保存
```

詳細は [SETUP.md](./SETUP.md) を参照。

### 4. GitHub Actions の有効化

- リポジトリの Actions タブで workflow を有効化
- 手動実行で動作確認：`workflow_dispatch` から実行

## 📁 ディレクトリ構成

```
.
├── .github/workflows/         # GitHub Actions ワークフロー
│   ├── daily-post.yaml        # 毎日6:30の日次投稿
│   ├── legend-post.yaml       # 火金23:00のレジェンド対話
│   ├── pairing-post.yaml      # 水土18:00のペアリング投稿
│   ├── news-post.yaml         # 月曜12:00のニュース投稿
│   └── note-post.yaml         # 第1日曜21:00のnote記事
├── scripts/
│   ├── lib/                   # 共通ユーティリティ
│   │   ├── claude-client.js   # Claude API
│   │   ├── x-client.js        # X API（リフレッシュトークン自動更新対応）
│   │   ├── github-client.js   # GitHub API（重複防止機能強化済み）
│   │   ├── note-client.js     # note.com API（Playwright）
│   │   └── secret-updater.js  # GitHub Secrets自動更新
│   ├── auth/                  # 認証スクリプト
│   │   ├── get-oauth-token.js # X OAuth2認証
│   │   └── login-note.js      # note.comログイン
│   ├── daily-post.js          # 日次投稿生成
│   ├── legend-post.js         # レジェンド対話生成
│   ├── pairing-post.js        # ペアリング投稿生成
│   ├── news-post.js           # ニュース投稿生成
│   └── note-post.js           # note記事生成・投稿
├── data/
│   └── legends.json           # レジェンドプロフィール
└── package.json
```

## 🚀 使い方

### ローカルでテスト

```bash
# 依存関係インストール
npm install

# 環境変数を .env に設定
cp .env.example .env
# .env を編集

# 各スクリプトをテスト実行
npm run post:daily
npm run post:legend
npm run post:pairing
npm run post:news
npm run post:note
```

### 本番運用

GitHub にプッシュするだけで自動実行されます：

```bash
git add .
git commit -m "Initial setup"
git push origin main
```

## 📊 投稿履歴管理

- 投稿は自動的に GitHub Issues に記録
- ラベル: `posted`, `daily`, `legend`, `pairing`, `news`, `note`
- **重複防止機能**:
  - 日次投稿・レジェンド・ペアリング: 1日1回まで
  - ニュース: タイトルベースで重複チェック
  - note: テーマベースで重複チェック（全テーマ投稿後はランダム選択）

## 🔍 トラブルシューティング

### 投稿が実行されない

- GitHub Actions の実行履歴を確認
- Secrets が正しく設定されているか確認
- ワークフローファイルに構文エラーがないか確認

### 403 Forbidden エラー

**原因**:
1. **文字数超過** - 日本語は140文字まで（X APIでは2文字カウント）
2. **権限不足** - X Developer Portal で Read and Write 権限を確認
3. **Elevated Access** - Free tierで必要な場合がある

### OAuth トークンエラー（400 Bad Request）

- リフレッシュトークンが無効または期限切れ
- `scripts/auth/get-oauth-token.js` で再取得
- **自動更新を有効化している場合**は自動で解決

### リフレッシュトークン自動更新が失敗

- `SECRET_UPDATE_TOKEN` の権限を確認（Secrets: Read and write）
- トークンの有効期限を確認

### API制限エラー

- X API Free プラン: 月500投稿、月100読み取り
- Claude API: 使用量を確認

詳細は [SETUP.md](./SETUP.md#6-トラブルシューティング) を参照。

## 📚 参考リンク

- [X API ドキュメント](https://developer.x.com/en/docs/x-api)
- [Claude API ドキュメント](https://docs.anthropic.com/)
- [GitHub Actions ドキュメント](https://docs.github.com/en/actions)

## 📝 ライセンス

MIT
