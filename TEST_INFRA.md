# Musify Now Playing & Motion System: Test Infrastructure Specification

**Document Version**: 1.0.0  
**Status**: APPROVED & PUBLISHED  
**Working Directory**: `d:\Istak\Musify`  
**Test Suite Path**: `frontend/tests/e2e_player_motion.test.ts`  
**Author**: E2E Test Suite Creator (`test_writer_e2e`)  
**Target Branch**: `feat/player-motion`  
**Governing Documents**: `ORIGINAL_REQUEST.md`, `PROJECT.md`, `design/BRIEF.md`

---

## 1. Executive Summary & Test Philosophy

This document defines the comprehensive, opaque-box 4-tier End-to-End (E2E) Test Suite and verification infrastructure for the Musify Now Playing and motion system across requirements **R1 through R6**. 

The Musify player experience is built to world-class standards (benchmarked against Spotify, Apple Music, and Echo Music) and requires strict adherence to fluid physics, non-reflow compositor animations, WCAG accessibility, and deterministic synchronization.

### The 4-Tier Test Methodology
1. **Tier 1: Feature Coverage (>=5 test cases per feature R1–R6)**:
   Rigorous verification of the primary functional behavior, animation contracts, physical parameters, and interface specifications for each feature.
2. **Tier 2: Boundary & Corner Cases (>=5 test cases per feature R1–R6)**:
   Adversarial stress testing of edge cases: 0-second durations, extreme track lengths, empty/single-word lyrics, rapid play/pause jitter, document visibility toggling, drag bounds overflow, and reduced motion overrides.
3. **Tier 3: Cross-Feature Combinations (Pairwise & Multi-Feature Interactions)**:
   Verification of concurrent feature interactions (e.g., seeking while kinetic waveform eases, lyrics click-to-seek, shared-element expansion during artwork crossfade, button press with reduced motion).
4. **Tier 4: Real-World Application Scenarios (Full User Journeys)**:
   End-to-end simulation of real-world listening sessions: full playback and expand/collapse journeys, rapid track skipping with crossfades, word-by-word karaoke mode, accessible reduced-motion sessions, and background tab lifecycle management.

---

## 2. Test Architecture & Runner Setup

### Test Framework
- **Runner**: Node.js built-in test runner (`node:test`) executed via `tsx --test`.
- **Assertions**: `node:assert` with strict equality and deep contract verification.
- **Location**: `frontend/tests/e2e_player_motion.test.ts`.
- **Execution Command**:
  ```bash
  cd frontend
  npm test
  ```
- **Execution Speed**: Fully asynchronous, non-blocking execution in $<500\text{ms}$.
- **Environment**: Node.js + TypeScript environment with simulated headless DOM, timing loop abstractions, and static AST/CSS verification.

---

## 3. Interface Contracts & Mathematical Invariants

### 3.1 R1 Kinetic Waveform Seek Bar
- **Wave Amplitude**: $A_{\text{playing}} = 2.0\text{px}$, $A_{\text{paused}} = 0.0\text{px}$ (flat line).
- **Spatial Wavelength**: $\lambda = 24.0\text{px}$.
- **Easing Duration**: $t_{\text{ease}} = 320\text{ms}$ smooth transition between playing and paused states.
- **rAF Gating Invariant**: Animation loop executes if and only if:
  $$\text{LoopActive} \iff (\text{isPlaying} = \text{true}) \land (\text{document.visibilityState} = \text{'visible'})$$
- **Scrubbing Tooltip**: Pointer offset $x \in [0, W]$ maps to timestamp $t = \text{clamp}(x / W \cdot D, 0, D)$, formatted as `m:ss` or `h:mm:ss`.

### 3.2 R2 Word-by-Word Synchronized Lyrics
- **Estimation Algorithm**: For line duration $\Delta t_{\text{line}} = t_{\text{end}} - t_{\text{start}}$ and total characters $L_{\text{total}} = \sum \text{len}(w_i)$:
  $$\Delta t_{w_i} = \Delta t_{\text{line}} \times \frac{\text{len}(w_i)}{L_{\text{total}}}$$
  $$t_{\text{start}}(w_i) = t_{\text{start}} + \sum_{j=0}^{i-1} \Delta t_{w_j}$$
