#!/usr/bin/env node
// Lambda route tests — run `node tools/lambda/test.js` (check.js runs it too). No network, no AWS,
// no SDK: hooks.mjs swaps every @aws-sdk import for tools/lambda/aws-stubs.mjs and https.request
// is replaced with a fake Square. The real index.mjs handler is called with API Gateway v2 events.
//
// Invariants (Kiosk-Project-Summary.md → Pending → Lambda route tests):
//   1. no token → 401 on every /admin/* route, and nothing is read or written
//   2. JILL_TOKEN is rejected on every /admin/* route; ADMIN_TOKEN is rejected on every /admin/jill/* route
//   2b. SEAN_TOKEN works only on /admin/sean/*; ADMIN_TOKEN and JILL_TOKEN are rejected there; Sean's data lands only in sean-expenses
//   3. online checkout (/checkout and /cart) sends exactly SQUARE_LOC and never the Missouri location
//   4. a gallery print sale decrements dna-gallery-stock, never dna-paintings (a fair sale does the reverse)
'use strict';
const path = require('path');
const fs = require('fs');
const https = require('https');
const { register } = require('node:module');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..', '..');
const MISSOURI = 'LHXVQB0QCW9R1';
const ENV = {
  ADMIN_TOKEN: 'admin-token-test', JILL_TOKEN: 'jill-token-test', PASSWORD: 'admin-pin', JILL_PASSWORD: 'jill-pin-test',
  SEAN_TOKEN: 'sean-token-test', SEAN_PASSWORD: 'sean-pin-test',
  SQUARE_TOKEN: 'sq-test', SQUARE_LOC: 'TESTLOC00000', SES_FROM: 'test@example.invalid', NOTIFY_EMAIL: 'test@example.invalid',
  API_URL: 'https://davidnicholsonart.com',
};
Object.assign(process.env, ENV);

// ── fake Square: records every request, answers with a payment link ──
const square = [];
https.request = (opts, cb) => {
  const rec = { method: opts.method, path: opts.path, body: '' };
  square.push(rec);
  return {
    on() {},
    write(d) { rec.body += d; },
    end() {
      const res = { statusCode: 200, headers: {}, _h: {}, on(ev, fn) { this._h[ev] = fn; } };
      cb(res);
      const reply = JSON.stringify({ payment_link: { url: 'https://square.link/u/test' }, related_resources: { orders: [{ id: 'ord1', location_id: opts.method === 'POST' ? JSON.parse(rec.body || '{}').order?.location_id : undefined }] } });
      setImmediate(() => { res._h.data?.(reply); res._h.end?.(); });
    },
  };
};

// ── silence the handler's logging unless asked ──
const VERBOSE = process.argv.includes('-v');
if (!VERBOSE) { console.log = () => {}; console.error = () => {}; }
const out = (s) => process.stdout.write(s + '\n');

const failures = [];
let passes = 0;
function check(cond, msg) { if (cond) passes++; else failures.push(msg); }

const event = (method, p, { token, body, query } = {}) => ({
  requestContext: { http: { method, path: p } },
  headers: token ? { 'x-admin-token': token } : {},
  queryStringParameters: query,
  body: body === undefined ? undefined : JSON.stringify(body),
});

