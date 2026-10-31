# Musify Test Infrastructure & 4-Tier Verification Architecture

This document establishes the authoritative test infrastructure, testing philosophy, feature-to-test mapping, directory layout, commands, and coverage thresholds for the **Musify Design & Animation Overhaul**.

---

## 1. Test Philosophy

Musify adheres to a **specification-driven, opaque-box, progressive testing methodology**:
1. **Opaque-Box & Behavioral Verification**: Tests evaluate system outputs, contracts, computed tokens, visual geometries, typography ladders, accessibility characteristics, and state transitions against authoritative design specifications, rather than testing internal private implementation details.
2. **Authoritative Ground Truth**: Expected outputs and acceptance limits are derived directly from:
   - `ORIGINAL_REQUEST.md` (R1: Design plan implementation; R2: Live continuous testing and 90+/100 rubric compliance)
   - `musify-design-plan.md` (§1 Landing, §2 Home, §3 Search, §4 Explore, §5 Motion, §6 Typography, §7 Accessibility, §8 Geometry/Contrast)
   - `PROJECT.md` (§ Interface Contracts & Feature Inventory)
   - Design skill rubrics (`ui-ux-animation-critique`, `hallmark`, `apple-design`, `landing-page-cro-expert`, `ux-product-auditor`, `design-taste-frontend`, `theme-factory`)
3. **Four-Tier Testing Pyramid**:
   - **Tier 1: Feature Coverage (Core Unit & Contract)**: Deterministic verification of each individual feature token, component export, typography rule, and layout contract.
   - **Tier 2: Boundary & Corner Cases**: Stress-testing edge conditions, extreme viewports, interrupted springs, rapid navigation, font fallback, and missing media fallbacks.
   - **Tier 3: Cross-Feature Integration**: Verification of coordinated behaviors across modules (e.g. Navigation history tracking triggering directional spring transitions; concentric geometry rules uniting panel, card, and button radii; multi-page routing integration).
   - **Tier 4: Real-World Scenarios & Design Rubric Audits**: Automated evaluation against the 7 evaluation skill rubrics (WCAG AA/AAA color contrast ratios, touch target bounds $\ge 44\text{pt} / 48\text{px}$, 120Hz compositor-only properties, `prefers-reduced-motion` compliance, and CRO conversion signals).
4. **Progressive Testability**: Tests support progressive delivery across project milestones (M1: Figma, M2: Foundation, M3: Landing, M4: App Pages, M5: Audit Polish) without failing when downstream milestones are still in flight.

---

## 2. Feature Inventory Mapping

The 42 features from `PROJECT.md § Feature Inventory` are systematically mapped to test tiers, test suites, and concrete test cases:

