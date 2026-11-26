// Turns the timestamps of a chain of tiny tasks ("ticks") into how long the
// main thread was busy after an action. A tick runs whenever the thread is
// free, so a gap longer than blockMs between ticks is time the browser spent
// on something else: the page's JavaScript, style, layout, paint or the
// accessibility tree. Plain functions, shared by the page and the tests.

const round = (ms) => Math.round(ms * 10) / 10;

function gaps(t0, ticks) {
  const result = [];
  let previous = t0;
  for (const tick of ticks) {
    result.push({ from: previous, to: tick, ms: tick - previous });
    previous = tick;
  }
  return result;
}

// busyMs: from the action until the later of the next painted frame and the
// end of the last blocked gap. blockedMs: the sum of the blocked gaps.
export function analyzeTicks({ t0, ticks, paintAt, blockMs }) {
  const blocked = gaps(t0, ticks).filter((gap) => gap.ms > blockMs);
  const busyEnd = blocked.length ? blocked.at(-1).to : t0;
  return {
    busyMs: round(Math.max(paintAt, busyEnd) - t0),
    blockedMs: round(blocked.reduce((sum, gap) => sum + gap.ms, 0)),
  };
}

// Quiet: at least one tick ran, and quietMs passed since the last blocked gap
// ended (or since the action, if nothing blocked).
export function isQuiet({ t0, ticks, now, quietMs, blockMs }) {
  if (ticks.length === 0) return false;
  const blocked = gaps(t0, ticks).filter((gap) => gap.ms > blockMs);
  const busyEnd = blocked.length ? blocked.at(-1).to : t0;
  return now - busyEnd >= quietMs;
}
