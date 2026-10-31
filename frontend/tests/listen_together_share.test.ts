import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

describe('Fix 1: Listen Together Share Link & ?room= Route Handling', () => {
  const listenTogetherPath = path.join(frontendRoot, 'src', 'pages', 'ListenTogetherView.tsx');
  const appPath = path.join(frontendRoot, 'src', 'App.tsx');

  it('reads real source and proves the copied share link starts with /app?room=', () => {
    assert.ok(fs.existsSync(listenTogetherPath), 'ListenTogetherView.tsx must exist');
    const source = fs.readFileSync(listenTogetherPath, 'utf8');

    // Find the clipboard write call
    const clipboardMatch = source.match(/navigator\.clipboard\.writeText\(([`"'].*?[`"'])\)/);
    assert.ok(clipboardMatch, 'Must find navigator.clipboard.writeText call in ListenTogetherView.tsx');

    const copiedLinkExpression = clipboardMatch[1];

    // Must not be a hard-coded Netlify or external domain
    assert.doesNotMatch(
      copiedLinkExpression,
      /https:\/\/musify-live\.netlify\.app/,
      'Must NOT contain hard-coded domain https://musify-live.netlify.app'
    );

    // Must not point to the root landing page /?room=
    assert.doesNotMatch(
      copiedLinkExpression,
      /([`"'])\/\?room=/,
      'Must NOT point to root /?room= as / is now the landing page'
    );

    // Must use dynamic window.location.origin and point to /app?room=${roomCode}
    assert.match(
      copiedLinkExpression,
      /`\$\{window\.location\.origin\}\/app\?room=\$\{roomCode\}`/,
      'Share link must be `${window.location.origin}/app?room=${roomCode}`'
    );
  });

  it('reads App.tsx and proves ?room= URL parameter is parsed, sanitized, and cleaned with replaceState', () => {
    assert.ok(fs.existsSync(appPath), 'App.tsx must exist');
    const appSource = fs.readFileSync(appPath, 'utf8');

    // Checks for ?room= parsing
    assert.match(
      appSource,
      /new\s+URLSearchParams\(window\.location\.search\)/,
      'App.tsx must parse window.location.search'
    );
    assert.match(
      appSource,
      /\.get\(['"]room['"]\)/,
      'App.tsx must query "room" parameter'
    );

    // Checks for sanitization: uppercase, alphanumeric stripping, slice
    assert.match(
      appSource,
      /replace\(\/\[\^A-Z0-9\]\/g,\s*['"]['"]\)/,
      'App.tsx must sanitize room code using uppercase alphanumeric filter'
    );

    // Checks for window.history.replaceState
    assert.match(
      appSource,
      /window\.history\.replaceState/,
      'App.tsx must remove the ?room= parameter using history.replaceState'
    );

    // Checks that initialRoomCode is passed to ListenTogetherView
    assert.match(
      appSource,
      /<ListenTogetherView[^>]*initialRoomCode=/,
      'App.tsx must pass initialRoomCode to ListenTogetherView'
    );
  });
});
