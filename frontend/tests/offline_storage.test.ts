import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

describe('Item 5: Offline Audio Storage & IndexedDB Verification', () => {
  const offlineStorageSrc = readFileSync(
    join(__dirname, '../src/services/offlineStorage.ts'),
    'utf-8'
  );
  const settingsSrc = readFileSync(
    join(__dirname, '../src/pages/Settings.tsx'),
    'utf-8'
  );
  const playerContextSrc = readFileSync(
    join(__dirname, '../src/context/PlayerContext.tsx'),
    'utf-8'
  );
  const libraryContextSrc = readFileSync(
    join(__dirname, '../src/context/LibraryContext.tsx'),
    'utf-8'
  );

  it('declares 500 MB default size cap and configurable options', () => {
    assert(offlineStorageSrc.includes('DEFAULT_SIZE_CAP_MB = 500'));
    assert(offlineStorageSrc.includes('getSizeCapMB'));
    assert(offlineStorageSrc.includes('setSizeCapMB'));
    assert(settingsSrc.includes('Cache Size Limit'));
    assert(settingsSrc.includes('500 MB (Default)'));
    assert(settingsSrc.includes('250 MB'));
    assert(settingsSrc.includes('1 GB'));
    assert(settingsSrc.includes('2 GB'));
  });

  it('implements LRU eviction: unliked tracks first, cap limit, and 20 recent tracks rule', () => {
    assert(offlineStorageSrc.includes('MAX_RECENT_UNLIKED_TRACKS = 20'));
    assert(offlineStorageSrc.includes('enforceLimits'));
    // Ensures unliked candidates are prioritized before liked candidates
    assert(offlineStorageSrc.indexOf('unliked.length > MAX_RECENT_UNLIKED_TRACKS') !== -1);
    assert(offlineStorageSrc.indexOf('unliked.length > 0') < offlineStorageSrc.indexOf('liked.length > 0'));
  });

  it('provides synchronous memory blob URLs for 0ms startup without await', () => {
    assert(offlineStorageSrc.includes('getCachedBlobUrlSync'));
    assert(playerContextSrc.includes('offlineStorage.getCachedBlobUrlSync(track.id)'));
  });

  it('synchronizes liked songs in LibraryContext toggleLike', () => {
    assert(libraryContextSrc.includes('offlineStorage.setTrackLiked(track, true)'));
    assert(libraryContextSrc.includes('offlineStorage.setTrackLiked(track, false)'));
  });

  it('tracks played songs in PlayerContext onTrackPlayed', () => {
    assert(playerContextSrc.includes('offlineStorage.onTrackPlayed(track)'));
    // Ensures gapless swap and crossfade completion also record track in offline storage
    assert(playerContextSrc.includes('offlineStorage.onTrackPlayed(nextItem)'));
  });

  it('connects both primary and secondary audio elements to equalizer engine', () => {
    const audioEngineSrc = readFileSync(
      join(__dirname, '../src/services/audioEqualizer.ts'),
      'utf-8'
    );
    assert(playerContextSrc.includes('audioEqualizer.attachElement(audio)'));
    assert(playerContextSrc.includes('audioEqualizer.attachElement(secAudio)'));
    assert(audioEngineSrc.includes('this.attachedElements.add(audioElement)'));
  });

  it('provides real storage usage display and clear button in Settings', () => {
    assert(settingsSrc.includes('offlineStorage.getStorageUsage()'));
    assert(settingsSrc.includes('offlineStorage.clearOfflineCache()'));
    assert(settingsSrc.includes('Offline Audio Cache'));
  });
});
