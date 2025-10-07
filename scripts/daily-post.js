#!/usr/bin/env node

import 'dotenv/config';
import { generateText } from './lib/claude-client.js';
import { postToX } from './lib/x-client.js';
import { recordPost, isPostedToday } from './lib/github-client.js';

const SYSTEM_PROMPT = `あなたは「Whiskey AI Agent」です。
20代後半〜30代のハイボール好きに向けて、ウィスキーの深みとドーナツのペアリングを提案する大人の情報発信者です。

【ペルソナ】
- ウィスキーへの深い知識と愛情を持つ
- カジュアルで親しみやすい語り口
- 実用的で今日から試せる情報を重視

【投稿スタイル】
- 280文字以内
- 絵文字は控えめ（1-2個）
- ハッシュタグは2-3個
- 具体的で実践的な内容`;

const USER_PROMPT = `今日の日次投稿を生成してください。

【要件】
- ウィスキーの豆知識、楽しみ方、歴史、製法など
- 初心者でも分かりやすく、でも深い内容
- 280文字ぴったりに収める
- ハッシュタグ: #ウィスキー #ハイボール #大人の時間

【今日の日付】
${new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}

【季節感】
${getSeasonContext()}

投稿テキストのみを出力してください（説明不要）。`;

function getSeasonContext() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return '春 - 爽やかな季節、桜とウィスキー';
  if (month >= 6 && month <= 8) return '夏 - ハイボールの季節、爽快感';
  if (month >= 9 && month <= 11) return '秋 - 深みのある味わい、読書の秋';
  return '冬 - 温かい部屋でじっくり、ホットウィスキー';
}

async function main() {
  try {
    console.log('🍺 日次投稿を生成中...');

    // 今日既に投稿済みかチェック
    const posted = await isPostedToday(['daily']);
    if (posted) {
      console.log('⚠️  今日は既に投稿済みです');
      process.exit(0);
    }

    // Claude で投稿テキスト生成
    const postText = await generateText(SYSTEM_PROMPT, USER_PROMPT, 512);

    console.log('生成された投稿:');
    console.log('---');
    console.log(postText);
    console.log('---');
    console.log(`文字数: ${postText.length}文字`);

    // X に投稿
    const tweet = await postToX(postText);

    // GitHub Issues に記録
    await recordPost(
      `[Daily] ${new Date().toISOString().split('T')[0]}`,
      postText,
      ['daily']
    );

    console.log('✅ 日次投稿完了!');
    console.log(`Tweet ID: ${tweet.id}`);
  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

main();
