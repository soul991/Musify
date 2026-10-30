import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const binDir = path.resolve(__dirname, '../bin');

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const isWin = process.platform === 'win32';
// On Linux, always download the standalone PyInstaller binary yt-dlp_linux (never the Python zip script)
const primaryAssetName = isWin ? 'yt-dlp.exe' : 'yt-dlp_linux';

async function fetchChecksums() {
  const sumsUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/SHA2-256SUMS';
  console.log(`[yt-dlp setup] Fetching release checksums from ${sumsUrl}...`);
  const sumsRes = await fetch(sumsUrl, {
    headers: { 'User-Agent': 'Musify-Backend-Setup' },
    redirect: 'follow'
  });

  if (!sumsRes.ok) {
    throw new Error(`Failed to fetch SHA2-256SUMS: HTTP ${sumsRes.status} ${sumsRes.statusText}`);
  }

  const sumsText = await sumsRes.text();
  const hashes = {};
  for (const line of sumsText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const cleanName = parts[1].replace(/^\*/, '');
      hashes[cleanName] = parts[0].toLowerCase();
    }
  }
  return hashes;
}

async function ensureAsset(assetName, checksums) {
  const targetPath = path.join(binDir, assetName);
  const aliasPath = path.join(binDir, 'yt-dlp');
  const expectedHash = checksums[assetName];

  if (!expectedHash) {
    throw new Error(`Could not find expected SHA256 checksum for ${assetName} in release SHA2-256SUMS`);
  }

  // Check if existing file is already valid
  if (fs.existsSync(targetPath)) {
    try {
      const existingBuffer = fs.readFileSync(targetPath);
      const existingHash = crypto.createHash('sha256').update(existingBuffer).digest('hex').toLowerCase();
      if (existingHash === expectedHash) {
        console.log(`[yt-dlp setup] Existing binary at ${targetPath} matches verified SHA256 (${existingHash}).`);
        if (!isWin || assetName !== 'yt-dlp.exe') {
          try {
            fs.chmodSync(targetPath, 0o755);
            if (targetPath !== aliasPath && !isWin) {
              fs.copyFileSync(targetPath, aliasPath);
              fs.chmodSync(aliasPath, 0o755);
            }
          } catch {}
        }
        return;
      }
      console.warn(`[yt-dlp setup] Existing binary hash mismatch (${existingHash} vs ${expectedHash}). Re-downloading...`);
    } catch (readErr) {
      console.warn('[yt-dlp setup] Could not read existing binary:', readErr);
    }
  }

  const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${assetName}`;
  console.log(`[yt-dlp setup] Downloading ${assetName} from ${downloadUrl}...`);
  const assetRes = await fetch(downloadUrl, {
    headers: { 'User-Agent': 'Musify-Backend-Setup' },
    redirect: 'follow'
  });

  if (!assetRes.ok) {
    throw new Error(`Failed to download ${assetName}: HTTP ${assetRes.status} ${assetRes.statusText}`);
  }

  const arrayBuffer = await assetRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const downloadedHash = crypto.createHash('sha256').update(buffer).digest('hex').toLowerCase();
  if (downloadedHash !== expectedHash) {
    throw new Error(`SHA256 verification failed for ${assetName}! Expected: ${expectedHash}, Computed: ${downloadedHash}`);
  }

  console.log(`[yt-dlp setup] SHA256 verified successfully (${downloadedHash}). Saving binary...`);
  fs.writeFileSync(targetPath, buffer);

  if (!isWin || assetName !== 'yt-dlp.exe') {
    try {
      fs.chmodSync(targetPath, 0o755);
      if (targetPath !== aliasPath && !isWin) {
        fs.copyFileSync(targetPath, aliasPath);
        fs.chmodSync(aliasPath, 0o755);
      }
    } catch {}
  }

  console.log(`[yt-dlp setup] yt-dlp binary ready at ${targetPath}.`);
}

async function downloadAndVerify() {
  const checksums = await fetchChecksums();
  
  // Always ensure primary platform asset
  await ensureAsset(primaryAssetName, checksums);

  // If running on Windows, also ensure Linux standalone binary is present for deployment packaging
  if (isWin && !fs.existsSync(path.join(binDir, 'yt-dlp_linux'))) {
    console.log('[yt-dlp setup] Windows build detected: also bundling yt-dlp_linux for cloud container deployment...');
    await ensureAsset('yt-dlp_linux', checksums);
  }
}

downloadAndVerify().catch((err) => {
  console.error('[yt-dlp setup] FATAL error preparing yt-dlp binary:', err?.message || err);
  process.exit(1);
});