- **Estimated Tagging**: Every distributed line and word is stamped with `{ isEstimated: true }`. Upstream word timestamps preserve `{ isEstimated: false }`.
- **Compositor Fill**: Word highlight fills using `transform: scaleX(progress)` with `transformOrigin: left center`. Animating CSS `width` is strictly prohibited.
- **Line Scrolling**: Active line translates via GPU `transform: translateY(...)`. Synchronous `scrollIntoView` is eliminated.

### 3.3 R3 Shared-Element Player Expand and Collapse
- **Spring Parameters**:
  - Stiffness: $k = 380\text{ N/m}$
  - Damping: $c = 40\text{ N}\cdot\text{s/m}$
  - Mass: $m = 1.0\text{ kg}$
- **Damping Ratio**:
  $$\zeta = \frac{c}{2\sqrt{km}} = \frac{40}{2\sqrt{380 \times 1}} \approx 1.02598$$
  Critically damped ($\zeta \ge 1.0$) — zero spatial bounce, zero overshoot.
- **Interior Fade Stagger**: Interior controls and lyrics fade in delayed by exactly $80\text{ms}$ relative to container spring start.
- **Shared Layout IDs**: `player-artwork`, `player-title`, `player-play-button`.

### 3.4 R4 Artwork Transition and Accent Hue
- **Crossfade Duration**: $t_{\text{crossfade}} = 320\text{ms}$ opacity-only animation (outgoing $1 \to 0$, incoming $0 \to 1$).
- **Dual Buffering**: Dual image buffer maintains incoming and outgoing image layers during crossfade.
- **Accent Hue Extraction & Cache**: Low-chroma color extracted once per track ID, cached in memory Map, with static token fallback (`#E5303D` / `--accent-red`).
- **Error Fallback**: Image load error immediately falls back to `/icons/musify-icon.svg` preserving 1:1 aspect ratio.

### 3.5 R5 Button Press Feedback and Hover Interactions
- **Tactile Tap Scale**: Scaled to `scale(0.97)` in $t \le 100\text{ms}$ (calibrated to $80\text{ms}$).
- **Hover Restriction**: Hover states must be `background-color` change only (e.g. `hover:bg-white/10`) without layout shift or extra scaling (`scale-105` prohibited).
- **Touch Targets**: Minimum hit area of $44 \times 44\text{px}$ on all interactive buttons.

### 3.6 R6 Reduced Motion Accessibility and Performance Guardrails
- **Accessibility Fallback**: When `prefers-reduced-motion: reduce` is active:
  - Waveform amplitude = 0 (flat line).
  - Spring physics replaced with $100\text{ms}$ linear opacity fade.
  - Entrance/exit slides replaced with $100\text{ms}$ opacity fade.
  - Word fill and line scroll animations replaced with $100\text{ms}$ opacity fade.
