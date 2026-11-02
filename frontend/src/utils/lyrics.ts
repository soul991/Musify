import { LyricLine, LyricsData } from '../types';

/**
 * Upstream word timestamp definition if provided by a rich lyrics source.
 */
export interface UpstreamLyricWord {
  text: string;
  startTime: number;
  endTime: number;
  duration?: number;
}

/**
 * Upstream lyric line potentially containing per-word timestamps.
 */
export interface UpstreamLyricLine extends LyricLine {
  words?: UpstreamLyricWord[];
}

/**
 * Processed word element representation for word-by-word synchronized rendering.
 */
export interface LyricWord {
  id: string;
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  duration: number; // in seconds
  charCount: number;
  charRatio: number;
  isEstimated: boolean;
  estimated: boolean; // alias for compatibility
}

/**
 * Processed line representation with distributed or upstream words.
 */
export interface ProcessedLyricLine {
  id: string;
  time: number; // in seconds
  endTime: number; // in seconds
  duration: number; // in seconds
  formattedTime: string;
  text: string;
  words: LyricWord[];
  isEstimated: boolean;
  estimated: boolean; // alias for compatibility
}

/**
 * Processed lyrics dataset ready for word-by-word synchronized presentation.
 */
export interface ProcessedLyrics {
  synced: boolean;
  isEstimated: boolean;
  estimated: boolean;
  source: 'lrclib' | 'innertube' | 'word-synced' | 'none';
  lines: ProcessedLyricLine[];
  plain: string;
}

export const DEFAULT_LINE_FALLBACK_DURATION = 3.5; // seconds
export const MIN_LINE_DURATION = 1.0; // seconds

/**
 * Tokenizes a line into words while preserving attached punctuation.
 */
export function tokenizeWords(lineText: string): string[] {
  if (!lineText) return [];
  return lineText.trim().split(/\s+/).filter(Boolean);
}

/**
 * Formats seconds into mm:ss string.
 */
export function formatLyricTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Distributes each word of a line across the line duration proportionally by character count (L_i / L_total).
 * Every generated word is marked with isEstimated: true, without claiming word-accurate sync.
 */
export function distributeWordsByCharacterCount(
  lineText: string,
  lineStartTime: number,
  lineDuration: number,
  lineIdPrefix: string = 'line'
): LyricWord[] {
  const words = tokenizeWords(lineText);
  if (words.length === 0) return [];

  const charCounts = words.map((w) => w.length);
  const totalChars = charCounts.reduce((acc, len) => acc + len, 0);

  // If line has 0 characters or all symbols, split duration equally
  const durations = totalChars > 0
    ? charCounts.map((len) => (len / totalChars) * lineDuration)
    : words.map(() => lineDuration / words.length);

  let currentStart = lineStartTime;
  return words.map((word, index) => {
    const duration = durations[index];
    const startTime = currentStart;
    const endTime = startTime + duration;
    currentStart = endTime;

    return {
      id: `${lineIdPrefix}-w${index}`,
      text: word,
      startTime,
      endTime,
      duration,
      charCount: word.length,
      charRatio: totalChars > 0 ? word.length / totalChars : 1 / words.length,
      isEstimated: true,
      estimated: true,
    };
  });
}

/**
 * Adapts upstream per-word timestamps directly, preserving their timestamps and setting isEstimated: false.
 */
export function adaptUpstreamWords(
  upstreamWords: UpstreamLyricWord[],
  lineIdPrefix: string = 'line'
): LyricWord[] {
  const totalChars = upstreamWords.reduce((acc, w) => acc + (w.text ? w.text.length : 0), 0);

  return upstreamWords.map((w, index) => {
    const duration = typeof w.duration === 'number' && w.duration > 0
      ? w.duration
      : Math.max(0.1, w.endTime - w.startTime);

    return {
      id: `${lineIdPrefix}-w${index}`,
      text: w.text,
      startTime: w.startTime,
      endTime: w.endTime,
      duration,
      charCount: w.text.length,
      charRatio: totalChars > 0 ? w.text.length / totalChars : 1 / upstreamWords.length,
      isEstimated: false,
      estimated: false,
    };
  });
}

