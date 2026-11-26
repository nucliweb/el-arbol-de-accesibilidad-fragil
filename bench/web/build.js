// Builds the browser version: the runner page plus the already built apps it
// measures, as one static folder (web/dist) that any static host can serve.
// Run npm run setup first, so every app has its build.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'web', 'dist');
const APPS = {
  native: 'apps/native/dist/native',
  'shadcn-radix': 'apps/shadcn-radix/dist',
  mui: 'apps/mui/dist',
  'travel-native': 'apps/travel-native/dist',
  'travel-legacy': 'apps/travel-legacy/dist',
};

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(ROOT, 'web', 'src'), DIST, { recursive: true });
for (const [name, dir] of Object.entries(APPS)) {
  const source = join(ROOT, dir);
  if (!existsSync(source)) throw new Error(`Missing build of ${name} (${dir}); run npm run setup first`);
  cpSync(source, join(DIST, 'apps', name), { recursive: true });
}
console.log(`Built ${DIST}`);
