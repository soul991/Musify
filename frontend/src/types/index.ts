export interface Track {
  id: string;
  title: string;
  artists: { id?: string; name: string }[];
  album?: { id?: string; name: string };
  duration: number; // in seconds
  durationFormatted?: string;
  thumbnail: string;
  type?: 'song' | 'video';
  explicit?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artists: { id?: string; name: string }[];
  year?: string;
  thumbnail: string;
  description?: string;
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  thumbnail: string;
  subscribers?: string;
  description?: string;
  topSongs: Track[];
  albums: { id: string; title: string; year?: string; thumbnail: string }[];
  singles: { id: string; title: string; year?: string; thumbnail: string }[];
}

export interface Playlist {
  id: string;
  title: string;
  author?: string;
  itemCount?: number;
  thumbnail: string;
  tracks: Track[];
}

export interface HomeFeedSection {
  title: string;
  items: {
    id: string;
    title: string;
    subtitle?: string;
    thumbnail: string;
    type?: string;
  }[];
}

export interface LyricLine {
  time: number;
  formattedTime: string;
  text: string;
}

export interface LyricsData {
  synced: boolean;
  lines: LyricLine[];
  plain: string;
  source: 'lrclib' | 'innertube' | 'none';
}

export type RepeatMode = 'off' | 'all' | 'one';
