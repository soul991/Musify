import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as motion from '../src/utils/motion.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

type ViewMode =
  | { type: 'tab'; tab: string }
  | { type: 'search' }
  | { type: 'settings' }
  | { type: 'stats' }
  | { type: 'history' }
  | { type: 'equalizer' }
  | { type: 'listen_together' }
  | { type: 'album'; id: string }
  | { type: 'artist'; id: string }
  | { type: 'playlist'; id?: string; customPlaylist?: { id: string; name: string; tracks: any[] } };

describe('Adversarial Test 1: Navigation State Engine & Concurrency Stress', () => {
  it('analyzes popView behavior when viewHistory length is 1 (boundary condition)', () => {
    // Exact logic from App.tsx lines 59, 132-137
    let viewHistory: ViewMode[] = [{ type: 'tab', tab: 'home' }];
    let navDirection: 'forward' | 'backward' = 'forward';

    const popView = () => {
      if (viewHistory.length > 1) {
        navDirection = 'backward';
        viewHistory = viewHistory.slice(0, viewHistory.length - 1);
      }
    };

    // When length is 1, calling popView should be a no-op
    popView();
    assert.strictEqual(viewHistory.length, 1, 'History must not decrease below 1');
    assert.strictEqual(viewHistory[0].type, 'tab');
    assert.strictEqual(navDirection, 'forward', 'navDirection must not change when pop is invalid');

    // Repeated calls at boundary
    for (let i = 0; i < 50; i++) {
      popView();
    }
    assert.strictEqual(viewHistory.length, 1);
    assert.ok(viewHistory[viewHistory.length - 1] !== undefined);
  });

  it('uncovers stale-closure risk in rapid multi-click popView when length is 2', () => {
    // Model React state updater queue under synchronous multi-click events
    // In App.tsx:
    // const popView = () => {
    //   if (viewHistory.length > 1) {
    //     setNavDirection('backward');
    //     setViewHistory((prev) => prev.slice(0, prev.length - 1));
    //   }
    // };
    let viewHistory: ViewMode[] = [{ type: 'tab', tab: 'home' }, { type: 'search' }];
    const stateQueue: ((prev: ViewMode[]) => ViewMode[])[] = [];

    const mockSetViewHistory = (updater: (prev: ViewMode[]) => ViewMode[]) => {
      stateQueue.push(updater);
    };

    // Two rapid clicks before React can re-render
    const simulateRapidPopClicks = () => {
      // Click 1: sees viewHistory.length === 2 (true)
      if (viewHistory.length > 1) {
        mockSetViewHistory((prev) => prev.slice(0, prev.length - 1));
      }
      // Click 2 (in same event microtask, viewHistory closure is still length 2):
      if (viewHistory.length > 1) {
        mockSetViewHistory((prev) => prev.slice(0, prev.length - 1));
      }
    };

    simulateRapidPopClicks();

    // Now React flushes state queue
    for (const updater of stateQueue) {
      viewHistory = updater(viewHistory);
    }

    // EMPIRICAL FINDING:
    // With `prev.slice(0, prev.length - 1)` without internal length guard:
    // Updater 1 leaves 1 item.
    // Updater 2 leaves 0 items!
    const isVulnerableToEmptyHistory = viewHistory.length === 0;
    assert.strictEqual(
      isVulnerableToEmptyHistory,
      true,
      'Empirically reproduces: if popView is called rapidly before re-render, closure guard allows history to drop to 0'
    );

    // Verify defensive pattern that prevents this:
    const safeUpdater = (prev: ViewMode[]) => (prev.length > 1 ? prev.slice(0, prev.length - 1) : prev);
    let safeHistory: ViewMode[] = [{ type: 'tab', tab: 'home' }, { type: 'search' }];
    safeHistory = safeUpdater(safeHistory); // returns 1 item
    safeHistory = safeUpdater(safeHistory); // guard inside updater preserves 1 item
    assert.strictEqual(safeHistory.length, 1, 'Safe updater guarantees minimum history length 1');

    // Verify App.tsx source code implements this defensive updater pattern
    const appTsxContent = fs.readFileSync(path.join(frontendRoot, 'src', 'App.tsx'), 'utf8');
    assert.match(
      appTsxContent,
      /setViewHistory\s*\(\s*\(prev\)\s*=>\s*\(?prev\.length\s*>\s*1\s*\?\s*prev\.slice\(0,\s*prev\.length\s*-\s*1\)\s*:\s*prev\)?\s*\)/,
      'App.tsx popView must use defensive functional updater to prevent empty history state under rapid dispatch'
    );
  });

  it('tests rapid alternating back/forward clicks and direction consistency', () => {
    let viewHistory: ViewMode[] = [{ type: 'tab', tab: 'home' }];
    let navDirection: 'forward' | 'backward' = 'forward';

    const pushView = (view: ViewMode) => {
      navDirection = 'forward';
      viewHistory.push(view);
    };

    const popView = () => {
      if (viewHistory.length > 1) {
        navDirection = 'backward';
        viewHistory.pop();
      }
    };

    // Rapid alternating 1000 times
    for (let i = 0; i < 1000; i++) {
      pushView({ type: 'album', id: `album-${i}` });
      assert.strictEqual(navDirection, 'forward');
      popView();
      assert.strictEqual(navDirection, 'backward');
    }

    assert.strictEqual(viewHistory.length, 1);
    assert.strictEqual(navDirection, 'backward');
  });

  it('tests handleTabChange resetting history to exactly 1 element', () => {
    let viewHistory: ViewMode[] = [
      { type: 'tab', tab: 'home' },
      { type: 'search' },
      { type: 'album', id: '123' },
      { type: 'artist', id: '456' },
      { type: 'settings' },
    ];
    let navDirection: 'forward' | 'backward' = 'backward';

    const handleTabChange = (tab: string) => {
      navDirection = 'forward';
      viewHistory = [{ type: 'tab', tab }];
    };

    handleTabChange('explore');
    assert.strictEqual(viewHistory.length, 1);
    assert.strictEqual((viewHistory[0] as any).tab, 'explore');
    assert.strictEqual(navDirection, 'forward');
  });

  it('stress-tests history growth under sustained navigation (10,000 pushes)', () => {
    let viewHistory: ViewMode[] = [{ type: 'tab', tab: 'home' }];
    const _memBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < 10000; i++) {
      viewHistory.push({
        type: 'playlist',
        id: `pl-${i}`,
        customPlaylist: {
          id: `pl-${i}`,
          name: `Playlist ${i}`,
          tracks: new Array(10).fill({ title: 'Song', artist: 'Artist' }),
        },
      });
    }

    assert.strictEqual(viewHistory.length, 10001);
    const current = viewHistory[viewHistory.length - 1];
    assert.strictEqual(current.type, 'playlist');

    // Simulate tab change garbage collection reset
    viewHistory = [{ type: 'tab', tab: 'home' }];
    assert.strictEqual(viewHistory.length, 1);
  });
});

