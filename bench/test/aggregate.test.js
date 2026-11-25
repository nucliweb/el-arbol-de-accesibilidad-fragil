import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregate, median, medianRun } from '../scripts/lib/aggregate.js';

test('median of odd and even lists, ignoring nulls', () => {
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([null, 2, null]), 2);
  assert.equal(median([]), null);
});

const row = (target, n, mode, scriptMs, a11yMs) => ({
  target,
  n,
  mode,
  dom: { elements: 32 },
  loadTrace: { scriptMs, accessibility: { mainThreadMs: a11yMs } },
});

test('groups runs by target, size and mode and takes the median of each metric', () => {
  const rows = [
    { meta: { chrome: '158' } },
    row('native', 10, 'off', 1, 0),
    row('native', 10, 'off', 3, 0),
    row('native', 10, 'off', 2, 0),
    row('mui', 10, 'on', 40, 12),
    row('mui', 10, 'on', 60, 8),
  ];

  const groups = aggregate(rows, {
    elements: (r) => r.dom.elements,
    scriptMs: (r) => r.loadTrace.scriptMs,
    a11yMs: (r) => r.loadTrace.accessibility.mainThreadMs,
  });

  assert.deepEqual(groups, [
    { target: 'native', n: 10, mode: 'off', runs: 3, timeouts: 0, elements: 32, scriptMs: 2, a11yMs: 0 },
    { target: 'mui', n: 10, mode: 'on', runs: 2, timeouts: 0, elements: 32, scriptMs: 50, a11yMs: 10 },
  ]);
});

test('counts timed-out runs and leaves them out of the medians', () => {
  const rows = [
    row('material-web', 1000, 'off', 900, 0),
    { target: 'material-web', n: 1000, mode: 'off', timeout: true, timeoutMs: 180000 },
    { target: 'material-web', n: 1000, mode: 'on', timeout: true, timeoutMs: 180000 },
  ];

  const groups = aggregate(rows, { scriptMs: (r) => r.loadTrace.scriptMs });

  assert.deepEqual(groups, [
    { target: 'material-web', n: 1000, mode: 'off', runs: 1, timeouts: 1, scriptMs: 900 },
    { target: 'material-web', n: 1000, mode: 'on', runs: 0, timeouts: 1, scriptMs: null },
  ]);
});

test('picks the run closest to the median, as the representative one', () => {
  const rows = [
    { run: 1, ms: 300 },
    { run: 2, ms: 100 },
    { run: 3, ms: 210 },
    { run: 4, ms: 900 },
    { run: 5, ms: 180 },
  ];
  assert.equal(medianRun(rows, (r) => r.ms).run, 3);
  assert.equal(medianRun([], (r) => r.ms), null);
});
