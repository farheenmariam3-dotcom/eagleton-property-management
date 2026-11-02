// EAGLETON Property Management - local server (no dependencies, just Node 20.12+)
try { process.loadEnvFile(); } catch (e) { /* no .env file - defaults are used */ }
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const gas = require('./backend/gas-runtime');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

function sendJSON(res, obj, code = 200) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // Single API endpoint - same contract the Apps Script version used: api(action, payload, token)
  if (req.method === 'POST' && url.pathname === '/api') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 2e6) req.destroy(); });
    req.on('end', () => {
      try {
        const { a, p, t } = JSON.parse(body || '{}');
        sendJSON(res, gas.call(a, p, t));
      } catch (e) {
        console.error(e);
        sendJSON(res, { ok: false, error: 'Server error. Please try again.' });
      }
    });
    return;
  }

  // One-time upload of your old data to a live server. Disabled unless the ADMIN_KEY setting exists.
  if (req.method === 'POST' && url.pathname === '/admin/import') {
    const key = process.env.ADMIN_KEY || '';
    const given = String(req.headers['x-admin-key'] || '');
    const ok = key.length >= 12 && given.length === key.length && crypto.timingSafeEqual(Buffer.from(key), Buffer.from(given));
    if (!ok) return sendJSON(res, { ok: false, error: 'Not allowed.' }, 403);
    const chunks = []; let size = 0;
    req.on('data', c => { size += c.length; if (size > 60e6) req.destroy(); else chunks.push(c); });
    req.on('end', () => {
      try {
        const summary = gas.importData(JSON.parse(Buffer.concat(chunks).toString('utf8')), url.searchParams.get('force') === '1');
        sendJSON(res, { ok: true, imported: summary });
        setTimeout(() => process.exit(0), 400); // the host restarts the app, which then loads the imported data
      } catch (e) { sendJSON(res, { ok: false, error: e.message }, 400); }
    });
    return;
  }

  if (url.pathname === '/health') return sendJSON(res, { ok: true });

  // Static files from /public
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log('\n  EAGLETON is running  →  http://localhost:' + PORT + '\n'));
const stop = () => { gas.flush(); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 500); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