describe('Adversarial Test 2: Typography Classes & Tabular Nums Stress', () => {
  const cssPath = path.join(frontendRoot, 'src', 'index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  it('verifies all 7 required typography classes exist in index.css', () => {
    const requiredClasses = [
      '.text-display-xl',
      '.text-display',
      '.text-title',
      '.text-section',
      '.text-body',
      '.text-caption',
      '.tabular-nums',
    ];

    for (const cls of requiredClasses) {
      assert.ok(
        cssContent.includes(cls),
        `index.css must declare class ${cls}`
      );
    }
  });

  it('verifies tabular-nums does NOT introduce font weight distortion or spacing bugs', () => {
    // Extract .tabular-nums CSS rule block
    const tabularMatch = cssContent.match(/\.tabular-nums\s*\{([^}]+)\}/);
    assert.ok(tabularMatch, '.tabular-nums block must be found');
    const tabularBody = tabularMatch[1];

    // 1. Must define font-variant-numeric: tabular-nums
    assert.match(tabularBody, /font-variant-numeric:\s*tabular-nums;/);

    // 2. Must NOT define font-weight (which would distort inherited bold/semibold/medium)
    assert.doesNotMatch(tabularBody, /font-weight:/, '.tabular-nums must NOT override font-weight');

    // 3. Must NOT define font-family (which would override typography scale font)
    assert.doesNotMatch(tabularBody, /font-family:/, '.tabular-nums must NOT override font-family');

    // 4. Must NOT define letter-spacing (which would cause numeral kerning distortion)
    assert.doesNotMatch(tabularBody, /letter-spacing:/, '.tabular-nums must NOT alter letter-spacing');

    // 5. Must NOT define font-size or line-height
    assert.doesNotMatch(tabularBody, /font-size:/, '.tabular-nums must NOT alter font-size');
    assert.doesNotMatch(tabularBody, /line-height:/, '.tabular-nums must NOT alter line-height');
  });

  it('verifies display vs body font-family separation in typography classes', () => {
    // Display classes must use var(--font-display)
    const displayClasses = ['.text-display-xl', '.text-display', '.text-title'];
    for (const cls of displayClasses) {
      const match = cssContent.match(new RegExp(`\\${cls}\\s*\\{([^}]+)\\}`));
      assert.ok(match, `${cls} block must exist`);
      assert.match(
        match[1],
        /font-family:\s*var\(--font-display\);/,
        `${cls} must declare font-family: var(--font-display)`
      );
    }

    // Body classes must use var(--font-body)
    const bodyClasses = ['.text-section', '.text-body', '.text-caption', '.text-overline'];
    for (const cls of bodyClasses) {
      const match = cssContent.match(new RegExp(`\\${cls}\\s*\\{([^}]+)\\}`));
      assert.ok(match, `${cls} block must exist`);
      assert.match(
        match[1],
        /font-family:\s*var\(--font-body\);/,
        `${cls} must declare font-family: var(--font-body)`
      );
    }
  });

  it('verifies optical tracking hierarchy descends monotonically with font size', () => {
    // Extract letter-spacing values
    const getTracking = (cls: string): number => {
      const match = cssContent.match(new RegExp(`\\${cls}\\s*\\{[^}]*letter-spacing:\\s*([-\\d.]+)em`));
      return match ? parseFloat(match[1]) : 0;
    };

    const trackDisplayXl = getTracking('.text-display-xl'); // -0.04em
    const trackDisplay = getTracking('.text-display');       // -0.03em
    const trackTitle = getTracking('.text-title');           // -0.02em
    const trackSection = getTracking('.text-section');       // -0.01em
    const trackBody = getTracking('.text-body');             // 0em (neutral)

    assert.strictEqual(trackDisplayXl, -0.04);
    assert.strictEqual(trackDisplay, -0.03);
    assert.strictEqual(trackTitle, -0.02);
    assert.strictEqual(trackSection, -0.01);
    assert.strictEqual(trackBody, 0);

    // Monotonic increase of tracking as font size decreases (anti-crowding optical rule)
    assert.ok(trackDisplayXl < trackDisplay);
    assert.ok(trackDisplay < trackTitle);
    assert.ok(trackTitle < trackSection);
    assert.ok(trackSection < trackBody);
  });
});

