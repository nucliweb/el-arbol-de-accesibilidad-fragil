import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findMarks, summarizeTrace } from '../scripts/lib/trace-summary.js';

// Trace timestamps and durations are in microseconds.
const ms = (value) => value * 1000;
const threadName = (pid, tid, name) => ({ ph: 'M', name: 'thread_name', pid, tid, args: { name } });
const slice = (pid, tid, name, startMs, durMs) => ({ ph: 'X', name, pid, tid, ts: ms(startMs), dur: ms(durMs) });

const MAIN = [1, 10];
const OTHER = [2, 20];

const trace = {
  traceEvents: [
    threadName(...MAIN, 'CrRendererMain'),
    threadName(...OTHER, 'CrBrowserMain'),
    // One 100 ms task: 50 ms of blocking time.
    slice(...MAIN, 'RunTask', 0, 100),
    slice(...MAIN, 'ParseHTML', 0, 5),
    slice(...MAIN, 'EvaluateScript', 10, 50),
    // Nested inside EvaluateScript: must not be counted twice.
    slice(...MAIN, 'FunctionCall', 20, 10),
    slice(...MAIN, 'UpdateLayoutTree', 60, 10),
    slice(...MAIN, 'Layout', 70, 8),
    slice(...MAIN, 'Paint', 80, 2),
    // A short task: busy time but no blocking time.
    slice(...MAIN, 'RunTask', 200, 30),
    slice(...MAIN, 'AXObjectCacheImpl::ProcessDeferredAccessibilityEvents', 205, 20),
    // Accessibility work on another thread still counts as accessibility work,
    // but not as main thread time.
    slice(...OTHER, 'RunTask', 300, 40),
    slice(...OTHER, 'BrowserAccessibilityManager::OnAccessibilityEvents', 300, 6),
  ],
};

test('summarizes renderer main thread work in milliseconds', () => {
  const summary = summarizeTrace(trace);

  assert.equal(summary.mainThreadBusyMs, 130);
  assert.equal(summary.longTasks, 1);
  assert.equal(summary.totalBlockingTimeMs, 50);
  assert.equal(summary.parseHtmlMs, 5);
  assert.equal(summary.scriptMs, 50);
  assert.equal(summary.styleMs, 10);
  assert.equal(summary.layoutMs, 8);
  assert.equal(summary.paintMs, 2);
});

test('collects accessibility work on every thread, by event name', () => {
  const { accessibility } = summarizeTrace(trace);

  assert.equal(accessibility.totalMs, 26);
  assert.equal(accessibility.mainThreadMs, 20);
  assert.deepEqual(accessibility.byName, {
    'AXObjectCacheImpl::ProcessDeferredAccessibilityEvents': 20,
    'BrowserAccessibilityManager::OnAccessibilityEvents': 6,
  });
});

test('accepts a bare array of events', () => {
  assert.equal(summarizeTrace(trace.traceEvents).mainThreadBusyMs, 130);
});

test('limits the summary to the events that start inside a time window', () => {
  // Window from 150 to 260 ms: only the short task and its accessibility work.
  const summary = summarizeTrace(trace, { from: ms(150), to: ms(260) });

  assert.equal(summary.mainThreadBusyMs, 30);
  assert.equal(summary.longTasks, 0);
  assert.equal(summary.accessibility.mainThreadMs, 20);
  assert.equal(summary.accessibility.totalMs, 20);
});

test('finds user timing marks by prefix, with their trace timestamps', () => {
  const marks = findMarks(
    [
      { ph: 'R', cat: 'blink.user_timing', name: 'step:1:start', ts: ms(150) },
      { ph: 'I', cat: 'blink.user_timing', name: 'step:1:end', ts: ms(260) },
      { ph: 'R', cat: 'blink.user_timing', name: 'other', ts: ms(1) },
      { ph: 'X', cat: 'devtools.timeline', name: 'step:1:start', ts: ms(9), dur: 1 },
    ],
    'step:',
  );

  assert.deepEqual(marks, { 'step:1:start': ms(150), 'step:1:end': ms(260) });
});
