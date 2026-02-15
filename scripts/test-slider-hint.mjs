#!/usr/bin/env node
/**
 * Slider ipucu animasyonu testi: easing ve kare kare güncelleme mantığı.
 * Çalıştır: node scripts/test-slider-hint.mjs
 */

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function interpolate(from, to, t) {
    const eased = easeOutCubic(t);
    return from + (to - from) * eased;
}

// Simüle: 50 -> 42, 42 -> 58, 58 -> 50 (duration 1600ms, ~60fps = ~96 frames per phase)
const duration = 1600;
const fps = 60;
const frameCount = Math.ceil((duration / 1000) * fps);
let passed = 0;
let failed = 0;

// Phase 1: 50 -> 34.5
for (let i = 0; i <= frameCount; i++) {
    const t = Math.min(i / frameCount, 1);
    const value = interpolate(50, 34.5, t);
    if (value < 34.4 || value > 50.1) {
        console.error(`Phase 1 frame ${i}: value=${value} expected between 34.5 and 50`);
        failed++;
    } else passed++;
}
if (interpolate(50, 34.5, 0) !== 50) { console.error('Phase 1 start should be 50'); failed++; } else passed++;
if (Math.abs(interpolate(50, 34.5, 1) - 34.5) > 0.001) { console.error('Phase 1 end should be 34.5'); failed++; } else passed++;

// Phase 2: 34.5 -> 65.5
for (let i = 0; i <= frameCount; i++) {
    const t = Math.min(i / frameCount, 1);
    const value = interpolate(34.5, 65.5, t);
    if (value < 34.4 || value > 65.6) {
        console.error(`Phase 2 frame ${i}: value=${value}`);
        failed++;
    } else passed++;
}
if (interpolate(34.5, 65.5, 1) < 65.4) { console.error('Phase 2 end should be 65.5'); failed++; } else passed++;

// Phase 3: 65.5 -> 50
if (interpolate(65.5, 50, 0) !== 65.5) { console.error('Phase 3 start should be 65.5'); failed++; } else passed++;
if (Math.abs(interpolate(65.5, 50, 1) - 50) > 0.001) { console.error('Phase 3 end should be 50'); failed++; } else passed++;

// safePosition clamp
const safePosition = (v) => Math.max(0.5, Math.min(99.5, v));
if (safePosition(0) !== 0.5) { console.error('safePosition(0) should be 0.5'); failed++; } else passed++;
if (safePosition(100) !== 99.5) { console.error('safePosition(100) should be 99.5'); failed++; } else passed++;
if (safePosition(50) !== 50) { console.error('safePosition(50) should be 50'); failed++; } else passed++;

if (failed > 0) {
    console.error(`\n❌ ${failed} assertion(s) failed, ${passed} passed`);
    process.exit(1);
}
console.log(`\n✓ Slider hint test passed (${passed} checks).`);
process.exit(0);
