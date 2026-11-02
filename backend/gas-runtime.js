/**
 * Google Apps Script emulation layer.
 * Runs backend/Code.gs unchanged inside a Node "vm" and replaces the Google services it
 * uses (Spreadsheet, Cache, Properties, Lock, Mail, Utilities, Session) with local
 * equivalents. The "spreadsheet" is stored as JSON in data/db.json.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------- persistent store ----------
let store = { sheets: {}, props: {}, cache: {} };
try { store = Object.assign(store, JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); } catch (e) { /* first run */ }

let timer = null;
function saveNow() {
  clearTimeout(timer); timer = null;
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store));
  fs.renameSync(tmp, DB_FILE);
}
function dirty() { if (!timer) timer = setTimeout(saveNow, 250); }

// ---------- sheets ----------
function range(sh, r, c, nr, nc) {
  const self = {
    getValues() {
      const out = [];
      for (let i = 0; i < nr; i++) {
        const row = [];
        for (let j = 0; j < nc; j++) { const v = (sh.d[r - 1 + i] || [])[c - 1 + j]; row.push(v === undefined || v === null ? '' : v); }
        out.push(row);
      }
      return out;
    },
    setValues(v) { v.forEach((row, i) => row.forEach((x, j) => { (sh.d[r - 1 + i] = sh.d[r - 1 + i] || [])[c - 1 + j] = x; })); dirty(); return self; },
    setValue(x) { (sh.d[r - 1] = sh.d[r - 1] || [])[c - 1] = x; dirty(); return self; },
    setNumberFormat() { return self; }, setFontWeight() { return self; },
    setBackground() { return self; }, setFontColor() { return self; }
  };
  return self;
}
function sheet(name) {
  const sh = { name, d: store.sheets[name] || (store.sheets[name] = []) };
  sh.getLastRow = () => sh.d.length;
  sh.getLastColumn = () => Math.max(0, ...sh.d.map(r => (r || []).length));
  sh.getRange = (r, c, nr = 1, nc = 1) => range(sh, r, c, nr, nc);
  sh.getDataRange = () => range(sh, 1, 1, sh.getLastRow(), sh.getLastColumn());
  sh.deleteRow = n => { sh.d.splice(n - 1, 1); dirty(); };
  sh.setFrozenRows = () => {}; sh.getName = () => name;
  return sh;
}
const open = {};
const ss = {
  getSheetByName: n => store.sheets[n] ? (open[n] = open[n] || sheet(n)) : null,
  insertSheet: n => { store.sheets[n] = []; dirty(); return (open[n] = sheet(n)); },
  deleteSheet: sh => { delete store.sheets[sh.name]; delete open[sh.name]; dirty(); },
  getSheets: () => Object.keys(store.sheets).map(n => ss.getSheetByName(n)),
  getId: () => 'LOCAL'
};

// ---------- cache (sessions, rate limits) with expiry ----------
const cache = {
  get(k) { const e = store.cache[k]; if (!e) return null; if (e.x && e.x < Date.now()) { delete store.cache[k]; return null; } return e.v; },
  put(k, v, s) { store.cache[k] = { v: String(v), x: Date.now() + (s || 600) * 1000 }; dirty(); },
  putAll(o, s) { Object.keys(o).forEach(k => cache.put(k, o[k], s)); },
  remove(k) { delete store.cache[k]; dirty(); },
  getAll(ks) { const o = {}; ks.forEach(k => { const v = cache.get(k); if (v !== null) o[k] = v; }); return o; }
};

// ---------- mail (password-reset codes) ----------
let transporter = null;
if (process.env.SMTP_HOST) {
  try {
    transporter = require('nodemailer').createTransport({
      host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
  } catch (e) { console.warn('SMTP_HOST is set but nodemailer is not installed (npm i nodemailer). Emails will be printed here instead.'); }
}
const MailApp = {
  getRemainingDailyQuota: () => 100,
  sendEmail(to, subject, body) {
    if (transporter) return transporter.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text: body }).catch(e => console.error('Mail error', e.message));
    console.log('\n--- EMAIL (not sent; no SMTP configured) ---\nTo: ' + to + '\nSubject: ' + subject + '\n' + body + '\n--------------------------------------------\n');
  }
};

// ---------- misc Google services ----------
const TZ = process.env.TZ_NAME || 'Asia/Calcutta';
function fmtDate(d, tz, f) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz || TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(d));
  const g = t => (parts.find(p => p.type === t) || {}).value;
  return f.replace('yyyy', g('year')).replace('MM', g('month')).replace('dd', g('day')).replace('HH', g('hour')).replace('mm', g('minute')).replace('ss', g('second'));
}
const ctx = {
  console,
  Logger: { log: e => console.log('LOG:', e && e.stack || e) },
  SpreadsheetApp: { getActiveSpreadsheet: () => ss, openById: () => ss, create: () => ss },
  CacheService: { getScriptCache: () => cache },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {}, tryLock: () => true }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => store.props[k] ?? null, setProperty: (k, v) => { store.props[k] = v; dirty(); }, getProperties: () => store.props }) },
  Session: { getScriptTimeZone: () => TZ, getActiveUser: () => ({ getEmail: () => '' }), getEffectiveUser: () => ({ getEmail: () => '' }) },
  Utilities: {
    Charset: { UTF_8: 'utf8' }, DigestAlgorithm: { SHA_256: 'sha256', MD5: 'md5' },
    computeDigest: (a, s) => Array.from(crypto.createHash(a).update(s).digest()).map(b => b > 127 ? b - 256 : b),
    base64Encode: b => Buffer.from(b.map(x => x & 255)).toString('base64'),
    base64EncodeWebSafe: b => Buffer.from(b.map(x => x & 255)).toString('base64url'),
    getUuid: () => crypto.randomUUID(), formatDate: fmtDate
  },
  MailApp, HtmlService: { createHtmlOutputFromFile: () => ({}) }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
// Office access code for "Create account": from the SIGNUP_CODE setting, otherwise a random code that is
// generated once, saved in the database and printed in the terminal.
let signup = process.env.SIGNUP_CODE;
if (!signup) {
  signup = store.props.LOCAL_SIGNUP_CODE || ('EG-' + crypto.randomBytes(4).toString('hex').toUpperCase());
  if (!store.props.LOCAL_SIGNUP_CODE) { store.props.LOCAL_SIGNUP_CODE = signup; saveNow(); }
  console.log('  Office access code for new accounts: ' + signup + '  (set SIGNUP_CODE in .env to choose your own)');
}
vm.runInContext('SIGNUP_CODE=' + JSON.stringify(signup), ctx);

// Replace the whole database with an export from the Google version (used by the one-time upload to a live server)
function importData(exp, force) {
  const has = ((store.sheets.Customers || []).length > 1) || ((store.sheets.Plots || []).length > 1);
  if (has && !force) throw new Error('The server already has data. Nothing was changed.');
  if (!exp || typeof exp.sheets !== 'object') throw new Error('This is not an Eagleton export file.');
  const props = Object.assign({}, exp.props || {});
  if (!props.FIXV) props.FIXV = 'r25';
  if (!props.FIXP) props.FIXP = 'r32';
  delete props.SSID;
  if (store.props.LOCAL_SIGNUP_CODE) props.LOCAL_SIGNUP_CODE = store.props.LOCAL_SIGNUP_CODE;
  store = { sheets: exp.sheets, props, cache: {} };
  saveNow();
  return Object.keys(exp.sheets).map(n => n + ': ' + Math.max(0, exp.sheets[n].length - 1));
}

module.exports = { call: (a, p, t) => ctx.api(a, p, t), flush: saveNow, importData };
