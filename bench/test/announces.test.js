import { test } from 'node:test';
import assert from 'node:assert/strict';
import { announces } from '../scripts/lib/announces.js';

test('matches the label inside what VoiceOver says, in any language', () => {
  assert.equal(announces('Ganímedes, botón de radio, 2 de 100', 'Ganímedes'), true);
  assert.equal(announces('radio button, Ganímedes, selected, 2 of 100', 'Ganímedes'), true);
});

test('does not confuse an option with its numbered repeat', () => {
  assert.equal(announces('Calisto 2, botón de radio, 11 de 100', 'Calisto'), false);
  assert.equal(announces('Calisto, botón de radio, 1 de 100', 'Calisto 2'), false);
  assert.equal(announces('Calisto 2, botón de radio, 11 de 100', 'Calisto 2'), true);
});

test('does not match a different option or an empty phrase', () => {
  assert.equal(announces('Luna, botón de radio', 'Europa'), false);
  assert.equal(announces('', 'Europa'), false);
  assert.equal(announces(null, 'Europa'), false);
});
