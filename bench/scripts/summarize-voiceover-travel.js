// Summarizes a VoiceOver Travel run (voiceover-travel.js) as a text table:
// median latency per step and target, and the task total.
//
// Usage: node scripts/summarize-voiceover-travel.js [results/voiceover-travel-<stamp>.jsonl]
// Defaults to the most recent file. Writes voiceover-travel-summary-<stamp>.md
// next to it.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { median } from './lib/aggregate.js';
import { summarizeTask } from './lib/travel-task.js';

const RESULTS = resolve(import.meta.dirname, '..', 'results');
const rawFile =
  process.argv[2] ??
  join(
    RESULTS,
    readdirSync(RESULTS)
      .filter((f) => /^voiceover-travel-\d.*\.jsonl$/.test(f))
      .sort()
      .at(-1),
  );

const lines = readFileSync(rawFile, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
const meta = lines.find((r) => r.meta)?.meta ?? {};
const rows = lines.filter((r) => r.target);
const summary = summarizeTask(rows);
const targets = Object.keys(summary);
const ms = (value) => (value === null || value === undefined ? '–' : `${Math.round(value)}`);

let md = '# A11yConf Travel: latencia de VoiceOver\n\n';
md += `VoiceOver en macOS con Chrome, CPU ×${meta.throttle}, ${meta.runs} ejecuciones por versión; se muestra la mediana. Cada latencia es el tiempo desde la pulsación hasta que VoiceOver dice la frase esperada; sin respuesta en ${meta.silenceMs / 1000} s cuenta como silencio. Inicio: ${meta.startedAt}.\n\n`;
for (const t of targets) {
  const s = summary[t];
  const loads = rows.filter((r) => r.target === t && !r.error).map((r) => r.loadMs);
  md += `- ${t}: ${s.runs} ejecuciones, ${s.errors} errores, ${s.steps.reduce((n, step) => n + step.silences, 0)} silencios; carga mediana ${ms(median(loads))} ms.\n`;
}
md += `\n| Paso | ${targets.map((t) => `${t} (ms)`).join(' | ')} |\n| --- | ${targets.map(() => '---:').join(' | ')} |\n`;
summary[targets[0]].steps.forEach((step, i) => {
  md += `| ${i + 1}. ${step.name} | ${targets.map((t) => ms(summary[t].steps[i].medianMs)).join(' | ')} |\n`;
});
md += `| **Tarea completa (suma de medianas)** | ${targets.map((t) => `**${ms(summary[t].totalMs)}**`).join(' | ')} |\n`;

const stamp = basename(rawFile).replace(/^voiceover-travel-|\.jsonl$/g, '');
writeFileSync(join(RESULTS, `voiceover-travel-summary-${stamp}.md`), md);
console.log(md);
