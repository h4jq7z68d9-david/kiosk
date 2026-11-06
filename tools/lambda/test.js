#!/usr/bin/env node
// Lambda route tests — run `node tools/lambda/test.js` (check.js runs it too). No network, no AWS,
// no SDK: hooks.mjs swaps every @aws-sdk import for tools/lambda/aws-stubs.mjs and https.request
// is replaced with a fake Square. The real index.mjs handler is called with API Gateway v2 events.
//
// Invariants (Kiosk-Project-Summary.md → Pending → Lambda route tests):
//   1. no token → 401 on every /admin/* route, and nothing is read or written
//   2. JILL_TOKEN is rejected on every /admin/* route; ADMIN_TOKEN is rejected on every /admin/jill/* route
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
  for (const [m, p] of [...ADMIN_ROUTES, ...JILL_ROUTES]) {
    stubs.reset();
    const r = await call(m, p, { body: {} });
    check(r.statusCode === 401, `no token: ${m} ${p} → ${r.statusCode}, expected 401`);
    check(stubs.log.length === 0, `no token: ${m} ${p} touched AWS (${stubs.log.map((s) => s.name).join(',')})`);
  }
  // Public /admin/* routes stay public (they sit in front of the gate on purpose).
  for (const [m, p, body] of [['POST', '/admin/verify-password', { password: 'wrong' }], ['POST', '/admin/jill/verify-password', { password: 'wrong' }]]) {
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

  // ── report ──
  out(`lambda tests: ${passes} passed, ${failures.length} failed`);
  for (const f of failures) out('  FAIL ' + f);
  process.exit(failures.length ? 1 : 0);
})().catch((e) => { process.stdout.write('lambda tests: crashed — ' + (e.stack || e) + '\n'); process.exit(1); });
