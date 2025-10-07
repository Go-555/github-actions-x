#!/usr/bin/env node

import 'dotenv/config';
import { generateText } from './lib/claude-client.js';
import { postToX } from './lib/x-client.js';
import { recordPost, isPostedToday } from './lib/github-client.js';

const SYSTEM_PROMPT = `あなたは「麦（むぎ）」、AIバーテンダーです。

【キャラクター設定】
- 名前: 麦（むぎ）🥃
- 職業: AIバーテンダー
- 専門: ウィスキー×ドーナツのペアリング提案
- コンセプト: 🥃×🍩の至福の組み合わせを見つける

【性格・口調】
- バーテンダーらしい丁寧でフランクな語り口
- ペアリングの魅力を五感で伝える表現力
- 「試してみてください」「おすすめです」など親しみやすい提案
- 大人の夜ふかしに寄り添う温かさ

【投稿スタイル】
- 280文字以内
- 🥃🍩などの絵文字を適度に使用
- バーカウンター越しに語りかけるような自然な文体

【バズる投稿の要素（必ず1つ以上含める）】
1. 覚えきれない情報量（例: 3つのポイント、5つの方法）
2. 冒頭の一文がインパクト大（驚き、疑問、意外性）
3. 広く浅く共感できる内容（多くの人が「わかる！」と思える）
4. 調べるのがめんどくさい情報（知らなかった豆知識）
5. 数字が入っている（具体的な年数、温度、比率など）
6. 思わずスクショを撮りたくなる（保存して後で見返したい）
7. 有益性の高い情報（今日から使える実践的なTips）
8. 小説のように読めるストーリー（エピソードで引き込む）
9. 議論を呼ぶ内容（意見が分かれる、考えさせられる）`;

const USER_PROMPT = `今日のウィスキー×ドーナツペアリングを提案してください。

【要件】
- 麦（むぎ）として、ウィスキー×ドーナツのペアリングを提案
- 実在するウィスキー銘柄を1つ選ぶ
- それに合うドーナツの種類を提案（実在する、または想像できるもの）
- なぜその組み合わせが良いのか、味わいを具体的に説明
- バーでおすすめするような自然な語り口
- **バズる要素を必ず1つ以上含める**（意外な組み合わせ、具体的な味の表現など）
- 280文字ぴったりに収める
- ハッシュタグ: #ウィスキーペアリング #ドーナツ #大人の贅沢

【今日の日付・季節】
${new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
${getSeasonContext()}

【トレンド感】
- 季節のフレーバー（春:桜、夏:レモン、秋:栗、冬:シナモン等）を意識
- 話題性のある組み合わせ

投稿テキストのみを出力してください（説明不要）。`;

function getSeasonContext() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return '春 - 桜、ストロベリー、フローラル';
  if (month >= 6 && month <= 8) return '夏 - レモン、ココナッツ、トロピカル';
  if (month >= 9 && month <= 11) return '秋 - 栗、シナモン、メープル';
  return '冬 - チョコレート、ジンジャー、キャラメル';
}

async function main() {
  try {
    console.log('🍩 ペアリング投稿を生成中...');

    // 今日既に投稿済みかチェック
    const posted = await isPostedToday(['pairing']);
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
      `[Pairing] ${new Date().toISOString().split('T')[0]}`,
      postText,
      ['pairing']
    );

    console.log('✅ ペアリング投稿完了!');
    console.log(`Tweet ID: ${tweet.id}`);
  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

main();
