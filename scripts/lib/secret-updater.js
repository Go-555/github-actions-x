import sodium from 'libsodium-wrappers';

/**
 * GitHub Secrets を更新する
 * @param {string} secretName - Secret名
 * @param {string} secretValue - 新しい値
 */
export async function updateGitHubSecret(secretName, secretValue) {
  const token = process.env.GITHUB_TOKEN || process.env.SECRET_UPDATE_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;

  if (!token) {
    console.log('⚠️  GITHUB_TOKEN が設定されていないため、Secret更新をスキップします');
    return;
  }

  if (!repository) {
    console.log('⚠️  GITHUB_REPOSITORY が設定されていないため、Secret更新をスキップします');
    return;
  }

  const [owner, repo] = repository.split('/');

  try {
    console.log(`🔐 GitHub Secret "${secretName}" を更新中...`);

    // 1. リポジトリの公開鍵を取得
    const pubKeyResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!pubKeyResponse.ok) {
      const error = await pubKeyResponse.text();
      throw new Error(`公開鍵取得失敗: ${pubKeyResponse.status} ${error}`);
    }

    const { key, key_id } = await pubKeyResponse.json();

    // 2. Sodium で暗号化
    await sodium.ready;
    const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
    const binsec = sodium.from_string(secretValue);
    const encBytes = sodium.crypto_box_seal(binsec, binkey);
    const encrypted_value = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

    // 3. Secret を更新
    const updateResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${secretName}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encrypted_value,
          key_id,
        }),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Secret更新失敗: ${updateResponse.status} ${error}`);
    }

    console.log(`✅ GitHub Secret "${secretName}" を更新しました`);
  } catch (error) {
    console.error(`❌ Secret更新エラー:`, error.message);
    // エラーでも処理は継続（Secret更新は必須ではない）
  }
}
