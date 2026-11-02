/* EAGLETON Property Management - Backend (Google Apps Script) */
/* ============================================================
   OFFICE ACCESS CODE
   New staff must type this code to create their own account.
   Change it any time, then: Deploy > Manage deployments > Edit > New version > Deploy
   ============================================================ */
var SIGNUP_CODE = ''; // set by the server from the SIGNUP_CODE environment variable (never hard-code it in a public repo)
/* ============================================================ */

var S = {
  Customers: { n: 'Site visit', p: 'CUS', id: 'Customer ID', sk: 'Status', req: ['Name', 'Phone'], def: { Status: 'New' },
    f: ['Customer ID', 'Name', 'Phone', 'Alternate Phone', 'Reference', 'Visit Date', 'Interested Plot', 'Area', 'Price', 'Status', 'Next Follow-up', 'Remarks', 'Drive Link', 'Company Name', 'Sale Type', 'Service Charges Rate', 'Membership Amount', 'Khata Amount', 'Misc Amount', 'Misc Paid Amount', 'Resale Details', 'Designation', 'Guidance Amount', 'TDS Type', 'Transfer Amount', 'TDS Amount', 'Email', 'Seller', 'Built Up Area', 'Plot Rate Amount', 'BUA Rate Amount', 'Plot Value Amount', 'BUA Value Amount', 'BUA Amount', 'Seller 2', 'Booked Date', 'GST Rate', 'Deleted'] },
  Plots: { n: 'Plot', p: 'PLT', id: 'Plot ID', sk: 'Status', req: ['Plot Number'], def: { Status: 'Available', 'Service Charges': '150' },
    f: ['Plot ID', 'Plot Number', 'Area', 'Base Price', 'Sale Price', 'Service Charges', 'GST', 'Total Price', 'Status', 'Customer ID', 'Customer Name', 'Remarks', 'Seller', 'Seller 2', 'GST Rate', 'Listed Date', 'Seller Phone', 'Address', 'City', 'State', 'Country', 'Details', 'Deleted'] },
  FollowUps: { n: 'Follow-up', p: 'FOL', id: 'Follow-up ID', sk: 'Status', req: ['Customer ID', 'Date'], def: { Status: 'Pending' },
    f: ['Follow-up ID', 'Customer ID', 'Customer', 'Date', 'Previous Discussion', 'Remarks', 'Status', 'Deleted'] },
  Tasks: { n: 'Task', p: 'TSK', id: 'Task ID', sk: 'Status', req: ['Customer ID', 'Task Type'], def: { Status: 'Pending' },
    f: ['Task ID', 'Customer ID', 'Customer', 'Plot', 'Task Type', 'Assigned Person', 'Due Date', 'Status', 'Remarks', 'Deleted'] },
  Loans: { n: 'Loan', p: 'LOAN', id: 'Loan ID', sk: 'Loan Status', req: ['Customer ID'], def: { 'Loan Status': 'Not Started' },
    f: ['Loan ID', 'Customer ID', 'Customer', 'Plot', 'Bank', 'Loan Amount', 'Application Date', 'Approval Date', 'Loan Status', 'Remarks', 'Deleted'] },
  Registrations: { n: 'Registration', p: 'REG', id: 'Registration ID', sk: 'Registration Status', req: ['Customer ID'], def: { 'Registration Status': 'Not Started' },
    f: ['Registration ID', 'Customer ID', 'Customer', 'Plot', 'Registration Status', 'Registration Date', 'Documents', 'Remarks', 'Deleted'] },
  Payments: { n: 'Payment', p: 'PAY', id: 'Payment ID', sk: 'Status', req: ['Customer ID', 'Amount'], def: { Status: 'Pending' },
    f: ['Payment ID', 'Customer ID', 'Customer', 'Plot', 'Amount', 'Payment Date', 'Payment Type', 'Status', 'Remarks', 'Booked Date', 'Cheque No', 'Bank', 'Deleted'] },
  ActivityLog: { f: ['Time', 'Record ID', 'Customer ID', 'Action', 'Details', 'User'] },
  Accounts: { f: ['Email', 'Name', 'Password Hash', 'Active', 'Created', 'Role'] },
  Settings: { f: ['Key', 'Value'] }
};

function U(m) { var e = new Error(m); e.u = 1; return e; }

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('EAGLETON Property Management')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

