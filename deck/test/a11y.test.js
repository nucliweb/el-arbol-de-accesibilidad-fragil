import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const DECK_URL = pathToFileURL(resolve(import.meta.dirname, '..', 'index.html')).href;
const AXE_SOURCE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

let browser;

before(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
});

after(async () => {
  await browser.close();
});

// Runs axe with the WCAG 2.2 A/AA rules and returns readable violations.
const audit = async (page, { skipRules = [] } = {}) => {
  if (!(await page.evaluate(() => 'axe' in window))) await page.addScriptTag({ content: AXE_SOURCE });
  const { violations } = await page.evaluate(
    (rules) =>
      window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
        rules: Object.fromEntries(rules.map((id) => [id, { enabled: false }])),
      }),
    skipRules,
  );
  return violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')})`);
};

for (const colorScheme of ['light', 'dark']) {
  test(`document mode with notes has no axe violations (${colorScheme})`, async () => {
    const context = await browser.newContext({ colorScheme });
    const page = await context.newPage();
    await page.goto(DECK_URL);
    await page.getByRole('button', { name: 'Modo documento' }).click();
    await page.getByRole('button', { name: 'Notas' }).click();

    assert.deepEqual(await audit(page), []);
    await context.close();
  });
}

test('every slide in presentation mode has no axe violations', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(DECK_URL);
  const total = await page.locator('.slide').count();

  const problems = [];
  for (let i = 0; i < total; i += 1) {
    // Let the 180 ms fade-in finish so contrast is checked at full opacity.
    await page.waitForTimeout(250);
    const id = await page.locator('.slide:visible').getAttribute('id');
    // Only the current slide is exposed in presentation mode by design, so the
    // single h1 (cover slide) is absent elsewhere. It is a best practice, not a
    // WCAG criterion, and document mode is audited with it enabled.
    for (const violation of await audit(page, { skipRules: ['page-has-heading-one'] })) problems.push(`${id}: ${violation}`);
    await page.keyboard.press('ArrowRight');
  }
  assert.deepEqual(problems, []);
  await context.close();
});

test('without JavaScript the document has no axe violations', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(DECK_URL);
  // axe needs script; inject it through the browser context instead.
  await context.close();
  const scripted = await browser.newContext();
  const plain = await scripted.newPage();
  await plain.route('**/deck.js', (route) => route.fulfill({ body: '', contentType: 'text/javascript' }));
  await plain.goto(DECK_URL);

  assert.deepEqual(await audit(plain), []);
  await scripted.close();
});
