#!/usr/bin/env node

import 'dotenv/config';
import { generateText } from './lib/claude-client.js';
import { postToX } from './lib/x-client.js';
import { recordPost, getPostedIssues } from './lib/github-client.js';
import { MUGI_SYSTEM_PROMPT } from './lib/mugi-prompt.js';
import * as cheerio from 'cheerio';

// ウィスキーニュースソース
const NEWS_SOURCES = [
  {
    name: 'WHISKY Magazine Japan',
    url: 'https://whiskymag.jp/',
    selector: 'article h2 a, .post-title a',
  },
  {
    name: 'Dear WHISKY',
    url: 'https://dearwhisky.com/',
    selector: '.entry-title a',
  },
];

/**
 * ニュースサイトから最新記事を取得
 */
async function fetchLatestNews() {
  try {
    // 実際のスクレイピングの代わりに、Claudeにニュース検索を依頼
    const SYSTEM_PROMPT = `あなたはウィスキー業界のニュースキュレーターです。`;

    const USER_PROMPT = `最近のウィスキー関連のニュースを1つ教えてください。

【要件】
- 実際にあったニュース（新製品、イベント、受賞歴など）
- 2024年以降のもの
- 信頼できる情報源
- 簡潔に要約（3-4文）

以下のJSON形式で出力：
\`\`\`json
{
  "title": "ニュースタイトル",
  "summary": "ニュース要約（3-4文）",
  "source": "情報源名"
}
\`\`\``;

    const response = await generateText(SYSTEM_PROMPT, USER_PROMPT, 1024);

    const jsonMatch = response.match(/```json\n([\s\S]+?)\n```/);
    if (!jsonMatch) {
      throw new Error('ニュース取得に失敗');
    }

    return JSON.parse(jsonMatch[1]);
  } catch (error) {
    console.error('ニュース取得エラー:', error);
    return null;
  }
}

/**
 * ニュースが既に投稿済みかチェック
 */
async function isNewsPosted(newsTitle) {
  const postedIssues = await getPostedIssues(['news']);

  return postedIssues.some(issue => issue.body.includes(newsTitle));
}

async function main() {
  try {
    console.log('📰 ウィスキーニュースを取得中...');

    // 最新ニュースを取得
    const news = await fetchLatestNews();

    if (!news) {
      console.log('⚠️  ニュースの取得に失敗しました');
      process.exit(0);
    }

    console.log(`取得したニュース: ${news.title}`);

    // 重複チェック
    const posted = await isNewsPosted(news.title);
    if (posted) {
      console.log('⚠️  このニュースは既に投稿済みです');
      process.exit(0);
    }

    // ニュース投稿を生成
    const USER_PROMPT = `以下のウィスキーニュースをお客さんに紹介してください。

【ニュース】
タイトル: ${news.title}
要約: ${news.summary}
出典: ${news.source}

【要件】
- **日本語は140文字以内厳守**（日本語はAPI上2文字カウントのため）
- バーカウンター越しに語りかけるような自然な紹介
- **バズる要素を含める**（インパクトある冒頭、具体的な数字など）
- 興味を引く書き出し
- ハッシュタグ: #ウィスキー #ウィスキーニュース
- 情報源を明記

投稿テキストのみを出力してください。`;

    const postText = await generateText(MUGI_SYSTEM_PROMPT, USER_PROMPT, 512);

    console.log('生成された投稿:');
    console.log('---');
    console.log(postText);
    console.log('---');
    console.log(`文字数: ${postText.length}文字`);

    // X に投稿
    const tweet = await postToX(postText);

    // GitHub Issues に記録
    await recordPost(
      `[News] ${news.title.substring(0, 50)} - ${new Date().toISOString().split('T')[0]}`,
      `**タイトル**: ${news.title}\n**出典**: ${news.source}\n\n${postText}`,
      ['news']
    );

    console.log('✅ ニュース投稿完了!');
    console.log(`Tweet ID: ${tweet.id}`);
  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

main();