var SS_ = null, SH_ = {}, MEM_ = {}, TZ_ = null, SCHEMA_V = 'r35', HM_ = {};
function ss_() {
  if (SS_) return SS_;
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('SSID');
  if (id) { SS_ = SpreadsheetApp.openById(id); return SS_; }
  var s = null;
  try { s = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  if (!s) s = SpreadsheetApp.create('EAGLETON Database');
  p.setProperty('SSID', s.getId());
  SS_ = s;
  return s;
}

function sh_(n) {
  if (SH_[n]) return SH_[n];
  var s = ss_(), sh = s.getSheetByName(n), f = S[n].f;
  if (!sh) {
    sh = s.insertSheet(n);
    sh.getRange(1, 1, 1, f.length).setNumberFormat('@').setValues([f]).setFontWeight('bold').setBackground('#1f4e8c').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  SH_[n] = sh;
  return sh;
}

function hmap_(n) {
  if (HM_[n]) return HM_[n];
  var sh = sh_(n), w = Math.max(1, sh.getLastColumn()), hd = sh.getRange(1, 1, 1, w).getValues()[0], m = {};
  hd.forEach(function (k, j) { k = String(k || ''); if (k && !(k in m)) m[k] = j + 1; });
  HM_[n] = m;
  return m;
}
function hcol_(n, k) {
  var m = hmap_(n);
  if (!m[k]) {
    var sh = sh_(n), c = Math.max(sh.getLastColumn(), 0) + 1;
    sh.getRange(1, c).setNumberFormat('@').setValue(k).setFontWeight('bold').setBackground('#1f4e8c').setFontColor('#ffffff');
    m[k] = c;
  }
  return m[k];
}
function migrate_() {
  var ps = sh_('Payments'), ph = ps.getRange(1, 1, 1, Math.max(1, ps.getLastColumn())).getValues()[0], pi = ph.indexOf('Due Date');
  if (pi > -1) { ps.getRange(1, pi + 1).setValue('Booked Date'); HM_ = {}; }
  Object.keys(S).forEach(function (n) { S[n].f.forEach(function (k) { hcol_(n, k); }); });
}
function repairPlots_() {
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty('FIXP') === 'r32') return;
  all_('Plots').forEach(function (x) {
    var sq = sqft_(x.Area), sr = svr_(x['Service Charges']);
    setf_('Plots', x._row, 'Service Charges', String(sr));
    var gr = x['GST Rate'] === '' ? 18 : num_(x['GST Rate']);
    setf_('Plots', x._row, 'GST Rate', String(gr));
    setf_('Plots', x._row, 'GST', String(Math.round(sq * sr * gr) / 100));
    setf_('Plots', x._row, 'Total Price', String(Math.round(sq * num_(x['Sale Price']) * 100) / 100));
  });
  p.setProperty('FIXP', 'r32');
}
function repairCust_() {
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty('FIXV') === 'r25') return;
  var sh = sh_('Customers'), w = sh.getLastColumn(), lr = sh.getLastRow();
  if (w < 1) return;
  var hd = sh.getRange(1, 1, 1, w).getValues()[0];
  var tail = ['Built Up Area', 'Plot Rate Amount', 'BUA Rate Amount', 'Plot Value Amount', 'BUA Value Amount', 'BUA Amount', 'Seller 2', 'Guidance Plot Amount', 'Guidance BUA Amount'];
  var lastBua = -1;
  hd.forEach(function (k, j) { if (k === 'BUA Amount') lastBua = j; });
  var buaVals = (lastBua > -1 && lr > 1) ? sh.getRange(2, lastBua + 1, lr - 1, 1).getValues() : null;
  hd.forEach(function (k, j) { if (tail.indexOf(String(k)) > -1) sh.getRange(1, j + 1).setNumberFormat('@').setValue('old ' + k); });
  HM_ = {};
  tail.slice(0, 7).forEach(function (k) { hcol_('Customers', k); });
  if (buaVals) {
    var c = hmap_('Customers')['BUA Amount'];
    sh.getRange(2, c, buaVals.length, 1).setNumberFormat('@').setValues(buaVals);
  }
  HM_ = {}; MEM_ = {}; CacheService.getScriptCache().remove('DN');
  p.setProperty('FIXV', 'r25');
}
function migratePayTypes_() {
  var M = { 'Towards cost of site': 'TWDS COST OF SITE', 'Token Advance': 'TWDS COST OF SITE', 'Installment': 'TWDS COST OF SITE', 'Registration Charges': 'TWDS COST OF SITE', 'Final Payment': 'TWDS COST OF SITE',
    'Service Charges': 'TWDS SERVICE CHGS', 'Membership': 'TWDS MEMBERSHIP DEPOSIT', 'Khata Charges': 'TWDS KATHA CHGS', 'Miscellaneous': 'TWDS MISC CHGS', 'Transfer Charges': 'TWDS TRANSFER CHGS' };
  all_('Payments').forEach(function (x) { if (M[x['Payment Type']]) setf_('Payments', x._row, 'Payment Type', M[x['Payment Type']]); });
}

/* Everyone who already had an account before roles existed becomes an admin, so nobody is locked out. */
function migrateRoles_() {
  all_('Accounts').forEach(function (u) { if (!u.Role) setf_('Accounts', u._row, 'Role', 'admin'); });
}
/* Give plots that were created before "Listed Date" existed a date, from the activity log or the buyer's booked date. */
function backfillPlots_() {
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty('FIXD') === 'r35') return;
  var made = {};
  all_('ActivityLog').forEach(function (l) {
    if (/^Plot created/.test(l.Action) && l['Record ID'] && /^\d{4}-\d{2}-\d{2}/.test(l.Time)) {
      var d = l.Time.slice(0, 10);
      if (!made[l['Record ID']] || d < made[l['Record ID']]) made[l['Record ID']] = d;
    }
  });
  all_('Plots').forEach(function (x) {
    if (x['Listed Date']) return;
    var d = made[x['Plot ID']] || '';
    if (!d && x['Customer ID']) { var c = cust_(x['Customer ID']); if (c) d = c['Booked Date'] || c['Visit Date'] || ''; }
    if (d) setf_('Plots', x._row, 'Listed Date', d);
  });
  p.setProperty('FIXD', 'r35');
}

function isRegSt_(s) { return s === 'Registered' || s === 'Completed'; }

function ensureInit_() {
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty('SV') === SCHEMA_V) return;
  initDb_();
  repairCust_();
  repairPlots_();
  migratePayTypes_();
  migrateRoles_();
  backfillPlots_();
  p.setProperty('SV', SCHEMA_V);
}

function initDb_() {
  Object.keys(S).forEach(sh_);
  migrate_();
  try {
    var d = ss_().getSheetByName('Sheet1');
    if (d && ss_().getSheets().length > 1) ss_().deleteSheet(d);
  } catch (e) {}
}

function all_(n) {
  if (MEM_[n]) return MEM_[n];
  var sh = sh_(n), v = sh.getDataRange().getValues(), h = v[0], tz = TZ_ || (TZ_ = Session.getScriptTimeZone());
  var res = v.slice(1).map(function (r, i) {
    var o = { _row: i + 2 };
    h.forEach(function (k, j) {
      var x = r[j];
      if (k in o) return;
      o[k] = x instanceof Date ? Utilities.formatDate(x, tz, 'yyyy-MM-dd') : (x == null ? '' : String(x));
    });
    return o;
  }).filter(function (o) { return o[h[0]] !== ''; });
  MEM_[n] = res;
  return res;
}

