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
      // What must not change between languages: chart data, builds, demos and shortcuts.
      data: [...document.querySelectorAll('table[data-chart]')].map((table) => [
        table.closest('.slide').id,
        table.dataset.chart,
        table.dataset.chartBy ?? '',
        [...table.querySelectorAll('td[data-value]')].map((td) => td.dataset.value).join(' '),
      ]),
      builds: [...document.querySelectorAll('[data-build]')].map((list) => [list.closest('.slide').id, list.dataset.build, list.children.length]),
      demos: [...document.querySelectorAll('.demo-open')].map((b) => [b.closest('.slide').id, b.dataset.demoUrl || b.closest('.demo').dataset.demoUrl]),
      shortcuts: [...document.querySelectorAll('#deck-controls button')].map((b) => b.getAttribute('aria-keyshortcuts')),
      marks: [...document.querySelectorAll('.slide mark')].length,
    }));
  };
  const [es, en, ca] = [await structure(''), await structure('en/'), await structure('ca/')];

  assert.deepEqual([es.lang, en.lang, ca.lang], ['es', 'en', 'ca']);
  for (const key of ['slides', 'data', 'builds', 'demos', 'shortcuts', 'marks']) {
    assert.deepEqual(en[key], es[key], `en ${key}`);
    assert.deepEqual(ca[key], es[key], `ca ${key}`);
  }
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

// --- Visual and text views ---------------------------------------------------

// The table stays in the page for screen readers, visually hidden.
const tableWidth = (id) => page.locator(`#${id} .chart-table`).evaluate((wrapper) => wrapper.getBoundingClientRect().width);
const chart = (id) => page.locator(`#${id} .chart-view`);

