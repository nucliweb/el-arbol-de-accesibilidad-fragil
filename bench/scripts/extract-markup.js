// Extracts the rendered markup of one radio option (N=1) from each built app,
// including open shadow roots, for use on the slides.
//
// Usage: node scripts/extract-markup.js > results/markup-n1.json

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const TARGETS = {
  native: ['apps/native/dist/native', 'n-1.html'],
  'shadcn-base': ['apps/shadcn/dist', 'index.html?n=1'],
  'shadcn-radix': ['apps/shadcn-radix/dist', 'index.html?n=1'],
  mui: ['apps/mui/dist', 'index.html?n=1'],
  'material-web': ['apps/material-web/dist', 'index.html?n=1'],
};
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };

const server = createServer((req, res) => {
  const [, target, ...rest] = new URL(req.url, 'http://x').pathname.split('/');
  const base = TARGETS[target] && join(ROOT, TARGETS[target][0]);
  const file = base && normalize(join(base, rest.join('/')));
  if (!file || !file.startsWith(base) || !existsSync(file) || !statSync(file).isFile()) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));

const browser = await chromium.launch({ channel: 'chrome' });
const result = {};
for (const [name, [, page]] of Object.entries(TARGETS)) {
  const tab = await browser.newPage();
  await tab.goto(`http://127.0.0.1:${server.address().port}/${name}/${page}`);
  await tab.waitForTimeout(500);
  result[name] = await tab.evaluate(() => {
    // Serialize an element, inlining open shadow roots as <template shadowrootmode>.
    const serialize = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent.trim() ? node.textContent.trim() : '';
      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      const tag = node.localName;
      const attrs = [...node.attributes].map((a) => (a.value === '' ? ` ${a.name}` : ` ${a.name}="${a.value}"`)).join('');
      const shadow = node.shadowRoot
        ? `<template shadowrootmode="open">${[...node.shadowRoot.childNodes].filter((n) => n.localName !== 'style').map(serialize).join('')}</template>`
        : '';
      const children = [...node.childNodes].map(serialize).join('');
      return ['input', 'img', 'br'].includes(tag) ? `<${tag}${attrs}>` : `<${tag}${attrs}>${shadow}${children}</${tag}>`;
    };
    const first = document.querySelector('#bench input[type=radio], #bench [role=radio], #bench md-radio');
    // The smallest ancestor that also contains the option's visible label.
    let option = first;
    while (option.parentElement && !option.textContent.includes('Calisto')) option = option.parentElement;
    return serialize(option);
  });
  await tab.close();
}
await browser.close();
server.close();
console.log(JSON.stringify(result, null, 2));