function one_(n, id) { return all_(n).filter(function (x) { return x[S[n].id] === id; })[0] || null; }
function cust_(id) { return one_('Customers', id); }

function nid_(n) {
  var d = S[n], m = all_(n).reduce(function (a, r) { return Math.max(a, parseInt(String(r[d.id]).split('-').pop(), 10) || 0); }, 0) + 1;
  return d.p + '-' + ('0000' + m).slice(-Math.max(4, String(m).length));
}

var CUR_ = null, ALLOWDUP_ = false;
var ROLES_ = ['admin', 'sales', 'legal'], PRE_ = ['New', 'Prospect', 'Follow-up'];
function log_(rid, cid, act, det) {
  var sh = sh_('ActivityLog'), r = sh.getLastRow() + 1;
  sh.getRange(r, 1, 1, 6).setNumberFormat('@').setValues([[Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'), rid, cid || '', act, det || '', CUR_ ? CUR_.Name : '']]);
  inval_('ActivityLog');
}

function inval_(n) {
  delete MEM_[n];
  if (n !== 'Accounts') CacheService.getScriptCache().remove('DN');
}

function dataCacheGet_() {
  var c = CacheService.getScriptCache(), n = Number(c.get('DN') || 0), ks = [], i, s = '';
  if (!n) return null;
  for (i = 0; i < n; i++) ks.push('D' + i);
  var m = c.getAll(ks);
  for (i = 0; i < n; i++) { if (m['D' + i] == null) return null; s += m['D' + i]; }
  try { return JSON.parse(s); } catch (e) { return null; }
}

function dataCachePut_(d) {
  var s = JSON.stringify(d), n = Math.ceil(s.length / 30000), o = {}, i;
  for (i = 0; i < n; i++) o['D' + i] = s.substr(i * 30000, 30000);
  o.DN = String(n);
  try { CacheService.getScriptCache().putAll(o, 600); } catch (e) {}
}

function setf_(n, row, k, v) {
  var c = hcol_(n, k);
  sh_(n).getRange(row, c).setNumberFormat('@').setValue(v);
  inval_(n);
}

function sqft_(a) {
  a = String(a || '').trim();
  var m = a.match(/^([\d,.]+)\s*[x×*]\s*([\d,.]+)$/i);
  if (m) return parseFloat(m[1].replace(/,/g, '')) * parseFloat(m[2].replace(/,/g, '')) || 0;
  m = a.match(/^([\d,.]+)\s*(sq\.?\s*ft\.?|sqft|sft)?$/i);
  return m ? parseFloat(m[1].replace(/,/g, '')) || 0 : 0;
}

function num_(v) { return Number(v) || 0; }
function svr_(v) { if (v === '' || v == null) return 150; v = Number(v); return (isFinite(v) && v >= 0) ? v : 150; }

function put_(n, r, quiet) {
  var d = S[n], list = all_(n), old = null, o, isNew = !r[d.id];
  if (!isNew) {
    old = list.filter(function (x) { return x[d.id] === r[d.id]; })[0];
    if (!old) throw U('That record no longer exists. Please refresh the page.');
  }
  o = {};
  d.f.forEach(function (k) {
    var v = (r[k] !== undefined) ? r[k] : (old ? old[k] : '');
    o[k] = typeof v === 'string' ? v.trim() : (v == null ? '' : String(v));
    if (/Price|Amount|Charges|GST/.test(k) && o[k]) o[k] = o[k].replace(/[,\s\u20b9]/g, '');
  });
  Object.keys(d.def || {}).forEach(function (k) { if (!o[k]) o[k] = d.def[k]; });
  d.req.forEach(function (k) { if (!o[k]) throw U(k + ' is required.'); });
  if (d.f.indexOf('Deleted') > -1 && o.Deleted && o[d.sk] !== 'Cancelled') o.Deleted = '';
  d.f.forEach(function (k) {
    var v = o[k];
    if (old && r[k] === undefined) return;
    if (/Phone/.test(k) && v && !/^[0-9+\-\s]{10,15}$/.test(v)) throw U(k + ' must be a valid phone number (10 to 15 digits).');
    if ((/Date$/.test(k) || k === 'Next Follow-up') && v && !(/^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v)))) throw U(k + ' must be a valid date.');
    if (/Price|Amount|Charges|GST/.test(k) && v && !(isFinite(v) && Number(v) >= 0)) throw U(k + ' must be a valid amount (0 or more).');
    if (k === 'Email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw U('Email must be a valid email address.');
    if (k === 'Resale Details' && v.length > 45000) throw U('The resale application has too much text to save.');
    if (k === 'Sale Type' && v && ['Resale', 'Company Sale'].indexOf(v) < 0) throw U('Sale type must be Resale or Company Sale.');
    if (k === 'Drive Link' && v && !/^https:\/\/([a-z0-9-]+\.)*(1drv\.ms|onedrive\.live\.com|onedrive\.com|sharepoint\.com|drive\.google\.com|docs\.google\.com)(\/|$)/i.test(v)) throw U('The documents link must be a OneDrive link (for example https://1drv.ms/... or a SharePoint/OneDrive link).');
  });
  var cid = '';
  if (n === 'Customers') {
    var dup = (isNew || (old && old.Phone !== o.Phone)) ? list.filter(function (x) { return x[d.id] !== o[d.id] && x.Phone === o.Phone; })[0] : null;
    if (dup && !ALLOWDUP_) { var de = U('This phone number is already saved for ' + dup.Name + ' (' + dup[d.id] + '). Do you want to add another person with the same number?'); de.dup = 1; throw de; }
    chkJson_(o['Resale Details']);
    cid = o[d.id];
  } else if (n === 'Plots') {
    var dp = list.filter(function (x) { return x[d.id] !== o[d.id] && x['Plot Number'].toLowerCase() === o['Plot Number'].toLowerCase(); })[0];
    if (dp) throw U('Plot ' + o['Plot Number'] + ' already exists (' + dp[d.id] + ').');
    var sq = sqft_(o.Area), sr = svr_(o['Service Charges']);
    o['Service Charges'] = String(sr);
    if (num_(o['GST Rate']) > 100) throw U('GST must be between 0 and 100 percent.');
    o.GST = String(Math.round(sq * sr * num_(o['GST Rate'])) / 100);
    o['Total Price'] = String(Math.round(sq * num_(o['Sale Price']) * 100) / 100);
    if (isNew && !o['Listed Date']) o['Listed Date'] = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    chkJson_(o.Details);
    if (o.Details && o.Details.length > 45000) throw U('The plot details have too much text to save.');
    if (o['Customer Name'] && !o['Customer ID'] && o.Status !== 'Cancelled') {
      var bn = o['Customer Name'].toLowerCase().replace(/\s+/g, ' ');
      var bm = all_('Customers').filter(function (x) { return x.Status !== 'Cancelled' && String(x.Name).toLowerCase().replace(/\s+/g, ' ') === bn; });
      if (bm.length > 1) throw U('More than one customer is named ' + o['Customer Name'] + '. Please use Assign to pick the right one.');
      if (bm.length === 1) {
        o['Customer ID'] = bm[0]['Customer ID']; o['Customer Name'] = bm[0].Name;
        if (o.Status === 'Available') o.Status = 'Sold';
      }
    }
    if (o.Status === 'Available' && (o['Customer ID'] || (old && old['Customer ID']))) { o['Customer ID'] = ''; o['Customer Name'] = ''; }
    cid = o['Customer ID'];
  } else {
    var c = cust_(o['Customer ID']);
    if (!c) throw U('Customer not found. Please select a valid customer.');
    o.Customer = c.Name;
    if (n !== 'FollowUps' && !o.Plot) o.Plot = c['Interested Plot'];
    cid = c[S.Customers.id];
  }
  if (isNew) o[d.id] = nid_(n);
  var row = isNew ? sh_(n).getLastRow() + 1 : old._row;
  var shw = sh_(n);
  d.f.forEach(function (k) { hcol_(n, k); });
  var ww = shw.getLastColumn(), cur = row <= shw.getLastRow() ? shw.getRange(row, 1, 1, ww).getValues()[0] : [], hm = hmap_(n);
  while (cur.length < ww) cur.push('');
  d.f.forEach(function (k) { cur[hm[k] - 1] = o[k]; });
  shw.getRange(row, 1, 1, ww).setNumberFormat('@').setValues([cur]);
  inval_(n);
  if (n === 'Plots' && o['Customer ID'] && o.Status !== 'Cancelled') {
    var pc_ = cust_(o['Customer ID']);
    if (pc_ && pc_['Interested Plot'] !== o['Plot Number']) put_('Customers', { 'Customer ID': pc_['Customer ID'], 'Interested Plot': o['Plot Number'] }, true);
    pc_ = cust_(o['Customer ID']);
    if (pc_) {
      if (o.Seller) setf_('Customers', pc_._row, 'Seller', o.Seller);
      if (o['Seller 2']) setf_('Customers', pc_._row, 'Seller 2', o['Seller 2']);
    }
  }
  if (quiet) { /* no log */ } else if (isNew) log_(o[d.id], cid, d.n + ' created', o.Name || o['Plot Number'] || o['Task Type'] || o.Amount || o.Date || o.Bank || '');
  else {
    var ch = d.f.filter(function (k) { return k !== d.id && String(old[k] || '') !== String(o[k] || ''); })
      .map(function (k) { return k + ': ' + (old[k] || '-') + ' -> ' + (o[k] || '-'); }).join('; ');
    if (ch) log_(o[d.id], cid, d.n + (old[d.sk] !== o[d.sk] ? ' status changed' : ' updated'), ch.slice(0, 450));
  }
  if (n === 'Customers' && old && old.Name !== o.Name) {
    ['FollowUps', 'Tasks', 'Loans', 'Registrations', 'Payments'].forEach(function (k) {
      all_(k).filter(function (x) { return x['Customer ID'] === o[d.id]; }).forEach(function (x) { setf_(k, x._row, 'Customer', o.Name); });
    });
    all_('Plots').filter(function (x) { return x['Customer ID'] === o[d.id]; }).forEach(function (x) { setf_('Plots', x._row, 'Customer Name', o.Name); });
  }
  if (n === 'Customers' && old && old.Status !== 'Cancelled' && o.Status === 'Cancelled') {
    all_('Plots').filter(function (x) { return x['Customer ID'] === o[d.id] && ['Reserved', 'Booked'].indexOf(x.Status) > -1; })
      .forEach(function (x) { put_('Plots', { 'Plot ID': x['Plot ID'], Status: 'Available' }); });
  }
  if (n === 'Customers' && old && o.Status === 'Registered' && old.Status !== 'Registered') {
    var rgs = all_('Registrations').filter(function (x) { return x['Customer ID'] === o[d.id]; });
    if (!rgs.length) put_('Registrations', { 'Customer ID': o[d.id], Plot: o['Interested Plot'], 'Registration Status': 'Completed' }, true);
    else rgs.forEach(function (x) { if (!isRegSt_(x['Registration Status'])) put_('Registrations', { 'Registration ID': x['Registration ID'], 'Registration Status': 'Completed' }, true); });
  }
  if (n === 'Registrations' && cid) {
    var cu = cust_(cid);
    if (cu && cu.Status !== 'Cancelled') {
      if (isRegSt_(o['Registration Status']) && cu.Status !== 'Registered') put_('Customers', { 'Customer ID': cid, Status: 'Registered' });
      else if (!isRegSt_(o['Registration Status']) && cu.Status === 'Registered') put_('Customers', { 'Customer ID': cid, Status: 'Registration' });
    }
  }
  if (n === 'Customers' && old && String(old['Interested Plot'] || '') !== String(o['Interested Plot'] || '')) {
    ['Loans', 'Registrations', 'Payments', 'Tasks'].forEach(function (k) {
      all_(k).filter(function (x) { return x['Customer ID'] === o[d.id]; }).forEach(function (x) { setf_(k, x._row, 'Plot', o['Interested Plot']); });
    });
    all_('Plots').filter(function (x) { return x['Customer ID'] === o[d.id] && ['Reserved', 'Booked', 'Sold'].indexOf(x.Status) > -1 && x['Plot Number'] !== o['Interested Plot']; })
      .forEach(function (x) { put_('Plots', { 'Plot ID': x['Plot ID'], Status: 'Available' }); });
    if (o['Interested Plot'] && ['New', 'Prospect', 'Follow-up', 'Cancelled'].indexOf(o.Status) < 0) {
      var np = all_('Plots').filter(function (x) { return String(x['Plot Number']).toLowerCase() === String(o['Interested Plot']).toLowerCase() && x.Status === 'Available'; })[0];
      if (np) {
        put_('Plots', { 'Plot ID': np['Plot ID'], Status: 'Sold', 'Customer ID': o[d.id], 'Customer Name': o.Name });
        if (np.Seller) setf_('Customers', old._row, 'Seller', np.Seller);
        if (np['Seller 2']) setf_('Customers', old._row, 'Seller 2', np['Seller 2']);
      }
    }
  }
  if (n === 'Loans' && cid && o['Loan Status'] === 'Completed') {
    var lc = cust_(cid);
    if (lc && ['Registration', 'Registered', 'Completed', 'Cancelled'].indexOf(lc.Status) < 0) put_('Customers', { 'Customer ID': cid, Status: 'Registration' });
  }
  if (n === 'FollowUps') syncNext_(o['Customer ID']);
  return o;
}

/* Links saved inside the application / plot details must be real web links (never javascript: and similar). */
function chkJson_(s) {
  if (!s) return;
  var j;
  try { j = JSON.parse(s); } catch (e) { throw U('The saved details are not valid.'); }
  Object.keys(j).forEach(function (k) {
    if (/^(khatal|convl|regdocl\d*|[bs][12][dp]l)$/.test(k) && j[k] && !/^https?:\/\/\S+$/i.test(String(j[k]))) throw U('A document link is not valid. Links must start with http:// or https://');
  });
}

function syncNext_(cid) {
  var c = cust_(cid);
  if (!c) return;
  var ds = all_('FollowUps').filter(function (f) { return f['Customer ID'] === cid && f.Status !== 'Completed' && f.Status !== 'Cancelled' && f.Date; }).map(function (f) { return f.Date; }).sort();
  setf_('Customers', c._row, 'Next Follow-up', ds[0] || '');
}

function complete_(p) {
  var f = one_('FollowUps', p.id);
  if (!f) throw U('Follow-up not found.');
  if (!p.result || !String(p.result).trim()) throw U('Please enter the result of this follow-up.');
  put_('FollowUps', { 'Follow-up ID': p.id, Status: 'Completed', Remarks: String(p.result) });
  log_(p.id, f['Customer ID'], 'Follow-up completed', String(p.result));
  if (p.next) put_('FollowUps', { 'Customer ID': f['Customer ID'], Date: p.next, 'Previous Discussion': String(p.result), Status: 'Pending' });
  return true;
}

function assign_(p) {
  var pl = one_('Plots', p.plot), c = cust_(p.cust);
  if (!pl) throw U('Please select a plot.');
  if (!c) throw U('Please select a customer.');
  if (['Reserved', 'Booked', 'Sold'].indexOf(p.mode) < 0) throw U('Please choose Reserved, Booked or Sold.');
  if (['Sold', 'Booked', 'Cancelled'].indexOf(pl.Status) > -1 || (pl.Status === 'Reserved' && pl['Customer ID'] && pl['Customer ID'] !== c['Customer ID']))
    throw U('Plot ' + pl['Plot Number'] + ' is ' + pl.Status.toLowerCase() + ' and cannot be assigned.');
  put_('Plots', { 'Plot ID': pl['Plot ID'], Status: p.mode, 'Customer ID': c['Customer ID'], 'Customer Name': c.Name });
  var cu = { 'Customer ID': c['Customer ID'], 'Interested Plot': pl['Plot Number'], Area: pl.Area, Price: pl['Sale Price'] || pl['Base Price'] || c.Price };
  if (pl.Seller) cu.Seller = pl.Seller;
  if (pl['Seller 2']) cu['Seller 2'] = pl['Seller 2'];
  if (p.mode === 'Sold' && ['New', 'Prospect', 'Follow-up'].indexOf(c.Status) > -1) cu.Status = 'Finalised';
  put_('Customers', cu);
  log_(pl['Plot ID'], c['Customer ID'], 'Plot assigned', pl['Plot Number'] + ' to ' + c.Name + ' (' + p.mode + ')');
  return true;
}

/* ---------- Towards cost of site (monthly cheques) ---------- */
function plan_(p) {
  var c = cust_(p.cust), total = Number(p.total), n = parseInt(p.count, 10);
  if (!c) throw U('Please select a customer.');
  if (!(total > 0)) throw U('Enter the total amount to collect.');
  if (!(n >= 1 && n <= 60)) throw U('The number of monthly payments must be between 1 and 60.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.first || '') || isNaN(new Date(p.first))) throw U('Enter a valid first due date.');
  var base = Math.floor(total / n * 100) / 100, y = +p.first.slice(0, 4), m = +p.first.slice(5, 7) - 1, d = +p.first.slice(8, 10), sum = 0;
  for (var i = 0; i < n; i++) {
    var amt = i === n - 1 ? Math.round((total - sum) * 100) / 100 : base;
    sum += amt;
    var dt = new Date(y, m + i, 1), dim = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
    var ds = dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + Math.min(d, dim)).slice(-2);
    put_('Payments', { 'Customer ID': c['Customer ID'], Amount: String(amt), 'Booked Date': ds, 'Payment Type': p.type || 'TWDS COST OF SITE', Status: 'Pending',
      Remarks: 'Towards cost of site ' + (i + 1) + ' of ' + n + (p.remarks ? ' - ' + p.remarks : '') }, true);
  }
  log_('', c['Customer ID'], 'Towards cost of site plan created', n + ' payments, total ' + total);
  return n;
}

/* ---------- Accounts: each person creates their own login ---------- */
function hash_(pw, salt) {
  var h = salt + pw;
  for (var i = 0; i < 300; i++) h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + salt, Utilities.Charset.UTF_8));
  return h;
}
function mkpw_(pw) { var s = Utilities.getUuid(); return s + '$' + hash_(pw, s); }
function chkpw_(pw, stored) { var a = String(stored).split('$'); return a.length === 2 && hash_(pw, a[0]) === a[1]; }
function same_(a, b) {
  var d = function (x) { return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(x), Utilities.Charset.UTF_8)); };
  return d(a) === d(b);
}
function session_(em) {
  var t = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('S_' + t, em, 21600);
  return { token: t };
}

