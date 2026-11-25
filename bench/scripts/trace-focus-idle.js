// Records what a page does while nobody touches it, with keyboard focus on a
// control: Tab to the "4 estrellas" checkbox, then 5 seconds idle. Runs with
// prefers-reduced-motion: reduce and Chrome accessibility on, as for a person
// who navigates with a keyboard or a screen reader and asked for less motion.
//
// Usage: node scripts/trace-focus-idle.js [--runs=3] [--targets=travel-native]
//          [--throttle=4]
//
// Saves every trace in results/traces/focus-idle-<stamp>/, copies the
// representative run of each page (median main thread time) to
// traces/focus-idle/, and writes a text summary next to the raw results.

import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright';
import { median, medianRun } from './lib/aggregate.js';
import { startStaticServer } from './lib/static-server.js';
import { TRACE_CATEGORIES } from './lib/trace-categories.js';
import { TRAVEL_TARGETS } from './lib/targets.js';
import { busyByThread, countEvents, findMarks, summarizeTrace } from './lib/trace-summary.js';

const ROOT = resolve(import.meta.dirname, '..');
const IDLE_MS = 5000;
const SETTLE_MS = 1000;
const LOAD_TIMEOUT_MS = 60000;
const MEASURE_NAME = 'Foco de teclado en «4 estrellas», sin tocar nada (5 s)';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);
const runs = Number(args.runs ?? 3);
const targets = args.targets ? args.targets.split(',') : Object.keys(TRAVEL_TARGETS);
const throttle = Number(args.throttle ?? 4);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const allDir = join(ROOT, 'results', 'traces', `focus-idle-${stamp}`);
const publishedDir = join(ROOT, 'traces', 'focus-idle');
mkdirSync(allDir, { recursive: true });
mkdirSync(publishedDir, { recursive: true });

async function measure(origin, targetName, run) {
  const target = TRAVEL_TARGETS[targetName];
  const browser = await chromium.launch({ channel: 'chrome', args: ['--force-renderer-accessibility'] });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    await page.goto(`${origin}/${targetName}/${target.page()}`, { waitUntil: 'load', timeout: LOAD_TIMEOUT_MS });
    if (target.marksRendered) {
      await page.waitForFunction(() => performance.getEntriesByName('bench:rendered').length > 0, null, {
        timeout: LOAD_TIMEOUT_MS,
      });
    }
    // Keyboard focus, so the page shows its keyboard focus style.
    await page.getByRole('checkbox', { name: '5 estrellas', exact: true }).focus();
    await page.keyboard.press('Tab');
    await page.waitForTimeout(SETTLE_MS);

    await browser.startTracing(page, { categories: TRACE_CATEGORIES, screenshots: true });
    await page.evaluate(() => performance.mark('idle:start'));
    await page.waitForTimeout(IDLE_MS);
    const state = await page.evaluate((name) => {
      performance.mark('idle:end');
      performance.measure(name, 'idle:start', 'idle:end');
      return {
        focused: document.activeElement?.closest('label')?.textContent.trim() ?? document.activeElement?.tagName,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        runningAnimations: document
          .getAnimations()
          .filter((a) => a.playState === 'running')
          .map((a) => ({
            name: a.animationName ?? a.constructor.name,
            durationMs: a.effect?.getTiming().duration,
            infinite: a.effect?.getTiming().iterations === Infinity,
            target: String(a.effect?.target?.className ?? '').split(' ')[0],
          })),
      };
    }, MEASURE_NAME);
    const buffer = await browser.stopTracing();
    const file = `${targetName}-run${run}.json.gz`;
    writeFileSync(join(allDir, file), gzipSync(buffer));

    const trace = JSON.parse(buffer);
    const marks = findMarks(trace, 'idle:');
    const window = { from: marks['idle:start'], to: marks['idle:end'] };
    const summary = summarizeTrace(trace, window);
    const counts = countEvents(trace, ['Paint', 'UpdateLayoutTree', 'Layout'], window);
    const frames = countEvents(trace, ['PipelineReporter'], { ...window, phase: 'b' }).PipelineReporter;
    const threads = busyByThread(trace, window);
    return { target: targetName, run, file, ...state, summary, counts, frames, threads };
  } finally {
    await browser.close();
  }
}

const server = await startStaticServer(ROOT, TRAVEL_TARGETS);
const rows = [];
for (let run = 1; run <= runs; run += 1) {
  for (const targetName of targets) {
    const row = await measure(server.origin, targetName, run);
    rows.push(row);
    console.log(`${targetName} run=${run}: ${row.frames} frames, ${row.runningAnimations.length} running animations`);
  }
}
server.close();

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
let md = '# Foco de teclado y 5 segundos sin tocar nada\n\n';
md += `Chrome con la accesibilidad activada y \`prefers-reduced-motion: reduce\`, CPU ×${throttle}, ${runs} ejecuciones por versión; se muestra la mediana. El foco de teclado está en el checkbox «4 estrellas» (Tab desde «5 estrellas») y durante 5 segundos no se toca nada. Inicio: ${stamp}.\n\n`;
md += '| Versión | Animaciones en marcha | Frames | GPU (ms) | Tareas del compositor | Hilo principal del renderer (ms) | Recálculos de estilo | Accesibilidad (ms) | Traza publicada |\n';
md += '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |\n';
for (const targetName of targets) {
  const group = rows.filter((r) => r.target === targetName);
  const rep = medianRun(group, (r) => r.summary.mainThreadBusyMs);
  copyFileSync(join(allDir, rep.file), join(publishedDir, `${targetName}.json.gz`));
  const animations = rep.runningAnimations.length
    ? rep.runningAnimations.map((a) => `${a.target} (${a.durationMs} ms${a.infinite ? ', infinita' : ''})`).join('; ')
    : 'Ninguna';
  const med = (pick) => num(median(group.map(pick)));
  md += `| ${targetName} | ${animations} | ${med((r) => r.frames)} | ${med((r) => r.threads.CrGpuMain?.ms ?? 0)} | ${med((r) => r.threads.Compositor?.tasks ?? 0)} | ${med((r) => r.summary.mainThreadBusyMs)} | ${med((r) => r.counts.UpdateLayoutTree)} | ${med((r) => r.summary.accessibility.mainThreadMs)} | \`traces/focus-idle/${targetName}.json.gz\` (ejecución ${rep.run}) |\n`;
}
md += `\nLos frames son los que generó Chrome (eventos PipelineReporter); la GPU y el compositor, el tiempo y las tareas de esos hilos. La grabación incluye capturas de pantalla, que DevTools muestra como tira de imágenes; capturarlas añade trabajo al proceso del navegador, que no se cuenta aquí.\n\nEn todas las ejecuciones la página informó \`prefers-reduced-motion: reduce\`: ${rows.every((r) => r.reducedMotion) ? 'sí' : 'no'}. Foco en: ${[...new Set(rows.map((r) => r.focused))].join(', ')}.\n`;
writeFileSync(join(ROOT, 'results', `focus-idle-${stamp}.md`), md);
writeFileSync(join(ROOT, 'results', `focus-idle-${stamp}.json`), `${JSON.stringify({ throttle, runs, rows }, null, 2)}\n`);
console.log(`\n${md}`);