// Every route pattern in the auth-gated /admin block of index.mjs (one concrete path per pattern).
const ADMIN_ROUTES = [
  ['GET', '/admin/config'], ['PUT', '/admin/config'], ['GET', '/admin/print-prices'], ['PUT', '/admin/print-prices'],
  ['GET', '/admin/paintings'], ['POST', '/admin/paintings'], ['PUT', '/admin/paintings/p1'], ['DELETE', '/admin/paintings/p1'],
  ['GET', '/admin/price-lists'], ['POST', '/admin/price-lists'], ['POST', '/admin/price-lists/pl1/apply'],
  ['PUT', '/admin/price-lists/pl1'], ['DELETE', '/admin/price-lists/pl1'],
  ['POST', '/admin/paintings/p1/sales'], ['PUT', '/admin/paintings/p1/sales/s1'], ['DELETE', '/admin/paintings/p1/sales/s1'],
  ['GET', '/admin/expenses'], ['POST', '/admin/expenses'], ['POST', '/admin/expenses/receipt-url'],
  ['PUT', '/admin/expenses/e1'], ['DELETE', '/admin/expenses/e1'],
  ['GET', '/admin/recurring'], ['POST', '/admin/recurring'], ['POST', '/admin/recurring/run'],
  ['PUT', '/admin/recurring/r1'], ['DELETE', '/admin/recurring/r1'],
  ['POST', '/admin/mileage'], ['PUT', '/admin/mileage/m1'], ['DELETE', '/admin/mileage/m1'],
  ['GET', '/admin/gallery-stock'], ['PUT', '/admin/gallery-stock'], ['DELETE', '/admin/gallery-stock/p1__Phoenix_Gallery'],
  ['GET', '/admin/checklists'], ['POST', '/admin/checklists'], ['PUT', '/admin/checklists/c1'], ['DELETE', '/admin/checklists/c1'],
  ['GET', '/admin/nothing-here'],
];
// Every token-gated route in jillRoute (verify-password is public and is tested separately).
const JILL_ROUTES = [
  ['GET', '/admin/jill/data'], ['PUT', '/admin/jill/config'], ['POST', '/admin/jill/import'], ['PUT', '/admin/jill/password'],
  ['POST', '/admin/jill/expenses/receipt-url'], ['POST', '/admin/jill/recurring/run'],
  ['POST', '/admin/jill/expenses'], ['PUT', '/admin/jill/expenses/e1'], ['DELETE', '/admin/jill/expenses/e1'],
  ['POST', '/admin/jill/revenue'], ['PUT', '/admin/jill/revenue/r1'], ['DELETE', '/admin/jill/revenue/r1'],
  ['POST', '/admin/jill/mileage'], ['PUT', '/admin/jill/mileage/m1'], ['DELETE', '/admin/jill/mileage/m1'],
  ['POST', '/admin/jill/recurring'], ['PUT', '/admin/jill/recurring/x1'], ['DELETE', '/admin/jill/recurring/x1'],
  ['GET', '/admin/jill/nothing-here'],
];
// Every token-gated route in seanRoute: Jill's set under /admin/sean plus the job rename.
const SEAN_ROUTES = [...JILL_ROUTES.map(([m, p]) => [m, p.replace('/admin/jill/', '/admin/sean/')]), ['POST', '/admin/sean/jobs/rename']];

