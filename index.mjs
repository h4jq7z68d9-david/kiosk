import https from 'https';
import { timingSafeEqual } from 'crypto';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const SQUARE_TOKEN  = process.env.SQUARE_TOKEN;
const SQUARE_LOC    = process.env.SQUARE_LOC;
const SES_FROM      = process.env.SES_FROM;
const NOTIFY_EMAIL  = process.env.NOTIFY_EMAIL;
const ADMIN_TOKEN   = process.env.ADMIN_TOKEN;

const PAINTINGS_TABLE = 'dna-paintings';
const SALES_TABLE     = 'dna-sales';
const EXPENSES_TABLE  = 'dna-expenses';
const GALLERY_TABLE   = 'dna-gallery-stock';
const BOOTH_TABLE     = 'dna-booth-layouts';
const CHECKLISTS_TABLE = 'dna-checklists';
const RECEIPTS_BUCKET = 'kiosk.davidnicholsonllc';
const RECEIPTS_PREFIX = 'receipts/';

const ALLOWED_ORIGINS = new Set([
  'https://davidnicholsonart.com',
  'https://www.davidnicholsonart.com',
  'https://kiosk.davidnicholsonllc.com',
]);

function corsHeaders(event) {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://davidnicholsonart.com';
  return {
    'Access-Control-Allow-Origin':  allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Admin-Token',
    'Access-Control-Allow-Credentials': 'true',
  };
}

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Admin-Token',
};

const ses       = new SESClient({ region: 'us-east-1' });
const s3        = new S3Client({ region: 'us-east-2' });
const dynamoRaw = new DynamoDBClient({ region: 'us-east-1' });
const dynamo    = DynamoDBDocumentClient.from(dynamoRaw);

function ok(body, c)             { return { statusCode: 200, headers: { ...(c||CORS), 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }
function err(msg, status=500, c) { return { statusCode: status, headers: c||CORS, body: JSON.stringify({ error: msg }) }; }

// Timing-safe string comparison (lengths may differ)
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function checkAdminAuth(event) {
  const token = event.queryStringParameters?.token
    || event.headers?.['x-admin-token']
    || event.headers?.['X-Admin-Token']
    || '';
  if (!ADMIN_TOKEN || !token) return false;
  return safeEqual(token, ADMIN_TOKEN);
}

// POST /admin/verify-password — public endpoint (no token required).
// Checks the submitted PIN against the PASSWORD env var; on success returns
// the ADMIN_TOKEN, which the frontend then sends on all /admin/* calls.
// This keeps both the PIN and the token out of public HTML source.
async function adminVerifyPassword(body, cors) {
  const password = body?.password;
  const envPassword = process.env.PASSWORD;
  if (!envPassword) return err('Server not configured', 500, cors);
  if (!password)    return err('Password required', 400, cors);
  if (safeEqual(password, envPassword)) {
    return ok({ verified: true, token: ADMIN_TOKEN }, cors);
  }
  return err('Incorrect password', 401, cors);
}

// ── Square helpers ──
function squareGet(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'connect.squareup.com',
      path,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${SQUARE_TOKEN}`, 'Square-Version': '2025-01-23' }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('Square parse error')); } });
    });
    req.on('error', reject);
    req.end();
  });
}

function squarePost(path, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const opts = {
      hostname: 'connect.squareup.com',
      path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SQUARE_TOKEN}`,
        'Square-Version': '2025-01-23',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('Square parse error')); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBinary(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/jpeg' }));
    }).on('error', reject);
  });
}

async function sendEmail({ to, subject, body }) {
  await ses.send(new SendEmailCommand({
    Source: `"David Nicholson Art" <${SES_FROM}>`,
    Destination: { ToAddresses: [to] },
    Message: { Subject: { Data: subject }, Body: { Text: { Data: body } } }
  }));
}

async function saveOrder(squareOrder) {
  await dynamoRaw.send(new PutItemCommand({
    TableName: 'dna-orders',
    Item: {
      id:        { S: squareOrder.id },
      timestamp: { S: squareOrder.created_at || new Date().toISOString() },
      state:     { S: squareOrder.state || 'OPEN' },
      items:     { S: JSON.stringify(squareOrder.line_items || []) },
      total:     { N: String(squareOrder.total_money?.amount || 0) },
    }
  }));
}

async function saveGuest({ name, email, note, subscribed }) {
  await dynamoRaw.send(new PutItemCommand({
    TableName: 'dna-guestbook',
    Item: {
      id:         { S: Date.now().toString() },
      timestamp:  { S: new Date().toISOString() },
      name:       { S: name },
      email:      { S: email },
      note:       { S: note || '' },
      subscribed: { BOOL: subscribed === true },
    }
  }));
}

function extractYear(obj) {
  const attrs = obj.custom_attribute_values;
  if (!attrs) return null;
  for (const val of Object.values(attrs)) {
    if (val.name === 'Year' && val.string_value) {
      return val.string_value.trim();
    }
  }
  return null;
}

async function buildProductList() {
  const [itemsRes, imagesRes] = await Promise.all([
    squareGet(`/v2/catalog/list?types=ITEM&location_id=${SQUARE_LOC}`),
    squareGet(`/v2/catalog/list?types=IMAGE`)
  ]);

  const imageMap = {};
  for (const img of (imagesRes.objects || [])) {
    if (img.image_data?.url) imageMap[img.id] = img.image_data.url;
  }

  const SELF = process.env.API_URL || 'https://doqg3wcta7.execute-api.us-east-1.amazonaws.com';

  const products = [];
  for (const obj of (itemsRes.objects || [])) {
    const item = obj.item_data;
    if (!item) continue;

    const variations = (item.variations || []).map(v => ({
      id:    v.id,
      name:  v.item_variation_data?.name || '',
      price: v.item_variation_data?.price_money?.amount
             ? (v.item_variation_data.price_money.amount / 100).toFixed(0)
             : null,
    }));

    if (variations.length === 1 && variations[0].name === 'Default Title') continue;

    const imgId      = item.image_ids?.[0];
    const rawImgUrl  = imgId ? imageMap[imgId] : null;
    const imgUrl     = rawImgUrl ? `${SELF}/image?id=${encodeURIComponent(imgId)}` : null;

    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const url  = `https://david-nicholson-art.square.site/product/${slug}/${obj.id}`;

    const attrs = obj.custom_attribute_values;
    let originalAvail = false;
    if (attrs) {
      for (const val of Object.values(attrs)) {
        if (val.name === 'Original Available') { originalAvail = val.boolean_value === true; break; }
      }
    }

    products.push({
      id:         obj.id,
      title:      item.name,
      desc:       item.description || '',
      img:        imgUrl,
      rawImg:     rawImgUrl,
      url,
      variations,
      year:       extractYear(obj),
      createdAt:  obj.created_at || '',
      originalAvail,
    });
  }

  products.sort((a, b) => {
    const ya = a.year ? parseInt(a.year) : 0;
    const yb = b.year ? parseInt(b.year) : 0;
    if (yb !== ya) return yb - ya;
    if (a.createdAt !== b.createdAt) return (b.createdAt || '').localeCompare(a.createdAt || '');
    return a.title.localeCompare(b.title);
  });

  return products;
}

async function getProducts() {
  const products = await buildProductList();
  return ok({ products });
}

