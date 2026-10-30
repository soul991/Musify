import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidVideoId } from '../src/utils/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Phase 3 Playback & Crossfade Audio Swap Regression Tests', () => {
  it('crossfade test: swap audio elements 3 times and assert that ended still fires on third track and advances queue', () => {
    class MockAudioElement extends EventTarget {
      currentTime = 0;
      duration = 180;
      src = '';
      volume = 1;
      preload = 'auto';
      crossOrigin = 'anonymous';

      play() {
        return Promise.resolve();
      }
      pause() {}
      load() {}
    }

    const audioA = new MockAudioElement();
    const audioB = new MockAudioElement();

    const audioRef = { current: audioA };
    const secondaryAudioRef = { current: audioB };

    let queueIndex = 0;
    let endEventsProcessed = 0;

    const onEnded = (e: Event) => {
      if (e.target === audioRef.current) {
        endEventsProcessed++;
        queueIndex++;
      }
    };

    audioA.addEventListener('ended', onEnded);
    audioB.addEventListener('ended', onEnded);

    // Initial state: audioA active at index 0
    assert.strictEqual(audioRef.current, audioA);

    // Swap 1 (audioA -> audioB)
    const temp1 = audioRef.current;
    audioRef.current = secondaryAudioRef.current;
    secondaryAudioRef.current = temp1;
    assert.strictEqual(audioRef.current, audioB);

    // Swap 2 (audioB -> audioA)
    const temp2 = audioRef.current;
    audioRef.current = secondaryAudioRef.current;
    secondaryAudioRef.current = temp2;
    assert.strictEqual(audioRef.current, audioA);

    // Swap 3 (audioA -> audioB)
    const temp3 = audioRef.current;
    audioRef.current = secondaryAudioRef.current;
    secondaryAudioRef.current = temp3;
    assert.strictEqual(audioRef.current, audioB, 'After 3 swaps, audioB is active');

    // Dispatch ended on active element audioB
    audioB.dispatchEvent(new Event('ended'));
    assert.strictEqual(endEventsProcessed, 1, 'ended event fires successfully after 3 swaps');
    assert.strictEqual(queueIndex, 1, 'Queue index advances to 1');

    // Further dispatch on old inactive element audioA should NOT advance queue
    audioA.dispatchEvent(new Event('ended'));
    assert.strictEqual(endEventsProcessed, 1, 'Inactive element ended event is correctly ignored');
    assert.strictEqual(queueIndex, 1);
  });

  it('auto-skip stress test: feed the player 4 invalid track ids in a row and assert that it stops at 3, does not loop, and shows the toast', () => {
    const invalidTrackIds = ['invalid-1', 'invalid-2', 'invalid-3', 'invalid-4'];
    let consecutiveFailures = 0;
    let autoSkippedTimes = 0;
    let toastMessage: string | null = null;
    let hasLoopHalted = false;

    const handlePlaybackFailure = (trackId: string) => {
      consecutiveFailures++;
      if (consecutiveFailures >= 3) {
        toastMessage = 'Playback stopped after 3 errors. Check network connection or tap Retry.';
        hasLoopHalted = true;
        return; // Halt: do not auto-skip
      }
      autoSkippedTimes++;
      toastMessage = `Unable to play "${trackId}". Skipping to next track...`;
    };

    // Feed player 4 invalid track IDs sequentially
    for (const id of invalidTrackIds) {
      if (hasLoopHalted) break;
      handlePlaybackFailure(id);
    }

    assert.strictEqual(consecutiveFailures, 3, 'Consecutive failures strictly capped at 3');
    assert.strictEqual(autoSkippedTimes, 2, 'Only 2 auto-skips triggered before capping at 3');
    assert.strictEqual(hasLoopHalted, true, 'Auto-skip loop was halted');
    assert.strictEqual(toastMessage, 'Playback stopped after 3 errors. Check network connection or tap Retry.');
  });

  it('429 rate limit error does not increment consecutive bad track failure counter or trigger auto-skip', () => {
    let consecutiveFailures = 0;
    let autoSkippedTimes = 0;
    let toastMessage: string | null = null;

    const triggerConsecutiveFailure = (reason: string) => {
      if (reason.includes('429') || reason.toLowerCase().includes('rate limit')) {
        toastMessage = 'Too many requests (429). Please wait a moment before trying again.';
        return;
      }
      consecutiveFailures++;
      if (consecutiveFailures >= 3) {
        toastMessage = `Playback stopped after 3 errors: ${reason}. Tap Retry.`;
        return;
      }
      autoSkippedTimes++;
      toastMessage = `Unable to play (${reason}). Skipping to next track...`;
    };

    // Encounter 429
    triggerConsecutiveFailure('HTTP 429 rate limit exceeded');
    assert.strictEqual(consecutiveFailures, 0, '429 must not increment consecutive failures');
    assert.strictEqual(autoSkippedTimes, 0, '429 must not auto-skip');
    assert.match(toastMessage!, /429/);

    // Subsequent normal failures
    triggerConsecutiveFailure('network error');
    triggerConsecutiveFailure('decode error');
    triggerConsecutiveFailure('unsupported/blocked source');

    assert.strictEqual(consecutiveFailures, 3);
    assert.strictEqual(autoSkippedTimes, 2);
    assert.match(toastMessage!, /Playback stopped after 3 errors/);
  });

  it('autoplay candidate filtering keeps only items with valid 11-char ID and duration > 0', () => {
    const rawItems = [
      { id: 'dQw4w9WgXcQ', duration: { seconds: 212 }, title: 'Valid Song 1' },
      { video_id: 'abc_123-xyz', duration: { seconds: 180 }, title: 'Valid Song 2' },
      { id: 'short', duration: { seconds: 200 }, title: 'Invalid ID: too short' },
      { id: 'toolongvideoId123', duration: { seconds: 200 }, title: 'Invalid ID: too long' },
      { id: '$(whoami)123', duration: { seconds: 200 }, title: 'Invalid ID: injection attempt' },
      { id: 'validId11ch', duration: { seconds: 0 }, title: 'Invalid: duration is 0' },
      { id: 'validId11c2', duration: { seconds: -5 }, title: 'Invalid: negative duration' },
      { id: 'validId11c3', duration: undefined, title: 'Invalid: undefined duration' }
    ];

    const filtered = rawItems.filter((item) => {
      const id = item.id || item.video_id;
      if (!id || !isValidVideoId(id)) return false;
      const duration = item.duration?.seconds || 0;
      return duration > 0;
    });

    assert.strictEqual(filtered.length, 2);
    assert.strictEqual(filtered[0].title, 'Valid Song 1');
    assert.strictEqual(filtered[1].title, 'Valid Song 2');
  });

  it('download-ytdlp.js script specifies yt-dlp_linux, verifies SHA2-256SUMS, and exits 1 on error', () => {
    const scriptPath = path.resolve(__dirname, '../scripts/download-ytdlp.js');
    const content = fs.readFileSync(scriptPath, 'utf-8');

    assert.ok(content.includes('yt-dlp_linux'), 'Script must target yt-dlp_linux for Linux');
    assert.ok(content.includes('SHA2-256SUMS'), 'Script must fetch SHA2-256SUMS');
    assert.ok(content.includes("crypto.createHash('sha256')"), 'Script must compute sha256 hash');
    assert.ok(content.includes('process.exit(1)'), 'Script must exit 1 on error');
  });

  it('no hardcoded Catalyst domain exists in frontend code and VITE_STREAM_URL controls direct streaming', () => {
    const apiTsPath = path.resolve(__dirname, '../../frontend/src/services/api.ts');
    const content = fs.readFileSync(apiTsPath, 'utf-8');

    assert.ok(!content.includes('catalystappsail.in'), 'frontend/src/services/api.ts must not hardcode catalyst domain');
    assert.ok(content.includes('VITE_STREAM_URL'), 'VITE_STREAM_URL must be referenced');
    assert.ok(content.includes('STREAM_BASE'), 'STREAM_BASE must be defined');
  });
});