(async () => {
  register('./hooks.mjs', pathToFileURL(__filename));
  const stubs = await import('./aws-stubs.mjs');
  const { handler } = await import(pathToFileURL(path.join(ROOT, 'index.mjs')).href);
  const call = (...a) => handler(event(...a));
  const sends = (pred) => stubs.log.filter(pred);
  const touched = (t) => sends((s) => s.input?.TableName === t);

  // Sanity: the router must still exist in the shape these tests assume.
  const src = fs.readFileSync(path.join(ROOT, 'index.mjs'), 'utf8');
  check(/if \(path\.startsWith\('\/admin'\)\) \{\s*if \(!checkAdminAuth\(event\)\) return err\('Unauthorized', 401, cors\);/.test(src),
    'index.mjs: the /admin block no longer starts with the checkAdminAuth gate');
  check(!src.includes(MISSOURI), `index.mjs: contains the Missouri location id ${MISSOURI} — it must only ever come from Square-side config, never code`);

  // ── 1. no token → 401, and no table is touched ──
  for (const [m, p] of [...ADMIN_ROUTES, ...JILL_ROUTES, ...SEAN_ROUTES]) {
    stubs.reset();
    const r = await call(m, p, { body: {} });
    check(r.statusCode === 401, `no token: ${m} ${p} → ${r.statusCode}, expected 401`);
    check(stubs.log.length === 0, `no token: ${m} ${p} touched AWS (${stubs.log.map((s) => s.name).join(',')})`);
  }
  // Public /admin/* routes stay public (they sit in front of the gate on purpose).
  for (const [m, p, body] of [['POST', '/admin/verify-password', { password: 'wrong' }], ['POST', '/admin/jill/verify-password', { password: 'wrong' }], ['POST', '/admin/sean/verify-password', { password: 'wrong' }]]) {
    const r = await call(m, p, { body });
    check(r.statusCode === 401 && JSON.parse(r.body).error === 'Incorrect password', `${p}: wrong PIN should be 401 "Incorrect password", got ${r.statusCode} ${r.body}`);
  }
  {
    const r = await call('POST', '/admin/verify-password', { body: { password: ENV.PASSWORD } });
    check(r.statusCode === 200 && JSON.parse(r.body).token === ENV.ADMIN_TOKEN, 'admin verify-password: correct PIN should return ADMIN_TOKEN');
    const j = await call('POST', '/admin/jill/verify-password', { body: { password: ENV.JILL_PASSWORD } });
    check(j.statusCode === 200 && JSON.parse(j.body).token === ENV.JILL_TOKEN, "jill verify-password: correct PIN should return JILL_TOKEN");
    check(JSON.parse(j.body).token !== ENV.ADMIN_TOKEN, 'jill verify-password must never hand out ADMIN_TOKEN');
  }

  // ── 2. the wrong token is a 401 on the other side, with nothing touched ──
  for (const [m, p] of ADMIN_ROUTES) {
    stubs.reset();
    const r = await call(m, p, { token: ENV.JILL_TOKEN, body: {} });
    check(r.statusCode === 401, `JILL_TOKEN on ${m} ${p} → ${r.statusCode}, expected 401`);
    check(stubs.log.length === 0, `JILL_TOKEN on ${m} ${p} touched AWS`);
  }
  for (const [m, p] of JILL_ROUTES) {
    stubs.reset();
    const r = await call(m, p, { token: ENV.ADMIN_TOKEN, body: {} });
    check(r.statusCode === 401, `ADMIN_TOKEN on ${m} ${p} → ${r.statusCode}, expected 401`);
    check(stubs.log.length === 0, `ADMIN_TOKEN on ${m} ${p} touched AWS`);
  }
  // Token in the query string is accepted too (admin.html uses the header; kiosk links use ?token=) — and only the right one.
  {
    const r = await call('GET', '/admin/config', { query: { token: ENV.ADMIN_TOKEN } });
    check(r.statusCode === 200, `?token=ADMIN_TOKEN on /admin/config → ${r.statusCode}, expected 200`);
    const j = await call('GET', '/admin/config', { query: { token: ENV.JILL_TOKEN } });
    check(j.statusCode === 401, `?token=JILL_TOKEN on /admin/config → ${j.statusCode}, expected 401`);
  }

  // ── 3. online checkout: exactly SQUARE_LOC, never Missouri, even when the client tries to inject one ──
  const checkouts = [
    ['POST', '/checkout', { body: { items: [{ variation_id: 'VAR1' }], location_id: MISSOURI, order: { location_id: MISSOURI } } }],
    ['GET', '/cart', { query: { product_id: 'item_VAR1', location_id: MISSOURI } }],
    ['GET', '/cart', { query: { products: JSON.stringify([{ id: 'item_VAR2', quantity: '2' }]), location_id: MISSOURI } }],
  ];
  for (const [m, p, opts] of checkouts) {
    square.length = 0; stubs.reset();
    const r = await call(m, p, opts);
    const posts = square.filter((s) => s.method === 'POST' && s.path === '/v2/online-checkout/payment-links');
    check(posts.length === 1, `${m} ${p}: expected one payment-link POST, saw ${posts.length}`);
    for (const s of posts) {
      const body = JSON.parse(s.body);
      check(body.order?.location_id === ENV.SQUARE_LOC, `${m} ${p}: order.location_id = ${body.order?.location_id}, expected SQUARE_LOC`);
      check(!s.body.includes(MISSOURI), `${m} ${p}: Missouri location leaked into the Square request`);
      check(!s.path.includes(MISSOURI), `${m} ${p}: Missouri location leaked into the Square path`);
    }
    if (m === 'POST') check(r.statusCode === 200 && JSON.parse(r.body).checkout_url, `/checkout: expected 200 with checkout_url, got ${r.statusCode} ${r.body}`);
    else check(r.statusCode === 302 && r.headers.Location === 'https://square.link/u/test', `/cart: expected 302 to the Square link, got ${r.statusCode} ${r.headers?.Location}`);
  }
  // Quantity on /cart expands to one line item per unit.
  { const b = square.at(-1) ? JSON.parse(square.at(-1).body) : null; check(b?.order?.line_items?.length === 2, `/cart qty 2: ${b?.order?.line_items?.length} line items, expected 2`); }

  // ── 4. gallery sale → dna-gallery-stock only; fair sale → dna-paintings only ──
  {
    stubs.reset();
    stubs.table('dna-gallery-stock').set('p1__Phoenix_Gallery', { id: 'p1__Phoenix_Gallery', paintingId: 'p1', galleryName: 'Phoenix Gallery', stockLg: 3, stockSm: 1 });
    stubs.table('dna-paintings').set('p1', { id: 'p1', title: 'Test', stock: { large: 5, small: 5 } });
    const r = await call('POST', '/admin/paintings/p1/sales', { token: ENV.ADMIN_TOKEN, body: { date: '2026-11-06', type: 'large', channel: 'gallery', price: 100, pct: 50, decrementStock: true, galleryName: 'Phoenix Gallery' } });
    const body = JSON.parse(r.body);
    check(r.statusCode === 200, `gallery sale → ${r.statusCode}`);
    check(touched('dna-sales').some((s) => s.name === 'PutCommand' && s.input.Item.channel === 'gallery' && s.input.Item.net === 50), 'gallery sale: sale row not written to dna-sales with net 50');
    const gsWrites = touched('dna-gallery-stock').filter((s) => s.name === 'PutCommand');
    check(gsWrites.length === 1 && gsWrites[0].input.Item.stockLg === 2 && gsWrites[0].input.Item.stockSm === 1, `gallery sale: expected one dna-gallery-stock write with stockLg 3→2, saw ${JSON.stringify(gsWrites.map((s) => s.input.Item))}`);
    check(gsWrites.length && gsWrites[0].input.ConditionExpression === '#f = :cur', 'gallery sale: stock write is not conditional (lost-update guard missing)');
    const paintingWrites = touched('dna-paintings').filter((s) => s.name !== 'GetCommand' && s.name !== 'ScanCommand');
    check(paintingWrites.length === 0, `gallery sale: dna-paintings was written (${paintingWrites.map((s) => s.name).join(',')})`);
    check(body.galleryStock?.reduced === true && body.galleryStock.record.stockLg === 2, `gallery sale: response galleryStock = ${JSON.stringify(body.galleryStock)}`);

    // Default gallery name applies when none is sent.
    stubs.reset();
    stubs.table('dna-gallery-stock').set('p1__Phoenix_Gallery', { id: 'p1__Phoenix_Gallery', stockLg: 0, stockSm: 2 });
    const r2 = await call('POST', '/admin/paintings/p1/sales', { token: ENV.ADMIN_TOKEN, body: { type: 'small', channel: 'gallery', price: 40, pct: 50, decrementStock: true } });
    const w2 = touched('dna-gallery-stock').filter((s) => s.name === 'PutCommand');
    check(r2.statusCode === 200 && w2.length === 1 && w2[0].input.Item.stockSm === 1, 'gallery sale without galleryName: should decrement Phoenix Gallery stockSm 2→1');

    // Gallery stock at zero: sale still saved, nothing written, reduced:false — never negative.
    stubs.reset();
    stubs.table('dna-gallery-stock').set('p1__Phoenix_Gallery', { id: 'p1__Phoenix_Gallery', stockLg: 0, stockSm: 0 });
    const r3 = await call('POST', '/admin/paintings/p1/sales', { token: ENV.ADMIN_TOKEN, body: { type: 'large', channel: 'gallery', price: 100, pct: 50, decrementStock: true } });
    check(r3.statusCode === 200 && JSON.parse(r3.body).galleryStock.reduced === false, 'gallery sale at zero stock: expected reduced:false');
    check(touched('dna-gallery-stock').every((s) => s.name === 'ScanCommand'), 'gallery sale at zero stock: wrote to dna-gallery-stock');
    check(touched('dna-sales').length === 1, 'gallery sale at zero stock: sale row should still be saved');

    // Contrast: a fair sale with decrementStock touches dna-paintings and leaves gallery stock alone.
    stubs.reset();
    const r4 = await call('POST', '/admin/paintings/p1/sales', { token: ENV.ADMIN_TOKEN, body: { type: 'large', channel: 'fair', price: 100, state: 'KS', decrementStock: true } });
    const upd = touched('dna-paintings').filter((s) => s.name === 'UpdateCommand');
    check(r4.statusCode === 200 && upd.length === 1 && upd[0].input.ExpressionAttributeNames['#sz'] === 'large', 'fair sale: expected one UpdateCommand on dna-paintings stock.large');
    check(touched('dna-gallery-stock').length === 0, 'fair sale: dna-gallery-stock was touched');

    // No decrementStock flag → no stock change anywhere (the sale modal's painting PUT handles it).
    stubs.reset();
    await call('POST', '/admin/paintings/p1/sales', { token: ENV.ADMIN_TOKEN, body: { type: 'large', channel: 'gallery', price: 100, pct: 50 } });
    check(touched('dna-gallery-stock').length === 0 && touched('dna-paintings').length === 0, 'sale without decrementStock: stock tables were touched');
  }

  // ── 2b. Sean's page: three-way token wall, own table, job / vendor / tax fields ──
  {
    const others = [ENV.ADMIN_TOKEN, ENV.JILL_TOKEN];
    for (const [m, p] of SEAN_ROUTES) for (const tok of others) {
      stubs.reset();
      const r = await call(m, p, { token: tok, body: {} });
      check(r.statusCode === 401, `${tok} on ${m} ${p} → ${r.statusCode}, expected 401`);
      check(stubs.log.length === 0, `${tok} on ${m} ${p} touched AWS`);
    }
    for (const [m, p] of [...ADMIN_ROUTES, ...JILL_ROUTES]) {
      stubs.reset();
      const r = await call(m, p, { token: ENV.SEAN_TOKEN, body: {} });
      check(r.statusCode === 401, `SEAN_TOKEN on ${m} ${p} → ${r.statusCode}, expected 401`);
      check(stubs.log.length === 0, `SEAN_TOKEN on ${m} ${p} touched AWS`);
    }
    stubs.reset();
    const v = await call('POST', '/admin/sean/verify-password', { body: { password: ENV.SEAN_PASSWORD } });
    check(v.statusCode === 200 && JSON.parse(v.body).token === ENV.SEAN_TOKEN, 'sean verify-password: correct password should return SEAN_TOKEN');
    for (const pw of [ENV.PASSWORD, ENV.JILL_PASSWORD]) {
      const w = await call('POST', '/admin/sean/verify-password', { body: { password: pw } });
      check(w.statusCode === 401, `sean verify-password accepted another page's password (${pw})`);
    }
    const jp = await call('POST', '/admin/jill/verify-password', { body: { password: ENV.SEAN_PASSWORD } });
    check(jp.statusCode === 401, "jill verify-password accepted Sean's password");

    const T = { token: ENV.SEAN_TOKEN };
    const J = (r) => JSON.parse(r.body);
    stubs.reset();
    const d0 = J(await call('GET', '/admin/sean/data', T));
    check(d0.config.threshold1099 === 2000 && d0.config.categories.includes('Subcontractors') && Array.isArray(d0.config.jobs) && d0.config.jobs.length === 0, `sean defaults: ${JSON.stringify(d0.config).slice(0, 200)}`);

    const e1 = J(await call('POST', '/admin/sean/expenses', { ...T, body: { date: '2026-11-20', category: 'Lumber & Trim Stock', vendor: ' Mill Co ', desc: 'casing', amount: 108.5, tax: 8.5, job: ' Henderson ' } })).expense;
    check(e1 && e1.job === 'Henderson' && e1.vendor === 'Mill Co' && e1.tax === 8.5 && e1.amount === 108.5 && e1.type === 'expense', `sean expense save: ${JSON.stringify(e1)}`);
    const e2 = J(await call('POST', '/admin/sean/expenses', { ...T, body: { date: '2026-11-21', category: 'Insurance', amount: 50, tax: 80 } })).expense;
    check(e2.tax === 0 && e2.job === '' && e2.vendor === '', `sean expense: tax above amount must store 0, no job = overhead: ${JSON.stringify(e2)}`);
    const neg = await call('POST', '/admin/sean/expenses', { ...T, body: { date: '2026-11-21', amount: -5 } });
    check(neg.statusCode === 400, `sean expense: negative amount → ${neg.statusCode}, expected 400`);
    // An edit that omits job/vendor/tax keeps them; an edit that sends job '' clears it.
    const e1b = J(await call('PUT', '/admin/sean/expenses/' + e1.id, { ...T, body: { date: '2026-11-20', category: 'Lumber & Trim Stock', amount: 108.5 } })).expense;
    check(e1b.job === 'Henderson' && e1b.vendor === 'Mill Co' && e1b.tax === 8.5, `sean expense edit dropped fields: ${JSON.stringify(e1b)}`);
    const rv = J(await call('POST', '/admin/sean/revenue', { ...T, body: { date: '2026-11-22', stream: 'Deposits', amount: 2600, job: 'Henderson' } })).revenue;
    const mi = J(await call('POST', '/admin/sean/mileage', { ...T, body: { date: '2026-11-22', miles: 40, purpose: 'Site visit', job: 'Henderson' } })).entry;
    check(rv.job === 'Henderson' && mi.job === 'Henderson' && mi.rate === 0.7, `sean revenue/mileage job: ${JSON.stringify([rv, mi])}`);
    const cfg = J(await call('PUT', '/admin/sean/config', { ...T, body: { jobs: [{ name: 'Henderson', done: true, address: ' 12 Sample St ', contact: 'Pat', phone: '555-0100', email: 'pat@example.invalid', extra: 'x' }, 'henderson', { name: ' Morales ' }, { name: '' }], threshold1099: 2100 } })).config;
    check(JSON.stringify(cfg.jobs[0]) === JSON.stringify({ name: 'Henderson', done: true, address: '12 Sample St', contact: 'Pat', phone: '555-0100', email: 'pat@example.invalid' }) && cfg.jobs[1].address === '', `sean job details: ${JSON.stringify(cfg.jobs)}`);
    check(cfg.jobs.length === 2 && cfg.jobs[0].done === true && cfg.jobs[1].name === 'Morales' && cfg.threshold1099 === 2100, `sean config jobs: ${JSON.stringify(cfg.jobs)}`);
    const rn = J(await call('POST', '/admin/sean/jobs/rename', { ...T, body: { from: 'Henderson', to: 'Henderson crown' } }));
    const d1 = J(await call('GET', '/admin/sean/data', T));
    check(rn.renamed === 3 && [...d1.expenses, ...d1.revenue, ...d1.mileage].filter((x) => x.job === 'Henderson crown').length === 3 && !JSON.stringify(d1).includes('"job":"Henderson"'), `sean job rename: renamed ${rn.renamed}`);
    check(d1.config.jobs.some((j) => j.name === 'Henderson crown' && j.done && j.address === '12 Sample St' && j.email === 'pat@example.invalid') && !d1.config.jobs.some((j) => j.name === 'Henderson') && d1.config.threshold1099 === 2100, `sean job rename config: ${JSON.stringify(d1.config.jobs)}`);
    const im = J(await call('POST', '/admin/sean/import', { ...T, body: { kind: 'expense', rows: [{ date: '2026-10-01', amount: -20, tax: 1.5, vendor: 'Ace', job: 'Morales', category: 'Job Supplies' }] } }));
    check(im.imported === 1 && im.items[0].amount === 20 && im.items[0].tax === 1.5 && im.items[0].job === 'Morales' && im.items[0].vendor === 'Ace', `sean import: ${JSON.stringify(im.items)}`);
    const del = await call('DELETE', '/admin/sean/revenue/' + e1.id, T);
    check(del.statusCode === 404, 'sean delete: an expense id on the revenue route must be 404');
    const delCfg = await call('DELETE', '/admin/sean/expenses/__config__', T);
    check(delCfg.statusCode === 404 && stubs.table('sean-expenses').has('__config__'), 'sean delete: __config__ must not be deletable');
    await call('POST', '/admin/sean/expenses/receipt-url', { ...T, body: { filename: 'r.jpg', contentType: 'image/jpeg', date: '2026-11-20', amount: 5, category: 'Other' } });
    const s3put = sends((s) => s.name === 'PutObjectCommand');
    check(s3put.length === 0 || s3put.every((s) => s.input.Key.startsWith('receipts/sean/')), 'sean receipt key must sit under receipts/sean/');
    const tablesHit = new Set(sends((s) => s.input?.TableName).map((s) => s.input.TableName));
    check(tablesHit.size === 1 && tablesHit.has('sean-expenses'), `sean routes touched tables other than sean-expenses: ${[...tablesHit].join(',')}`);
    // Password change: hash on Sean's own row; Jill's password still does not work here.
    const pc = await call('PUT', '/admin/sean/password', { ...T, body: { current: ENV.SEAN_PASSWORD, next: 'new-sean-password' } });
    const v2 = await call('POST', '/admin/sean/verify-password', { body: { password: 'new-sean-password' } });
    const v3 = await call('POST', '/admin/sean/verify-password', { body: { password: ENV.SEAN_PASSWORD } });
    check(pc.statusCode === 200 && v2.statusCode === 200 && v3.statusCode === 401, `sean password change: ${pc.statusCode}/${v2.statusCode}/${v3.statusCode}`);
    const d2 = J(await call('GET', '/admin/sean/data', T));
    check(!JSON.stringify(d2).includes('scrypt') && d2.config.jobs.length === 2, 'sean /data must not expose the password hash, and a password change must keep the config');
    // Scheduled run covers Sean's table too.
    stubs.reset();
    stubs.table('sean-expenses').set('r1', { id: 'r1', type: 'recurring', active: true, amount: 148, category: 'Insurance', desc: 'GL', dayOfMonth: 12, startMonth: new Date().toISOString().slice(0, 7) });
    const sched = await handler({ task: 'recurring' });
    check(sched.seanGenerated === 1 && [...stubs.table('sean-expenses').values()].some((x) => x.type === 'expense' && x.recurringId === 'r1'), `scheduled recurring for Sean: ${JSON.stringify(sched)}`);
  }

  // ── report ──
  out(`lambda tests: ${passes} passed, ${failures.length} failed`);
  for (const f of failures) out('  FAIL ' + f);
  process.exit(failures.length ? 1 : 0);
})().catch((e) => { process.stdout.write('lambda tests: crashed — ' + (e.stack || e) + '\n'); process.exit(1); });
