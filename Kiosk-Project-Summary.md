# Kiosk Project Summary

## What’s Live

|URL                                                 |Purpose                                                                                      |
|----------------------------------------------------|---------------------------------------------------------------------------------------------|
|<https://davidnicholsonart.com>                     |Main entry point / homepage (index.html) — primary public site                               |
|<https://davidnicholsonart.com/gallery.html>        |Public print gallery with cart + checkout                                                    |
|<https://davidnicholsonart.com/shop.html>           |LEGACY — archived dark-theme gallery; noindexed, banner links to gallery.html. Do not update.|
|<https://davidnicholsonart.com/shipping.html>       |Shipping & returns info                                                                      |
|<https://davidnicholsonart.com/kiosk.html>          |iPad kiosk for art fairs                                                                     |
|<https://davidnicholsonart.com/admin.html>          |Admin dashboard — PIN gated (verified server-side)                                           |
|<https://davidnicholsonart.com/booth.html>          |Booth planner — art fair wall layout tool (noindex, admin-linked)                            |
|<https://davidnicholsonart.com/prints/{slug}.html>  |Per-product pages with OG tags — redirect to gallery modal                                   |
|<https://davidnicholsonart.com/varied-readings.html>|Varied Readings show page — static blog-style recap (June 2026)                              |
|<https://davidnicholsonart.com/color-theory.html>   |Color theory study deck — site-chrome wrapper; embeds color-theory-app.html in an iframe     |
|<https://davidnicholsonart.com/color-theory-app.html>|The deck app itself — noindex; meant to be viewed inside color-theory.html                  |
|<https://kiosk.davidnicholsonllc.com>               |Legacy URL — still works, same content                                                       |

The site is deployed and working. Push changes to GitHub — deploy is automatic.
**Deploy:** Push to GitHub → GitHub Actions auto-deploys to S3, deploys Lambda, and invalidates both CloudFront distributions in ~60 seconds.

-----

## AWS Infrastructure

|Resource                                             |Value                                                                                           |
|-----------------------------------------------------|------------------------------------------------------------------------------------------------|
|AWS Account                                          |892204037842                                                                                    |
|S3 Bucket                                            |kiosk.davidnicholsonllc (us-east-2)                                                             |
|CloudFront Distribution — davidnicholsonart.com      |E2EJH38GWGPEPG (dbhpvmx9kl58h.cloudfront.net)                                                   |
|CloudFront Distribution — kiosk.davidnicholsonllc.com|E31J8ASEUTGXD9 (d33vrz1flme0j4.cloudfront.net)                                                  |
|SSL Cert — davidnicholsonart.com                     |ACM us-east-1, covers apex + www, auto-renews                                                   |
|SSL Cert — kiosk.davidnicholsonllc.com               |ACM us-east-1, auto-renews                                                                      |
|IAM Role                                             |github-kiosk-deploy — has S3, CloudFront invalidation, and Lambda UpdateFunctionCode permissions|

**CloudFront E2EJH38GWGPEPG behaviors (in order):**

