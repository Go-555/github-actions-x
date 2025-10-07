import { TwitterApi } from 'twitter-api-v2';

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
 */
export async function refreshAccessToken() {
  const client = createXClient();

  const { client: refreshedClient, accessToken, refreshToken } =
    await client.refreshOAuth2Token(process.env.X_OAUTH2_REFRESH_TOKEN);

  return { client: refreshedClient, accessToken, refreshToken };
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

  const { client } = await refreshAccessToken();

  const tweet = await client.v2.tweet(text);

  console.log('✅ 投稿成功:', tweet.data.id);
  return tweet.data;
}
