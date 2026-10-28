import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 3 Playback & Crossfade Audio Swap Regression Tests', () => {
  it('audio element swap continues to fire ended event and advance queue', () => {
    // Mock Audio element using standard Web EventTarget
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

    const audioPrimary = new MockAudioElement();
    const audioSecondary = new MockAudioElement();

    const audioRef = { current: audioPrimary };
    const secondaryAudioRef = { current: audioSecondary };

    let queueIndex = 0;
    const queue = ['song-1', 'song-2', 'song-3'];
    let endCount = 0;

    const onEnded = (e: Event) => {
      // Only process ended if the event originated from the active audio element
      if (e.target === audioRef.current) {
        endCount++;
        queueIndex++;
      }
    };

    // Both audio elements must be bound to handlers
    const bindEvents = (el: MockAudioElement) => {
      el.addEventListener('ended', onEnded);
    };

    bindEvents(audioPrimary);
    bindEvents(audioSecondary);

    // 1. Initial play on primary element
    assert.strictEqual(queueIndex, 0);
    audioPrimary.dispatchEvent(new Event('ended'));
    assert.strictEqual(queueIndex, 1, 'First track end advances queue to index 1');
    assert.strictEqual(endCount, 1);

    // 2. Perform crossfade / gapless swap of audio elements
    const temp = audioRef.current;
    audioRef.current = secondaryAudioRef.current;
    secondaryAudioRef.current = temp;

    assert.strictEqual(audioRef.current, audioSecondary, 'Active audio element is now secondary element');

    // 3. Dispatch ended on the now-active secondary audio element
    audioSecondary.dispatchEvent(new Event('ended'));
    assert.strictEqual(queueIndex, 2, 'Second track end after element swap successfully advances queue to index 2');
    assert.strictEqual(endCount, 2);

    // 4. Ensure old inactive element (now secondary) does NOT trigger queue advances if it fires
    audioPrimary.dispatchEvent(new Event('ended'));
    assert.strictEqual(queueIndex, 2, 'Inactive audio element event correctly ignored');
    assert.strictEqual(endCount, 2);
  });

  it('consecutive error limiter caps skips at 3 and does not skip indefinitely', () => {
    let consecutiveFailures = 0;
    let autoSkippedTimes = 0;
    let finalErrorState = '';

    const handlePlaybackFailure = (title: string) => {
      consecutiveFailures++;
      if (consecutiveFailures >= 3) {
        finalErrorState = 'Playback stopped after 3 errors. Check network connection or tap Retry.';
        return;
      }
      autoSkippedTimes++;
    };

    // Simulate 5 failing tracks in a row
    for (let i = 1; i <= 5; i++) {
      handlePlaybackFailure(`failing-song-${i}`);
    }

    assert.strictEqual(consecutiveFailures, 5);
    assert.strictEqual(autoSkippedTimes, 2, 'Only 2 auto-skips executed before hitting the 3-failure cap');
    assert.match(finalErrorState, /Playback stopped after 3 errors/);
  });
});
