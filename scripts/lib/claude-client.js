import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Claude API クライアントを初期化
 */
export function createClaudeClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

/**
 * Claude にプロンプトを送信してテキスト生成
 * @param {string} systemPrompt - システムプロンプト
 * @param {string} userPrompt - ユーザープロンプト
 * @param {number} maxTokens - 最大トークン数
 * @returns {Promise<string>} 生成されたテキスト
 */
export async function generateText(systemPrompt, userPrompt, maxTokens = 1024) {
  const client = createClaudeClient();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  return message.content[0].text;
}

/**
 * レジェンドデータを読み込み
 * @returns {Promise<Array>} レジェンド一覧
 */
export async function loadLegends() {
  const legendsPath = path.join(__dirname, '../../data/legends.json');
  const data = await fs.readFile(legendsPath, 'utf-8');
  return JSON.parse(data).legends;
}
