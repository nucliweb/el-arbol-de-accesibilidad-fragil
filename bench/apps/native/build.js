// Generates static HTML pages (no JavaScript) for every N in the scenario,
// in two variants: the browser's own radio with accent-color, and a custom
// styled radio built on the native input with appearance: none.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { GROUP_LABEL, N_VALUES, TITLE, optionsFor } from '../../shared/scenario.js';

const VARIANTS = {
  native: 'Radio bench: nativo (accent-color)',
  'native-styled': 'Radio bench: nativo con estilos',
};

const escapeHtml = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const page = (title, stylesheet, n) => {
  const radios = optionsFor(n)
    .map(
      (option, index) => `        <div class="radio">
          <input type="radio" name="ringtone" id="${option.id}" value="${option.value}"${index === 0 ? ' checked' : ''}>
          <label for="${option.id}">${escapeHtml(option.label)}</label>
        </div>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="${stylesheet}">
  </head>
  <body>
    <main>
      <h1>${escapeHtml(TITLE)}</h1>
      <div id="bench">
        <fieldset>
          <legend>${escapeHtml(GROUP_LABEL)}</legend>
${radios}
        </fieldset>
      </div>
    </main>
  </body>
</html>
`;
};

rmSync('dist', { recursive: true, force: true });
for (const [variant, title] of Object.entries(VARIANTS)) {
  mkdirSync(`dist/${variant}`, { recursive: true });
  cpSync(`${variant}.css`, `dist/${variant}/${variant}.css`);
  for (const n of N_VALUES) {
    writeFileSync(`dist/${variant}/n-${n}.html`, page(title, `${variant}.css`, n));
  }
}
console.log(`Built ${Object.keys(VARIANTS).length} variants x ${N_VALUES.length} sizes in dist/`);
