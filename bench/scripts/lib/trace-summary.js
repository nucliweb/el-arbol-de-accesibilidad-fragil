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

const eventsOf = (trace) => (Array.isArray(trace) ? trace : trace.traceEvents);

// User timing marks (performance.mark) whose name starts with `prefix`, as
// { name: timestamp in microseconds }, to cut a trace into steps.
export function findMarks(trace, prefix) {
  const marks = {};
  for (const e of eventsOf(trace)) {
    if (e.cat?.includes('blink.user_timing') && ['R', 'I', 'i'].includes(e.ph) && e.name.startsWith(prefix)) {
      marks[e.name] = e.ts;
    }
  }
  return marks;
}

// With `from` and `to` (trace microseconds), only events that start inside
// that window count, so one trace can be summarized step by step.
export function summarizeTrace(trace, { from = -Infinity, to = Infinity } = {}) {
  const events = eventsOf(trace);

  const mainThreads = new Set(
    events
      .filter((e) => e.ph === 'M' && e.name === 'thread_name' && e.args?.name === 'CrRendererMain')
      .map((e) => `${e.pid}:${e.tid}`),
  );
  const slices = events.filter((e) => e.ph === 'X' && typeof e.dur === 'number' && e.ts >= from && e.ts < to);
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

// How many times each named event happens (any thread; any phase except
// metadata, or only `phase`), e.g. Paint, or 'b' of PipelineReporter for
// frames, to describe a trace in words.
export function countEvents(trace, names, { from = -Infinity, to = Infinity, phase } = {}) {
  const counts = Object.fromEntries(names.map((name) => [name, 0]));
  for (const e of eventsOf(trace)) {
    const phaseMatches = phase ? e.ph === phase : e.ph !== 'M';
    if (phaseMatches && e.name in counts && e.ts >= from && e.ts < to) counts[e.name] += 1;
  }
  return counts;
}

// Task count and busy time (RunTask) per thread name, e.g. CrGpuMain or
// VizCompositorThread, for work that happens off the renderer main thread.
export function busyByThread(trace, { from = -Infinity, to = Infinity } = {}) {
  const events = eventsOf(trace);
  const names = new Map(
    events.filter((e) => e.ph === 'M' && e.name === 'thread_name').map((e) => [`${e.pid}:${e.tid}`, e.args?.name]),
  );
  const intervals = {};
  for (const e of events) {
    if (e.ph !== 'X' || e.name !== 'RunTask' || e.ts < from || e.ts >= to) continue;
    const name = names.get(`${e.pid}:${e.tid}`) ?? 'unknown';
    (intervals[name] ??= []).push([e.ts, e.ts + e.dur]);
  }
  return Object.fromEntries(
    Object.entries(intervals).map(([name, list]) => [name, { tasks: list.length, ms: round(unionMs(list)) }]),
  );
}