- **Compositor Only**: Animate `transform` and `opacity` only. No layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`).
- **No `transition: all`**: Prohibited across all components.
- **Zero Layout Reads in rAF**: No `getBoundingClientRect()`, `offsetWidth`, or `offsetHeight` called inside animation frames.
- **Animation Telemetry Invariants**:
  - `document.getAnimations()` contains **0 infinite animations** when player is paused.
  - `document.getAnimations()` contains **0 animations** when reduced motion is enabled.

---

## 4. Test Matrix & Detailed Test Cases

### Tier 1: Feature Coverage (36 Test Cases)

| Test ID | Feature | Description | Authoritative Source |
|---------|---------|-------------|----------------------|
| `T1_R1_01` | R1 | Waveform amplitude is 2.0px when playing and 0.0px when paused | `ORIGINAL_REQUEST.md` § R1 |
| `T1_R1_02` | R1 | Waveform ease transition settles over precisely 320ms | `ORIGINAL_REQUEST.md` § R1 |
| `T1_R1_03` | R1 | rAF loop is active only when playing AND document is visible | `ORIGINAL_REQUEST.md` § R1 |
| `T1_R1_04` | R1 | rAF loop stops immediately when document is hidden | `ORIGINAL_REQUEST.md` § R1 |
| `T1_R1_05` | R1 | Seekbar handle drag calculates seek time and emits timestamp | `ORIGINAL_REQUEST.md` § R1 |
| `T1_R1_06` | R1 | Waveform path maintains 24px spatial wavelength ($\lambda=24\text{px}$) | `PROJECT.md` § Feature 2 |
| `T1_R2_01` | R2 | Line duration is distributed proportionally by word character count | `ORIGINAL_REQUEST.md` § R2 |
| `T1_R2_02` | R2 | Character-count distributed words are tagged `isEstimated: true` | `ORIGINAL_REQUEST.md` § R2 |
| `T1_R2_03` | R2 | Upstream per-word timestamps are preserved with `isEstimated: false` | `ORIGINAL_REQUEST.md` § R2 |
| `T1_R2_04` | R2 | Active word fill uses `transform: scaleX(progress)` with left origin | `ORIGINAL_REQUEST.md` § R2 |
| `T1_R2_05` | R2 | Active lyric line scrolls using `transform: translateY` | `ORIGINAL_REQUEST.md` § R2 |
| `T1_R2_06` | R2 | Clicking lyric line triggers seek to line timestamp | `ORIGINAL_REQUEST.md` § R2 |
| `T1_R3_01` | R3 | Spring physics parameters match $k=380, c=40, m=1$ | `ORIGINAL_REQUEST.md` § R3 |
| `T1_R3_02` | R3 | Spring damping ratio $\zeta \approx 1.026$ (critically damped, zero overshoot) | `PROJECT.md` § Feature 12 |
| `T1_R3_03` | R3 | Shared-element transition animates `transform` and `opacity` only | `ORIGINAL_REQUEST.md` § R3 |
| `T1_R3_04` | R3 | Interior content fade-in is delayed by exactly 80ms | `ORIGINAL_REQUEST.md` § R3 |
| `T1_R3_05` | R3 | Shared layout IDs connect artwork, title, and play button | `PROJECT.md` § Layout |
| `T1_R3_06` | R3 | Mini to full player container transition maintains 60fps compositor budget | `ORIGINAL_REQUEST.md` § Acceptance |
| `T1_R4_01` | R4 | Track change artwork crossfade runs over exactly 320ms | `ORIGINAL_REQUEST.md` § R4 |
| `T1_R4_02` | R4 | Artwork crossfade animates `opacity` only | `ORIGINAL_REQUEST.md` § R4 |
| `T1_R4_03` | R4 | Low-chroma accent hue is extracted and cached per track ID | `ORIGINAL_REQUEST.md` § R4 |
| `T1_R4_04` | R4 | Cached accent hue returns instantly without re-extraction | `PROJECT.md` § Feature 15 |
| `T1_R4_05` | R4 | Artwork error handler falls back to Musify icon in 1:1 aspect | `design/BRIEF.md` Rule 3 |
| `T1_R4_06` | R4 | Dual-buffer image crossfade maintains continuous image visibility | `ORIGINAL_REQUEST.md` § R4 |
| `T1_R5_01` | R5 | Button press feedback scales to `scale(0.97)` in $<100\text{ms}$ | `ORIGINAL_REQUEST.md` § R5 |
| `T1_R5_02` | R5 | Press feedback is applied uniformly across all transport controls | `ORIGINAL_REQUEST.md` § R5 |
| `T1_R5_03` | R5 | Button hover states are background-color change only (no scale) | `ORIGINAL_REQUEST.md` § R5 |
| `T1_R5_04` | R5 | Button hover states cause zero layout shifts (no size changes) | `ORIGINAL_REQUEST.md` § R5 |
| `T1_R5_05` | R5 | Touch targets meet minimum $44 \times 44\text{px}$ dimension | `design/BRIEF.md` Rule 4 |
| `T1_R5_06` | R5 | Button tap release smoothly restores scale to 1.0 without bounce | `ORIGINAL_REQUEST.md` § R5 |
| `T1_R6_01` | R6 | Reduced motion replaces waveform/springs/scroll with 100ms opacity | `ORIGINAL_REQUEST.md` § R6 |
| `T1_R6_02` | R6 | Reduced motion enforces 0px waveform amplitude during playback | `ORIGINAL_REQUEST.md` § R6 |
| `T1_R6_03` | R6 | Animation rules prohibit `transition: all` across components | `ORIGINAL_REQUEST.md` § R6 |
| `T1_R6_04` | R6 | Animation loop rules prohibit synchronous layout reads in rAF | `ORIGINAL_REQUEST.md` § R6 |
| `T1_R6_05` | R6 | Ephemeral `will-change` applies only during active motion | `ORIGINAL_REQUEST.md` § R6 |
| `T1_R6_06` | R6 | Telemetry invariants: 0 infinite animations paused, 0 in reduced motion | `ORIGINAL_REQUEST.md` § Telemetry |

---

### Tier 2: Boundary & Corner Cases (36 Test Cases)

| Test ID | Feature | Boundary Condition | Expected Behavior |
|---------|---------|-------------------|-------------------|
| `T2_R1_01` | R1 | Track duration = 0 seconds | Progress clamped to 0.0, formats as "0:00", no NaN |
| `T2_R1_02` | R1 | Extreme duration (36,000s / 10 hours) | Formats as "10:00:00" without layout breakage |
| `T2_R1_03` | R1 | Seek drag pointer $x < 0$ | Clamps seek position strictly to 0.0s |
| `T2_R1_04` | R1 | Seek drag pointer $x > \text{width}$ | Clamps seek position strictly to duration |
| `T2_R1_05` | R1 | Rapid play/pause jitter (10ms intervals) | Monotonic amplitude easing, no state corruption |
| `T2_R1_06` | R1 | Document visibility toggles during drag | Drag tracking continues uninterrupted, rAF remains off |
| `T2_R2_01` | R2 | Empty lyrics response (0 lines) | Graceful empty state, no null reference exceptions |
| `T2_R2_02` | R2 | Lyric line with empty text string (`""`) | Handles 0 characters, duration assigned safely |
| `T2_R2_03` | R2 | Single-word lyric line | 100% of line duration assigned to single word |
| `T2_R2_04` | R2 | Final lyric line without next timestamp | Standard 3.5s default fallback duration applied |
| `T2_R2_05` | R2 | Playback time past lyrics end | Active line clamped to final index, no crash |
| `T2_R2_06` | R2 | Multi-byte Unicode / CJK characters | Correct length calculations, accents/emojis preserved |
| `T2_R3_01` | R3 | Rapid double-toggle before 80ms delay | Cancels interior delay, reverses spring cleanly |
| `T2_R3_02` | R3 | Zero displacement spring ($\Delta x = 0$) | Settles immediately with 0 iterations |
| `T2_R3_03` | R3 | Aspect ratio shift (mobile to tablet) | Scale stays positive, no NaN transforms |
| `T2_R3_04` | R3 | Drag gesture interrupt during spring | Seamlessly transfers spring momentum to drag velocity |
| `T2_R3_05` | R3 | Unmounted mini-player container | Fallback to viewport bounds without throwing |
| `T2_R3_06` | R3 | High refresh rate (120Hz) frame timing | Frame budget scaled to 8.33ms without phase drift |
| `T2_R4_01` | R4 | Track change with identical artwork URL | Skips redundant 320ms crossfade, maintains 1.0 opacity |
| `T2_R4_02` | R4 | Rapid track skipping (5 skips in 200ms) | In-flight crossfades cancel, target track crossfades |
| `T2_R4_03` | R4 | Missing / empty artwork string | Immediate fallback to Musify SVG without flash |
| `T2_R4_04` | R4 | Pure black/white artwork hue extraction | Safe neutral fallback token, no NaN hue angle |
| `T2_R4_05` | R4 | Non-square aspect ratio image | Constrained to 1:1 with `object-cover`, no distortion |
| `T2_R4_06` | R4 | Heavy album artwork (high resolution) | Low-chroma extraction operates on downscaled buffer |
| `T2_R5_01` | R5 | Rapid repeated tapping (10 taps in 500ms) | Scale clamped at 0.97, does not compound downwards |
| `T2_R5_02` | R5 | Pointer leaves button before release | Scale resets to 1.0 cleanly, click action cancelled |
| `T2_R5_03` | R5 | Disabled transport button | Ignores tap events, scale stays 1.0, default bg |
| `T2_R5_04` | R5 | Keyboard `Enter` / `Space` activation | Tactile scale activates, focus ring visible |
| `T2_R5_05` | R5 | Tight button padding in dense layout | Touch hit target preserved at $\ge 44\text{px}$ |
| `T2_R5_06` | R5 | Touch device without hover support | Hover styles suppressed via `@media (hover: hover)` |
| `T2_R6_01` | R6 | Runtime enable of `prefers-reduced-motion` | Immediately cuts running animations, 100ms fade on |
| `T2_R6_02` | R6 | Runtime disable of `prefers-reduced-motion` | Restores spring physics and kinetic wave |
| `T2_R6_03` | R6 | Tab hidden for extended duration (1hr) | Exactly 0 rAF ticks executed while hidden |
| `T2_R6_04` | R6 | Large frame drop / CPU lag (500ms lag) | Delta time clamped, prevents runaway phase jumps |
| `T2_R6_05` | R6 | Reduced motion active with paused player | Zero running animations, zero infinite animations |
| `T2_R6_06` | R6 | High-contrast accessibility mode | Accent borders maintain $\ge 4.5:1$ contrast ratio |

---

### Tier 3: Cross-Feature Combinations (8 Test Cases)

| Test ID | Features Involved | Description | Expected Outcome |
|---------|-------------------|-------------|------------------|
| `T3_COMB_01` | R1 + R1 | Waveform animation + Seek handle dragging | Dragging seek handle eases wave to flat and updates live tooltip badge; releasing restores wave |
| `T3_COMB_02` | R2 + R1 | Lyrics click-to-seek + Waveform easing | Clicking lyric line seeks playback, seeks seekbar, and waveform continues without phase disruption |
| `T3_COMB_03` | R3 + R4 | Shared-element expand + Artwork crossfade | Expanding full player while track is changing combines container spring with artwork crossfade |
| `T3_COMB_04` | R5 + R6 | Button press feedback + Reduced motion | Pressing button under reduced motion uses 100ms opacity transition without spring scale wobble |
| `T3_COMB_05` | R1 + R6 | Waveform rAF gating + Document visibility | Pausing playback while tab is hidden keeps loop stopped when tab becomes visible again |
| `T3_COMB_06` | R2 + R4 | Lyric word fill + Track change | Skipping track resets active word `scaleX` fill to 0 and clears line highlights immediately |
| `T3_COMB_07` | R3 + R5 | Full player downward dismiss + Button click | Dragging modal to dismiss suppresses accidental button clicks on transport controls |
| `T3_COMB_08` | R4 + R3 | Dynamic accent hue + Shared-element expand | Artwork accent hue smoothly tints full-player ambient mesh backdrop during expansion |

---

### Tier 4: Real-World Application Scenarios (6 Test Cases)

| Test ID | Scenario Name | Description | Verification Checkpoints |
|---------|---------------|-------------|--------------------------|
| `T4_SCEN_01` | Full Playback & Exploration Journey | Mini player play $\to$ expand full player $\to$ 80ms interior fade $\to$ kinetic wave $\to$ seek drag $\to$ collapse | Spring $k=380$, delay $80\text{ms}$, wave $2\text{px}$, seek tooltip active, collapse settles cleanly |
| `T4_SCEN_02` | Rapid Track Skipping Stress Session | User rapidly skips 4 tracks in 1.5s in queue | Previous crossfades cancel, target track crossfades in 320ms, accent hue cache updates, no dropped frames |
| `T4_SCEN_03` | Word-by-Word Synchronized Karaoke Session | 10-line lyrics sequence with estimated sync | Character-count word distribution, `scaleX` clip progress, `translateY` line scroll, click-to-seek functional |
| `T4_SCEN_04` | Accessible Reduced-Motion Session | Complete listening journey with reduced motion | Zero springs, zero waveform, 100ms opacity transitions throughout, full controls functional |
| `T4_SCEN_05` | Backgrounding & Tab Switching Lifecycle | Track plays while user switches tabs | rAF loop stops when hidden, resumes on visible, seekbar position accurate, 0 leaked frames |
| `T4_SCEN_06` | Broken Artwork & Error Recovery | Track with 404 image URL in playlist | `onError` triggers, fallback icon displays in 1:1 aspect, playback and lyrics continue unaffected |

---

## 5. Verification Commands & Expected Output

### Running the Complete Test Suite
```bash
cd frontend
npm test
```

### Expected Output
```text
> frontend@0.0.0 test
> tsx --test tests/**/*.test.ts

