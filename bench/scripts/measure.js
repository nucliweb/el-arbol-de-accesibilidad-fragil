// Measures every radio implementation at every scenario size.
//
// Usage: node scripts/measure.js [--runs=5] [--n=1,10,100,1000]
//          [--targets=native,mui] [--modes=off,on] [--throttle=4]
//
// Each run uses a fresh Chrome (cold cache) with CPU throttling, records a
// trace of the page load and another of one click on a radio, and collects
// DOM, CSS, resource and accessibility tree numbers. Mode "on" launches Chrome
// with --force-renderer-accessibility, which is what happens when a screen
// reader is running; mode "off" is the default for most visitors.

import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync, appendFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';
import { N_VALUES, optionsFor } from '../shared/scenario.js';
import { collectCssStats, collectDomStats } from './lib/page-stats.js';
import { summarizeTrace } from './lib/trace-summary.js';

const ROOT = resolve(import.meta.dirname, '..');

const TARGETS = {
  native: { dir: 'apps/native/dist/native', page: (n) => `n-${n}.html` },
  'native-styled': { dir: 'apps/native/dist/native-styled', page: (n) => `n-${n}.html` },
  'shadcn-base': { dir: 'apps/shadcn/dist', page: (n) => `index.html?n=${n}`, marksRendered: true },
  'shadcn-radix': { dir: 'apps/shadcn-radix/dist', page: (n) => `index.html?n=${n}`, marksRendered: true },
  mui: { dir: 'apps/mui/dist', page: (n) => `index.html?n=${n}`, marksRendered: true },
  'material-web': { dir: 'apps/material-web/dist', page: (n) => `index.html?n=${n}`, marksRendered: true },
};

const TRACE_CATEGORIES = [
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'blink',
  'loading',
  'accessibility',
  'disabled-by-default-accessibility',
];

const SETTLE_MS = 1000;

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);
const runs = Number(args.runs ?? 5);
const sizes = args.n ? args.n.split(',').map(Number) : N_VALUES;
const targets = args.targets ? args.targets.split(',') : Object.keys(TARGETS);
const modes = args.modes ? args.modes.split(',') : ['off', 'on'];
const throttle = Number(args.throttle ?? 4);
// A page that takes longer than this to load is recorded as a timeout.
const loadTimeoutMs = Number(args.timeout ?? 180000);

for (const name of targets) {
  if (!TARGETS[name]) throw new Error(`Unknown target: ${name}`);
  if (!existsSync(join(ROOT, TARGETS[name].dir))) throw new Error(`Missing build for ${name}; run npm run build`);
}

// --- Static server -----------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
};