function signup_(p) {
  ensureInit_();
  var c = CacheService.getScriptCache(), key = 'F_signup', name = String(p.name || '').trim(), em = String(p.email || '').trim().toLowerCase(), pw = String(p.password || '');
  if (!name) throw U('Please enter your full name.');
  if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(em)) throw U('Please enter a valid Gmail address.');
  if (pw.length < 8) throw U('Your password must be at least 8 characters.');
  if (Number(c.get(key) || 0) >= 5) throw U('Too many attempts. Please wait 15 minutes and try again.');
  if (!SIGNUP_CODE || !same_(String(p.code || ''), SIGNUP_CODE)) {
    c.put(key, String(Number(c.get(key) || 0) + 1), 900);
    throw U('The office access code is incorrect.');
  }
  if (all_('Accounts').some(function (x) { return x.Email === em; })) throw U('An account with this email already exists. Please sign in.');
  var first = all_('Accounts').length === 0;
  var u = { Email: em, Name: name, 'Password Hash': mkpw_(pw), Active: 'Yes', Created: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'), Role: first ? 'admin' : 'sales' };
  var sh = sh_('Accounts'), hm = hmap_('Accounts'), w = sh.getLastColumn(), row = [], q;
  for (q = 0; q < w; q++) row.push('');
  S.Accounts.f.forEach(function (k) { row[hm[k] - 1] = u[k]; });
  sh.getRange(sh.getLastRow() + 1, 1, 1, w).setNumberFormat('@').setValues([row]);
  inval_('Accounts');
  CUR_ = u;
  log_('', '', 'Account created', em + ' (' + u.Role + ')');
  return session_(em);
}

