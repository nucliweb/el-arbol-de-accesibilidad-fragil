// Serves each target's build folder at /<target>/, so pages load over HTTP.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
};

export async function startStaticServer(root, targets) {
  const server = createServer((req, res) => {
    const [, target, ...rest] = decodeURIComponent(new URL(req.url, 'http://x').pathname).split('/');
    const base = targets[target] && join(root, targets[target].dir);
    const file = base && normalize(join(base, rest.join('/') || 'index.html'));
    if (!file || !file.startsWith(base) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(file).pipe(res);
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}
