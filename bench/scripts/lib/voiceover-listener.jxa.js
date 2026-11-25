// Polls VoiceOver's last spoken phrase and prints a JSON line with the epoch
// timestamp whenever it changes. Needs "Allow VoiceOver to be controlled with
// AppleScript" in VoiceOver Utility. Output goes to stderr (console.log).
const vo = Application('VoiceOver');
let last = null;
let polls = 0;
let pollMs = 0;
while (true) {
  const started = Date.now();
  let phrase = '';
  try {
    phrase = vo.lastPhrase.content();
  } catch (error) {
    phrase = `__error__ ${error}`;
  }
  pollMs += Date.now() - started;
  polls += 1;
  if (phrase !== last) {
    last = phrase;
    console.log(JSON.stringify({ t: Date.now(), phrase, avgPollMs: Math.round((pollMs / polls) * 10) / 10 }));
  }
  delay(0.005);
}
