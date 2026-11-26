import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeTicks, isQuiet } from '../web/src/lib/busy.js';

// A tick runs every time the main thread is free. A gap between two ticks
// longer than blockMs means the thread was busy (the page, style, layout,
// paint or the accessibility tree).

test('a step that only waits for the next frame is busy until that frame', () => {
  const result = analyzeTicks({ t0: 100, ticks: [100.2, 100.4, 100.6, 101], paintAt: 112, blockMs: 8 });
  assert.deepEqual(result, { busyMs: 12, blockedMs: 0 });
});

test('blocked gaps add up, and the step is busy until the last one ends', () => {
  const ticks = [100.1, 130.1, 130.3, 145.3, 145.5, 146];
  const result = analyzeTicks({ t0: 100, ticks, paintAt: 131, blockMs: 8 });
  assert.equal(result.blockedMs, 45);
  assert.equal(result.busyMs, 45.3);
});

test('the first gap, from the action to the first tick, counts too', () => {
  const result = analyzeTicks({ t0: 0, ticks: [50, 50.2], paintAt: 51, blockMs: 8 });
  assert.deepEqual(result, { busyMs: 51, blockedMs: 50 });
});

test('the thread is quiet once quietMs pass without a blocked gap', () => {
  const ticks = [0.1, 40, 40.2, 40.4];
  assert.equal(isQuiet({ t0: 0, ticks, now: 100, quietMs: 150, blockMs: 8 }), false);
  assert.equal(isQuiet({ t0: 0, ticks, now: 200, quietMs: 150, blockMs: 8 }), true);
  assert.equal(isQuiet({ t0: 0, ticks: [], now: 10, quietMs: 150, blockMs: 8 }), false);
});
