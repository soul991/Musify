import { Innertube, Platform } from 'youtubei.js';
import { isValidVideoId } from '../utils/validation.js';

// Setup JavaScript evaluator for signature cipher and n-sig deciphering
Platform.shim.eval = (data: any, env: any) => {
  const fn = new Function(...Object.keys(env), data.output);
  return fn(...Object.values(env));
};

let innertubeInstance: Innertube | null = null;

export function setInnertubeInstanceForTesting(instance: any) {
  innertubeInstance = instance;
}

export async function getInnertube(): Promise<Innertube> {
  if (!innertubeInstance) {
    innertubeInstance = await Innertube.create({
      generate_session_locally: true,
      location: 'US',
      enable_safety_mode: false
    });
  }
  return innertubeInstance;
}

export interface MusifyTrack {
  id: string;
  title: string;
  artists: { id?: string; name: string }[];
  album?: { id?: string; name: string };
  duration: number; // in seconds
  durationFormatted?: string;
  thumbnail: string;
  type: 'song' | 'video';
}

export interface MusifyAlbum {
  id: string;
  title: string;
  artists: { id?: string; name: string }[];
  year?: string;
  thumbnail: string;
  description?: string;
  tracks: MusifyTrack[];
}

export interface MusifyArtist {
  id: string;
  name: string;
  thumbnail: string;
  subscribers?: string;
  description?: string;
  topSongs: MusifyTrack[];
  albums: { id: string; title: string; year?: string; thumbnail: string }[];
  singles: { id: string; title: string; year?: string; thumbnail: string }[];
}

export interface MusifyPlaylist {
  id: string;
  title: string;
  author?: string;
  itemCount?: number;
  thumbnail: string;
  tracks: MusifyTrack[];
}

export interface HomeFeedSection {
  title: string;
  items: any[];
}

// Helper to format duration string mm:ss into seconds
function parseDuration(durationStr?: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return Number(durationStr) || 0;
}

// Get the highest resolution thumbnail URL safely without corrupting base64 Google hash
export function getBestThumbnail(thumbnails: any): string {
  if (!thumbnails) return '';
  const list = Array.isArray(thumbnails)
    ? (Array.isArray(thumbnails[0]) ? thumbnails.flat() : thumbnails)
    : [thumbnails];
  if (list.length === 0) return '';
  const sorted = [...list].filter(Boolean).sort((a, b) => (b.width || 0) - (a.width || 0));
  let url = sorted[0]?.url || (typeof sorted[0] === 'string' ? sorted[0] : '');
  if (!url) return '';
  if (url.startsWith('//')) url = 'https:' + url;

  // Safe upgrade: Only rewrite lh3.googleusercontent.com album-art URLs
  if (url.includes('lh3.googleusercontent.com') && url.includes('=')) {
    return url.replace(/=[^=]*$/, '=w544-h544-l90-rj');
  }

  // Channel/avatar URLs: yt3.googleusercontent.com uses =s544-c-k-c0x00ffffff-no-rj to avoid HTTP 400
  if (url.includes('yt3.googleusercontent.com') && url.includes('=')) {
    return url.replace(/=[^=]*$/, '=s544-c-k-c0x00ffffff-no-rj');
  }

  // Safe upgrade for ytimg (hqdefault is guaranteed to exist on all YouTube videos)
  if (url.includes('i.ytimg.com')) {
    return url.replace(/\/default\.jpg$/, '/hqdefault.jpg').replace(/\/mqdefault\.jpg$/, '/hqdefault.jpg');
  }

  return url;
}

