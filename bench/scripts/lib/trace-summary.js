// Summarizes a Chrome trace (as written by Playwright's browser.startTracing)
// into the numbers the talk compares: main thread work by phase, blocking
// time, and accessibility work.

const LONG_TASK_MS = 50;

const SCRIPT_EVENTS = new Set([
  'EvaluateScript',
  'v8.evaluateModule',
  'FunctionCall',
  'TimerFire',
  'FireAnimationFrame',
  'EventDispatch',
  'v8.compile',
  'v8.compileModule',
]);

const isAccessibilityEvent = (name) => /accessib/i.test(name) || /^AX/.test(name);

// Total time covered by a set of [start, end] intervals, counting overlaps
// (nested events) only once.
const unionMs = (intervals) => {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  let total = 0;
  let currentStart = -Infinity;
  let currentEnd = -Infinity;
  for (const [start, end] of sorted) {
    if (start > currentEnd) {
      total += currentEnd - currentStart > 0 ? currentEnd - currentStart : 0;
      currentStart = start;
      currentEnd = end;
    } else {
      currentEnd = Math.max(currentEnd, end);
    }
  }
  total += currentEnd - currentStart > 0 ? currentEnd - currentStart : 0;
  return total / 1000;
};

const round = (value) => Math.round(value * 100) / 100;

export function summarizeTrace(trace) {
  const events = Array.isArray(trace) ? trace : trace.traceEvents;

  const mainThreads = new Set(
    events
      .filter((e) => e.ph === 'M' && e.name === 'thread_name' && e.args?.name === 'CrRendererMain')
      .map((e) => `${e.pid}:${e.tid}`),
  );
  const slices = events.filter((e) => e.ph === 'X' && typeof e.dur === 'number');
  const onMain = slices.filter((e) => mainThreads.has(`${e.pid}:${e.tid}`));
  const interval = (e) => [e.ts, e.ts + e.dur];
  const timeOf = (predicate) => round(unionMs(onMain.filter(predicate).map(interval)));

  const tasks = onMain.filter((e) => e.name === 'RunTask');
  const longTasks = tasks.filter((e) => e.dur / 1000 > LONG_TASK_MS);

  const accessibilityEvents = slices.filter((e) => isAccessibilityEvent(e.name));
  const byName = {};
  for (const e of accessibilityEvents) {
    byName[e.name] = round((byName[e.name] ?? 0) + e.dur / 1000);
  }

  return {
    mainThreadBusyMs: timeOf((e) => e.name === 'RunTask'),
    longTasks: longTasks.length,
    totalBlockingTimeMs: round(longTasks.reduce((sum, e) => sum + e.dur / 1000 - LONG_TASK_MS, 0)),
    parseHtmlMs: timeOf((e) => e.name === 'ParseHTML'),
    scriptMs: timeOf((e) => SCRIPT_EVENTS.has(e.name)),
    styleMs: timeOf((e) => e.name === 'UpdateLayoutTree'),
    layoutMs: timeOf((e) => e.name === 'Layout'),
    paintMs: timeOf((e) => e.name === 'Paint'),
    accessibility: {
      totalMs: round(unionMs(accessibilityEvents.map(interval))),
      mainThreadMs: timeOf((e) => isAccessibilityEvent(e.name)),
      byName,
    },
  };
}
