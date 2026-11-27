import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startDeckServer } from './server.js';

let server;
let DECK_URL;
let browser;
let context;
let page;

before(async () => {
  server = await startDeckServer();
  DECK_URL = `${server.origin}/`;
  browser = await chromium.launch({ channel: 'chrome' });
});

after(async () => {
  await browser.close();
  server.close();
});

beforeEach(async () => {
  await context?.close();
  context = await browser.newContext();
  page = await context.newPage();
});

const visibleSlides = () => page.locator('.slide:visible');
const announcement = () => page.locator('#announcer').textContent();
const slideIds = () => page.$$eval('.slide', (slides) => slides.map((s) => s.id));
const slideTitle = (index) => page.locator('.slide').nth(index).locator('h1, h2').first().textContent();

test('without JavaScript it is one readable document with every slide and its notes', async () => {
  await context.close();
  context = await browser.newContext({ javaScriptEnabled: false });
  page = await context.newPage();
  await page.goto(DECK_URL);

  const total = await page.locator('.slide').count();
  assert.ok(total > 1);
  assert.equal(await visibleSlides().count(), total);
  assert.equal(await page.locator('.notes:visible').count(), await page.locator('.notes').count());
  assert.equal(await page.locator('h1').count(), 1);
});

test('with JavaScript it shows one slide at a time, starting with the first', async () => {
  await page.goto(DECK_URL);

  assert.equal(await visibleSlides().count(), 1);
  assert.equal(await visibleSlides().getAttribute('id'), (await slideIds())[0]);
});

test('arrow keys move between slides, update the URL and announce the new slide', async () => {
  await page.goto(DECK_URL);
  const ids = await slideIds();

  await page.keyboard.press('ArrowRight');
  assert.equal(await visibleSlides().getAttribute('id'), ids[1]);
  assert.equal(new URL(page.url()).hash, `#${ids[1]}`);
  await page.waitForFunction(() => document.querySelector('#announcer').textContent !== '');
  assert.equal(await announcement(), `Diapositiva 2 de ${ids.length}: ${(await slideTitle(1)).trim()}`);

  await page.keyboard.press('ArrowLeft');
  assert.equal(await visibleSlides().getAttribute('id'), ids[0]);
});

test('Home and End jump to the first and last slide, and navigation stops at the ends', async () => {
  await page.goto(DECK_URL);
  const ids = await slideIds();

  await page.keyboard.press('End');
  assert.equal(await visibleSlides().getAttribute('id'), ids.at(-1));
  await page.keyboard.press('ArrowRight');
  assert.equal(await visibleSlides().getAttribute('id'), ids.at(-1));
  assert.equal(await page.getByRole('button', { name: 'Siguiente' }).isDisabled(), true);

  await page.keyboard.press('Home');
  assert.equal(await visibleSlides().getAttribute('id'), ids[0]);
  assert.equal(await page.getByRole('button', { name: 'Anterior' }).isDisabled(), true);
});

test('the previous and next buttons work without the keyboard', async () => {
  await page.goto(DECK_URL);
  const ids = await slideIds();

  await page.getByRole('button', { name: 'Siguiente' }).click();
  assert.equal(await visibleSlides().getAttribute('id'), ids[1]);
  await page.getByRole('button', { name: 'Anterior' }).click();
  assert.equal(await visibleSlides().getAttribute('id'), ids[0]);
});

test('opening a link to a slide shows that slide', async () => {
  await page.goto(DECK_URL);
  const third = (await slideIds())[2];

  await page.goto(`${DECK_URL}#${third}`);
  assert.equal(await visibleSlides().getAttribute('id'), third);
});

test('N toggles the notes, the button reflects it, and the choice survives a reload', async () => {
  await page.goto(DECK_URL);
  const notesButton = page.getByRole('button', { name: 'Notas' });
  const currentNotes = () => page.locator('.slide:visible .notes');

  assert.equal(await currentNotes().isVisible(), false);
  assert.equal(await notesButton.getAttribute('aria-pressed'), 'false');

  await page.keyboard.press('n');
  assert.equal(await currentNotes().isVisible(), true);
  assert.equal(await notesButton.getAttribute('aria-pressed'), 'true');

  await page.reload();
  assert.equal(await currentNotes().isVisible(), true);

  await notesButton.click();
  assert.equal(await currentNotes().isVisible(), false);
});

