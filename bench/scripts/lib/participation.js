// Pieces shared by the participation scripts: find the results a measurement
// wrote, trim its summary for a GitHub issue, and build the report a
// participant pastes into the issue form.

export function rawResultsPath(output) {
  const match = output.match(/Raw results: (.+?)\r?$/m);
  if (!match) throw new Error('No raw results path in the output of the measurement');
  return match[1].trim();
}

// The summaries start with their own title and end, for Travel, with the
// list of local trace files, which mean nothing in an issue.
export function trimSummary(md) {
  return md
    .split(/\n## Trazas para abrir en DevTools/)[0]
    .replace(/^# .*\n+/, '')
    .trim();
}

const LABELS = {
  os: 'Sistema / OS',
  arch: 'Arquitectura / Architecture',
  cpu: 'CPU',
  cpuCores: 'Núcleos / Cores',
  memoryGB: 'Memoria / Memory (GB)',
  node: 'Node',
  chrome: 'Chrome',
  voiceOver: 'VoiceOver',
};

export function buildReport({ environment, sections, title = 'Resultados del benchmark / Benchmark results' }) {
  let md = `# ${title}\n\n| Equipo / Machine | |\n| --- | --- |\n`;
  for (const [key, value] of Object.entries(environment)) md += `| ${LABELS[key] ?? key} | ${value} |\n`;
  for (const section of sections) {
    // Nest the summary's own headings one level below the section heading.
    const body = section.summary.replace(/^(#{2,5}) /gm, '#$1 ');
    md += `\n## ${section.title} (CPU ×${section.throttle})\n\n${body}\n`;
  }
  return md;
}
