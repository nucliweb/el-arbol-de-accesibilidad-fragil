import { test } from 'node:test';
import assert from 'node:assert/strict';
import { optionsFor, countFromSearch, N_VALUES } from '../shared/scenario.js';

test('builds n options with unique ids, values and labels', () => {
  const options = optionsFor(25);

  assert.equal(options.length, 25);
  assert.equal(new Set(options.map((o) => o.id)).size, 25);
  assert.equal(new Set(options.map((o) => o.value)).size, 25);
  assert.equal(new Set(options.map((o) => o.label)).size, 25);
});

test('uses moon names, numbering them once the list repeats', () => {
  const labels = optionsFor(12).map((o) => o.label);

  assert.equal(labels[0], 'Calisto');
  assert.equal(labels[10], 'Calisto 2');
});

test('reads the option count from the query string, defaulting to 10', () => {
  assert.equal(countFromSearch('?n=1000'), 1000);
  assert.equal(countFromSearch(''), 10);
  assert.equal(countFromSearch('?n=abc'), 10);
  assert.equal(countFromSearch('?n=0'), 10);
});

test('benchmarks 1, 10, 100 and 1000 options', () => {
  assert.deepEqual(N_VALUES, [1, 10, 100, 1000]);
});