export async function searchMusic(query: string, filter?: string) {
  const yt = await getInnertube();
  let mappedFilter = filter;
  if (filter === 'songs') mappedFilter = 'song';
  else if (filter === 'albums') mappedFilter = 'album';
  else if (filter === 'artists') mappedFilter = 'artist';
  else if (filter === 'playlists') mappedFilter = 'playlist';

  const searchResults = await yt.music.search(query, mappedFilter ? { type: mappedFilter as any } : undefined);

  const songs: MusifyTrack[] = [];
  const albums: any[] = [];
  const artists: any[] = [];
  const playlists: any[] = [];

  const rawResults: any[] = (searchResults as any).contents || [];
  
  for (const shelf of rawResults) {
    const contents = shelf.contents || [];
    for (const item of contents) {
      const type = item.type?.toLowerCase() || '';
      const thumb = getBestThumbnail(item.thumbnails || [item.thumbnail]);

      if (type.includes('song') || type.includes('music_responsive_list_item') || item.id) {
        if (item.artists || item.author || mappedFilter === 'song') {
          songs.push({
            id: item.id || item.video_id,
            title: item.title?.text || item.title || 'Unknown Title',
            artists: Array.isArray(item.artists)
              ? item.artists.map((a: any) => ({ id: a.id || a.browse_id, name: a.name || a.text }))
              : [{ name: item.author?.name || 'Unknown Artist' }],
            album: item.album ? { id: item.album.id, name: item.album.name } : undefined,
            duration: item.duration?.seconds || parseDuration(item.duration?.text),
            durationFormatted: item.duration?.text,
            thumbnail: thumb,
            type: 'song'
          });
        }
      }
      if (type.includes('album')) {
        albums.push({
          id: item.id || item.browse_id,
          title: item.title?.text || item.title,
          artists: Array.isArray(item.artists)
            ? item.artists.map((a: any) => ({ name: a.name || a.text }))
            : [{ name: item.author?.name || '' }],
          year: item.year?.text || item.year,
          thumbnail: thumb
        });
      }
      if (type.includes('artist')) {
        artists.push({
          id: item.id || item.browse_id,
          name: item.name?.text || item.name || item.title?.text || item.title,
          subscribers: item.subscribers?.text,
          thumbnail: thumb
        });
      }
      if (type.includes('playlist')) {
        playlists.push({
          id: item.id || item.browse_id,
          title: item.title?.text || item.title,
          author: item.author?.name || item.author?.text,
          itemCount: item.item_count,
          thumbnail: thumb
        });
      }
    }
  }

  return { songs: songs.slice(0, 30), albums: albums.slice(0, 15), artists: artists.slice(0, 10), playlists: playlists.slice(0, 15) };
}

export async function getSearchSuggestions(query: string): Promise<string[]> {
  const yt = await getInnertube();
  try {
    const suggestions = await yt.music.getSearchSuggestions(query);
    return suggestions.map((s: any) => s.toString ? s.toString() : (s.text || s));
  } catch (err) {
    return [];
  }
}

export async function getHomeFeed(): Promise<HomeFeedSection[]> {
  const yt = await getInnertube();
  const feed = await yt.music.getHomeFeed();
  const sections: HomeFeedSection[] = [];

  const rawSections: any[] = (feed as any).sections || [];
  for (const sec of rawSections) {
    const title = sec.header?.title?.text || sec.title?.text || 'Featured';
    const items: any[] = [];
    const contents = sec.contents || [];

    for (const item of contents) {
      const thumb = getBestThumbnail(item.thumbnails || [item.thumbnail]);
      const titleText = item.title?.text || item.title || '';
      if (!titleText) continue;

      items.push({
        id: item.id || item.browse_id || item.video_id,
        title: titleText,
        subtitle: item.subtitle?.text || item.artists?.[0]?.name || item.author?.name || '',
        thumbnail: thumb,
        type: item.type || (item.artists ? 'song' : 'playlist')
      });
    }

    if (items.length > 0) {
      sections.push({ title, items: items.slice(0, 20) });
    }
  }

  return sections;
}

export async function getExploreFeed() {
  const yt = await getInnertube();
  try {
    const explore = await yt.music.getExplore();
    return explore;
  } catch (err) {
    return null;
  }
}