function changePw_(p, me) {
  var u = all_('Accounts').filter(function (x) { return x.Email === me.Email; })[0];
  if (!u) throw U('Account not found.');
  if (!chkpw_(String(p.old || ''), u['Password Hash'])) throw U('Your current password is incorrect.');
  if (String(p.pw || '').length < 8) throw U('The new password must be at least 8 characters.');
  if (String(p.pw) === String(p.old)) throw U('The new password must be different from the current one.');
  sh_('Accounts').getRange(u._row, S.Accounts.f.indexOf('Password Hash') + 1).setNumberFormat('@').setValue(mkpw_(String(p.pw)));
  inval_('Accounts');
  log_('', '', 'Password changed', me.Email);
  return true;
}

/* RUN THIS ONCE from the Apps Script editor (choose authorizeEmail, click Run, allow access)
   so the app can email password reset codes. Then redeploy: Deploy > Manage deployments > Edit > New version > Deploy. */
function authorizeEmail() {
  Logger.log('Email sending is allowed. Remaining emails today: ' + MailApp.getRemainingDailyQuota());
}

function forgot_(p) {
  ensureInit_();
  var em = String(p.email || '').trim().toLowerCase(), ch = CacheService.getScriptCache(), key = 'F_fp_' + em.slice(0, 60), generic = 'If that email has an account, a 6-digit reset code has been sent. It is valid for 15 minutes.';
  if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(em)) throw U('Please enter a valid email address.');
  if (Number(ch.get(key) || 0) >= 3) throw U('Too many reset requests. Please wait 15 minutes and try again.');
  ch.put(key, String(Number(ch.get(key) || 0) + 1), 900);
  var q;
  try { q = MailApp.getRemainingDailyQuota(); } catch (e) { throw U('Email sending is not set up yet. The owner needs to run authorizeEmail in Apps Script (see setup notes).'); }
  if (q < 1) throw U('The daily email limit has been reached. Please try again tomorrow.');
  var u = all_('Accounts').filter(function (x) { return x.Email === em && x.Active === 'Yes'; })[0];
  if (u) {
    var code = ('000000' + Math.floor(Math.random() * 1000000)).slice(-6);
    ch.put('R_' + em, mkpw_(code), 900);
    ch.remove('RA_' + em);
    try {
      MailApp.sendEmail(em, 'EAGLETON password reset code', 'Hello ' + u.Name + ',\n\nYour EAGLETON password reset code is: ' + code + '\n\nIt is valid for 15 minutes. If you did not ask for this, you can ignore this email and your password will stay the same.\n\nEAGLETON Property Management');
    } catch (e2) { Logger.log(e2); throw U('The reset email could not be sent. Please try again in a moment.'); }
  }
  return generic;
}