|Precedence|Path           |Origin     |Notes                                                  |
|----------|---------------|-----------|-------------------------------------------------------|
|0         |/products      |API Gateway|Lambda products endpoint                               |
|1         |/hero          |API Gateway|Lambda hero endpoint                                   |
|2         |/image*        |API Gateway|Lambda image proxy — forwards query string             |
|3         |/feed.xml      |API Gateway|Lambda feed endpoint                                   |
|4         |/admin/*       |API Gateway|Lambda admin endpoints                                 |
|5         |/booth-layout* |API Gateway|Booth layout save/load/delete — same-origin avoids CORS|
|6         |/booth-layouts*|API Gateway|Booth layout list endpoint                             |
|7         |/prints/*      |S3         |Per-product OG redirect pages                          |
|8         |/receipts/*    |S3         |Receipt file storage — publicly readable via CloudFront|
|9         |Default (*)    |S3         |All other static files                                 |

**DNS:** `davidnicholsonart.com` is registered with AWS and DNS is in Route 53. Both apex and www point to CloudFront distribution E2EJH38GWGPEPG.

**ACM validation tip:** When requesting a cert, the “Create records in Route 53” button only works if a hosted zone already exists. After setting nameservers, NS records in Route 53 Registered Domains must match the hosted zone NS records exactly — no trailing dots.

**To update any file:**

1. Edit the file
1. `git add . && git commit -m "your message" && git push`
1. GitHub Actions deploys to S3 + invalidates both CloudFront distributions automatically
1. Live in ~60 seconds

-----

## GitHub Actions Auto-Deploy

Fully configured. Push any file to the repo → live in ~60 seconds.

- IAM role: `github-kiosk-deploy` (OIDC, no static keys)
- Repo secret set: `AWS_ROLE_ARN`
- Workflow file: `.github/workflows/deploy.yml`
- Syncs `*.html`, `prints/*.html`, `*.png`, `*.jpg`, `*.xml`, `*.txt`, `*.js`, `*.webmanifest` files to S3
- Zips and deploys `index.mjs` to Lambda function `dna-kiosk`
- Invalidates both distributions: E31J8ASEUTGXD9 and E2EJH38GWGPEPG
- **Generate print pages step:** runs `generate-prints.js` before S3 sync — fetches catalog from Lambda API Gateway URL directly (bypasses CloudFront), writes `prints/*.html` and `hero-pool.js` locally, S3 sync picks them up

-----

## Square

|Item                   |Value                                                                            |
|-----------------------|---------------------------------------------------------------------------------|
|Square Online Store    |<https://david-nicholson-art.square.site>                                        |
|Application ID         |`sq0idp-6D-Q6hGLP9tk-medwFpxvQ`                                                  |
|Production Access Token|Stored in Lambda env var `SQUARE_TOKEN` — see AWS console (do not commit to repo)|
|Location ID            |`LYVD3ZGR3X4KE` — "David Nicholson Art", Roeland Park KS (PHYSICAL). Used by online checkout (`SQUARE_LOC`).|
|Missouri location      |`LHXVQB0QCW9R1` — "Missouri", Kansas City MO (MOBILE, created 2026-09-11). **In-person MO fair sales only — never pass to online checkout.**|
|Sales tax objects      |Kansas 9.35% (Roeland Park location only, `applies_to_custom_amounts: false`); Missouri 4.22% (Missouri location only). Both fixed-rate, product set `all_products`. See "Online sales tax" below.|

**Product URL pattern:**

```
https://david-nicholson-art.square.site/product/{slug}/{ITEM_ID}
```

Slug = item name lowercased, non-alphanumeric replaced with hyphens. Lambda generates this automatically. (As of June 10 2026 the kiosk no longer routes visitors to this URL — QR/email point to davidnicholsonart.com; the Square store remains the commerce backend and `/products` still returns this `url` field.)

**Originals:** Excluded from API/kiosk by detecting single “Default Title” variation.

**Images:** Product images are hosted by Square. No dependency on Shopify CDN.

**Product descriptions:** All 40 prints have customer-facing product descriptions and SEO descriptions entered in Square (completed 2025-03-23). Reference file: `painting-descriptions.md` in repo.

-----

## Pinterest

|Item                   |Value                                                                                     |
|-----------------------|------------------------------------------------------------------------------------------|
|Account                |Business account, claimed domain davidnicholsonart.com                                    |
|Domain verification tag|`<meta name="p:domain_verify" content="e2ca69d5bcbd54035f416124bf0b4508">` (in index.html)|
|Feed URL               |`https://davidnicholsonart.com/feed.xml`                                                  |
|Tag advertiser ID      |549769596185                                                                              |

**Notes:**

- Pinterest Tag live in gallery.html — fires 4 events: `pagevisit` (page load), `pagevisit` with `product_id` (product modal open), `addtocart`, `checkout`; all include `click_id` (epik) when present
- Base `pagevisit` on page load only includes `click_id` if `epik` param is present in URL — omits key entirely when absent (Pinterest treats explicit `undefined` differently)
- Conversion source health requires all 3 event types fired by real users in last 30 days — without ad traffic this will stay yellow
- Verified Merchant Program — ✓ verified April 2026
- 3 dead Shopify catalogs exist on Pinterest account — harmless, can’t be deleted without Shopify app
- Share button on product modal links to `/prints/{slug}.html` — Pinterest receives correct image URL and description

-----

## Per-Product Print Pages (`/prints/`)

Static HTML files generated at build time by `generate-prints.js`. One file per product.

**Purpose:** Provide per-product OG tags for Facebook/Pinterest share previews, Google SEO, and ad creative. Without these, all share links show the generic gallery OG image.

**How it works:**

1. `generate-prints.js` runs in GitHub Actions before S3 sync
1. Fetches product catalog from Lambda API Gateway URL directly (not through CloudFront — CloudFront blocks GitHub Actions IPs)
1. Generates `prints/{slug}.html` for each product with OG tags + `window.location.replace()` redirect
1. Redirect URL uses `?view={ITEM_ID}` param — opens the product modal in gallery.html
1. S3 sync uploads `prints/*.html` to S3
1. CloudFront behavior `/prints/*` routes to S3

**Redirect flow:**

- User clicks share link → hits `/prints/beer-drinker.html`
- Browser reads OG tags (Facebook/Pinterest scrape these)
- `window.location.replace()` redirects to `gallery.html?view=ITEM_ID`
- `handleViewParam()` in gallery.html reads `?view=` param and calls `openDetail(idx)` — modal opens
- `history.replaceState` cleans URL to `/gallery.html`

**Important:** `handleViewParam()` must be called BEFORE `handleIncomingProduct()` in `loadProducts()` — `handleIncomingProduct` calls `history.replaceState` unconditionally, wiping the `?view=` param before `handleViewParam` can read it.

**Slug format:** `item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')` — matches between `generate-prints.js` and `openDetail()` share button logic.

**Facebook share preview:** Shows product image and title correctly. Image may appear cropped because paintings are square and Facebook link previews are landscape (1200×630). Not fixable without creating custom cropped OG images per product.

-----

## Lambda (`dna-kiosk`)

|Item           |Value                                                   |
|---------------|--------------------------------------------------------|
|Function name  |`dna-kiosk`                                             |
|Runtime        |nodejs22.x, us-east-1                                   |
|Role           |`arn:aws:iam::892204037842:role/dna-kiosk-role`         |
|API Gateway URL|`https://doqg3wcta7.execute-api.us-east-1.amazonaws.com`|

**Environment variables** (values live in the Lambda console only — never commit secrets to the repo):

```
SQUARE_TOKEN  = Square production access token (see AWS console)
SQUARE_LOC    = LYVD3ZGR3X4KE
SQUARE_APP_ID = Square Application ID (Developer Dashboard) — used by admin.html's Sell window for the POS API handoff; public-safe
SES_FROM      = david@davidnicholsonart.com
NOTIFY_EMAIL  = david@davidnicholsonart.com
API_URL       = https://davidnicholsonart.com
ADMIN_TOKEN   = admin API token (see AWS console)
PASSWORD      = admin.html PIN (see AWS console) — added June 11 2026
```

**`API_URL` is critical:** Controls the domain used when building image proxy URLs (`/image?id=...`). Must be set to `https://davidnicholsonart.com` so image URLs use the CloudFront domain instead of the raw API Gateway domain. Pinterest rejects API Gateway domains in `image_url` fields.

**Endpoints:**

- `GET /products` — fetches Square catalog, excludes originals, returns prints with `id, title, desc, img, rawImg, url, variations, year`, `width` and `height` (the original's Square Width / Height in inches, `null` when unset — the gallery wall draws to scale from these), plus `originalAvail` (raw Square `Original Available` toggle) and `atGallery` (true when the `dna-paintings` record has At Gallery set)
- `GET /originals` — Square items with the `Original Available` toggle true; price is **computed**, not stored per painting: `Math.ceil(width × height × effRate / 50) × 50`, where `effRate = rateLarge` if `rateLarge` is set AND a side ≥ 30”, else base `rate`. Reads both `rate` and `rateLarge` from the `__config__` record so it matches admin.html’s `effectiveRate()` / `retail()`. originals.html fetches this directly from API Gateway (not via CloudFront), so config changes show on next load. Each row carries `atGallery: true` when the painting's `dna-paintings` record has At Gallery set (matched by squareId or normalized title); **both originals.html and booth.html drop those rows client-side** (October 2 2026), so the admin At Gallery dropdown is the switch for hiding a consigned original — leave the Square `Original Available` toggle on. **Fixed June 2026:** previously used only base `rate`, so large paintings (≥30”) ignored the large rate set in admin.
- `GET /feed` and `GET /feed.xml` — returns RSS/XML product catalog for Pinterest/Google; served publicly via CloudFront at `https://davidnicholsonart.com/feed.xml`
- `GET /hero` — returns a single random product with an image `{img, title, id}` — filtered to 2025–2026 prints, falls back to full catalog
- `GET /image?id=X` — proxies Square CDN image to avoid hotlink 403s; query string must be forwarded by CloudFront (Origin request policy: AllViewerExceptHostHeader)
- `POST /send-link` — sends email (SES) with product link (email-only; the `sms`/SNS path was removed June 10 2026)
- `POST /guestbook` — saves to DynamoDB (`dna-guestbook`) + emails [david@davidnicholsonart.com](mailto:david@davidnicholsonart.com); stores `name, email, note, subscribed (BOOL)`
- `POST /checkout` — accepts `{items:[{variation_id, item_id, title, price}]}`, creates Square Payment Link with `ask_for_shipping_address: true`, returns `{checkout_url}`
- **Online sale sync (not an endpoint)** — `syncOnlineOrders()` runs at the start of every `GET /admin/paintings` (8s cap; any Square failure is logged and admin loads anyway) and on the monthly scheduled `{"task":"recurring"}` run. Searches Square orders at `SQUARE_LOC` with a SHIPMENT fulfillment created since `ONLINE_LOG_SINCE` (`2026-09-22T00:00:00Z` — earlier orders were logged by hand; don't move it earlier), keeps paid ones (`isPaidOnlineOrder`: tenders present, `net_amount_due_money` = 0, not CANCELED, no refunds), skips any order that already has a `sync_{orderId}` marker, and `logOnlineOrder()` writes one `dna-sales` row per unit (`id: sq_{orderId}_{n}`, conditional put → idempotent; `channel: 'online'`, pre-tax unit `price`, `squareTxn`, `shipState` = ship-to state, `syncedAt`) and atomically decrements `stock.large/small` (size via `regSizeOf`), then writes the marker row `{id: 'sync_{orderId}', paintingId: '__sync__', syncedAt, logged, unmatched}` in `dna-sales`. **The marker, not the sale rows, is what prevents re-logging** — so deleting or editing a synced sale in admin (e.g. after a refund) never brings it back. `paintingId '__sync__'` matches no painting, so admin never shows markers. Painting matched by Square item ID, then title; unmatched lines are logged to CloudWatch and skipped. `adminUpdateSale` preserves `shipState` and `syncedAt` on edit.
- `GET /booth-layout?id=X` — fetch a saved booth layout from DynamoDB
- `PUT /booth-layout` — save/overwrite a booth layout `{id, title, wallsJson}`
- `DELETE /booth-layout?id=X` — delete a booth layout from DynamoDB
- `GET /booth-layouts` — list all saved layouts `[{id, title, updatedAt}]` sorted newest first
- `GET /admin/register/catalog` — **public** (routed before the `/admin` auth gate). Prints for admin's Sell window: `{prints:[{id,title,img,variations:[{id,name,cents,size}],stock}], appId}`. Excludes originals-only and `Market Item` items. Size comes from the variation name (12×16 mat = large, 8×10 mat = small, else price ≥ $40 = large).
- `GET /admin/register/status?cart=ID` — **public**. `{done:true}` if any `dna-sales` row has that `cartId` (used by the admin window that started a checkout).
- `POST /admin/register/complete` — **public**, `{transactionId, state}` where `state = {l:[[variationId, 'f'|'o', 'KS'|'MO'|'', priceCents], …], r: taxRateMilli, c: cartId}`. Verifies the Square order (POS API transaction ID = order ID) is COMPLETED, < 72h old, and that its total (minus tip) equals the cart prices (Sell-window prices, falling back to the live catalog price if absent) + tax. Then writes one `dna-sales` row per print (`id: sq_{txn}_{i}`, conditional put → idempotent/retry-safe; `channel`, pre-tax `price`, per-line `tax`, `state`, `squareTxn`) and atomically decrements `stock.large/small` on the matched painting.
- `GET /admin/paintings` — all paintings with sales joined
- `POST /admin/paintings` — add painting
- `PUT /admin/paintings/{id}` — update painting
- `DELETE /admin/paintings/{id}` — delete painting + all its sales
- `POST /admin/paintings/{id}/sales` — add sale. Optional `decrementStock: true` (sent only by the Sell window's Log sale) decrements print stock server-side with an atomic update; quick sale doesn't send it and still decrements via its own painting PUT.
- `PUT /admin/paintings/{id}/sales/{saleId}` — edit sale (preserves `tax` and `squareTxn` from the existing row)
- `DELETE /admin/paintings/{id}/sales/{saleId}` — delete sale
- `GET/PUT /admin/config` — `rate` ($/sq in for originals), `printCostSmall`/`printCostLarge` (fixed landed costs, $5/$12), `irsRates` (`{"2026": 0.70, …}`, set in admin Settings → Mileage); stored in DynamoDB `__config__`. PUT is read-merge-write (`...existing.Item`), so unknown fields survive.
- `GET /admin/print-prices` — Square print variations grouped by size (`regSizeOf` on the variation name; originals-only and `Market Item` items excluded): `{large|small: {count, prices:[{cents,count}], items:[{title,cents}]}}`.
- `PUT /admin/print-prices` — `{size: 'large'|'small', cents}` → sets **every** print variation of that size in Square to that price via `/v2/catalog/batch-upsert` (only variations whose price differs). admin.html shows a warning listing every affected print before calling it. **This is a live Square write — changes what customers pay everywhere.** Reads the full catalog with pagination and refuses to change anything if it can't read every page. Verified 2026-09-30 (read-only): all 52 small print variations are $25 and all 52 large are $40.
- `GET /admin/expenses` — returns `{ expenses, mileage, recurring }` from `dna-expenses` table
- `POST /admin/expenses` — add expense record
- `PUT /admin/expenses/{id}` — update expense
- `DELETE /admin/expenses/{id}` — delete expense
- `GET/POST /admin/recurring` — list / add recurring def (`type:'recurring'` in `dna-expenses`)
- `PUT/DELETE /admin/recurring/{id}` — update / delete recurring def
- `POST /admin/recurring/run` — generate missing monthly expenses for all active defs (idempotent)
- **Scheduled (not HTTP):** EventBridge Scheduler `dna-recurring-expenses` invokes the Lambda with `{"task":"recurring"}`; handler runs `generateAllRecurring()` before any HTTP routing
- `POST /admin/mileage` — add mileage entry
- `PUT /admin/mileage/{id}` — update mileage entry
- `DELETE /admin/mileage/{id}` — delete mileage entry
- `POST /admin/expenses/receipt-url` — returns pre-signed S3 PUT URL + final CloudFront file URL; accepts `{ filename, contentType, date, amount, category }`; names file `{date}_{amount}_{category}.{ext}` in `receipts/` prefix

**To redeploy Lambda:** Push `index.mjs` to GitHub — deploy is automatic via GitHub Actions.

**Note on images:** Square catalog API returns URLs that 403 in browsers due to hotlink protection. Lambda `/image` endpoint proxies them. All image elements use `referrerPolicy = 'no-referrer'` as a fallback.

**Email sender:** All emails send as `"David Nicholson Art" <david@davidnicholsonart.com>`. Display name set in code; address set via `SES_FROM` env var.

-----

## Google Merchant Center

|Item     |Value                                                       |
|---------|------------------------------------------------------------|
|Account  |Existing account, davidnicholsonart.com claimed and verified|
|Feed URL |`https://davidnicholsonart.com/feed.xml?v=1`                |
|Feed type|Scheduled fetch, daily, XML                                 |

**Notes:**

- Same Lambda `/feed.xml` endpoint used for both Pinterest and Google
- `?v=1` query string required — Google’s URL validator rejected the bare URL without it; bump to `?v=2` etc. to force a re-fetch if needed
- Missing GTIN warnings are expected and acceptable for handmade/art items

-----

## SES (Email)

- Domain `davidnicholsonart.com` verified in SES ✓
- **Production access approved ✓** — guestbook notifications and send-link emails are live
- Sends from `david@davidnicholsonart.com` with display name “David Nicholson Art”

-----

## SMS — retired (June 10 2026)

The toll-free SMS plan was dropped in favor of QR + email. Toll-free verification repeatedly rejected the opt-in as “mandatory not optional” — and for a “text me this link” feature there is no flow where the visitor gets the link *without* opting in, so it could never pass cleanly. The kiosk QR (already present) plus the existing SES email link cover the same need with no carrier dependency.

Cleanup completed this session: toll-free number `+18444767251` released in AWS End User Messaging SMS; Lambda SNS code removed (import, client, `sendSMS`, the `sms` branch in `/send-link`); `AmazonSNSFullAccess` detached from `dna-kiosk-role`. No SMS code or infrastructure remains.

-----

## Email — [david@davidnicholsonart.com](mailto:david@davidnicholsonart.com)

Set up via iCloud+ custom domain. DNS records added to Route 53:

- TXT: `apple-domain=...` verification + SPF record
- MX: `mx01.mail.icloud.com.` and `mx02.mail.icloud.com.` (both priority 10)
- CNAME: `sig1._domainkey` → iCloud DKIM

Sends and receives from Apple Mail on all devices.

-----

## Favicon

- `favicon96.png` — 96x96, used as browser tab icon
- `favicon180.png` — 180x180, used as Apple touch icon (home screen)
- Both files in repo root, deployed to S3 via GitHub Actions
- Tags added to all HTML files

-----

## SEO & Analytics

- **Google Analytics** — Measurement ID: `G-FL5BKJFVXF`, Stream ID: `14175458930`; snippet on all HTML pages
- **Google Analytics linked to:** Google Ads, Google Merchant Center, Google Search Console ✓
- **Google Search Console** — verified via GA tag; sitemap submitted and confirmed fetched
- **Open Graph** — `og-image.jpg` (1200×630, Shuttlecock No. 2) in repo root; OG + Twitter card tags on index.html and gallery.html
- **Per-product OG tags** — `/prints/{slug}.html` files have product-specific title, description, and image for Facebook/Pinterest share previews and Google SEO
- **sitemap.xml** — lists index.html, gallery.html, shipping.html (shop.html removed June 11 2026 — legacy, noindexed)
- **robots.txt** — allows all crawlers, disallows kiosk.html, references sitemap
- **kiosk.html** — has `noindex, nofollow` meta tag; excluded from sitemap
- **Product image alt text** — gallery.html uses Square product description as `alt` text on all images (falls back to title if no description)

-----

## Shopify — Cancelled

Shopify has been cancelled. All product images were already in Square — no image migration needed.

- Facebook/Instagram shops reconnected to Square ✓
- Pinterest shop reconnected via custom feed ✓

-----

## HTML Files

All are currently single-file with no framework. **This is how they were first built, not a rule** (David, October 2 2026) — shared files are allowed where they save duplicate edits; see the shared header/footer to-do under Pending.

**Session workflow:** Claude generates files here, David downloads and pushes to GitHub. GitHub is NOT the source of truth during a session — the latest file Claude produced is. At the start of each session, upload all files from the repo as a starting point.

### Artist Style & Bio

**Style label:** "Regionalist Pop" — David's chosen term for use at art fairs and in conversation. Regionalist subject matter (everyday Midwestern places and people, vernacular scenes) combined with Pop Art's visual language and color confidence. Work is representational but not realistic — forms are distilled and simplified, color is observed then intensified.

**About statement (index.html + meta descriptions):**
> david nicholson is a kansas-based regionalist pop painter working from observation, using distilled, simplified compositions and color to express and reinterpret

**Meta description (og:description + twitter:description):**
> Kansas-based regionalist pop painter working from observation. Prints available online and at art fairs across the KC area.

-----

### index.html (homepage)

- **Hero (October 2 2026):** the whole painting, never cropped, in a 2px navy outline (`var(--accent)`), left-aligned in `.wrap`. `.hero-media` takes the painting's proportions from `--hero-ratio` (set by `showHero()` from the pool entry's `w`/`h`, then corrected from the loaded image) and its width is capped by `calc(max(260px, 100svh - 280px) * ratio)` so nav + painting + caption + name fit the first screen. Any orientation works. Black outline was tried in the prototype and rejected as too heavy — keep navy, matching gallery cards.
- Hero image comes from build-time `hero-pool.js` (daily rotation); Lambda `GET /hero` is only the fallback
- Caption is the print title in quotes, lowercased
- `referrerPolicy`: not set on the hero image (served via the `/image` proxy on our own domain)
- **Past section:** the current year (2026) is a plain always-open list; previous years are `<details class="ev-past">` — collapsed, tap the year to open. No script. When a new year starts, move the old "current year" list into its own `<details>` by hand.
- Guest book section has `id="guest-book"` — the site menu links to `/#guest-book`
- Guest book POSTs to Lambda; includes newsletter opt-in checkbox (“casually stay informed”) — `subscribed` bool stored in DynamoDB
- Contact link uses split string `'mai'+'lto:david@davidnicholsonart.com'` to prevent Cloudflare email obfuscation injection

### gallery.html (public gallery)

- Fetches from Lambda `GET /products`
- Sort: year descending, then alphabetical within same year
- **True-scale wall (October 3 2026)** — replaced the three-column masonry. Each year is a `.wall` (position: relative) and every `.card` is absolutely positioned by `layoutWalls()` at the painting's real relative size, from `width` / `height` on `/products`. No captions, no prices on the wall; the 2px navy outline stays.
  - **Wide screens (>600px):** `wallCluster()` puts the year's largest painting (by area; title breaks ties) in the centre, then places the rest largest-first in the free spot nearest the centre. The finished group is then shifted sideways so its outer edges are centred in the width (David's call, October 3 2026: a centred whole beats a centred largest painting), so the largest can sit slightly off the middle. Scale is `gridWidth / 102` px per inch (≈11.6 at 1280), capped at 13; gap is `2.8 × scale` clamped 14–28px. 102 is deliberate: it is about the largest scale at which 30" + 36" + 30" still fit across — at 94 the 2024 cluster became a tall stack and the page grew ~50%. (First shipped at 118; raised October 3 2026 because the small paintings read too small.)
  - **Phones (≤600px):** `wallRows()` — largest alone on the first row, then centred rows of up to three pairing the next-largest with the smallest that still fit; scale `gridWidth / 56` (≈6.5px per inch at 390), gap 14px — about the largest scale at which a 30"-wide and a 22"-wide painting still share a row (first shipped at 64.6). If small paintings still read too small, the next lever is a softened (non-linear) scale, which gives up strict true scale.
  - A print with no Width / Height in Square is drawn as 18 × 24 (`WALL_FALLBACK`). Layout uses the Square proportions; the image keeps its own proportions (`aspect-ratio: auto w / h`), so nothing is cropped or stretched.
  - Re-hangs on width change via a `ResizeObserver` on `#grid` (rotation, resize, scrollbar); cards are repositioned, not rebuilt, so images don't reload. Lazy loading and the `onerror` retry are unchanged.
  - Year heading sits at the right with a thin rule running back to the left (`.year-heading` is `row-reverse` flex with an `::after` rule).
  - Design reference: Claude artifact "Gallery Grid With Captions", page "True-scale wall" (earlier pages hold the rejected caption, masonry, ring and sketch options).
- Year sidebar filter — sticky left sidebar with year buttons
- **Cart** in top-right nav — shopping bag SVG icon with count badge
- Cart persists in localStorage (`dna_cart`) across page loads and browser closes
- Cart clears from localStorage after successful checkout
- Tap print → bottom sheet modal on mobile, side-by-side on desktop
  - **Size boxes (October 2 2026):** two side-by-side boxes, smallest first (sorted by price), **nothing pre-selected**; each shows small/large, print size, "matted to …", price. Tapped box fills dark. Add button reads "choose a size" (muted) until one is picked, then "add to cart · $25". Sizes are parsed from Square variation names of the form `9 x 12 Matted to 12 x 16 (Bottom Weighted)` by `parseVariationName()`; any other name (e.g. `Regular`) is shown as written. A print with a single variation is auto-selected. Price is **not** shown on the gallery grid — only inside the card (David's choice).
  - “Add to cart” button — adds selected variant, closes modal, returns to grid
  - Swipe left/right to browse on mobile
  - Click image → fullscreen shadowbox
- **Fullscreen shadowbox:** left/right arrows + swipe to navigate; tap background or ✕ to close
- Cart modal: shows all items with thumbnail, title, size, price, remove button, running total
- Checkout button → POSTs to Lambda `/checkout` → redirects to Square hosted checkout
- Checkout redirect URL: `https://davidnicholsonart.com/gallery.html?success=1`
- Product modal title and description use DM Sans (var(–font)) — not serif
- Product modal shows description + “Giclée prints are signed and dated, matted and ready to frame.”
- **Shuffle button** — below year filters in sidebar; shuffles current filtered set (Fisher-Yates); active state orange; SVG inline bowed-arrow icon (placeholder, swap when better icon found)
- Share URLs point to `/prints/{slug}.html` — provides correct OG preview on share
- `?view={ITEM_ID}` param opens product modal directly — used by `/prints/` redirect pages
- `?product_id=ITEMID_VARIATIONID` param adds item to cart and opens cart — used by ad feed links
- `handleViewParam()` must run BEFORE `handleIncomingProduct()` in loadProducts — order matters
- Guest book includes newsletter opt-in checkbox
- Footer buttons white text/border; contact link uses split string

### kiosk.html (art fair iPad)

- Fetches from Lambda (with service worker offline cache)
- Detail modal: title + product description + giclée note + QR code
- QR code, tap-to-open, and email-link all build `davidnicholsonart.com/gallery.html?view={id}` via `pieceUrl(p)` (opens the exact piece on the own domain) — no longer the Square `p.url`. Email-only; SMS button removed June 10 2026
- Guest book POSTs to Lambda → email notification; includes newsletter opt-in
- Export CSV hidden behind triple-tap on “Guest Book” title
- Service worker cache key: `dna-v3`
- **Service worker blocks external image requests** — SW only passes through fonts, cdnjs, and Lambda API

### admin.html (admin dashboard)

- Password gate: PIN verified server-side via `POST /admin/verify-password` (PIN lives only in Lambda env var `PASSWORD`; on success Lambda returns `ADMIN_TOKEN`, which the page sends as `?token=` on all `/admin/*` calls)
- **All admin API calls must go through the `api()` helper**, which appends `?token=` and prefixes `API_BASE` (= `https://davidnicholsonart.com/admin`). Pass the path WITHOUT the `/admin` prefix (e.g. `api('GET','/gallery-stock')`, `api('GET','/paintings')`) — `API_BASE` already supplies it. Never use a raw relative `fetch('/admin/…')`: it skips the token and 401s.
- **Always open at `https://davidnicholsonart.com/admin.html`** (apex, no www) — Safari CORS redirect cache issue
- **PWA:** installable as home screen app on iPhone/iPad via Safari → Share → Add to Home Screen
  - `admin.webmanifest` — app manifest (name: “DNA Admin”, theme: #f8f6f3, orange icon)
  - `admin-sw.js` — service worker caches admin shell; passes all `/admin/*` API calls and S3 receipt URLs through to network
  - `admin-icon.png` (512) / `admin-icon-192.png` — navy #2f4f75 icon with the logo mark (oval + stroke white, triangle red), mark kept inside the maskable safe zone; `admin-favicon96.png` — admin-only browser-tab icon (admin no longer uses the public `favicon96.png`). Replaced the orange DN icon 2026-09-29. iOS caches home-screen icons: delete and re-add the home-screen app to see the new one.
  - Safe area insets applied to topbar and main padding for iPhone notch
- **PWA mode behavior:** home-screen launch shows the same tabs as Safari (the tab restriction was removed); `isPWA` now only compacts expense rows

**Settings panel (gear icon in the top bar, added September 30 2026):** one place for rarely-changed values — **Original pricing** ($/sq in; moved out of the Inventory rate bar, which is gone), **Print prices** (large/small, read live from Square with margin shown; tap/hover the margin for the math `(price − cost) ÷ price` using the fixed $12/$5 costs; changing a price shows a warning listing every print that will change, then writes to Square via `PUT /admin/print-prices`), **Mileage** (one current IRS rate; stored in `__config__.irsRates` under the year it was set, newest carries forward — `currentMileageRate()`. **Each mileage entry stores the rate it was logged at** (`rate` on the `dna-expenses` row) so changing the setting never re-rates past entries; entries logged before Sept 30 2026 have no stored rate and use the fixed `IRS_RATE_BY_YEAR` table — `mileageRate(m)`), **Selling defaults** (moved from Reports; per device, `localStorage`). Print *costs* are deliberately not editable — David's decision: $5/$12 are settled figures.

**Four-tab layout (corrected September 19 2026 — this section had drifted well behind the code; see "Completed This Session" below for the audit):**

- **Expenses & Mileage tab** — expense and mileage tables; tap any row to open edit modal; delete inside modal
- **Inventory tab** — single tab that has absorbed what used to be four separate tabs/sections: base inventory table, **Prints** (via the Prints/Originals type filter chip — no longer a separate tab), **Sales Log** (via the date/channel/state sale filters + filter revenue readout — no longer a separate tab), and **Gallery Stock** (a view toggle within Inventory, not its own tab). See "Inventory tab (merged)" below for what actually lives here now.
- **Booth Planner tab** — art fair wall layout tool (unchanged; see `booth.html` section)
- **Reports tab** (reorganized September 30 2026), top to bottom: **Run report** picker, advertising reminder, sold/stock cards, **Expenses** (total + by month + categories), **Revenue** (total + by month + channel cards), **Taxes Collected** (sum of `sale.tax` — only + Sale checkouts carry tax — with From/To dates, default From 2026-10-01; split by fair state), and the **Run report** picker at the very top (Sales, Expenses, Mileage, Stock, Gallery stock): choosing one opens a form modal for that report — date-range reports get From/To (default: this calendar year, or **last** year in January–April for tax season), Stock and Gallery stock are snapshots with no fields — then ↓ Download CSV. Reports are defined in a `REPORTS` registry and their form fields in `REPORT_PARAMS` (admin.html) — to add a parameter later (e.g. channel), add a param type and list it on the report. **All CSV exports live here now**; every other ↓ CSV button in admin was removed. Removed: Revenue by State, Estimated Taxes by State (both counted every online sale as Kansas), their CSVs, and the "tax collected this month" line.

**⚠ Rate adjuster is single-rate only.** The "dual rate adjuster (standard + large ≥30")" described in earlier revisions of this doc no longer exists — `rateLarge` and the large-painting rate tier were removed end-to-end from `admin.html` and `index.mjs`; `effectiveRate(p)` is now just `return db.rate`. Per-painting `priceOverride` covers the one-off-exception case that `rateLarge` used to handle.

**Inventory tab (merged) — what's actually in it:**

- All paintings sortable by title, year, price, rounded price
- Filters: Never sold, Sold, Original available, Low print stock, Mom doesn’t have
- **Prints filter mode** — Prints/Originals chips reveal a Sold/Unsold sub-filter; Prints mode additionally reveals "0 large" / "0 small" boolean chips filtering to `stock.large === 0` / `stock.small === 0`; all combinable with dimension/moms/gallery filters. (This is the old "Prints tab" — same tiered ranking logic, now reached as a filter rather than a tab.)
- **Sale/date filters ("Sales Log" equivalent)** — "Sold between" date range, Channel (all/art fair/online/gallery), State (all/KS/MO) filters in the filter bar; when any sale filter is active, a **Revenue** readout appears as a small stacked stat block: **Total revenue** (`$total · N sales`, all sale types) always shown, plus — only when the filtered set contains print sales — **Print sales** (`$revenue · N`, large+small only), **Print cost**, and **Print profit** (print revenue − print cost). Originals contribute to Total revenue but are excluded from the Print sales/cost/profit rows entirely — see "Print production costs" below. `↓ Sales CSV` exports the filtered rows (see CSV export note below).
- **Gallery Stock view** — toggle at the top of Inventory (`Gallery Stock` button); rows with any print stock at the selected gallery sort to the top (by title), zero-stock rows sink below (still dimmed)
- Click row → expand: inline edit (title, month, year, dimensions, stock counts, Mom’s Prints checkbox) + sale history
- **Row expand indicator** — flat blue chevron (rotates 90° open)
- Sale logging: date, type (original/large/small), channel (fair/online/gallery), price; gallery channel tracks gross + % + net; art fair channel tracks state (KS/MO)
- Stock +/− buttons autosave immediately (floor at 0)
- Logging a new print sale automatically decrements the matching size stock by 1 (can go negative — intentional)
- **🏷 Tags button** in Inventory tab header: opens a printable Avery 5371/5871 price tag sheet (3.5×2”, 10/sheet) for all paintings currently marked as original available in Square — shows title, year, medium, original price
- Stock CSV (Reports → Run Report → Stock): title, month, year, dimensions, sq in, effective rate, rounded price, stock counts, units sold, original sold status
- Sales CSV (Reports → Run Report → Sales, by date range): Date, Painting, Type, Channel, State, **Ship To**, Price, **Tax Collected**, Net, Print Cost, Net Profit, Lg Stock Remaining, Sm Stock Remaining. No longer tied to the Inventory filters.

**Print production costs (added September 19 2026):**

David's actual per-print landed cost, from his own materials pricing (Canon PRO-310 on Hahnemühle German Etching 310gsm, small = 5×7 printed 2-up on 8.5×11, large = 9×12 printed on 11×17, plus a 25-count show-kit box of mats/backing/bags for each finished size):

- **Small print (→ 8×10 show kit): $5.00**
- **Large print (→ 12×16 show kit): $12.00**

These are stored as `printCostSmall` / `printCostLarge` on the `__config__` DynamoDB record (alongside `rate`), defaulting to 5 / 12 if unset. **No longer editable in admin (September 30 2026)** — the Inventory rate bar was removed and David chose to treat $5/$12 as settled figures. To change them, edit `__config__` in DynamoDB. They drive the margin shown in Settings → Print prices, the Inventory filter revenue readout, and the Sales CSV cost/profit columns. Note: these costs are the same money as the Printing/packaging expenses — year-end profit is revenue − expenses; never subtract both. `GET/PUT /admin/config` now reads/writes all three fields together (`adminUpdateConfig` does a read-merge-write against the existing `__config__` item so updating one field never clobbers the others).

**Cost only ever applies to print sales (`type === 'large'` or `'small'`) — originals are excluded from the cost/profit math entirely**, per David's instruction: originals aren't part of this cost equation. `printCostFor(sale)` in `admin.html` is the single source of truth for this (returns 0 for `type === 'original'`).

Surfaced in two places:
1. **Inventory filter revenue readout** — when a sale filter is active, shows `$total · N sales · print cost $X · profit $Y` (print cost/profit segment only appears if the filtered set contains at least one print sale)
2. **Sales CSV export** — per-row `Print Cost` and `Net Profit` columns

**Note:** these are landed unit costs (paper + ink + a 25-count show-kit box divided per unit, including the upgraded backing), not a live per-print ink/paper calculator — David tracks materials pricing himself and updates the two config fields directly when costs change, rather than the app re-deriving them from paper/ink prices.

**Expense features:**

- Categories: Printing, Framing, Art Supplies, Art Fair Fees, Retail & Packaging, Equipment, Marketing, Licenses & Fees, Insurance, Website & Software, Travel, Other
- Color-coded category badges
- Tap row to edit; delete button inside edit modal (not on row)
- Receipt upload: file picker supports Camera, Photo Library, Browse on iPhone
- Receipt files stored in S3 under `receipts/` prefix, served via CloudFront at `https://davidnicholsonart.com/receipts/...`
- Receipt filename convention: `{date}_{amount}_{category}.{ext}` — e.g. `2026-04-08_145.00_printing.jpg`
- Receipt links are publicly accessible — safe to share in CSV with accountant
- Flat blue expand icon (inline SVG, `ICON_EXPAND` constant) appears inline in description column on mobile so receipts are tappable without hidden column — replaced the 📎 emoji September 2026 as part of a pass removing all 3D/emoji glyphs from admin.html (receipt-view, lightbox Share, and PDF-message icons all now flat inline SVGs colored `var(--accent-ink)` on light backgrounds / white on the dark lightbox overlay)
- Amount column always visible (not hidden on mobile)
- Description column hidden in PWA mode to keep rows clean
- CSV export: date, category, description, amount, receipt URL — receipt URLs are clickable CloudFront links

**Mileage features:**

- IRS rate is set once in **Settings → Mileage** and **locked onto each entry when it's logged** (`POST /admin/mileage` accepts `rate`; `PUT` keeps the entry's stored rate). Deduction = miles × that entry's rate, so editing miles recalculates at the original rate and changing the setting only affects new entries. Older entries without a stored rate use the fixed `IRS_RATE_BY_YEAR` table in admin.html. Update the setting when the IRS announces a new rate — no code change.
- 2025/2026 rate: $0.70/mile; 2024: $0.67/mile
- Deduction auto-calculated per entry using rate for that entry’s year
- Tap row to edit; delete button inside edit modal
- CSV export includes date, purpose, miles, IRS rate, deduction, notes

**Data storage:**

- Expenses and mileage stored in DynamoDB `dna-expenses` table (single table, `type` field = `expense` or `mileage`)
- Receipt files in S3 `receipts/` prefix, served via CloudFront
- Inventory/sales stored in DynamoDB via Lambda API (`dna-paintings`, `dna-sales`)

**Historical data loaded:**

- 2024: 6 expense records
- 2025: 71 expense records + 2 mileage entries (488 miles Lawrence + 40 Westport/KC, $341.60 deduction)
- 2026: 23 expense records from Hurdlr import ($4,049.02 total) — no receipt links yet, add manually
- Total: 100 expenses seeded via `seed-expenses.js`

**Admin token:** stored as Lambda env var `ADMIN_TOKEN` (value in AWS console only). **Enforced server-side as of June 11 2026** — `checkAdminAuth()` validates `?token=` / `X-Admin-Token` with a timing-safe comparison; all `/admin/*` routes return 401 without it. The frontend obtains the token at login via `/admin/verify-password`.

### varied-readings.html (show page)

- Standalone retrospective page for the Varied Readings show (Phoenix Gallery, Lawrence KS, April 2026)
- **Reworked June 2026:** replaced the old canvas tile-flip diptych animation with a static blog-style layout. File dropped from ~2.9 MB (base64-embedded) to ~5 KB.
- Layout: site `<nav>` chrome (back-link “david nicholson” → index + instagram, no cart — matches originals.html) → blog-style title block (“varied readings” h1 + “April 2026 · Phoenix Gallery” meta line) → left-aligned body-text statement (DM Sans) → three full-width images stacked in order with a staggered CSS fade-in (respects `prefers-reduced-motion`) → full-bleed bordered site `<footer>` (© david nicholson + shipping & returns + contact mailto)
- Statement copy: “Varied Readings presented work in pairs, each grouping an exploration of adjacent subject matter approached from shifting compositional and chromatic vantage points.”
- Images served from `https://davidnicholsonart.com/4_26_varied_readings/{1,2,3}.jpeg` — manually uploaded to the S3 bucket (us-east-2), referenced by URL (not base64), apex domain only
- No nav, no JS, single-file inline CSS — same light theme/fonts as the rest of the site
- **Deploy gotcha:** the `deploy.yml` S3 sync only includes `*.jpg`, NOT `*.jpeg`. So these `.jpeg` images are neither uploaded from the repo nor deleted by `--delete` — they live purely as manual S3 uploads and persist across deploys. To make them repo-managed later, add `--include "*.jpeg"` to the sync. (Note: `--include "*.jpg"` matches nested paths, so any `.jpg` in S3 that’s absent from the repo *would* be wiped by `--delete`, except `receipts/*` which is explicitly excluded.)
- Old animation details (no longer in use): 10 paintings in 5 diptych pairs (Junction & Terminal, Early Still & U.S. 50 East, Johnson Drive 6am & 6:01am, KS Wind Farm 1 & 2, Sunflower 1 & 2), 4×4 snake-flip tile grid, click-to-advance

### color-theory.html + color-theory-app.html (color theory study deck)

Public study deck for color relationships and color science — supports the painting practice and gives fair visitors something to play with.

**Two-file split (intentional):**

- `color-theory.html` — the real page. Standard site chrome: fixed `<nav>` with “← david nicholson” back-link + instagram button + cart badge (matches `varied-readings.html` / `originals.html`), lowercase intro paragraph, then the deck in a bordered panel, then the full-bleed site `<footer>`. Has GA, favicons, and OG tags.
- `color-theory-app.html` — the deck app, embedded via `<iframe>`. Kept separate because the app uses generic selectors (`header`, `button`, `main`, `footer`) that would collide with site CSS if inlined. Carries `<meta name="robots" content="noindex">` so it never competes with the wrapper page in search.

**Deck contents (~175 cards, all generated/authored in-file — no API, no backend):**

- **Relationship cards** (multiple choice, “which relationship do these show?”) — complementary, analogous, triadic, split-complementary, tetradic, monochromatic, warm–cool contrast. Built from a 12-hue artist’s (RYB) wheel so complements read the painter’s way (red/green, orange/blue, yellow/violet), across tints/shades/tones so the relationship is learned rather than one memorized pair.
- **Itten’s Seven Contrasts** (multiple choice, “which contrast is this?”) — hue, light–dark, cold–warm, complementary, simultaneous, saturation, extension. Decoys drawn only from the contrast pool.
- **Albers interaction demos** (tap-to-reveal, not scored) — one color as two, vibrating boundary, vanishing boundary, Bezold effect, interactive afterimage, transparency illusion.
- **Color science** (tap-to-reveal, not scored) — additive/subtractive, wavelength, simultaneous contrast, metamerism, afterimage/opponent process, trichromacy, gamut, value & chroma, color temperature.

**Behavior:** 4 tappable choices (correct + 3 decoys), instant right/wrong, running score in the header; keys 1–4 answer, ←/→ navigate, S shuffles; footer filter narrows to any single group. Swatch front faces use a Pantone-style chip layout (color block, white label strip, name + hex lower-right).

**Card ordering — deliberate, don't "simplify" it:** the deck is dealt **shuffled by default**. In raw generation order the deck runs concept-by-concept (20 complementary cards, then 20 analogous…), so the first several cards all share one answer and the quiz becomes guessable by position instead of by reading the swatches. Two guards:

1. `color_deck.py` builders iterate **treatment-major** (hue varies fastest), so consecutive same-concept cards aren't six near-identical value studies of one hue pair.
2. `spread()` in the app shuffles, then does a **local repair pass** that swaps only the cards which would sit next to a card with the same answer. Measured: ~0.28 adjacent repeats per 175-card deal.

An earlier "always draw from the largest remaining group" greedy was tried and **rejected** — it hits zero adjacent repeats but front-loads the biggest group into a perfectly alternating deal (complementary on every other card), which is just as exploitable as a run. Randomness matters more here than a zero score.

**Styling:** rethemed to the live site tokens (white bg, `--ink #2b3640`, `--accent #2f4f75`, Jost). Swatch/demo colors are content and must stay literal — never restyle those to brand colors.

**Print companion (not in repo):** a `color_deck.py` generator produces PDF versions — 3-up on US Letter with cut lines, and a one-card-per-page 3×5 index-card template. The Albers effects are screen-only and excluded from print.

### generate-prints.js (build script)

- Runs in GitHub Actions before S3 sync
- Fetches from `API_URL` (raw API Gateway URL) — NOT through CloudFront (CloudFront blocks GitHub Actions IPs)
- Writes `prints/{slug}.html` per product
- Each file: OG meta tags + `window.location.replace("gallery.html?view=ITEM_ID")`
- Slug logic matches gallery.html share button slug generation
- **Also writes `hero-pool.js`** (repo root, June 2026): `window.__HERO_POOL__ = [{img,title}]` for 2025–26 prints (fallback: all prints with images). The homepage loads it and picks a daily-rotating hero client-side — keeps the slow uncached `/hero` Lambda catalog fetch off the hot path. Deployed by the same `*.js` S3 sync.
- **Hero pool, October 2 2026:** the horizontal/square-only filter is gone — every 2025–26 print with an image is eligible, because the homepage now shows the whole painting. Entries are `{img, title, w, h}`; `w`/`h` are the measured pixel size (omitted if the header read fails) and let the homepage size the box before the image loads.

-----

## DynamoDB Tables

|Table              |Purpose                                                                     |
|-------------------|----------------------------------------------------------------------------|
|`dna-paintings`    |All paintings + `__config__` record (stores `rate` and optional `rateLarge`). Records with `marketItem: true` (Boolean) are hidden from Inventory/Prints/Gallery Stock and exist only to anchor manual market sales in the Sales Log — e.g. `manual_sale` for small originals sold at markets. `title` must be String type.|
|`dna-sales`        |Sales records with `paintingId` foreign key + GSI `paintingId-index`        |
|`dna-guestbook`    |Guest book entries                                                          |
|`dna-orders`       |Square order records                                                        |
|`dna-expenses`     |Expenses and mileage — single table, `type` field = `expense` or `mileage`  |
|`dna-booth-layouts`|Art fair wall layout plans — `id` (PK), `title`, `wallsJson`, `updatedAt`   |

All tables: PAY_PER_REQUEST, us-east-1.

-----

## Receipt Storage (S3 + CloudFront)

- S3 prefix: `kiosk.davidnicholsonllc/receipts/`
- Served via CloudFront behavior `/receipts/*` → S3 origin
- Publicly readable via CloudFront — no S3 public access needed
- Filename convention: `{date}_{amount}_{category}.{ext}`
- Pre-signed PUT URL generated by Lambda `POST /admin/expenses/receipt-url`
- Old Hurdlr receipt links (2024–2025) point to Hurdlr’s S3 — may expire eventually
- 2026 receipts: add manually via admin, will get proper CloudFront URLs

-----

## IAM — Key Policies

**`dna-kiosk-role`** (Lambda execution role):

- `dna-dynamodb-paintings` — read/write on `dna-paintings` and `dna-sales`
- `dna-expenses-access` — read/write on `dna-expenses` + S3 PutObject/GetObject on `receipts/*`
- `booth-layouts-access` (inline, added June 2026) — GetItem, PutItem, DeleteItem, Scan on `dna-booth-layouts`

**Note:** `lambda-deploy` user also has a `booth-layouts-access` inline policy — this was added to the wrong entity (deploy user, not execution role) and is harmless but redundant.

**`lambda-deploy` user** (local seed scripts):

- Inline policy covering `dna-paintings`, `dna-sales`, `dna-expenses` — CreateTable, Describe, full CRUD

-----

## Completed This Session (October 3 2026)

- ✓ **`gallery.html` — true-scale wall.** The masonry grid is replaced by a wall per year where every painting shows at its real relative size, largest in the centre on wide screens and leading on phones. Year headings moved to the right with a rule. See the gallery.html section for the as-built detail. Reverses the June 1 "gallery stays a pure image wall" layout only in arrangement — still no titles or prices on the wall. Tested headless at 1280, 1680, 820, 1024 and 390 wide with all 51 prints: no overlaps, no horizontal overflow, print card opens from a click, desktop → phone resize re-hangs; also with every Width / Height missing (fallback).
- ✓ **`index.mjs` — `/products` returns `width` and `height`.** `buildProductList()` now reads the Square `Width` and `Height` custom attributes (it previously stopped at `Original Available`). Additive; `/feed`, `/hero`, kiosk.html and generate-prints.js ignore the new fields.
- ✓ **Square dimensions corrected (via the Square connector):** Alley, Western Auto 30 × 30 → 16 × 20; Commuter blank → 30 × 30; Fast Eddy 33 × 37 → 37 × 33 (width and height were swapped). All 51 prints now have Width and Height, and each agrees with its live image's proportions within about 2.5%. **Admin keeps its own width / height in `dna-paintings`, so these three were not changed there.**
- ✓ **`gallery.html` print card — original's size on the link.** The link at the bottom of the card now reads `18 × 24" original available →` (width × height from `/products`); with no Width / Height in Square it falls back to `original available →`. Still shown only when `originalAvail && !atGallery`. Built by a new `renderOriginalRow(p)`, called from `openDetail()` **and `slideNav()`** — before this the row was only set on open, so arrowing or swiping to another print kept the first painting's link (a sold print could show "original available"). The link's `onclick` is set as an attribute because `renderAddButton()` re-creates the row from its `outerHTML`. Tested headless on desktop and phone: available, sold, at-gallery, no-dimensions, after choosing a size, and a full next-arrow walk of all 53 products with no mismatches.
- **Found, not changed:** the share buttons (Pinterest / Facebook) have the same staleness — `slideNav()` doesn't rebuild `#share-row`, so after arrowing to another print they still share the first-opened one.
- **Considered and rejected this session:** captions under each print (title + dimensions, then "original and prints available"); looser borderless masonry; big-and-small mosaic; uneven staggered columns; centerpiece ring (sold-first centerpiece rule was chosen, then dropped in favour of largest-in-centre once sizes were true-scale).
- **Noticed, not changed:** Fast Eddy's `ecom_seo_data.page_description` in Square describes a different painting ("three pedestrians walking a trail… original oil painting").

## Completed This Session (October 2 2026)

- ✓ **`originals.html` — paintings at a gallery are hidden.** `loadOriginals()` now filters `!p.atGallery` on the `/originals` response (same rule booth.html already used), so the list, size dropdown counts, year nav, and lightbox all exclude consigned pieces. Reverses the June 9 note "originals.html behavior unchanged (still shows them)". No Lambda change, no service worker involved. Live data at time of change: 47 originals, 5 tagged at gallery (Junction, KS Wind Farm No. 1, Sunflower No. 1, Sunflower No. 2, Waverly Church) → 42 shown.
- ✓ **`gallery.html` modal — "original available →" hidden for at-gallery paintings.** `/products` now returns `atGallery: true/false` per product (new `loadAtGalleryMatcher()` in `index.mjs`: one `dna-paintings` scan run in parallel with the Square calls, matched by squareId or normalized title — same rule as `/originals`). Only `getProducts` uses it; `/feed` and `/hero` are unchanged. The scan is wrapped in try/catch, so a DynamoDB failure can't take down the storefront — the link just shows as before. gallery.html shows the link only when `p.originalAvail && !p.atGallery`. `originalAvail` itself is unchanged (still the raw Square toggle), so admin/dashboard numbers are unaffected.
- ✓ **Site menu on every public page.** A three-line menu icon at the left of the top bar (icon only, no "menu" word — David's choice, October 2 2026; the button carries `aria-label="menu"`) opens a panel: home, prints, available originals — divider — color theory, shipping & returns, guest book, contact. Current page highlighted. Left-anchored dropdown on desktop, full-width sheet ≤600px, scrim + Esc to close. **The same CSS/HTML/JS block is inlined in 11 files** (index, gallery, originals, shipping, color-theory, varied-readings, and the five art-fair pages) — search `SITE MENU`; a menu change means editing all 11. Not added to legacy shop.html, kiosk, booth, admin. Guest book item calls the page's `openGB()` when it exists, otherwise goes to `/#guest-book`; contact uses the split-string mailto. Footer links unchanged. The "prints / originals" tab row was prototyped and rejected (menu only).
- ✓ **`index.html` hero, past-year collapse; `generate-prints.js` pool; `gallery.html` size boxes** — see the index.html, gallery.html and generate-prints.js sections above for the as-built detail.
- **Prototypes (Claude artifacts, David's account):** "Outlined Hero Homepage" and "Gallery Menu and Tabs" — the design references for this batch.
- **How to hide/show an original:** admin → Inventory → expand row → At Gallery = Phoenix Gallery (or — to bring it back). Do not turn off `Original Available` in Square for a consigned piece — that makes it count as sold on the dashboard and blocks price tags.

## Completed This Session (September 30 2026, evening)

- ✓ **`originals.html` — size dropdown.** One left-aligned "size" `<select>` under the page intro; options generated from live `/originals` data (`sizeOf(p)` = smaller × larger side, so 22 × 28 and 28 × 22 are one entry), sorted small → large by area, each with a count; "all sizes" default. List, year sidebar/pills, and lightbox all run off a filtered `shown` array (`buildNav` now clears and rebuilds). Empty result shows "No originals in that size right now." Tested headless against the 41-painting data set: 13 options, 22 × 28 → 12 rows, no errors.
- ✓ **`gallery.html` — cart kept until payment confirmed.** `checkout()` no longer clears `dna_cart` before redirecting to Square; the existing `?success=1` handler is the only place it clears. Added a `pageshow` (bfcache) handler that resets the checkout button so a Back from Square doesn't leave it stuck on "one moment…". Headless round trip: old file → cart 0 after Back; new file → cart 1 after Back, 0 after `?success=1`. Known edge: a buyer who pays and closes the tab before the redirect keeps a stale cart on that browser (auto-log work can clear it properly).
- ✓ **`index.html` — Instagram easter egg (homepage only, David's choice).** Hovering the nav "follow on instagram" pill for 1.5s reveals a dark tooltip (right-anchored under the pill, text left-aligned): "This button is here because one time someone scanned a business card and they were upset that it *only* went to my website and they didn't see [instagram glyph]". Pure CSS (`transition-delay: 1.5s` on hover-in, 0 on hover-out); gated by `@media (hover: hover) and (pointer: fine)`, so it never appears on phones/tablets (no hover there). Tooltip is `aria-hidden` so the link's accessible name stays "follow on instagram".

- ✓ **Online sales auto-log (`index.mjs`) — server-side sweep.** First built as a browser-side confirm (gallery saved the order ID and called a new public `/checkout/complete` on the `?success=1` return, retrying on later visits). **Replaced the same evening** after David's review: (1) a buyer whose confirm failed isn't coming back, so their browser can't be the safety net; (2) a new public path depends on API Gateway routing we couldn't verify. Now the Lambda itself asks Square for paid online orders whenever admin loads (and monthly) — see "Online sale sync" under Lambda endpoints. No new route, no AWS change, no gallery.html involvement. **Ship-to state is stored as `shipState`, not `state`** — `state` means the fair's state on fair sales and drives admin's KS/MO filters and edit-modal select. Sales tax isn't stored on online rows (Square collects $0 — see Online sales tax). Tested: real handler run against faked Square/DynamoDB — admin load logged only the paid online order (3 rows incl. qty 2, stock −1/−2), skipped unpaid / fair-POS / Missouri-location / canceled orders; reload and scheduled run added nothing; a Square search error still returned admin 200. Square check: no online orders (open or completed) since Sept 21, so `ONLINE_LOG_SINCE` = Sept 22 misses nothing.
- ✓ **Expenses & Mileage lists: date range + search replace the year filter.** Each list has its own Search box (Expenses: description + category; Mileage: purpose + notes) and From–To dates (inline mono style, same as Inventory's "Sold between"); From defaults to Jan 1 of the current year, To open (`populateExpYearFilter()` sets the defaults, `inDateRange()` filters). The old `exp-year-filter` select is gone — it also couldn't be reached from the Mileage subtab. Admin SW → `dna-admin-v90`.
- ✓ **Advertising reminder now on the Expenses tab too** (top of tab, same banner as Reports; `renderAdvReminder()` fills every `.adv-reminder`). **Mileage: single current rate, saved per entry** (see Mileage features). `index.mjs` `adminAddMileage`/`adminUpdateMileage` keep `rate`. Admin SW → `dna-admin-v89`.
- ✓ **Admin "new online sale" alert (`admin.html`).** Green-bordered banner under the top bar, on every tab: "New online sale logged" (or "N new online sales logged"), a line saying they're in the Sales Log and out of stock with the pre-shipping total, and one row per sale: date · title · size · price · ships to {state}. **Got it** stores the newest `syncedAt` in `localStorage` `dna-online-seen`; the banner reappears only for rows synced after that. Per device — phone and desktop each show it once. Driven by `syncedAt` on synced rows (manual online sales have none, so they never trigger it). Tested headless: shows on first load, gone after Got it and reload, returns only for a newly synced sale. Admin SW → **`dna-admin-v85`**.
- ✓ **Sync hardening (same evening):** marker row per order (see Lambda "Online sale sync") so a deleted/edited synced sale is never re-logged; refunded orders skipped; `adminUpdateSale` keeps `shipState`/`syncedAt`. Tested: delete 2 synced rows → reload → not re-logged, stock untouched; edit price → `shipState`/`syncedAt` kept.
- ✓ **Admin Settings panel + Reports rework (`admin.html`, `index.mjs`).** See "Settings panel" and "Reports tab" under admin.html. New Lambda: `GET/PUT /admin/print-prices`, `irsRates` in config. Removed the Inventory rate bar (rate chip + $/sq in + print cost inputs) and every scattered ↓ CSV button (Inventory Stock/Sales, Gallery Stock, Expenses, Mileage, Revenue by State, Estimated Tax). Tested headless: Reports order, Taxes Collected range math, all 5 reports download with correct date filtering, only one CSV button remains, Settings margin + hover tip, Square warning shown and **no PUT until "Yes, update Square"**, IRS rate saved to config. Lambda price update tested only against fakes — **first real use: change one size, confirm in Square Dashboard.** Admin SW → `dna-admin-v86`.
- ✓ **Report picker moved to the top of Reports, opens a per-report form modal; Inventory "⋯" button renamed "Tools ▾"** (contents unchanged: Checklist, Take inventory, Price list, Price tags — "Tools" chosen over "Menu"/"Actions" because it names what's inside and "Menu" reads as main navigation on a phone). Tested headless: picker first in tab, all 5 reports download from the form, bad date range blocked, picker resets after each run, Tools opens/closes. Follow-up: picker right-aligned (David's request — where he looks for it), report-form dates use the standard modal `.field` style, Taxes Collected dates match the Inventory/chart inline date pickers. Admin SW → `dna-admin-v88`.
- **Lesson:** don't make a customer's browser responsible for recording the business's own data — anything the customer can abandon mid-flow will eventually go unrecorded. Pull from the source of truth (Square) on our side instead.
- ✓ **Gallery cart re-priced on load.** `refreshCartFromCatalog()` runs after `/products` loads: updates each stored line's price/title/size name/image from the live catalog and drops lines whose print or variation no longer exists (toast: "a print in your cart is no longer available").

**Auto-log groundwork (Square checks, read-only)**

- Every payment link Square returns already carries its `order_id` at creation time (confirmed via `listPaymentLinks` — e.g. link `75FWESBMK7CY47JY` → order `cFhfbe5…`). The Lambda `/checkout` already has it (`related_resources.orders[0]`, saved to `dna-orders`) but doesn't return it to the page.
- Square staff (developer forums, 2024) say production appends `orderId` to the redirect URL; not verified on our live flow.
- ~~**Recommended design:**~~ *(superseded — built, then replaced by the server-side sweep above)* return `order_id` from `/checkout`, store it in `localStorage` as pending before redirect, and on `?success=1` POST it to a new public endpoint that verifies COMPLETED and logs sales + decrements stock (idempotent on order ID). Doesn't depend on Square's redirect params. A webhook (`payment.updated`/`order.updated`) would also catch buyers who close the tab before the redirect — optional second layer.
- Webhook subscriptions couldn't be read from the Square connector (missing `DEVELOPER_APPLICATION_WEBHOOKS_READ` scope). Check in the Developer Dashboard if going the webhook route.

-----

## Findings This Session (September 30 2026) — no code shipped

Discussion/audit session. Nothing was changed in the repo or in Square (read-only checks only). All open work is in **Pending → Next session** below.

**Online sales tax — current behavior (verified against real orders)**

- Nexus: **Kansas only** (David). The Missouri location + 4.22% tax exist for in-person MO fair sales under a temporary permit.
- `checkout()` in `index.mjs` creates a Square Payment Link with `location_id: SQUARE_LOC` (= `LYVD3ZGR3X4KE`, Roeland Park KS), line items by `catalog_object_id` only, and sets no tax or fee options.
- **Every completed online (payment-link, `source: headless`) shipment order checked has `total_tax_money: 0`**, even though the Kansas 9.35% tax is attached to that location. Orders checked 2026-09-30: Rantoul IL (2026-09-21, $25 + $8 shipping, $0 tax), **Prairie Village KS (2026-09-12, $40 + $8 shipping, $0 tax)**, Atlanta GA (2026-05-22, $35 + $8, $0 tax), plus three March 2026 test orders ($0 tax).
- So: out-of-state buyers are correctly charged nothing; **Kansas-destination buyers are also charged nothing, and David owes that tax out of pocket.** The voice-session assumption that payment links charge every buyer 9.35% was wrong — the orders show no tax at all.
- Why this can't be fixed in the Lambda: the buyer's address is entered on Square's hosted checkout page, after the link (and any tax) is already fixed. Nothing on davidnicholsonart.com ever sees the address before payment.
- Reported in the voice session but **not re-verified**: Square's docs say payment links don't support manually applied online taxes on shipping orders, and destination-based tax is a Square Online feature, not a Checkout API / payment link feature. Re-check before relying on it.
- Current decision: leave online payment links untaxed; remit Kansas tax on Kansas-destination online orders manually. Revisit if Square adds destination-based tax to payment links.
- Shipping: Square adds a flat $8 "Flat Rate Shipping, USPS First Class Mail" service charge (non-taxable) on the hosted page — it's not in our Lambda.

**Gallery checkout — issues found (carried over from the admin Sale-window work)**

1. `gallery.html` `checkout()` empties `dna_cart` **before** redirecting to Square. A customer who backs out of Square's page returns to an empty cart. Admin had the same class of bug and fixed it by clearing only on confirmed completion.
2. Online sales never reach `dna-sales` and never decrement stock — `/checkout` only writes `dna-orders`. `?success=1` is unverified (anyone loading that URL clears their cart and sees "order placed").
3. The cart stores each line's price in localStorage for display; Square charges the catalog price (correct), but a stale stored price can show a different total than what's charged.

**Originals page — scope decided**

- The chip/filter/"fits a space" mockup was rejected as too many controls. Wanted: **one dropdown of sizes; pick a size → list shows only paintings of that size.**
- Live `/originals` data (41 paintings, fetched 2026-09-30) has **13 distinct sizes**, not the 5 standard + 1 oddball David expected — see the to-do for the list.

-----

## Completed This Session (September 29 2026)

**admin.html — unified Sale window: log / cart → Square Tap to Pay → auto-logged sales + stock**

Goal: stop the two-step fair routine (charge in the Square app, log prints in admin later). Square only processes the card; admin owns tax math, the sales log, and stock. **One `+ Sale` button** (topbar) opens the Sale window (`openSellModal()`), which now covers everything the old quick-sale modal did — originals, gallery sales (with your %), and a custom date. The old modal (`openQuickSaleModal()`) is no longer linked from the UI; its code is left in place (edit-sale still uses the same modal via `openEditSaleModal`).

- ✓ **`+ Sale` button** — shows cart count (`+ Sale · 2`). Opens the Sale window: search + image grid of Square prints → tap a painting → **Large $40 / Small $25** (prices from Square variations) → Source (Art fair / Online) and State (KS / MO, fair only) prefilled from defaults, changeable per sale.
- ✓ **Originals, gallery, date, and per-sale overrides (after first real test)** — the grid lists every inventory painting (`db.paintings`, minus market items and `Unknown`), with images from the catalog endpoint (which now also returns originals-only Square items, `variations: []`). Options per painting: Large / Small (if Square has print variations) and **Original** (price = `retail(p)`, i.e. `priceOverride` or rounded sq-in price; flags "original sold"). Source dropdown: Art fair / Online / **Gallery**; State shows for fair; **Your % of sale** shows for gallery (net = price × %). **Date** field (defaults today) applies to Log sale; checkout sales use the Square payment date. **Sales tax %** field under the cart starts at the default and can be changed for the current cart (`sessionStorage` `dna-sell-rate`, reset when the cart empties). Gallery sales are Log sale only (Add to cart / Checkout blocked — the gallery collects payment).
- ✓ **Sale window painting picker is a lookup list** — the square thumbnail grid (tiles overlapped on iPhone Safari; `aspect-ratio` on buttons didn't hold) was replaced by a scrollable list: 44px thumbnail, title, print stock per row; selected row highlighted. Decision (David): no collected-tax reporting in admin — tax owed is computed from revenue at filing. A Sales Tax expense category was added then removed at David's request.
- ✓ **Selling defaults** now include Gallery as a source and a **Gallery %** default.
- ✓ **Checkout line format** — `[ref, 'f'|'o', state, priceCents, 'p'|'o']`: kind `p` = print (ref = Square variation ID), kind `o` = original (ref = `dna-paintings` id, price required, no stock decrement). Lambda fetches original rows with `GetCommand`. **Original checkout path has not been run against real Square yet.**
- ✓ **Adjustable price** — picking Large/Small prefills a Price field from Square; edit it before Log sale / Add to cart. Adjusted cart lines show the list price struck through. The adjusted cents travel in the checkout `state` (`[variationId, channel, state, priceCents]`); Lambda uses them for the sale price and tax split and still requires Square's charged total to equal those prices + tax.
- ✓ **Three actions** — **Log sale** (logs just that print now, no charge, pre-tax Square price, decrements stock server-side via `decrementStock: true`); **Add to cart**; **Checkout** (adds the current pick if complete, then sends the whole cart to Square). Cart shows lines with × remove, **Clear cart**, subtotal + tax + total.
- ✓ **Cart storage** — `sessionStorage` (`dna-sell-cart`): survives iOS app switches/reloads, clears when the window/tab is closed.
- ✓ **Selling defaults card (Reports tab, top)** — Source, State, Sales tax % (per device, `localStorage` `dna-sell-defaults`). Also shows tax collected through Sell checkout this month by state (sum of `sale.tax`).
- ✓ **Tax** — admin computes it (Square is told `clear_default_fees: true`, so it adds none). Formula `Math.round(sub × rateMilli / 100000)` lives in both `sellTaxCents()` (admin.html) and `regTaxCents()` (index.mjs) — **keep them identical** or payment verification fails. Square's own reports show $0 tax for these charges; the admin `tax` field is the record. Set the fair city's rate before each fair (Kansas is destination-based).
- ✓ **Square POS API (iOS web)** — `square-commerce-v1://payment/create`, callback `https://davidnicholsonart.com/admin.html`, note lists prints, `state` carries the compact cart. Card only.
- ✓ **Return flow** — `sellHandleReturn()` runs on page load **before the PIN gate**, POSTs to the public `/admin/register/complete`, and shows a banner above the gate (z-index 9000). If already logged in, it re-fetches paintings. Failed log → **Retry** (idempotent). Canceled payment keeps the cart.
- ✓ **Lambda** — `registerCatalog`, `registerComplete`, `regSizeOf`, `regTaxCents`, `regPaintingIndex`; `UpdateCommand` import; `adminAddSale` opt-in atomic stock decrement; `adminUpdateSale` preserves `tax`/`squareTxn`. Routes are under `/admin/register/*` (existing CloudFront `/admin/*` behavior) and matched **before** the auth gate.
- ✓ **Admin SW cache bumped to `dna-admin-v84`** (v74 build, v75 adjustable price, v76 single Sale button, v77 cart-clear fix + login scroll reset, v78 originals/gallery/date/tax override, v79 Sales Tax category (reverted), v80 lookup-list picker, v81 new admin icons, v82 Add to cart next to the painting title, v83 Add to cart moved under the size picker + price, above Source, v84 silent cart keep on cancel).
- ✓ **Cart cleared after Safari returns (fix after first real test)** — iOS returns from Square into Safari, not the home-screen app, so the app's cart survived a successful charge. Checkout now sends a random `cartId` in `state` (stored on each sale row as `cartId`) and remembers it in `sessionStorage` (`dna-sell-pending`). When the app regains focus it calls the public `GET /admin/register/status?cart=ID` (scans `dna-sales` for that `cartId`): logged → clears the cart with a banner; not logged → keeps the cart silently (v84: the earlier Keep/Clear prompt was removed — canceling in Square should need no action). Square always opens the callback URL, in Safari, even on cancel; iOS can't route it back into the home-screen app, so on cancel the Safari tab just says to switch back.
- ✓ **Login scroll reset** — after PIN entry the input is blurred and the page scrolled to top so the mobile tab menu is visible on open (iOS left a keyboard scroll offset). Unverified on device.
- ✓ **Doc fix** — PWA-mode note corrected (home-screen launch no longer hides tabs).
- ✗ **register.html** — built earlier this session as a standalone page, then replaced by the admin Sell window before deploy. Never shipped.

**Manual steps (David):**
1. Square Developer Dashboard → the production application → **Point of Sale API** → **Web** section (not iOS — bundle IDs / URL schemes are for native apps) → Web Callback URL `https://davidnicholsonart.com/admin.html` (exact). Copy the **Application ID** (`sq0idp-…`). ✓ Done and verified with a real charge 2026-09-29.
2. Lambda `dna-kiosk` → env var `SQUARE_APP_ID` = that Application ID.
3. Square token needs `ORDERS_READ` and `ITEMS_READ` (a personal access token has them).
4. iPhone: Square POS app ≥ 6.0 with Tap to Pay enabled.
5. First real test: check out one small print, confirm the Sales Log row (with tax) + stock decrement, then refund in Square and delete the row in admin.

**Known limits:** Square cash payments return no order ID, so Checkout is card-only (log cash with Log sale or + Sale). Paintings not matched to a Square item can't be picked in Sell (use + Sale). Moving a Sell-checkout sale to another painting in the edit modal drops its `tax`/`squareTxn` (the move re-creates the row).

**Existing bug noticed, not changed:** quick sale's stock decrement PUTs the painting with a fixed field list that omits `priceOverride` (and `squareId`, which is backfilled on next load) — `adminUpdatePainting` rewrites the record, so a quick-sale print sale silently clears that painting's price override. The Sell window avoids this via the server-side atomic decrement.

-----

## Completed This Session (September 19 2026)

**Print production cost tracking + steering doc staleness audit**

- ✓ **`printCostSmall` ($5) / `printCostLarge` ($12) config fields** — new fields on the `__config__` DynamoDB record, alongside `rate`. `adminGetConfig`/`adminGetPaintings` return them (defaulting 5/12 if unset); `adminUpdateConfig` (`index.mjs`) now does a read-merge-write instead of a blind `PutCommand` overwrite, so updating the rate alone no longer risks wiping the print-cost fields (or vice versa).
- ✓ **Rate bar UI (admin.html)** — added **Small print cost** / **Large print cost** `$` inputs next to the existing Price/sq in field; same debounced-autosave pattern (`setPrintCost(size, val)` → `saveRatesDebounced()` → `saveRates()` now sends all three fields together).
- ✓ **Inventory filter revenue readout** — `updateFilterRevenue()` now renders a small stacked stat block instead of one line: **Total revenue** (all filtered sale types) always shown, plus **Print sales** / **Print cost** / **Print profit** rows (print revenue only, `printCostFor(sale)`: `printCostLarge`/`printCostSmall`/`0` for large/small/original, and print revenue − print cost) whenever the filtered set contains any print sales. **Originals are excluded from the Print sales/cost/profit rows by design** — David's instruction: cost applies to prints only, not originals; they still count toward Total revenue.
- ✓ **Sales CSV export** — added `Print Cost` and `Net Profit` columns per row.
- ✓ **Admin SW cache bumped to `dna-admin-v70`** (v69 then v70 across two rounds this session — the readout was reworked from a single line into a stacked stat block partway through).
- ✓ **Steering doc audit** — the "Five-tab layout" section had drifted badly out of date (last touched well before several since-shipped changes). Corrected to reflect the actual current **four tabs** (Expenses & Mileage, Inventory, Booth Planner, Reports [renamed from Dashboard]); documented that Prints, Sales Log, and Gallery Stock are no longer separate tabs — all three were absorbed into Inventory as filter modes / a view toggle over past sessions, and this doc never caught up. Also corrected the "dual rate adjuster (standard + large ≥30")" claim — `rateLarge` was removed end-to-end in an earlier session (per-painting `priceOverride` replaced its use case) but the doc still described the old two-rate UI.
- ✓ **Cost basis (David's own materials pricing, not app-derived):** Canon PRO-310 on Hahnemühle German Etching 310gsm — small = 5×7 printed 2-up on 8.5×11 sheets, large = 9×12 printed on 11×17 sheets; plus a 25-count show-kit box of mats/backing/bags per finished size (8×10 kit box $90 incl. upgraded backing, 12×16 kit box $150 incl. upgraded backing, each divided per unit). Landed to $5.00/small print, $12.00/large print.

-----

## Pending — In Order of Priority

### Next session — pick up here (from September 30 2026)

_David's instruction: don't track his tax filings or remind him to log sales — this list is for build/verification work only._

**Sales tax (online)**

- [x] **Record ship-to state on online sales** — done (`shipState` on auto-logged online rows).
- [x] **Admin tax estimate overcounted online sales** — resolved by removing the estimate entirely (September 30 2026). Reports now shows only tax actually collected; Kansas-destination online orders are identifiable via the Sales CSV "Ship To" column.
- [ ] **First print price change through Settings:** after "Yes, update Square", spot-check a few prints in the Square Dashboard and on gallery.html.
- [ ] **Re-verify the Square doc claims** from the voice session (payment links can't do destination tax; auto-apply uses the location rate). Current orders show $0 tax, so also confirm *why* the Kansas tax isn't attaching to payment-link orders — so it doesn't start charging out-of-state buyers 9.35% after a Square or settings change.
- [ ] **Watch Square** for destination-based tax on payment links / Checkout API. Revisit this decision if it ships.
- [ ] Invariant to keep: online checkout must never pass the Missouri location `LHXVQB0QCW9R1`.

**Gallery checkout (`gallery.html` + `index.mjs`)**

- [x] **Keep the cart until payment is confirmed** — done September 30 2026 (evening); see "Completed This Session (September 30 2026)".
- [x] **Auto-log online sales** — built September 30 2026 (evening).
- [x] **Re-price the stored cart** — built September 30 2026 (evening).
- [ ] **First real online order after deploy:** open admin — the green "New online sale logged" banner should appear; confirm the Sales Log row (channel Online, right size/price) and stock went down. If nothing appears, check CloudWatch for `Online order sync` lines.
- [ ] **Refund handling:** if an online order is refunded *after* it synced, delete its sale row(s) in admin and add the stock back by hand; the sync won't re-log it. Refunds before the first sync are skipped automatically.
- [ ] **If you ever log an online sale by hand after Sept 22, it will double up** with the synced row (different IDs). Let the sync do online sales.

**Originals page (`originals.html`)**

- [x] **Add one size dropdown** — done September 30 2026 (evening). Decision: list is generated from whatever sizes exist in Square; David corrects wrong Width/Height values in Square himself (33 × 37 Fast Eddy is correct; the others below are his to check).
- [ ] **Correct Square Width/Height values (David).** The dropdown picks up fixes automatically. David expected 30 × 40, 30 × 30, 22 × 28, 18 × 24, 11 × 14, and one oddball. Live `/originals` (2026-09-30) has 13 sizes:

  |Size   |Count|Paintings|
  |-------|-----|---------|
  |30 × 40|6|Beer Drinker, Evening Walkers, Blue Goose, Umbrella Reverie, Side Street Suburbs; Yellow Umbrella (40 × 30)|
  |33 × 37|1|Fast Eddy|
  |30 × 30|2|U.S. 380; A Walk in Blue and Green|
  |24 × 28|1|I-35 No. 1|
  |22 × 28|12|Junction, Outside of Town, Terminal, KS Wind Farm No. 1, KS Wind Farm No. 2, The Tuntre, Waverly Church, Wayside, Johnson Drive 6 am, Johnson Drive 6:01 am; U.S. 50 East, I-435 Exit 81 (28 × 22)|
  |20 × 24|2|Apparition; Errands (24 × 20)|
  |18 × 28|1|U.S. 380, TX (28 × 18)|
  |18 × 24|9|Off Maple Street, Shuttlecock No. 4, For the Next Hour, I-35 No. 2, Two Dogs, Birdhouse X-Mas 24, On Main, Strasser Hardware, Coming Home|
  |16 × 20|1|Suburbs|
  |14 × 18|3|Santa Fe Trail; Sunflower No. 1; Sunflower No. 2|
  |16 × 16|1|Historic Marker, Eve Ball|
  |11 × 14|1|Old Mission United|
  |12 × 12|1|Resurrection Lilies|

  Either some Square Width/Height values are wrong (fix in Square), or the dropdown lists every size present. Decide before building. Generating the list from the data would keep it correct as paintings sell.
- [ ] **After deploy, verify the at-gallery filter:** originals.html should show 42 paintings and none of Junction, KS Wind Farm No. 1, Sunflower No. 1, Sunflower No. 2, Waverly Church. If an at-gallery painting still shows, its `dna-paintings` title doesn't match the Square title and it has no `squareId` — fix the title in admin.
- [x] **gallery.html modal link** — resolved October 2 2026: link hidden when the painting is at a gallery (`atGallery` added to `/products`).
- [ ] **After deploy, verify the October 2 batch on a phone and a desktop:** homepage shows the whole painting with caption and name on the first screen; 2025 is collapsed and opens on tap; menu opens on every page and each link lands; a print card opens with no size chosen and the button says "choose a size"; picking a box and adding to cart puts the right size and price in the cart.
- [ ] **After deploy, verify the true-scale wall (October 3 2026)** on a phone, an iPad and a desktop: every year is a cluster with the largest painting in the middle (top on a phone), nothing overlaps or runs off the right edge, tapping a painting opens its print card. If every painting is the same size, `/products` isn't returning `width` / `height` yet (Lambda deploy).
- [ ] **Admin dimensions for Alley, Western Auto / Commuter / Fast Eddy** — fix in admin to match Square (16 × 20, 30 × 30, 37 × 33) if they're wrong there; originals.html reads Square, admin inventory reads `dna-paintings`.
- [ ] **Fast Eddy SEO description in Square** describes another painting — rewrite it.
- [ ] **Print card share buttons go stale on next / previous (found October 3 2026).** `slideNav()` calls `populateDetail()` but not the share-row code in `openDetail()`, so Pinterest / Facebook share the first-opened print. Fix: move the share-row build into a helper and call it from both, as `renderOriginalRow()` now does.
- [ ] **Market items reachable from a print card (found October 2 2026).** `/products` returns "Market Item $40" and "Market Item $25" (no year, single `Regular` variation). `renderGrid()` skips no-year products, so they are **not** in the gallery grid (51 cards of 53 products), but `slideNav()` cycles the full `products` array, so next/previous arrows and swipe in a print card reach them and they can be added to the cart. Fix options: drop them from `/products` in `index.mjs`, or filter no-year items out of `products` in gallery.html (check kiosk.html, which also reads `/products`, before changing the endpoint). David to decide.
- [ ] **Update the `dna-kiosk-conventions` skill.** It still says "Single-file HTML, no frameworks, no build pipeline. This is a permanent architectural constraint" — no longer true (David, October 2 2026). Reword that line to match Key Principles here, and do it **before** the shared header/footer work so the skill doesn't steer that session back to single-file. While in there: note that Claude can now push to the repo (pushes to `main` deploy), so the "David pushes" assumption is out of date.
- [ ] **Shared header and footer (maybe).** The top bar, site menu and footer are copy-pasted into every public page (the menu alone is 11 copies). Restructure them as one shared header and one shared footer so an edit is made once and shows across the site. Options to weigh: a small shared JS file that injects them, or a build step in the deploy workflow that stamps them into each page. Decide the approach before building; keep the per-page differences (gallery's cart button opens the cart, other pages link to it; index footer has no guest-book button).
- [ ] **After deploy, verify the modal link:** open a print of an at-gallery painting (e.g. KS Wind Farm No. 1) on gallery.html — no "original available →"; open one that isn't at a gallery and is available — link still there.

### Ongoing

- [ ] **Meta/Instagram Ads — launching now** — $25/week test campaign, 4-week minimum run. Setup and creative plan are in "Completed This Session (July 10 2026)" below. After 4 weeks: review per-ad results, double down on winners, pause losers, log spend under the Advertising expense category.
- [ ] **Admin panel mobile/UX overhaul** — admin.html has grown to five dense tabs and is hard to use on iPad/iPhone (surfaced when trying to export the sales CSV on iPad). Ideas: split into more pages/views, rework tables for touch, make exports easier to reach on mobile. Scope TBD — discuss before building.
- [ ] **Pinterest Ads** — ~$30/day minimum, paused (too expensive for now)

## On the Horizon

- **Newsletter + mailing list manager** — MailerLite vs. custom SES; `/unsubscribe` endpoint; low priority

-----

## Completed This Session (September 6 2026)

**admin.html — inventory filters + flat icon pass**

- ✓ **"0 large" / "0 small" filter chips** — appear alongside Sold/Unsold when Prints mode is active (`typeFilter==='prints'`); filter to `stock.large===0` / `stock.small===0`; reset when switching type filters; combinable with all existing filters.
- ✓ **All emoji/3D icons replaced with flat inline SVGs** — new `ICON_EXPAND`, `ICON_SHARE`, `ICON_CHEVRON`, `ICON_FILE` constants near the top of the main `<script>` block (currentColor-based, so callers set color via CSS). Replaced: 📎 (receipt view → expand icon, `var(--accent-ink)` blue), ⬆️ (lightbox Share → share-nodes icon, left white on the dark overlay — navy would nearly vanish there), 📄 (PDF message → file outline icon, also white on dark overlay).
- ✓ **Inventory row expand indicator redesigned** — went through two iterations before landing: first a maximize/minimize icon pair (swapped on open state), then per feedback that pattern read as unintuitive, replaced with a rotating chevron (`ICON_CHEVRON`, rotates 90° open) — the conventional accordion pattern, closest match to the original behavior of the `▶` glyph it replaced.
- ✓ **Gallery Stock tab now sorts stocked prints to the top** — two-tier sort (any stock at that gallery first, by title; zero-stock below, by title, still dimmed) instead of pure alphabetical.
- ✓ **Admin SW cache key bumped to `dna-admin-v41`** — required since admin.html changed.

**booth.html — Shuffle and Align buttons**

- ✓ **Align button** — re-packs each wall's *existing* pieces into a top-aligned grid (`packWallGrid()`): fills left-to-right with a 4" gap (`GRID_GAP_IN` constant), wraps to a new row (4" gap) when a piece won't fit, row height = tallest piece in that row. Doesn't reassign walls, just tidies. Confirmed working after one round of live testing; gap is a single easy-to-tune constant if 4" reads wrong on an actual wall (David: "may have to look into again with testing").
- ✓ **Shuffle button** — pools every currently-placed piece across all walls, Fisher-Yates shuffles them, redistributes round-robin across walls (skipping a wall if the piece is wider than it), then runs the same `packWallGrid()` on each wall so the result never overlaps. Chosen over pure-random-position placement per David's preference (spread out, no overlaps, since the tool already has overlap-flagging elsewhere but that's not what he wanted here).
- ✓ **Design note for future reference** — hamburger icon was considered and rejected for the row-expand indicator (see admin.html above) because it's conventionally "open a nav menu," not "expand this row" — worth remembering if it comes up again elsewhere in the site.

-----

## Completed This Session (August 31 2026)

**Color wheel: retired the iframe architecture entirely (mobile bug chain)**

Started as a request to fix mobile scrolling on the color wheel tool
inside `color-theory.html`'s "Wheel" tab, and escalated through a chain of
narrower fixes before the actual root cause (the iframe itself) was
addressed:

- ✓ **3/6/12/24 hue-count toggle added** — `HUES3`/`HUES6` pulled from
  `HUES12` at indices [0,4,8] (primaries) and [0,2,4,6,8,10]
  (primaries+secondaries), same pattern as the existing `HUES24`. Default
  changed to 6.
- ✓ **Naming/mixing bug fixed** — at reduced hue counts (3/6), mixed
  results were being colored *and* named against only that reduced set,
  so e.g. Red+Yellow read as "Yellow" instead of Orange (no "Orange" in a
  3-name vocabulary). Fixed by separating concerns: the dial's hue count
  now only controls what you can pick as an ingredient; the actual blend
  color and its name are always computed against the full 24-hue wheel
  (`NAME_HUES`/`NAME_STEP` constants, independent of the display
  `wheelSize`). Verified Red+Yellow→Orange, Yellow+Blue→Green,
  Red+Blue→Violet.
- ✓ **iframe resize feedback loop found and fixed** — the "fit iframe to
  content" script and the child's own `body{min-height:100dvh}` fed each
  other: parent sets iframe height → child's rendered height changes
  (because it's pinned to a % of the iframe's own current height) →
  `ResizeObserver` (watching exactly that) fires → parent sets a new
  height → repeat, surfacing as "Uncaught Script error" spam in the
  console, far more than the handful of edits leading up to it would
  suggest.
- ✓ **iOS double-tap bug found (root cause, not patched)** — resizing an
  `<iframe>` element's own box is a known WebKit quirk that can eat the
  next tap inside it; since this app resizes on nearly every interaction
  (adding a mix color, expanding a relationship), that turned into
  needing to double-tap almost everything, most visibly "+ Mix."
- ✓ **Root cause identified: the iframe architecture itself.** Each fix
  above solved one symptom and re-triggered another (fixing the resize
  loop broke exact-fit sizing again; fixing sizing needed the iframe to
  resize, which re-triggered the tap-eating bug). The three goals — box
  exactly fits content, only the page scrolls, taps never need repeating
  — turned out to structurally conflict as long as a same-origin iframe
  plus JS-measured resizing was in the loop.
- ✓ **Fix: retired `/color-wheel-app.html` as a standalone page and
  iframe target entirely; inlined the wheel directly into
  `color-theory.html`.** No more cross-document height measuring, no
  `ResizeObserver`, no double-scroll, no iframe-resize tap bug — it's now
  plain page content, sized and scrolled the same as everything else on
  the page. Two things made this safe:
  - `header`/`main`/`footer` (and their bare-tag CSS rules) renamed to
    `.wheel-header`/`.wheel-main`/`.wheel-footer`, since `color-theory.html`
    already has its own real `<main>`/`<footer>` with their own bare-tag
    rules that would otherwise collide directly.
  - The wheel's own `:root` CSS variables rescoped to `.wheel-app`
    instead of global, and its entire `<script>` wrapped in one IIFE, so
    none of its ~70 top-level functions/consts (the `$` helper included)
    leak onto `window` and risk colliding with `color-theory.html`'s own
    script.
- ✓ **`Color-Wheel-App-Reference.md` and this doc updated** to point at
  the new location (inline in `color-theory.html`) instead of the retired
  standalone file.

**Lesson for next time:** when a same-origin-iframe embed starts
generating a chain of mobile-only bugs that each fix seems to re-trigger
another one of, stop patching symptoms and ask whether the iframe itself
is structurally necessary. Here it wasn't — it existed only to avoid a
CSS selector collision, which a rename fixes in a few minutes and
permanently removes the whole bug category.

-----

## Completed This Session (July 26 2026)

**Color theory study deck — new public page**

- ✓ **`color-theory.html`** (new) — site-chrome wrapper page: fixed nav with back-link + instagram + cart badge, lowercase intro, bordered deck panel, full-bleed site footer. GA + favicons + OG tags included.
- ✓ **`color-theory-app.html`** (new) — the deck itself (~175 cards), embedded via iframe, `noindex`. Rethemed from its original warm/Space-Grotesk look to the live site tokens (white bg, `--ink #2b3640`, `--accent #2f4f75`, Jost). Swatch colors deliberately left literal.
- ✓ **Footer nav — “color theory” link added** to `index.html`, `gallery.html`, `originals.html`, `shipping.html`, `varied-readings.html`, and the new page itself. Inserted before “contact” on each. Note the footers are NOT identical: `originals.html` uses `onclick="contact()"` (not the split-string mailto), and `shipping.html` has no self-link, so the anchor line differs per file.
- ✓ **`sitemap.xml`** — added `color-theory.html` (priority 0.5, monthly). The app file is intentionally omitted (noindex).
- ✓ **Steering doc palette correction** — the “Key Principles” entry still prescribed the retired warm theme (`--bg #f8f6f3`, `--accent #e07030` orange, `--ink2 #5e6b78` / `--ink3 #64707c`). The live site has been white / `#2b3640` ink / `#2f4f75` steel-blue accent for some time. Principle rewritten with the current tokens + measured AA ratios (ink 12.3:1, ink2 6.05:1, ink3 4.76:1, accent 8.41:1 on white) and an explicit note that the orange palette in the April/June 2026 session logs is historical. Verified identical tokens across all five public pages before rewriting.

- ✓ **Card ordering fixed (caught by David)** — the deck opened with four near-identical red/green cards, all Complementary. Two causes: builders looped hue-outer/treatment-inner so all six value treatments of one hue pair clustered; and the deck was dealt in generation order, so the first 20 cards shared one answer and the quiz was guessable by position. Fixed by making builders treatment-major (hue varies fastest) and dealing shuffled by default with a local repair pass (`spread()`). See the `color-theory.html` section for why the "largest group first" greedy was rejected.

**Iframe rationale:** the deck app uses generic element selectors (`header`, `main`, `button`, `footer`); inlining it into a site page would collide with site CSS. The iframe seals it off, which is why the two-file split exists.

**Bug worth remembering (cost two rounds):** the deck's swatch fronts rendered as name labels with no color. Cause was a height chain — the card sized via CSS `aspect-ratio` with absolutely-positioned faces, and an inner wrapper (`.fade`) had no height, so `height:100%` on the swatches resolved to zero and the color blocks collapsed. Fix: explicit card height, `height:100%` on the wrapper, and paint the color as the swatch's own `background` rather than a child block. Same class of bug bit the Albers “grounds” sample square (percentage height inside a flex parent) — also given an explicit height. **General lesson:** percentage heights need an unbroken chain of resolved heights; when a colored box vanishes, walk the ancestor chain before suspecting the color values.

-----

## Completed This Session (July 10 2026)

**Instagram/Meta ad campaign — planned and ready to launch**

Strategy session (no code changes). Decision: keep the full-time job, grow the art business as a long-game side track, and start driving online demand with a small paid test. Consulting/SaaS side-business ideas were explored and deliberately shelved — not to-dos.

**Campaign structure (Meta Ads Manager):**

- One campaign → one ad set ($25/week budget, Conversions objective) → **five ads, one print image each**. Meta auto-shifts budget to whichever ad converts — this answers "which print should I promote" with data instead of guessing. Not a carousel (carousel hides per-print performance).
- Targeting: broad art/illustration/painting/design interests, ages 18–60, US (+ anywhere with prior sales)
- Each ad links to gallery.html — ideally the specific print via `/prints/{slug}.html` or `?view=` deep link
- Run 4 weeks minimum before judging; check daily the first week only
- Same copy pool pasted into all five ads (Ads Manager allows up to 5 primary texts + 5 headlines per ad and mix-and-matches); the image is the only variable being tested

**Ad creative — five prints, chosen from sales-log analysis (CSV export, July 2026):**

1. **KS Wind Farm No. 2** — top print seller (4 sales), repeat gallery seller
2. **KS Wind Farm No. 1** — one of only two prints ever sold *online* (full $60) — proven online converter
3. **For the Next Hour** — the other online sale, plus a fair sale
4. **U.S. 50 East** — 2 large fair sales at full price
5. **Commuter** — sold prints *and* the original (Utility Pastel and Alley Western Auto share this pattern — good alternates)

Key data insight: sales are breadth-driven — on a fair day David sells ~10 *different* prints, one each, not multiples of one. So limited editions were rejected as a strategy; the print-everything catalog approach stays. The bottleneck is overall demand/discovery, hence advertising.

**Final ad copy (lowercase brand voice, "regionalist pop" positioning mixed with plain-language options so the data shows which converts):**

Primary text options:
1. "wind farms, highways, and quiet streets — the midwest, painted in oil. prints from $35."
2. "the places you drive past every day. worth a longer look. prints from $35."
3. "regionalist pop — the midwest in bright, saturated oil. wind farms, highways, quiet streets. prints from $35."
4. "grant wood meets pop color. paintings of the everyday midwest. prints from $35."
5. "a utility pole at 6am can be beautiful. prints from $35."

Headlines: "the midwest, painted" · "regionalist pop" · "prints from $35" · "art of ordinary places"

Description (rarely shown on IG placements): "painted in oil. printed to last."

**Where copy goes in Ads Manager:** Primary text = caption above the image (hook must land in first ~125 chars); Headline = bold line next to the Shop Now button; Description = small gray text (mostly Facebook-only).

**Follow-ups:**

- Log ad spend under the **Advertising** expense category (dashboard reminder banner already nags monthly)
- After 4 weeks: pull per-ad results, keep winners, note whether the "regionalist pop" copy or plain copy converts better
- New to-do added to Pending: **admin panel mobile/UX overhaul** (exporting the sales CSV on iPad was painful — admin has outgrown its five-tab single-page layout)

-----

## Completed This Session (June 26 2026)

**Market-item support + gallery-stock auth fix**

Goal: sell small originals at first market via a manual Square line item, track them in the Sales Log only — keep them out of Inventory, Prints, Gallery Stock, and the public/kiosk feeds.

- ✓ **`marketItem` flag (admin.html)** — paintings with `marketItem: true` are filtered out of the Inventory tab, Prints tab, Gallery Stock (render + CSV), dashboard stock/count math (`renderCards` now builds a `realPaintings` list excluding them), inventory CSV export, and price-tag printing. They still appear in the Sales Log (which iterates all paintings) and in the sale-modal painting picker (so a market sale can be logged against them).
- ✓ **`manual_sale` placeholder record (`dna-paintings`)** — single record, `id: manual_sale`, `marketItem: true` (Boolean), `title` "Small Original (Market)". All market small-original sales attach to it as `dna-sales` children. **Title MUST be type String (S)** — a String Set (SS) breaks every `.localeCompare` render. No `stock` field needed (code is now guarded).
- ✓ **`Market Item` Square custom attribute (`index.mjs`)** — `getAttr('Market Item') === true` now read into `squareData.marketItem`; the auto-create loop skips Square items flagged true, so "Large Print" / "Small Print" quick-charge line items no longer get auto-created into `dna-paintings`. (Existing Large/Small Print records must be deleted manually once; they won't return.)
- ✓ **Defensive guards (admin.html)** — every `p.stock.large/small` → `p.stock?.…`; every `p.sales.forEach/filter` → `(p.sales||[])`; title sorts → `(a.title||'')`. A malformed/market record can no longer crash a render.
- ✓ **Gallery-stock auth bug fixed (admin.html)** — `loadGalleryStock` and `gsAdjust` were using raw `fetch('/admin/gallery-stock')` (relative path, **no token**) instead of the `api()` helper. This 401'd once the relative-path routing stopped working, blanking the Gallery Stock tab. Now routed through `api('GET'/'PUT', '/gallery-stock')` — `API_BASE` already ends in `/admin`, so the path is `/gallery-stock` (NOT `/admin/gallery-stock`, which would double the prefix). Authenticated and consistent with all other calls.
- ✓ **Admin SW cache key** — bumped to `dna-admin-v30`.

**Debug note:** symptoms (empty inventory, zeroed gallery stock, dead sale button, missing dashboard revenue) were all downstream of unguarded `.stock`/`.title` access on the market record plus the unauthenticated gallery-stock fetch. The "missing total revenue" was a red herring — the dashboard has no single Total Revenue card by design (revenue is split into fair/online/gallery cards). Root cause of the final breakage: `title` added in DynamoDB as a String Set instead of a String.

**Manual steps (David):** create `Market Item` boolean custom attribute in Square + set true on Large Print and Small Print; delete the existing Large Print / Small Print records from `dna-paintings`.

-----

## Completed This Session (June 11 2026)

**Maintainability review + security fixes**

- ✓ **Server-side admin auth enforced (`index.mjs`)** — `checkAdminAuth()` now actually validates the token (was `return true`). Accepts `?token=` or `X-Admin-Token` header, compares to `ADMIN_TOKEN` env var with `crypto.timingSafeEqual`. All `/admin/*` routes 401 without a valid token.
- ✓ **PIN moved out of public HTML (`index.mjs` + `admin.html`)** — new public endpoint `POST /admin/verify-password` checks the submitted PIN against new Lambda env var `PASSWORD` (timing-safe) and returns `{verified:true, token:ADMIN_TOKEN}`. admin.html no longer contains `PASSWORD` or `ADMIN_TOKEN` constants; on login it fetches the token and keeps it in a JS variable (`sessionToken`) for the page session. Auto-submit at 6 digits preserved; in-flight guard prevents double-submit; 401 on any API call logs out with “Session expired.”
- ✓ **Logout clears the token** — closing/reloading the page requires the PIN again (token lives only in memory, not storage).
- ✓ **Admin SW cache key** — bumped to `dna-admin-v26`.
- ✓ **shop.html marked LEGACY** — noindex/nofollow meta, source-comment header (“do not add features here; update gallery.html”), visible archived-banner linking to gallery.html, removed from sitemap.xml. Kept for old links.
- ✓ **Secrets scrubbed from this doc** — Square production token, admin token, and PIN values removed; doc now points to Lambda env vars. NOTE: old values remain in git history — rotating the Square token is recommended (reminder set).

**AWS step required (manual):** add Lambda env var `PASSWORD` to `dna-kiosk` before deploying — see below.

-----

## Completed This Session (June 10 2026)

**Kiosk taken off the Square storefront**

- ✓ kiosk.html QR code, tap-to-open, and email-link now build `davidnicholsonart.com/gallery.html?view={id}` via a new `pieceUrl(p)` helper, instead of the Square `p.url`. Opens the exact scanned piece on the own domain with the site cart + Square payment-link checkout. Chosen over the `prints/{slug}.html` page (which only redirects to the same `?view=` target) to avoid coupling the kiosk to build-time slug-dedup. If Square ever changes terms on the hosted storefront, the booth flow is unaffected.

**SMS / toll-free retired — replaced by QR + email** (details under “SMS — retired” above)

- ✓ Removed the dead SMS “Text” button + phone input from kiosk.html; `sendLink()` is now email-only.
- ✓ Lambda `index.mjs`: removed SNS import, client, `sendSMS`, and the `sms` branch in `/send-link`.
- ✓ Toll-free `+18444767251` released; `AmazonSNSFullAccess` detached from `dna-kiosk-role`.

**Booth planner — wall size toggles (shipped)**

- ✓ New **Walls** button opens a panel: per-wall width steppers + one shared height stepper (1-ft steps; width 4–20 ft, height 6–10 ft). Resizing rescales the scene live and clamps placed pieces back onto shrunken walls. “Reset to 10·7·10” restores defaults.
- ✓ Wall dimensions now persist per layout. Save format bumped to `{v:2, dims:[{w,h}], pieces:[[...]]}`; `parseLayout()`/`applyLayout()` load it and stay backward-compatible with legacy array-only saves (which open at the default 10·7·10 × 8). `wallName(w)` renders live dims in tags/readout; `totalWin()` is now a function so scale recomputes on resize. Removed dead `safeParseWalls`.

**Recurring expenses — shipped (`index.mjs` + `admin.html`)**

- ✓ No new table: recurring definitions live in `dna-expenses` as `type:'recurring'` (alongside `expense`/`mileage`). Fields: `category, desc, amount, dayOfMonth (1–28, clamped), startMonth (YYYY-MM), active, lastRun`.
- ✓ Endpoints: `GET/POST /admin/recurring`, `PUT/DELETE /admin/recurring/{id}`, `POST /admin/recurring/run`. Recurring defs are also included in the `/admin/expenses` payload (`{ expenses, mileage, recurring }`).
- ✓ `generateAllRecurring()` brings every active def current: one expense per month from each def’s `startMonth` through the current month, dated with the def’s `dayOfMonth`. Idempotent via a per-month existence check (`recurringId` + month) — re-running, backfilling, and the cron never duplicate. Generated rows are normal `type:'expense'` records tagged `recurringId` + `auto:true`, fully editable and included in the CSV export.
- ✓ Admin UI: **Recurring** section in the Expenses & Mileage tab (add/edit modal: category, amount, day-of-month, start month, active; inline On/Off toggle; single **↺ Generate expenses** button). Dashboard gains a **Recurring / month** card listing active items + monthly total.
- ✓ EventBridge **Scheduler** schedule `dna-recurring-expenses`: `cron(0 6 1 * ? *)` America/Chicago → Lambda `dna-kiosk`, constant input `{"task":"recurring"}`. Handler detects `event.task === 'recurring'` at the top and runs the generator. No new Lambda IAM (DynamoDB already covered); Scheduler’s auto-created role grants invoke. The cron is only a monthly wake-up — start months and day-of-month are handled in code, so the cron date matches nothing by design.
- ✓ Design note: dropped an initial January-only “Backfill year” button in favor of per-item `startMonth` + one “Generate expenses” that fills each item from its own start.

**Advertising category + reminder (`admin.html`)**

- ✓ New **Advertising** expense category (teal `cat-advertising` badge) added to the filter, expense modal, recurring modal, and `CAT_CLASS`. No Lambda change — category is a free-text stored string.
- ✓ Dashboard reminder banner: shows “No Advertising expense logged for {Month Year} yet” whenever the current month has no Advertising expense; the **Add advertising expense** button opens the modal pre-set to Advertising. Current-month only (no nagging about past months); clears automatically once an entry exists (manual or recurring).

**Deploy footgun found: stale `index.js`**

- ✓ The repo tracks both `index.js` (old, pre-SNS-cleanup) and `index.mjs` (current). The workflow deploys **only** `index.mjs` (`zip lambda.zip index.mjs`). Editing `index.js` does nothing — this caused a session where `startMonth` wouldn’t save (new frontend, stale Lambda). **TODO: `git rm index.js`** to remove the footgun. Always edit `index.mjs`.

-----

## Completed This Session (June 9 2026)

**Booth Planner (`booth.html`) — complete build**

New standalone page for pre-fair layout planning. Noindex, linked from admin topbar (Booth Planner button, left of + Sale). No PWA/SW dependency — unregisters any active SW on load so admin/kiosk SWs don’t interfere.

- ✓ **Three-wall layout** — Left 10×8, Center 7×8, Right 10×8 ft, shown to scale in browser. Walls sized correctly to match real panel height (8 ft) rather than booth footprint (10 ft).
- ✓ **Live catalog from `/originals`** — painting list with thumbnails, real Square dimensions. Phoenix Gallery paintings excluded via `atGallery` field added to `getOriginals` response (DynamoDB scan of `dna-paintings` cross-referenced by squareId + normalized title).
- ✓ **title reserved word fix** — DynamoDB `ProjectionExpression` aliases `title` as `#t` in ExpressionAttributeNames; previously threw a ValidationException silently killing `/originals`.
- ✓ **Drag & tap placement** — tap to arm a painting (gold highlight), tap wall to place; or drag from palette directly onto wall. Placed pieces drag to reposition; tap ✕ to remove. Touch scroll fixed: palette items use `touch-action: pan-y` + `pointercancel` handler so vertical list scroll works without accidentally picking up paintings.
- ✓ **Coverage readout** — per-wall coverage %, sparse/balanced/crowded verdict, overlap detection (red outline).
- ✓ **Server-side layout storage** — new DynamoDB table `dna-booth-layouts` (PK: `id`, fields: `title`, `wallsJson`, `updatedAt`). Lambda routes: `GET/PUT/DELETE /booth-layout`, `GET /booth-layouts`.
- ✓ **CloudFront behaviors** — `/booth-layout*` and `/booth-layouts*` added to E2EJH38GWGPEPG pointing to API Gateway. **Critical:** booth.html calls `davidnicholsonart.com/booth-layout` (same-origin via CloudFront), not the raw API Gateway URL. This avoids CORS preflight failures — admin.html always used same-origin calls so PUT CORS had never been tested on this Lambda.
- ✓ **Named multi-layout save/load** — Save button prompts for a name, saves to DynamoDB, URL gains `?id=UUID`. “Open saved” fetches all layouts from server (`GET /booth-layouts`) so any device sees the full list without needing a URL. Layout select dropdown in toolbar for quick switching.
- ✓ **Server delete** — `DELETE /booth-layout?id=X` removes from DynamoDB; × in Open saved panel calls it.
- ✓ **SW unregister** — booth.html detects any active SW (admin or kiosk), unregisters all, and auto-reloads so the page runs SW-free. Prevents admin-sw and kiosk SW from intercepting API calls.
- ✓ **Admin SW v22** — `/booth-layout` path added to passthrough list; kiosk SW fixed to handle all API methods (not just GET).
- ✓ **IAM** — `dna-kiosk-role` inline policy `booth-layouts-access`: GetItem, PutItem, DeleteItem, Scan on `dna-booth-layouts` table.
- ✓ **Prints tab simplified** — removed the four color-coded tier sections (Out of Stock red, Low Stock yellow, etc.). Prints now render as one sortable flat table; only controls are the two checkboxes (0 large / 0 small). Tier grouping was redundant once the stock columns are visible.
- ✓ **atGallery in `/originals`** — Lambda now scans `dna-paintings` in parallel, builds a gallery set by squareId + normalized title, tags each painting `atGallery: true` if matched. Booth planner filters these out; originals.html behavior unchanged (still shows them).
- ✓ **Shuffle / Align (September 2026)** — see "Completed This Session (September 6 2026)" below.

## Completed This Session (June 1 2026)

**Hero image performance — daily-rotating build-time pool**

- ✓ **Root cause** — homepage hero painted only after two serial uncached round trips: `loadHero()` → raw API Gateway `/hero` (never CDN-cached, cold-start-prone, re-fetched the entire Square catalog to pick one painting) → then set `img.src` → second hop to `/image?id=`. Image was also only appended on `onload`, so no progressive paint and the preload scanner never saw it.
- ✓ **`generate-prints.js`** — now also writes `hero-pool.js` to repo root at build time: `window.__HERO_POOL__ = [{img,title}]` for 2025–26 prints (falls back to all prints with images). Picked up by the existing `*.js` S3 sync; regenerated every deploy.
- ✓ **`index.html`** — loads `hero-pool.js`, picks one painting **client-side, rotating daily** (`Math.floor(Date.now()/86400000) % pool.length`), inserts the `<img>` immediately (progressive paint) with `fetchpriority="high"` / `decoding="async"`, reserves a square box to avoid layout shift, and `preconnect`s to davidnicholsonart.com. Old live `/hero` fetch kept as fallback if the pool file is missing. No Lambda change. Net: the only hot-path request is the (CloudFront-cached) image; because everyone gets the same painting on a given day it stays cache-warm.

**SMS opt-in language** — see “SMS — retired” (June 10 2026); toll-free verification flagged opt-in wording, compliant one-time/transactional language drafted.

**Public site styling pass (fair-season, first-time visitors)**

- ✓ **AA contrast (site-wide tokens)** — secondary grays were failing WCAG AA on the `#f8f6f3` bg (`--ink2 #7a8a99` = 3.3:1, `--ink3 #9aa0a8` = 2.4:1). Darkened to **`--ink2 #5e6b78`** (5.06:1) and **`--ink3 #64707c`** (4.69:1) in both `index.html` and `gallery.html`. In gallery modal/cart, the `#a8a39d` micro-labels (size/share/optional/giclée note, 2.2:1 on the `#f5f2ed` sheet) bumped to `#6b6560` (5.1:1).
- ✓ **index.html — container** — kept the original **left-anchored** layout (`margin: 0`, desktop `padding: 0 40px 60px 10%`) per David’s preference; centering was tried (`margin: 0 auto`) and reverted. Added a mobile breakpoint (`@media max-width:600px → padding: 0 20px 60px`) to fix the phone squeeze, which was the real issue.
- ✓ **index.html — primary CTA = Instagram** — under the title, “follow on instagram” is now the filled orange primary, “view gallery” the outline secondary (with arrow). Rationale: business-card scans already land people on the site, so the face-up button adds value by giving a one-tap follow. Hero image still links to gallery. Old `.follow-btn` class renamed `.cta-secondary`.
- ✓ **index.html — staggered load reveal** — repurposed the unused `sk` keyframe into a `reveal` fade-up; staggered across title→about→future→represented→past; gated behind `prefers-reduced-motion`; no-base-opacity so content never gets stuck hidden if animation doesn’t run.
- ✓ **gallery.html — type unified to Jost** — was DM Sans + Playfair Display; switched font link + `--font` token to Jost and retired the `--serif` token (cart/guestbook/product titles now Jost). Homepage and gallery now read as one brand.
- ✓ **gallery.html — staggered reveal** — same `reveal` keyframe applied per year-section as it renders (`revealIdx`, capped at ~0.4s), reduced-motion guarded.
- ✓ **Decision: gallery stays a pure image wall** — no card titles/prices/buttons added (David’s call).
- ✓ **gallery.html — image load resilience** — card images were firing ~40 simultaneous `/image?id=` requests; on a cold cache the proxy (CloudFront → Lambda → Square) throttled and ~1/3 failed, rendering blank with no recovery (refresh “fixed” it by warming the cache). Added `loading="lazy"` + `decoding="async"` to spread the requests, and an `onerror` retry (up to 3×, backoff, cache-busting `retry=N` param) so transient blanks self-heal without a manual refresh. Not caused by the styling pass.

**Files touched:** `index.html`, `generate-prints.js`, `gallery.html` (+ new generated `hero-pool.js`).

-----

## Completed This Session (April 14 2026)

- ✓ **Admin inventory Original column** — now driven by Square `Original Available` attribute; green “sold” badge when false/unset, blank when true; filter chip updated to match
- ✓ **Dashboard Originals Sold/In Stock** — both now use Square `originalAvail` data instead of DynamoDB sales records
- ✓ **`originalAvail` in Lambda `/products`** — `buildProductList` reads Square `Original Available` custom attribute and includes `originalAvail: true/false` on every product
- ✓ **`originalAvail` in Lambda `adminGetPaintings`** — fetches Square catalog in parallel, merges `originalAvail` onto each painting by normalized title match
- ✓ **Gallery modal “original available →” link** — appears below share buttons when `p.originalAvail` is true; links to originals.html; right-aligned orange text with arrow
- ✓ **originals.html renamed “Available Originals”** — title, h1, OG/Twitter tags updated; subtitle is plain text (no link)
- ✓ **originals.html contact link** — “contact” mailto link with painting title as subject and title/medium+dims/price as body, stacked one per line
- ✓ **originals.html click behavior** — thumbnail click opens lightbox; contact click opens mailto; row click does nothing; row no longer shows pointer or hover highlight
- ✓ **originals.html nav** — back arrow links to gallery.html and reads “prints”; instagram button reads “follow on instagram”
- ✓ **originals.html footer** — added “david nicholson” link to index.html
- ✓ **gallery.html footer** — added “available originals” link to originals.html before shipping & returns
- ✓ **Receipt upload feedback** — save button disables and shows “Uploading…” during S3 PUT; zone shows ⏳/✓/✗; PUT response checked for errors
- ✓ **S3 sync receipt bug fixed** — `--exclude "receipts/*"` added to deploy.yml before `--delete`; previous deploys were wiping all uploaded receipts
- ✓ **DynamoDB title corrections** — all 6 painting titles corrected via admin UI
- ✓ **admin-sw.js cache** — bump to `dna-admin-v4` after pushing admin.html changes this session

## Completed This Session (May 22 2026)

- ✓ **Prints tab — show all paintings** — removed filter that required stock > 0 or a print sale; all paintings now appear in the Prints tab regardless of stock (the point is to show what needs to be printed)
- ✓ **🏷 Tags button moved to Inventory tab** — removed from topbar; now sits in the Inventory tab header alongside ↓ CSV and + Add Painting; topbar now only has + Sale and sign out
- ✓ **Sales Log tab** — new fifth tab; filterable table of all sales with date range (from/to), channel (all/art fair/online/gallery), and state (all/KS/MO) filters; summary bar shows sale count, total revenue, and net; CSV export; covers art fair debrief, monthly KS sales tax reporting, and year-end taxes
- ✓ **Art fair state field** — sale modal shows KS/MO state dropdown when channel is “Art fair”; state saved with sale record; shown inline in inventory expand row (e.g. “Art fair · KS”); edit modal restores state correctly
- ✓ **Lambda — state field in sales** — `adminAddSale` and `adminUpdateSale` now destructure and persist `state` field to DynamoDB `dna-sales`
- ✓ **Square auto-sync confirmed** — new paintings added in Square automatically appear in admin Inventory on next load (Lambda `adminGetPaintings` auto-creates DynamoDB records by title match); no sync button needed; Prints tab shows them once they exist in inventory
- ✓ **Admin SW cache key** — bump to `dna-admin-v6` after deploying this session’s admin.html

## Completed This Session (May 21 2026)

- ✓ **index.html — Varied Readings moved to past** — removed from future section; added 2026 year header in past with “varied readings at phoenix gallery” / lawrence, ks; same link (/varied-readings.html), no arrow
- ✓ **index.html — Crossroads Night Market added** — july 3rd, 4th & 5th, kansas city, mo; link to kccrossroads.org/night-market/; future section now ascending: OP art fair → Crossroads
- ✓ **index.html — Phoenix Gallery represented link updated** — now points to /collections/david-nicholson page
- ✓ **SNS carrier registration submitted** — form completed (use case: transactional notifications); was sitting incomplete since March 19; check back in ~1 week
- ✓ **List cleanup** — removed: admin token auth, www→apex redirect, print wall configurator, color picker, art fair mode enhancements, DynamoDB migration, CloudFront Pro (already done); mileage bug confirmed resolved

## Completed This Session (May 9 2026)

- ✓ **Dual pricing** — second “Large (≥30”) / sq in” rate field in inventory rate bar; if either dimension ≥ 30, `effectiveRate(p)` uses `rateLarge` instead of `rate`; both rates saved to DynamoDB `__config__`; inventory table, sort, CSV export, and price tags all use effective rate per painting
- ✓ **Rate bar inputs** — changed from number spinners to plain text fields (`inputmode="decimal"`); larger, squarish, centered text
- ✓ **Sale → stock decrement** — logging a new print sale (large or small) decrements that size’s stock count by 1 immediately; no floor (can go negative); edit-sale does not touch stock
- ✓ **🏷 Tags button** — prints Avery 5371/5871 price tags (3.5×2”, 10/sheet) for all currently-available originals; shows title, year, medium + “ on canvas” (appended only if not already present), dimensions, original price; skips sold originals
- ✓ **Medium in adminGetPaintings** — `medium` field from Square `Medium` custom attribute now correctly merged onto existing DynamoDB painting records (was missing from the `.map()` return; only auto-created records had it)
- ✓ **Medium display logic** — appends “ on canvas” if Square `Medium` value doesn’t already contain “on canvas”; falls back to “oil on canvas” if attribute is empty
- ✓ **Admin SW cache key** — bumped to `dna-admin-v5`

## Completed This Session (May 4 2026)

- ✓ **Prints tab** — new fourth tab in admin.html; four separate tables by stock tier (Out of Stock / Low Stock / Below Goal / Stocked); ranked by popularity score (70% sales volume, 30% recency) within each tier; “Zero stock only” checkbox filters to both-sizes-at-zero; column header click collapses to flat sortable table with “✕ Clear sort” to return; Print Lg/Print Sm columns show quantity needed to reach goal (2 large, 3 small); stock in red when below goal
- ✓ **Dashboard top print cards** — two new cards: Top Large Print and Top Small Print, showing title and units sold; show “—” when no sales recorded yet

## Completed This Session (April 15 2026)

- ✓ **Receipt lightbox** — tapping 📎 receipt now opens an in-app lightbox instead of navigating away; image receipts show inline; PDF receipts show Open in browser link; close via ✕ button, backdrop tap, or Escape key
- ✓ **Receipt share sheet** — ⬆️ Share button in lightbox fetches receipt as blob and invokes native iOS share sheet (`navigator.share({ files })`); supports both JPG and PDF; falls back to URL share then window.open
- ✓ **Google brand exclusion** — “David Nicholson” brand approved and applied as exclusion on Performance Max campaign
- ✓ **Google Merchant Center feed** — manual fetch triggered; product type warnings cleared
- ✓ **2026 receipts** — all 23 expense records updated with receipts via admin PWA
- ✓ **Receipt persistence** — confirmed receipts survive deploy (S3 sync bug was the cause, now fixed)

## Previously Completed — originals.html & Square attributes

- ✓ **`originals.html`** — new page listing available original paintings; light theme, year sections, thumbnail rows with medium/dimensions/price, fullscreen lightbox with swipe nav, contact mailto link
- ✓ **Lambda `/originals` endpoint** — filters Square catalog for items where `Original Available` custom attribute is true; reads `Width`, `Height`, `Medium`, `Year` from Square custom attributes; calculates price from `width × height × rate` (rounded to nearest $50) using admin config rate from DynamoDB
- ✓ **Square custom attributes created** — `Width (in)`, `Height (in)`, `Medium`, `Original Available` (toggle); all paintings being filled in
- ✓ **Square title standardization** — all 6 DynamoDB titles corrected to match Square canonical names

-----

## Previously Completed — Site-wide light theme & gallery redesign

- ✓ **Google Performance Max campaign launched** — $5/day, Maximize Conversion Value, US only
- ✓ **Gallery redesign** — masonry columns (3 desktop / 2 mobile), natural image proportions, white mat/padding effect on cards
- ✓ **Gallery year sections** — chronological year sections; sidebar and mobile bar are anchor jump-nav with scroll spy
- ✓ **Site-wide light theme** — gallery.html, index.html, varied-readings.html (kiosk.html stays dark)
  - Palette: `--bg: #f8f6f3`, `--ink: #1a2a3a`, `--ink2: #7a8a99`, `--ink3: #9aa0a8`, `--accent: #e07030`
- ✓ **shipping.html** — full light theme; consistent nav and footer
- ✓ **index.html footer full-bleed** — removed max-width constraint; added shipping & returns link
- ✓ **Guestbook modal** — rounded corners (16px) and orange submit button consistent across all pages
- ✓ `varied-readings.html` created — Varied Readings show page, April 24, 2026, Phoenix Gallery Lawrence KS
- ✓ Pinterest share buttons added to gallery.html product modal
- ✓ Per-product /prints/ pages implemented
- ✓ Pinterest Verified Merchant — ✓ verified April 2026
- ✓ CloudFront Pro upgrade — ✓ April 2026; 25-behavior limit no longer a constraint

-----

## Cloudflare Note

`davidnicholsonllc.com` was previously on Cloudflare. Cloudflare injects email obfuscation scripts. Workaround: all mailto links use split-string JS (`'mai'+'lto:...'`). **Do not use plain `href="mailto:..."` links anywhere.**

-----

## iPad Art Fair Setup

1. Open <https://davidnicholsonart.com/kiosk.html> in Safari
1. Let all prints load on good WiFi (populates offline cache)
1. Safari → Share → Add to Home Screen
1. Settings → Accessibility → Guided Access to lock iPad to kiosk

## iPhone Admin Setup

1. Open <https://davidnicholsonart.com/admin.html> in Safari
1. Safari → Share → Add to Home Screen
1. Opens full-screen as “DNA Admin” with orange DN icon
1. Launches directly to Expenses & Mileage tab — tap + Add Expense to log immediately
1. Full admin (all tabs) always available by opening admin.html in Safari directly

-----

## Key Principles

- **Color wheel app has its own reference doc** — `Color-Wheel-App-Reference.md` at repo root. Read it before touching the wheel code. As of August 2026 the wheel is inlined directly into `color-theory.html` (no more standalone `color-wheel-app.html`, no iframe — retired after a chain of mobile bugs the iframe architecture kept causing; see the reference doc's "Where this lives" section). Covers the wheel-position mixing math, why real pigment physics (spectral.js) was tried and reverted, the adaptive black-tinting model, and the naming system — a lot of non-obvious constants in that file exist for researched, specific reasons.

- **ACM certs for CloudFront must be in us-east-1** — any other region silently fails
- **HTML structure** — pages are single-file today with no framework or build pipeline; that is history, not a constraint (David, October 2 2026). Prefer simple shared files over copy-pasting the same block into many pages. Still no need for a framework.
- **Always ask which file** — if a request doesn’t specify which HTML file to update, ask before making changes
- **Square Payment Links**: use `checkout_options: { ask_for_shipping_address: true }`
- **No mailto links** — use split-string JS onclick to prevent Cloudflare obfuscation
- **S3 bucket is in us-east-2** — despite most other resources being in us-east-1
- **IAM role must explicitly list both CloudFront distribution ARNs** for invalidation to work
- **S3 bucket name is `kiosk.davidnicholsonllc`** (no .com)
- **`davidnicholsonart.com` is served by E2EJH38GWGPEPG** — not E31J8ASEUTGXD9 (that’s the kiosk legacy domain)
- **CloudFront /image* must forward query strings** — set Origin request policy to AllViewerExceptHostHeader; without this Lambda never receives the `?id=` param and returns 404
- **API_URL Lambda env var** — must be `https://davidnicholsonart.com`; controls image URL domain; Pinterest rejects raw API Gateway URLs
- **generate-prints.js fetches from API Gateway directly** — not through CloudFront; CloudFront blocks GitHub Actions runner IPs
- **handleViewParam before handleIncomingProduct** — handleIncomingProduct wipes the URL unconditionally; view param must be read first
- **Kiosk service worker blocks all external requests** except fonts, cdnjs, and Lambda
- **Admin SW cache key** — currently `dna-admin-v90` (bumped 2026-09-30: Expenses/Mileage date range + search); bump in `admin-sw.js` after every admin.html change
- **Lambda deploys from `index.mjs` only** — the workflow runs `zip lambda.zip index.mjs`. A stale `index.js` is also tracked in the repo and is NOT deployed; editing it leaves the live Lambda unchanged (symptom: frontend works, backend ignores new fields). Always edit `index.mjs`; `git rm index.js` to remove the trap.
- **Receipts are NOT in S3 Block Public Access whitelist** — served via CloudFront only; do not attempt to make `receipts/` prefix publicly readable via bucket policy
- **Receipt filename values read from DOM at save time** — not from pre-parsed JS variables, to ensure correct date/amount/category regardless of field fill order
- **S3 sync `--delete` wipes receipts** — deploy.yml must include `--exclude "receipts/*"` after the `--include "*.jpg"` line; without it every deploy deletes all uploaded receipts
- **Debug order: check the code first** — when something isn’t working after a push, review the code for bugs before assuming the deploy didn’t complete or the user made an error. Both Claude and David make mistakes; neither is infallible. Start with the code.
- **Public site uses Jost** — all public pages run the Jost font stack (`'Jost', Futura, 'Trebuchet MS', Arial, sans-serif`); gallery was unified away from DM Sans + Playfair in June 2026. Keep new public pages on Jost for brand cohesion.
- **Public site palette (current — verify against `index.html`)** — `--bg: #ffffff`, `--surface: #eef1f4`, `--border: #dfe4e9`, `--ink: #2b3640`, `--ink2: #586470`, `--ink3: #697480`, `--accent: #2f4f75` (steel blue), `--accent-hi: #3d5f88`, `--accent-ink: #33557d`. Identical across `index.html`, `gallery.html`, `originals.html`, `shipping.html`, `varied-readings.html`, `color-theory.html`. All clear WCAG AA on white (ink 12.3:1, ink2 6.05:1, ink3 4.76:1, accent 8.41:1) — don't lighten the grays. **NOTE:** the old warm/orange theme (`--bg: #f8f6f3`, `--accent: #e07030`, `--ink2: #5e6b78` / `--ink3: #64707c`) is HISTORICAL — it appears in the April/June 2026 session logs below and is no longer live. Match the live files, not those log entries.
- **Homepage hero** — daily-rotating, sourced from build-time `hero-pool.js`, not a live Lambda call (see generate-prints.js); rotates per UTC day, so it’s not a per-visit random.
- **Gallery card images: lazy + retry** — the `/image` proxy throttles under the ~40-request burst a full grid fires on a cold CloudFront cache, leaving random blanks. Card `<img>`s use `loading="lazy"` to spread requests and an `onerror` retry (backoff + cache-busting param) to self-heal. Don’t remove these.

-----

## Contacts & Accounts

|Service              |Detail                                                                                   |
|---------------------|-----------------------------------------------------------------------------------------|
|Instagram            |@dave_nichol_son                                                                         |
|Personal email       |[david@davidnicholsonart.com](mailto:david@davidnicholsonart.com) (iCloud+ custom domain)|
|Notification email   |[david@davidnicholsonart.com](mailto:david@davidnicholsonart.com)                        |
|Send-from email      |[david@davidnicholsonart.com](mailto:david@davidnicholsonart.com)                        |
|Square Online        |<https://david-nicholson-art.square.site>                                                |
|GitHub repo          |<https://github.com/h4jq7z68d9-david/kiosk>                                              |
|Google Analytics     |G-FL5BKJFVXF, Stream ID 14175458930                                                      |
|Google Search Console|davidnicholsonart.com, verified via GA tag                                               |