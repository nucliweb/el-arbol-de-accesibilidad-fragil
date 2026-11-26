// Measures how long VoiceOver takes to announce each radio option when moving
// through the group with the arrow keys, for every implementation.
//
// Usage (from a terminal that can control VoiceOver; it takes over the Mac):
//   node scripts/voiceover.js [--runs=3] [--n=10,100,1000] [--steps=20]
//     [--targets=native,mui] [--throttle=4] [--silence=5000]
//
// For each page: open it in a visible Chrome with CPU throttling, focus the
// first radio, then press ArrowDown --steps times. Each latency is the time
// from the key press until VoiceOver's last spoken phrase announces the next
// option. No announcement within --silence ms counts as silence. VoiceOver is
// read through AppleScript (lib/voiceover.js), polled about every 6 ms; the
// average poll duration is recorded.

import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { optionsFor } from '../shared/scenario.js';
import { median } from './lib/aggregate.js';
import { announces } from './lib/announces.js';
import { startStaticServer } from './lib/static-server.js';
import { FIRST_RADIO_SELECTOR, TARGETS } from './lib/targets.js';
import { listenToVoiceOver, startVoiceOver, stopVoiceOver } from './lib/voiceover.js';

const ROOT = resolve(import.meta.dirname, '..');
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);
const runs = Number(args.runs ?? 3);
const sizes = (args.n ?? '10,100,1000').split(',').map(Number);
const steps = Number(args.steps ?? 20);
const targets = args.targets ? args.targets.split(',') : Object.keys(TARGETS);
const throttle = Number(args.throttle ?? 4);
const silenceMs = Number(args.silence ?? 5000);
const LOAD_TIMEOUT_MS = 180000;
const SETTLE_MS = 1000;
const READY_TIMEOUT_MS = 10000;

const QUIET_MS = 1500;
const QUIET_TIMEOUT_MS = 15000;

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function measurePage(origin, targetName, n, listener) {
  const target = TARGETS[targetName];
  const options = optionsFor(n);
  const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] });
  try {
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });

    const loadStarted = performance.now();
    await page.goto(`${origin}/${targetName}/${target.page(n)}`, { waitUntil: 'load', timeout: LOAD_TIMEOUT_MS });
    if (target.marksRendered) {
      await page.waitForFunction(() => performance.getEntriesByName('bench:rendered').length > 0, null, {
        timeout: LOAD_TIMEOUT_MS,
      });
    }
    const loadMs = performance.now() - loadStarted;

    // Readiness gate: VoiceOver must be reading this Chrome window before any
    // measurement, or fast pages would start before it switches windows.
    let ready = null;
    for (let attempt = 1; attempt <= 3 && !ready; attempt += 1) {
      await page.bringToFront();
      execFileSync('osascript', ['-e', 'tell application "Google Chrome" to activate']);
      const focused = Date.now();
      await page.evaluate((selector) => document.querySelector(selector).blur?.(), FIRST_RADIO_SELECTOR);
      await page.evaluate((selector) => document.querySelector(selector).focus(), FIRST_RADIO_SELECTOR);
      ready = await listener.waitFor(focused, (phrase) => announces(phrase, options[0].label), READY_TIMEOUT_MS);
    }
    if (!ready) throw new Error('VoiceOver never announced the first option');
    await sleep(SETTLE_MS);
    // VoiceOver may keep reading the new page on its own (window, heading,
    // group); key presses made meanwhile get lost, so wait until it is quiet.
    await listener.waitForQuiet(QUIET_MS, QUIET_TIMEOUT_MS);

    const results = [];
    for (let step = 1; step <= steps; step += 1) {
      const expected = options[step % n].label;
      const pressed = Date.now();
      await page.keyboard.press('ArrowDown');
      const hit = await listener.waitFor(pressed, (phrase) => announces(phrase, expected), silenceMs);
      // For silences, keep what VoiceOver did say (page phrases only, since the
      // readiness gate confirmed it is reading this window).
      const said = hit ? null : listener.phrasesSince(pressed).slice(-2);
      results.push({ step, expected, latencyMs: hit ? hit.t - pressed : null, heard: hit?.phrase ?? null, said });
      // Let VoiceOver finish speaking before the next key press.
      await sleep(300);
    }
    return { loadMs, results, pollMedianMs: listener.lastPollMs() };
  } finally {
    await browser.close();
  }
}

const server = await startStaticServer(ROOT, TARGETS);
const resultsDir = join(ROOT, 'results');
mkdirSync(resultsDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const rawFile = join(resultsDir, `voiceover-${stamp}.jsonl`);
writeFileSync(
  rawFile,
  `${JSON.stringify({ meta: { runs, sizes, steps, targets, throttle, silenceMs, startedAt: new Date().toISOString() } })}\n`,
);

console.log('Starting VoiceOver. It will speak and move the focus until the test ends.');
await startVoiceOver();
const listener = listenToVoiceOver();
const summary = [];
try {
  for (const n of sizes) {
    for (let run = 1; run <= runs; run += 1) {
      for (const targetName of targets) {
        let row;
        try {
          const { loadMs, results, pollMedianMs } = await measurePage(server.origin, targetName, n, listener);
          const latencies = results.map((r) => r.latencyMs).filter((v) => v !== null);
          row = {
            target: targetName,
            n,
            run,
            loadMs: Math.round(loadMs),
            medianLatencyMs: median(latencies),
            maxLatencyMs: latencies.length ? Math.max(...latencies) : null,
            silences: results.length - latencies.length,
            pollMedianMs,
            results,
          };
        } catch (error) {
          row = { target: targetName, n, run, error: error.message };
        }
        appendFileSync(rawFile, `${JSON.stringify(row)}\n`);
        summary.push(row);
        const status = row.error
          ? `error: ${row.error}`
          : `median ${row.medianLatencyMs?.toFixed(0)} ms, ${row.silences} silences`;
        console.log(`${targetName} n=${n} run=${run}: ${status}`);
      }
    }
  }
} finally {
  listener.stop();
  const stopped = await stopVoiceOver();
  if (!stopped) console.log('VoiceOver is still on: press Cmd+F5 to turn it off.');
  server.close();
}

console.log('\nMedian announcement latency per target and size (all runs):');
for (const n of sizes) {
  for (const targetName of targets) {
    const rows = summary.filter((r) => r.n === n && r.target === targetName && !r.error);
    const latencies = rows.flatMap((r) => r.results.map((x) => x.latencyMs).filter((v) => v !== null));
    const silences = rows.reduce((sum, r) => sum + r.silences, 0);
    console.log(`  n=${n} ${targetName}: ${median(latencies)?.toFixed(0) ?? '–'} ms, ${silences} silences, ${rows.length} runs`);
  }
}
console.log(`\nRaw results: ${rawFile}`);
