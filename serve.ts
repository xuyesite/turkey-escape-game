// Gobble Dash — a tiny static file server for local playtesting.
// Serves game/ at http://localhost:8080. Standard library only.
import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
const types: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = createServer(async (req, res) => {
  try {
    const path = req.url === '/' ? '/index.html' : (req.url || '/').split('?')[0];
    const file = join(root, decodeURIComponent(path));
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    await stat(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

server.listen(8080, () => {
  console.log('Gobble Dash at http://localhost:8080');
});
