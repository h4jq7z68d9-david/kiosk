import https from 'https';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
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
const sns       = new SNSClient({ region: 'us-east-1' });
const s3        = new S3Client({ region: 'us-east-2' });
const dynamoRaw = new DynamoDBClient({ region: 'us-east-1' });
const dynamo    = DynamoDBDocumentClient.from(dynamoRaw);

function ok(body, c)             { return { statusCode: 200, headers: { ...(c||CORS), 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }
function err(msg, status=500, c) { return { statusCode: status, headers: c||CORS, body: JSON.stringify({ error: msg }) }; }

function checkAdminAuth(event) {
  // Token auth disabled — relying on password gate in admin.html
  return true;
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

async function sendSMS({ phone, message }) {
  await sns.send(new PublishCommand({
    PhoneNumber: phone.startsWith('+') ? phone : '+1' + phone.replace(/\D/g,''),
    Message: message,
    OriginationNumber: '+18444767251',
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

    products.push({
      id:         obj.id,
      title:      item.name,
      desc:       item.description || '',
      img:        imgUrl,
      rawImg:     rawImgUrl,
      url,
      variations,
      year:       extractYear(obj),
    });
  }

  products.sort((a, b) => {
    const ya = a.year ? parseInt(a.year) : 0;
    const yb = b.year ? parseInt(b.year) : 0;
    if (yb !== ya) return yb - ya;
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

  const [itemsRes, imagesRes, configRes] = await Promise.all([
    squareGet(`/v2/catalog/list?types=ITEM&location_id=${SQUARE_LOC}`),
    squareGet(`/v2/catalog/list?types=IMAGE`),
    dynamo.send(new GetCommand({ TableName: PAINTINGS_TABLE, Key: { id: '__config__' } })),
  ]);

  const rate = configRes.Item?.rate ?? null;

  const imageMap = {};
  for (const img of (imagesRes.objects || [])) {
    if (img.image_data?.url) imageMap[img.id] = img.image_data.url;
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

    let price = null;
    if (rate && width && height) {
      price = Math.ceil((width * height * rate) / 50) * 50;
    }

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
  const text = `Here's the print you were looking at:\n\n${title || 'David Nicholson Art'}\n${url}\n\ndavidnicholsonart.com`;
  if (type === 'email') {
    if (!to.includes('@')) return err('Invalid email');
    await sendEmail({ to, subject: 'Print from David Nicholson Art', body: text });
  } else if (type === 'sms') {
    await sendSMS({ phone: to, message: `Print from David Nicholson Art: ${url}` });
  } else {
    return err('Invalid type');
  }
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
  const [paintingsRes, salesRes, squareRes] = await Promise.all([
    dynamo.send(new ScanCommand({ TableName: PAINTINGS_TABLE })),
    dynamo.send(new ScanCommand({ TableName: SALES_TABLE })),
    squareGet(`/v2/catalog/list?types=ITEM&location_id=${SQUARE_LOC}`),
  ]);

  // Build normalized-title → originalAvail map from Square custom attributes
  function normTitle(t) { return (t || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  const squareAvailMap = {};
  for (const obj of (squareRes.objects || [])) {
    const name = obj.item_data?.name;
    if (!name) continue;
    const attrs = obj.custom_attribute_values;
    let avail = false;
    if (attrs) {
      for (const val of Object.values(attrs)) {
        if (val.name === 'Original Available') {
          avail = val.boolean_value === true;
          break;
        }
      }
    }
    squareAvailMap[normTitle(name)] = avail;
  }

  const salesByPainting = {};
  for (const s of (salesRes.Items || [])) {
    if (!salesByPainting[s.paintingId]) salesByPainting[s.paintingId] = [];
    salesByPainting[s.paintingId].push(s);
  }
  const paintings = (paintingsRes.Items || [])
    .filter(p => p.id !== '__config__')
    .map(p => ({
      ...p,
      sales: salesByPainting[p.id] || [],
      originalAvail: squareAvailMap[normTitle(p.title)] ?? null,
    }));
  const configRes = await dynamo.send(new GetCommand({ TableName: PAINTINGS_TABLE, Key: { id: '__config__' } }));
  const rate = configRes.Item?.rate ?? 1.10;
  return ok({ paintings, rate }, cors);
}

async function adminAddPainting(body, cors) {
  const { title, month, year, width, height, stock, momsHas } = body;
  if (!title || !year || !width || !height) return err('Missing required fields', 400, cors);
  const id = 'p' + Date.now();
  const item = { id, title, month: month || '', year, width, height, stock: stock || { large: 0, small: 0 }, momsHas: !!momsHas };
  await dynamo.send(new PutCommand({ TableName: PAINTINGS_TABLE, Item: item }));
  return ok({ painting: item }, cors);
}

async function adminUpdatePainting(id, body, cors) {
  const { title, month, year, width, height, stock, momsHas } = body;
  if (!title || !year || !width || !height) return err('Missing required fields', 400, cors);
  const item = { id, title, month: month || '', year, width, height, stock: stock || { large: 0, small: 0 }, momsHas: !!momsHas };
  await dynamo.send(new PutCommand({ TableName: PAINTINGS_TABLE, Item: item }));
  return ok({ painting: item }, cors);
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
  const { date, type, channel, price, pct, net } = body;
  if (!type || !channel || price == null) return err('Missing required fields', 400, cors);
  const id = 's' + Date.now();
  const item = { id, paintingId, date: date || '', type, channel, price: Number(price) };
  if (channel === 'gallery') {
    item.pct = Number(pct);
    item.net = Number(net ?? price * (pct / 100));
  }
  await dynamo.send(new PutCommand({ TableName: SALES_TABLE, Item: item }));
  return ok({ sale: item }, cors);
}

async function adminUpdateSale(paintingId, saleId, body, cors) {
  const { date, type, channel, price, pct, net } = body;
  if (!type || !channel || price == null) return err('Missing required fields', 400, cors);
  const item = { id: saleId, paintingId, date: date || '', type, channel, price: Number(price) };
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
  return ok({ rate: res.Item?.rate ?? 1.10 }, cors);
}

async function adminUpdateConfig(body, cors) {
  const { rate } = body;
  if (!rate || isNaN(rate)) return err('Invalid rate', 400, cors);
  await dynamo.send(new PutCommand({ TableName: PAINTINGS_TABLE, Item: { id: '__config__', rate: Number(rate) } }));
  return ok({ rate: Number(rate) }, cors);
}

// ── Admin: Expenses ──

async function adminGetExpenses(cors) {
  const res = await dynamo.send(new ScanCommand({ TableName: EXPENSES_TABLE }));
  const items = res.Items || [];
  const expenses = items.filter(x => x.type === 'expense');
  const mileage  = items.filter(x => x.type === 'mileage');
  return ok({ expenses, mileage }, cors);
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

async function adminAddMileage(body, cors) {
  const { date, miles, purpose, notes } = body;
  if (!date || !miles || !purpose) return err('Missing required fields', 400, cors);
  const id = 'm' + Date.now() + Math.random().toString(36).slice(2,5);
  const item = { id, type: 'mileage', date, miles: Number(miles), purpose, notes: notes || '' };
  await dynamo.send(new PutCommand({ TableName: EXPENSES_TABLE, Item: item }));
  return ok({ entry: item }, cors);
}

async function adminUpdateMileage(id, body, cors) {
  const { date, miles, purpose, notes } = body;
  if (!date || !miles || !purpose) return err('Missing required fields', 400, cors);
  const item = { id, type: 'mileage', date, miles: Number(miles), purpose, notes: notes || '' };
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

// ── Router ──
export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
  const path   = event.requestContext?.http?.path   || event.path       || '/';
  console.log('Request:', method, path);
  const cors = corsHeaders(event);
  if (method === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };

  try {
    // Public routes
    if (method === 'GET'  && path === '/products')                        return await getProducts();
    if (method === 'GET'  && path === '/originals')                       return await getOriginals();
    if (method === 'GET'  && (path === '/feed' || path === '/feed.xml'))  return await getFeed();
    if (method === 'GET'  && path === '/cart')                            return await cartRedirect(event.queryStringParameters);
    if (method === 'GET'  && path === '/hero')                            return await getHero();
    if (method === 'GET'  && path.startsWith('/image'))                   return await proxyImage(event.queryStringParameters?.id);
    if (method === 'POST' && path === '/send-link')                       return await sendLink(JSON.parse(event.body || '{}'));
    if (method === 'POST' && path === '/guestbook')                       return await guestbook(JSON.parse(event.body || '{}'));
    if (method === 'POST' && path === '/checkout')                        return await checkout(JSON.parse(event.body || '{}'));

    // Admin routes
    if (path.startsWith('/admin')) {
      if (!checkAdminAuth(event)) return err('Unauthorized', 401, cors);

      const b = () => JSON.parse(event.body || '{}');

      // Config
      if (method === 'GET' && path === '/admin/config')  return await adminGetConfig(cors);
      if (method === 'PUT' && path === '/admin/config')  return await adminUpdateConfig(b(), cors);

      // Paintings
      if (method === 'GET'  && path === '/admin/paintings') return await adminGetPaintings(cors);
      if (method === 'POST' && path === '/admin/paintings') return await adminAddPainting(b(), cors);

      const paintingMatch = path.match(/^\/admin\/paintings\/([^/]+)$/);
      if (paintingMatch) {
        const paintingId = paintingMatch[1];
        if (method === 'PUT')    return await adminUpdatePainting(paintingId, b(), cors);
        if (method === 'DELETE') return await adminDeletePainting(paintingId, cors);
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

      // Mileage
      if (method === 'POST' && path === '/admin/mileage') return await adminAddMileage(b(), cors);

      const mileageMatch = path.match(/^\/admin\/mileage\/([^/]+)$/);
      if (mileageMatch) {
        const mileId = mileageMatch[1];
        if (method === 'PUT')    return await adminUpdateMileage(mileId, b(), cors);
        if (method === 'DELETE') return await adminDeleteMileage(mileId, cors);
      }

      return err('Not found', 404, cors);
    }

    return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Not found' }) };
  } catch (e) {
    console.error(e);
    return err(e.message || 'Internal error');
  }
};
