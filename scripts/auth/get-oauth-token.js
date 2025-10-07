#!/usr/bin/env node

/**
 * X API OAuth2.0 認証でリフレッシュトークンを取得するスクリプト
 *
 * 使い方:
 * 1. .env に X_CLIENT_ID と X_CLIENT_SECRET を設定
 * 2. node scripts/auth/get-oauth-token.js を実行
 * 3. ブラウザで認証を許可
 * 4. 表示されたリフレッシュトークンを .env と GitHub Secrets に設定
 */

import 'dotenv/config';
import { TwitterApi } from 'twitter-api-v2';
import http from 'http';
import { URL } from 'url';

const CLIENT_ID = process.env.X_CLIENT_ID;
const CLIENT_SECRET = process.env.X_CLIENT_SECRET;
const CALLBACK_URL = 'http://localhost:3000/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ X_CLIENT_ID と X_CLIENT_SECRET を .env に設定してください');
  process.exit(1);
}

async function main() {
  const client = new TwitterApi({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  });

  // OAuth2 認証URLを生成
  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(CALLBACK_URL, {
    scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
  });

  console.log('🔐 X OAuth2.0 認証を開始します...');
  console.log('');
  console.log('ブラウザで以下のURLを開いてください:');
  console.log(url);
  console.log('');

  // ローカルサーバーでコールバックを待機
  const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);

    if (reqUrl.pathname === '/callback') {
      const code = reqUrl.searchParams.get('code');
      const returnedState = reqUrl.searchParams.get('state');

      if (!code || returnedState !== state) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('❌ 認証に失敗しました');
        server.close();
        process.exit(1);
      }

      try {
        // アクセストークンとリフレッシュトークンを取得
        const {
          client: loggedClient,
          accessToken,
          refreshToken,
          expiresIn,
        } = await client.loginWithOAuth2({
          code,
          codeVerifier,
          redirectUri: CALLBACK_URL,
        });

        // 認証成功
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html>
            <body style="font-family: sans-serif; padding: 40px;">
              <h1>✅ 認証成功！</h1>
              <p>ターミナルに戻ってリフレッシュトークンを確認してください。</p>
              <p>このウィンドウは閉じて大丈夫です。</p>
            </body>
          </html>
        `);

        console.log('');
        console.log('✅ 認証成功！');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('以下のリフレッシュトークンを保存してください:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log(`X_OAUTH2_REFRESH_TOKEN=${refreshToken}`);
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('📝 次のステップ:');
        console.log('1. 上記のトークンを .env ファイルに追加');
        console.log('2. GitHub Secrets に X_OAUTH2_REFRESH_TOKEN として登録');
        console.log('');
        console.log(`有効期限: ${expiresIn}秒 (約${Math.floor(expiresIn / 3600)}時間)`);
        console.log('※ リフレッシュトークンは期限なし（使用中は自動更新）');
        console.log('');

        server.close();
        process.exit(0);
      } catch (error) {
        console.error('❌ トークン取得エラー:', error.message);
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('❌ トークン取得に失敗しました');
        server.close();
        process.exit(1);
      }
    }
  });

  server.listen(3000, () => {
    console.log('ローカルサーバー起動: http://localhost:3000');
    console.log('コールバック待機中...');
    console.log('');
  });
}

main().catch(error => {
  console.error('❌ エラー:', error);
  process.exit(1);
});