test('single-key shortcuts can be turned off from the help dialog; arrows keep working', async () => {
  await page.goto(DECK_URL);
  const ids = await slideIds();

  await page.keyboard.press('?');
  const dialog = page.getByRole('dialog', { name: 'Ayuda y ajustes' });
  assert.equal(await dialog.isVisible(), true);

  await dialog.getByRole('checkbox', { name: /atajos de una tecla/i }).uncheck();
  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  assert.equal(await dialog.isVisible(), false);

  await page.keyboard.press('n');
  assert.equal(await page.locator('.slide:visible .notes').isVisible(), false);
  await page.keyboard.press('?');
  assert.equal(await dialog.isVisible(), false);

  await page.keyboard.press('ArrowRight');
  assert.equal(await visibleSlides().getAttribute('id'), ids[1]);
});

test('the help dialog closes with Escape and returns focus to where it was', async () => {
  await page.goto(DECK_URL);
  const helpButton = page.getByRole('button', { name: 'Ayuda y ajustes' });

  await helpButton.click();
  assert.equal(await page.getByRole('dialog', { name: 'Ayuda y ajustes' }).isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog', { name: 'Ayuda y ajustes' }).isVisible(), false);
  assert.equal(await helpButton.evaluate((el) => el === document.activeElement), true);
});

test('document mode shows every slide and stops capturing the arrow keys', async () => {
  await page.goto(DECK_URL);
  const total = await page.locator('.slide').count();

  await page.getByRole('button', { name: 'Modo documento' }).click();
  assert.equal(await visibleSlides().count(), total);

  const before = await page.evaluate(() => location.hash);
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(() => location.hash), before);
});

test('moving to another slide never leaves focus inside a hidden slide', async () => {
  await page.goto(DECK_URL);
  await page.locator('.slide:visible h1, .slide:visible h2').first().focus();

  await page.keyboard.press('ArrowRight');
  const focusIsVisible = await page.evaluate(() => {
    const el = document.activeElement;
    return el === document.body || el.checkVisibility();
  });
  assert.equal(focusIsVisible, true);
});

test('shortcuts are ignored while typing in a form field', async () => {
  await page.goto(DECK_URL);
  await page.keyboard.press('?');
  const checkbox = page.getByRole('dialog', { name: 'Ayuda y ajustes' }).getByRole('checkbox', { name: /atajos de una tecla/i });
  await checkbox.focus();

  await page.keyboard.press('n');
  assert.equal(await page.locator('.slide:visible .notes').isVisible(), false);
});

// --- Theme -------------------------------------------------------------------

const LIGHT_BG = 'rgb(251, 250, 247)';
const DARK_BG = 'rgb(18, 18, 18)';
const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const waitForAnnouncement = (text) =>
  page.waitForFunction((expected) => document.querySelector('#announcer').textContent === expected, text);

const withColorScheme = async (colorScheme) => {
  await context.close();
  context = await browser.newContext({ colorScheme });
  page = await context.newPage();
};

test('the theme follows the system by default', async () => {
  await withColorScheme('dark');
  await page.goto(DECK_URL);
  assert.equal(await background(), DARK_BG);

  await withColorScheme('light');
  await page.goto(DECK_URL);
  assert.equal(await background(), LIGHT_BG);
});

test('T switches between light and dark, the settings reflect it, and the choice survives a reload', async () => {
  await withColorScheme('light');
  await page.goto(DECK_URL);

  await page.keyboard.press('t');
  assert.equal(await background(), DARK_BG);
  await waitForAnnouncement('Tema oscuro');

  await page.keyboard.press('?');
  const dialog = page.getByRole('dialog', { name: 'Ayuda y ajustes' });
  assert.equal(await dialog.getByRole('radio', { name: 'Oscuro' }).isChecked(), true);
  await page.keyboard.press('Escape');

  await page.reload();
  assert.equal(await background(), DARK_BG);

  await page.keyboard.press('T');
  assert.equal(await background(), LIGHT_BG);
  await waitForAnnouncement('Tema claro');
});

test('the theme can be chosen in the settings, including going back to the system theme', async () => {
  await withColorScheme('dark');
  await page.goto(DECK_URL);
  await page.getByRole('button', { name: 'Ayuda y ajustes' }).click();
  const theme = page.getByRole('dialog', { name: 'Ayuda y ajustes' }).getByRole('group', { name: 'Tema' });

  assert.equal(await theme.getByRole('radio', { name: /sistema/i }).isChecked(), true);
  await theme.getByRole('radio', { name: 'Claro' }).check();
  assert.equal(await background(), LIGHT_BG);
  await theme.getByRole('radio', { name: /sistema/i }).check();
  assert.equal(await background(), DARK_BG);
});

