import https from 'https';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const SQUARE_TOKEN  = process.env.SQUARE_TOKEN;
const SQUARE_LOC    = process.env.SQUARE_LOC;
const SES_FROM      = process.env.SES_FROM;
const NOTIFY_EMAIL  = process.env.NOTIFY_EMAIL;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const ses    = new SESClient({ region: 'us-east-1' });
const sns    = new SNSClient({ region: 'us-east-1' });
const dynamo = new DynamoDBClient({ region: 'us-east-1' });

function ok(body)             { return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }
function err(msg, status=500) { return { statusCode: status, headers: CORS, body: JSON.stringify({ error: msg }) }; }

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
  await dynamo.send(new PutItemCommand({
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
  await dynamo.send(new PutItemCommand({
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

// Extract the Year custom attribute from a Square catalog object.
// The key is a UUID we can't hardcode, so we find the entry by name.
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
      url,
      variations,
      year:       extractYear(obj),  // null if not set
    });
  }

  // Sort by year descending (newest first), then alphabetically within same year.
  // Items with no year sort to the end.
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

async function getHero() {
  const products = await buildProductList();
  const withImg = products.filter(p => p.img);
  if (!withImg.length) return err('No products with images', 404);
  const p = withImg[Math.floor(Math.random() * withImg.length)];
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

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
  const path   = event.requestContext?.http?.path   || event.path       || '/';
  if (method === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  try {
    if (method === 'GET'  && path === '/products')              return await getProducts();
    if (method === 'GET'  && path === '/hero')                  return await getHero();
    if (method === 'GET'  && path.startsWith('/image'))         return await proxyImage(event.queryStringParameters?.id);
    if (method === 'POST' && path === '/send-link')             return await sendLink(JSON.parse(event.body || '{}'));
    if (method === 'POST' && path === '/guestbook')             return await guestbook(JSON.parse(event.body || '{}'));
    if (method === 'POST' && path === '/checkout')              return await checkout(JSON.parse(event.body || '{}'));
    return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Not found' }) };
  } catch (e) {
    console.error(e);
    return err(e.message || 'Internal error');
  }
};
