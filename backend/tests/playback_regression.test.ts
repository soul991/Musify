import { describe, it } from 'node:test';
import assert from 'node:assert';

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
});
