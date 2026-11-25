// Summarizes a Travel measurement (measure-travel.js) as text tables: medians
// per page and accessibility mode, the task step by step, and the numbers of
// the representative trace of each group, so every trace shown in DevTools
// has a text equivalent.
//
// Usage: node scripts/summarize-travel.js [results/travel-raw-<stamp>.jsonl]
// Defaults to the most recent raw file. Writes travel-summary-<stamp>.md and
// .json next to it.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { aggregate, median, medianRun } from './lib/aggregate.js';

const RESULTS = resolve(import.meta.dirname, '..', 'results');
const rawFile =
  process.argv[2] ??
  join(
    RESULTS,
    readdirSync(RESULTS)
      .filter((f) => /^travel-raw-.*\.jsonl$/.test(f))
      .sort()
      .at(-1),
  );

const lines = readFileSync(rawFile, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
const meta = lines.find((r) => r.meta)?.meta ?? {};
const rows = lines.filter((r) => r.target);
const targets = [...new Set(rows.map((r) => r.target))];
const modes = [...new Set(rows.map((r) => r.mode))];

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;
const METRICS = {
  domElements: (r) => r.dom.elements,
  domMaxDepth: (r) => r.dom.maxDepth,
  cssSelectors: (r) => r.css.selectors,
  axNodes: (r) => r.axTree?.nodes ?? null,
  axExposedNodes: (r) => r.axTree?.exposedNodes ?? null,
  jsKB: (r) => kb(r.bytes.script),
  cssKB: (r) => kb(r.bytes.css),
  fontKB: (r) => kb(r.bytes.font),
  fcpMs: (r) => r.fcpMs,
  lcpMs: (r) => r.lcpMs,
  loadMainThreadMs: (r) => r.loadTrace.mainThreadBusyMs,
  loadTbtMs: (r) => r.loadTrace.totalBlockingTimeMs,
  loadScriptMs: (r) => r.loadTrace.scriptMs,
  loadStyleMs: (r) => r.loadTrace.styleMs,
  loadLayoutMs: (r) => r.loadTrace.layoutMs,
  loadA11yMs: (r) => r.loadTrace.accessibility.mainThreadMs,
  taskMainThreadMs: (r) => r.taskTrace.mainThreadBusyMs,
  taskTbtMs: (r) => r.taskTrace.totalBlockingTimeMs,
  taskScriptMs: (r) => r.taskTrace.scriptMs,
  taskStyleMs: (r) => r.taskTrace.styleMs,
  taskA11yMs: (r) => r.taskTrace.accessibility.mainThreadMs,
  taskMaxEventMs: (r) => Math.max(0, ...r.steps.map((s) => s.maxEventMs ?? 0)) || null,
};
const groups = aggregate(rows, METRICS);
const group = (target, mode) => groups.find((g) => g.target === target && g.mode === mode);
const failedChecks = rows.filter((r) => Object.values(r.checks).some((ok) => !ok));
// With accessibility off, Chrome should do no accessibility work at all; if it
// does, something (such as a screen reader flagged as active) turned it on.
const leakedA11y = rows.filter((r) => r.mode === 'off' && r.loadTrace.accessibility.mainThreadMs > 1);

const num = (value) => (value === null || value === undefined ? '–' : Number.isInteger(value) ? String(value) : value.toFixed(1));
// Event Timing only reports interactions of 16 ms or more.
const event = (value) => (value === null || value === undefined ? '<16' : num(value));
const modeLabel = (mode) => (mode === 'on' ? 'accesibilidad activada' : 'accesibilidad desactivada');
const table = (header, body) =>
  `| ${header.join(' | ')} |\n| --- | ${header.slice(1).map(() => '---:').join(' | ')} |\n${body.map((row) => `| ${row.join(' | ')} |`).join('\n')}\n\n`;

let md = `# A11yConf Travel: resultados de Chrome\n\n`;
md += `Chrome ${meta.chrome}, CPU ×${meta.throttle}, viewport 1280×800, ${meta.runs} ejecuciones por versión y modo; se muestra la mediana. Inicio: ${meta.startedAt}.\n\n`;
md += `«Accesibilidad activada» es Chrome con \`--force-renderer-accessibility\`, lo que ocurre cuando hay un lector de pantalla en marcha. Los tiempos de accesibilidad son el trabajo del árbol de accesibilidad en el hilo principal del renderer.\n\n`;
md += failedChecks.length
  ? `**Atención:** ${failedChecks.length} ejecuciones no superaron las comprobaciones (filtro, modal o vuelta del foco).\n\n`
  : 'En todas las ejecuciones la tarea hizo lo esperado: el filtro dejó el número de hoteles correcto, el modal se abrió y Escape devolvió el foco al botón.\n\n';

md += leakedA11y.length
  ? `**Atención:** en ${leakedA11y.length} ejecuciones con la accesibilidad desactivada Chrome hizo trabajo de accesibilidad durante la carga; el modo desactivado no es fiable.\n\n`
  : 'Con la accesibilidad desactivada, Chrome no hizo trabajo de accesibilidad en ninguna ejecución (comprobado en la traza de carga).\n\n';

md += `## Estructura de la página\n\nMedida justo después de la carga, con los 30 hoteles en pantalla. Los nodos AX (árbol de accesibilidad de Chrome, con la accesibilidad activada) incluyen los ignorados; los expuestos son los que llegan al lector de pantalla.\n\n`;
md += table(
  ['Versión', 'Elementos del body', 'Profundidad DOM', 'Selectores CSS', 'Nodos AX', 'Nodos AX expuestos', 'JS (KB)', 'CSS (KB)', 'Fuentes (KB)'],
  targets.map((t) => {
    const g = group(t, 'on') ?? group(t, modes[0]);
    return [t, num(g.domElements), num(g.domMaxDepth), num(g.cssSelectors), num(g.axNodes), num(g.axExposedNodes), num(g.jsKB), num(g.cssKB), num(g.fontKB)];
  }),
);

md += `## Carga de la página\n\n`;
md += table(
  ['Versión', 'Modo', 'FCP (ms)', 'LCP (ms)', 'Hilo principal (ms)', 'TBT (ms)', 'JavaScript (ms)', 'Estilos (ms)', 'Layout (ms)', 'Accesibilidad (ms)'],
  modes.flatMap((mode) =>
    targets.map((t) => {
      const g = group(t, mode);
      return [t, modeLabel(mode), num(g.fcpMs), num(g.lcpMs), num(g.loadMainThreadMs), num(g.loadTbtMs), num(g.loadScriptMs), num(g.loadStyleMs), num(g.loadLayoutMs), num(g.loadA11yMs)];
    }),
  ),
);

md += `## Tarea con teclado (14 pasos)\n\n`;
md += table(
  ['Versión', 'Modo', 'Hilo principal (ms)', 'TBT (ms)', 'JavaScript (ms)', 'Estilos (ms)', 'Accesibilidad (ms)', 'Interacción más lenta (ms)'],
  modes.flatMap((mode) =>
    targets.map((t) => {
      const g = group(t, mode);
      return [t, modeLabel(mode), num(g.taskMainThreadMs), num(g.taskTbtMs), num(g.taskScriptMs), num(g.taskStyleMs), num(g.taskA11yMs), event(g.taskMaxEventMs)];
    }),
  ),
);

const stepRows = (pickRows) => {
  const names = pickRows[0].steps.map((s) => `${s.index}. ${s.name}`);
  return names.map((name, i) => [
    name,
    ...targets.flatMap((t) => {
      const runs = pickRows.filter((r) => r.target === t);
      return [
        event(median(runs.map((r) => r.steps[i].maxEventMs))),
        num(median(runs.map((r) => r.steps[i].trace?.mainThreadBusyMs))),
        num(median(runs.map((r) => r.steps[i].trace?.accessibility.mainThreadMs))),
      ];
    }),
  ]);
};
const stepHeader = [
  'Paso',
  ...targets.flatMap((t) => [`${t}: interacción (ms)`, `${t}: hilo principal (ms)`, `${t}: accesibilidad (ms)`]),
];

for (const mode of modes) {
  md += `### Paso a paso, ${modeLabel(mode)} (mediana)\n\n`;
  md += `«Interacción» es la duración de Event Timing (como INP; «<16» significa menos de 16 ms, el mínimo que mide el navegador). «Hilo principal» y «accesibilidad» salen de la traza, entre el inicio y el final de cada paso (500 ms después de la tecla).\n\n`;
  md += table(stepHeader, stepRows(rows.filter((r) => r.mode === mode)));
}

md += `## Trazas para abrir en DevTools\n\n`;
md += `Las trazas están en \`results/${meta.traceDir}/\`. Se abren en el panel Performance de Chrome DevTools (Cargar perfil, o arrastrando el archivo .json.gz). En la tarea, cada paso aparece con su nombre en la pista Timings. Para cada versión y modo se elige la ejecución representativa: la que tiene el tiempo de hilo principal de la tarea más cercano a la mediana. Estas son sus cifras, el equivalente en texto de lo que muestra cada traza.\n\n`;
const representatives = {};
for (const mode of modes) {
  for (const t of targets) {
    const run = medianRun(rows.filter((r) => r.target === t && r.mode === mode), (r) => r.taskTrace.mainThreadBusyMs);
    representatives[`${t}|${mode}`] = { run: run.run, load: run.loadTraceFile, task: run.taskTraceFile };
    md += `### ${t}, ${modeLabel(mode)} (ejecución ${run.run})\n\n`;
    md += `- Carga: \`${run.loadTraceFile}\`. Hilo principal ${num(run.loadTrace.mainThreadBusyMs)} ms, TBT ${num(run.loadTrace.totalBlockingTimeMs)} ms, JavaScript ${num(run.loadTrace.scriptMs)} ms, estilos ${num(run.loadTrace.styleMs)} ms, layout ${num(run.loadTrace.layoutMs)} ms, accesibilidad ${num(run.loadTrace.accessibility.mainThreadMs)} ms; LCP ${num(run.lcpMs)} ms.\n`;
    md += `- Tarea: \`${run.taskTraceFile}\`. Hilo principal ${num(run.taskTrace.mainThreadBusyMs)} ms, TBT ${num(run.taskTrace.totalBlockingTimeMs)} ms, JavaScript ${num(run.taskTrace.scriptMs)} ms, accesibilidad ${num(run.taskTrace.accessibility.mainThreadMs)} ms.\n\n`;
    md += table(
      ['Paso (pista Timings)', 'Interacción (ms)', 'Hilo principal (ms)', 'JavaScript (ms)', 'Estilos (ms)', 'Layout (ms)', 'Accesibilidad (ms)'],
      run.steps.map((s) => [
        `${s.index}. ${s.name}`,
        event(s.maxEventMs),
        num(s.trace?.mainThreadBusyMs),
        num(s.trace?.scriptMs),
        num(s.trace?.styleMs),
        num(s.trace?.layoutMs),
        num(s.trace?.accessibility.mainThreadMs),
      ]),
    );
  }
}

const stamp = basename(rawFile).replace(/^travel-raw-|\.jsonl$/g, '');
writeFileSync(join(RESULTS, `travel-summary-${stamp}.md`), md);
writeFileSync(
  join(RESULTS, `travel-summary-${stamp}.json`),
  `${JSON.stringify({ meta, failedChecks: failedChecks.length, groups, representatives }, null, 2)}\n`,
);
console.log(md);
