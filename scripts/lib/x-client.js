import { TwitterApi } from 'twitter-api-v2';
import { updateGitHubSecret } from './secret-updater.js';

/**
 * X API クライアントを初期化
 */
export function createXClient() {
  const client = new TwitterApi({
    clientId: process.env.X_CLIENT_ID,
    clientSecret: process.env.X_CLIENT_SECRET,
  });

  return client;
}

/**
 * OAuth2.0 リフレッシュトークンから新しいアクセストークンを取得
 * 新しいリフレッシュトークンをGitHub Secretsに自動保存
 */
export async function refreshAccessToken() {
  const refreshToken = process.env.X_OAUTH2_REFRESH_TOKEN;

  if (!refreshToken) {
    throw new Error('X_OAUTH2_REFRESH_TOKEN が設定されていません');
  }

  console.log('🔄 アクセストークンを更新中...');

  const client = createXClient();

  try {
    const { client: refreshedClient, accessToken, refreshToken: newRefreshToken } =
      await client.refreshOAuth2Token(refreshToken);

    console.log('✅ アクセストークン更新成功');

    // 新しいリフレッシュトークンをGitHub Secretsに保存
    if (newRefreshToken && newRefreshToken !== refreshToken) {
      await updateGitHubSecret('X_OAUTH2_REFRESH_TOKEN', newRefreshToken);
    }

    return { client: refreshedClient, accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.error('❌ アクセストークン更新エラー:', error.message);
    console.error('エラー詳細:', error);
    throw new Error(`OAuth2トークン更新失敗: ${error.message}`);
  }
}

/**
 * X に投稿
 * @param {string} text - 投稿テキスト（280文字以内）
 * @returns {Promise<object>} 投稿結果
 */
export async function postToX(text) {
  if (!text || text.length === 0) {
    throw new Error('投稿テキストが空です');
  }

  if (text.length > 280) {
    throw new Error(`投稿テキストが280文字を超えています: ${text.length}文字`);
  }

  console.log('📤 X に投稿中...');

  try {
    const { client } = await refreshAccessToken();

    const tweet = await client.v2.tweet(text);

    console.log('✅ 投稿成功:', tweet.data.id);
    return tweet.data;
  } catch (error) {
    console.error('❌ 投稿エラー:', error.message);

    // エラーの詳細情報を出力
    if (error.data) {
      console.error('エラーデータ:', JSON.stringify(error.data, null, 2));
    }
    if (error.code) {
      console.error('エラーコード:', error.code);
    }
    if (error.rateLimit) {
      console.error('レート制限:', error.rateLimit);
    }

    throw new Error(`X投稿失敗 (${error.code || 'UNKNOWN'}): ${error.message}`);
  }
}
