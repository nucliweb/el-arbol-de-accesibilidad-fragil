// Summarizes a raw benchmark file into medians per target, size and mode.
//
// Usage: node scripts/summarize.js [results/raw-<stamp>.jsonl]
// Defaults to the most recent raw file. Writes summary-<stamp>.json and
// summary-<stamp>.md next to it.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { aggregate } from './lib/aggregate.js';

const RESULTS = resolve(import.meta.dirname, '..', 'results');
const rawFile =
  process.argv[2] ??
  join(
    RESULTS,
    readdirSync(RESULTS)
      .filter((f) => /^raw-.*\.jsonl$/.test(f))
      .sort()
      .at(-1),
  );

const rows = readFileSync(rawFile, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
const meta = rows.find((r) => r.meta)?.meta ?? {};

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;
const METRICS = {
  domElements: (r) => r.dom.elements,
  domAttributes: (r) => r.dom.attributes,
  domMaxDepth: (r) => r.dom.maxDepth,
  documentElements: (r) => r.documentElements,
  cssStyleRules: (r) => r.css.styleRules,
  cssSelectors: (r) => r.css.selectors,
  cssDeclarations: (r) => r.css.declarations,
  jsKB: (r) => kb(r.bytes.script),
  cssKB: (r) => kb(r.bytes.css),
  fontKB: (r) => kb(r.bytes.font),
  htmlKB: (r) => kb(r.bytes.html),
  axNodes: (r) => r.axTree.nodes,
  axIgnoredNodes: (r) => r.axTree.ignoredNodes,
  axFetchMs: (r) => r.axTree.fetchMs,
  fcpMs: (r) => r.fcpMs,
  lcpMs: (r) => r.lcpMs,
  renderedMs: (r) => r.renderedMs,
  loadMainThreadMs: (r) => r.loadTrace.mainThreadBusyMs,
  loadTbtMs: (r) => r.loadTrace.totalBlockingTimeMs,
  loadParseHtmlMs: (r) => r.loadTrace.parseHtmlMs,
  loadScriptMs: (r) => r.loadTrace.scriptMs,
  loadStyleMs: (r) => r.loadTrace.styleMs,
  loadLayoutMs: (r) => r.loadTrace.layoutMs,
  loadA11yMainThreadMs: (r) => r.loadTrace.accessibility.mainThreadMs,
  loadA11yTotalMs: (r) => r.loadTrace.accessibility.totalMs,
  clickEventMs: (r) => r.interaction.maxEventMs,
  clickMainThreadMs: (r) => r.interactionTrace.mainThreadBusyMs,
  clickA11yMainThreadMs: (r) => r.interactionTrace.accessibility.mainThreadMs,
  clickA11yTotalMs: (r) => r.interactionTrace.accessibility.totalMs,
};

const groups = aggregate(rows, METRICS);
const failedChecks = rows.filter((r) => r.target && !r.timeout && !r.interaction.clickedIsChecked);

const stamp = basename(rawFile).replace(/^raw-|\.jsonl$/g, '');
writeFileSync(join(RESULTS, `summary-${stamp}.json`), `${JSON.stringify({ meta, failedChecks: failedChecks.length, groups }, null, 2)}\n`);

// Markdown tables: one per size and mode, targets as rows.
const COLUMNS = [
  ['domElements', 'Elementos'],
  ['domAttributes', 'Atributos'],
  ['domMaxDepth', 'Profundidad'],
  ['cssSelectors', 'Selectores'],
  ['jsKB', 'JS (KB)'],
  ['axNodes', 'Nodos AX'],
  ['lcpMs', 'LCP (ms)'],
  ['loadMainThreadMs', 'Hilo principal (ms)'],
  ['loadTbtMs', 'TBT (ms)'],
  ['loadStyleMs', 'Estilos (ms)'],
  ['loadA11yMainThreadMs', 'Accesibilidad (ms)'],
  ['clickEventMs', 'Clic (ms)'],
  ['clickA11yMainThreadMs', 'Accesibilidad clic (ms)'],
];
const format = (value, key) => {
  // Event Timing only reports events of 16 ms or more.
  if (value === null) return key === 'clickEventMs' ? '<16' : '–';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

let md = `# Resultados del banco de pruebas\n\nChrome ${meta.chrome}, CPU ×${meta.throttle}, ${meta.runs} ejecuciones por combinación (mediana). Inicio: ${meta.startedAt}.\n\n`;
md += failedChecks.length
  ? `**Atención:** en ${failedChecks.length} ejecuciones el radio pulsado no quedó marcado en el árbol de accesibilidad.\n\n`
  : 'En todas las ejecuciones el radio pulsado quedó marcado en el árbol de accesibilidad.\n\n';

for (const n of [...new Set(groups.map((g) => g.n))]) {
  for (const mode of [...new Set(groups.map((g) => g.mode))]) {
    const subset = groups.filter((g) => g.n === n && g.mode === mode);
    if (subset.length === 0) continue;
    md += `## N = ${n}, accesibilidad ${mode === 'on' ? 'activada' : 'desactivada'}\n\n`;
    md += `| Variante | ${COLUMNS.map(([, label]) => label).join(' | ')} |\n`;
    md += `| --- | ${COLUMNS.map(() => '---:').join(' | ')} |\n`;
    for (const g of subset) {
      if (g.runs === 0) {
        md += `| ${g.target} | ${COLUMNS.map(() => '–').join(' | ')} |\n`;
        continue;
      }
      md += `| ${g.target} | ${COLUMNS.map(([key]) => format(g[key], key)).join(' | ')} |\n`;
    }
    for (const g of subset.filter((group) => group.timeouts > 0)) {
      const limit = rows.find((r) => r.timeout && r.target === g.target && r.n === g.n)?.timeoutMs / 1000;
      md += `\n${g.target}: ${g.timeouts} de ${g.runs + g.timeouts} ejecuciones no terminaron de cargar en ${limit} s.\n`;
    }
    md += '\n';
  }
}
writeFileSync(join(RESULTS, `summary-${stamp}.md`), md);
console.log(md);