export async function getTrackDetails(videoId: string): Promise<MusifyTrack | null> {
  const yt = await getInnertube();
  try {
    const info = await yt.music.getInfo(videoId);
    const basic = info.basic_info;
    const thumb = getBestThumbnail(basic.thumbnail as any || []);

    return {
      id: videoId,
      title: basic.title || 'Unknown Title',
      artists: basic.author ? [{ name: basic.author }] : [{ name: 'Unknown Artist' }],
      duration: basic.duration || 0,
      thumbnail: thumb,
      type: 'song'
    };
  } catch (err) {
    console.error('Error fetching track details for', videoId, err);
    return null;
  }
}

export async function getRelatedTracks(videoId: string): Promise<MusifyTrack[]> {
  const yt = await getInnertube();
  const tracks: MusifyTrack[] = [];
  const seenIds = new Set<string>();
  seenIds.add(videoId);

  // 1. Primary: Use real Up Next radio queue
  try {
    const upNext = await yt.music.getUpNext(videoId);
    const contents: any[] = (upNext as any).contents || [];

    for (const item of contents) {
      const id = item.video_id || item.id;
      if (!id || !isValidVideoId(id) || seenIds.has(id)) continue;

      const duration = item.duration?.seconds || parseDuration(item.duration?.text);
      if (duration <= 0) continue; // Drop non-playable/non-song items

      seenIds.add(id);
      const title = item.title?.text || (typeof item.title === 'string' ? item.title : 'Track');
      const artists = Array.isArray(item.artists) && item.artists.length > 0
        ? item.artists.map((a: any) => ({ name: a.name }))
        : [{ name: item.author?.name || 'Artist' }];

      tracks.push({
        id,
        title,
        artists,
        duration,
        durationFormatted: item.duration?.text,
        thumbnail: getBestThumbnail(item.thumbnails || (item.thumbnail ? [item.thumbnail] : [])),
        type: 'song'
      });
    }

    if (tracks.length >= 5) {
      return tracks.slice(0, 30);
    }
  } catch (err: any) {
    console.warn(`getUpNext failed for ${videoId}, falling back to getRelated:`, err?.message || err);
  }

  // 2. Fallback: Query related shelves, strictly keeping song items with duration
  try {
    const related = await yt.music.getRelated(videoId);
    const sections: any[] = (related as any).sections || [];

    for (const sec of sections) {
      const contents = sec.contents || [];
      for (const item of contents) {
        const id = item.id || item.video_id;
        if (!id || !isValidVideoId(id) || seenIds.has(id)) continue;

        const duration = item.duration?.seconds || parseDuration(item.duration?.text);
        if (duration <= 0) continue; // Drop albums, playlists, artists without track duration

        seenIds.add(id);
        const title = item.title?.text || (typeof item.title === 'string' ? item.title : 'Track');
        const artists = Array.isArray(item.artists) && item.artists.length > 0
          ? item.artists.map((a: any) => ({ name: a.name }))
          : [{ name: item.author?.name || 'Artist' }];

        tracks.push({
          id,
          title,
          artists,
          duration,
          durationFormatted: item.duration?.text,
          thumbnail: getBestThumbnail(item.thumbnails || (item.thumbnail ? [item.thumbnail] : [])),
          type: 'song'
        });
      }
    }
    return tracks.slice(0, 25);
  } catch (err: any) {
    console.error('Error in getRelatedTracks fallback:', err?.message || err);
    return tracks;
  }
}

export async function getAlbumDetails(browseId: string): Promise<MusifyAlbum | null> {
  const yt = await getInnertube();
  try {
    const album = await yt.music.getAlbum(browseId);
    const header: any = (album as any).header || {};
    const contents: any[] = (album as any).contents || [];

    const tracks: MusifyTrack[] = contents.map((item: any) => ({
      id: item.id || item.video_id,
      title: item.title?.text || item.title || 'Track',
      artists: item.artists ? item.artists.map((a: any) => ({ name: a.name })) : [{ name: header.artist?.name || 'Artist' }],
      duration: item.duration?.seconds || parseDuration(item.duration?.text),
      durationFormatted: item.duration?.text,
      thumbnail: getBestThumbnail(item.thumbnails || [item.thumbnail] || header.thumbnails),
      type: 'song'
    }));

    return {
      id: browseId,
      title: header.title?.text || header.title || 'Album',
      artists: header.artist ? [{ id: header.artist.id, name: header.artist.name }] : [{ name: 'Unknown' }],
      year: header.year?.text || header.year,
      thumbnail: getBestThumbnail(header.thumbnails || []),
      description: header.description?.text,
      tracks
    };
  } catch (err) {
    console.error('Error getting album details for', browseId, err);
    return null;
  }
}

