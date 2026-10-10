import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end('Bad request'); return; }
  const requested = pathname === '/' ? '/index.html' : pathname;
  const file = resolve(root, `.${requested}`);
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
  try { const body = await readFile(file); res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream', 'x-content-type-options': 'nosniff' }).end(body); }
  catch { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found'); }
});
server.listen(4183, '127.0.0.1', () => console.log('LocaleLens at http://127.0.0.1:4183'));
