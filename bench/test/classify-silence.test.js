import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifySilence } from '../scripts/lib/classify-silence.js';
import { optionsFor } from '../shared/scenario.js';

const options = optionsFor(100);

test('a step where VoiceOver announced the previous option is an offset, not a silence', () => {
  // Step 20 expects option 20 ("Calisto 3"); VoiceOver said option 19.
  const said = ['Encélado 2 selected radio button, 20 of 100', 'You are currently on a selected radio button, 20 of 100.'];
  assert.equal(classifySilence(20, said, options), 'offset');
});

test('a step where VoiceOver said nothing about the options is a real silence', () => {
  assert.equal(classifySilence(5, ['', 'Chrome has new window'], options), 'silence');
  assert.equal(classifySilence(5, [], options), 'silence');
});