export async function getArtistDetails(browseId: string): Promise<MusifyArtist | null> {
  const yt = await getInnertube();
  try {
    const artist = await yt.music.getArtist(browseId);
    const header: any = (artist as any).header || {};
    const sections: any[] = (artist as any).sections || [];

    const topSongs: MusifyTrack[] = [];
    const albums: any[] = [];
    const singles: any[] = [];

    for (const sec of sections) {
      const title = (sec.title?.text || sec.header?.title?.text || '').toLowerCase();
      const contents = sec.contents || [];

      if (title.includes('song')) {
        for (const item of contents) {
          topSongs.push({
            id: item.id || item.video_id,
            title: item.title?.text || item.title,
            artists: [{ name: header.title?.text || header.name || 'Artist' }],
            duration: item.duration?.seconds || parseDuration(item.duration?.text),
            durationFormatted: item.duration?.text,
            thumbnail: getBestThumbnail(item.thumbnails || [item.thumbnail]),
            type: 'song'
          });
        }
      } else if (title.includes('album')) {
        for (const item of contents) {
          albums.push({
            id: item.id || item.browse_id,
            title: item.title?.text || item.title,
            year: item.year?.text || item.year,
            thumbnail: getBestThumbnail(item.thumbnails || [item.thumbnail])
          });
        }
      } else if (title.includes('single')) {
        for (const item of contents) {
          singles.push({
            id: item.id || item.browse_id,
            title: item.title?.text || item.title,
            year: item.year?.text || item.year,
            thumbnail: getBestThumbnail(item.thumbnails || [item.thumbnail])
          });
        }
      }
    }

    return {
      id: browseId,
      name: header.title?.text || header.name || 'Artist',
      thumbnail: getBestThumbnail(header.thumbnails || []),
      description: header.description?.text,
      subscribers: header.subscribers?.text,
      topSongs: topSongs.slice(0, 20),
      albums: albums.slice(0, 10),
      singles: singles.slice(0, 10)
    };
  } catch (err) {
    console.error('Error getting artist details for', browseId, err);
    return null;
  }
}

export async function getPlaylistDetails(playlistId: string): Promise<MusifyPlaylist | null> {
  const yt = await getInnertube();
  try {
    const playlist = await yt.music.getPlaylist(playlistId);
    const header: any = (playlist as any).header || {};
    const contents: any[] = (playlist as any).items || (playlist as any).contents || [];

    const tracks: MusifyTrack[] = contents.map((item: any) => ({
      id: item.id || item.video_id,
      title: item.title?.text || item.title || 'Track',
      artists: item.artists ? item.artists.map((a: any) => ({ name: a.name })) : [{ name: item.author?.name || 'Artist' }],
      duration: item.duration?.seconds || parseDuration(item.duration?.text),
      durationFormatted: item.duration?.text,
      thumbnail: getBestThumbnail(item.thumbnails || [item.thumbnail]),
      type: 'song'
    }));

    return {
      id: playlistId,
      title: header.title?.text || header.title || 'Playlist',
      author: header.author?.name || header.author?.text,
      itemCount: tracks.length,
      thumbnail: getBestThumbnail(header.thumbnails || tracks[0]?.thumbnail ? [{ url: tracks[0].thumbnail }] : []),
      tracks
    };
  } catch (err) {
    console.error('Error getting playlist for', playlistId, err);
    return null;
  }
}
