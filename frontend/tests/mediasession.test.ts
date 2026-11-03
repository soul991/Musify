import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

describe('Item 6: MediaSession API Synchronization Verification', () => {
  const playerContextSrc = readFileSync(
    join(__dirname, '../src/context/PlayerContext.tsx'),
    'utf-8'
  );

  it('syncs title, artist, album, and full artwork size spectrum (96 to 512)', () => {
    assert(playerContextSrc.includes('navigator.mediaSession.metadata = new MediaMetadata'));
    assert(playerContextSrc.includes('96x96'));
    assert(playerContextSrc.includes('128x128'));
    assert(playerContextSrc.includes('192x192'));
    assert(playerContextSrc.includes('256x256'));
    assert(playerContextSrc.includes('384x384'));
    assert(playerContextSrc.includes('512x512'));
  });

  it('handles play, pause, stop, previoustrack, nexttrack, seekto, seekbackward, seekforward', () => {
    const actions = ['play', 'pause', 'stop', 'previoustrack', 'nexttrack', 'seekto', 'seekbackward', 'seekforward'];
    for (const action of actions) {
      assert(playerContextSrc.includes(`'${action}'`), `Action ${action} must be bound`);
    }
  });

  it('synchronizes navigator.mediaSession.playbackState for lock screen / bluetooth', () => {
    assert(playerContextSrc.includes("navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'"));
  });

  it('safely synchronizes navigator.mediaSession.setPositionState', () => {
    assert(playerContextSrc.includes('navigator.mediaSession.setPositionState'));
  });
});
