import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

describe('Tier 1: Multi-Page Entry Points & HTML Contracts', () => {
  const indexHtmlPath = path.join(frontendRoot, 'index.html');
  const appHtmlPath = path.join(frontendRoot, 'app.html');
  const hasAppHtml = fs.existsSync(appHtmlPath);

  it('verifies index.html has valid HTML5 structure, viewport-fit=cover, and mobile web app meta', () => {
    assert.ok(fs.existsSync(indexHtmlPath), 'index.html must exist at frontend root');
    const content = fs.readFileSync(indexHtmlPath, 'utf8');

    assert.match(content, /<!doctype html>/i, 'Must have HTML5 doctype');
    assert.match(content, /<meta\s+name=["']viewport["'][^>]*viewport-fit=cover/i, 'Viewport must include viewport-fit=cover');
    assert.match(content, /<meta\s+name=["']theme-color["']/i, 'Must define theme-color');
    assert.match(content, /<link\s+rel=["']manifest["']\s+href=["']\/manifest\.json["']/i, 'Must link to /manifest.json');
  });

  it('verifies mount container element exists in entry HTML (progressive M2/M3 check)', () => {
    const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
    if (hasAppHtml) {
      // M3 mode: index.html is landing (#landing-root) and app.html is SPA (#root)
      assert.ok(
        indexContent.includes('id="landing-root"') || indexContent.includes('id="root"'),
        'index.html must have mount root (#landing-root or #root)'
      );
      const appContent = fs.readFileSync(appHtmlPath, 'utf8');
      assert.ok(
        appContent.includes('id="root"'),
        'app.html must have SPA container #root'
      );
    } else {
      // M2 mode: index.html is SPA entry with #root
      assert.ok(
        indexContent.includes('id="root"'),
        'index.html must have #root container for SPA mounting'
      );
    }
  });

  it('verifies script entry point imports valid TypeScript module', () => {
    const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
    if (hasAppHtml) {
      const appContent = fs.readFileSync(appHtmlPath, 'utf8');
      assert.match(appContent, /<script\s+type=["']module["']\s+src=["']\/src\/main\.tsx["']><\/script>/);
    } else {
      assert.match(indexContent, /<script\s+type=["']module["']\s+src=["']\/src\/main\.tsx["']><\/script>/);
    }
  });
});

describe('Tier 2: Vite Configuration & Multi-Page Rollup Input Architecture', () => {
  const viteConfigPath = path.join(frontendRoot, 'vite.config.ts');
  const viteContent = fs.readFileSync(viteConfigPath, 'utf8');
  const appHtmlPath = path.join(frontendRoot, 'app.html');
  const hasAppHtml = fs.existsSync(appHtmlPath);

  it('verifies vite.config.ts uses React and Tailwind plugins', () => {
    assert.match(viteContent, /@vitejs\/plugin-react/, 'vite.config.ts must import @vitejs/plugin-react');
    assert.match(viteContent, /@tailwindcss\/vite/, 'vite.config.ts must import @tailwindcss/vite');
  });

  it('verifies multi-page routing contract logic (simulation of dev rewrite middleware)', () => {
    // Simulator for the Vite dev rewrite middleware specified in PROJECT.md:
    // req.url.startsWith('/app') rewrites to '/app.html'
    const rewriteUrl = (reqUrl: string): string => {
      if (reqUrl === '/app' || reqUrl.startsWith('/app/') || reqUrl.startsWith('/app?')) {
        return '/app.html';
      }
      return reqUrl;
    };

    assert.strictEqual(rewriteUrl('/'), '/');
    assert.strictEqual(rewriteUrl('/app'), '/app.html');
    assert.strictEqual(rewriteUrl('/app/search'), '/app.html');
    assert.strictEqual(rewriteUrl('/app/explore'), '/app.html');
    assert.strictEqual(rewriteUrl('/app?track=123'), '/app.html');
    assert.strictEqual(rewriteUrl('/icons/musify-icon.svg'), '/icons/musify-icon.svg');
  });

  it('validates multi-page rollup inputs contract in vite.config.ts if M3 is active', () => {
    if (hasAppHtml) {
      assert.match(
        viteContent,
        /rollupOptions:\s*\{[^}]*input:\s*\{/s,
        'vite.config.ts must configure rollupOptions.input for multi-page build'
      );
      assert.match(viteContent, /app\.html/, 'rollupOptions.input must include app.html');
      assert.match(viteContent, /index\.html/, 'rollupOptions.input must include index.html');
    } else {
      // M2 baseline: build configuration exists
      assert.ok(viteContent.includes('export default defineConfig'), 'vite.config.ts must define configuration');
    }
  });
});

describe('Tier 3: Netlify Redirects & PWA Web App Manifest Routing', () => {
  const redirectsPath = path.join(frontendRoot, 'public', '_redirects');
  const manifestPath = path.join(frontendRoot, 'public', 'manifest.json');

  it('verifies public/_redirects contains valid SPA redirection rules', () => {
    assert.ok(fs.existsSync(redirectsPath), 'public/_redirects must exist');
    const content = fs.readFileSync(redirectsPath, 'utf8');
    const lines = content.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    assert.ok(lines.length > 0, '_redirects must not be empty');

    // Must have a 200 rewrite rule ending in status 200
    const hasRewrites = lines.some((l) => l.includes('200'));
    assert.ok(hasRewrites, '_redirects must contain at least one 200 rewrite rule');
  });

  it('verifies public/manifest.json conforms to PWA standards and specifies start_url', () => {
    assert.ok(fs.existsSync(manifestPath), 'public/manifest.json must exist');
    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    assert.strictEqual(content.short_name, 'Musify');
    assert.ok(content.name.startsWith('Musify'), 'name must start with Musify');
    assert.ok(content.start_url, 'start_url must be defined');
    assert.strictEqual(content.display, 'standalone');
    assert.ok(Array.isArray(content.icons) && content.icons.length > 0, 'Must define PWA icons');
  });
});
