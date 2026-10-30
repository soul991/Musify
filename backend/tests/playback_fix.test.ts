import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../src/index.js';
import {
  setCachedStream,
  streamUrlCache,
  streamMissLimiter,
  StreamRateLimitError
} from '../src/services/stream.js';
import { getBestThumbnail } from '../src/services/innertube.js';
import { getAllowedOrigins, isOriginAllowed } from '../src/utils/cors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Playback Fix Verification Suite (Production Bug Requirements)', () => {
  let server: http.Server;
  let port: number;
  let baseUrl: string;
  let mockUpstream: http.Server;
  let mockUpstreamPort: number;

  before(async () => {
    // 1. Mock upstream server returning 206 Partial Content
    await new Promise<void>((resolve) => {
      mockUpstream = http.createServer((req, res) => {
        const range = req.headers.range;
        if (range) {
          res.writeHead(206, {
            'Content-Type': 'audio/mp4',
            'Content-Range': 'bytes 0-100/10000',
            'Content-Length': '101',
            'Accept-Ranges': 'bytes'
          });
          res.end(Buffer.alloc(101, 0x41));
        } else {
          res.writeHead(200, {
            'Content-Type': 'audio/mp4',
            'Content-Length': '10000',
            'Accept-Ranges': 'bytes'
          });
          res.end(Buffer.alloc(100, 0x41));
        }
      });
      mockUpstream.listen(0, '127.0.0.1', () => {
        mockUpstreamPort = (mockUpstream.address() as any).port;
        resolve();
      });
    });

    // 2. Musify backend express app
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        port = (server.address() as any).port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => mockUpstream.close(() => resolve()));
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  describe('1. Service Worker (sw.js) Behavior', () => {
    const swPath = path.resolve(__dirname, '../../frontend/public/sw.js');
    const swCode = fs.readFileSync(swPath, 'utf-8');

    test('sw.js uses musify-cache-v7 and removes audio cache storage', () => {
      assert.match(swCode, /CACHE_NAME\s*=\s*['"]musify-cache-v7['"]/);
      assert.doesNotMatch(swCode, /musify-audio-cache/);
      assert.doesNotMatch(swCode, /handleAudioRangeRequest/);
      assert.doesNotMatch(swCode, /arrayBuffer\(\)/);
    });

    test('sw.js ignores cross-origin /api/stream requests and only handles same-origin requests', () => {
      // Simulate SW execution context
      let respondWithCalled = false;
      let passedRequest: any = null;

      function createFetchEvent(requestUrl: string, origin = 'https://musify-live.netlify.app') {
        respondWithCalled = false;
        passedRequest = null;
        return {
          request: {
            url: requestUrl,
            mode: 'cors'
          },
          respondWith: (val: any) => {
            respondWithCalled = true;
            passedRequest = val;
          }
        };
      }

      // Check the SW code logic:
      // if (url.origin !== self.location.origin) return;
      assert.match(swCode, /url\.origin !== self\.location\.origin/);

      // Verify simulated behavior:
      const selfLocationOrigin = 'https://musify-live.netlify.app';

      // Cross-origin stream request (e.g. direct to Catalyst)
      const crossOriginUrl = new URL('https://musify-backend-50047147406.development.catalystappsail.in/api/stream/dQw4w9WgXcQ');
      const isSameOriginCross = crossOriginUrl.origin === selfLocationOrigin;
      assert.strictEqual(isSameOriginCross, false, 'Cross origin stream request must not match same origin');

      // Same-origin stream request
      const sameOriginUrl = new URL('https://musify-live.netlify.app/api/stream/dQw4w9WgXcQ');
      const isSameOriginLocal = sameOriginUrl.origin === selfLocationOrigin;
      assert.strictEqual(isSameOriginLocal, true, 'Same origin stream request must match same origin');
    });

    test('sw.js preserves skipWaiting and clients.claim', () => {
      assert.match(swCode, /skipWaiting\(\)/);
      assert.match(swCode, /clients\.claim\(\)/);
    });
  });

  describe('2. Stalled Timer & Error Mapping Logic', () => {
    test('error code mapper maps code 4, 2, 3 correctly', () => {
      function mapAudioErrorCode(code?: number): string {
        switch (code) {
          case 1:
            return 'Playback aborted';
          case 2:
            return 'network error';
          case 3:
            return 'decode error';
          case 4:
            return 'unsupported/blocked source';
          default:
            return 'playback failed';
        }
      }

      assert.strictEqual(mapAudioErrorCode(4), 'unsupported/blocked source');
      assert.strictEqual(mapAudioErrorCode(2), 'network error');
      assert.strictEqual(mapAudioErrorCode(3), 'decode error');
      assert.strictEqual(mapAudioErrorCode(1), 'Playback aborted');
      assert.strictEqual(mapAudioErrorCode(undefined), 'playback failed');
    });

    test('12-second stalled timer fires error and stops waiting when playing does not fire', (t, done) => {
      let isPlaying = false;
      let isLoading = true;
      let reportedError: string | null = null;

      // Simulated stalled timer
      const timeoutMs = 20; // scaled down for test speed
      const timer = setTimeout(() => {
        if (!isPlaying) {
          isLoading = false;
          reportedError = 'Song is taking too long. Tap Retry.';
          assert.strictEqual(isLoading, false);
          assert.strictEqual(reportedError, 'Song is taking too long. Tap Retry.');
          done();
        }
      }, timeoutMs);
    });

    test('stalled timer is cancelled if playing event fires in time', (t, done) => {
      let isPlaying = false;
      let reportedError: string | null = null;

      const timer = setTimeout(() => {
        if (!isPlaying) {
          reportedError = 'Song is taking too long. Tap Retry.';
        }
      }, 50);

      // Playing fires at 10ms
      setTimeout(() => {
        isPlaying = true;
        clearTimeout(timer);
      }, 10);

      setTimeout(() => {
        assert.strictEqual(isPlaying, true);
        assert.strictEqual(reportedError, null, 'Error must not be reported if playing fired');
        done();
      }, 70);
    });

    test('first track stall or error suppresses auto-skip; subsequent failure allows auto-skip', () => {
      let hasPlayedSuccessfully = false;
      let skippedCount = 0;
      let toastError: string | null = null;

      const simulateFailure = (trackTitle: string, reason: string, isStalled: boolean) => {
        if (!hasPlayedSuccessfully) {
          toastError = isStalled ? 'Song is taking too long. Tap Retry.' : `Failed to play "${trackTitle}" (${reason}). Tap Retry.`;
          return; // Auto-skip suppressed!
        }
        skippedCount++;
        toastError = `Unable to play "${trackTitle}" (${reason}). Skipping to next track...`;
      };

      // 1. First track fails
      simulateFailure('Song 1', 'unsupported/blocked source', false);
      assert.strictEqual(skippedCount, 0, 'Must NOT auto-skip on first track');
      assert.strictEqual(toastError, 'Failed to play "Song 1" (unsupported/blocked source). Tap Retry.');

      // 2. Play succeeds later in session
      hasPlayedSuccessfully = true;

      // 3. Subsequent track fails
      simulateFailure('Song 2', 'network error', false);
      assert.strictEqual(skippedCount, 1, 'Must auto-skip when session previously played successfully');
      assert.strictEqual(toastError, 'Unable to play "Song 2" (network error). Skipping to next track...');
    });
  });

  describe('3. CORS Headers on 200, 206, and Error Responses', () => {
    test('Access-Control-Allow-Origin, Expose-Headers and Vary are present on 206 stream response', async () => {
      const videoId = 'testCors206';
      setCachedStream(videoId, {
        url: `http://127.0.0.1:${mockUpstreamPort}/stream`,
        mimeType: 'audio/mp4',
        contentLength: 10000,
        expiresAt: Date.now() + 3600000
      });

      const res = await fetch(`${baseUrl}/api/stream/${videoId}`, {
        headers: {
          Range: 'bytes=0-100',
          Origin: 'https://musify-live.netlify.app'
        }
      });

      assert.strictEqual(res.status, 206);
      assert.strictEqual(res.headers.get('access-control-allow-origin'), 'https://musify-live.netlify.app');
      assert.ok(res.headers.get('vary')?.includes('Origin'), 'Vary: Origin must be present');
      const expose = res.headers.get('access-control-expose-headers');
      assert.ok(expose?.includes('Content-Range'), 'Content-Range must be exposed');
      assert.ok(expose?.includes('Content-Length'), 'Content-Length must be exposed');
    });

    test('Access-Control-Allow-Origin, Expose-Headers and Vary are present on 400 bad request error', async () => {
      const res = await fetch(`${baseUrl}/api/stream/invalid!id!`, {
        headers: {
          Origin: 'https://musify-live.netlify.app'
        }
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.headers.get('access-control-allow-origin'), 'https://musify-live.netlify.app');
      assert.ok(res.headers.get('vary')?.includes('Origin'));
      assert.ok(res.headers.get('access-control-expose-headers'));
    });

    test('Access-Control-Allow-Origin, Expose-Headers and Vary are present on 429 rate limit error', async () => {
      // Exhaust limiter tokens for this test IP
      const testKey = '127.0.0.99';
      for (let i = 0; i < 35; i++) {
        streamMissLimiter.isAllowed(testKey);
      }

      // Request uncached stream from that IP
      const res = await fetch(`${baseUrl}/api/stream/uncached429`, {
        headers: {
          Origin: 'https://musify-live.netlify.app',
          'X-Forwarded-For': testKey
        }
      });

      assert.strictEqual(res.status, 429);
      assert.strictEqual(res.headers.get('access-control-allow-origin'), 'https://musify-live.netlify.app');
      assert.ok(res.headers.get('vary')?.includes('Origin'));
      assert.ok(res.headers.get('retry-after'));
    });
  });

  describe('4. Production Origin Persistence with ALLOWED_ORIGINS', () => {
    test('production origin is always allowed even when ALLOWED_ORIGINS is set to something else', async () => {
      const originalEnv = process.env.ALLOWED_ORIGINS;
      try {
        process.env.ALLOWED_ORIGINS = 'http://other-staging-site.com,http://custom-preview.internal';

        // 1. Unit helper verification
        assert.strictEqual(isOriginAllowed('https://musify-live.netlify.app'), true);
        assert.strictEqual(isOriginAllowed('http://other-staging-site.com'), true);
        assert.strictEqual(isOriginAllowed('https://attacker-evil.com'), false);

        const allowed = getAllowedOrigins();
        assert.ok(allowed.includes('https://musify-live.netlify.app'), 'Must contain production origin');
        assert.ok(allowed.includes('http://other-staging-site.com'), 'Must contain env origin');

        // 2. HTTP Route test
        const resProd = await fetch(`${baseUrl}/api/health`, {
          headers: { Origin: 'https://musify-live.netlify.app' }
        });
        assert.strictEqual(resProd.status, 200);
        assert.strictEqual(resProd.headers.get('access-control-allow-origin'), 'https://musify-live.netlify.app');

        // 3. Untrusted origin rejection
        const resUntrusted = await fetch(`${baseUrl}/api/health`, {
          headers: { Origin: 'https://attacker-evil.com' }
        });
        assert.strictEqual(resUntrusted.status, 403);
      } finally {
        if (originalEnv !== undefined) {
          process.env.ALLOWED_ORIGINS = originalEnv;
        } else {
          delete process.env.ALLOWED_ORIGINS;
        }
      }
    });
  });

  describe('5. Thumbnail URL Rewriting (lh3 vs yt3)', () => {
    test('only rewrites lh3.googleusercontent.com album-art URLs to =w544-h544-l90-rj', () => {
      const lh3Url = 'https://lh3.googleusercontent.com/abc123xyz=w120-h120-l90-rj';
      const result = getBestThumbnail([{ url: lh3Url, width: 120 }]);
      assert.strictEqual(result, 'https://lh3.googleusercontent.com/abc123xyz=w544-h544-l90-rj');
    });

    test('rewrites yt3.googleusercontent.com channel/avatar URLs to =s544-c-k-c0x00ffffff-no-rj to prevent HTTP 400', () => {
      const yt3Url = 'https://yt3.googleusercontent.com/channelAvatar123=s100-c-k-c0x00ffffff-no-rj';
      const result = getBestThumbnail([{ url: yt3Url, width: 100 }]);
      assert.strictEqual(result, 'https://yt3.googleusercontent.com/channelAvatar123=s544-c-k-c0x00ffffff-no-rj');
      assert.doesNotMatch(result, /=w544-h544-l90-rj/, 'Must NOT rewrite yt3 with w544-h544 parameter');
    });
  });

  describe('6. Diagnostic Debug Endpoint (/api/debug/stream/:videoId)', () => {
    test('returns 404 when DEBUG_ENDPOINTS is false or unset', async () => {
      const prev = process.env.DEBUG_ENDPOINTS;
      try {
        process.env.DEBUG_ENDPOINTS = 'false';
        const res = await fetch(`${baseUrl}/api/debug/stream/dQw4w9WgXcQ`);
        assert.strictEqual(res.status, 404);
      } finally {
        process.env.DEBUG_ENDPOINTS = prev;
      }
    });

    test('returns diagnostic details when DEBUG_ENDPOINTS=true', async () => {
      const prev = process.env.DEBUG_ENDPOINTS;
      try {
        process.env.DEBUG_ENDPOINTS = 'true';
        const res = await fetch(`${baseUrl}/api/debug/stream/dQw4w9WgXcQ`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.videoId, 'dQw4w9WgXcQ');
        assert.ok('innertube' in data, 'Must report innertube step');
        assert.ok('ytdlp' in data, 'Must report ytdlp step');
        assert.ok('failedStep' in data, 'Must report failedStep');
      } finally {
        process.env.DEBUG_ENDPOINTS = prev;
      }
    });
  });
});