| # | Category | Feature Name | Milestone | Tier | Primary Test Suite | Specific Test Assertion / Verification |
|---|----------|--------------|:---------:|:----:|--------------------|----------------------------------------|
| 1 | Architecture | Multi-Page Vite Setup | M3 | Tier 1 | `multi_page_routing.test.ts` | Dual-entry build contracts (`index.html` landing & `app.html` SPA) |
| 2 | Architecture | Netlify SPA Redirects | M3 | Tier 1 | `multi_page_routing.test.ts` | `_redirects` rules rewriting `/app` & `/app/*` to `app.html` |
| 3 | Landing Page | Ambient Hero Canvas | M3 | Tier 2 | `design_rubrics_harness.test.ts` | Radial gradient `#E5303D` atmospheric background glow (opacity 0.15) |
| 4 | Landing Page | Sticky Glass Nav | M3 | Tier 3 | `multi_page_routing.test.ts` | Dynamic blur (`blur(20px) saturate(160%)`) and border contrast |
| 5 | Landing Page | Kinetic Headline Typing | M3 | Tier 1 | `design_rubrics_harness.test.ts` | Headline `"Music, Liquid."` letter stagger timing & reduced-motion fallback |
| 6 | Landing Page | 3D Floating Hero Showcase | M3 | Tier 2 | `design_rubrics_harness.test.ts` | 3D perspective `rotateX(-2deg) rotateY(3deg)` & looping float bounds |
| 7 | Landing Page | Dual Conversion CTAs | M3 | Tier 1 | `design_rubrics_harness.test.ts` | Primary `#E5303D` & Secondary ghost CTA links pointing to `/app` |
| 8 | Landing Page | Bento Grid Micro-Interactions | M3 | Tier 2 | `design_rubrics_harness.test.ts` | 2×3 feature cards, hover lift, blur pulse, and wave animation bounds |
| 9 | Landing Page | Parallax FullPlayer Showcase | M3 | Tier 3 | `motion_tokens.test.ts` | `parallaxConfig` spring tuning ($k=120, \text{damping}=30$) |
| 10 | Landing Page | Horizontal Experience Strip | M3 | Tier 3 | `design_rubrics_harness.test.ts` | Micro-showcase carousel layout and touch target metrics |
| 11 | Landing Page | Trust & Value Proposition Block | M3 | Tier 4 | `design_rubrics_harness.test.ts` | CRO trust signals: 100% free, zero ads, no sign-up, open source |
| 12 | Home Page | "Now Trending" Marquee Hero | M4 | Tier 1 | `design_rubrics_harness.test.ts` | Ken Burns zoom scale bounds ($1.0 \to 1.06$) and fallback styling |
| 13 | Home Page | Hero Auto-Rotation & Crossfade | M4 | Tier 2 | `motion_tokens.test.ts` | AnimatePresence crossfade timing and hover pause affordance |
| 14 | Home Page | Time-Aware Greeting Header | M4 | Tier 1 | `typography_css.test.ts` | Time-dependent greeting typography and hierarchy |
| 15 | Home Page | Gradient Glass Mood Chips | M4 | Tier 2 | `motion_tokens.test.ts` | Spring scale feedback ($k=800$) and touch target bounds $\ge 44\text{px}$ |
| 16 | Home Page | Section Scroll Choreography | M4 | Tier 3 | `motion_tokens.test.ts` | `staggerSection` ($0.08\text{s}$) container viewport margin coordination |
| 17 | Search Page | Expanding Glass Search Input | M4 | Tier 1 | `motion_tokens.test.ts` | `springEffects` ($k=1600, \text{damping}=40$) zero-overshoot focus ring |
| 18 | Search Page | Origin-Anchored Suggestions | M4 | Tier 2 | `motion_tokens.test.ts` | `staggerFast` ($0.03\text{s}$) dropdown entrance spring from top anchor |
| 19 | Search Page | Empty State Discovery Grid | M4 | Tier 1 | `design_rubrics_harness.test.ts` | Discovery grid categories and zero blank-slate cognitive friction |
| 20 | Search Page | Recent Searches Clear & Delete | M4 | Tier 2 | `design_rubrics_harness.test.ts` | Recent search item removal bounds and Clear All contract |
| 21 | Search Page | Categorized Filter Tabs | M4 | Tier 3 | `accessibility_reduced_motion.test.ts`| Filter tabs keyboard navigability and active pill contrast |
| 22 | Search Page | Featured "Top Result" Card | M4 | Tier 1 | `motion_tokens.test.ts` | `springReveal` ($k=380, \text{damping}=28$) entrance and hover play reveal |
| 23 | Search Page | Categorized Search Results | M4 | Tier 3 | `typography_css.test.ts` | Section headings, circular artist avatars, square album art layout |
| 24 | Explore Page | Atmospheric Featured Mood Hero | M4 | Tier 1 | `design_rubrics_harness.test.ts` | Hero card atmospheric gradient and 1-click Play CTA |
| 25 | Explore Page | Moods & Genres 2-Column Grid | M4 | Tier 2 | `design_rubrics_harness.test.ts` | 100px height gradient cards responsive grid constraints |
| 26 | Explore Page | Mood-to-Results Layout Morph | M4 | Tier 3 | `motion_tokens.test.ts` | Shared element container morph spring ($k=380$) continuity |
| 27 | Explore Page | Trending Now Numbered List | M4 | Tier 1 | `typography_css.test.ts` | Numbered list rank badge and tabular numerals |
| 28 | Explore Page | New Releases Carousel | M4 | Tier 2 | `design_rubrics_harness.test.ts` | Horizontal momentum carousel and overflow clipping |
| 29 | Motion System | Spring Physics Engine | M2 | Tier 1 | `motion_tokens.test.ts` | `springCinematic`, `springReveal`, `springEffects` calibration |
| 30 | Motion System | Directional Page Transitions | M2 | Tier 1 | `motion_tokens.test.ts` | `forwardTransition` (+16px) & `backwardTransition` (-16px) |
| 31 | Motion System | Hover Lift Micro-Interactions | M2 | Tier 1 | `motion_tokens.test.ts` | `hoverLift` ($y: -3\text{px}$, scale: $0.97$) micro-interaction token |
| 32 | Typography | Satoshi Variable Font Integration | M2 | Tier 1 | `typography_css.test.ts` | `@font-face` declaration, font asset existence, Fontshare fallback |
| 33 | Typography | Hierarchical Type Scale | M2 | Tier 1 | `typography_css.test.ts` | Display XL (72px), Display (40px), Title (28px), Section (20px), Body |
| 34 | Typography | Tabular Numeric Timers | M2 | Tier 1 | `typography_css.test.ts` | `.tabular-nums` `font-variant-numeric` on playback duration timers |
| 35 | Accessibility | Reduced Motion Adaptation | M2 | Tier 4 | `accessibility_reduced_motion.test.ts`| `@media (prefers-reduced-motion)` & `<MotionConfig reducedMotion="user">` |
| 36 | Accessibility | WCAG AA/AAA Contrast Compliance | M2 | Tier 4 | `accessibility_reduced_motion.test.ts`| Contrast: 19.3:1 (text), 8.6:1 (muted), 4.7:1 (CTA on OLED) |
| 37 | Figma Design | Frame 1: Design System & Tokens | M1 | Tier 1 | `design_rubrics_harness.test.ts` | Token consistency between Figma design spec and code tokens |
| 38 | Figma Design | Frame 2: Landing Page Design | M1 | Tier 1 | `design_rubrics_harness.test.ts` | 6-section landing layout parity with code implementation |
| 39 | Figma Design | Frame 3: Home Page Redesign | M1 | Tier 1 | `design_rubrics_harness.test.ts` | Now Trending hero card and mood chips visual design parity |
| 40 | Figma Design | Frame 4: Search Page Redesign | M1 | Tier 1 | `design_rubrics_harness.test.ts` | Glass search input and empty state discovery parity |
| 41 | Figma Design | Frame 5: Explore Page Redesign | M1 | Tier 1 | `design_rubrics_harness.test.ts` | Featured mood hero and 2-column mood grid parity |
| 42 | Quality & Audit | Live Testing & Rubric Audits | M5 | Tier 4 | `design_rubrics_harness.test.ts` | Automated scoring across 7 design rubrics achieving $\ge 90/100$ |

