// Usage:  npm run import              (reads data/eagleton-export.json)
//         node scripts/import-google-export.js path/to/eagleton-export.json
// Copies every sheet (customers, plots, payments, accounts ...) from the Google export into data/db.json.
const fs = require('fs');
const path = require('path');

const src = path.resolve(process.argv[2] || path.join(__dirname, '..', 'data', 'eagleton-export.json'));
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'db.json');

if (!fs.existsSync(src)) { console.error('Cannot find ' + src + '\nPut the exported file there first (see GUIDE.md, step 6).'); process.exit(1); }
const exp = JSON.parse(fs.readFileSync(src, 'utf8'));
if (!exp.sheets || typeof exp.sheets !== 'object') { console.error('This file does not look like an Eagleton export.'); process.exit(1); }

fs.mkdirSync(dataDir, { recursive: true });
if (fs.existsSync(dbFile)) {
  const bak = dbFile + '.backup-' + Date.now();
  fs.copyFileSync(dbFile, bak);
  console.log('Existing database backed up to ' + bak);
}

const props = Object.assign({}, exp.props || {});
// These markers tell the app that the one-time data repairs already ran on this data. Without them the
// app would run them a second time, so make sure they exist.
if (!props.FIXV) props.FIXV = 'r25';
if (!props.FIXP) props.FIXP = 'r32';
delete props.SSID;

fs.writeFileSync(dbFile, JSON.stringify({ sheets: exp.sheets, props, cache: {} }));

console.log('\nImported:');
Object.keys(exp.sheets).forEach(n => console.log('  ' + n.padEnd(16) + Math.max(0, exp.sheets[n].length - 1) + ' records'));
console.log('\nDone. Start the app with  npm start  and sign in with your usual email and password.');