test('the visual view is the default: each data table is drawn as a chart, and the table stays for screen readers', async () => {
  await page.goto(`${DECK_URL}#cien-opciones`);

  assert.equal(await chart('cien-opciones').isVisible(), true);
  assert.equal(await chart('cien-opciones').getAttribute('aria-hidden'), 'true');
  // One panel per measure, one bar per implementation.
  assert.equal(await chart('cien-opciones').locator('.chart-panel').count(), 3);
  assert.equal(await chart('cien-opciones').locator('.chart-bar').count(), 15);
  assert.ok((await tableWidth('cien-opciones')) <= 1);
  assert.equal(await page.locator('#cien-opciones').getByRole('table').count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Vista de texto' }).getAttribute('aria-pressed'), 'false');
});

test('G and the toolbar button switch the whole deck to the text view and back, and the choice survives a reload', async () => {
  await page.goto(`${DECK_URL}#cien-opciones`);
  const textButton = page.getByRole('button', { name: 'Vista de texto' });

  await page.keyboard.press('g');
  assert.equal(await chart('cien-opciones').isVisible(), false);
  assert.ok((await tableWidth('cien-opciones')) > 100);
  assert.equal(await textButton.getAttribute('aria-pressed'), 'true');
  await waitForAnnouncement('Vista de texto');

  await page.reload();
  assert.equal(await chart('cien-opciones').isVisible(), false);

  await textButton.click();
  assert.equal(await chart('cien-opciones').isVisible(), true);
  await waitForAnnouncement('Vista visual');
});

test('the view can be chosen in the settings', async () => {
  await page.goto(`${DECK_URL}#cien-opciones`);
  await page.getByRole('button', { name: 'Ayuda y ajustes' }).click();
  const view = page.getByRole('dialog', { name: 'Ayuda y ajustes' }).getByRole('group', { name: 'Vista' });

  assert.equal(await view.getByRole('radio', { name: /visual/i }).isChecked(), true);
  await view.getByRole('radio', { name: /texto/i }).check();
  assert.equal(await chart('cien-opciones').isVisible(), false);
});

test('every data slide has its chart in the visual view', async () => {
  await page.goto(DECK_URL);
  const missing = await page.evaluate(() =>
    [...document.querySelectorAll('.slide')]
      .filter((slide) => slide.querySelector('td[data-value]') && !slide.querySelector('.chart-view'))
      .map((slide) => slide.id),
  );
  assert.deepEqual(missing, []);
});

// --- Builds: items revealed one at a time --------------------------------------

const shownItems = (id) => page.locator(`#${id} [data-build] > li:visible`).count();

test('a timeline reveals one item per key press, announces it, and only then moves to the next slide', async () => {
  await page.goto(DECK_URL);
  const ids = await slideIds();
  const index = ids.indexOf('diez-anos');
  await page.goto(`${DECK_URL}#${ids[index - 1]}`);
  await page.keyboard.press('ArrowRight');
  assert.equal(await shownItems('diez-anos'), 0);

  await page.keyboard.press('ArrowRight');
  assert.equal(await shownItems('diez-anos'), 1);
  const first = (await page.locator('#diez-anos [data-build] > li').first().textContent()).trim().replace(/\s+/g, ' ');
  await waitForAnnouncement(first);

  for (let i = 0; i < 3; i += 1) await page.keyboard.press('ArrowRight');
  assert.equal(await shownItems('diez-anos'), 4);
  await page.keyboard.press('ArrowRight');
  assert.equal(await visibleSlides().getAttribute('id'), ids[index + 1]);

  // Coming back shows the whole slide, and going back hides the last item.
  await page.keyboard.press('ArrowLeft');
  assert.equal(await visibleSlides().getAttribute('id'), 'diez-anos');
  assert.equal(await shownItems('diez-anos'), 4);
  await page.keyboard.press('ArrowLeft');
  assert.equal(await shownItems('diez-anos'), 3);
});

test('builds show everything at once when opening a link to the slide and in the text view', async () => {
  await page.goto(`${DECK_URL}#diez-anos`);
  assert.equal(await shownItems('diez-anos'), 4);

  const ids = await slideIds();
  await page.keyboard.press('g');
  await page.goto(`${DECK_URL}#${ids[ids.indexOf('diez-anos') - 1]}`);
  await page.keyboard.press('ArrowRight');
  assert.equal(await visibleSlides().getAttribute('id'), 'diez-anos');
  assert.equal(await shownItems('diez-anos'), 4);
});

test('the out-of-date tree explainer shows one step at a time and every step in the text view', async () => {
  await page.goto(DECK_URL);
  const ids = await slideIds();
  const index = ids.indexOf('arbol-desfasado');
  assert.ok(index > ids.indexOf('un-bosque'));
  await page.goto(`${DECK_URL}#${ids[index - 1]}`);
  await page.keyboard.press('ArrowRight');
  const steps = await page.locator('#arbol-desfasado [data-build] > li').count();
  assert.ok(steps >= 4);
  assert.equal(await shownItems('arbol-desfasado'), 1);

  await page.keyboard.press('ArrowRight');
  assert.equal(await shownItems('arbol-desfasado'), 1);
  assert.match(await page.locator('#arbol-desfasado [data-build] > li:visible h3').textContent(), /^Paso 2 de/);

  await page.keyboard.press('g');
  assert.equal(await shownItems('arbol-desfasado'), steps);
});

// --- Slide content ------------------------------------------------------------

test('the numbers on the radio slides are highlighted with mark', async () => {
  await page.goto(`${DECK_URL}#radio-nativo`);
  assert.deepEqual(await page.locator('#radio-nativo mark').allTextContents(), ['131', '0']);
});

test('the chrome://accessibility slide has the screenshot and a live demo reminder', async () => {
  await page.goto(`${DECK_URL}#chrome-accessibility`);
  const slide = page.locator('#chrome-accessibility');
  assert.match(await slide.getByRole('img').first().getAttribute('alt'), /chrome:\/\/accessibility/);
  assert.match(await slide.locator('.demo-badge').textContent(), /Demo en directo/);
});

test('the last slide thanks in Catalan, Spanish and English and links the repository with a QR code', async () => {
  await page.goto(`${DECK_URL}#gracias`);
  const slide = page.locator('#gracias');
  const heading = slide.getByRole('heading', { level: 2 }).first();
  assert.equal((await heading.textContent()).replace(/\s+/g, ' ').trim(), 'Gràcies Gracias Thank you');
  assert.equal(await heading.locator('[lang="ca"]').textContent(), 'Gràcies');
  assert.equal(await heading.locator('[lang="en"]').textContent(), 'Thank you');
  assert.match(await slide.getByRole('img').first().getAttribute('alt'), /github\.com\/nucliweb\/el-arbol-de-accesibilidad-fragil/);
  assert.equal(await slide.getByRole('link', { name: 'joanleon.dev' }).count(), 0);
});

// --- About the speaker -------------------------------------------------------

test('the speaker slide has the photo, the roles as named logos and the profile links', async () => {
  await page.goto(`${DECK_URL}#sobre-mi`);
  const slide = page.locator('#sobre-mi');

  assert.match(await slide.getByRole('img').first().getAttribute('alt'), /^Joan León, en blanco y negro/);
  for (const name of [/PerfReviews/, /Google Developer Expert/, /GDG Girona/, /GeeksCAT/]) {
    assert.equal(await slide.getByRole('img', { name }).count(), 1, String(name));
  }
  for (const name of ['LinkedIn', 'joanleon.dev', 'X', 'Bluesky']) {
    assert.equal(await slide.getByRole('link', { name, exact: true }).count(), 1, name);
  }
});

// --- Live demos ----------------------------------------------------------------

for (const id of ['traza-renfe', 'demo-mui']) {
  test(`the ${id} demo opens trace.cafe hidden from assistive technology and closes back to the screenshot`, async () => {
    await page.route('https://trace.cafe/**', (route) => route.fulfill({ body: '<!doctype html><title>trace</title>', contentType: 'text/html' }));
    await page.goto(`${DECK_URL}#${id}`);
    const slide = page.locator(`#${id}`);
    const screenshot = slide.getByRole('img').first();
    const alt = await screenshot.getAttribute('alt');

    await slide.getByRole('button', { name: 'Abrir la demo' }).click();
    const frame = slide.locator('iframe');
    assert.match(await frame.getAttribute('src'), /^https:\/\/trace\.cafe\/t\//);
    assert.equal(await frame.getAttribute('aria-hidden'), 'true');
    assert.equal(await frame.isVisible(), true);
    // Screen readers keep the text alternative of the screenshot.
    assert.equal(await slide.getByRole('img', { name: alt }).count(), 1);
    const close = slide.getByRole('button', { name: 'Cerrar la demo' });
    assert.equal(await close.evaluate((el) => el === document.activeElement), true);

    const fullscreen = slide.getByRole('button', { name: 'Pantalla completa' });
    assert.equal(await fullscreen.getAttribute('aria-pressed'), 'false');
    await fullscreen.click();
    await page.waitForFunction(() => document.fullscreenElement?.classList.contains('demo'));
    await page.waitForFunction(() => document.querySelector('.demo-fullscreen').getAttribute('aria-pressed') === 'true');
    await fullscreen.click();
    await page.waitForFunction(() => !document.fullscreenElement);
    await page.waitForFunction(() => document.querySelector('.demo-fullscreen').getAttribute('aria-pressed') === 'false');

    await close.focus();
    await page.keyboard.press('Escape');
    assert.equal(await frame.count(), 0);
    assert.equal(await slide.getByRole('button', { name: 'Abrir la demo' }).evaluate((el) => el === document.activeElement), true);
  });
}

// --- Fit and room on screen ----------------------------------------------------

const slideOverflow = (id) =>
  page.locator(`#${id}`).evaluate((slide) => slide.scrollHeight - slide.clientHeight);

for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 1920, height: 1080 }]) {
  test(`the speaker slide fits without scrolling at ${viewport.width}x${viewport.height}, also with the notes open`, async () => {
    await page.setViewportSize(viewport);
    await page.goto(`${DECK_URL}#sobre-mi`);
    await page.waitForFunction(() => [...document.querySelectorAll('#sobre-mi img')].every((img) => img.complete));
    assert.ok((await slideOverflow('sobre-mi')) <= 1, 'slide scrolls');

    await page.keyboard.press('n');
    assert.ok((await slideOverflow('sobre-mi')) <= 1, 'slide scrolls with notes');
  });
}

