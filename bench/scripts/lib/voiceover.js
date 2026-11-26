// Drives macOS VoiceOver through AppleScript, without changing any system
// files. Needs "Allow VoiceOver to be controlled with AppleScript" (VoiceOver
// Utility > General) and permission for the terminal to control VoiceOver.

import { execFileSync, spawn } from 'node:child_process';
import { resolve } from 'node:path';

const LISTENER = resolve(import.meta.dirname, 'voiceover-listener.jxa.js');
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const isRunning = () => {
  try {
    execFileSync('pgrep', ['-x', 'VoiceOver']);
    return true;
  } catch {
    return false;
  }
};

export async function startVoiceOver() {
  execFileSync('osascript', ['-e', 'tell application "VoiceOver" to launch']);
  for (let i = 0; i < 60 && !isRunning(); i += 1) await sleep(500);
  if (!isRunning()) throw new Error('VoiceOver did not start');
}

export async function stopVoiceOver() {
  try {
    execFileSync('osascript', ['-e', 'tell application "VoiceOver" to quit']);
  } catch {}
  for (let i = 0; i < 10 && isRunning(); i += 1) await sleep(500);
  if (isRunning()) {
    // Cmd+F5 toggles VoiceOver off.
    execFileSync('osascript', ['-e', 'tell application "System Events" to key code 96 using command down']);
    await sleep(2000);
  }
  return !isRunning();
}

// Whether VoiceOver said nothing during the last `quietMs` (events carry the
// epoch time of each change of the last spoken phrase).
export function isQuiet(events, now, quietMs) {
  const last = events.at(-1);
  return !last || now - last.t >= quietMs;
}

// Records every change of VoiceOver's last spoken phrase with its epoch time.
export function listenToVoiceOver() {
  const events = [];
  const child = spawn('osascript', ['-l', 'JavaScript', LISTENER], { stdio: ['ignore', 'ignore', 'pipe'] });
  let buffer = '';
  child.stderr.on('data', (chunk) => {
    buffer += chunk;
    let newline;
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      try {
        events.push(JSON.parse(line));
      } catch {
        // Phrases with line breaks split the JSON; ignore the fragments.
      }
    }
  });

  return {
    // Waits for the first phrase after `since` that satisfies `matches`.
    async waitFor(since, matches, timeoutMs) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const hit = events.find((e) => e.t >= since && matches(e.phrase));
        if (hit) return hit;
        await sleep(5);
      }
      return null;
    },
    // Waits until VoiceOver has said nothing for `quietMs`, e.g. after it
    // reads a new page on its own; gives up after `timeoutMs`.
    async waitForQuiet(quietMs, timeoutMs) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        if (isQuiet(events, Date.now(), quietMs)) return true;
        await sleep(50);
      }
      return false;
    },
    phrasesSince: (since) => events.filter((e) => e.t >= since).map((e) => e.phrase),
    lastPollMs: () => events.at(-1)?.avgPollMs ?? null,
    stop: () => child.kill(),
  };
}
