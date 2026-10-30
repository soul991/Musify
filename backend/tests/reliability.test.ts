import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { AsyncTtlCache } from '../src/utils/cache.js';
import {
  setCachedStream,
  streamUrlCache,
  streamMissLimiter,
  getStreamClientKey
} from '../src/services/stream.js';
import app from '../src/index.js';

describe('Phase 1 Backend Reliability & Performance Tests', () => {
  let server: http.Server;
  let port: number;
  let mockUpstream: http.Server;
  let mockUpstreamPort: number;

  before(async () => {
    // 1. Mock upstream server returning partial content / streams
    await new Promise<void>((resolve) => {
      mockUpstream = http.createServer((req, res) => {
        const range = req.headers.range;
        if (range) {
          res.writeHead(206, {
            'Content-Type': 'audio/mp4',
            'Content-Range': 'bytes 0-1000/5000000',
            'Content-Length': '1001',
            'Accept-Ranges': 'bytes'
          });
          res.end(Buffer.alloc(1001, 0x41));
        } else {
          res.writeHead(200, {
            'Content-Type': 'audio/mp4',
            'Content-Length': '5000000',
            'Accept-Ranges': 'bytes'
          });
          res.end(Buffer.alloc(1000, 0x41));
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
        const addr = server.address() as any;
        port = addr.port;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      mockUpstream.close(() => resolve());
    });
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

    test('limiter key extraction uses rightmost XFF entry on direct Catalyst connection, preventing IP spoofing', () => {
      // Direct stream connections go direct to Catalyst (1 hop).
      // A client forging "X-Forwarded-For: 1.1.1.1, 8.8.8.8" still has their true IP
      // appended at the far right by Catalyst: "1.1.1.1, 8.8.8.8, 203.0.113.195"
      const mockReq1 = {
        headers: { 'x-forwarded-for': '1.1.1.1, 203.0.113.195' },
        socket: { remoteAddress: '127.0.0.1' },
        ip: '127.0.0.1'
      } as any;
      const mockReq2 = {
        headers: { 'x-forwarded-for': '2.2.2.2, 9.9.9.9, 203.0.113.195' },
        socket: { remoteAddress: '127.0.0.1' },
        ip: '127.0.0.1'
      } as any;

      const key1 = getStreamClientKey(mockReq1);
      const key2 = getStreamClientKey(mockReq2);

      assert.equal(key1, '203.0.113.195', 'Should extract rightmost IP');
      assert.equal(key2, '203.0.113.195', 'Should extract rightmost IP regardless of forged prefixes');
      assert.equal(key1, key2, 'Forged left-side IPs must not create new rate limit buckets');
    });

    test('30 cache misses limit is enforced against rightmost IP even when client forges left XFF headers', () => {
      streamMissLimiter.reset();
      const realIp = '198.51.100.77';

      // Simulate 30 cache misses from the same client attempting different spoofed headers
      for (let i = 0; i < 30; i++) {
        const forgedXff = `10.0.0.${i}, ${realIp}`;
        const key = getStreamClientKey({
          headers: { 'x-forwarded-for': forgedXff },
          socket: {},
          ip: '127.0.0.1'
        } as any);
        const check = streamMissLimiter.isAllowed(key);
        assert.equal(check.allowed, true, `Request ${i + 1} within 30/min limit should be allowed`);
      }

      // 31st request with yet another spoofed left IP must be blocked (429)
      const forgedXff31 = `192.168.1.99, ${realIp}`;
      const key31 = getStreamClientKey({
        headers: { 'x-forwarded-for': forgedXff31 },
        socket: {},
        ip: '127.0.0.1'
      } as any);
      const blockedCheck = streamMissLimiter.isAllowed(key31);
      assert.equal(blockedCheck.allowed, false, '31st cache miss must be blocked by rate limiter');
      assert.ok((blockedCheck.retryAfterSec || 0) > 0, 'Must provide retryAfterSec');

      streamMissLimiter.reset();
    });
  });

  describe('3. Stream limiter skips cached streams and range requests', () => {
    test('100 range requests on a cached id return non-429 (all 206 OK)', async () => {
      const testId = 'cached100id';
      setCachedStream(testId, {
        url: `http://127.0.0.1:${mockUpstreamPort}/stream.mp4`,
        mimeType: 'audio/mp4',
        contentLength: 5000000,
        expiresAt: Date.now() + 3600000
      });

      // Fire 100 concurrent range requests
      const promises = Array.from({ length: 100 }, (_, i) =>
        fetch(`http://127.0.0.1:${port}/api/stream/${testId}`, {
          headers: {
            Range: `bytes=${i * 50}-${(i + 1) * 50}`
          }
        })
      );

      const responses = await Promise.all(promises);
      assert.equal(responses.length, 100);
      for (const res of responses) {
        assert.notEqual(res.status, 429, 'Range requests on cached track must never return 429');
        assert.equal(res.status, 206, 'Should return HTTP 206 Partial Content');
      }

      streamUrlCache.delete(testId);
    });
  });

  describe('4. Warmup endpoint /api/warm', () => {
    test('GET /api/warm returns warm status and session indicator', async (t) => {
      let isOnline = false;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const probe = await fetch('https://music.youtube.com', {
          method: 'HEAD',
          signal: controller.signal
        });
        clearTimeout(timeout);
        isOnline = probe.status < 500;
      } catch {
        isOnline = false;
      }

      if (!isOnline) {
        t.skip('YouTube Music is unreachable (offline or restricted environment)');
        return;
      }

      const res = await fetch(`http://127.0.0.1:${port}/api/warm`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'warm');
      assert.equal(data.service, 'Musify Backend');
      assert.equal(data.details, undefined, 'details/err.message must never be in response');
    });
  });

  describe('5. Prefetch route /api/stream/prefetch/:videoId', () => {
    test('rejects invalid video ID with 400', async () => {
      const res = await fetch(`http://127.0.0.1:${port}/api/stream/prefetch/invalid-id`);
      assert.equal(res.status, 400);
    });

    test('prefetch route resolves and caches stream exempt from rate limiting', async () => {
      setCachedStream('prefetch123', {
        url: `http://127.0.0.1:${mockUpstreamPort}/stream.mp4`,
        mimeType: 'audio/mp4',
        contentLength: 5000000,
        expiresAt: Date.now() + 3600000
      });

      const res = await fetch(`http://127.0.0.1:${port}/api/stream/prefetch/prefetch123`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.cached, true);
      assert.equal(json.videoId, 'prefetch123');

      streamUrlCache.delete('prefetch123');
    });
  });
});
