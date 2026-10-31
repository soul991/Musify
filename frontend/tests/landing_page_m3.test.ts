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
  const netlifyTomlPath = path.join(frontendRoot, 'netlify.toml');

  it('verifies index.html and app.html dual-entry contract', () => {
    assert.ok(fs.existsSync(indexHtmlPath), 'index.html must exist for Landing Page');
    assert.ok(fs.existsSync(appHtmlPath), 'app.html must exist for SPA Web Player');

    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    const appHtml = fs.readFileSync(appHtmlPath, 'utf8');

    // Title checks
    assert.match(indexHtml, /<title>Musify — Music, Liquid \| High-Performance Web Player<\/title>/);
    assert.match(appHtml, /<title>Musify — Web Music Player<\/title>/);

    // Root containers
    assert.ok(indexHtml.includes('id="landing-root"'), 'index.html must have #landing-root container');
    assert.ok(appHtml.includes('id="root"'), 'app.html must have #root container');

    // Script entry points
    assert.match(indexHtml, /<script\s+type=["']module["']\s+src=["']\/src\/landing\/main-landing\.tsx["']><\/script>/);
    assert.match(appHtml, /<script\s+type=["']module["']\s+src=["']\/src\/main\.tsx["']><\/script>/);
    // Self-hosted Satoshi font preload and zero Fontshare CDN links
    assert.doesNotMatch(indexHtml, /api\.fontshare\.com/, 'index.html must not contain Fontshare CDN links');
    assert.match(indexHtml, /<link\s+rel=["']preload["'][^>]*href=["']\/fonts\/Satoshi-Variable\.woff2["']/);
    assert.match(appHtml, /<link\s+rel=["']preload["'][^>]*href=["']\/fonts\/Satoshi-Variable\.woff2["']/);
  });

  it('verifies vite.config.ts multi-page rollup inputs and rewrite middleware', () => {
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

    assert.match(viteConfig, /main:\s*resolve\(__dirname,\s*['"]app\.html['"]\)/);
    assert.match(viteConfig, /landing:\s*resolve\(__dirname,\s*['"]index\.html['"]\)/);
    assert.match(viteConfig, /rewriteAppMiddleware/);
    assert.match(viteConfig, /req\.url\s*===\s*['"]\/app['"]/);
  });

  it('verifies public/_redirects and netlify.toml route /app and /app/* to app.html', () => {
    const redirects = fs.readFileSync(redirectsPath, 'utf8');
    const netlifyToml = fs.readFileSync(netlifyTomlPath, 'utf8');

    // _redirects check
    assert.match(redirects, /\/app\s+\/app\.html\s+200/);
    assert.match(redirects, /\/app\/\*\s+\/app\.html\s+200/);
    assert.match(redirects, /\/\*\s+\/index\.html\s+200/);

    // netlify.toml check
    assert.match(netlifyToml, /from\s*=\s*["']\/app["'][\s\S]*to\s*=\s*["']\/app\.html["']/);
    assert.match(netlifyToml, /from\s*=\s*["']\/app\/\*["'][\s\S]*to\s*=\s*["']\/app\.html["']/);
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

    // Window scroll contract
    assert.match(css, /html,\s*body\s*\{[^}]*overflow-y:\s*auto\s*!important/);
    assert.match(css, /html,\s*body\s*\{[^}]*min-height:\s*100vh/);

    // CTA primary styling
    assert.match(css, /\.cta-primary\s*\{[^}]*background:\s*#E5303D/i);
    assert.match(css, /\.cta-primary\s*\{[^}]*border-radius:\s*14px/);
    assert.match(css, /\.cta-primary:active\s*\{[^}]*transform:\s*scale\(0\.97\)/);

    // CTA secondary styling
    assert.match(css, /\.cta-secondary\s*\{[^}]*border-radius:\s*14px/);
    assert.match(css, /\.cta-secondary\s*\{[^}]*backdrop-filter:\s*blur\(12px\)/);
  });

  it('verifies Landing.tsx implements all 6 core architectural sections', () => {
    assert.ok(fs.existsSync(landingTsxPath), 'Landing.tsx must exist');
    const landing = fs.readFileSync(landingTsxPath, 'utf8');

    // Section 1: Glass Navigation Bar with /app CTA
    assert.match(landing, /SECTION 1: GLASS NAVIGATION BAR/);
    assert.match(landing, /href=["']\/app["']/);
    assert.match(landing, /Open App/);

    // Section 2: Hero Section with kinetic typing & 3D floating preview
    assert.match(landing, /SECTION 2: HERO SECTION/);
    assert.match(landing, /headlineText\s*=\s*["']Music, Liquid\.["']/);
    assert.match(landing, /rotateX\(-1\.5deg\)\s+rotateY\(1\.5deg\)/);

    // Section 3: Bento Grid (6 feature cards)
    assert.match(landing, /SECTION 3: FEATURES BENTO GRID/);
    assert.match(landing, /Liquid Glass Design/);
    assert.match(landing, /Synchronized Karaoke/);
    assert.match(landing, /Music Flow Feed/);
    assert.match(landing, /Listen Together/);
    assert.match(landing, /Kinetic Wavy Seekbar/);
    assert.match(landing, /Instant PWA Install/);

    // Section 4: Immersive Player Showcase (Vinyl & Equalizer)
    assert.match(landing, /SECTION 4: IMMERSIVE PLAYER SHOWCASE/);
    assert.match(landing, /Every detail, considered\./);
    assert.match(landing, /10-Band Studio Equalizer/);
    assert.match(landing, /animate-spin-vinyl/);

    // Section 5: Experience Strip
    assert.match(landing, /SECTION 5: EXPERIENCE STRIP/);
    assert.match(landing, /Instant Search/);
    assert.match(landing, /Explore Moods/);
    assert.match(landing, /Audio DSP/);
    assert.match(landing, /Social Sync/);

    // Section 6: Final CTA & CRO Trust Signals
    assert.match(landing, /SECTION 6: FINAL CTA & TRUST FOOTER/);
    assert.match(landing, /Your music\. Your way\./);
    assert.match(landing, /100% Free/);
    assert.match(landing, /No Sign-Up Required/);
    assert.match(landing, /Zero Audio Ads/);
    assert.match(landing, /Open Source/);
  });

  it('verifies main-landing.tsx correctly mounts Landing into #landing-root', () => {
    assert.ok(fs.existsSync(mainLandingPath), 'main-landing.tsx must exist');
    const content = fs.readFileSync(mainLandingPath, 'utf8');

    assert.match(content, /createRoot\(document\.getElementById\(['"]landing-root['"]\)!/);
    assert.match(content, /<Landing\s*\/>/);
  });
});
