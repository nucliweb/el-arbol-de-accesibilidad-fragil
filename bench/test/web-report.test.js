import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIssueUrl, buildWebReport, summarizeSession } from '../web/src/lib/report.js';

const samples = [
  { scenario: 'radio', target: 'native', step: 'load', blockedMs: 10, busyMs: 30, elements: 3005 },
  { scenario: 'radio', target: 'native', step: 'load', blockedMs: 20, busyMs: 40, elements: 3005 },
  { scenario: 'radio', target: 'native', step: 'last', blockedMs: 0, busyMs: 2 },
  { scenario: 'radio', target: 'native', step: 'last', blockedMs: 0, busyMs: 4 },
  { scenario: 'radio', target: 'mui', step: 'last', blockedMs: 100, busyMs: 110 },
  { scenario: 'radio', target: 'mui', step: 'last', blockedMs: 300, busyMs: 310 },
];

test('summarizes a session as the median per scenario, target and step', () => {
  assert.deepEqual(summarizeSession(samples), {
    radio: {
      native: { load: { blockedMs: 15, busyMs: 35, elements: 3005 }, last: { blockedMs: 0, busyMs: 3 } },
      mui: { last: { blockedMs: 200, busyMs: 210 } },
    },
  });
});

const sessions = [
  { screenReader: 'none', summary: summarizeSession(samples) },
  { screenReader: 'TalkBack', summary: summarizeSession(samples.map((s) => ({ ...s, blockedMs: s.blockedMs * 2 }))) },
];
const labels = {
  scenarios: { radio: 'Grupo de 1000 radio buttons' },
  targets: { native: 'HTML nativo', mui: 'MUI' },
  steps: { load: 'Carga', last: 'Elegir la última opción' },
};

test('the report has the device, one table per session and scenario, and the comparison', () => {
  const md = buildWebReport({ environment: { browser: 'Chrome 158', mobile: true }, sessions, labels });

  assert.match(md, /^# /);
  assert.match(md, /\| browser \| Chrome 158 \|/);
  assert.match(md, /## Sin lector de pantalla \/ Without screen reader/);
  assert.match(md, /## Con TalkBack \/ With TalkBack/);
  assert.match(md, /\| Elegir la última opción \| 0 \| 200 \|/);
  assert.match(md, /## Diferencia con TalkBack \/ Difference with TalkBack/);
  assert.match(md, /\| Elegir la última opción \| \+0 \| \+200 \|/);
});

test('the issue link prefills the form, and leaves the raw data out when the link would be too long', () => {
  const short = new URL(buildIssueUrl({ report: '# R', raw: '{"a":1}', device: 'Pixel 7' }));
  assert.equal(short.searchParams.get('template'), 'benchmark-results.yml');
  assert.equal(short.searchParams.get('report'), '# R');
  assert.equal(short.searchParams.get('raw'), '{"a":1}');
  assert.equal(short.searchParams.get('device'), 'Pixel 7');

  const long = new URL(buildIssueUrl({ report: '# R', raw: 'x'.repeat(9000), device: 'Pixel 7' }));
  assert.equal(long.searchParams.get('raw'), null);
  assert.ok(long.href.length < 8000);
});
