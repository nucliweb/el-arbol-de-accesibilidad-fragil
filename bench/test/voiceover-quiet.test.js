import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isQuiet } from '../scripts/lib/voiceover.js';

test('VoiceOver is quiet when nothing was said during the last quietMs', () => {
  const events = [{ t: 1000, phrase: 'Chrome has new window' }, { t: 2000, phrase: 'heading level 1 Ajustes' }];

  assert.equal(isQuiet(events, 3000, 1500), false);
  assert.equal(isQuiet(events, 3600, 1500), true);
  assert.equal(isQuiet([], 10, 1500), true);
});
