import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TRAVEL_TASK, summarizeTask } from '../scripts/lib/travel-task.js';

const timed = TRAVEL_TASK.filter((step) => step.key);

test('starts by focusing a control, so VoiceOver is reading the page before timing', () => {
  assert.ok(TRAVEL_TASK[0].focus);
  assert.equal(TRAVEL_TASK[0].key, undefined);
});

test('expects the result count that the 4-star filter really produces', () => {
  const space = timed.find((step) => step.key === 'Space');
  assert.equal(space.expect, '6 hoteles encontrados');
});

test('opens the first 4-star hotel and returns focus to its button on Escape', () => {
  const open = timed.find((step) => step.key === 'Enter');
  const close = timed.find((step) => step.key === 'Escape');
  assert.equal(open.expect, 'Casa Diagonal');
  assert.equal(close.expect, 'Ver detalles de Casa Diagonal');
});

test('every timed step has a name, a key and an expected phrase', () => {
  assert.ok(timed.length >= 10);
  for (const step of timed) {
    assert.ok(step.name && step.key && step.expect, JSON.stringify(step));
  }
});

test('summarizes the median latency per step and the task total per target', () => {
  const run = (target, latencies) => ({
    target,
    steps: latencies.map((latencyMs, i) => ({ name: `s${i}`, latencyMs })),
  });
  const summary = summarizeTask([
    run('a', [10, 100]),
    run('a', [30, 300]),
    run('a', [20, null]),
    run('b', [5, 50]),
    { target: 'b', error: 'boom' },
  ]);

  assert.deepEqual(summary.a.steps, [
    { name: 's0', medianMs: 20, silences: 0 },
    { name: 's1', medianMs: 200, silences: 1 },
  ]);
  assert.equal(summary.a.totalMs, 220);
  assert.equal(summary.a.runs, 3);
  assert.equal(summary.b.runs, 1);
  assert.equal(summary.b.errors, 1);
});