async function getOriginals() {
  const SELF = process.env.API_URL || 'https://doqg3wcta7.execute-api.us-east-1.amazonaws.com';

  const [itemsRes, imagesRes, configRes, paintingsRes] = await Promise.all([
    squareGet(`/v2/catalog/list?types=ITEM&location_id=${SQUARE_LOC}`),
    squareGet(`/v2/catalog/list?types=IMAGE`),
    dynamo.send(new GetCommand({ TableName: PAINTINGS_TABLE, Key: { id: '__config__' } })),
    dynamo.send(new ScanCommand({ TableName: PAINTINGS_TABLE, ProjectionExpression: 'squareId, atGallery, #t, priceOverride', ExpressionAttributeNames: { '#t': 'title' } })),
  ]);

  const rate = configRes.Item?.rate ?? null;

  const imageMap = {};
  for (const img of (imagesRes.objects || [])) {
    if (img.image_data?.url) imageMap[img.id] = img.image_data.url;
  }

  // Build sets of Square IDs / titles for paintings currently at a gallery,
  // plus a price-override lookup keyed by Square ID and normalized title
  const normT = t => (t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const gallerySquareIds   = new Set();
  const galleryNormTitles  = new Set();
  const overrideBySquareId = {};
  const overrideByTitle    = {};
  for (const p of (paintingsRes.Items || [])) {
    if (p.atGallery) {
      if (p.squareId) gallerySquareIds.add(p.squareId);
      if (p.title)    galleryNormTitles.add(normT(p.title));
    }
    if (p.priceOverride != null) {
      if (p.squareId) overrideBySquareId[p.squareId] = p.priceOverride;
      if (p.title)    overrideByTitle[normT(p.title)] = p.priceOverride;
    }
  }

  // Read a named custom attribute value from an object
  function getAttr(obj, name) {
    const attrs = obj.custom_attribute_values;
    if (!attrs) return null;
    for (const val of Object.values(attrs)) {
      if (val.name === name) {
        // Toggle attributes come back as boolean_value, others as string_value
        if (val.boolean_value !== undefined) return val.boolean_value;
        return val.string_value ?? val.number_value ?? null;
      }
    }
    return null;
  }

  const originals = [];
  for (const obj of (itemsRes.objects || [])) {
    const item = obj.item_data;
    if (!item) continue;

    // Filter: Original Available toggle must be true
    const originalAvailable = getAttr(obj, 'Original Available');
    if (!originalAvailable) continue;

    const imgId  = item.image_ids?.[0];
    const rawImg = imgId ? imageMap[imgId] : null;
    const img    = rawImg ? `${SELF}/image?id=${encodeURIComponent(imgId)}` : null;
    const year   = getAttr(obj, 'Year') || extractYear(obj);
    const width  = parseFloat(getAttr(obj, 'Width')) || null;
    const height = parseFloat(getAttr(obj, 'Height')) || null;
    const medium = getAttr(obj, 'Medium') || null;

    const override = overrideBySquareId[obj.id] ?? overrideByTitle[normT(item.name)] ?? null;
    let price = null;
    if (override != null) {
      price = override;
    } else if (rate && width && height) {
      price = Math.ceil((width * height * rate) / 50) * 50;
    }

    const atGallery = gallerySquareIds.has(obj.id) || galleryNormTitles.has(normT(item.name)) || null;

    originals.push({
      id:     obj.id,
      title:  item.name,
      desc:   item.description || '',
      img,
      rawImg,
      year,
      width,
      height,
      medium,
      price,
      atGallery,
    });
  }

  originals.sort((a, b) => {
    const ya = a.year ? parseInt(a.year) : 0;
    const yb = b.year ? parseInt(b.year) : 0;
    if (yb !== ya) return yb - ya;
    return a.title.localeCompare(b.title);
  });

  return ok({ originals });
}

async function getBoothLayout(id) {
  if (!id) return err('Missing id', 400);
  const res = await dynamo.send(new GetCommand({ TableName: BOOTH_TABLE, Key: { id } }));
  if (!res.Item) return err('Not found', 404);
  return ok({ layout: res.Item });
}

async function putBoothLayout(body) {
  const { id, title, wallsJson } = body;
  if (!id) return err('Missing id', 400);
  const item = {
    id,
    title: (title || 'Untitled').slice(0, 120),
    wallsJson: wallsJson || '[]',
    updatedAt: Date.now(),
  };
  await dynamo.send(new PutCommand({ TableName: BOOTH_TABLE, Item: item }));
  return ok({ saved: true });
}

async function deleteBoothLayout(id) {
  if (!id) return err('Missing id', 400);
  await dynamo.send(new DeleteCommand({ TableName: BOOTH_TABLE, Key: { id } }));
  return ok({ deleted: true });
}

async function listBoothLayouts() {
  const res = await dynamo.send(new ScanCommand({
    TableName: BOOTH_TABLE,
    ProjectionExpression: 'id, #t, updatedAt',
    ExpressionAttributeNames: { '#t': 'title' },
  }));
  const layouts = (res.Items || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return ok({ layouts });
}


// ── Register (admin.html Sell window — checkout via Square POS API / Tap to Pay) ──
// Public by design: admin must be able to log a paid cart when iOS returns from the
// Square app and the admin session (in-memory token) is gone. Nothing here can write data without a real,
// completed Square order whose total matches the cart (see registerComplete).
function regNormTitle(t) { return (t || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

// Square variation names are mat sizes ("9 x 12 Matted to 12 x 16", "5 x 7 Matted to 8 x 10").
// 12x16 mat = large print, 8x10 mat = small print; otherwise fall back to price ($40+ = large).
function regSizeOf(name, cents) {
  const n = (name || '').toLowerCase();
  if (/12\s*x\s*16|16\s*x\s*12/.test(n)) return 'large';
  if (/8\s*x\s*10|10\s*x\s*8/.test(n))   return 'small';
  if (/large/.test(n)) return 'large';
  if (/small/.test(n)) return 'small';
  return (cents || 0) >= 4000 ? 'large' : 'small';
}

function regTaxCents(subtotalCents, rateMilli) {
  // rateMilli = tax rate in thousandths of a percent (9.35% → 9350). Same formula as sellTaxCents() in admin.html.
  return Math.round(subtotalCents * rateMilli / 100000);
}

async function regPaintingIndex() {
  const res = await dynamo.send(new ScanCommand({ TableName: PAINTINGS_TABLE }));
  const bySquare = {}, byTitle = {};
  for (const p of (res.Items || [])) {
    if (p.id === '__config__' || p.type === 'priceList' || p.marketItem) continue;
    if (p.squareId) bySquare[p.squareId] = p;
    byTitle[regNormTitle(p.title)] = p;
  }
  return { bySquare, byTitle };
}

async function registerCatalog(cors) {
  const [itemsRes, imagesRes, idx] = await Promise.all([
    squareGet(`/v2/catalog/list?types=ITEM&location_id=${SQUARE_LOC}`),
    squareGet(`/v2/catalog/list?types=IMAGE`),
    regPaintingIndex(),
  ]);
  const imageIds = new Set((imagesRes.objects || []).filter(o => o.image_data?.url).map(o => o.id));
  const SELF = process.env.API_URL || 'https://davidnicholsonart.com';

  const prints = [];
  for (const obj of (itemsRes.objects || [])) {
    const item = obj.item_data;
    if (!item?.name) continue;
    const vars = item.variations || [];
    const originalOnly = vars.length === 1 && vars[0].item_variation_data?.name === 'Default Title';
    let market = false;
    for (const val of Object.values(obj.custom_attribute_values || {})) {
      if (val.name === 'Market Item' && val.boolean_value === true) market = true;
    }
    if (market) continue;
    const variations = originalOnly ? [] : vars
      .map(v => {
        const cents = v.item_variation_data?.price_money?.amount;
        if (!cents) return null;
        const name = v.item_variation_data?.name || '';
        return { id: v.id, name, cents, size: regSizeOf(name, cents) };
      })
      .filter(Boolean)
      .sort((a, b) => a.cents - b.cents);
    // Originals-only items are included (no variations) so the admin Sale window has their images
    if (!variations.length && !originalOnly) continue;
    const painting = idx.bySquare[obj.id] || idx.byTitle[regNormTitle(item.name)] || null;
    const imgId = item.image_ids?.[0];
    prints.push({
      id: obj.id,
      title: item.name,
      img: imgId && imageIds.has(imgId) ? `${SELF}/image?id=${encodeURIComponent(imgId)}` : null,
      variations,
      stock: painting ? { large: painting.stock?.large ?? 0, small: painting.stock?.small ?? 0 } : null,
    });
  }
  prints.sort((a, b) => a.title.localeCompare(b.title));

  return ok({ prints, appId: process.env.SQUARE_APP_ID || '' }, cors);
}

async function registerComplete(body, cors) {
  const txn = String(body.transactionId || '');
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(txn)) return err('Missing or invalid transaction ID', 400, cors);

  let st;
  try { st = typeof body.state === 'string' ? JSON.parse(body.state) : body.state; } catch { st = null; }
  // state.l = [[variationId, channel ('f' fair | 'o' online), usState ('KS'|'MO'|''), priceCents?], ...]; state.r = tax rate (thousandths of a percent)
  // priceCents is the (possibly adjusted) price from the Sell window; if absent, the live catalog price is used.
  const rawLines = Array.isArray(st?.l) ? st.l : [];
  const varIds = rawLines.map(x => String(Array.isArray(x) ? x[0] : ''));
  const lineMeta = rawLines.map(x => ({
    channel: Array.isArray(x) && x[1] === 'o' ? 'online' : 'fair',
    usState: Array.isArray(x) && (x[2] === 'KS' || x[2] === 'MO') ? x[2] : '',
    cents: Array.isArray(x) && Number.isInteger(x[3]) && x[3] >= 0 && x[3] <= 10000000 ? x[3] : null,
    original: Array.isArray(x) && x[4] === 'o',   // 'o' = original painting: ref is the dna-paintings id, price must be given
  }));
  const rateMilli = Number(st?.r);
  const cartId = /^[a-z0-9]{6,24}$/.test(String(st?.c || '')) ? String(st.c) : '';
  if (!varIds.length || varIds.length > 30 || varIds.some(v => !v) || !Number.isInteger(rateMilli) || rateMilli < 0 || rateMilli > 20000) {
    return err('Cart data missing from Square return', 400, cors);
  }

  // 1. The payment must be a real, completed Square order (POS API transaction ID = order ID)
  const orderRes = await squareGet(`/v2/orders/${encodeURIComponent(txn)}`);
  const order = orderRes.order;
  if (!order) return err('Square order not found', 404, cors);
  if (order.state !== 'COMPLETED') return err(`Square order is ${order.state}, not completed`, 409, cors);
  const ageMs = Date.now() - Date.parse(order.created_at || 0);
  if (!(ageMs >= 0 && ageMs < 72 * 3600 * 1000)) return err('Square order is too old to log here', 409, cors);

  // 2. Resolve each line's print/size from the live catalog. Prices come from the cart (adjustable in the Sell
  //    window); the check below still requires Square to have actually charged exactly that total + tax.
  const uniq = [...new Set(varIds.filter((id, i) => !lineMeta[i].original))];
  const cat = uniq.length
    ? await squarePost('/v2/catalog/batch-retrieve', { object_ids: uniq, include_related_objects: true })
    : { objects: [] };
  const itemsById = {};
  for (const o of [...(cat.objects || []), ...(cat.related_objects || [])]) {
    if (o.type === 'ITEM') itemsById[o.id] = o;
  }
  const varById = {};
  for (const o of (cat.objects || [])) {
    if (o.type !== 'ITEM_VARIATION') continue;
    const vd = o.item_variation_data || {};
    const item = itemsById[vd.item_id];
    varById[o.id] = {
      itemId: vd.item_id,
      title: item?.item_data?.name || '',
      cents: vd.price_money?.amount || 0,
      size: regSizeOf(vd.name, vd.price_money?.amount),
    };
  }
  const origRows = {};
  for (const [i, id] of varIds.entries()) {
    if (!lineMeta[i].original || origRows[id] !== undefined) continue;
    origRows[id] = (await dynamo.send(new GetCommand({ TableName: PAINTINGS_TABLE, Key: { id } }))).Item || null;
  }
  const lines = varIds.map((id, i) => {
    if (lineMeta[i].original) {
      const p = origRows[id];
      return p && lineMeta[i].cents != null ? { paintingId: p.id, title: p.title, size: 'original', cents: lineMeta[i].cents } : null;
    }
    return varById[id] && { ...varById[id], cents: lineMeta[i].cents ?? varById[id].cents };
  });
  if (lines.some(l => !l || l.cents == null)) return err('An item in the cart no longer exists in Square or inventory', 409, cors);

  const subtotal = lines.reduce((a, l) => a + l.cents, 0);
  const taxTotal = regTaxCents(subtotal, rateMilli);
  const expected = subtotal + taxTotal;
  // Split the tax across lines (per-line rounding, remainder on the last line) so line taxes sum to what was charged
  const lineTax = lines.map(l => regTaxCents(l.cents, rateMilli));
  lineTax[lineTax.length - 1] += taxTotal - lineTax.reduce((a, t) => a + t, 0);
  const paid = (order.total_money?.amount || 0) - (order.total_tip_money?.amount || 0);
  if (paid !== expected) {
    return err(`Square charged $${(paid / 100).toFixed(2)} but the cart totals $${(expected / 100).toFixed(2)} — log these by hand in admin`, 409, cors);
  }

  // 3. Log one sale per print (idempotent: sale IDs derive from the transaction) and take stock out
  const idx = await regPaintingIndex();
  const date = new Date(order.created_at).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  const logged = [], unmatched = [];
  let already = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const painting = l.paintingId ? origRows[l.paintingId] : (idx.bySquare[l.itemId] || idx.byTitle[regNormTitle(l.title)]);
    if (!painting) { unmatched.push(l.title); continue; }
    const meta = lineMeta[i];
    const sale = {
      id: `sq_${txn}_${i}`,
      paintingId: painting.id,
      date,
      type: l.size,
      channel: meta.channel,
      price: l.cents / 100,
      tax: lineTax[i] / 100,
      squareTxn: txn,
      ...(cartId ? { cartId } : {}),
      ...(meta.channel === 'fair' && meta.usState ? { state: meta.usState } : {}),
    };
    try {
      await dynamo.send(new PutCommand({ TableName: SALES_TABLE, Item: sale, ConditionExpression: 'attribute_not_exists(id)' }));
    } catch (e) {
      if (e.name === 'ConditionalCheckFailedException') { already++; continue; }
      throw e;
    }
    if (l.size !== 'original') try {
      await dynamo.send(new UpdateCommand({
        TableName: PAINTINGS_TABLE,
        Key: { id: painting.id },
        UpdateExpression: 'SET #stock.#sz = if_not_exists(#stock.#sz, :z) - :one',
        ConditionExpression: 'attribute_exists(#stock)',
        ExpressionAttributeNames: { '#stock': 'stock', '#sz': l.size },
        ExpressionAttributeValues: { ':z': 0, ':one': 1 },
      }));
    } catch (e) { console.error('Register stock decrement failed', painting.id, e.name); }
    logged.push({ paintingId: painting.id, title: painting.title, size: l.size, price: l.cents / 100 });
  }

  return ok({ logged, already, unmatched, total: paid / 100 }, cors);
}

// Lets the admin window that started a checkout learn it was logged — needed because iOS often
// returns from Square into Safari, not the home-screen app that still holds the cart.
async function registerStatus(cartId, cors) {
  if (!/^[a-z0-9]{6,24}$/.test(String(cartId || ''))) return err('Invalid cart id', 400, cors);
  let found = false, ExclusiveStartKey;
  do {
    const res = await dynamo.send(new ScanCommand({
      TableName: SALES_TABLE,
      FilterExpression: 'cartId = :c',
      ExpressionAttributeValues: { ':c': cartId },
      ProjectionExpression: 'id',
      ExclusiveStartKey,
    }));
    if ((res.Items || []).length) found = true;
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (!found && ExclusiveStartKey);
  return ok({ done: found }, cors);
}

async function getFeed() {
  const products = await buildProductList();
  const SITE = 'https://davidnicholsonart.com';

  const items = products.flatMap(p => {
    if (!p.variations || !p.variations.length) return [];
    return p.variations.map(v => {
      const price = v.price ? parseFloat(v.price).toFixed(2) : '0.00';
      const id = `${p.id}_${v.id}`;
      const title = p.variations.length > 1 ? `${p.title} — ${v.name}` : p.title;
      const desc = p.desc
        ? xmlEsc(p.desc)
        : xmlEsc(`${p.title} — fine art print by David Nicholson. Available in multiple sizes.`);
      const img = p.rawImg || p.img || '';
      const link = `${SITE}/gallery.html?product_id=${encodeURIComponent(id)}`;

      return `    <item>
      <g:id>${xmlEsc(id)}</g:id>
      <g:item_group_id>${xmlEsc(p.id)}</g:item_group_id>
      <title>${xmlEsc(title)}</title>
      <description>${desc}</description>
      <link>${link}</link>
      <g:image_link>${xmlEsc(img)}</g:image_link>
      <g:price>${price} USD</g:price>
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>David Nicholson Art</g:brand>
      <g:google_product_category>Arts &amp; Entertainment &gt; Hobbies &amp; Creative Arts &gt; Artwork &gt; Prints</g:google_product_category>
      <g:product_type>Fine Art Print</g:product_type>
    </item>`;
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>David Nicholson Art</title>
    <link>${SITE}/gallery.html</link>
    <description>Fine art prints by David Nicholson — Kansas-based artist.</description>
${items.join('\n')}
  </channel>
</rss>`;

  return {
    statusCode: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    },
    body: xml,
  };
}

function xmlEsc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function getHero() {
  const products = await buildProductList();
  const recent = products.filter(p => p.img && p.year && [2025, 2026].includes(parseInt(p.year)));
  const pool = recent.length ? recent : products.filter(p => p.img);
  if (!pool.length) return err('No products with images', 404);
  const p = pool[Math.floor(Math.random() * pool.length)];
  return ok({ img: p.img, title: p.title, id: p.id });
}

async function proxyImage(imageId) {
  const res = await squareGet(`/v2/catalog/object/${encodeURIComponent(imageId)}`);
  const url = res.object?.image_data?.url;
  if (!url) return { statusCode: 404, headers: CORS, body: 'Not found' };

  const { buffer, contentType } = await fetchBinary(url);
  return {
    statusCode: 200,
    headers: {
      ...CORS,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
    body: buffer.toString('base64'),
    isBase64Encoded: true,
  };
}

async function sendLink(body) {
  const { type, to, url, title } = body;
  if (!type || !to || !url) return err('Missing required fields');
  if (type !== 'email') return err('Invalid type');
  if (!to.includes('@')) return err('Invalid email');
  const text = `Here's the print you were looking at:\n\n${title || 'David Nicholson Art'}\n${url}\n\ndavidnicholsonart.com`;
  await sendEmail({ to, subject: 'Print from David Nicholson Art', body: text });
  return ok({ sent: true });
}

async function guestbook(body) {
  const { name, email, note, subscribed } = body;
  if (!name || !email) return err('Missing name or email');

  const time = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
  const text = `New guest book entry:\n\nName:  ${name}\nEmail: ${email}\nNote:  ${note || '(none)'}\nSubscribed: ${subscribed ? 'yes' : 'no'}\nTime:  ${time}`;

  await Promise.all([
    saveGuest({ name, email, note, subscribed }),
    sendEmail({ to: NOTIFY_EMAIL, subject: `Guest Book — ${name}`, body: text }),
  ]);

  return ok({ received: true });
}

async function checkout(body) {
  const { items } = body;
  if (!items || !items.length) return err('No items in cart', 400);

  const lineItems = items.map(item => ({
    quantity: '1',
    catalog_object_id: item.variation_id,
  }));

  const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const linkRes = await squarePost('/v2/online-checkout/payment-links', {
    idempotency_key: idempotencyKey,
    order: {
      location_id: SQUARE_LOC,
      line_items:  lineItems,
    },
    checkout_options: {
      ask_for_shipping_address: true,
      redirect_url: 'https://davidnicholsonart.com/gallery.html?success=1',
    },
  });

  if (linkRes.errors) {
    console.error('Square payment link error:', linkRes.errors);
    return err(linkRes.errors[0]?.detail || 'Failed to create payment link', 502);
  }

  const checkoutUrl = linkRes.payment_link?.url;
  if (!checkoutUrl) return err('No checkout URL returned from Square', 502);

  const squareOrder = linkRes.related_resources?.orders?.[0];
  if (squareOrder) saveOrder(squareOrder).catch(e => console.error('DynamoDB saveOrder error:', e));

  return ok({ checkout_url: checkoutUrl });
}

// ── Online sale logging (gallery.html payment-link orders) ──
// Server-side sweep: no dependence on the customer's browser coming back. Runs at the start of every
// admin load (adminGetPaintings) and on the monthly scheduled task. Asks Square for paid, shipped orders
// at the online location since ONLINE_LOG_SINCE and logs any that aren't in dna-sales yet.
// Idempotent: sale IDs derive from the order ID (sq_{orderId}_{n}) with conditional puts.
// Orders before ONLINE_LOG_SINCE were logged by hand (Sept 12 + Sept 21 2026) — don't move it earlier.
const ONLINE_LOG_SINCE = '2026-09-22T00:00:00Z';

function isPaidOnlineOrder(order) {
  if (!order || order.location_id !== SQUARE_LOC || order.state === 'CANCELED') return false;
  if (!(order.fulfillments || []).some(f => f.type === 'SHIPMENT')) return false;   // fair/register orders have no shipment
  if ((order.refunds || []).length) return false;                                   // refunded before it was ever synced
  return (order.tenders || []).length > 0 && order.net_amount_due_money?.amount === 0;
}

async function logOnlineOrder(order) {
  const orderId = order.id;
  const ship = order.fulfillments.find(f => f.type === 'SHIPMENT');
  const paidAt = order.tenders[0].created_at || order.created_at;
  const lineItems = (order.line_items || []).filter(li => li.catalog_object_id);
  const uniq = [...new Set(lineItems.map(li => li.catalog_object_id))];
  const cat = uniq.length ? await squarePost('/v2/catalog/batch-retrieve', { object_ids: uniq }) : { objects: [] };
  const itemIdByVar = {};
  for (const o of (cat.objects || [])) if (o.type === 'ITEM_VARIATION') itemIdByVar[o.id] = o.item_variation_data?.item_id;

  const idx = await regPaintingIndex();
  const date = new Date(paidAt).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  const shipState = String(ship.shipment_details?.recipient?.address?.administrative_district_level_1 || '').toUpperCase().slice(0, 3);
  const syncedAt = new Date().toISOString();   // admin.html shows a "new online sale" alert for rows newer than the device last dismissed
  let logged = 0, already = 0, n = 0;
  const unmatched = [];
  for (const li of lineItems) {
    const qty = Math.max(1, parseInt(li.quantity, 10) || 1);
    const unitCents = li.base_price_money?.amount || 0;
    const size = regSizeOf(li.variation_name, unitCents);
    const itemId = itemIdByVar[li.catalog_object_id];
    const painting = (itemId && idx.bySquare[itemId]) || idx.byTitle[regNormTitle(li.name)];
    for (let u = 0; u < qty; u++, n++) {
      if (!painting) { unmatched.push(li.name); continue; }
      const sale = {
        id: `sq_${orderId}_${n}`,
        paintingId: painting.id,
        date,
        type: size,
        channel: 'online',
        price: unitCents / 100,
        squareTxn: orderId,
        // Ship-to state, kept separate from `state` (which means the fair's state for fair sales)
        ...(shipState ? { shipState } : {}),
        syncedAt,
      };
      try {
        await dynamo.send(new PutCommand({ TableName: SALES_TABLE, Item: sale, ConditionExpression: 'attribute_not_exists(id)' }));
      } catch (e) {
        if (e.name === 'ConditionalCheckFailedException') { already++; continue; }
        throw e;
      }
      try {
        await dynamo.send(new UpdateCommand({
          TableName: PAINTINGS_TABLE,
          Key: { id: painting.id },
          UpdateExpression: 'SET #stock.#sz = if_not_exists(#stock.#sz, :z) - :one',
          ConditionExpression: 'attribute_exists(#stock)',
          ExpressionAttributeNames: { '#stock': 'stock', '#sz': size },
          ExpressionAttributeValues: { ':z': 0, ':one': 1 },
        }));
      } catch (e) { console.error('Online stock decrement failed', painting.id, e.name); }
      logged++;
    }
  }
  if (unmatched.length) console.warn('Online order lines not matched to a painting', orderId, unmatched);
  // Marker: this order has been handled. The sync checks this (not the sale rows), so deleting or editing a
  // synced sale in admin — e.g. after a refund — never causes it to be re-logged. paintingId '__sync__' matches
  // no painting, so admin never displays it.
  await dynamo.send(new PutCommand({ TableName: SALES_TABLE, Item: { id: `sync_${orderId}`, paintingId: '__sync__', squareTxn: orderId, syncedAt, logged, unmatched } }));
  return { logged, already, unmatched };
}

async function syncOnlineOrders() {
  const orders = [];
  let cursor;
  for (let page = 0; page < 5; page++) {
    const res = await squarePost('/v2/orders/search', {
      location_ids: [SQUARE_LOC],
      limit: 100,
      ...(cursor ? { cursor } : {}),
      query: {
        filter: {
          state_filter: { states: ['OPEN', 'COMPLETED'] },
          fulfillment_filter: { fulfillment_types: ['SHIPMENT'] },
          date_time_filter: { created_at: { start_at: ONLINE_LOG_SINCE } },
        },
        sort: { sort_field: 'CREATED_AT', sort_order: 'ASC' },
      },
    });
    if (res.errors) { console.error('Online order sync: search failed', res.errors); break; }
    orders.push(...(res.orders || []));
    cursor = res.cursor;
    if (!cursor) break;
  }
  let logged = 0;
  for (const order of orders.filter(isPaidOnlineOrder)) {
    // Skip orders already handled (marker written by logOnlineOrder)
    const done = await dynamo.send(new GetCommand({ TableName: SALES_TABLE, Key: { id: `sync_${order.id}` } }));
    if (done.Item) continue;
    logged += (await logOnlineOrder(order)).logged;
  }
  if (logged) console.log('Online order sync: logged', logged, 'sale(s)');
  return logged;
}

async function cartRedirect(queryParams) {
  let lineItems = [];

  if (queryParams?.products) {
    let items;
    try { items = JSON.parse(queryParams.products); } catch { items = []; }
    for (const item of items) {
      if (!item.id) continue;
      const lastUnderscore = item.id.lastIndexOf('_');
      if (lastUnderscore === -1) continue;
      const variationId = item.id.slice(lastUnderscore + 1);
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      for (let i = 0; i < qty; i++) {
        lineItems.push({ quantity: '1', catalog_object_id: variationId });
      }
    }
  }

  if (!lineItems.length && queryParams?.product_id) {
    const lastUnderscore = queryParams.product_id.lastIndexOf('_');
    if (lastUnderscore !== -1) {
      const variationId = queryParams.product_id.slice(lastUnderscore + 1);
      lineItems.push({ quantity: '1', catalog_object_id: variationId });
    }
  }

  if (!lineItems.length) {
    return { statusCode: 302, headers: { ...CORS, Location: 'https://davidnicholsonart.com/gallery.html' }, body: '' };
  }

  const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const linkRes = await squarePost('/v2/online-checkout/payment-links', {
    idempotency_key: idempotencyKey,
    order: { location_id: SQUARE_LOC, line_items: lineItems },
    checkout_options: {
      ask_for_shipping_address: true,
      redirect_url: 'https://davidnicholsonart.com/gallery.html?success=1',
    },
  });

  if (linkRes.errors) {
    console.error('Square cart redirect error:', linkRes.errors);
    return { statusCode: 302, headers: { ...CORS, Location: 'https://davidnicholsonart.com/gallery.html' }, body: '' };
  }

  const checkoutUrl = linkRes.payment_link?.url;
  if (!checkoutUrl) {
    return { statusCode: 302, headers: { ...CORS, Location: 'https://davidnicholsonart.com/gallery.html' }, body: '' };
  }

  const squareOrder = linkRes.related_resources?.orders?.[0];
  if (squareOrder) saveOrder(squareOrder).catch(e => console.error('DynamoDB saveOrder error:', e));

  return { statusCode: 302, headers: { ...CORS, Location: checkoutUrl }, body: '' };
}

// ── Admin: Paintings ──

async function adminGetPaintings(cors) {
  // Log any paid online (gallery) orders first so they show in this load's sales + stock.
  // Never let a Square hiccup block admin: failures are logged and the load continues; capped at 8s.
  try {
    await Promise.race([syncOnlineOrders(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))]);
  } catch (e) { console.error('Online order sync skipped:', e.message); }

  const [paintingsRes, salesRes, squareRes, configRes] = await Promise.all([
    dynamo.send(new ScanCommand({ TableName: PAINTINGS_TABLE })),
    dynamo.send(new ScanCommand({ TableName: SALES_TABLE })),
    squareGet(`/v2/catalog/list?types=ITEM&location_id=${SQUARE_LOC}`),
    dynamo.send(new GetCommand({ TableName: PAINTINGS_TABLE, Key: { id: '__config__' } })),
  ]);

  function normTitle(t) { return (t || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

  // Build Square catalog map — keyed by both Square item ID and normalized title
  // Skips originals-only items (single "Default Title" variation)
  const squareById = {};    // squareItemId → square data
  const squareByTitle = {}; // normTitle    → square data
  for (const obj of (squareRes.objects || [])) {
    const item = obj.item_data;
    if (!item?.name) continue;
    const variations = item.variations || [];
    if (variations.length === 1 && variations[0].item_variation_data?.name === 'Default Title') continue;

    const attrs = obj.custom_attribute_values || {};
    function getAttr(name) {
      for (const val of Object.values(attrs)) {
        if (val.name === name) {
          if (val.boolean_value !== undefined) return val.boolean_value;
          return val.string_value ?? val.number_value ?? null;
        }
      }
      return null;
    }

    const squareData = {
      squareId:     obj.id,
      title:        item.name,
      originalAvail: getAttr('Original Available') === true,
      marketItem:   getAttr('Market Item') === true,
      year:         getAttr('Year') || extractYear(obj) || '',
      width:        parseFloat(getAttr('Width')) || null,
      height:       parseFloat(getAttr('Height')) || null,
      medium:       getAttr('Medium') || '',
    };

    squareById[obj.id]              = squareData;
    squareByTitle[normTitle(item.name)] = squareData;
  }

  const salesByPainting = {};
  for (const s of (salesRes.Items || [])) {
    if (!salesByPainting[s.paintingId]) salesByPainting[s.paintingId] = [];
    salesByPainting[s.paintingId].push(s);
  }

  // Map existing DynamoDB records, matching Square by ID first, then title
  // If matched by title and no squareId stored yet, back-fill it in DynamoDB
  const matchedSquareIds = new Set();
  const backfillPromises = [];

  const paintings = (paintingsRes.Items || [])
    .filter(p => p.id !== '__config__' && p.type !== 'priceList')
    .map(p => {
      const sq = (p.squareId && squareById[p.squareId])
        || squareByTitle[normTitle(p.title)]
        || null;

      if (sq) {
        matchedSquareIds.add(sq.squareId);
        // Back-fill squareId onto DynamoDB record if missing
        if (!p.squareId) {
          backfillPromises.push(
            dynamo.send(new PutCommand({
              TableName: PAINTINGS_TABLE,
              Item: { ...p, squareId: sq.squareId },
            }))
          );
        }
      }

      return {
        ...p,
        squareId:     sq?.squareId ?? p.squareId ?? null,
        sales:        salesByPainting[p.id] || [],
        originalAvail: sq ? sq.originalAvail : null,
        medium:       sq?.medium || p.medium || '',
      };
    });

  // Auto-create DynamoDB records for Square items with no match
  const autoCreatePromises = [];
  for (const sq of Object.values(squareById)) {
    if (matchedSquareIds.has(sq.squareId)) continue;
    if (sq.marketItem) continue;
    const id   = 'p' + Date.now() + Math.floor(Math.random() * 1000);
    const item = {
      id,
      squareId: sq.squareId,
      title:    sq.title,
      year:     sq.year || '',
      month:    '',
      width:    sq.width || 0,
      height:   sq.height || 0,
      medium:   sq.medium || '',
      stock:    { large: 0, small: 0 },
      momsHas:  false,
    };
    paintings.push({
      ...item,
      sales:        [],
      originalAvail: sq.originalAvail,
    });
    autoCreatePromises.push(
      dynamo.send(new PutCommand({ TableName: PAINTINGS_TABLE, Item: item }))
    );
  }

  // Fire DynamoDB writes in background — don't block the response
  await Promise.all([...backfillPromises, ...autoCreatePromises]);

  const rate = configRes.Item?.rate ?? 1.10;
  const printCostSmall = configRes.Item?.printCostSmall ?? 5;
  const printCostLarge = configRes.Item?.printCostLarge ?? 12;
  const irsRates = configRes.Item?.irsRates || {};
  return ok({ paintings, rate, printCostSmall, printCostLarge, irsRates }, cors);
}

async function adminAddPainting(body, cors) {
  const { title, month, year, width, height, stock, momsHas, atGallery, galleryStockNo, priceOverride } = body;
  if (!title || !year || !width || !height) return err('Missing required fields', 400, cors);
  const id = 'p' + Date.now();
  const item = { id, title, month: month || '', year, width, height, stock: stock || { large: 0, small: 0 }, momsHas: !!momsHas, atGallery: atGallery || '', galleryStockNo: galleryStockNo || '' };
  if (priceOverride != null && !isNaN(priceOverride)) item.priceOverride = Number(priceOverride);
  await dynamo.send(new PutCommand({ TableName: PAINTINGS_TABLE, Item: item }));
  return ok({ painting: item }, cors);
}

async function adminUpdatePainting(id, body, cors) {
  const { title, month, year, width, height, stock, momsHas, atGallery, galleryStockNo, priceOverride } = body;
  if (!title || !year || !width || !height) return err('Missing required fields', 400, cors);
  const item = { id, title, month: month || '', year, width, height, stock: stock || { large: 0, small: 0 }, momsHas: !!momsHas, atGallery: atGallery || '', galleryStockNo: galleryStockNo || '' };
  if (priceOverride != null && !isNaN(priceOverride)) item.priceOverride = Number(priceOverride);
  await dynamo.send(new PutCommand({ TableName: PAINTINGS_TABLE, Item: item }));
  return ok({ painting: item }, cors);
}

// ── Price Lists (named alternate price sets, e.g. "Fair pricing" vs "Online") ──
// Stored as items in the paintings table with id prefix 'pricelist_' so no new
// table/infra is needed. Shape: { id, type:'priceList', name, prices:{paintingId:price}, createdAt, updatedAt }
async function adminGetPriceLists(cors) {
  const res = await dynamo.send(new ScanCommand({ TableName: PAINTINGS_TABLE }));
  const lists = (res.Items || []).filter(p => p.type === 'priceList');
  lists.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return ok({ priceLists: lists }, cors);
}

async function adminAddPriceList(body, cors) {
  const { name, prices } = body;
  if (!name || !name.trim()) return err('Name is required', 400, cors);
  if (!prices || typeof prices !== 'object') return err('Missing prices', 400, cors);
  const id = 'pricelist_' + Date.now();
  const item = { id, type: 'priceList', name: name.trim(), prices, createdAt: new Date().toISOString() };
  await dynamo.send(new PutCommand({ TableName: PAINTINGS_TABLE, Item: item }));
  return ok({ priceList: item }, cors);
}

async function adminUpdatePriceList(id, body, cors) {
  const existing = await dynamo.send(new GetCommand({ TableName: PAINTINGS_TABLE, Key: { id } }));
  if (!existing.Item || existing.Item.type !== 'priceList') return err('Price list not found', 404, cors);
  const { name, prices } = body;
  const item = {
    ...existing.Item,
    name: name != null && name.trim() ? name.trim() : existing.Item.name,
    prices: prices && typeof prices === 'object' ? prices : existing.Item.prices,
    updatedAt: new Date().toISOString(),
  };
  await dynamo.send(new PutCommand({ TableName: PAINTINGS_TABLE, Item: item }));
  return ok({ priceList: item }, cors);
}

async function adminDeletePriceList(id, cors) {
  await dynamo.send(new DeleteCommand({ TableName: PAINTINGS_TABLE, Key: { id } }));
  return ok({ deleted: true }, cors);
}

async function adminApplyPriceList(id, cors) {
  const res = await dynamo.send(new GetCommand({ TableName: PAINTINGS_TABLE, Key: { id } }));
  if (!res.Item || res.Item.type !== 'priceList') return err('Price list not found', 404, cors);
  const prices = res.Item.prices || {};
  const entries = Object.entries(prices);
  let applied = 0;
  for (const [paintingId, price] of entries) {
    const p = await dynamo.send(new GetCommand({ TableName: PAINTINGS_TABLE, Key: { id: paintingId } }));
    if (!p.Item || p.Item.type === 'priceList') continue;
    await dynamo.send(new PutCommand({ TableName: PAINTINGS_TABLE, Item: { ...p.Item, priceOverride: Number(price) } }));
    applied++;
  }
  return ok({ applied }, cors);
}

async function adminDeletePainting(id, cors) {
  await dynamo.send(new DeleteCommand({ TableName: PAINTINGS_TABLE, Key: { id } }));
  const salesRes = await dynamo.send(new QueryCommand({
    TableName: SALES_TABLE,
    IndexName: 'paintingId-index',
    KeyConditionExpression: 'paintingId = :pid',
    ExpressionAttributeValues: { ':pid': id },
  }));
  await Promise.all((salesRes.Items || []).map(s =>
    dynamo.send(new DeleteCommand({ TableName: SALES_TABLE, Key: { id: s.id } }))
  ));
  return ok({ deleted: true }, cors);
}

async function adminAddSale(paintingId, body, cors) {
  const { date, type, channel, price, pct, net, state } = body;
  if (!type || !channel || price == null) return err('Missing required fields', 400, cors);
  const id = 's' + Date.now();
  const item = { id, paintingId, date: date || '', type, channel, price: Number(price) };
  if (state) item.state = state;
  if (channel === 'gallery') {
    item.pct = Number(pct);
    item.net = Number(net ?? price * (pct / 100));
  }
  await dynamo.send(new PutCommand({ TableName: SALES_TABLE, Item: item }));
  // Opt-in (Sell window): decrement print stock server-side with an atomic update, so the
  // painting record isn't rewritten from client fields. Quick sale doesn't send this flag.
  if (body.decrementStock === true && (type === 'large' || type === 'small')) {
    try {
      await dynamo.send(new UpdateCommand({
        TableName: PAINTINGS_TABLE,
        Key: { id: paintingId },
        UpdateExpression: 'SET #stock.#sz = if_not_exists(#stock.#sz, :z) - :one',
        ConditionExpression: 'attribute_exists(#stock)',
        ExpressionAttributeNames: { '#stock': 'stock', '#sz': type },
        ExpressionAttributeValues: { ':z': 0, ':one': 1 },
      }));
    } catch (e) { console.error('Sale stock decrement failed', paintingId, e.name); }
  }
  return ok({ sale: item }, cors);
}

async function adminUpdateSale(paintingId, saleId, body, cors) {
  const { date, type, channel, price, pct, net, state } = body;
  if (!type || !channel || price == null) return err('Missing required fields', 400, cors);
  const item = { id: saleId, paintingId, date: date || '', type, channel, price: Number(price) };
  // Keep fields the edit modal doesn't know about (tax + Square transaction from Sell-window checkouts)
  const prev = (await dynamo.send(new GetCommand({ TableName: SALES_TABLE, Key: { id: saleId } }))).Item;
  if (prev?.tax != null) item.tax = prev.tax;
  if (prev?.squareTxn) item.squareTxn = prev.squareTxn;
  if (prev?.shipState) item.shipState = prev.shipState;   // online sync fields
  if (prev?.syncedAt)  item.syncedAt  = prev.syncedAt;
  if (state) item.state = state;
  if (channel === 'gallery') {
    item.pct = Number(pct);
    item.net = Number(net ?? price * (pct / 100));
  }
  await dynamo.send(new PutCommand({ TableName: SALES_TABLE, Item: item }));
  return ok({ sale: item }, cors);
}

async function adminDeleteSale(saleId, cors) {
  await dynamo.send(new DeleteCommand({ TableName: SALES_TABLE, Key: { id: saleId } }));
  return ok({ deleted: true }, cors);
}

async function adminGetConfig(cors) {
  const res = await dynamo.send(new GetCommand({ TableName: PAINTINGS_TABLE, Key: { id: '__config__' } }));
  return ok({
    rate: res.Item?.rate ?? 1.10,
    printCostSmall: res.Item?.printCostSmall ?? 5,
    printCostLarge: res.Item?.printCostLarge ?? 12,
    irsRates: res.Item?.irsRates || {},
  }, cors);
}

// IRS mileage rates by year, set in admin Settings: { "2026": 0.70, ... }
function cleanIrsRates(v) {
  const out = {};
  for (const [y, r] of Object.entries(v || {})) {
    const n = Number(r);
    if (/^20\d\d$/.test(y) && n > 0 && n < 5) out[y] = Math.round(n * 1000) / 1000;
  }
  return out;
}

async function adminUpdateConfig(body, cors) {
  const { rate, printCostSmall, printCostLarge, irsRates } = body;
  if (!rate || isNaN(rate)) return err('Invalid rate', 400, cors);
  if (printCostSmall != null && isNaN(printCostSmall)) return err('Invalid printCostSmall', 400, cors);
  if (printCostLarge != null && isNaN(printCostLarge)) return err('Invalid printCostLarge', 400, cors);
  // Read-merge-write: PutCommand replaces the whole __config__ item, so any field
  // not explicitly passed here would otherwise be silently dropped.
  const existing = await dynamo.send(new GetCommand({ TableName: PAINTINGS_TABLE, Key: { id: '__config__' } }));
  const item = {
    ...(existing.Item || {}),
    id: '__config__',
    rate: Number(rate),
    printCostSmall: printCostSmall != null ? Number(printCostSmall) : (existing.Item?.printCostSmall ?? 5),
    printCostLarge: printCostLarge != null ? Number(printCostLarge) : (existing.Item?.printCostLarge ?? 12),
    irsRates: irsRates != null ? cleanIrsRates(irsRates) : (existing.Item?.irsRates || {}),
  };
  await dynamo.send(new PutCommand({ TableName: PAINTINGS_TABLE, Item: item }));
  return ok({ rate: item.rate, printCostSmall: item.printCostSmall, printCostLarge: item.printCostLarge, irsRates: item.irsRates }, cors);
}

// ── Admin: print prices (Settings) ──
// Square is the source of truth for print prices. Settings shows what Square currently charges per size and can
// set every print of one size to a new price in Square (admin.html warns and lists what changes first).
// Size comes from the variation name via regSizeOf (12x16 mat = large, 8x10 mat = small). Originals-only items
// and Market Item quick-charge items are never touched.
async function printVariationsBySize() {
  // Page through the whole catalog — a price change must never silently miss items past the first page.
  const objects = [];
  let cursor = '';
  for (let page = 0; page < 20; page++) {
    const res = await squareGet(`/v2/catalog/list?types=ITEM&location_id=${SQUARE_LOC}` + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''));
    if (res.errors) throw new Error(res.errors[0]?.detail || 'Square catalog read failed');
    objects.push(...(res.objects || []));
    cursor = res.cursor || '';
    if (!cursor) break;
  }
  if (cursor) throw new Error('Catalog too large to read completely — no prices changed');
  const out = { large: [], small: [] };
  for (const obj of objects) {
    const item = obj.item_data;
    if (!item?.name || obj.is_deleted) continue;
    const vars = item.variations || [];
    if (vars.length === 1 && vars[0].item_variation_data?.name === 'Default Title') continue;
    let market = false;
    for (const val of Object.values(obj.custom_attribute_values || {})) {
      if (val.name === 'Market Item' && val.boolean_value === true) market = true;
    }
    if (market) continue;
    for (const v of vars) {
      const vd = v.item_variation_data || {};
      const cents = vd.price_money?.amount;
      if (!cents) continue;
      out[regSizeOf(vd.name, cents)].push({ title: item.name, variation: v, cents });
    }
  }
  return out;
}

function summarizePrices(list) {
  const byCents = {};
  for (const x of list) byCents[x.cents] = (byCents[x.cents] || 0) + 1;
  return Object.entries(byCents).map(([cents, count]) => ({ cents: Number(cents), count })).sort((a, b) => b.count - a.count);
}

async function adminGetPrintPrices(cors) {
  const bySize = await printVariationsBySize();
  const describe = list => ({
    count: list.length,
    prices: summarizePrices(list),
    items: list.map(x => ({ title: x.title, cents: x.cents })).sort((a, b) => a.title.localeCompare(b.title)),
  });
  return ok({ large: describe(bySize.large), small: describe(bySize.small) }, cors);
}

async function adminSetPrintPrice(body, cors) {
  const size = body.size;
  const cents = Number(body.cents);
  if (size !== 'large' && size !== 'small') return err('Size must be large or small', 400, cors);
  if (!Number.isInteger(cents) || cents < 100 || cents > 100000) return err('Price must be between $1 and $1,000', 400, cors);
  const bySize = await printVariationsBySize();
  const changing = bySize[size].filter(x => x.cents !== cents);
  if (!changing.length) return ok({ updated: 0, size, cents }, cors);
  const objects = changing.map(x => ({
    ...x.variation,
    item_variation_data: { ...x.variation.item_variation_data, price_money: { amount: cents, currency: 'USD' } },
  }));
  const res = await squarePost('/v2/catalog/batch-upsert', {
    idempotency_key: `price-${size}-${cents}-${Date.now()}`,
    batches: [{ objects }],
  });
  if (res.errors) {
    console.error('Print price update failed', res.errors);
    return err(res.errors[0]?.detail || 'Square rejected the price change', 502, cors);
  }
  const updated = (res.objects || []).length;
  console.log('Print price updated', size, cents, 'variations:', updated);
  return ok({ updated, size, cents, titles: changing.map(x => x.title) }, cors);
}

// ── Admin: Expenses ──

async function adminGetExpenses(cors) {
  const res = await dynamo.send(new ScanCommand({ TableName: EXPENSES_TABLE }));
  const items = res.Items || [];
  const expenses  = items.filter(x => x.type === 'expense');
  const mileage   = items.filter(x => x.type === 'mileage');
  const recurring = items.filter(x => x.type === 'recurring');
  return ok({ expenses, mileage, recurring }, cors);
}

async function adminAddExpense(body, cors) {
  const { date, category, desc, amount, receiptUrl } = body;
  if (!date || amount == null) return err('Missing required fields', 400, cors);
  const id = 'e' + Date.now() + Math.random().toString(36).slice(2,5);
  const item = { id, type: 'expense', date, category: category || 'Other', desc: desc || '', amount: Number(amount), receiptUrl: receiptUrl || '' };
  await dynamo.send(new PutCommand({ TableName: EXPENSES_TABLE, Item: item }));
  return ok({ expense: item }, cors);
}

async function adminUpdateExpense(id, body, cors) {
  const { date, category, desc, amount, receiptUrl } = body;
  if (!date || amount == null) return err('Missing required fields', 400, cors);
  // Preserve existing receiptUrl if not provided in update
  const existing = await dynamo.send(new GetCommand({ TableName: EXPENSES_TABLE, Key: { id } }));
  const existingReceiptUrl = existing.Item?.receiptUrl || '';
  const item = { id, type: 'expense', date, category: category || 'Other', desc: desc || '', amount: Number(amount), receiptUrl: receiptUrl !== undefined ? receiptUrl : existingReceiptUrl };
  await dynamo.send(new PutCommand({ TableName: EXPENSES_TABLE, Item: item }));
  return ok({ expense: item }, cors);
}

async function adminDeleteExpense(id, cors) {
  await dynamo.send(new DeleteCommand({ TableName: EXPENSES_TABLE, Key: { id } }));
  return ok({ deleted: true }, cors);
}

// ── Admin: Checklists ──

function sanitizeChecklistItems(items) {
  return Array.isArray(items) ? items.map(i => ({
    paintingId: i.paintingId,
    title: i.title || '',
    qtyLarge: Number(i.qtyLarge) || 0,
    qtySmall: Number(i.qtySmall) || 0,
    done: !!i.done,
  })) : [];
}

async function adminGetChecklists(cors) {
  const res = await dynamo.send(new ScanCommand({ TableName: CHECKLISTS_TABLE }));
  const checklists = (res.Items || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return ok({ checklists }, cors);
}

async function adminAddChecklist(body, cors) {
  const { title, narrative, items } = body;
  const id = 'cl' + Date.now() + Math.random().toString(36).slice(2, 6);
  const now = Date.now();
  const item = {
    id,
    title: (title || 'Untitled checklist').slice(0, 120),
    narrative: (narrative || '').slice(0, 2000),
    items: sanitizeChecklistItems(items),
    createdAt: now,
    updatedAt: now,
  };
  await dynamo.send(new PutCommand({ TableName: CHECKLISTS_TABLE, Item: item }));
  return ok({ checklist: item }, cors);
}

async function adminUpdateChecklist(id, body, cors) {
  const existing = await dynamo.send(new GetCommand({ TableName: CHECKLISTS_TABLE, Key: { id } }));
  if (!existing.Item) return err('Not found', 404, cors);
  const { title, narrative, items } = body;
  const item = {
    ...existing.Item,
    title: title !== undefined ? String(title).slice(0, 120) : existing.Item.title,
    narrative: narrative !== undefined ? String(narrative).slice(0, 2000) : existing.Item.narrative,
    items: items !== undefined ? sanitizeChecklistItems(items) : existing.Item.items,
    updatedAt: Date.now(),
  };
  await dynamo.send(new PutCommand({ TableName: CHECKLISTS_TABLE, Item: item }));
  return ok({ checklist: item }, cors);
}

async function adminDeleteChecklist(id, cors) {
  await dynamo.send(new DeleteCommand({ TableName: CHECKLISTS_TABLE, Key: { id } }));
  return ok({ deleted: true }, cors);
}

// ── Recurring expenses (stored in dna-expenses as type:'recurring') ──
function clampDay(d) {
  d = parseInt(d, 10);
  if (!Number.isFinite(d)) d = 1;
  return Math.min(28, Math.max(1, d)); // cap at 28 so every month is valid
}
function currentMonth() {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM' (UTC)
}

async function adminAddRecurring(body, cors) {
  const { category, desc, amount, dayOfMonth, active, startMonth } = body;
  if (amount == null) return err('Missing required fields', 400, cors);
  const item = {
    id: 'r' + Date.now() + Math.random().toString(36).slice(2, 5),
    type: 'recurring',
    category: category || 'Other',
    desc: desc || '',
    amount: Number(amount),
    dayOfMonth: clampDay(dayOfMonth),
    startMonth: /^\d{4}-\d{2}$/.test(startMonth || '') ? startMonth : currentMonth(),
    active: active !== false,
    lastRun: '', // 'YYYY-MM' of the last month an expense was generated
  };
  await dynamo.send(new PutCommand({ TableName: EXPENSES_TABLE, Item: item }));
  return ok({ recurring: item }, cors);
}

async function adminUpdateRecurring(id, body, cors) {
  const existing = await dynamo.send(new GetCommand({ TableName: EXPENSES_TABLE, Key: { id } }));
  if (!existing.Item || existing.Item.type !== 'recurring') return err('Not found', 404, cors);
  const { category, desc, amount, dayOfMonth, active, startMonth } = body;
  const item = {
    ...existing.Item,
    category:   category   != null ? (category || 'Other') : existing.Item.category,
    desc:       desc       != null ? desc                  : existing.Item.desc,
    amount:     amount     != null ? Number(amount)        : existing.Item.amount,
    dayOfMonth: dayOfMonth != null ? clampDay(dayOfMonth)  : existing.Item.dayOfMonth,
    startMonth: /^\d{4}-\d{2}$/.test(startMonth || '') ? startMonth : (existing.Item.startMonth || currentMonth()),
    active:     active     != null ? !!active              : existing.Item.active,
  };
  await dynamo.send(new PutCommand({ TableName: EXPENSES_TABLE, Item: item }));
  return ok({ recurring: item }, cors);
}

async function adminDeleteRecurring(id, cors) {
  await dynamo.send(new DeleteCommand({ TableName: EXPENSES_TABLE, Key: { id } }));
  return ok({ deleted: true }, cors);
}

function monthsFromTo(from, to) {
  const out = [];
  let [y, m] = (from || '').split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  if (!y || !m) return out;
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    if (++m > 12) { m = 1; y++; }
  }
  return out;
}

// Bring every active recurring def current: create a monthly expense from the def's
// startMonth through the current month. Idempotent — skips any month that already has a
// generated row for that def — so it doubles as both the catch-up button and the monthly cron.
async function generateAllRecurring() {
  const to = currentMonth();
  const res = await dynamo.send(new ScanCommand({ TableName: EXPENSES_TABLE }));
  const items = res.Items || [];
  const defs = items.filter(x => x.type === 'recurring' && x.active);
  const expenses = items.filter(x => x.type === 'expense');
  const created = [];
  for (const d of defs) {
    const start = d.startMonth || to;   // unset → only the current month
    if (start > to) continue;           // hasn't started yet
    const day = String(clampDay(d.dayOfMonth)).padStart(2, '0');
    let maxMonth = d.lastRun || '';
    for (const month of monthsFromTo(start, to)) {
      if (month > maxMonth) maxMonth = month;
      const exists = expenses.some(e => e.recurringId === d.id && (e.date || '').startsWith(month));
      if (exists) continue;
      const expense = {
        id: 'e' + Date.now() + Math.random().toString(36).slice(2, 5),
        type: 'expense',
        date: `${month}-${day}`,
        category: d.category || 'Other',
        desc: d.desc || '',
        amount: Number(d.amount),
        receiptUrl: '',
        recurringId: d.id,
        auto: true,
      };
      await dynamo.send(new PutCommand({ TableName: EXPENSES_TABLE, Item: expense }));
      expenses.push(expense); // so later months in this loop see it
      created.push(expense);
    }
    if (maxMonth && maxMonth !== d.lastRun) {
      await dynamo.send(new PutCommand({ TableName: EXPENSES_TABLE, Item: { ...d, lastRun: maxMonth } }));
    }
  }
  return created;
}

async function adminRunRecurring(cors) {
  const created = await generateAllRecurring();
  return ok({ generated: created.length, expenses: created }, cors);
}

// IRS $/mile locked onto each mileage entry when it's logged (admin Settings → Mileage rate), so a later
// rate change never rewrites past deductions. Entries logged before this have no rate; admin falls back
// to its per-year table for those.
function validMileRate(r) { const n = Number(r); return n > 0 && n < 5 ? Math.round(n * 1000) / 1000 : null; }

async function adminAddMileage(body, cors) {
  const { date, miles, purpose, notes } = body;
  if (!date || !miles || !purpose) return err('Missing required fields', 400, cors);
  const id = 'm' + Date.now() + Math.random().toString(36).slice(2,5);
  const rate = validMileRate(body.rate);
  const item = { id, type: 'mileage', date, miles: Number(miles), purpose, notes: notes || '', ...(rate ? { rate } : {}) };
  await dynamo.send(new PutCommand({ TableName: EXPENSES_TABLE, Item: item }));
  return ok({ entry: item }, cors);
}

async function adminUpdateMileage(id, body, cors) {
  const { date, miles, purpose, notes } = body;
  if (!date || !miles || !purpose) return err('Missing required fields', 400, cors);
  // Keep the rate the entry was logged at; an edit never re-rates it
  const prev = (await dynamo.send(new GetCommand({ TableName: EXPENSES_TABLE, Key: { id } }))).Item;
  const rate = validMileRate(prev?.rate) || validMileRate(body.rate);
  const item = { id, type: 'mileage', date, miles: Number(miles), purpose, notes: notes || '', ...(rate ? { rate } : {}) };
  await dynamo.send(new PutCommand({ TableName: EXPENSES_TABLE, Item: item }));
  return ok({ entry: item }, cors);
}

async function adminDeleteMileage(id, cors) {
  await dynamo.send(new DeleteCommand({ TableName: EXPENSES_TABLE, Key: { id } }));
  return ok({ deleted: true }, cors);
}

// ── Admin: Receipt pre-signed URL ──

async function adminReceiptUploadUrl(body, cors) {
  const { filename, contentType, date, amount, category } = body;
  if (!filename || !contentType) return err('Missing filename or contentType', 400, cors);
  const ext = filename.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  // Build a readable filename: 2026-04-08_40.01_Insurance
  const safeCat = (category || 'other').replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').toLowerCase();
  const safeDate = (date || new Date().toISOString().slice(0,10));
  const safeAmt  = amount != null ? Number(amount).toFixed(2) : '0.00';
  const baseName = `${safeDate}_${safeAmt}_${safeCat}`;
  const key = `${RECEIPTS_PREFIX}${baseName}.${ext}`;
  const command = new PutObjectCommand({
    Bucket: RECEIPTS_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
  const fileUrl = `https://davidnicholsonart.com/${key}`;
  return ok({ uploadUrl, fileUrl }, cors);
}

// ── Admin: Gallery Stock ──

async function adminGetGalleryStock(cors) {
  const res = await dynamo.send(new ScanCommand({ TableName: GALLERY_TABLE }));
  return ok({ stock: res.Items || [] }, cors);
}

async function adminPutGalleryStock(body, cors) {
  // Upsert a single painting's stock at a gallery
  // body: { paintingId, galleryName, stockSm, stockLg }
  const { paintingId, galleryName, stockSm, stockLg } = body;
  if (!paintingId || !galleryName) return err('Missing paintingId or galleryName', 400, cors);
  const id = `${paintingId}__${galleryName.replace(/\s+/g, '_')}`;
  const item = {
    id,
    paintingId,
    galleryName,
    stockSm: Math.max(0, Number(stockSm) || 0),
    stockLg: Math.max(0, Number(stockLg) || 0),
  };
  await dynamo.send(new PutCommand({ TableName: GALLERY_TABLE, Item: item }));
  return ok({ stock: item }, cors);
}

async function adminDeleteGalleryStock(id, cors) {
  await dynamo.send(new DeleteCommand({ TableName: GALLERY_TABLE, Key: { id } }));
  return ok({ deleted: true }, cors);
}

// ── Router ──
export const handler = async (event) => {
  // EventBridge scheduled trigger → generate this month's recurring expenses
  if (event && event.task === 'recurring') {
    const created = await generateAllRecurring();
    console.log('Recurring generated:', created.length);
    let online = 0;
    try { online = await syncOnlineOrders(); } catch (e) { console.error('Online order sync failed:', e.message); }
    return { generated: created.length, onlineLogged: online };
  }
  const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
  const path   = event.requestContext?.http?.path   || event.path       || '/';
  console.log('Request:', method, path);
  const cors = corsHeaders(event);
  if (method === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };

  try {
    // Public routes
    if (method === 'GET'  && path === '/products')                        return await getProducts();
    if (method === 'GET'  && path === '/originals')                       return await getOriginals();
    if (method === 'GET'  && path === '/booth-layout')                    return await getBoothLayout(event.queryStringParameters?.id);
    if (method === 'PUT'  && path === '/booth-layout')                    return await putBoothLayout(JSON.parse(event.body || '{}'));
    if (method === 'DELETE' && path === '/booth-layout')                 return await deleteBoothLayout(event.queryStringParameters?.id);
    if (method === 'GET'  && path === '/booth-layouts')                  return await listBoothLayouts();
    if (method === 'GET'  && (path === '/feed' || path === '/feed.xml'))  return await getFeed();
    if (method === 'GET'  && path === '/cart')                            return await cartRedirect(event.queryStringParameters);
    if (method === 'GET'  && path === '/hero')                            return await getHero();
    if (method === 'GET'  && path.startsWith('/image'))                   return await proxyImage(event.queryStringParameters?.id);
    if (method === 'POST' && path === '/send-link')                       return await sendLink(JSON.parse(event.body || '{}'));
    if (method === 'POST' && path === '/guestbook')                       return await guestbook(JSON.parse(event.body || '{}'));
    if (method === 'POST' && path === '/checkout')                        return await checkout(JSON.parse(event.body || '{}'));

    // Register (register.html) — public; must come before the auth-gated /admin block.
    // Lives under /admin/ so it rides the existing CloudFront /admin/* behavior.
    if (method === 'GET'  && path === '/admin/register/catalog')  return await registerCatalog(cors);
    if (method === 'POST' && path === '/admin/register/complete') return await registerComplete(JSON.parse(event.body || '{}'), cors);
    if (method === 'GET'  && path === '/admin/register/status')   return await registerStatus(event.queryStringParameters?.cart, cors);

    // Admin password verification — public (no token); must come before the auth-gated /admin block
    if (method === 'POST' && path === '/admin/verify-password') return await adminVerifyPassword(JSON.parse(event.body || '{}'), cors);

    // Admin routes
    if (path.startsWith('/admin')) {
      if (!checkAdminAuth(event)) return err('Unauthorized', 401, cors);

      const b = () => JSON.parse(event.body || '{}');

      // Config
      if (method === 'GET' && path === '/admin/config')  return await adminGetConfig(cors);
      if (method === 'PUT' && path === '/admin/config')  return await adminUpdateConfig(b(), cors);
      if (method === 'GET' && path === '/admin/print-prices') return await adminGetPrintPrices(cors);
      if (method === 'PUT' && path === '/admin/print-prices') return await adminSetPrintPrice(b(), cors);

      // Paintings
      if (method === 'GET'  && path === '/admin/paintings') return await adminGetPaintings(cors);
      if (method === 'POST' && path === '/admin/paintings') return await adminAddPainting(b(), cors);

      const paintingMatch = path.match(/^\/admin\/paintings\/([^/]+)$/);
      if (paintingMatch) {
        const paintingId = paintingMatch[1];
        if (method === 'PUT')    return await adminUpdatePainting(paintingId, b(), cors);
        if (method === 'DELETE') return await adminDeletePainting(paintingId, cors);
      }

      // Price Lists
      if (method === 'GET'  && path === '/admin/price-lists') return await adminGetPriceLists(cors);
      if (method === 'POST' && path === '/admin/price-lists') return await adminAddPriceList(b(), cors);

      const priceListApplyMatch = path.match(/^\/admin\/price-lists\/([^/]+)\/apply$/);
      if (priceListApplyMatch && method === 'POST') return await adminApplyPriceList(priceListApplyMatch[1], cors);

      const priceListMatch = path.match(/^\/admin\/price-lists\/([^/]+)$/);
      if (priceListMatch) {
        const plId = priceListMatch[1];
        if (method === 'PUT')    return await adminUpdatePriceList(plId, b(), cors);
        if (method === 'DELETE') return await adminDeletePriceList(plId, cors);
      }

      const salesListMatch = path.match(/^\/admin\/paintings\/([^/]+)\/sales$/);
      if (salesListMatch && method === 'POST') {
        return await adminAddSale(salesListMatch[1], b(), cors);
      }

      const saleMatch = path.match(/^\/admin\/paintings\/([^/]+)\/sales\/([^/]+)$/);
      if (saleMatch) {
        const [, paintingId, saleId] = saleMatch;
        if (method === 'PUT')    return await adminUpdateSale(paintingId, saleId, b(), cors);
        if (method === 'DELETE') return await adminDeleteSale(saleId, cors);
      }

      // Expenses
      if (method === 'GET'  && path === '/admin/expenses') return await adminGetExpenses(cors);
      if (method === 'POST' && path === '/admin/expenses') return await adminAddExpense(b(), cors);
      if (method === 'POST' && path === '/admin/expenses/receipt-url') return await adminReceiptUploadUrl(b(), cors);

      const expenseMatch = path.match(/^\/admin\/expenses\/([^/]+)$/);
      if (expenseMatch) {
        const expId = expenseMatch[1];
        if (method === 'PUT')    return await adminUpdateExpense(expId, b(), cors);
        if (method === 'DELETE') return await adminDeleteExpense(expId, cors);
      }

      // Recurring expenses
      if (method === 'GET'  && path === '/admin/recurring')      return await adminGetExpenses(cors); // recurring is in the expenses payload
      if (method === 'POST' && path === '/admin/recurring')      return await adminAddRecurring(b(), cors);
      if (method === 'POST' && path === '/admin/recurring/run')      return await adminRunRecurring(cors);

      const recurringMatch = path.match(/^\/admin\/recurring\/([^/]+)$/);
      if (recurringMatch && recurringMatch[1] !== 'run') {
        const rid = recurringMatch[1];
        if (method === 'PUT')    return await adminUpdateRecurring(rid, b(), cors);
        if (method === 'DELETE') return await adminDeleteRecurring(rid, cors);
      }

      // Mileage
      if (method === 'POST' && path === '/admin/mileage') return await adminAddMileage(b(), cors);

      const mileageMatch = path.match(/^\/admin\/mileage\/([^/]+)$/);
      if (mileageMatch) {
        const mileId = mileageMatch[1];
        if (method === 'PUT')    return await adminUpdateMileage(mileId, b(), cors);
        if (method === 'DELETE') return await adminDeleteMileage(mileId, cors);
      }

      // Gallery Stock
      if (method === 'GET'  && path === '/admin/gallery-stock') return await adminGetGalleryStock(cors);
      if (method === 'PUT'  && path === '/admin/gallery-stock') return await adminPutGalleryStock(b(), cors);

      const galleryStockMatch = path.match(/^\/admin\/gallery-stock\/(.+)$/);
      if (galleryStockMatch && method === 'DELETE') return await adminDeleteGalleryStock(decodeURIComponent(galleryStockMatch[1]), cors);

      // Checklists
      if (method === 'GET'  && path === '/admin/checklists') return await adminGetChecklists(cors);
      if (method === 'POST' && path === '/admin/checklists') return await adminAddChecklist(b(), cors);

      const checklistMatch = path.match(/^\/admin\/checklists\/([^/]+)$/);
      if (checklistMatch) {
        const clId = checklistMatch[1];
        if (method === 'PUT')    return await adminUpdateChecklist(clId, b(), cors);
        if (method === 'DELETE') return await adminDeleteChecklist(clId, cors);
      }

      return err('Not found', 404, cors);
    }

    return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Not found' }) };
  } catch (e) {
    console.error(e);
    return err(e.message || 'Internal error');
  }
};
