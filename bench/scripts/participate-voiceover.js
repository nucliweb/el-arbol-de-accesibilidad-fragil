// Optional VoiceOver test for participants on macOS: how long VoiceOver takes
// to respond in the radio group and along the A11yConf Travel task, with the
// CPU throttled x4 and x1. Writes a report and an archive like participate.js.
//
// Usage (from bench/, after npm run setup): npm run participate:voiceover
//   [--throttles=4,1]
//
// VoiceOver speaks and moves the focus during the whole test (about 20
// minutes): do not use the computer meanwhile.

import { execFileSync } from 'node:child_process';
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
const readDefault = (domain, key) => {
  try {
    return execFileSync('defaults', ['read', domain, key], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
};

if (process.platform !== 'darwin') {
  console.error('The VoiceOver test needs macOS. The Chrome measurements (npm run participate) work on any system.');
  process.exit(1);
}
if (readDefault('com.apple.VoiceOver4/default', 'SCREnableAppleScript') !== '1') {
  console.error('Allow VoiceOver to be controlled by AppleScript first:');
  console.error('VoiceOver Utility > General > "Allow VoiceOver to be controlled with AppleScript".');
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome' });
const environment = describeEnvironment({ chromeVersion: browser.version() });
await browser.close();
const voiceOverVersion = (() => {
  try {
    return execFileSync('defaults', ['read', '/System/Library/CoreServices/VoiceOver.app/Contents/Info', 'CFBundleShortVersionString'])
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
})();
const environmentWithVoiceOver = { ...environment, voiceOver: voiceOverVersion };

console.log('This machine, as it will appear in your results (no name, user or paths):');
console.table(environmentWithVoiceOver);
console.log('\nVoiceOver will speak and move the focus for about 20 minutes. Do not use the computer meanwhile.');
console.log('The first time, macOS asks to let the terminal control VoiceOver: accept it.');
console.log('Starting in 15 seconds; press Ctrl+C to cancel.');
await new Promise((done) => setTimeout(done, 15000));

const script = (name) => join(ROOT, 'scripts', name);
const readRows = (file) => readFileSync(file, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
const sections = [];
const raw = [];

try {
  for (const throttle of throttles) {
    console.log(`\n=== VoiceOver, radio group, CPU x${throttle} ===`);
    const radioFile = rawResultsPath(
      await runNode(script('voiceover.js'), ['--runs=2', '--n=10,100', `--throttle=${throttle}`]),
    );
    const radioSummary = await runNode(script('summarize-voiceover.js'), [radioFile], { quiet: true });
    sections.push({ title: 'VoiceOver, grupo de radios / radio group', throttle, summary: trimSummary(radioSummary) });
    raw.push({ level: 'radio-voiceover', throttle, file: relative(ROOT, radioFile), rows: readRows(radioFile) });

    console.log(`\n=== VoiceOver, A11yConf Travel, CPU x${throttle} ===`);
    const travelFile = rawResultsPath(await runNode(script('voiceover-travel.js'), ['--runs=3', `--throttle=${throttle}`]));
    const travelSummary = await runNode(script('summarize-voiceover-travel.js'), [travelFile], { quiet: true });
    sections.push({ title: 'VoiceOver, A11yConf Travel', throttle, summary: trimSummary(travelSummary) });
    raw.push({ level: 'travel-voiceover', throttle, file: relative(ROOT, travelFile), rows: readRows(travelFile) });
  }
} finally {
  // Quitting VoiceOver through AppleScript can leave macOS flagging it as on,
  // and Chrome then builds the accessibility tree for every page.
  if (readDefault('com.apple.universalaccess', 'voiceOverOnOffKey') === '1') {
    console.log('\nmacOS still flags VoiceOver as on. Press Cmd+F5 twice (on, then off) to clear it;');
    console.log('otherwise Chrome keeps doing accessibility work on every page as if a screen reader were running.');
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = join(ROOT, 'results', 'participant');
mkdirSync(outDir, { recursive: true });
const reportFile = join(outDir, `participant-voiceover-${stamp}.md`);
const archiveFile = join(outDir, `participant-voiceover-${stamp}.json.gz`);
writeFileSync(reportFile, buildReport({ environment: environmentWithVoiceOver, sections }));
writeFileSync(
  archiveFile,
  gzipSync(
    JSON.stringify({ schema: 1, kind: 'voiceover', createdAt: new Date().toISOString(), environment: environmentWithVoiceOver, raw }),
  ),
);

console.log('\nDone. Two files are ready to share:');
console.log(`  Report (paste it into the issue):  ${reportFile}`);
console.log(`  Raw results (attach it):           ${archiveFile}`);
console.log('Open an issue with the "Benchmark results" form:');
console.log('  https://github.com/nucliweb/el-arbol-de-accesibilidad-fragil/issues/new?template=benchmark-results.yml');
