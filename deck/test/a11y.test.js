import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import { startDeckServer } from './server.js';

const AXE_SOURCE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const LANGUAGES = [
  { path: '', lang: 'es', documentMode: 'Modo documento', notes: 'Notas' },
  { path: 'en/', lang: 'en', documentMode: 'Document mode', notes: 'Notes' },
  { path: 'ca/', lang: 'ca', documentMode: 'Mode document', notes: 'Notes' },
];

let server;
let browser;

before(async () => {
  server = await startDeckServer();
  browser = await chromium.launch({ channel: 'chrome' });
});

after(async () => {
  await browser.close();
  server.close();
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

for (const { path, lang, documentMode, notes } of LANGUAGES) {
  for (const colorScheme of ['light', 'dark']) {
    test(`[${lang}] document mode with notes has no axe violations (${colorScheme})`, async () => {
      const context = await browser.newContext({ colorScheme });
      const page = await context.newPage();
      await page.goto(`${server.origin}/${path}`);
      await page.getByRole('button', { name: documentMode }).click();
      await page.getByRole('button', { name: notes, exact: true }).click();

      assert.deepEqual(await audit(page), []);
      await context.close();
    });

    test(`[${lang}] every slide in presentation mode has no axe violations (${colorScheme})`, async () => {
      const context = await browser.newContext({ colorScheme });
      const page = await context.newPage();
      await page.goto(`${server.origin}/${path}`);
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
  }

  test(`[${lang}] the help and settings dialog has no axe violations`, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${server.origin}/${path}`);
    await page.keyboard.press('?');

    assert.deepEqual(await audit(page), []);
    await context.close();
  });

  test(`[${lang}] without JavaScript the document has no axe violations`, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    // axe needs script, so only the deck script is left out.
    await page.route('**/deck.js', (route) => route.fulfill({ body: '', contentType: 'text/javascript' }));
    await page.goto(`${server.origin}/${path}`);

    assert.deepEqual(await audit(page), []);
    await context.close();
  });
}
