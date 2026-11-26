// Runs the Chrome measurements of both levels (radio group and A11yConf
// Travel) with the CPU throttled x4, comparable with the talk, and x1, the
// participant's own device. Writes a report to paste into the GitHub issue
// and an archive with the raw results to attach to it.
//
// Usage (from bench/, after npm run setup): npm run participate
//   [--throttles=4,1] [--runs=3]
//
// Nothing is sent anywhere: both files stay on this machine until the
// participant decides to share them.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright';
import { describeEnvironment } from './lib/environment.js';
import { buildReport, rawResultsPath, trimSummary } from './lib/participation.js';
import { runNode } from './lib/run.js';

const ROOT = resolve(import.meta.dirname, '..');
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);
const throttles = (args.throttles ?? '4,1').split(',').map(Number);
const runs = Number(args.runs ?? 3);

const browser = await chromium.launch({ channel: 'chrome' });
const environment = describeEnvironment({ chromeVersion: browser.version() });
await browser.close();

console.log('This machine, as it will appear in your results (no name, user or paths):');
console.table(environment);
console.log(`\nMeasuring both levels with CPU ${throttles.map((t) => `x${t}`).join(' and ')}, ${runs} runs each.`);
console.log('It takes about 10 to 25 minutes, depending on the device. Chrome runs in the background; you can keep using the computer,');
console.log('but heavy work on it will make the results noisier.\n');

const script = (name) => join(ROOT, 'scripts', name);
const readRows = (file) => readFileSync(file, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
const sections = [];
const raw = [];

for (const throttle of throttles) {
  console.log(`\n=== Radio group, CPU x${throttle} ===`);
  const radioFile = rawResultsPath(
    await runNode(script('measure.js'), [`--runs=${runs}`, '--n=10,100', `--throttle=${throttle}`]),
  );
  const radioSummary = await runNode(script('summarize.js'), [radioFile], { quiet: true });
  sections.push({ title: 'Grupo de radios, Chrome / Radio group, Chrome', throttle, summary: trimSummary(radioSummary) });
  raw.push({ level: 'radio', throttle, file: relative(ROOT, radioFile), rows: readRows(radioFile) });

  console.log(`\n=== A11yConf Travel, CPU x${throttle} ===`);
  const travelFile = rawResultsPath(await runNode(script('measure-travel.js'), [`--runs=${runs}`, `--throttle=${throttle}`]));
  const travelSummary = await runNode(script('summarize-travel.js'), [travelFile], { quiet: true });
  sections.push({ title: 'A11yConf Travel, Chrome', throttle, summary: trimSummary(travelSummary) });
  raw.push({ level: 'travel', throttle, file: relative(ROOT, travelFile), rows: readRows(travelFile) });
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = join(ROOT, 'results', 'participant');
mkdirSync(outDir, { recursive: true });
const reportFile = join(outDir, `participant-${stamp}.md`);
const archiveFile = join(outDir, `participant-${stamp}.json.gz`);
writeFileSync(reportFile, buildReport({ environment, sections }));
writeFileSync(
  archiveFile,
  gzipSync(JSON.stringify({ schema: 1, kind: 'chrome', createdAt: new Date().toISOString(), environment, runs, raw })),
);

console.log('\nDone. Two files are ready to share:');
console.log(`  Report (paste it into the issue):  ${reportFile}`);
console.log(`  Raw results (attach it):           ${archiveFile}`);
console.log('Open an issue with the "Benchmark results" form:');
console.log('  https://github.com/nucliweb/el-arbol-de-accesibilidad-fragil/issues/new?template=benchmark-results.yml');
