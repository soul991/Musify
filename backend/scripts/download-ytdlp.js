import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const binDir = path.resolve(__dirname, '../bin');

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const isWin = process.platform === 'win32';
const filename = isWin ? 'yt-dlp.exe' : 'yt-dlp';
const targetPath = path.join(binDir, filename);

// Also support yt-dlp_linux name on Linux
const linuxPath = path.join(binDir, 'yt-dlp_linux');

async function downloadBinary() {
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 1000000) {
    console.log(`yt-dlp binary already present at ${targetPath}`);
    return;
  }

  const url = isWin
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

  console.log(`Downloading yt-dlp from ${url}...`);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Musify-Backend-Setup'
      },
      redirect: 'follow'
    });

    if (!res.ok) {
      console.warn(`Failed to download yt-dlp: HTTP ${res.status} ${res.statusText}`);
      return;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(targetPath, buffer);

    if (!isWin) {
      try {
        fs.chmodSync(targetPath, 0o755);
        if (!fs.existsSync(linuxPath)) {
          fs.copyFileSync(targetPath, linuxPath);
          fs.chmodSync(linuxPath, 0o755);
        }
      } catch (err) {
        console.warn('Could not set chmod +x on yt-dlp binary:', err);
      }
    }

    console.log(`yt-dlp successfully downloaded to ${targetPath} (${buffer.length} bytes)`);
  } catch (err) {
    console.warn('Error downloading yt-dlp (will fallback to system PATH if available):', err?.message || err);
  }
}

downloadBinary().catch((err) => {
  console.warn('download-ytdlp script caught error:', err?.message || err);
});
