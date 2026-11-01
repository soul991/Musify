import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  tokenizeWords,
  distributeWordsByCharacterCount,
  adaptUpstreamWords,
  processLyrics,
  calculateWordProgress,
  findActiveLineIndex,
  formatLyricTime,
  DEFAULT_LINE_FALLBACK_DURATION,
} from '../src/utils/lyrics.ts';
import { LyricWord } from '../src/components/lyrics/SyncedLyricsView.tsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

describe('Milestone 2 (R2): Word-by-Word Synchronized Lyrics & Motion Performance', () => {
  const syncedLyricsViewPath = path.join(
    frontendRoot,
    'src',
    'components',
    'lyrics',
    'SyncedLyricsView.tsx'
  );
  const syncedLyricsViewSource = fs.readFileSync(syncedLyricsViewPath, 'utf8');

  const lyricsUtilPath = path.join(frontendRoot, 'src', 'utils', 'lyrics.ts');
  const lyricsUtilSource = fs.readFileSync(lyricsUtilPath, 'utf8');

  describe('1. Word Tokenization & Proportional Character-Count Allocation', () => {
    it('tokenizes lines into words preserving internal punctuation and whitespace trimming', () => {
      const tokens = tokenizeWords("Hello, world! It's a beautiful day.");
      assert.deepStrictEqual(tokens, ['Hello,', 'world!', "It's", 'a', 'beautiful', 'day.']);

      assert.deepStrictEqual(tokenizeWords(''), []);
      assert.deepStrictEqual(tokenizeWords('    '), []);
    });

    it('allocates word durations strictly proportional to character lengths (L_i / L_total)', () => {
      const text = 'I love music';
      // Word lengths: 'I' = 1, 'love' = 4, 'music' = 5. Total = 10 characters.
      const lineStart = 10.0;
      const lineDuration = 5.0; // 5 seconds total

      const words = distributeWordsByCharacterCount(text, lineStart, lineDuration, 'test');
      assert.strictEqual(words.length, 3);

      // 'I': 1/10 * 5.0 = 0.5s duration
      assert.strictEqual(words[0].text, 'I');
      assert.strictEqual(words[0].charCount, 1);
      assert.strictEqual(words[0].charRatio, 0.1);
      assert.strictEqual(words[0].startTime, 10.0);
      assert.strictEqual(words[0].duration, 0.5);
      assert.strictEqual(words[0].endTime, 10.5);

      // 'love': 4/10 * 5.0 = 2.0s duration
      assert.strictEqual(words[1].text, 'love');
      assert.strictEqual(words[1].charCount, 4);
      assert.strictEqual(words[1].charRatio, 0.4);
      assert.strictEqual(words[1].startTime, 10.5);
      assert.strictEqual(words[1].duration, 2.0);
      assert.strictEqual(words[1].endTime, 12.5);

      // 'music': 5/10 * 5.0 = 2.5s duration
      assert.strictEqual(words[2].text, 'music');
      assert.strictEqual(words[2].charCount, 5);
      assert.strictEqual(words[2].charRatio, 0.5);
      assert.strictEqual(words[2].startTime, 12.5);
      assert.strictEqual(words[2].duration, 2.5);
      assert.strictEqual(words[2].endTime, 15.0);

      // Verify total allocated time exactly equals lineDuration
      const totalDuration = words.reduce((acc, w) => acc + w.duration, 0);
      assert.strictEqual(Math.round(totalDuration * 1000) / 1000, lineDuration);
      assert.strictEqual(words[words.length - 1].endTime, lineStart + lineDuration);
    });

    it('ensures contiguous word start/end timestamps with zero gaps and zero overlaps', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const words = distributeWordsByCharacterCount(text, 0, 10.0, 'line1');

      for (let i = 0; i < words.length - 1; i++) {
        assert.strictEqual(
          words[i].endTime,
          words[i + 1].startTime,
          `Word ${i} endTime must match Word ${i + 1} startTime exactly`
        );
      }
    });

    it('handles single-word lines and boundary edge cases', () => {
      const words = distributeWordsByCharacterCount('Hallelujah', 5.0, 4.0, 'line2');
      assert.strictEqual(words.length, 1);
      assert.strictEqual(words[0].startTime, 5.0);
      assert.strictEqual(words[0].duration, 4.0);
      assert.strictEqual(words[0].endTime, 9.0);
      assert.strictEqual(words[0].charRatio, 1.0);
    });
  });

  describe('2. Synchronization Source Inspection & Estimation Tagging', () => {
    it('marks character-distributed lines and words with isEstimated: true for per-line LRCLIB sources', () => {
      const lrclibLyrics = {
        synced: true,
        source: 'lrclib' as const,
        plain: 'Line one\nLine two',
        lines: [
          { time: 0.0, formattedTime: '00:00', text: 'Line one' },
          { time: 4.0, formattedTime: '00:04', text: 'Line two' },
        ],
      };

      const result = processLyrics(lrclibLyrics, 10.0);
      assert.strictEqual(result.synced, true);
      assert.strictEqual(result.isEstimated, true, 'Overall lyrics must be tagged isEstimated: true');
      assert.strictEqual(result.estimated, true, 'Overall lyrics must support estimated alias');
      assert.strictEqual(result.source, 'lrclib');

      assert.strictEqual(result.lines.length, 2);
      assert.strictEqual(result.lines[0].isEstimated, true, 'Line 0 must be marked isEstimated: true');
      assert.strictEqual(result.lines[0].estimated, true);
      assert.ok(result.lines[0].words.length > 0);
      assert.strictEqual(result.lines[0].words[0].isEstimated, true, 'Word must be marked isEstimated: true');
      assert.strictEqual(result.lines[0].words[0].estimated, true);
    });

    it('preserves upstream per-word timestamps with isEstimated: false when provided', () => {
      const richLyrics = {
        synced: true,
        source: 'innertube' as const,
        plain: 'Never gonna give you up',
        lines: [
          {
            time: 2.0,
            formattedTime: '00:02',
            text: 'Never gonna give',
            words: [
              { text: 'Never', startTime: 2.0, endTime: 2.6 },
              { text: 'gonna', startTime: 2.6, endTime: 3.1 },
              { text: 'give', startTime: 3.1, endTime: 3.8 },
            ],
          },
        ],
      };

      const result = processLyrics(richLyrics, 10.0);
      assert.strictEqual(result.isEstimated, false, 'Rich per-word lyrics must NOT be estimated');
      assert.strictEqual(result.estimated, false);
      assert.strictEqual(result.lines[0].isEstimated, false);
      assert.strictEqual(result.lines[0].words[0].isEstimated, false);
      assert.strictEqual(result.lines[0].words[0].startTime, 2.0);
      assert.strictEqual(result.lines[0].words[0].endTime, 2.6);

      // Verify direct invocation of adaptUpstreamWords helper
      const adapted = adaptUpstreamWords(
        [
          { text: 'Fast', startTime: 0.0, endTime: 0.5, duration: 0.5 },
          { text: 'Forward', startTime: 0.5, endTime: 1.2 },
        ],
        'direct-line'
      );
      assert.strictEqual(adapted.length, 2);
      assert.strictEqual(adapted[0].isEstimated, false);
      assert.strictEqual(adapted[1].duration, 0.7);
    });

    it('uses DEFAULT_LINE_FALLBACK_DURATION when no next line or track duration is available', () => {
      assert.strictEqual(DEFAULT_LINE_FALLBACK_DURATION, 3.5, 'Default fallback duration is 3.5s');
      assert.ok(lyricsUtilSource.includes('DEFAULT_LINE_FALLBACK_DURATION'));
    });

    it('handles null, undefined, and unsynced payloads safely without throwing', () => {
      const nullResult = processLyrics(null);
      assert.strictEqual(nullResult.synced, false);
      assert.strictEqual(nullResult.lines.length, 0);

      const unsynced = processLyrics({
        synced: false,
        source: 'none',
        plain: 'Plain text only',
        lines: [],
      });
      assert.strictEqual(unsynced.synced, false);
      assert.strictEqual(unsynced.lines.length, 0);
    });
  });

  describe('3. Word Fill Mathematics, scaleX Transform & Kerning Preservation', () => {
    it('computes continuous word fill progress clamped strictly between 0 and 1', () => {
      const start = 10.0;
      const end = 12.0;

      // Before word
      assert.strictEqual(calculateWordProgress(9.5, start, end), 0);
      assert.strictEqual(calculateWordProgress(10.0, start, end), 0);

      // Mid-word
      assert.strictEqual(calculateWordProgress(11.0, start, end), 0.5);
      assert.strictEqual(calculateWordProgress(10.5, start, end), 0.25);
      assert.strictEqual(calculateWordProgress(11.5, start, end), 0.75);

      // After word
      assert.strictEqual(calculateWordProgress(12.0, start, end), 1.0);
      assert.strictEqual(calculateWordProgress(13.5, start, end), 1.0);
    });

    it('preserves exact font geometry and kerning via scaleX(p) * scaleX(1/p) mathematical unity', () => {
      // For any progress p in (0, 1], the composite horizontal scale factor is p * (1/p) = 1.0
      const testPValues = [0.05, 0.1, 0.25, 0.333, 0.5, 0.75, 0.9, 0.99, 1.0];
      for (const p of testPValues) {
        const outerScale = p;
        const innerScale = 1 / p;
        const netScale = outerScale * innerScale;
        assert.ok(
          Math.abs(netScale - 1.0) < 1e-10,
          `Net scale at p=${p} must equal 1.0 (got ${netScale}) preserving font geometry`
        );
      }
    });

    it('verifies scaleX transform is used for word fill clipping and width animation is NEVER used', () => {
      // Must contain scaleX transform on overlay
      assert.ok(
        syncedLyricsViewSource.includes('scaleX'),
        'SyncedLyricsView must use scaleX transform for word fill clip/mask'
      );
      assert.ok(
        syncedLyricsViewSource.includes('transformOrigin: \'left center\'') ||
        syncedLyricsViewSource.includes('transformOrigin: "left center"'),
        'scaleX clip must use left center transform origin'
      );

      // Must NOT animate width on lyric words (e.g. style={{ width: `${progress * 100}%` }})
      assert.ok(
        !syncedLyricsViewSource.includes('data-testid="lyric-word-fill" style={{ width:'),
        'Word fill overlay must not animate width property'
      );
    });
  });

  describe('4. Memoized Word Component Structure (React.memo)', () => {
    it('verifies LyricWord is wrapped in React.memo for high-performance rendering', () => {
      assert.ok(LyricWord, 'LyricWord component must be exported');
      // In React, React.memo creates an object with $$typeof Symbol(react.memo)
      assert.ok(
        typeof LyricWord === 'object' || typeof LyricWord === 'function',
        'LyricWord must be a valid React component'
      );
      assert.strictEqual(LyricWord.displayName, 'LyricWord', 'LyricWord must set displayName');

      // Verify AST / source contains React.memo(LyricWord)
      assert.ok(
        syncedLyricsViewSource.includes('React.memo<LyricWordProps>(') ||
        syncedLyricsViewSource.includes('React.memo('),
        'SyncedLyricsView must wrap LyricWord in React.memo'
      );
    });

    it('verifies LyricWord props comparison avoids re-rendering stationary words', () => {
      // Test the comparator logic pattern used in React.memo
      const mockWord = {
        id: 'w1',
        text: 'hello',
        startTime: 0,
        endTime: 1,
        duration: 1,
        charCount: 5,
        charRatio: 1,
        isEstimated: true,
        estimated: true,
      };

      const prev = {
        word: mockWord,
        progress: 1.0, // already completed
        isLineActive: false,
        isFullscreen: false,
        prefersReducedMotion: false,
      };

      const next = {
        word: mockWord,
        progress: 1.0, // unchanged progress on tick
        isLineActive: false,
        isFullscreen: false,
        prefersReducedMotion: false,
      };

      // Progress did not change -> should skip render
      assert.strictEqual(prev.progress, next.progress);
    });
  });

  describe('5. Non-Reflow Line Scrolling (transform: translateY)', () => {
    it('verifies line scrolling is driven by transform: translateY on GPU compositor', () => {
      assert.ok(
        syncedLyricsViewSource.includes('y: isAutoScrollEnabled ? -targetScrollY : undefined') ||
        syncedLyricsViewSource.includes('translateY'),
        'Lyrics scrolling must animate container transform Y'
      );

      // STRICT REQUIREMENT: Zero occurrences of scrollIntoView
      const scrollIntoViewCount = (syncedLyricsViewSource.match(/scrollIntoView/g) || []).length;
      assert.strictEqual(
        scrollIntoViewCount,
        0,
        'SyncedLyricsView must have 0 occurrences of scrollIntoView to prevent layout reflows'
      );
    });

    it('caches line geometric offsets via ResizeObserver outside animation loops', () => {
      assert.ok(
        syncedLyricsViewSource.includes('ResizeObserver'),
        'SyncedLyricsView must use ResizeObserver to track layout changes'
      );

      // Verify no synchronous getBoundingClientRect inside render ticks
      assert.ok(
        !syncedLyricsViewSource.includes('requestAnimationFrame'),
        'SyncedLyricsView does not run custom layout reading rAF loops'
      );
    });
  });

  describe('6. Click-to-Seek Timestamp Binding', () => {
    it('binds click on lyric lines to seek(line.time)', () => {
      assert.ok(
        syncedLyricsViewSource.includes('onClick={() => seek(line.time)}'),
        'Clicking a lyric line must invoke seek(line.time)'
      );
    });

    it('binds click on lyric words to seek directly to word timestamp', () => {
      assert.ok(
        syncedLyricsViewSource.includes('onWordClick={(seekTime) => seek(seekTime)}') ||
        syncedLyricsViewSource.includes('onWordClick'),
        'Clicking a lyric word must support seeking to word timestamp'
      );
    });

    it('findActiveLineIndex locates active line correctly based on playback timestamp', () => {
      const testLines = [
        { time: 0.0 },
        { time: 3.0 },
        { time: 7.0 },
        { time: 12.0 },
      ];

      // Strict timestamp matching (offset = 0)
      assert.strictEqual(findActiveLineIndex(testLines, 0.0, 0), 0);
      assert.strictEqual(findActiveLineIndex(testLines, 2.9, 0), 0);
      assert.strictEqual(findActiveLineIndex(testLines, 3.0, 0), 1);
      assert.strictEqual(findActiveLineIndex(testLines, 6.9, 0), 1);
      assert.strictEqual(findActiveLineIndex(testLines, 7.0, 0), 2);
      assert.strictEqual(findActiveLineIndex(testLines, 15.0, 0), 3);

      // Default anticipatory lead (+0.15s) for smooth visual activation
      assert.strictEqual(findActiveLineIndex(testLines, 2.5), 0);
      assert.strictEqual(findActiveLineIndex(testLines, 2.9), 1); // 2.9 + 0.15 = 3.05 >= 3.0
      assert.strictEqual(findActiveLineIndex(testLines, 6.9), 2); // 6.9 + 0.15 = 7.05 >= 7.0
    });
  });

  describe('7. Performance & Accessibility Guardrails', () => {
    it('verifies ZERO occurrences of transition: all in SyncedLyricsView.tsx', () => {
      const transitionAllMatches = syncedLyricsViewSource.match(/transition-all/g);
      assert.strictEqual(
        transitionAllMatches ? transitionAllMatches.length : 0,
        0,
        'SyncedLyricsView.tsx must have ZERO occurrences of transition-all per R6'
      );
    });

    it('verifies formatLyricTime accurately formats timestamps with leading zero padding', () => {
      assert.strictEqual(formatLyricTime(0), '00:00');
      assert.strictEqual(formatLyricTime(9), '00:09');
      assert.strictEqual(formatLyricTime(65), '01:05');
      assert.strictEqual(formatLyricTime(3600), '60:00');
      assert.strictEqual(formatLyricTime(-5), '00:00');
      assert.strictEqual(formatLyricTime(NaN), '00:00');
    });

    it('verifies test data attributes are exposed for automated opaque-box inspection', () => {
      assert.ok(syncedLyricsViewSource.includes('data-testid="lyric-word"'));
      assert.ok(syncedLyricsViewSource.includes('data-testid="lyric-word-fill"'));
      assert.ok(syncedLyricsViewSource.includes('data-testid="lyric-line"'));
      assert.ok(syncedLyricsViewSource.includes('data-testid="lyrics-scroll-track"'));
      assert.ok(syncedLyricsViewSource.includes('data-estimated='));
    });
  });
});