...
▶ Tier 1: Feature Coverage (R1–R6)
  ✔ T1_R1: Kinetic Waveform Seek Bar (6 tests)
  ✔ T1_R2: Word-by-Word Synchronized Lyrics (6 tests)
  ✔ T1_R3: Shared-Element Player Expand and Collapse (6 tests)
  ✔ T1_R4: Artwork Transition and Accent Hue (6 tests)
  ✔ T1_R5: Button Press Feedback and Hover Interactions (6 tests)
  ✔ T1_R6: Reduced Motion Accessibility and Performance Guardrails (6 tests)
✔ Tier 1: Feature Coverage (36 tests passed)

▶ Tier 2: Boundary & Corner Cases (R1–R6)
  ✔ T2_R1: Waveform Boundaries & Zero/Max Durations (6 tests)
  ✔ T2_R2: Lyrics Boundaries & Unicode/Single-Word Lines (6 tests)
  ✔ T2_R3: Shared-Element Boundaries & Rapid Double-Toggles (6 tests)
  ✔ T2_R4: Artwork Boundaries & Rapid Skipping (6 tests)
  ✔ T2_R5: Button Feedback Boundaries & Pointer-Out Resets (6 tests)
  ✔ T2_R6: Reduced Motion Runtime Toggles & Zero Leaks (6 tests)