function reset_(p) {
  ensureInit_();
  var em = String(p.email || '').trim().toLowerCase(), code = String(p.code || '').trim(), pw = String(p.pw || ''), ch = CacheService.getScriptCache(), n = Number(ch.get('RA_' + em) || 0);
  if (!em || !code) throw U('Enter your email and the 6-digit code.');
  if (pw.length < 8) throw U('Your new password must be at least 8 characters.');
  var stored = ch.get('R_' + em);
  if (!stored || n >= 5) { ch.remove('R_' + em); throw U('This code has expired or is no longer valid. Please request a new one.'); }
  if (!chkpw_(code, stored)) { ch.put('RA_' + em, String(n + 1), 900); throw U('That code is not correct.'); }
  var u = all_('Accounts').filter(function (x) { return x.Email === em && x.Active === 'Yes'; })[0];
  if (!u) throw U('This code has expired or is no longer valid. Please request a new one.');
  sh_('Accounts').getRange(u._row, S.Accounts.f.indexOf('Password Hash') + 1).setNumberFormat('@').setValue(mkpw_(pw));
  inval_('Accounts');
  ch.remove('R_' + em); ch.remove('RA_' + em); ch.remove('F_' + em);
  CUR_ = u;
  log_('', '', 'Password reset', em);
  return true;
}

