// Usage:  ADMIN_KEY=your-key node scripts/upload-to-server.js https://your-site.onrender.com [data/eagleton-export.json]
// Sends your exported Google data to the live server ONE time. Afterwards delete the ADMIN_KEY setting on the host.
const fs = require('fs');
const path = require('path');
const site = (process.argv[2] || '').replace(/\/+$/, '');
const file = path.resolve(process.argv[3] || path.join(__dirname, '..', 'data', 'eagleton-export.json'));
const key = process.env.ADMIN_KEY;
if (!site || !key) { console.error('Usage: ADMIN_KEY=your-key node scripts/upload-to-server.js https://your-site.onrender.com'); process.exit(1); }
if (!fs.existsSync(file)) { console.error('Cannot find ' + file); process.exit(1); }
fetch(site + '/admin/import', { method: 'POST', headers: { 'x-admin-key': key, 'content-type': 'application/json' }, body: fs.readFileSync(file) })
  .then(r => r.json().then(j => ({ r, j })))
  .then(({ r, j }) => {
    if (!j.ok) { console.error('Server said: ' + (j.error || r.status)); process.exit(1); }
    console.log('Uploaded:\n  ' + j.imported.join('\n  ') + '\n\nThe server is restarting - wait a minute, then open your site and sign in.');
  })
  .catch(e => { console.error('Could not reach the server: ' + e.message); process.exit(1); });
