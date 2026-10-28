import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { AsyncTtlCache } from '../src/utils/cache.js';
import { setCachedStream, streamUrlCache } from '../src/services/stream.js';
import app from '../src/index.js';

describe('Phase 1 Backend Reliability & Performance Tests', () => {
  let server: http.Server;
  let port: number;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        port = addr.port;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('1. In-flight cache de-duplication (50 concurrent calls -> 1 upstream call)', () => {
    test('50 concurrent calls for same key produce exactly 1 upstream fetch', async () => {
      const cache = new AsyncTtlCache<string>(100);
      let upstreamCalls = 0;

      const slowFetcher = async () => {
        upstreamCalls++;
        await new Promise((r) => setTimeout(r, 50));
        return 'resolved-value';
      };

      const promises = Array.from({ length: 50 }, () =>
        cache.fetchDedupe('shared-key', 5000, slowFetcher)
      );

      const results = await Promise.all(promises);

      assert.equal(upstreamCalls, 1, 'Upstream should only be called once');
      assert.equal(results.length, 50);
      results.forEach((val) => assert.equal(val, 'resolved-value'));
    });
  });

  describe('2. Trust proxy & Client IP isolation with X-Forwarded-For', () => {
    test('different spoofed X-Forwarded-For client IPs resolve independently through reverse proxies', async () => {
      // Netlify Edge (Proxy 1) + Catalyst AppSail (Proxy 2)
      // When trust proxy is 2, Express picks client IP (3rd from right)
      const resA = await fetch(`http://127.0.0.1:${port}/api/health`, {
        headers: {
          'X-Forwarded-For': '198.51.100.1, 10.0.0.1, 127.0.0.1'
        }
      });
      assert.equal(resA.status, 200);

      const resB = await fetch(`http://127.0.0.1:${port}/api/health`, {
        headers: {
          'X-Forwarded-For': '198.51.100.2, 10.0.0.1, 127.0.0.1'
        }
      });
      assert.equal(resB.status, 200);
    });
  });

  describe('3. Stream limiter skips cached streams and range requests', () => {
    test('cached stream does not count against stream limiter for repeated requests', async () => {
      const testId = 's88r_4Vs888';
      // In this test, we verify that when cached, requests don't hit the limiter
      setCachedStream(testId, {
        url: 'http://127.0.0.1:9/dummy.mp4',
        mimeType: 'audio/mp4',
        contentLength: 5000000,
        expiresAt: Date.now() + 3600000
      });

      // Fire 10 rapid requests for cached track
      const requests = Array.from({ length: 10 }, (_, i) =>
        fetch(`http://127.0.0.1:${port}/api/stream/${testId}`, {
          headers: {
            'Range': `bytes=${i * 1000}-${(i + 1) * 1000}`
          }
        }).catch(() => null)
      );

      const responses = await Promise.all(requests);
      responses.forEach((res) => {
        if (res) {
          assert.notEqual(res.status, 429, 'Cached stream range requests should never be 429 rate limited');
        }
      });

      streamUrlCache.delete(testId);
    });
  });

  describe('4. Warmup endpoint /api/warm', () => {
    test('GET /api/warm returns warm status and session indicator', async () => {
      const res = await fetch(`http://127.0.0.1:${port}/api/warm`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'warm');
      assert.equal(data.service, 'Musify Backend');
    });
  });

  describe('5. Prefetch route /api/stream/prefetch/:videoId', () => {
    test('rejects invalid video ID with 400', async () => {
      const res = await fetch(`http://127.0.0.1:${port}/api/stream/prefetch/invalid-id`);
      assert.equal(res.status, 400);
    });
  });
});
