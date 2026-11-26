// Measures how long VoiceOver takes to respond at each step of a realistic
// task (lib/travel-task.js) on the "A11yConf Travel" pages.
//
// Usage (from a terminal that can control VoiceOver; it takes over the Mac):
//   node scripts/voiceover-travel.js [--runs=5] [--targets=travel-native]
//     [--throttle=4] [--silence=5000]
//
// For each run: open the page in a visible Chrome with CPU throttling, then go
// through the task. Setup steps move focus and wait until VoiceOver confirms
// it; timed steps press a key and record the time until VoiceOver says the
// expected phrase. No such phrase within --silence ms counts as silence.

import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { announces } from './lib/announces.js';
import { startStaticServer } from './lib/static-server.js';
import { TRAVEL_TARGETS } from './lib/targets.js';
import { TRAVEL_TASK, summarizeTask } from './lib/travel-task.js';
import { listenToVoiceOver, startVoiceOver, stopVoiceOver } from './lib/voiceover.js';

const ROOT = resolve(import.meta.dirname, '..');
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);
const runs = Number(args.runs ?? 5);
const targets = args.targets ? args.targets.split(',') : Object.keys(TRAVEL_TARGETS);
const throttle = Number(args.throttle ?? 4);
const silenceMs = Number(args.silence ?? 5000);
const LOAD_TIMEOUT_MS = 60000;
const SETUP_TIMEOUT_MS = 10000;
const SETTLE_MS = 1000;

const QUIET_MS = 1500;
const QUIET_TIMEOUT_MS = 15000;

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

// Moves focus to a control and waits until VoiceOver announces it. If the
// control already has focus (a dialog may focus it on open), there is nothing
// to wait for.
async function setup(page, step, listener) {
  const control = page.getByRole(step.focus.role, { name: step.focus.name, exact: typeof step.focus.name === 'string' });
  const already = await control.evaluate((el) => el === document.activeElement);
  if (already) return true;
  const focused = Date.now();
  await control.focus();
  return listener.waitFor(focused, (phrase) => announces(phrase, step.expect), SETUP_TIMEOUT_MS);
}

async function measureRun(origin, targetName, listener) {
  const target = TRAVEL_TARGETS[targetName];
  const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] });
  try {
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });

    const loadStarted = performance.now();
    await page.goto(`${origin}/${targetName}/${target.page()}`, { waitUntil: 'load', timeout: LOAD_TIMEOUT_MS });
    if (target.marksRendered) {
      await page.waitForFunction(() => performance.getEntriesByName('bench:rendered').length > 0, null, {
        timeout: LOAD_TIMEOUT_MS,
      });
    }
    const loadMs = performance.now() - loadStarted;

    // Readiness gate: VoiceOver must be reading this Chrome window before the
    // first timed step, or fast pages would start before it switches windows.
    const [first, ...rest] = TRAVEL_TASK;
    let ready = null;
    for (let attempt = 1; attempt <= 3 && !ready; attempt += 1) {
      await page.bringToFront();
      execFileSync('osascript', ['-e', 'tell application "Google Chrome" to activate']);
      await page.evaluate(() => document.activeElement?.blur?.());
      ready = await setup(page, first, listener);
    }
    if (!ready) throw new Error('VoiceOver never announced the first control');
    await sleep(SETTLE_MS);
    // VoiceOver may keep reading the new page on its own (window, heading,
    // group); key presses made meanwhile get lost, so wait until it is quiet.
    await listener.waitForQuiet(QUIET_MS, QUIET_TIMEOUT_MS);

    const steps = [];
    for (const step of rest) {
      if (step.focus) {
        if (!(await setup(page, step, listener))) throw new Error(`VoiceOver never announced "${step.expect}"`);
        await sleep(SETTLE_MS);
        continue;
      }
      const pressed = Date.now();
      await page.keyboard.press(step.key);
      const hit = await listener.waitFor(pressed, (phrase) => announces(phrase, step.expect), silenceMs);
      const said = hit ? null : listener.phrasesSince(pressed).slice(-3);
      steps.push({
        name: step.name,
        key: step.key,
        expected: step.expect,
        latencyMs: hit ? hit.t - pressed : null,
        heard: hit?.phrase ?? null,
        said,
      });
      // Let VoiceOver finish speaking before the next key press.
      await sleep(SETTLE_MS);
    }
    return { loadMs, steps, pollMedianMs: listener.lastPollMs() };
  } finally {
    await browser.close();
  }
}

const server = await startStaticServer(ROOT, TRAVEL_TARGETS);
const resultsDir = join(ROOT, 'results');
mkdirSync(resultsDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const rawFile = join(resultsDir, `voiceover-travel-${stamp}.jsonl`);
writeFileSync(
  rawFile,
  `${JSON.stringify({ meta: { runs, targets, throttle, silenceMs, startedAt: new Date().toISOString() } })}\n`,
);

console.log('Starting VoiceOver. It will speak and move the focus until the test ends.');
await startVoiceOver();
const listener = listenToVoiceOver();
const rows = [];
try {
  for (let run = 1; run <= runs; run += 1) {
    for (const targetName of targets) {
      let row;
      try {
        row = { target: targetName, run, ...(await measureRun(server.origin, targetName, listener)) };
        row.loadMs = Math.round(row.loadMs);
      } catch (error) {
        row = { target: targetName, run, error: error.message };
      }
      appendFileSync(rawFile, `${JSON.stringify(row)}\n`);
      rows.push(row);
      const silences = row.steps?.filter((s) => s.latencyMs === null).length;
      console.log(`${targetName} run=${run}: ${row.error ? `error: ${row.error}` : `${silences} silences`}`);
    }
  }
} finally {
  listener.stop();
  const stopped = await stopVoiceOver();
  if (!stopped) console.log('VoiceOver is still on: press Cmd+F5 to turn it off.');
  server.close();
}

const summary = summarizeTask(rows);
for (const [target, entry] of Object.entries(summary)) {
  console.log(`\n${target}: ${entry.runs} runs, ${entry.errors} errors, task total ${entry.totalMs} ms`);
  for (const step of entry.steps) {
    console.log(`  ${step.name}: ${step.medianMs ?? '–'} ms${step.silences ? `, ${step.silences} silences` : ''}`);
  }
}
console.log(`\nRaw results: ${rawFile}`);