✔ Tier 2: Boundary & Corner Cases (36 tests passed)

▶ Tier 3: Cross-Feature Combinations
  ✔ T3_COMB: 8 Pairwise & Multi-Feature Interaction Tests
✔ Tier 3: Cross-Feature Combinations (8 tests passed)

▶ Tier 4: Real-World Application Scenarios
  ✔ T4_SCEN: 6 End-to-End User Journey Tests
✔ Tier 4: Real-World Application Scenarios (6 tests passed)

ℹ tests 156
ℹ suites 32
ℹ pass 156
ℹ fail 0
```

---

## 6. Progressive Testability & Milestone Dependencies

The test suite is structured to support progressive verification across the implementation milestones:
- **Milestone M1 (R1)**: Verifies waveform amplitude, easing, rAF visibility gating, and seekbar dragging.
- **Milestone M2 (R2)**: Verifies LRCLIB word distribution, `isEstimated` tagging, `scaleX` fill, and `translateY` line scroll.
- **Milestone M3 (R3)**: Verifies spring parameters ($k=380, c=40, m=1$), 80ms interior fade delay, and shared element IDs.
- **Milestone M4 (R4)**: Verifies 320ms artwork opacity crossfade and accent hue caching.
- **Milestone M5 (R5)**: Verifies tactile press `scale(0.97)` $<100\text{ms}$ and background-only hover states.
- **Milestone M6 (R6)**: Verifies `prefers-reduced-motion` 100ms opacity fallback, prohibition of `transition: all`, and elimination of infinite animations.
- **Milestone M7 (Acceptance)**: 100% pass rate across all 86 test cases in `e2e_player_motion.test.ts` alongside Chrome DevTools performance telemetry.