function login_(p) {
  ensureInit_();
  var em = String(p.email || '').trim().toLowerCase(), pw = String(p.password || ''), c = CacheService.getScriptCache(), key = 'F_' + em.slice(0, 60);
  if (!em || !pw) throw U('Enter your email and password.');
  if (Number(c.get(key) || 0) >= 5) throw U('Too many failed attempts. Please wait 15 minutes and try again.');
  var u = all_('Accounts').filter(function (x) { return x.Email === em; })[0];
  if (!u || u.Active !== 'Yes' || !chkpw_(pw, u['Password Hash'])) {
    c.put(key, String(Number(c.get(key) || 0) + 1), 900);
    throw U('Invalid email or password.');
  }
  c.remove(key);
  CUR_ = u;
  log_('', '', 'Signed in', em);
  return session_(em);
}

function auth_(t) {
  if (!t) return null;
  var ch = CacheService.getScriptCache(), em = ch.get('S_' + t), u = null;
  if (!em) return null;
  var j = ch.get('A_' + em);
  if (j) { try { u = JSON.parse(j); } catch (e) { u = null; } if (u && !u.Role) u = null; }
  if (!u) {
    var r = all_('Accounts').filter(function (x) { return x.Email === em; })[0];
    if (r) { u = { Email: r.Email, Name: r.Name, Active: r.Active, Role: ROLES_.indexOf(r.Role) > -1 ? r.Role : 'sales' }; ch.put('A_' + em, JSON.stringify(u), 300); }
  }
  if (!u || u.Active !== 'Yes') return null;
  ch.put('S_' + t, em, 21600);
  return u;
}

