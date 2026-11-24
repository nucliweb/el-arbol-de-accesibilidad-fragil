import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const DECK_URL = pathToFileURL(resolve(import.meta.dirname, '..', 'index.html')).href;

let browser;
let context;
let page;

before(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
});

after(async () => {
  await browser.close();
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
  const dialog = page.getByRole('dialog', { name: 'Ayuda' });
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
  const helpButton = page.getByRole('button', { name: 'Ayuda' });

  await helpButton.click();
  assert.equal(await page.getByRole('dialog', { name: 'Ayuda' }).isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog', { name: 'Ayuda' }).isVisible(), false);
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
  const checkbox = page.getByRole('dialog', { name: 'Ayuda' }).getByRole('checkbox', { name: /atajos de una tecla/i });
  await checkbox.focus();

  await page.keyboard.press('n');
  assert.equal(await page.locator('.slide:visible .notes').isVisible(), false);
});
