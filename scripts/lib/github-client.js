import { Octokit } from '@octokit/rest';

/**
 * GitHub API クライアントを初期化
 */
export function createGitHubClient() {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
}

/**
 * 投稿履歴を GitHub Issues に記録
 * @param {string} title - Issue タイトル
 * @param {string} body - 投稿内容
 * @param {Array<string>} labels - ラベル
 * @returns {Promise<object>} 作成された Issue
 */
export async function recordPost(title, body, labels = []) {
  const octokit = createGitHubClient();

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

  const issue = await octokit.issues.create({
    owner,
    repo,
    title,
    body: `## 投稿内容\n\n${body}\n\n## 投稿日時\n\n${new Date().toISOString()}`,
    labels: ['posted', ...labels],
  });

  console.log('📝 投稿履歴を記録:', issue.data.number);
  return issue.data;
}

/**
 * 特定のラベルを持つ Issue を取得（重複チェック用）
 * @param {Array<string>} labels - 検索するラベル
 * @returns {Promise<Array>} Issue 一覧
 */
export async function getPostedIssues(labels = []) {
  const octokit = createGitHubClient();

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

  const { data } = await octokit.issues.listForRepo({
    owner,
    repo,
    labels: ['posted', ...labels].join(','),
    state: 'all',
    per_page: 100,
  });

  return data;
}

/**
 * 今日既に投稿済みかチェック
 * @param {Array<string>} labels - チェックするラベル
 * @returns {Promise<boolean>} 投稿済みならtrue
 */
export async function isPostedToday(labels = []) {
  const issues = await getPostedIssues(labels);

  const today = new Date().toISOString().split('T')[0];

  return issues.some(issue => {
    const issueDate = new Date(issue.created_at).toISOString().split('T')[0];
    return issueDate === today;
  });
}

/**
 * 特定のコンテンツが既に投稿済みかチェック
 * @param {string} content - チェックする内容（タイトルや本文の一部）
 * @param {Array<string>} labels - チェックするラベル
 * @returns {Promise<boolean>} 投稿済みならtrue
 */
export async function isContentPosted(content, labels = []) {
  const issues = await getPostedIssues(labels);

  return issues.some(issue => {
    return issue.title.includes(content) || issue.body.includes(content);
  });
}

/**
 * 投稿済みコンテンツのリストを取得
 * @param {Array<string>} labels - チェックするラベル
 * @returns {Promise<Array<string>>} 投稿済みタイトル一覧
 */
export async function getPostedTitles(labels = []) {
  const issues = await getPostedIssues(labels);

  return issues.map(issue => {
    // [Type] Title - Date の形式からTitleを抽出
    const match = issue.title.match(/\[.+?\] (.+?) -/);
    return match ? match[1] : issue.title;
  });
}
