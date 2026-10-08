import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json' };
const port = Number(process.env.PORT || 4173);
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
    const file = resolve(root, '.' + (path === '/' ? '/web/index.html' : path));
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end('Forbidden'); return;
    }
    if (!(await stat(file)).isFile()) { res.writeHead(404).end('Not found'); return; }
    const contents = await readFile(file);
    res.writeHead(200, { 'Content-Type': (types[extname(file)] || 'application/octet-stream') + '; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
    res.end(contents);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`排序算法实验室：http://127.0.0.1:${port}/`);
});
