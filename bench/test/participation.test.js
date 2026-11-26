import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, rawResultsPath, trimSummary } from '../scripts/lib/participation.js';

test('finds the raw results file a measurement script printed', () => {
  const out = '1/2 travel-native a11y=off run=1\nRaw results: /tmp/bench/results/travel-raw-1.jsonl\nTraces: /tmp/x\n';
  assert.equal(rawResultsPath(out), '/tmp/bench/results/travel-raw-1.jsonl');
  assert.equal(rawResultsPath('\r3/4 mui n=10      \nRaw results: C:\\bench\\results\\raw-1.jsonl\r\n'), 'C:\\bench\\results\\raw-1.jsonl');
  assert.throws(() => rawResultsPath('no results here'), /no raw results/i);
});

test('drops the local trace section and the top title from a summary', () => {
  const md = '# Title\n\nIntro.\n\n## Carga\n\n| a |\n\n## Trazas para abrir en DevTools\n\nLocal files.\n';
  assert.equal(trimSummary(md), 'Intro.\n\n## Carga\n\n| a |');
});

test('builds the issue report: environment table, then each section with its CPU setting', () => {
  const report = buildReport({
    environment: { os: 'linux 6.8', cpu: 'Intel N100', cpuCores: 4 },
    sections: [{ title: 'A11yConf Travel, Chrome', throttle: 1, summary: '## Carga\n\n| a |' }],
  });

  assert.match(report, /^# /);
  assert.match(report, /\| Sistema \/ OS \| linux 6\.8 \|/);
  assert.match(report, /\| CPU \| Intel N100 \|/);
  assert.match(report, /## A11yConf Travel, Chrome \(CPU ×1\)/);
  assert.match(report, /### Carga/);
});
