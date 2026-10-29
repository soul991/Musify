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
const assetName = isWin ? 'yt-dlp.exe' : 'yt-dlp_linux';
const targetPath = path.join(binDir, assetName);
const aliasPath = path.join(binDir, isWin ? 'yt-dlp.exe' : 'yt-dlp');

async function downloadAndVerify() {
  const sumsUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/SHA2-256SUMS';
  const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${assetName}`;

  console.log(`[yt-dlp setup] Fetching release checksums from ${sumsUrl}...`);
  const sumsRes = await fetch(sumsUrl, {
    headers: { 'User-Agent': 'Musify-Backend-Setup' },
    redirect: 'follow'
  });

  if (!sumsRes.ok) {
    throw new Error(`Failed to fetch SHA2-256SUMS: HTTP ${sumsRes.status} ${sumsRes.statusText}`);
  }

  const sumsText = await sumsRes.text();
  let expectedHash = '';
  for (const line of sumsText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2 && parts[1].replace(/^\*/, '') === assetName) {
      expectedHash = parts[0].toLowerCase();
      break;
    }
  }

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
        if (!isWin) {
          fs.chmodSync(targetPath, 0o755);
          if (targetPath !== aliasPath) {
            fs.copyFileSync(targetPath, aliasPath);
            fs.chmodSync(aliasPath, 0o755);
          }
        }
        return;
      }
      console.warn(`[yt-dlp setup] Existing binary hash mismatch (${existingHash} vs ${expectedHash}). Re-downloading...`);
    } catch (readErr) {
      console.warn('[yt-dlp setup] Could not read existing binary:', readErr);
    }
  }

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

  if (!isWin) {
    fs.chmodSync(targetPath, 0o755);
    if (targetPath !== aliasPath) {
      fs.copyFileSync(targetPath, aliasPath);
      fs.chmodSync(aliasPath, 0o755);
    }
  }

  console.log(`[yt-dlp setup] yt-dlp standalone binary ready at ${targetPath} (chmod 755).`);
}

downloadAndVerify().catch((err) => {
  console.error('[yt-dlp setup] FATAL error preparing yt-dlp binary:', err?.message || err);
  process.exit(1);
});
