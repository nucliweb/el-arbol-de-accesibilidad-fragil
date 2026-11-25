// Measures the "A11yConf Travel" pages: page structure, page load and the
// keyboard task of lib/travel-task.js, with Chrome accessibility off and on.
//
// Usage: node scripts/measure-travel.js [--runs=5] [--targets=travel-native]
//          [--modes=off,on] [--throttle=4]
//
// Each run uses a fresh Chrome (cold cache) with CPU throttling and records
// two traces that open in the DevTools Performance panel: the page load and
// the task. Every timed step of the task is a user timing measure, so it
// shows by name in the Timings track. Traces are saved gzipped in
// results/traces/travel-<stamp>/; summarize-travel.js turns the raw results
// into text tables, including the numbers of each saved trace.

import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright';
import { collectCssStats, collectDomStats } from './lib/page-stats.js';
import { startStaticServer } from './lib/static-server.js';
import { TRAVEL_TARGETS } from './lib/targets.js';
import { findMarks, summarizeTrace } from './lib/trace-summary.js';
import { TRAVEL_TASK } from './lib/travel-task.js';

const ROOT = resolve(import.meta.dirname, '..');

// What the DevTools Performance panel needs (frames, screenshots, JavaScript
// samples, user timing), plus the categories of the accessibility work.
const TRACE_CATEGORIES = [
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'disabled-by-default-devtools.timeline.frame',
  'disabled-by-default-devtools.timeline.stack',
  'disabled-by-default-v8.cpu_profiler',
  'v8.execute',
  'toplevel',
  'blink',
  'blink.user_timing',
  'blink.console',
  'latencyInfo',
  'loading',
  'accessibility',
  'disabled-by-default-accessibility',
];

const SETTLE_MS = 1000;
const STEP_SETTLE_MS = 500;
const LOAD_TIMEOUT_MS = 60000;

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);
const runs = Number(args.runs ?? 5);
const targets = args.targets ? args.targets.split(',') : Object.keys(TRAVEL_TARGETS);
const modes = args.modes ? args.modes.split(',') : ['off', 'on'];
const throttle = Number(args.throttle ?? 4);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const resultsDir = join(ROOT, 'results');
const traceDir = join(resultsDir, 'traces', `travel-${stamp}`);
mkdirSync(traceDir, { recursive: true });

function saveTrace(buffer, name) {
  writeFileSync(join(traceDir, name), gzipSync(buffer));
  return name;
}

async function readAxTree(cdp) {
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const ignored = nodes.filter((n) => n.ignored).length;
  return { nodes: nodes.length, ignoredNodes: ignored, exposedNodes: nodes.length - ignored };
}

const control = (page, focus) =>
  page.getByRole(focus.role, { name: focus.name, exact: typeof focus.name === 'string' });

