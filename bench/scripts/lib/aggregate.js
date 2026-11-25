// Reduces raw benchmark rows (one per run) to one row per target, size and
// mode, using the median of each metric to dampen outliers.

export function median(values) {
  const sorted = values.filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function aggregate(rows, metrics) {
  const groups = new Map();
  for (const row of rows) {
    if (!row.target) continue; // metadata line
    const key = `${row.target}|${row.n}|${row.mode}`;
    if (!groups.has(key)) groups.set(key, { target: row.target, n: row.n, mode: row.mode, rows: [] });
    groups.get(key).rows.push(row);
  }

  return [...groups.values()].map(({ rows: groupRows, ...group }) => {
    const completed = groupRows.filter((row) => !row.timeout);
    const result = { ...group, runs: completed.length, timeouts: groupRows.length - completed.length };
    for (const [name, pick] of Object.entries(metrics)) {
      result[name] = median(completed.map(pick));
    }
    return result;
  });
}

// The row whose metric is closest to the median: a real run that represents
// the group, e.g. the trace to open in DevTools.
export function medianRun(rows, pick) {
  const target = median(rows.map(pick));
  if (target === null) return null;
  return rows.reduce((best, row) => (Math.abs(pick(row) - target) < Math.abs(pick(best) - target) ? row : best));
}