test('H hides the controls bar to give the slide more room, and it comes back with the keyboard', async () => {
  await page.goto(`${DECK_URL}#sobre-mi`);
  const slideHeight = () => page.locator('#sobre-mi').evaluate((s) => s.clientHeight);
  // Waits for the fade to end.
  const barOpacity = async (expected) => {
    await page.waitForFunction((value) => getComputedStyle(document.querySelector('#deck-controls')).opacity === value, expected, { timeout: 2000 }).catch(() => {});
    return page.locator('#deck-controls').evaluate((bar) => getComputedStyle(bar).opacity);
  };
  const before = await slideHeight();

  await page.keyboard.press('h');
  await waitForAnnouncement('Barra de controles oculta. Pulsa H para mostrarla.');
  assert.ok((await slideHeight()) > before);
  assert.equal(await barOpacity('0'), '0');
  // Still in the page for keyboard and screen reader users.
  assert.equal(await page.getByRole('button', { name: 'Siguiente' }).count(), 1);

  await page.getByRole('button', { name: 'Anterior' }).focus();
  assert.equal(await barOpacity('1'), '1');

  await page.reload();
  assert.equal(await barOpacity('0'), '0');
  await page.keyboard.press('H');
  assert.equal(await barOpacity('1'), '1');
  assert.equal(await slideHeight(), before);
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
  test(`no slide scrolls at ${viewport.width}x${viewport.height}, in every language and in the visual and the text view`, async () => {
    await page.setViewportSize(viewport);
    const problems = [];
    for (const path of ['', 'en/', 'ca/']) {
    await page.goto(`${DECK_URL}${path}`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const total = await page.locator('.slide').count();
    for (const view of ['visual', 'text']) {
      if (view === 'text') await page.keyboard.press('g');
      await page.keyboard.press('Home');
      for (let i = 0; i < total; i += 1) {
        await page.evaluate(() => Promise.all([...document.querySelectorAll('.slide:not([hidden]) img')].map((img) => img.decode().catch(() => {}))));
        await page.waitForTimeout(50);
        const [id, overflow] = await page.evaluate(() => {
          const slide = document.querySelector('.slide:not([hidden])');
          return [slide.id, slide.scrollHeight - slide.clientHeight];
        });
        if (overflow > 1) problems.push(`${path || 'es/'} ${view} ${id} +${overflow}px`);
        await page.keyboard.press('ArrowRight');
      }
    }
    }
    assert.deepEqual(problems, []);
  });
}

test('at 200% zoom the text is never shrunk below 1rem to make a slide fit', async () => {
  await page.setViewportSize({ width: 640, height: 360 });
  await page.goto(`${DECK_URL}#resultado-voiceover`);
  const size = await page.locator('#resultado-voiceover').evaluate((slide) => parseFloat(getComputedStyle(slide).fontSize));
  assert.ok(size >= 16, `${size}px`);
});

for (const [id, demos] of Object.entries({
  'travel-ripple-devtools': { legacy: 'ihrNliptjB', nativa: 'J5PZ7aWCIg' },
  'travel-navegador': { legacy: 'VoRFo6QOSY', nativa: 'XLPHjpSGiI' },
})) {
  test(`${id} opens the legacy and the native trace, each covering the slide`, async () => {
    await page.route('https://trace.cafe/**', (route) => route.fulfill({ body: '<!doctype html><title>trace</title>', contentType: 'text/html' }));
    await page.goto(`${DECK_URL}#${id}`);
    const slide = page.locator(`#${id}`);
    for (const [version, trace] of Object.entries(demos)) {
      await slide.getByRole('button', { name: `Abrir la demo: ${version}` }).click();
      const frame = slide.locator('iframe');
      assert.equal(await frame.getAttribute('src'), `https://trace.cafe/t/${trace}`);
      const [frameBox, slideBox] = [await frame.boundingBox(), await slide.boundingBox()];
      assert.ok(frameBox.height > slideBox.height * 0.7, 'the demo covers most of the slide');
      assert.ok((await slideOverflow(id)) <= 1, 'the slide does not scroll');
      await slide.getByRole('button', { name: 'Cerrar la demo' }).click();
      assert.equal(await frame.count(), 0);
    }
  });
}

test('every slide title sits at the same height, whatever the content below it', async () => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(DECK_URL);
  const total = await page.locator('.slide').count();
  const tops = new Map();
  for (const view of ['visual', 'text']) {
    if (view === 'text') await page.keyboard.press('g');
    await page.keyboard.press('Home');
    for (let i = 0; i < total; i += 1) {
      await page.waitForTimeout(30);
      const [id, top] = await page.evaluate(() => {
        const slide = document.querySelector('.slide:not([hidden])');
        const heading = slide.querySelector(':scope > h2');
        return [slide.id, heading ? Math.round(heading.getBoundingClientRect().top) : null];
      });
      if (top !== null) tops.set(`${view} ${id}`, top);
      await page.goto(`${DECK_URL}#${(await slideIds())[Math.min(i + 1, total - 1)]}`);
    }
  }
  const values = [...new Set(tops.values())];
  assert.equal(values.length, 1, JSON.stringify(Object.fromEntries(tops)));
});

// --- Demo controls and shortcuts --------------------------------------------------

test('the demo buttons sit above the demo, clear of the controls bar, also with the bar hidden', async () => {
  await page.route('https://trace.cafe/**', (route) => route.fulfill({ body: '<!doctype html><title>trace</title>', contentType: 'text/html' }));
  await page.goto(`${DECK_URL}#traza-renfe`);
  await page.keyboard.press('h');
  await page.locator('#traza-renfe').getByRole('button', { name: 'Abrir la demo' }).click();
  const controls = await page.locator('#traza-renfe .demo-controls').boundingBox();
  const frame = await page.locator('#traza-renfe iframe').boundingBox();
  assert.ok(controls.y + controls.height <= frame.y, 'controls above the frame');
});

test('O opens a slide\'s only demo; on slides with two, 1 and 2 open each one; F toggles fullscreen and Escape closes', async () => {
  await page.route('https://trace.cafe/**', (route) => route.fulfill({ body: '<!doctype html><title>trace</title>', contentType: 'text/html' }));
  await page.goto(`${DECK_URL}#traza-renfe`);
  assert.equal(await page.locator('#traza-renfe').getByRole('button', { name: 'Abrir la demo' }).getAttribute('aria-keyshortcuts'), 'O');
  await page.keyboard.press('o');
  assert.equal(await page.locator('#traza-renfe iframe').getAttribute('src'), 'https://trace.cafe/t/HJIoDNe5hJ');
  await page.keyboard.press('Escape');

  await page.goto(`${DECK_URL}#travel-ripple-devtools`);
  const slide = page.locator('#travel-ripple-devtools');
  const frame = slide.locator('iframe');
  assert.equal(await slide.getByRole('button', { name: 'Abrir la demo: legacy' }).getAttribute('aria-keyshortcuts'), '1');
  assert.equal(await slide.getByRole('button', { name: 'Abrir la demo: nativa' }).getAttribute('aria-keyshortcuts'), '2');
  assert.deepEqual(await slide.locator('.demo-open .key-hint').allTextContents(), ['1', '2']);

  await page.keyboard.press('2');
  assert.equal(await frame.getAttribute('src'), 'https://trace.cafe/t/J5PZ7aWCIg');
  await page.keyboard.press('1');
  assert.equal(await frame.getAttribute('src'), 'https://trace.cafe/t/ihrNliptjB');

  await page.keyboard.press('f');
  await page.waitForFunction(() => document.fullscreenElement?.classList.contains('demo'));
  await page.keyboard.press('f');
  await page.waitForFunction(() => !document.fullscreenElement);

  await page.keyboard.press('Escape');
  assert.equal(await frame.count(), 0);
});

test('buttons expose their shortcuts with aria-keyshortcuts', async () => {
  await page.route('https://trace.cafe/**', (route) => route.fulfill({ body: '<!doctype html><title>trace</title>', contentType: 'text/html' }));
  await page.goto(`${DECK_URL}#traza-renfe`);
  const expected = { Anterior: 'ArrowLeft', Siguiente: 'ArrowRight', Notas: 'N', 'Modo documento': 'D', 'Vista de texto': 'G', 'Ayuda y ajustes': '?', 'Abrir la demo': 'O' };
  for (const [name, keys] of Object.entries(expected)) {
    assert.equal(await page.getByRole('button', { name, exact: true }).getAttribute('aria-keyshortcuts'), keys, name);
  }
  await page.keyboard.press('o');
  assert.equal(await page.getByRole('button', { name: 'Pantalla completa' }).getAttribute('aria-keyshortcuts'), 'F');
  assert.equal(await page.getByRole('button', { name: 'Cerrar la demo' }).getAttribute('aria-keyshortcuts'), 'Escape');
});

test('holding Alt for 2 seconds shows each button\'s key, hidden from screen readers, until it is released', async () => {
  await page.goto(`${DECK_URL}#traza-renfe`);
  const hint = page.locator('#next-slide .key-hint');

  await page.keyboard.down('Alt');
  await page.waitForTimeout(800);
  assert.equal(await hint.isVisible(), false);
  await page.waitForTimeout(1500);
  assert.equal(await hint.isVisible(), true);
  assert.equal(await hint.getAttribute('aria-hidden'), 'true');
  assert.equal(await page.getByRole('button', { name: 'Siguiente', exact: true }).count(), 1);
  await page.keyboard.up('Alt');
  assert.equal(await hint.isVisible(), false);
});