async function measure(origin, targetName, mode, run) {
  const target = TRAVEL_TARGETS[targetName];
  const browser = await chromium.launch({
    channel: 'chrome',
    // Mode "off" also ignores assistive technology the OS reports as active:
    // macOS can keep VoiceOver flagged as on after it quits, and Chrome then
    // enables accessibility for every page.
    args: mode === 'on' ? ['--force-renderer-accessibility'] : ['--disable-platform-accessibility-integration'],
  });
  const prefix = `${targetName}-a11y-${mode}-run${run}`;
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });

    // --- Page load ---
    await browser.startTracing(page, { categories: TRACE_CATEGORIES, screenshots: true });
    await page.goto(`${origin}/${targetName}/${target.page()}`, { waitUntil: 'load', timeout: LOAD_TIMEOUT_MS });
    if (target.marksRendered) {
      await page.waitForFunction(() => performance.getEntriesByName('bench:rendered').length > 0, null, {
        timeout: LOAD_TIMEOUT_MS,
      });
    }
    await page.waitForTimeout(SETTLE_MS);
    const loadBuffer = await browser.stopTracing();
    const loadTraceFile = saveTrace(loadBuffer, `${prefix}-load.json.gz`);
    const loadTrace = summarizeTrace(JSON.parse(loadBuffer));

    const pageMetrics = await page.evaluate(async () => {
      const paint = (name) => performance.getEntriesByName(name)[0]?.startTime ?? null;
      const lcp = await new Promise((done) => {
        new PerformanceObserver((list) => done(list.getEntries().at(-1)?.startTime ?? null)).observe({
          type: 'largest-contentful-paint',
          buffered: true,
        });
        setTimeout(() => done(null), 1000);
      });
      const bytes = { html: 0, script: 0, css: 0, font: 0 };
      const nav = performance.getEntriesByType('navigation')[0];
      bytes.html = nav?.decodedBodySize ?? 0;
      for (const entry of performance.getEntriesByType('resource')) {
        const kind = entry.name.endsWith('.css')
          ? 'css'
          : /\.woff2?$/.test(entry.name)
            ? 'font'
            : entry.initiatorType === 'script' || /\.m?js$/.test(entry.name)
              ? 'script'
              : null;
        if (kind) bytes[kind] += entry.decodedBodySize;
      }
      return { fcpMs: paint('first-contentful-paint'), lcpMs: lcp, bytes };
    });
    const dom = await page.evaluate(collectDomStats, 'body');
    const css = await page.evaluate(collectCssStats);
    const documentElements = await page.evaluate(() => document.getElementsByTagName('*').length);
    // Accessibility tree right after load, with all 30 hotels. Asking for it
    // builds it, so only when accessibility is already on.
    const axTree = mode === 'on' ? await readAxTree(cdp) : null;

    // --- Keyboard task ---
    await page.evaluate(() => {
      window.__events = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.interactionId) window.__events.push({ name: e.name, startTime: e.startTime, duration: e.duration });
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    });
    await browser.startTracing(page, { categories: TRACE_CATEGORIES, screenshots: true });
    const steps = [];
    for (const step of TRAVEL_TASK) {
      if (step.focus) {
        await control(page, step.focus).focus();
        await page.waitForTimeout(STEP_SETTLE_MS);
        continue;
      }
      const index = steps.length + 1;
      const startedAt = await page.evaluate((i) => performance.mark(`step:${i}:start`).startTime, index);
      await page.keyboard.press(step.key);
      await page.waitForTimeout(STEP_SETTLE_MS);
      const check = await page.evaluate(
        ({ i, name, since }) => {
          performance.mark(`step:${i}:end`);
          performance.measure(`${i}. ${name}`, `step:${i}:start`, `step:${i}:end`);
          const durations = window.__events.filter((e) => e.startTime >= since).map((e) => e.duration);
          const active = document.activeElement;
          return {
            maxEventMs: durations.length ? Math.max(...durations) : null,
            focused: (active?.getAttribute('aria-label') ?? active?.textContent ?? '').trim().slice(0, 80),
            status: document.querySelector('[role=status]')?.textContent ?? null,
            dialogOpen: Boolean(document.querySelector('dialog[open], [role=dialog]')),
          };
        },
        { i: index, name: step.name, since: startedAt },
      );
      steps.push({ index, name: step.name, key: step.key, expected: step.expect, ...check });
    }
    await page.waitForTimeout(SETTLE_MS);
    const taskBuffer = await browser.stopTracing();
    const taskTraceFile = saveTrace(taskBuffer, `${prefix}-task.json.gz`);
    const taskTraceJson = JSON.parse(taskBuffer);
    const taskTrace = summarizeTrace(taskTraceJson);
    const marks = findMarks(taskTraceJson, 'step:');
    for (const step of steps) {
      const from = marks[`step:${step.index}:start`];
      const to = marks[`step:${step.index}:end`];
      step.trace = from !== undefined && to !== undefined ? summarizeTrace(taskTraceJson, { from, to }) : null;
    }

    // Sanity checks: the task did what the VoiceOver test expects.
    const byKey = (key) => steps.find((s) => s.key === key);
    const checks = {
      filterStatus: byKey('Space').status === byKey('Space').expected,
      dialogOpened: byKey('Enter').dialogOpen,
      focusReturned: steps.at(-1).focused.toLowerCase().includes(steps.at(-1).expected.toLowerCase()),
    };

    return {
      target: targetName,
      n: 'travel',
      mode,
      throttle,
      documentElements,
      dom,
      css,
      ...pageMetrics,
      axTree,
      loadTrace,
      loadTraceFile,
      taskTrace,
      taskTraceFile,
      steps,
      checks,
    };
  } finally {
    await browser.close();
  }
}

const server = await startStaticServer(ROOT, TRAVEL_TARGETS);
const rawFile = join(resultsDir, `travel-raw-${stamp}.jsonl`);
const chromeVersion = await chromium.launch({ channel: 'chrome' }).then(async (b) => {
  const version = b.version();
  await b.close();
  return version;
});
writeFileSync(
  rawFile,
  `${JSON.stringify({ meta: { chrome: chromeVersion, runs, targets, modes, throttle, traceDir: `traces/travel-${stamp}`, startedAt: new Date().toISOString() } })}\n`,
);

const total = targets.length * modes.length * runs;
let done = 0;
for (const mode of modes) {
  for (let run = 1; run <= runs; run += 1) {
    // Interleave targets so drift (thermal, background work) spreads evenly.
    for (const targetName of targets) {
      const result = await measure(server.origin, targetName, mode, run);
      appendFileSync(rawFile, `${JSON.stringify({ run, ...result })}\n`);
      done += 1;
      const failed = Object.entries(result.checks).filter(([, ok]) => !ok).map(([name]) => name);
      process.stdout.write(`${done}/${total} ${targetName} a11y=${mode} run=${run}${failed.length ? ` CHECK FAILED: ${failed}` : ''}\n`);
    }
  }
}
server.close();
console.log(`Raw results: ${rawFile}\nTraces: ${traceDir}`);
