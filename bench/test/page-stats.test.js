import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { collectDomStats, collectCssStats } from '../scripts/lib/page-stats.js';

let browser;
let page;

before(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
  page = await browser.newPage();
});

after(async () => {
  await browser.close();
});

test('counts elements, attributes and depth inside the measured root', async () => {
  await page.setContent(`
    <main id="root">
      <div class="a" data-x="1">
        <input type="radio" name="moons" id="luna">
        <label for="luna">Luna</label>
      </div>
    </main>
  `);

  const stats = await page.evaluate(collectDomStats, '#root');

  // div, input, label (the root itself is not counted)
  assert.equal(stats.elements, 3);
  // class, data-x, type, name, id, for
  assert.equal(stats.attributes, 6);
  // root > div > input
  assert.equal(stats.maxDepth, 2);
  assert.equal(stats.shadowRoots, 0);
});

test('walks into open shadow roots', async () => {
  await page.setContent(`
    <main id="root"><x-radio></x-radio></main>
    <script>
      customElements.define('x-radio', class extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' }).innerHTML =
            '<div class="outer"><div class="inner"><span></span></div></div>';
        }
      });
    </script>
  `);

  const stats = await page.evaluate(collectDomStats, '#root');

  // x-radio + div.outer + div.inner + span
  assert.equal(stats.elements, 4);
  assert.equal(stats.attributes, 2);
  // root > x-radio > (shadow) div.outer > div.inner > span
  assert.equal(stats.maxDepth, 4);
  assert.equal(stats.shadowRoots, 1);
});

test('counts rules, selectors and declarations, including adopted sheets in shadow roots', async () => {
  await page.setContent(`
    <style>
      .a, .b { color: red; margin: 0; }
      @media (min-width: 1px) { .c { padding: 0; } }
    </style>
    <x-styled></x-styled>
    <script>
      customElements.define('x-styled', class extends HTMLElement {
        constructor() {
          super();
          const root = this.attachShadow({ mode: 'open' });
          const sheet = new CSSStyleSheet();
          sheet.replaceSync(':host { display: block; } .d { color: blue; }');
          root.adoptedStyleSheets = [sheet];
        }
      });
    </script>
  `);

  const stats = await page.evaluate(collectCssStats);

  // .a,.b / .c (inside @media) / :host / .d
  assert.equal(stats.styleRules, 4);
  // .a, .b, .c, :host, .d
  assert.equal(stats.selectors, 5);
  // color, margin, padding, display, color
  assert.equal(stats.declarations, 5);
  assert.equal(stats.sheets, 2);
});
