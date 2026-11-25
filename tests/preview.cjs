const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg' };
function createServer() {
  return http.createServer((req, res) => {
    let name;
    try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
    if (name === '/') name = '/index.html';
    if (!/^\/(index\.html|sw\.js|manifest\.webmanifest|(?:css|js|fonts|icons|sounds)\/[^.][\w./-]*)$/.test(name) || name.includes('..')) { res.writeHead(404).end(); return; }
    fs.readFile(path.join(root, name), (error, body) => {
      if (error) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': types[path.extname(name)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(body);
    });
  });
}
if (require.main === module) createServer().listen(8900, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:8900 (isolated guest mode)'));
module.exports = { createServer };