function syncRecords_() {
  var cs = all_('Customers'), ln = all_('Loans'), rg = all_('Registrations'), fu = all_('FollowUps');
  cs.forEach(function (c) {
    var id = c['Customer ID'], r;
    if (c.Status === 'Loan' && !ln.some(function (x) { return x['Customer ID'] === id; })) {
      r = put_('Loans', { 'Customer ID': id, Plot: c['Interested Plot'] }, true);
      log_(r['Loan ID'], id, 'Loan created', 'Added automatically because the status is Loan');
    }
    if ((c.Status === 'Registration' || c.Status === 'Registered' || c.Status === 'Completed') && !rg.some(function (x) { return x['Customer ID'] === id; })) {
      r = put_('Registrations', { 'Customer ID': id, Plot: c['Interested Plot'], 'Registration Status': (c.Status === 'Registered' || c.Status === 'Completed') ? 'Completed' : undefined }, true);
      log_(r['Registration ID'], id, 'Registration created', 'Added automatically because the status is Registration');
    }
    if (c.Status === 'Follow-up' && !fu.some(function (x) { return x['Customer ID'] === id; })) {
      r = put_('FollowUps', { 'Customer ID': id, Date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'), Remarks: 'Added automatically because the status is Follow-up' }, true);
      log_(r['Follow-up ID'], id, 'Follow-up created', 'Added automatically because the status is Follow-up');
    }
  });
}

/* ---------- Roles: what each kind of login may change (everyone can read everything) ---------- */
function deny_(role) { return U('Your ' + role + ' login can only view this section. Please ask an admin if you need to change it.'); }
function perm_(a, p, role) {
  if (role === 'admin') return;
  var sheet = p.sheet, r = p.rec || {}, old = r['Customer ID'] ? cust_(r['Customer ID']) : null;
  if (a === 'save') {
    if (role === 'sales') {
      if (sheet === 'FollowUps') return;
      if (sheet === 'Customers' && (old ? PRE_.indexOf(old.Status) > -1 : (!r.Status || PRE_.indexOf(r.Status) > -1))) return;
    } else if (role === 'legal') {
      if (sheet === 'Plots' || sheet === 'Registrations') return;
      if (sheet === 'Customers' && old && old.Status === 'Registration' && Object.keys(r).every(function (k) { return ['Customer ID', 'Service Charges Rate', 'GST Rate'].indexOf(k) > -1; })) return;
    }
  } else if (a === 'complete' && role === 'sales') return;
  else if (a === 'assign' && role === 'legal') return;
  throw deny_(role);
}

function users_() {
  return all_('Accounts').map(function (u) { return { Email: u.Email, Name: u.Name, Role: ROLES_.indexOf(u.Role) > -1 ? u.Role : 'sales', Active: u.Active, Created: u.Created }; });
}
function setUser_(p, me) {
  var em = String(p.email || '').toLowerCase(), role = String(p.role || ''), act = p.active === 'No' ? 'No' : 'Yes';
  if (ROLES_.indexOf(role) < 0) throw U('Please choose Admin, Sales or Legal.');
  var u = all_('Accounts').filter(function (x) { return x.Email === em; })[0];
  if (!u) throw U('Account not found.');
  var others = all_('Accounts').filter(function (x) { return x.Email !== em && x.Active === 'Yes' && x.Role === 'admin'; }).length;
  if (!others && (role !== 'admin' || act !== 'Yes')) throw U('There must always be at least one active admin.');
  setf_('Accounts', u._row, 'Role', role);
  setf_('Accounts', u._row, 'Active', act);
  CacheService.getScriptCache().remove('A_' + em);
  log_('', '', 'Account changed', em + ': ' + role + ', active ' + act);
  return true;
}

/* ---------- Cancelled -> Deleted -> permanently deleted ---------- */
function items_(p) { return (p.items && p.items.length) ? p.items : [{ sheet: p.sheet, id: p.id }]; }
function trash_(p, on) {
  items_(p).forEach(function (it) {
    var d = S[it.sheet];
    if (!d || !d.id || d.f.indexOf('Deleted') < 0) throw U('Invalid request.');
    var r = one_(it.sheet, it.id);
    if (!r) throw U('That record no longer exists. Please refresh the page.');
    if (on && r[d.sk] !== 'Cancelled') throw U('Only cancelled records can be deleted. Cancel it first.');
    setf_(it.sheet, r._row, 'Deleted', on ? 'Yes' : '');
    log_(it.id, it.sheet === 'Customers' ? it.id : (r['Customer ID'] || ''), d.n + (on ? ' moved to Deleted' : ' restored from Deleted'), r.Name || r['Plot Number'] || r['Task Type'] || r.Amount || r.Date || r.Bank || '');
  });
  return true;
}

function delete_(p) {
  items_(p).forEach(function (it) { del1_({ sheet: it.sheet, id: it.id }); });
  return true;
}
function del1_(p) {
  var n = p.sheet, d = S[n];
  if (!d || !d.id) throw U('Invalid request.');
  var r = one_(n, p.id);
  if (!r) throw U('That record no longer exists. Please refresh the page.');
  if (r[d.sk] !== 'Cancelled' || r.Deleted !== 'Yes') throw U('Only records in the Deleted tab can be deleted permanently.');
  if (n === 'Customers') {
    ['FollowUps', 'Tasks', 'Loans', 'Registrations', 'Payments'].forEach(function (k) {
      all_(k).filter(function (x) { return x['Customer ID'] === p.id; }).map(function (x) { return x._row; }).sort(function (a, b) { return b - a; })
        .forEach(function (row) { sh_(k).deleteRow(row); });
      inval_(k);
    });
    all_('Plots').filter(function (x) { return x['Customer ID'] === p.id; }).forEach(function (x) { put_('Plots', { 'Plot ID': x['Plot ID'], Status: 'Available' }, true); });
  }
  sh_(n).deleteRow(r._row);
  inval_(n);
  log_(p.id, n === 'Customers' ? p.id : (r['Customer ID'] || ''), d.n + ' deleted permanently', r.Name || r['Plot Number'] || r['Task Type'] || r.Amount || r.Date || r.Bank || '');
  return true;
}

function allData_(me) {
  ensureInit_();
  var d = dataCacheGet_();
  if (!d) {
    syncRecords_();
    d = {};
    Object.keys(S).forEach(function (n) { if (n !== 'Settings' && n !== 'Accounts') d[n] = all_(n); });
    d.ActivityLog = d.ActivityLog.slice().reverse().slice(0, 300);
    dataCachePut_(d);
  }
  d.me = { Name: me.Name, Email: me.Email, Role: me.Role };
  return d;
}

/* Single entry point called from the browser. Everything except login/signup needs a valid session token. */
function api(a, p, t) {
  var lk = null;
  try {
    lk = LockService.getScriptLock();
    lk.waitLock(20000);
    p = p || {};
    if (a === 'login') return { ok: true, data: login_(p) };
    if (a === 'signup') return { ok: true, data: signup_(p) };
    if (a === 'forgot') return { ok: true, data: forgot_(p) };
    if (a === 'reset') return { ok: true, data: reset_(p) };
    CUR_ = auth_(t);
    if (!CUR_) return { ok: false, auth: true, error: 'Please sign in to continue.' };
    var r;
    if (a === 'logout') { log_('', '', 'Signed out', CUR_.Email); CacheService.getScriptCache().remove('S_' + t); r = true; }
    else if (a === 'all') { r = allData_(CUR_); r.ver = SCHEMA_V; }
    else if (a === 'save') {
      if (!S[p.sheet] || !S[p.sheet].id) throw U('Invalid request.');
      perm_(a, p, CUR_.Role);
      ALLOWDUP_ = !!p.allowDup;
      try { r = put_(p.sheet, p.rec || {}); } finally { ALLOWDUP_ = false; }
    }
    else if (a === 'complete') { perm_(a, p, CUR_.Role); r = complete_(p); }
    else if (a === 'assign') { perm_(a, p, CUR_.Role); r = assign_(p); }
    else if (a === 'plan') { perm_(a, p, CUR_.Role); r = plan_(p); }
    else if (a === 'changePw') r = changePw_(p, CUR_);
    else if (a === 'delete') { perm_(a, p, CUR_.Role); r = delete_(p); }
    else if (a === 'trash' || a === 'untrash') { perm_(a, p, CUR_.Role); r = trash_(p, a === 'trash'); }
    else if (a === 'users') { perm_(a, p, CUR_.Role); r = users_(); }
    else if (a === 'setUser') { perm_(a, p, CUR_.Role); r = setUser_(p, CUR_); }
    else throw U('Unknown action.');
    var out = { ok: true, data: r };
    if ((a === 'save' || a === 'complete' || a === 'assign' || a === 'plan' || a === 'delete' || a === 'trash' || a === 'untrash') && !p.noall) out.all = allData_(CUR_);
    return out;
  } catch (e) {
    Logger.log(e);
    return { ok: false, dup: e.dup ? true : undefined, error: e.u ? e.message : 'Something went wrong while using the spreadsheet. Please try again in a moment.' };
  } finally {
    try { if (lk) lk.releaseLock(); } catch (x) {}
  }
}
