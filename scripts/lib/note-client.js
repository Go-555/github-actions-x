import { chromium } from 'playwright';
import fs from 'fs/promises';

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
  const SYSTEM_PROMPT = `あなたは「Whiskey AI Agent」のライターです。
ウィスキーとドーナツのペアリング文化を広めるための記事を執筆します。

【ライティングスタイル】
- 読みやすく、親しみやすい文章
- 具体的なエピソードや体験談を交える
- 初心者でも分かりやすく、でも深い内容
- 2000-3000文字程度

【構成】
1. 導入（読者の興味を引く）
2. 本論（具体的な内容、実例）
3. まとめ（アクションにつながる提案）`;

  const USER_PROMPT = `以下のテーマでnote記事を執筆してください。

【テーマ】
${theme}

【要件】
- タイトルは魅力的で具体的に
- 本文は2000-3000文字
- Markdown形式で出力
- 見出し（##）を3-5個使用
- 具体例を豊富に

以下のJSON形式で出力してください：
\`\`\`json
{
  "title": "記事タイトル",
  "content": "Markdown形式の本文"
}
\`\`\``;

  const response = await generateText(SYSTEM_PROMPT, USER_PROMPT, 4096);

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
