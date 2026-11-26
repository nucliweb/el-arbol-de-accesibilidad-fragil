// Installs and builds every app of the benchmark, and checks that Node and
// Google Chrome are ready. Usage (from bench/): npm run setup
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { run } from './lib/run.js';

const ROOT = resolve(import.meta.dirname, '..');
const MIN_NODE = 26;

const major = Number(process.versions.node.split('.')[0]);
if (major < MIN_NODE) {
  console.error(`Node ${MIN_NODE} or newer is needed; this is ${process.version}.`);
  console.error('Install it from https://nodejs.org/, or with nvm or fnm run "nvm use" / "fnm use" (the repository\'s .nvmrc sets the version).');
  process.exit(1);
}

const apps = readdirSync(join(ROOT, 'apps'), { withFileTypes: true }).filter((d) => d.isDirectory());
for (const [index, app] of apps.entries()) {
  const cwd = join(ROOT, 'apps', app.name);
  console.log(`\n[${index + 1}/${apps.length}] ${app.name}`);
  if (existsSync(join(cwd, 'package-lock.json'))) await run('npm', ['ci', '--no-audit', '--no-fund'], { cwd, quiet: true });
  await run('npm', ['run', 'build'], { cwd, quiet: true });
  console.log('  built');
}

try {
  const browser = await chromium.launch({ channel: 'chrome' });
  console.log(`\nGoogle Chrome ${browser.version()} is ready.`);
  await browser.close();
} catch {
  console.error('\nGoogle Chrome (stable) was not found. Install it from https://www.google.com/chrome/ or run: npx playwright install chrome');
  process.exit(1);
}
console.log('Setup complete. Next: npm run participate');