const server = createServer((req, res) => {
  const [, target, ...rest] = decodeURIComponent(new URL(req.url, 'http://x').pathname).split('/');
  const base = TARGETS[target] && join(ROOT, TARGETS[target].dir);
  const file = base && normalize(join(base, rest.join('/') || 'index.html'));
  if (!file || !file.startsWith(base) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  createReadStream(file).pipe(res);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;

// --- One measured run --------------------------------------------------------

async function measure(targetName, n, mode) {
  const target = TARGETS[targetName];
  const browser = await chromium.launch({
    channel: 'chrome',
    args: mode === 'on' ? ['--force-renderer-accessibility'] : [],
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });

    // Page load
    await browser.startTracing(page, { categories: TRACE_CATEGORIES });
    await page.goto(`${origin}/${targetName}/${target.page(n)}`, { waitUntil: 'load', timeout: loadTimeoutMs });
    if (target.marksRendered) {
      await page.waitForFunction(() => performance.getEntriesByName('bench:rendered').length > 0, null, {
        timeout: loadTimeoutMs,
      });
    }
    await page.waitForTimeout(SETTLE_MS);
    const loadTrace = summarizeTrace(JSON.parse(await browser.stopTracing()));

    const pageMetrics = await page.evaluate(async () => {
      const paint = (name) => performance.getEntriesByName(name)[0]?.startTime ?? null;
      // LCP entries are only exposed through a (buffered) PerformanceObserver.
      const lcp = await new Promise((done) => {
        new PerformanceObserver((list) => done(list.getEntries().at(-1)?.startTime ?? null)).observe({
          type: 'largest-contentful-paint',
          buffered: true,
        });
        setTimeout(() => done(null), 500);
      });
      const bytes = { script: 0, css: 0, font: 0, html: 0 };
      const nav = performance.getEntriesByType('navigation')[0];
      bytes.html = nav?.decodedBodySize ?? 0;
      for (const entry of performance.getEntriesByType('resource')) {
        const kind = entry.name.endsWith('.css') ? 'css' : /\.woff2?$/.test(entry.name) ? 'font' : entry.initiatorType === 'script' ? 'script' : null;
        if (kind) bytes[kind] += entry.decodedBodySize;
      }
      return {
        fcpMs: paint('first-contentful-paint'),
        lcpMs: lcp,
        renderedMs: performance.getEntriesByName('bench:rendered')[0]?.startTime ?? null,
        bytes,
      };
    });
    const dom = await page.evaluate(collectDomStats, '#bench');
    const css = await page.evaluate(collectCssStats);
    const documentElements = await page.evaluate(() => document.getElementsByTagName('*').length);

    // One interaction: click the last option. Event Timing gives an INP-like
    // duration; the trace gives the work behind it.
    await page.evaluate(() => {
      window.__events = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__events.push({ name: e.name, duration: e.duration });
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    });
    const last = optionsFor(n).at(-1);
    // Playwright's role engine does not see roles set through ElementInternals
    // (Material Web), so fall back to the option id there.
    const radio = page
      .getByRole('radio', { name: last.label, exact: true })
      .or(page.locator(`#${last.id}`))
      .first();
    await radio.scrollIntoViewIfNeeded();
    await browser.startTracing(page, { categories: TRACE_CATEGORIES });
    await radio.click();
    await page.waitForTimeout(SETTLE_MS);
    const interactionTrace = summarizeTrace(JSON.parse(await browser.stopTracing()));
    const maxEventMs = await page.evaluate(() => {
      const durations = window.__events.filter((e) => ['pointerdown', 'pointerup', 'click'].includes(e.name)).map((e) => e.duration);
      return durations.length ? Math.max(...durations) : null;
    });

    // Accessibility tree as Chrome exposes it to assistive technology. Asking
    // for it builds it if accessibility was off, so this goes last.
    const started = performance.now();
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const radios = nodes.filter((node) => !node.ignored && node.role?.value === 'radio');
    const isChecked = (node) => node.properties?.some((p) => p.name === 'checked' && p.value.value === 'true');
    const axTree = {
      fetchMs: Math.round((performance.now() - started) * 100) / 100,
      nodes: nodes.length,
      ignoredNodes: nodes.filter((node) => node.ignored).length,
      radios: radios.length,
      namedRadios: radios.filter((node) => node.name?.value).length,
    };
    // Sanity check through the accessibility tree: exactly one radio is
    // checked, and it is the one we clicked.
    const checked = radios.filter(isChecked);
    const interaction = {
      label: last.label,
      maxEventMs,
      checkedCount: checked.length,
      clickedIsChecked: checked.some((node) => node.name?.value === last.label),
    };

    return { target: targetName, n, mode, throttle, documentElements, dom, css, ...pageMetrics, loadTrace, interaction, interactionTrace, axTree };
  } finally {
    await browser.close();
  }
}

// --- Main loop ---------------------------------------------------------------

const resultsDir = join(ROOT, 'results');
mkdirSync(resultsDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const rawFile = join(resultsDir, `raw-${stamp}.jsonl`);
const chromeVersion = await chromium.launch({ channel: 'chrome' }).then(async (b) => {
  const version = b.version();
  await b.close();
  return version;
});
writeFileSync(
  rawFile,
  `${JSON.stringify({ meta: { chrome: chromeVersion, runs, sizes, targets, modes, throttle, startedAt: new Date().toISOString() } })}\n`,
);

const total = targets.length * sizes.length * modes.length * runs;
let done = 0;
for (const n of sizes) {
  for (const mode of modes) {
    for (let run = 1; run <= runs; run += 1) {
      // Interleave targets so drift (thermal, background work) spreads evenly.
      for (const targetName of targets) {
        let result;
        try {
          result = await measure(targetName, n, mode);
        } catch (error) {
          if (error.name !== 'TimeoutError') throw error;
          result = { target: targetName, n, mode, throttle, timeout: true, timeoutMs: loadTimeoutMs };
        }
        appendFileSync(rawFile, `${JSON.stringify({ run, ...result })}\n`);
        done += 1;
        process.stdout.write(`\r${done}/${total} ${targetName} n=${n} a11y=${mode} run=${run}      `);
      }
    }
  }
}
server.close();
console.log(`\nRaw results: ${rawFile}`);