/**
 * High-level parser that inspects the lyrics source response:
 * - If it provides per-word timestamps, uses them directly with isEstimated: false.
 * - If it provides only per-line timestamps (such as standard LRCLIB lines), distributes each
 *   line's words across the line duration by character count and marks the line/words with isEstimated: true.
 */
export function processLyrics(
  lyrics: LyricsData | LyricLine[] | null | undefined,
  trackDuration?: number
): ProcessedLyrics {
  if (!lyrics) {
    return {
      synced: false,
      isEstimated: false,
      estimated: false,
      source: 'none',
      lines: [],
      plain: '',
    };
  }

  const rawLines: UpstreamLyricLine[] = Array.isArray(lyrics) ? lyrics : lyrics.lines || [];
  const synced = Array.isArray(lyrics) ? true : !!lyrics.synced;
  const source = Array.isArray(lyrics) ? 'lrclib' : (lyrics.source || 'lrclib');
  const plain = Array.isArray(lyrics) ? '' : (lyrics.plain || '');

  if (!synced || rawLines.length === 0) {
    return {
      synced,
      isEstimated: false,
      estimated: false,
      source,
      lines: [],
      plain,
    };
  }

  // Check if any line provides genuine per-word timestamps
  const hasUpstreamWordSync = rawLines.some(
    (l) => Array.isArray(l.words) && l.words.length > 0
  );

  const processedLines: ProcessedLyricLine[] = rawLines.map((line, idx) => {
    const lineId = `l${idx}-${Math.round(line.time * 1000)}`;
    const nextLine = rawLines[idx + 1];

    let lineDuration: number;
    if (nextLine && nextLine.time > line.time) {
      lineDuration = nextLine.time - line.time;
    } else if (typeof trackDuration === 'number' && trackDuration > line.time) {
      lineDuration = Math.max(MIN_LINE_DURATION, Math.min(trackDuration - line.time, 5.0));
    } else {
      lineDuration = DEFAULT_LINE_FALLBACK_DURATION;
    }

    const endTime = line.time + lineDuration;
    let words: LyricWord[];
    let lineIsEstimated: boolean;

    if (Array.isArray(line.words) && line.words.length > 0) {
      words = adaptUpstreamWords(line.words, lineId);
      lineIsEstimated = false;
    } else {
      words = distributeWordsByCharacterCount(line.text, line.time, lineDuration, lineId);
      lineIsEstimated = true;
    }

    return {
      id: lineId,
      time: line.time,
      endTime,
      duration: lineDuration,
      formattedTime: line.formattedTime || formatLyricTime(line.time),
      text: line.text,
      words,
      isEstimated: lineIsEstimated,
      estimated: lineIsEstimated,
    };
  });

  const overallEstimated = !hasUpstreamWordSync;

  return {
    synced,
    isEstimated: overallEstimated,
    estimated: overallEstimated,
    source: hasUpstreamWordSync ? 'word-synced' : source,
    lines: processedLines,
    plain,
  };
}

/**
 * Calculates continuous fill progress for a word at currentTime, strictly clamped to [0, 1].
 */
export function calculateWordProgress(
  currentTime: number,
  startTime: number,
  endTime: number
): number {
  if (currentTime <= startTime) return 0;
  if (currentTime >= endTime) return 1;
  const duration = endTime - startTime;
  if (duration <= 0) return 1;
  return Math.min(1, Math.max(0, (currentTime - startTime) / duration));
}

/**
 * Finds the index of the currently active line given playback currentTime and a small anticipatory lead.
 */
export function findActiveLineIndex(
  lines: { time: number }[],
  currentTime: number,
  offsetSeconds: number = 0.15
): number {
  if (!lines || lines.length === 0) return -1;
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime + offsetSeconds) {
      idx = i;
    } else {
      break;
    }
  }
  return idx;
}
