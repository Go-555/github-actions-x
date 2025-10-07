#!/usr/bin/env node

import 'dotenv/config';
import { generateText } from './lib/claude-client.js';
import { generateNoteArticle, postToNote } from './lib/note-client.js';
import { postToX } from './lib/x-client.js';
import { recordPost, getPostedIssues } from './lib/github-client.js';

// note 記事テーマ候補
const ARTICLE_THEMES = [
  'ウィスキー初心者が知っておくべき5つの基本知識',
  'ハイボールを最高に美味しく作る3つの秘訣',
  'ドーナツとウィスキーのペアリング入門',
  '日本のウィスキー三大レジェンドの物語',
  '秋の夜長に楽しみたいウィスキー5選',
  '自宅で楽しむウィスキーテイスティング入門',
  'ウィスキーの香りを楽しむための器選び',
  'スコッチ、バーボン、ジャパニーズの違いとは',
  '山崎、余市、白州 - 蒸溜所ごとの個性を知る',
  'ウィスキーロックの氷にこだわる理由',
];

async function selectTheme() {
  // 過去に投稿したテーマを取得
  const postedIssues = await getPostedIssues(['note']);

  const postedThemes = postedIssues.map(issue => {
    const match = issue.title.match(/\[Note\] (.+) -/);
    return match ? match[1] : null;
  }).filter(Boolean);

  // 未投稿のテーマを選択
  const unpostedThemes = ARTICLE_THEMES.filter(
    theme => !postedThemes.includes(theme)
  );

  if (unpostedThemes.length === 0) {
    console.log('⚠️  すべてのテーマが投稿済みです。ランダムに選択します。');
    return ARTICLE_THEMES[Math.floor(Math.random() * ARTICLE_THEMES.length)];
  }

  // ランダムに選択
  return unpostedThemes[Math.floor(Math.random() * unpostedThemes.length)];
}

async function main() {
  try {
    console.log('📝 note 記事を生成中...');

    // テーマを選択
    const theme = await selectTheme();
    console.log(`選択されたテーマ: ${theme}`);

    // Claude で記事生成
    const { title, content } = await generateNoteArticle(theme, generateText);

    console.log('生成された記事:');
    console.log('---');
    console.log(`タイトル: ${title}`);
    console.log(`文字数: ${content.length}文字`);
    console.log('---');

    // note に投稿
    const noteUrl = await postToNote(title, content, true);

    console.log(`✅ note 記事を公開しました: ${noteUrl}`);

    // X でシェア
    const tweetText = `📝 新着記事を公開しました！\n\n「${title}」\n\n${noteUrl}\n\n#ウィスキー #note #大人の時間`;

    if (tweetText.length <= 280) {
      await postToX(tweetText);
      console.log('✅ X でシェアしました');
    } else {
      console.log('⚠️  ツイートが280文字を超えたためスキップ');
    }

    // GitHub Issues に記録
    await recordPost(
      `[Note] ${theme} - ${new Date().toISOString().split('T')[0]}`,
      `**テーマ**: ${theme}\n**タイトル**: ${title}\n**URL**: ${noteUrl}\n\n${content.substring(0, 500)}...`,
      ['note']
    );

    console.log('✅ note 投稿完了!');
  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

main();
