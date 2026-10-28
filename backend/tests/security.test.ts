import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { isValidVideoId, isValidBrowseId } from '../src/utils/validation.js';
import {
  streamUrlCache,
  MAX_CACHE_SIZE,
  cleanupCache,
  setCachedStream,
  getCachedStream,
  CachedStream
} from '../src/services/stream.js';
import app from '../src/index.js';

describe('Phase 0 Security Tests', () => {
  describe('1. isValidVideoId validation and injection prevention', () => {
    test('accepts valid 11-character video IDs', () => {
      assert.equal(isValidVideoId('dQw4w9WgXcQ'), true);
      assert.equal(isValidVideoId('s88r_4Vs888'), true);
      assert.equal(isValidVideoId('abc_123-xyz'), true);
      assert.equal(isValidVideoId('12345678901'), true);
    });

    test('rejects malicious command injection payloads explicitly mentioned in requirements', () => {
      assert.equal(isValidVideoId('x";id;"'), false);
      assert.equal(isValidVideoId('$(id)'), false);
      assert.equal(isValidVideoId('../x'), false);
    });

    test('rejects other malicious injection and shell execution strings', () => {
      assert.equal(isValidVideoId('"; rm -rf /; #'), false);
      assert.equal(isValidVideoId('`whoami`'), false);
      assert.equal(isValidVideoId('& echo 1 &'), false);
      assert.equal(isValidVideoId('| cat /etc/passwd'), false);
      assert.equal(isValidVideoId('../../../../etc/passwd'), false);
      assert.equal(isValidVideoId("' OR '1'='1"), false);
      assert.equal(isValidVideoId('<script>alert(1)</script>'), false);
    });

    test('rejects lengths not equal to 11', () => {
      assert.equal(isValidVideoId(''), false);
      assert.equal(isValidVideoId('1234567890'), false); // 10 chars
      assert.equal(isValidVideoId('123456789012'), false); // 12 chars
      assert.equal(isValidVideoId('abc'), false);
    });

    test('rejects non-string values', () => {
      assert.equal(isValidVideoId(null), false);
      assert.equal(isValidVideoId(undefined), false);
      assert.equal(isValidVideoId(12345678901), false);
      assert.equal(isValidVideoId({}), false);
      assert.equal(isValidVideoId(['dQw4w9WgXcQ']), false);
    });
  });

  describe('2. isValidBrowseId validation and path traversal prevention', () => {
    test('accepts valid YouTube Music browse IDs', () => {
      assert.equal(isValidBrowseId('VLPL1234567890'), true);
      assert.equal(isValidBrowseId('MPREb_0987654321'), true);
      assert.equal(isValidBrowseId('UC_artist_channel_123'), true);
      assert.equal(isValidBrowseId('FEmusic_home'), true);
    });

    test('rejects path traversal attempts', () => {
      assert.equal(isValidBrowseId('../x'), false);
      assert.equal(isValidBrowseId('..'), false);
      assert.equal(isValidBrowseId('.'), false);
      assert.equal(isValidBrowseId('../../etc/passwd'), false);
      assert.equal(isValidBrowseId('./config'), false);
    });

    test('rejects shell injection in browse IDs', () => {
      assert.equal(isValidBrowseId('abc;whoami'), false);
      assert.equal(isValidBrowseId('abc|cat'), false);
      assert.equal(isValidBrowseId('abc"def'), false);
      assert.equal(isValidBrowseId("abc'def"), false);
      assert.equal(isValidBrowseId('abc&def'), false);
    });
  });

  describe('3. Stream cache capping and TTL expiration', () => {
    test('caps cache size and drops oldest entries when exceeding MAX_CACHE_SIZE', () => {
      streamUrlCache.clear();
      const mockStream: CachedStream = {
        url: 'https://rr1---sn.googlevideo.com/videoplayback?mock=1',
        mimeType: 'audio/mp4',
        contentLength: 1024,
        expiresAt: Date.now() + 3600000
      };

      for (let i = 0; i < MAX_CACHE_SIZE + 20; i++) {
        setCachedStream(`test_video_${i.toString().padStart(5, '0')}`, {
          ...mockStream,
          url: `https://mock.url/${i}`
        });
      }

      assert.ok(streamUrlCache.size <= MAX_CACHE_SIZE, `Cache size ${streamUrlCache.size} exceeded MAX_CACHE_SIZE ${MAX_CACHE_SIZE}`);
      // Oldest entry (index 0) should have been evicted
      assert.equal(getCachedStream('test_video_00000'), undefined);
      // Newest entry should still exist
      assert.ok(getCachedStream(`test_video_${(MAX_CACHE_SIZE + 19).toString().padStart(5, '0')}`) !== undefined);
      streamUrlCache.clear();
    });

    test('drops expired entries upon getCachedStream and cleanupCache', () => {
      streamUrlCache.clear();
      const expiredStream: CachedStream = {
        url: 'https://mock.url/expired',
        mimeType: 'audio/mp4',
        contentLength: 1024,
        expiresAt: Date.now() - 1000 // expired 1s ago
      };

      const freshStream: CachedStream = {
        url: 'https://mock.url/fresh',
        mimeType: 'audio/mp4',
        contentLength: 1024,
        expiresAt: Date.now() + 3600000
      };

      streamUrlCache.set('expired_key', expiredStream);
      streamUrlCache.set('fresh_key', freshStream);

      // getCachedStream on expired entry returns undefined and removes it
      assert.equal(getCachedStream('expired_key'), undefined);
      assert.equal(streamUrlCache.has('expired_key'), false);

      // cleanupCache removes expired entries
      streamUrlCache.set('expired_key_2', expiredStream);
      cleanupCache();
      assert.equal(streamUrlCache.has('expired_key_2'), false);
      assert.equal(streamUrlCache.has('fresh_key'), true);
      streamUrlCache.clear();
    });
  });

  describe('4. HTTP Route Security & Error Isolation', () => {
    let server: http.Server;
    let baseUrl: string;

    before((_, done) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        done();
      });
    });

    after((_, done) => {
      server.close(done);
    });

    test('rejects invalid video ID in /api/stream/:videoId with 400', async () => {
      const payloads = ['x";id;"', '$(id)', '../x', 'too_short', 'toolongvideoid123'];
      for (const payload of payloads) {
        const res = await fetch(`${baseUrl}/api/stream/${encodeURIComponent(payload)}`);
        assert.equal(res.status, 400, `Expected 400 for payload ${payload}, got ${res.status}`);
        const data = await res.json();
        assert.equal(data.error, 'Invalid or missing videoId');
      }
    });

    test('rejects invalid video ID in /api/song/:id with 400', async () => {
      const res = await fetch(`${baseUrl}/api/song/${encodeURIComponent('x";id;"')}`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Invalid song ID format');
    });

    test('rejects invalid video ID in /api/radio/:id with 400', async () => {
      const res = await fetch(`${baseUrl}/api/radio/${encodeURIComponent('$(id)')}`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Invalid song ID format');
    });

    test('rejects invalid browse ID in /api/album/:id with 400', async () => {
      const res = await fetch(`${baseUrl}/api/album/${encodeURIComponent('../x')}`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Invalid album ID format');
    });

    test('rejects invalid browse ID in /api/artist/:id with 400', async () => {
      const res = await fetch(`${baseUrl}/api/artist/${encodeURIComponent('../x')}`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Invalid artist ID format');
    });

    test('rejects invalid browse ID in /api/playlist/:id with 400', async () => {
      const res = await fetch(`${baseUrl}/api/playlist/${encodeURIComponent('../x')}`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Invalid playlist ID format');
    });

    test('rejects empty query parameter in /api/search with 400', async () => {
      const res = await fetch(`${baseUrl}/api/search?q=`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Search query parameter "q" is required');
    });

    test('rejects oversized query in /api/search with 400', async () => {
      const oversized = 'a'.repeat(201);
      const res = await fetch(`${baseUrl}/api/search?q=${oversized}`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Search query too long (maximum 200 characters)');
    });

    test('rejects invalid filter in /api/search with 400', async () => {
      const res = await fetch(`${baseUrl}/api/search?q=test&filter=malicious_filter`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Invalid filter parameter');
    });

    test('rejects invalid videoId in /api/lyrics with 400', async () => {
      const res = await fetch(`${baseUrl}/api/lyrics?title=Test&videoId=x%22%3Bid%3B%22`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Invalid videoId format');
    });

    test('rejects invalid duration in /api/lyrics with 400', async () => {
      const res = await fetch(`${baseUrl}/api/lyrics?title=Test&duration=-5`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Invalid duration parameter (must be between 0 and 86400)');
    });

    test('enforces CORS allowlist rejecting untrusted origins with 403', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: {
          Origin: 'https://evil-untrusted-domain.com'
        }
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.error, 'Forbidden');
    });

    test('permits CORS allowed origins', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: {
          Origin: 'http://localhost:5173'
        }
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    });

    test('permits server-to-server or app requests with no Origin header', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'ok');
    });

    test('rejects invalid quality query parameter in /api/stream/:videoId with 400', async () => {
      const res = await fetch(`${baseUrl}/api/stream/dQw4w9WgXcQ?quality=malicious_payload`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Invalid quality parameter');
    });

    test('handles CORS OPTIONS preflight requests for allowed origin', async () => {
      const res = await fetch(`${baseUrl}/api/stream/dQw4w9WgXcQ`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:5173',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Range, Content-Type, Accept'
        }
      });
      assert.equal(res.status, 204);
      assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
      assert.ok(res.headers.get('access-control-allow-methods')?.includes('GET'));
    });
  });
});
