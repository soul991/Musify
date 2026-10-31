const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('MUSIFY MILESTONE 2 EMPIRICAL VERIFICATION HARNESS');
console.log('====================================================\n');

let failedAssertions = 0;
let passedAssertions = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedAssertions++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedAssertions++;
  }
}

// ---------------------------------------------------------------------
// TEST 1: FONT FILE INTEGRITY
// ---------------------------------------------------------------------
console.log('--- TEST 1: FONT FILE INTEGRITY ---');
const fontPath = path.resolve(__dirname, '../public/fonts/Satoshi-Variable.woff2');

if (!fs.existsSync(fontPath)) {
  assert(false, `Font file missing at: ${fontPath}`);
} else {
  const stats = fs.statSync(fontPath);
  console.log(`File size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);
  assert(stats.size > 30 * 1024, `Font file size (${stats.size} bytes) is > 30KB`);

  const fd = fs.openSync(fontPath, 'r');
  const buf = Buffer.alloc(4);
  fs.readSync(fd, buf, 0, 4, 0);
  fs.closeSync(fd);

  const magic = buf.toString('ascii');
  const magicHex = buf.toString('hex');
  console.log(`Magic bytes (ASCII): "${magic}", Hex: 0x${magicHex}`);
  assert(magic === 'wOF2', `WOFF2 magic header is "wOF2" (found "${magic}")`);
}

// ---------------------------------------------------------------------
// TEST 2: MOTION TOKENS AND SPRING PHYSICS
// ---------------------------------------------------------------------
console.log('\n--- TEST 2: MOTION TOKENS AND SPRING PHYSICS ---');
const motionFile = path.resolve(__dirname, '../src/utils/motion.ts');
assert(fs.existsSync(motionFile), `motion.ts exists at ${motionFile}`);

const motionContent = fs.readFileSync(motionFile, 'utf8');

// Regex-based extractor for exported objects
function extractExport(src, name) {
  const re = new RegExp(`export\\s+const\\s+${name}[^=]*=\\s*({[\\s\\S]*?\\n};)`, 'm');
  const match = src.match(re);
  if (!match) return null;
  return match[1];
}

// Evaluate spring object
function getSpringObj(src, name) {
  const block = extractExport(src, name);
  if (!block) return null;
  // Clean TS annotations and extract fields
  const stiffnessMatch = block.match(/stiffness:\s*(\d+(?:\.\d+)?)/);
  const dampingMatch = block.match(/damping:\s*(\d+(?:\.\d+)?)/);
  const massMatch = block.match(/mass:\s*(\d+(?:\.\d+)?)/);

  return {
    stiffness: stiffnessMatch ? parseFloat(stiffnessMatch[1]) : undefined,
    damping: dampingMatch ? parseFloat(dampingMatch[1]) : undefined,
    mass: massMatch ? parseFloat(massMatch[1]) : 1.0, // Framer Motion default mass is 1.0
    hasExplicitMass: !!massMatch
  };
}

function calculateZeta(spring) {
  const { stiffness: k, damping: c, mass: m } = spring;
  const criticalDamping = 2 * Math.sqrt(k * m);
  const zeta = c / criticalDamping;
  return { k, c, m, criticalDamping, zeta };
}

// Step response numerical ODE simulation
// m * d2x/dt2 + c * dx/dt + k * (x - 1) = 0
function simulateStep(k, c, m, duration = 1.0, dt = 0.0001) {
  let x = 0;
  let v = 0;
  const target = 1.0;
  let peak = 0;

  for (let t = 0; t <= duration; t += dt) {
    const fSpring = -k * (x - target);
    const fDamp = -c * v;
    const a = (fSpring + fDamp) / m;
    v += a * dt;
    x += v * dt;

    if (x > peak) {
      peak = x;
    }
  }

  const overshoot = Math.max(0, peak - target);
  const overshootPercent = overshoot * 100;
  return { peak, overshoot, overshootPercent };
}

// 2.1 springCinematic
console.log('\n[Checking springCinematic]');
const springCinematic = getSpringObj(motionContent, 'springCinematic');
assert(springCinematic !== null, 'springCinematic is defined and exported');
if (springCinematic) {
  const zCine = calculateZeta(springCinematic);
  console.log(`  k=${zCine.k}, c=${zCine.c}, m=${zCine.m}`);
  console.log(`  Critical damping cc = 2*sqrt(${zCine.k} * ${zCine.m}) = ${zCine.criticalDamping.toFixed(3)}`);
  console.log(`  Damping ratio zeta = c / cc = ${zCine.zeta.toFixed(4)}`);
  assert(zCine.m >= 1.0, `springCinematic has sufficient mass (m=${zCine.m} >= 1.0)`);
  assert(zCine.zeta >= 0.7 && zCine.zeta <= 0.95, `springCinematic has smooth damping (0.7 <= zeta <= 0.95, found ${zCine.zeta.toFixed(4)})`);
  const sim = simulateStep(zCine.k, zCine.c, zCine.m);
  console.log(`  Simulated step overshoot: ${sim.overshootPercent.toFixed(2)}% (peak: ${sim.peak.toFixed(4)})`);
}

// 2.2 springReveal
console.log('\n[Checking springReveal]');
const springReveal = getSpringObj(motionContent, 'springReveal');
assert(springReveal !== null, 'springReveal is defined and exported');
if (springReveal) {
  const zRev = calculateZeta(springReveal);
  console.log(`  k=${zRev.k}, c=${zRev.c}, m=${zRev.m}`);
  console.log(`  Critical damping cc = 2*sqrt(${zRev.k} * ${zRev.m}) = ${zRev.criticalDamping.toFixed(3)}`);
  console.log(`  Damping ratio zeta = c / cc = ${zRev.zeta.toFixed(4)}`);
  assert(zRev.k === 380, `springReveal has expected stiffness 380 (found ${zRev.k})`);
  assert(zRev.zeta >= 0.7 && zRev.zeta <= 0.9, `springReveal has controlled pop damping (found ${zRev.zeta.toFixed(4)})`);
}

// 2.3 springEffects
console.log('\n[Checking springEffects]');
const springEffects = getSpringObj(motionContent, 'springEffects');
assert(springEffects !== null, 'springEffects is defined and exported');
if (springEffects) {
  const zEff = calculateZeta(springEffects);
  console.log(`  k=${zEff.k}, c=${zEff.c}, m=${zEff.m} (explicit mass: ${springEffects.hasExplicitMass})`);
  console.log(`  Critical damping cc = 2*sqrt(${zEff.k} * ${zEff.m}) = ${zEff.criticalDamping.toFixed(3)}`);
  console.log(`  Damping ratio zeta = c / cc = ${zEff.zeta.toFixed(4)}`);
  const sim = simulateStep(zEff.k, zEff.c, zEff.m);
  console.log(`  Simulated step overshoot: ${sim.overshootPercent.toFixed(2)}% (peak: ${sim.peak.toFixed(4)})`);
  
  // Verification requirement: zeta >= 0.99 (critically damped, no wobble/overshoot)
  assert(zEff.zeta >= 0.99, `springEffects is critically damped (zeta >= 0.99, found zeta=${zEff.zeta.toFixed(4)})`);
  assert(sim.overshootPercent < 0.1, `springEffects has no overshoot (<0.1%, found ${sim.overshootPercent.toFixed(2)}%)`);
}

// ---------------------------------------------------------------------
// TEST 3: VARIANT STRUCTURES
// ---------------------------------------------------------------------
console.log('\n--- TEST 3: VARIANT STRUCTURES ---');

// 3.1 forwardTransition
console.log('\n[Checking forwardTransition]');
const forwardBlock = extractExport(motionContent, 'forwardTransition');
assert(forwardBlock !== null, 'forwardTransition is exported');
if (forwardBlock) {
  assert(/initial:\s*{[^}]*opacity:\s*0[^}]*y:\s*16/.test(forwardBlock), 'forwardTransition initial has opacity: 0 and y: 16 (slide up entry)');
  assert(/animate:\s*{[^}]*opacity:\s*1[^}]*y:\s*0/.test(forwardBlock), 'forwardTransition animate has opacity: 1 and y: 0');
  assert(/exit:\s*{[^}]*opacity:\s*0[^}]*y:\s*-8/.test(forwardBlock), 'forwardTransition exit has opacity: 0 and y: -8 (slide up exit)');
}

// 3.2 backwardTransition
console.log('\n[Checking backwardTransition]');
const backwardBlock = extractExport(motionContent, 'backwardTransition');
assert(backwardBlock !== null, 'backwardTransition is exported');
if (backwardBlock) {
  assert(/initial:\s*{[^}]*opacity:\s*0[^}]*y:\s*-16/.test(backwardBlock), 'backwardTransition initial has opacity: 0 and y: -16 (slide down entry)');
  assert(/animate:\s*{[^}]*opacity:\s*1[^}]*y:\s*0/.test(backwardBlock), 'backwardTransition animate has opacity: 1 and y: 0');
  assert(/exit:\s*{[^}]*opacity:\s*0[^}]*y:\s*16/.test(backwardBlock), 'backwardTransition exit has opacity: 0 and y: 16 (slide down exit)');
}

// 3.3 hoverLift & parallaxConfig
console.log('\n[Checking hoverLift & parallaxConfig]');
const hoverBlock = extractExport(motionContent, 'hoverLift');
assert(hoverBlock !== null, 'hoverLift is exported');
if (hoverBlock) {
  assert(/whileHover:\s*{[^}]*y:\s*-3/.test(hoverBlock), 'hoverLift has whileHover with y: -3');
  assert(/whileTap:\s*{[^}]*scale:\s*0\.97/.test(hoverBlock), 'hoverLift has whileTap with scale: 0.97');
}

const parallaxBlock = extractExport(motionContent, 'parallaxConfig');
assert(parallaxBlock !== null, 'parallaxConfig is exported');

// ---------------------------------------------------------------------
// TEST 4: TYPOGRAPHY SYSTEM IN CSS
// ---------------------------------------------------------------------
console.log('\n--- TEST 4: TYPOGRAPHY SYSTEM IN CSS ---');
const cssPath = path.resolve(__dirname, '../src/index.css');
assert(fs.existsSync(cssPath), `index.css exists at ${cssPath}`);
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('@font-face'), 'index.css defines @font-face for Satoshi');
assert(cssContent.includes('/fonts/Satoshi-Variable.woff2'), 'index.css references /fonts/Satoshi-Variable.woff2');
assert(cssContent.includes('font-display: swap'), 'index.css specifies font-display: swap');
assert(cssContent.includes('--font-display:'), 'index.css defines --font-display');
assert(cssContent.includes('--font-body:'), 'index.css defines --font-body');
assert(cssContent.includes('.font-display'), 'index.css has .font-display utility');
assert(cssContent.includes('.font-body'), 'index.css has .font-body utility');
assert(cssContent.includes('.tabular-nums'), 'index.css has .tabular-nums utility');
assert(cssContent.includes('.text-display-xl'), 'index.css defines .text-display-xl');

// ---------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------
console.log('\n====================================================');
console.log(`RESULTS: Passed: ${passedAssertions}, Failed: ${failedAssertions}`);
console.log('====================================================');

if (failedAssertions > 0) {
  console.error('\nVERDICT: FAIL - Defects detected.');
  process.exit(1);
} else {
  console.log('\nVERDICT: PASS - All verifications passed.');
  process.exit(0);
}