---

## 3. Test Architecture & Directory Layout

The automated testing suite is located in `frontend/tests/` and runs with Node's native `node:test` framework using `tsx`:

```
d:\Istak\Musify\
├── TEST_INFRA.md                                  [This document: Test Architecture & Mapping]
├── TEST_READY.md                                  [Verification summary & execution guide]
└── frontend/
    ├── package.json                               [Test script: "test": "tsx --test tests/**/*.test.ts"]
    └── tests/
        ├── motion_tokens.test.ts                  [Tier 1 & 2: Motion physics, springs, transitions]
        ├── typography_css.test.ts                 [Tier 1 & 2: Satoshi font, type scale, tabular-nums]
        ├── multi_page_routing.test.ts             [Tier 1 & 3: Multi-entry Vite, redirects, manifest]
        ├── accessibility_reduced_motion.test.ts   [Tier 1 & 4: Reduced motion, WCAG AA/AAA, focus rings]
        └── design_rubrics_harness.test.ts         [Tier 3 & 4: 7-Skill automated rubric audit harness]
```

---

## 4. Test Execution Commands

### Primary Test Suite Command
To execute the complete automated test suite across all 4 tiers:
```powershell
cd d:\Istak\Musify\frontend
npm test
```

### Direct Runner Execution
```powershell
# Run individual test suites
npx tsx --test tests/motion_tokens.test.ts
npx tsx --test tests/typography_css.test.ts
npx tsx --test tests/multi_page_routing.test.ts
npx tsx --test tests/accessibility_reduced_motion.test.ts
npx tsx --test tests/design_rubrics_harness.test.ts

# Run all tests with spec reporter
npx tsx --test --test-reporter=spec tests/**/*.test.ts
```

### Full Project Build & Static Analysis Verification
```powershell
cd d:\Istak\Musify\frontend
npm run build      # Verifies TypeScript compilation and production bundle build
npm run lint       # Verifies Oxlint static code analysis and anti-slop rules
```

---

## 5. Coverage Thresholds & Success Criteria

Musify enforces strict quality gates across each tier:

| Tier | Focus Area | Required Pass Rate | Target Criteria |
|---|---|:---:|---|
| **Tier 1** | **Feature & Token Coverage** | **100% (0 failures)** | All spring tokens, typography classes, routing entries, and exports match interface contracts. |
| **Tier 2** | **Boundary & Edge Cases** | **100% (0 failures)** | Missing assets, zero overshoots, extreme viewport constraints, and interrupted transitions handled cleanly. |
| **Tier 3** | **Cross-Feature Integration** | **100% (0 failures)** | Multi-page routing, concentric radii ($R_{panel} > R_{card} > R_{tile}$), and navigation transitions function seamlessly together. |
| **Tier 4** | **Design Rubric Audit Harness** | **100% (0 failures)** | Automated verification achieves $\ge 90/100$ on all 7 design skill rubrics: `ui-ux-animation-critique` ($\ge 90$), `hallmark` (100% floor rules), `apple-design` ($\ge 90$), `landing-page-cro-expert` ($\ge 90$), `ux-product-auditor` ($\ge 90$). |

All test suites must exit cleanly with code `0`.
