// Results of the browser version: medians per scenario, target and step, the
// Markdown report for the GitHub issue, and the prefilled issue link. Plain
// functions, shared by the page and the tests.

const ISSUE_FORM = 'https://github.com/nucliweb/el-arbol-de-accesibilidad-fragil/issues/new';
const MAX_URL = 7500;

const median = (values) => {
  const sorted = values.filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round(((sorted[middle - 1] + sorted[middle]) / 2) * 10) / 10;
};

export function summarizeSession(samples) {
  const groups = {};
  for (const s of samples) {
    ((groups[s.scenario] ??= {})[s.target] ??= {})[s.step] ??= [];
    groups[s.scenario][s.target][s.step].push(s);
  }
  const summary = {};
  for (const [scenario, targets] of Object.entries(groups)) {
    for (const [target, steps] of Object.entries(targets)) {
      for (const [step, list] of Object.entries(steps)) {
        const entry = { blockedMs: median(list.map((s) => s.blockedMs)), busyMs: median(list.map((s) => s.busyMs)) };
        if (list.some((s) => s.elements !== undefined)) entry.elements = median(list.map((s) => s.elements));
        ((summary[scenario] ??= {})[target] ??= {})[step] = entry;
      }
    }
  }
  return summary;
}

const sessionTitle = (screenReader) =>
  screenReader === 'none' ? 'Sin lector de pantalla / Without screen reader' : `Con ${screenReader} / With ${screenReader}`;
const signed = (value) => (value === null ? '–' : `${value >= 0 ? '+' : ''}${Math.round(value)}`);
const plain = (value) => (value === null || value === undefined ? '–' : String(Math.round(value)));

function tables(summary, labels, cell) {
  let md = '';
  for (const [scenario, targets] of Object.entries(summary)) {
    const targetIds = Object.keys(targets);
    const stepIds = [...new Set(targetIds.flatMap((t) => Object.keys(targets[t])))];
    md += `### ${labels.scenarios[scenario] ?? scenario}\n\n`;
    md += `| Paso / Step | ${targetIds.map((t) => labels.targets[t] ?? t).join(' | ')} |\n`;
    md += `| --- | ${targetIds.map(() => '---:').join(' | ')} |\n`;
    for (const step of stepIds) {
      md += `| ${labels.steps[step] ?? step} | ${targetIds.map((t) => cell(scenario, t, step)).join(' | ')} |\n`;
    }
    md += '\n';
  }
  return md;
}

export function buildWebReport({ environment, sessions, labels }) {
  let md = '# Resultados del benchmark en el navegador / Browser benchmark results\n\n';
  md += '| Equipo / Device | |\n| --- | --- |\n';
  for (const [key, value] of Object.entries(environment)) md += `| ${key} | ${value} |\n`;
  md += '\nTiempo bloqueado del hilo principal tras cada paso, en ms (mediana). / Main thread blocked time after each step, in ms (median).\n\n';
  for (const session of sessions) {
    md += `## ${sessionTitle(session.screenReader)}\n\n`;
    md += tables(session.summary, labels, (sc, t, st) => plain(session.summary[sc]?.[t]?.[st]?.blockedMs));
  }
  const without = sessions.find((s) => s.screenReader === 'none');
  for (const withReader of sessions.filter((s) => s.screenReader !== 'none')) {
    if (!without) break;
    md += `## Diferencia con ${withReader.screenReader} / Difference with ${withReader.screenReader}\n\n`;
    md += tables(withReader.summary, labels, (sc, t, st) => {
      const a = withReader.summary[sc]?.[t]?.[st]?.blockedMs;
      const b = without.summary[sc]?.[t]?.[st]?.blockedMs;
      return a === undefined || b === undefined || a === null || b === null ? '–' : signed(a - b);
    });
  }
  return md;
}

export function buildIssueUrl({ report, raw, device }) {
  const url = new URL(ISSUE_FORM);
  url.searchParams.set('template', 'benchmark-results.yml');
  url.searchParams.set('title', `Resultados / Results: ${device}`);
  url.searchParams.set('device', device);
  url.searchParams.set('report', report);
  url.searchParams.set('raw', raw);
  // Browsers and GitHub reject very long links: leave the raw data for the
  // participant to paste or attach.
  if (url.href.length > MAX_URL) url.searchParams.delete('raw');
  if (url.href.length > MAX_URL) url.searchParams.delete('report');
  return url.href;
}
