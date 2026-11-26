// Measures, from the page, how long the main thread stays busy after an
// action: it runs the action, then a chain of tiny tasks (MessageChannel
// messages) until the thread has been free for quietMs, and analyzes the gaps
// between them (lib/busy.js). Also waits for the next painted frame.
import { analyzeTicks, isQuiet } from './busy.js';

export const BLOCK_MS = 8;
export const QUIET_MS = 300;
export const TIMEOUT_MS = 15000;

const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(() => resolve(performance.now()), 0)));

function ticksUntilQuiet(t0) {
  return new Promise((resolve) => {
    const ticks = [];
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      const now = performance.now();
      ticks.push(now);
      if (isQuiet({ t0, ticks, now, quietMs: QUIET_MS, blockMs: BLOCK_MS }) || now - t0 > TIMEOUT_MS) {
        channel.port1.close();
        resolve(ticks);
      } else {
        channel.port2.postMessage(0);
      }
    };
    channel.port2.postMessage(0);
  });
}

// `action` may be async (for example, a page load); t0 is taken just before.
export async function measure(action) {
  const t0 = performance.now();
  await action();
  const [ticks, paintAt] = await Promise.all([ticksUntilQuiet(t0), nextPaint()]);
  // Only blocked gaps count, so the quiet window at the end adds nothing.
  const result = analyzeTicks({ t0, ticks, paintAt, blockMs: BLOCK_MS });
  return { ...result, timedOut: ticks.at(-1) - t0 > TIMEOUT_MS };
}
