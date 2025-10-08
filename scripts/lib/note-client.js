import { chromium } from 'playwright';
import fs from 'fs/promises';
import { MUGI_SYSTEM_PROMPT } from './mugi-prompt.js';

/**
 * note.com に記事を投稿
 * @param {string} title - 記事タイトル
 * @param {string} content - 記事本文（Markdown）
 * @param {boolean} isPublic - 公開設定（true: 公開, false: 下書き）
 * @returns {Promise<string>} 投稿URL
 */
export async function postToNote(title, content, isPublic = true) {
  // GitHub Secrets から storageState を取得
  const storageStateJson = process.env.NOTE_STORAGE_STATE_JSON;

  if (!storageStateJson) {
    throw new Error('NOTE_STORAGE_STATE_JSON が設定されていません');
  }

  const storageState = JSON.parse(storageStateJson);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    storageState,
  });

  const page = await context.newPage();

  try {
    // note の新規投稿ページを開く
    await page.goto('https://note.com/new', { waitUntil: 'networkidle' });

    // タイトル入力
    await page.fill('textarea[placeholder="タイトル"]', title);
    await page.waitForTimeout(1000);

    // 本文入力
    await page.fill('textarea[placeholder="本文を入力"]', content);
    await page.waitForTimeout(2000);

    if (isPublic) {
      // 公開ボタンをクリック
      await page.click('button:has-text("公開する")');
      await page.waitForTimeout(2000);

      // 確認ダイアログで公開
      await page.click('button:has-text("公開")');
      await page.waitForTimeout(3000);

      console.log('✅ note に記事を公開しました');
    } else {
      // 下書き保存
      await page.click('button:has-text("下書き保存")');
      await page.waitForTimeout(2000);

      console.log('✅ note に下書きを保存しました');
    }

    // 投稿後のURLを取得
    const url = page.url();

    await browser.close();

    return url;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

/**
 * Claude で note 記事を生成
 * @param {string} theme - 記事テーマ
 * @param {Function} generateText - Claude API 関数
 * @returns {Promise<{title: string, content: string}>}
 */
export async function generateNoteArticle(theme, generateText) {
  const USER_PROMPT = `以下のテーマでnote記事を執筆してください。

【テーマ】
${theme}

【note記事の追加要件】
- タイトルは魅力的で具体的に（数字や具体例を含める）
- 本文は2000-3000文字
- Markdown形式で出力
- 見出し（##）を3-5個使用
- 具体的なエピソードや体験談を交える
- 初心者でも分かりやすく、でも深い内容
- **バズる要素を複数含める**（リスト形式、具体的な数字、保存したくなる情報）

【構成】
1. 導入（バーでの会話のような語りかけ）
2. 本論（具体的な内容、実例、ペアリング提案）
3. まとめ（読者へのメッセージ、試してほしい提案）

以下のJSON形式で出力してください：
\`\`\`json
{
  "title": "記事タイトル",
  "content": "Markdown形式の本文"
}
\`\`\``;

  const response = await generateText(MUGI_SYSTEM_PROMPT, USER_PROMPT, 4096);

  // JSON部分を抽出
  const jsonMatch = response.match(/```json\n([\s\S]+?)\n```/);
  if (!jsonMatch) {
    throw new Error('記事生成に失敗しました（JSON形式が不正）');
  }

  const article = JSON.parse(jsonMatch[1]);

  return {
    title: article.title,
    content: article.content,
  };
}
