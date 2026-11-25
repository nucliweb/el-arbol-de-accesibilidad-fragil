// Summarizes a VoiceOver results file: median and 90th percentile time from
// key press to announcement per target and size. Steps where VoiceOver lagged
// one option behind (see lib/classify-silence.js) are excluded and counted.
//
// Usage: node scripts/summarize-voiceover.js [results/voiceover-<stamp>.jsonl]

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { optionsFor } from '../shared/scenario.js';
import { median } from './lib/aggregate.js';
import { classifySilence } from './lib/classify-silence.js';

const RESULTS = resolve(import.meta.dirname, '..', 'results');
const file =
  process.argv[2] ??
  join(RESULTS, readdirSync(RESULTS).filter((f) => /^voiceover-.*\.jsonl$/.test(f)).sort().at(-1));
const rows = readFileSync(file, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
const meta = rows.find((r) => r.meta)?.meta ?? {};
const pages = rows.filter((r) => r.target);

const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : null;
};

const groups = [];
for (const n of [...new Set(pages.map((r) => r.n))]) {
  const options = optionsFor(n);
  for (const target of [...new Set(pages.map((r) => r.target))]) {
    const rs = pages.filter((r) => r.n === n && r.target === target);
    if (rs.length === 0) continue;
    const ok = rs.filter((r) => !r.error);
    const steps = ok.flatMap((r) => r.results);
    const latencies = steps.map((s) => s.latencyMs).filter((v) => v !== null);
    const unmatched = steps.filter((s) => s.latencyMs === null);
    const offsets = unmatched.filter((s) => classifySilence(s.step, s.said, options) === 'offset').length;
    groups.push({
      n,
      target,
      runs: ok.length,
      errors: rs.length - ok.length,
      measuredSteps: latencies.length,
      medianMs: median(latencies),
      p90Ms: percentile(latencies, 0.9),
      offsetSteps: offsets,
      silences: unmatched.length - offsets,
    });
  }
}

const stamp = basename(file).replace(/^voiceover-|\.jsonl$/g, '');
writeFileSync(join(RESULTS, `voiceover-summary-${stamp}.json`), `${JSON.stringify({ meta, groups }, null, 2)}\n`);

let md = `# VoiceOver: tiempo hasta el anuncio de cada opción\n\nChrome con CPU ×${meta.throttle}, ${meta.steps} pulsaciones de flecha abajo por página, ${meta.runs} ejecuciones. Inicio: ${meta.startedAt}.\n\n`;
md += 'Los pasos «desfasados» son aquellos en que VoiceOver anunció la opción anterior porque una pulsación previa no movió la selección; se excluyen de la latencia.\n\n';
for (const n of [...new Set(groups.map((g) => g.n))]) {
  md += `## N = ${n}\n\n| Variante | Mediana (ms) | P90 (ms) | Pasos medidos | Desfasados | Silencios | Ejecuciones |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: |\n`;
  for (const g of groups.filter((x) => x.n === n)) {
    md += `| ${g.target} | ${g.medianMs ?? '–'} | ${g.p90Ms ?? '–'} | ${g.measuredSteps} | ${g.offsetSteps} | ${g.silences} | ${g.runs} |\n`;
  }
  md += '\n';
}
writeFileSync(join(RESULTS, `voiceover-summary-${stamp}.md`), md);
console.log(md);