test('T does nothing when single-key shortcuts are off', async () => {
  await withColorScheme('light');
  await page.goto(DECK_URL);
  await page.keyboard.press('?');
  await page.getByRole('checkbox', { name: /atajos de una tecla/i }).uncheck();
  await page.keyboard.press('Escape');

  await page.keyboard.press('t');
  assert.equal(await background(), LIGHT_BG);
});

// --- Languages ---------------------------------------------------------------

const LANGUAGES = [
  { path: '', lang: 'es', next: 'Siguiente', slide: (n, total) => `Diapositiva ${n} de ${total}` },
  { path: 'en/', lang: 'en', next: 'Next', slide: (n, total) => `Slide ${n} of ${total}` },
  { path: 'ca/', lang: 'ca', next: 'Següent', slide: (n, total) => `Diapositiva ${n} de ${total}` },
];

test('L opens the same slide in English, then Catalan, then Spanish again, and announces it', async () => {
  await page.goto(DECK_URL);
  const ids = await slideIds();
  const id = ids[3];
  await page.goto(`${DECK_URL}#${id}`);

  for (const { path, lang, slide } of [LANGUAGES[1], LANGUAGES[2], LANGUAGES[0]]) {
    await page.keyboard.press('l');
    await page.waitForURL(`${DECK_URL}${path}#${id}`);
    assert.equal(await page.evaluate(() => document.documentElement.lang), lang);
    assert.equal(await visibleSlides().getAttribute('id'), id);
    await page.waitForFunction(() => document.querySelector('#announcer').textContent !== '');
    assert.match(await announcement(), new RegExp(`${slide(4, ids.length)}: ${(await slideTitle(3)).trim()}$`));
  }
});

test('the settings link to every language at the current slide', async () => {
  await page.goto(DECK_URL);
  const id = (await slideIds())[2];
  await page.goto(`${DECK_URL}#${id}`);
  await page.getByRole('button', { name: 'Ayuda y ajustes' }).click();
  const dialog = page.getByRole('dialog', { name: 'Ayuda y ajustes' });

  for (const [name, lang, path] of [['English', 'en', 'en/'], ['Català', 'ca', 'ca/']]) {
    const link = dialog.getByRole('link', { name });
    assert.equal(await link.getAttribute('lang'), lang);
    assert.equal(await link.getAttribute('hreflang'), lang);
    assert.equal(await link.evaluate((a) => a.href), `${DECK_URL}${path}#${id}`);
  }
  assert.equal(await dialog.getByRole('link', { name: 'Español' }).getAttribute('aria-current'), 'true');

  await dialog.getByRole('link', { name: 'Català' }).click();
  await page.waitForURL(`${DECK_URL}ca/#${id}`);
  assert.equal(await visibleSlides().getAttribute('id'), id);
});

test('every translation has the same slides, in the same order, each with its notes', async () => {
  const structure = async (path) => {
    await page.goto(`${DECK_URL}${path}`);
    return page.evaluate(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      slides: [...document.querySelectorAll('.slide')].map((s) => [s.id, s.querySelectorAll(':scope > .notes').length]),
    }));
  };
  const [es, en, ca] = [await structure(''), await structure('en/'), await structure('ca/')];

  assert.deepEqual([es.lang, en.lang, ca.lang], ['es', 'en', 'ca']);
  assert.deepEqual(en.slides, es.slides);
  assert.deepEqual(ca.slides, es.slides);
  assert.ok(es.slides.every(([, notes]) => notes === 1));
  assert.notEqual(en.title, es.title);
  assert.notEqual(ca.title, es.title);
});

test('each translation speaks its own language in the controls and announcements', async () => {
  for (const { path, next, slide } of LANGUAGES.slice(1)) {
    await page.goto(`${DECK_URL}${path}`);
    const total = await page.locator('.slide').count();
    await page.getByRole('button', { name: next, exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#announcer').textContent !== '');
    assert.equal(await announcement(), `${slide(2, total)}: ${(await slideTitle(1)).trim()}`);
  }
});
