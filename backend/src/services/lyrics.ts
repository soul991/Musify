import { getInnertube } from './innertube.js';

export interface LyricLine {
  time: number; // in seconds
  formattedTime: string;
  text: string;
}

export interface LyricsResponse {
  synced: boolean;
  lines: LyricLine[];
  plain: string;
  source: 'lrclib' | 'innertube' | 'none';
}

// Convert [01:23.45] into seconds (83.45)
export function parseLrcTime(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  return 0;
}

// Parse raw LRC text into LyricLine[]
export function parseLrc(lrcContent: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const rawLines = lrcContent.split('\n');
  const timeRegex = /\[(\d{2}:\d{2}\.\d{2,3})\](.*)/;

  for (const raw of rawLines) {
    const match = raw.match(timeRegex);
    if (match) {
      const timeStr = match[1];
      const text = match[2].trim();
      // Skip empty or credit tags
      if (text) {
        lines.push({
          time: parseLrcTime(timeStr),
          formattedTime: timeStr.slice(0, 5),
          text
        });
      }
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

export async function fetchLyrics(
  title: string,
  artist: string,
  album?: string,
  duration?: number,
  videoId?: string
): Promise<LyricsResponse> {
  // 1. Try LRCLIB exact match
  try {
    const params = new URLSearchParams();
    params.set('track_name', title);
    params.set('artist_name', artist);
    if (album) params.set('album_name', album);
    if (duration && duration > 0) params.set('duration', Math.round(duration).toString());

    const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      headers: {
        'User-Agent': 'Musify/1.0 (https://github.com/musify-player)'
      }
    });

    if (res.ok) {
      const data: any = await res.json();
      if (data.syncedLyrics) {
        return {
          synced: true,
          lines: parseLrc(data.syncedLyrics),
          plain: data.plainLyrics || '',
          source: 'lrclib'
        };
      } else if (data.plainLyrics) {
        return {
          synced: false,
          lines: [],
          plain: data.plainLyrics,
          source: 'lrclib'
        };
      }
    }
  } catch (err) {
    console.warn('LRCLIB exact fetch failed, attempting query search...');
  }

  // 2. Try LRCLIB query search
  try {
    const cleanTitle = title.replace(/\(.*?\)|\[.*?\]|feat\..*|ft\..*/gi, '').trim();
    const query = encodeURIComponent(`${cleanTitle} ${artist}`);
    const res = await fetch(`https://lrclib.net/api/search?q=${query}`, {
      headers: {
        'User-Agent': 'Musify/1.0 (https://github.com/musify-player)'
      }
    });

    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        const itemWithSynced = list.find((it: any) => it.syncedLyrics) || list[0];
        if (itemWithSynced.syncedLyrics) {
          return {
            synced: true,
            lines: parseLrc(itemWithSynced.syncedLyrics),
            plain: itemWithSynced.plainLyrics || '',
            source: 'lrclib'
          };
        } else if (itemWithSynced.plainLyrics) {
          return {
            synced: false,
            lines: [],
            plain: itemWithSynced.plainLyrics,
            source: 'lrclib'
          };
        }
      }
    }
  } catch (err) {
    console.warn('LRCLIB search query failed');
  }

  // 3. Fallback to YouTube captions / InnerTube
  if (videoId) {
    try {
      const yt = await getInnertube();
      const lyricsInfo = await yt.music.getLyrics(videoId);
      if (lyricsInfo?.description?.text) {
        return {
          synced: false,
          lines: [],
          plain: lyricsInfo.description.text,
          source: 'innertube'
        };
      }
    } catch (err) {
      // no youtube captions available
    }
  }

  return {
    synced: false,
    lines: [],
    plain: 'Lyrics not available for this song.',
    source: 'none'
  };
}
