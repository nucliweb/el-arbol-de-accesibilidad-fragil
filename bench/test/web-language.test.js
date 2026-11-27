import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES, pickLanguage, slidesUrl } from '../web/src/lib/language.js';

test('an explicit ?lang= wins over the browser language', () => {
  assert.equal(pickLanguage('ca', 'en-US'), 'ca');
  assert.equal(pickLanguage('es', 'ca-ES'), 'es');
  assert.equal(pickLanguage('en', 'es-ES'), 'en');
});

test('without ?lang=, Spanish and Catalan browsers get their language and the rest English', () => {
  assert.equal(pickLanguage(null, 'ca'), 'ca');
  assert.equal(pickLanguage(null, 'ca-ES'), 'ca');
  assert.equal(pickLanguage(null, 'es-MX'), 'es');
  assert.equal(pickLanguage(null, 'fr-FR'), 'en');
  assert.equal(pickLanguage(null, undefined), 'en');
});

test('an unknown ?lang= falls back to the browser language', () => {
  assert.equal(pickLanguage('de', 'ca-ES'), 'ca');
});

test('the slides link opens the published deck in the same language', () => {
  assert.equal(slidesUrl('es'), 'https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/');
  assert.equal(slidesUrl('en'), 'https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/en/');
  assert.equal(slidesUrl('ca'), 'https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/ca/');
});

test('every language has a name written in that language', () => {
  assert.deepEqual(
    LANGUAGES.map(({ code, name }) => [code, name]),
    [['es', 'Español'], ['en', 'English'], ['ca', 'Català']],
  );
});
