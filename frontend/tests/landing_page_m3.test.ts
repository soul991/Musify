import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

describe('Milestone 3: Landing Page & Multi-Page Architecture Verification', () => {
  const indexHtmlPath = path.join(frontendRoot, 'index.html');
  const appHtmlPath = path.join(frontendRoot, 'app.html');
  const viteConfigPath = path.join(frontendRoot, 'vite.config.ts');
  const landingCssPath = path.join(frontendRoot, 'src', 'landing', 'landing.css');
  const landingTsxPath = path.join(frontendRoot, 'src', 'landing', 'Landing.tsx');
  const mainLandingPath = path.join(frontendRoot, 'src', 'landing', 'main-landing.tsx');
  const redirectsPath = path.join(frontendRoot, 'public', '_redirects');
  const manifestPath = path.join(frontendRoot, 'public', 'manifest.json');
  const swPath = path.join(frontendRoot, 'public', 'sw.js');

  it('verifies index.html and app.html dual-entry contract', () => {
    assert.ok(fs.existsSync(indexHtmlPath), 'index.html must exist for Landing Page');
    assert.ok(fs.existsSync(appHtmlPath), 'app.html must exist for SPA Web Player');

    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    const appHtml = fs.readFileSync(appHtmlPath, 'utf8');

    // Title checks
    assert.match(indexHtml, /<title>Musify — Ad-free music player with synced lyrics<\/title>/);
    assert.match(appHtml, /<title>Musify — Web Music Player<\/title>/);

    // Root containers
    assert.ok(indexHtml.includes('id="landing-root"'), 'index.html must have #landing-root container');
    assert.ok(appHtml.includes('id="root"'), 'app.html must have #root container');

    // Script entry points
    assert.match(indexHtml, /<script\s+type=["']module["']\s+src=["']\/src\/landing\/main-landing\.tsx["']><\/script>/);
    assert.match(appHtml, /<script\s+type=["']module["']\s+src=["']\/src\/main\.tsx["']><\/script>/);
    // Self-hosted Instrument font preload and zero CDN font links
    assert.doesNotMatch(indexHtml, /api\.fontshare\.com/, 'index.html must not contain Fontshare CDN links');
    assert.doesNotMatch(indexHtml, /fonts\.googleapis\.com/, 'index.html must not contain Google Fonts CDN links');
    assert.match(indexHtml, /<link\s+rel=["']preload["'][^>]*href=["']\/fonts\/InstrumentSans-Variable\.woff2["']/);
    assert.match(appHtml, /<link\s+rel=["']preload["'][^>]*href=["']\/fonts\/InstrumentSans-Variable\.woff2["']/);
    assert.match(indexHtml, /<link\s+rel=["']preload["'][^>]*href=["']\/fonts\/InstrumentSerif-Regular\.woff2["']/);
    assert.match(appHtml, /<link\s+rel=["']preload["'][^>]*href=["']\/fonts\/InstrumentSerif-Regular\.woff2["']/);
  });

  it('verifies vite.config.ts multi-page rollup inputs and rewrite middleware', () => {
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

    assert.match(viteConfig, /main:\s*resolve\(__dirname,\s*['"]app\.html['"]\)/);
    assert.match(viteConfig, /landing:\s*resolve\(__dirname,\s*['"]index\.html['"]\)/);
    assert.match(viteConfig, /rewriteAppMiddleware/);
    assert.match(viteConfig, /req\.url\s*===\s*['"]\/app['"]/);
  });

  it('verifies public/_redirects is the single source of truth for routing /app, /app/*, and /', () => {
    const redirects = fs.readFileSync(redirectsPath, 'utf8');

    // _redirects check
    assert.match(redirects, /\/app\s+\/app\.html\s+200/);
    assert.match(redirects, /\/app\/\*\s+\/app\.html\s+200/);
    assert.match(redirects, /\/\*\s+\/index\.html\s+200/);
    assert.match(redirects, /\/api\/\*\s+https:\/\/musify-backend[^\s]+\s+200!/);
  });

  it('verifies PWA manifest and service worker include /app', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.strictEqual(manifest.start_url, '/app', 'PWA start_url must point to /app');

    const sw = fs.readFileSync(swPath, 'utf8');
    assert.match(sw, /['"]\/app\.html['"]/, 'sw.js STATIC_ASSETS must cache /app.html');
    assert.match(sw, /isApp/, 'sw.js navigation fallback must distinguish /app route');
  });

  it('verifies landing.css allows document scrolling and styles CTAs per design spec', () => {
    assert.ok(fs.existsSync(landingCssPath), 'landing.css must exist');
    const css = fs.readFileSync(landingCssPath, 'utf8');

    // Fontshare check
    assert.doesNotMatch(css, /api\.fontshare\.com/, 'landing.css must not contain Fontshare CDN links');

    // Window scroll contract
    assert.match(css, /html,\s*body\s*\{[^}]*overflow-y:\s*auto\s*!important/);
    assert.match(css, /html,\s*body\s*\{[^}]*min-height:\s*100vh/);

    // CTA primary styling
    assert.match(css, /\.cta-primary\s*\{[^}]*background:\s*(?:var\(--accent\)|#D92B38)/i);
    assert.match(css, /\.cta-primary\s*\{[^}]*border-radius:\s*14px/);
    assert.match(css, /\.cta-primary:active\s*\{[^}]*transform:\s*scale\(0\.97\)/);

    // CTA secondary styling
    assert.match(css, /\.cta-secondary\s*\{[^}]*border-radius:\s*14px/);
    assert.match(css, /\.cta-secondary\s*\{[^}]*backdrop-filter:\s*blur\(12px\)/);
  });

  it('verifies Landing.tsx implements Section 6 landing architecture and CRO trust signals', () => {
    assert.ok(fs.existsSync(landingTsxPath), 'Landing.tsx must exist');
    const landing = fs.readFileSync(landingTsxPath, 'utf8');

    // Section 1: Navigation bar with /app CTA
    assert.match(landing, /href=["']\/app["']/);
    assert.match(landing, /Open App/);

    // Section 2: Hero section with Instrument Serif headline, single sentence, and real screenshot of /app
    assert.match(landing, /font-display/);
    assert.match(landing, /Ad-free music with synced lyrics/);
    assert.match(landing, /\/screenshots\/app-main\.png/);
    assert.doesNotMatch(landing, /rotateX\(-1\.5deg\)/, 'Must not use fake 3D perspective window');
    assert.doesNotMatch(landing, /FF5F56|FFBD2E|27C93F/, 'Must not use fake traffic-light window dots');

    // Section 3: Three feature sections with real screenshots
    assert.match(landing, /Synced lyrics/);
    assert.match(landing, /\/screenshots\/app-stage\.png/);
    assert.match(landing, /Curated flows/);
    assert.match(landing, /Every device/);
    assert.match(landing, /\/screenshots\/app-mobile\.png/);

    // Section 4: Authoritative conversion & CRO trust signals
    assert.match(landing, /100% Free/);
    assert.match(landing, /No Sign-Up Required/);
    assert.match(landing, /Zero Audio Ads/);
    assert.match(landing, /Open Source/);

    // Banned anti-patterns per design brief
    assert.doesNotMatch(landing, /Liquid/, 'Landing must not contain the word Liquid in UI copy');
    assert.doesNotMatch(landing, /animate-(?:ping|pulse|bounce|spin-vinyl|ring-pulse)/, 'Landing must not use infinite loop animations at rest');
  });

  it('verifies main-landing.tsx correctly mounts Landing into #landing-root', () => {
    assert.ok(fs.existsSync(mainLandingPath), 'main-landing.tsx must exist');
    const content = fs.readFileSync(mainLandingPath, 'utf8');

    assert.match(content, /createRoot\(document\.getElementById\(['"]landing-root['"]\)!/);
    assert.match(content, /<Landing\s*\/>/);
  });
});
