// Whether a phrase spoken by a screen reader announces the given option label.
// The label must appear as a whole: "Calisto" does not match "Calisto 2", and
// "Calisto 2" does not match "Calisto".
export function announces(phrase, label) {
  if (!phrase) return false;
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}]|\\s\\p{N})`, 'u').test(phrase);
}
