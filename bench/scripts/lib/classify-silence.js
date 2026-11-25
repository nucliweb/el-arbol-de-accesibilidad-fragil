import { announces } from './announces.js';

// A step with no matching announcement is either a real silence, or an
// "offset": VoiceOver announced the previous option because an earlier key
// press did not move the selection, so the whole run lags one position.
export function classifySilence(step, said, options) {
  const previous = options[(step - 1 + options.length) % options.length].label;
  return (said ?? []).some((phrase) => announces(phrase, previous)) ? 'offset' : 'silence';
}
