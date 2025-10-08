#!/usr/bin/env node

import 'dotenv/config';
import { generateText, loadLegends } from './lib/claude-client.js';
import { postToX } from './lib/x-client.js';
import { recordPost, isPostedToday } from './lib/github-client.js';
import { MUGI_SYSTEM_PROMPT } from './lib/mugi-prompt.js';

async function main() {
  try {
    console.log('🎩 レジェンド対話投稿を生成中...');

    // 今日既に投稿済みかチェック
    const posted = await isPostedToday(['legend']);
    if (posted) {
      console.log('⚠️  今日は既に投稿済みです');
      process.exit(0);
    }

    // レジェンドをランダム選択
    const legends = await loadLegends();
    const legend = legends[Math.floor(Math.random() * legends.length)];

    console.log(`選ばれたレジェンド: ${legend.name}`);

    const USER_PROMPT = `${legend.name}さんのお話を紹介する投稿を作成してください。

【レジェンド情報】
- 名前: ${legend.name}（${legend.name_en}）
- ${legend.title}
- 生年: ${legend.birth_year}年${legend.death_year ? ` - ${legend.death_year}年` : ' - 現在'}
- 蒸溜所: ${legend.distillery}
- 代表作: ${legend.signature_whisky}

【主な功績】
${legend.achievements.map(a => `- ${a}`).join('\n')}

【名言】
${legend.quotes.map(q => `"${q}"`).join('\n')}

【レジェンドの性格・話し方】
${legend.personality}
${legend.speaking_style}


【要件】
- 日本語は140文字以内厳守（日本語はAPI上2文字カウントのため）
- 麦が${legend.name}さんについて語るスタイル
- 「${legend.name}さんはこんなことを言っていました」のような紹介形式
- ${legend.name}さんの哲学やエピソードを引用
- **バズる要素を含める**（具体的な年数、感動的なエピソード、名言など）
- ハッシュタグ: #${legend.distillery} #日本のウィスキー #ウィスキーの父

【バズる投稿の要素（必ず1つ以上含める）】
- 具体的な数字や年代
- 感動的なストーリー
- 思わずメモしたくなる名言
- 知らなかった歴史的エピソード

【今日の日付】
${new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}

投稿テキストのみを出力してください（説明不要）。`;

    // Claude で投稿テキスト生成
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
      `[Legend] ${legend.name} - ${new Date().toISOString().split('T')[0]}`,
      `**レジェンド**: ${legend.name}\n\n${postText}`,
      ['legend', legend.id]
    );

    console.log('✅ レジェンド対話投稿完了!');
    console.log(`Tweet ID: ${tweet.id}`);
  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

main();
