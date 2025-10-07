#!/usr/bin/env node

/**
 * note.com ログイン用スクリプト
 * ブラウザを開いてログイン後、storageStateを保存
 *
 * 使い方:
 * 1. npm run login:note を実行
 * 2. ブラウザでnote.comにログイン
 * 3. Enter キーを押すと storageState が保存される
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, '../../.note-state.json');

async function main() {
  console.log('🔐 note.com ログインを開始します...');
  console.log('');

  const browser = await chromium.launch({
    headless: false, // ブラウザを表示
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // note.com ログインページを開く
  await page.goto('https://note.com/login');

  console.log('ブラウザが開きました。');
  console.log('note.comにログインしてください。');
  console.log('');
  console.log('ログイン完了後、このターミナルで Enter キーを押してください...');

  // ユーザーの入力を待つ
  await new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.on('line', () => {
      rl.close();
      resolve();
    });
  });

  // storageStateを保存
  const storageState = await context.storageState();
  await fs.writeFile(STATE_FILE, JSON.stringify(storageState, null, 2));

  console.log('');
  console.log('✅ ログイン状態を保存しました!');
  console.log(`保存先: ${STATE_FILE}`);
  console.log('');
  console.log('📝 次のステップ:');
  console.log('1. .note-state.json の内容をコピー');
  console.log('2. GitHub Secrets に NOTE_STORAGE_STATE_JSON として登録');
  console.log('   (ファイル全体をJSON文字列として登録)');
  console.log('');

  await browser.close();
}

main().catch(error => {
  console.error('❌ エラー:', error);
  process.exit(1);
});