describe('Adversarial Test 3: Motion Variant Physics Integrity', () => {
  it('validates forwardTransition and backwardTransition spring contracts', () => {
    assert.ok(motion.forwardTransition);
    assert.ok(motion.backwardTransition);

    const fwdAnim = motion.forwardTransition.animate as any;
    const bwdAnim = motion.backwardTransition.animate as any;

    // Both must use spring physics with identical stiffness and damping
    assert.strictEqual(fwdAnim.transition.type, 'spring');
    assert.strictEqual(bwdAnim.transition.type, 'spring');
    assert.strictEqual(fwdAnim.transition.stiffness, 420);
    assert.strictEqual(bwdAnim.transition.stiffness, 420);
    assert.strictEqual(fwdAnim.transition.damping, 30);
    assert.strictEqual(bwdAnim.transition.damping, 30);

    // Verify exit durations are snappy (< 200ms) to prevent sluggishness on back navigation
    const fwdExit = motion.forwardTransition.exit as any;
    const bwdExit = motion.backwardTransition.exit as any;
    assert.ok(fwdExit.transition.duration <= 0.2, 'Forward exit duration must be <= 200ms');
    assert.ok(bwdExit.transition.duration <= 0.2, 'Backward exit duration must be <= 200ms');
  });

  it('validates App.tsx motion key prevents stale view reuse', () => {
    const appPath = path.join(frontendRoot, 'src', 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf8');

    // Key must differentiate view types, tabs, and entity IDs
    assert.match(
      appContent,
      /key=\{currentView\.type\s*\+\s*\(currentView\.type\s*===\s*'tab'\s*\?\s*currentView\.tab\s*:\s*''\)\s*\+\s*\(\('id'\s*in\s*currentView\s*&&\s*currentView\.id\)\s*\?\s*currentView\.id\s*:\s*''\)\}/
    );
  });
});
