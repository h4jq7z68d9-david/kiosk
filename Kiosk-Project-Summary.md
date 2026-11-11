# Kiosk Project Summary

## Start here (every session) — added Nov 6 2026

Follow this in order. It overrides any older workflow note further down in this file.

1. **Get the code:** `git clone --depth 1 https://github.com/h4jq7z68d9-david/kiosk.git` (git protocol; never `raw.githubusercontent.com`). If a clone already exists from earlier in the session, `git pull` before reading anything — David may have pushed.
2. **Read:** this section, "What's Live", and "Pending". Session history is in `CHANGELOG.md` (newest first); read a block there only when the task touches that feature. Do not read every file in the repo.
3. **Load the skill that governs the task** (they live in Claude's skill library, not in the repo):
   - any file in this repo, any bash, any AWS or Square call → `dna-kiosk-conventions` (the footgun list; always)
   - installing or changing a study course → `study-site-builder` §9 (the install runbook); the course-builder skills are not used here
   - the AWS MCP connector is read-only plus DynamoDB item writes; Lambda config, IAM, tables, CloudFront stay with David in the console
4. **Work on a branch.** Nothing from a throwaway test fixture is committed. Validate JS with `node --check` (extract inline `<script>` blocks first). Before showing any site change: `node tools/site/check.js` (static: links, SEO fields, sitemap, cache versions, course data, image sizes, Lambda route tests) and `NODE_PATH=../pw/node_modules node tools/site/smoke.js [slug]` (headless 1440/390 over the main pages and every course; screenshots in `tools/site/out/`). Both exit 1 on a failure; neither is skipped because the last run passed. Show David the screenshots, bad news first, unverified items listed. (`smoke.js` needs Playwright once per session: `mkdir -p ../pw && cd ../pw && npm i playwright` — outside the repo — and a Chromium/Chrome; it falls back to `/usr/bin/google-chrome`.)
5. **Push to `main` only when David says so.** A push to `main` deploys (GitHub Actions → S3 `--delete` sync → CloudFront invalidation). Never upload to S3 by hand. No pull requests.
6. **Before the session ends:** add a "Completed This Session (date)" block at the top of `CHANGELOG.md`, update "What's Live" and "Pending" here, and push it with the batch (David expects this without being asked).

Content rule: this project installs course bundles and owns the generator, tests and deploy. It never writes or edits course text; corrections go back to the course-builder project that produced the bundle.

Style rules that apply to every visible change (David, Oct 2026): left-aligned by default, never centered unless asked; fewer words in the UI; menus and pop-ups are floating cards with visible edges, not full-width sheets; a style change made at one screen size is made at all sizes or flagged; no dark mode anywhere. For layout decisions, show options as mockups before writing code; it is fine to look at other artists' and museums' sites for ideas (screenshots as references, never a copy of a specific site).
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
|<https://davidnicholsonart.com/study.html>          |Study landing page — two tabs (Oct 30 2026): art history (timeline in date order of small square cards alternating either side of a centre line, Nov 10 2026; opens first) and technique (`#technique`; grid of the same square cards, three across, two on phones, Nov 10 2026); search across all study courses (Oct 31 2026; the color wheel button was removed the same day); menu item "study"|
|<https://davidnicholsonart.com/study/color-wheel.html>|Color wheel quick tool (Oct 31 2026: unlisted, `noindex`; opened as a pop-up from the "color wheel" bubble at the bottom of the site menu). Home-screen web app `start_url`|
|<https://davidnicholsonart.com/study/color-theory.html>|Color Theory course (Oct 28 2026: 8 parts, 66 pages under /study/color-theory/; concept, history and painting-example pages). Replaced the flashcards|
|<https://davidnicholsonart.com/study/pigments-and-materials.html>|Pigments and Materials technique course — Mode 2 rebuild on the technique slide model (Nov 11 2026): one `topen` home + 17 `concept` slides with example paintings, 20 pages + 47 redirect stubs from the Oct 30 pages, 35 images (8.3 MB)|
|<https://davidnicholsonart.com/study/oil-vs-acrylic.html>|Oil vs Acrylic technique course — Mode 2 rebuild on the technique slide model (Nov 11 2026): one `topen` home + 9 `concept` slides with example paintings, 12 pages + 35 redirect stubs from the Oct 30 pages, 19 images (4.0 MB)|
|<https://davidnicholsonart.com/study/composition.html>|Composition technique course — Mode 2 rebuild on the technique slide model (Nov 11 2026): one `topen` home + 16 `concept` slides (Dow and Poore plates) with example works, 19 pages + 46 redirect stubs from the Oct 30 pages, 33 images (6.9 MB)|
|<https://davidnicholsonart.com/study/value-and-light.html>|Value and Light technique course — Mode 2 rebuild on the technique slide model (Nov 11 2026): one `topen` home + 12 `concept` slides with example works, 15 pages + 48 redirect stubs from the Oct 30 pages, 25 images (5.4 MB); Cross plates re-cropped from the University of Toronto scan|
|<https://davidnicholsonart.com/color-theory.html>, `/color-theory-app.html`, `/study/color-theory-app.html`|Redirect stubs → /study/color-theory.html (noindex; flashcards retired Oct 28 2026)|
|<https://davidnicholsonart.com/study/art-history/classical-myth.html>|Classical Myth in Art (Mode 2 rebuild, Nov 7 2026: 18 works, 1 section, 1 part; 21 pages) — opens on its overview; works under /study/art-history/classical-myth/greece-to-paris-530-bce-1890/; 67 retired URLs redirect (retired-urls.tsv)|
|<https://davidnicholsonart.com/study/art-history/impressionism.html>|Impressionism (Mode 2 rebuild, Nov 7 2026: 18 works, 1 section, 1 part; 21 pages) — opens on its overview; works under /study/art-history/impressionism/paris-1863-1906/; 70 retired URLs redirect (retired-urls.tsv)|
|<https://davidnicholsonart.com/study/art-history/japonisme.html>|Japonisme (Mode 2, new course, Nov 10 2026: 17 works, 1 section "Europe and the United States, 1864–1900", 1 part; 20 pages) — opens on its overview; works under /study/art-history/japonisme/europe-and-the-united-states-1864-1900/; after Impressionism, before Post-Impressionism|
|<https://davidnicholsonart.com/study/art-history/post-impressionism.html>|Post-Impressionism (Mode 2 rebuild, Nov 9 2026: 18 works, 1 section, 1 part; 21 pages) — opens on its overview; works under /study/art-history/post-impressionism/france-1884-1906/; 81 retired URLs redirect (retired-urls.tsv)|
|<https://davidnicholsonart.com/study/art-history/fauvism-and-expressionism.html>|Fauvism and Early Expressionism (Mode 2 rebuild, Nov 9 2026: 18 works, 1 section, 1 part; 21 pages) — opens on its overview; works under /study/art-history/fauvism-and-expressionism/paris-germany-and-vienna-1905-1915/; 60 retired URLs redirect (retired-urls.tsv); Nolde *The Last Supper* held to Jan 2027|
|<https://davidnicholsonart.com/study/art-history/rococo.html>|Rococo (Mode 2, Nov 9 2026: 13 works, 1 section "France, Venice and Bavaria, 1717–1772", 1 part; 16 pages) — first half of the split of the retired `neoclassicism-and-rococo`; after Japanese Woodblock Prints in the registry|
|<https://davidnicholsonart.com/study/art-history/neoclassicism.html>|Neoclassicism (Mode 2, Nov 9 2026: 18 works, 1 section "Rome, Paris and London, 1760s–1806", 1 part; 21 pages) — second half of the split; settings `retiredSlugs: ["neoclassicism-and-rococo"]`; its retired-urls.tsv writes the 77 redirect stubs for the old course (76 under /study/art-history/neoclassicism-and-rococo/ plus the old home)|
|<https://davidnicholsonart.com/study/art-history/japanese-woodblock-prints.html>|Japanese Woodblock Prints (Mode 2 rebuild, Nov 10 2026: 18 works, 1 section "Japan, 1680s–1880s", 1 part; 21 pages) — opens on its overview; works under /study/art-history/japanese-woodblock-prints/japan-1680s-1880s/; 71 retired URLs redirect (retired-urls.tsv); after Classical Myth, before Rococo|
|<https://davidnicholsonart.com/study/art-history/romanticism.html>|Romanticism (Mode 2 rebuild, Nov 10 2026: 18 works, 1 section "Europe and the United States, 1781–1863", 1 part; 21 pages) — opens on its overview; works under /study/art-history/romanticism/europe-and-the-united-states-1781-1863/; 71 retired URLs redirect (retired-urls.tsv)|
|<https://davidnicholsonart.com/study/art-history/realism.html>|Realism (Mode 2 rebuild, Nov 10 2026: 18 works, 1 section "Europe and the United States, 1834–1899", 1 part; 21 pages) — opens on its overview; works under /study/art-history/realism/europe-and-the-united-states-1834-1899/; 56 retired URLs redirect (retired-urls.tsv)|
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
- Syncs `*.html`, `prints/*.html`, `*.png`, `*.jpg`, `*.xml`, `*.txt`, `*.js`, `*.webmanifest` files to S3, plus `site-*.css` and `study/*.css` (added Oct 26 2026 — narrow includes on purpose, so `--delete` can't touch any other `.css` that may sit in the bucket)
- Zips and deploys `index.mjs` to Lambda function `dna-kiosk`
- Invalidates both distributions: E31J8ASEUTGXD9 and E2EJH38GWGPEPG
- **Generate print pages step:** runs `generate-prints.js` before S3 sync — fetches catalog from Lambda API Gateway URL directly (bypasses CloudFront), writes `prints/*.html` and `hero-pool.js` locally, S3 sync picks them up


- **Site check gate (Nov 6 2026):** `tools/site/check.js` runs first when the push touched pages, study content/generator, shared chrome, the site/Lambda tools, `index.mjs` or the workflow; it fails the deploy before upload. Pushes that only change `admin-sw.js`, images or docs skip it (see the step comment in `deploy.yml`).
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
- `POST /admin/paintings/{id}/sales` — add sale. Optional `decrementStock: true` decrements print stock server-side with an atomic update. **Which stock depends on the channel:** `channel: 'gallery'` reduces that gallery's record in `dna-gallery-stock` (`galleryName` in the body, defaulting to `DEFAULT_GALLERY` = Phoenix Gallery) and leaves main print stock alone; it never goes below zero, and the response carries `galleryStock: {galleryName, reduced, record, error?}` (`reduced: false` = the gallery had none of that size on record, nothing changed; `error: true` = the stock write itself failed — the sale is still saved). Any other channel reduces `dna-paintings.stock` (can go negative). The Sell window's Log sale always sends the flag; the sale modal (row **+ Log Sale** / edit) sends it for gallery print sales only and still decrements its other sales via its own painting PUT.
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

**Jill routes (`/admin/jill/*`, added October 24 2026)** — dispatched by `jillRoute()` *before* the `/admin` auth gate; authenticated by `checkJillAuth()` against env `JILL_TOKEN` (DNA `ADMIN_TOKEN` is rejected here, and `JILL_TOKEN` is rejected on every other `/admin/*` route — tested):
- `POST /admin/jill/verify-password` (public) — checks env `JILL_PASSWORD`, returns `JILL_TOKEN`
- `GET /admin/jill/data` — `{ expenses, revenue, mileage, recurring, config }` (paginated scan via `scanAll()`)
- `PUT /admin/jill/config` — `{ categories?, streams?, mileageRate?, onboarded? }` read-merge-write
- `POST|PUT|DELETE /admin/jill/{expenses|revenue|mileage|recurring}[/{id}]` — type-checked (an id of the wrong type, or `__config__`, 404s)
- `POST /admin/jill/import` — `{ kind: 'expense'|'revenue'|'mileage', rows }`, ≤2000 rows, amounts stored positive, rows tagged `imported: true`
- `PUT /admin/jill/password` — `{ current, next }`; stores `passwordHash` (`scrypt$salt$hash`) on `__config__`, which then **replaces** env `JILL_PASSWORD` (old one stops working; hash is never returned by `/data`). **Forgotten password:** delete the `passwordHash` attribute from the `__config__` item in `jill-expenses` → `JILL_PASSWORD` works again.
- `POST /admin/jill/expenses/receipt-url`, `POST /admin/jill/recurring/run`
- `generateAllRecurring(table = EXPENSES_TABLE)` is now table-aware; the monthly `{"task":"recurring"}` schedule also runs it for `jill-expenses` (wrapped in try/catch so a Jill failure never blocks DNA's run).

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

**Jill's page (`expenses-jill-nicholson.html`) stays separate from `admin.html`** (David, Nov 6 2026): no shared module, even though ~22 functions are duplicated. Fix big bugs in both; any functionality improvement is discussed with Jill before it is built.

All are currently single-file with no framework. **This is how they were first built, not a rule** (David, October 2 2026) — shared files are allowed where they save duplicate edits; see the shared header/footer to-do under Pending.

**Session workflow:** see "Start here" at the top of this file. (The earlier note here — David downloads and pushes, upload files at session start — is retired as of Nov 6 2026; GitHub `main` is the source of truth between sessions, and Claude pushes approved batches.)

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

**Four-tab layout (corrected September 19 2026 — this section had drifted well behind the code; see "Completed This Session (September 19 2026)" in `CHANGELOG.md` for the audit):**

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
- **Gallery Stock view** — toggle at the top of Inventory (`Gallery Stock` button); rows with any print stock at the selected gallery sort to the top (by title), zero-stock rows sink below (still dimmed). **A print sale logged with Source = Gallery comes out of this stock, not main print stock** (October 11 2026) — the sale forms have no gallery picker, so it goes against `GALLERY_NAMES[0]` (`saleGalleryName()`); add a picker if a second gallery is ever added.
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

### expenses-jill-nicholson.html (Jill's practice books — added October 24 2026)

Standalone expenses/revenue page for David's sister Jill (counseling practice, shiftintegrativetherapy.com), modeled on the admin.html Expenses tab. **Fully separate from DNA data:** own password, own token, own DynamoDB table, own receipts prefix. No sales, inventory, or sales tax.

- **URL:** `https://davidnicholsonart.com/expenses-jill-nicholson.html` (noindex; not linked from the site)
- **Tabs:** Expenses & Mileage (subtabs Expenses / Recurring / Mileage), Revenue (manual entries by stream), Reports (date range + presets, Total revenue/expenses/mileage + Net cards, monthly chart **plus a month table with a Total row** (bars have no figures without hover, so phones need the table), by-category and by-stream breakdowns each ending in a **Total** line; detail CSVs end with totals + subtotals, CSV downloads: Profit & loss summary, Expenses, Revenue, Mileage)
- **Settings (gear):** **Change password** (current + new ×2, min 8 chars), *Replay the tour*, editable expense categories and revenue streams (rename relabels past entries client-side; remove keeps old entries as-is) + IRS mileage rate (locked per entry when logged, same rule as admin)
- **Import (↥):** Expenses, Revenue, or **Mileage**; built for Hurdlr's *(Spreadsheet)* reports (Expense Details List with Receipts / Income Detail List / Mileage Detail List — exact Hurdlr headers unverified, so columns are guessed and always shown for confirmation). Expenses: optional **Vendor** column (prefixed to description) and **Receipt link** column (http(s) URLs kept as `receiptUrl`; still point at Hurdlr's storage). Mileage: date/miles/purpose required, optional notes and **Deduction $** (rate = deduction ÷ miles; else IRS rate for that year, `IRS_BY_YEAR`); no category step. Duplicates caught against saved rows *and* within the file. CSV, pasted rows, or .xlsx (SheetJS 0.18.5 lazy-loaded from cdnjs only when an Excel file is chosen). 4 steps: file → column mapping (auto-guessed; skips bank title lines above the header; date-format and money-in/out filters) → category/stream mapping (exact-name matches prefilled; unmatched default to "add as new") → review (bad rows and duplicates of existing date+amount+description shown and skipped). Writes via `POST /admin/jill/import` in 500-row chunks; new categories added to config first.
- **Onboarding:** first sign-in shows a welcome modal → 17-step spotlight tour (steps 4–8 open a blank Add Expense form and walk its fields; it's closed on any other step and on exit); the **? Tour** button and Settings → *Replay the tour* replay it. Finishing (or skipping) sets `onboarded: true` on her `__config__` row so it shows once across devices. Tour end opens Import if she has no expenses yet.
- **`?preview`:** shows the welcome + tour every time and never sets `onboarded` (badge reads "Preview") — for David to look around without using up Jill's first-run tour
- **Caching:** `deploy.yml` re-uploads this page with `Cache-Control: no-cache` after the S3 sync, so browsers revalidate on every load (the sync sets no Cache-Control, and browsers were serving stale copies for hours after deploys — CloudFront invalidation doesn't touch browser caches). Other pages still have no Cache-Control.
- **Session:** token kept in `sessionStorage` (survives reload, cleared on tab close/sign-out)
- **Privacy copy:** receipt and revenue forms tell her not to enter client names/session details — receipts are readable by anyone with the CloudFront URL, same as DNA receipts.

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

> **Superseded Oct 28 2026:** the flashcard deck is retired (both `color-theory-app.html` files are redirects to the course) and the wheel now lives at `study/color-wheel.html`. `study/color-theory.html` is the generated Color Theory course home. The notes below are history.

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
|`dna-gallery-stock`|Prints on consignment at each gallery — `id` = `{paintingId}__{Gallery_Name}`, `paintingId`, `galleryName`, `stockSm`, `stockLg`. Edited in the Gallery Stock view; gallery print sales take one off (October 11 2026)|
|`dna-orders`       |Square order records                                                        |
|`dna-expenses`     |Expenses and mileage — single table, `type` field = `expense` or `mileage`  |
|`dna-booth-layouts`|Art fair wall layout plans — `id` (PK), `title`, `wallsJson`, `updatedAt`   |
|`jill-expenses`    |Jill's practice books (expenses-jill-nicholson.html) — single table, `type` = `expense` / `revenue` / `mileage` / `recurring`, plus `__config__` (`categories`, `streams`, `mileageRate`, `onboarded`). PK `id` (String). Never mixed with `dna-*`.|

All tables: PAY_PER_REQUEST, us-east-1.


-----

## Receipt Storage (S3 + CloudFront)

- S3 prefix: `kiosk.davidnicholsonllc/receipts/`
- Served via CloudFront behavior `/receipts/*` → S3 origin
- Publicly readable via CloudFront — no S3 public access needed
- Filename convention: `{date}_{amount}_{category}.{ext}`
- Jill's receipts: `receipts/jill/{date}_{amount}_{category}_{rand5}.{ext}` via `POST /admin/jill/expenses/receipt-url` (random suffix so same-day/same-amount receipts never overwrite). Already covered by the deploy's `--exclude "receipts/*"` and the `/receipts/*` behavior.
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

## Pending — In Order of Priority

### Process and tooling backlog (David, Nov 6 2026) — not started

Agreed in a process review. Quality gates (fact review, paraphrase check, best-of-three images, David's approval before `main`) are not to be automated or shortened. Order below is the agreed sequence.

- [x] **`tools/site/check.js`** (built Nov 6 2026) — static check over every `*.html` and every built course: each image and local link resolves; `<title>`, canonical and `og:*` unique and present; JSON-LD parses; every `sitemap.xml` URL exists and every page is in the sitemap; no `?v=` string older than the current `V` in `build-course.js` / `site-chrome` version; banned phrases ("Week N", "Free study guide", authorship lines); every `work` slide with `look` has exactly 3 bullets; every image key has a credits entry; course images ≤ 1600 px long edge. Run after every build; fail loudly. Site-wide from the start, not study-only.
- [x] **`tools/site/smoke.js`** (built Nov 6 2026) — headless Chromium (GA blocked) at 1440 and 390 px over index, gallery, originals, shipping, study.html, show pages and one page per course: 0 console errors, no sideways scroll, site menu opens, Prev/Next pinned on phones in courses, hero fits on index; writes the two screenshots David reviews. Same script every time; its output is the report.
- [x] **Shared chrome for the main pages** (built Nov 6 2026, branch `shared-chrome`) — the 10 main pages (index, gallery, originals, shipping, varied-readings, five show pages; shop excluded as legacy) now draw their bar from `site-bar.js` and take their tokens from `site-tokens.css` + `site-bar.css`; the inline `:root` and every `nav`/`.nav-*` rule is gone from each page. Index keeps its own look via `<nav data-chrome-nav data-ig="pill" data-cart="off">` (the pill + hidden note live in `site-bar.js`/`.css`). Gallery's cart click opens the cart in place through an `openCart()` hook. Page-specific styles stay inline. A bar/tokens bump still means updating `?v=` on these 10 pages + `study.html` by hand; `check.js` fails on a stale one.
- [x] **Course registry** (built Nov 6 2026, branch `course-registry`) — `tools/study/courses.json` (lane, order, name, label, dates, card image + text per course) is the one place a course is listed. `node tools/study/build-registry.js` writes the `STUDY` array into `site-chrome.js` (between `/* STUDY:START */` … `/* STUDY:END */`) and the cards + JSON-LD into `study.html` (between `<!-- COURSES:START -->` … `<!-- COURSES:END -->`); technique "N parts" (was "course · N parts" until Nov 10 2026) is counted from the data. When `site-chrome.js` changes it bumps `V.chrome` in `build-course.js` and the `?v=` in every `.html` in the repo itself (a named list missed `study/color-wheel.html`), then says to rebuild every course. `--check` (run by `check.js`) fails on a stale output, a settings file missing from the registry, a registry slug with no settings file, or a missing card image. Installing a course is now: add one registry entry → run the script → rebuild courses. **`study-site-builder` §9 still describes the two hand edits — David to update the skill.**
- [x] **`tools/study/install-course.js <slug>`** (built Nov 6 2026, branch `install-tooling`) — §9.1–9.8 as one command: `--bundle <folder> --lane art-history|technique --name --label --card-img --card-text [--dates] [--after <slug> | --first] [--force] [--trailer …]`. Branch `install-<slug>` → copy bundle + settings → resize images (python3 + Pillow, ≤1600 px, q85) → build the course → add the registry entry and run `build-registry.js` → rebuild every course → `check.js <slug>` → `smoke.js <slug>` → commit on the branch. Stops at the first failed step; never pushes. Held works, retired pages and handoff-approved generator changes (§9.3) are done by hand before running it. Placement in the lane: last by default, `--after <slug>` or `--first` for date order. `--force` (re-install) clears the previous install folder and course home page first, so dropped works/pages/images do not survive, and updates the registry entry from any registry flags passed (Nov 6 2026).
- [x] **Split this document** (Nov 6 2026) — `Kiosk-Project-Summary.md` is current state only (Start here, What's Live, infrastructure, Pending, setup notes, contacts); every "Completed This Session" and "Previously Completed" block moved, unchanged, to `CHANGELOG.md`, newest first. New session blocks go at the top of `CHANGELOG.md`.
- [x] **Lambda route tests** (built Nov 6 2026) — `tools/lambda/test.js` runs the real `index.mjs` handler with every `@aws-sdk/*` import swapped for an in-memory stub (`tools/lambda/hooks.mjs` + `aws-stubs.mjs`) and `https.request` replaced by a fake Square; no SDK, credentials or network. Asserts: no token → 401 on all 38 `/admin/*` + 19 `/admin/jill/*` route patterns with no table touched; `JILL_TOKEN` rejected on every `/admin/*` route and `ADMIN_TOKEN` on every `/admin/jill/*` route; `/checkout` and `/cart` send exactly `SQUARE_LOC` and never `LHXVQB0QCW9R1` even when the client injects it (and the id must not appear in `index.mjs`); a gallery print sale writes one conditional decrement to `dna-gallery-stock` and nothing to `dna-paintings` (fair sale: the reverse; zero stock: `reduced:false`, never negative). 262 assertions; `check.js` runs it and fails on any failure.
- [x] **Service-worker bump automated** (Nov 6 2026) — `deploy.yml` stamps the cache name from a content hash; no manual bump. `check.js` verifies the step exists and `node --check`s `index.mjs` and `admin-sw.js`.
- [x] **Gated pages in `smoke.js`** (Nov 6 2026) — admin, Jill's page, kiosk and booth are loaded logged-out at 1440/390: 0 console errors, no sideways scroll, gate present.
- [x] Deploy gate (built Nov 6 2026, branch `deploy-gate`) — `deploy.yml` runs `node tools/site/check.js` before anything is generated or uploaded, when the push changed `study/`, `tools/study/`, `tools/site/`, `tools/lambda/`, `index.mjs`, `site-*.js/.css`, a top-level `.html`, or the workflow itself (decided by `git diff --name-only` against `github.event.before`; a push with no usable base runs it). Other pushes (admin-sw.js, images, docs) skip it. A failed check fails the deploy with nothing uploaded.

### From November 11 2026, later afternoon (Composition Mode 2; course switcher)

- [ ] **Composition open flags (David):** *The Harvesters* repeat cleared (now only in Oil vs Acrylic); Armatures uses Andrea del Sarto, *Holy Family with the Young Saint John* (Met 22.75); allowed single repeats with art history courses (Great Wave and Plum Estate — Japanese Woodblock Prints; Cassatt — Impressionism; *Death of Socrates* — Neoclassicism; *The Oxbow* — Romanticism); every concept image is a Dow (1914) or Poore (c. 1915) plate at Gutenberg size, six under 500 px, not upscaled; Radial Balance and the second examples (*Alba Madonna*, *Paris Street*, *Night Watch*) cut; inches rounded to the nearest quarter; symmetry (Colonna Altarpiece), balance (Cassatt) and rhythm (*Sudden Shower*) are readings of the images, not museum text. Not yet reviewed in the slide editor (`edit-course composition`).
- [ ] **Resubmit `sitemap.xml` in Google Search Console:** Composition's URLs changed (19 pages; 46 old URLs redirect, noindex).
- [ ] **Course switcher (deferred by David Nov 11 2026, "come back to it"):** moving between courses isn't easy. Option B mocked up on a real page: a "courses" button beside the page dropdown on phones, and the course title in the outline rail on iPad/desktop, opening a floating card (study home, then art history and technique, current course marked). Open: the card scrolls at 16 entries (tighten or two columns on desktop); icon+"courses" vs icon only on phones; whether to also show the breadcrumb on phones.
- [ ] **Impressionism course description says "in eighteen works"** (outline rail subtitle) — a count phrase banned Nov 7 2026; course text, so the fix goes back to the course-builder project.

### From November 11 2026, afternoon (Oil vs Acrylic Mode 2)

- [ ] **Oil vs Acrylic open flags (David):** Rembrandt *Lucretia* (NGA, CC0) for Impasto — attribution questioned by the Rembrandt Research Project (2015), NGA keeps it as Rembrandt; Velázquez *Philip IV* (Prado P001182) for How Oil Ages — Prado record not opened, facts from Gallagher, Met Journal 45 (2010), image a Commons PD-Art file; *Umbrella, Reverie* carries Color Shift as It Dries on David's own account (Nov 11), both his paintings credited as his copyright; diagrams and carried paintings 1200 px. Repeats with Color Theory (*The Milkmaid*) and Pigments and Materials (Rembrandt 1659) cleared. Not yet reviewed in the slide editor (`edit-course oil-vs-acrylic`).
- [ ] **Resubmit `sitemap.xml` in Google Search Console:** Oil vs Acrylic's URLs changed (12 pages; 35 old URLs redirect, noindex).

### From November 11 2026, midday (Value and Light Mode 2)

- [ ] **Value and Light open flags (David):** painting details used as concept images (Morisot, Wright, Rembrandt *Aristotle*, Caravaggio *Calling*; about 650–800 px); Prud'hon drawing as the Direction of Light example; Morisot *Summer's Day* also in Impressionism (allowed) and on loan to the Hugh Lane 2026–31; Sánchez Cotán size from the Meadows Museum (San Diego record behind a bot gate); Sorolla facts from AMACI (no Ca' Pesaro record); Caravaggio in situ, no museum record; paintings and Merrifield plates 1200 px. Not yet reviewed in the slide editor (`edit-course value-and-light`).
- [ ] **Resubmit `sitemap.xml` in Google Search Console:** Value and Light's URLs changed (15 pages; 48 old URLs redirect, noindex).

### From November 11 2026 (Pigments and Materials Mode 2)

- [ ] **Pigments and Materials open flags (David):** Rembrandt *Self-Portrait* (1659, NGA) repeat resolved — removed from Oil vs Acrylic at its Nov 11 rebuild; 12 diagrams kept and most example paintings 1200 px; Giotto binder "Tempera" per NGA (egg not confirmed, page makes no egg claim); Arlanza lion not confirmed as true fresco; *Magdalen Reading* image from an aggregator, colour not checked against the National Gallery; cochineal engraving undated (Wellcome); Liotard size from the Getty record; slides run about 85–115 words. Not yet reviewed in the slide editor (`edit-course pigments-and-materials`).
- [ ] **Resubmit `sitemap.xml` in Google Search Console:** Pigments and Materials' URLs changed (20 pages; 47 old URLs redirect, noindex).

### From November 10 2026, evening (technique slide model)

- [x] **Slide editor support for `topen` / `concept` slides** (Nov 10 2026, text fields only). Image swaps (img, alt, credit, example image + thumbnail) deferred by David until needed.
- [x] **Technique rebuilds** — all five technique courses are on the `topen`/`concept` slide model (Color Theory Nov 10; Pigments and Materials, Value and Light, Oil vs Acrylic and Composition Nov 11 2026). Fixture test: `node tools/study/test-technique-slides.js`.

### From November 9 2026, late afternoon (Rococo + Neoclassicism split)

- [ ] **Rococo open flags (David):** Wieskirche interior plate (CC0, only free candidate) is dim and slightly soft; Boucher *Le Déjeuner* 1440 px (Louvre caps at 1500). Not yet reviewed in the slide editor (`edit-course rococo`).
- [ ] **Neoclassicism open flags (David):** Kauffman *Cornelia* 1538 px (VMFA). Napoleon plate colour-corrected Nov 6 to the Malmaison photo (no action). Not yet reviewed in the slide editor (`edit-course neoclassicism`).
- [ ] **Card dates overlap** (Rococo 1710s–1770s, Neoclassicism 1760s–1800s): deliberate.
- [ ] **Generator:** `build-course.js` now accepts an optional settings key `retiredSlugs` (old slugs in the same lane whose URLs a course redirects). The old slug `neoclassicism-and-rococo` is retired for good; its stubs are rebuilt with every Neoclassicism build.
- [ ] **Resubmit `sitemap.xml` in Google Search Console:** two new courses; the old combined course's URLs now redirect (noindex).

### From November 9 2026, afternoon (Fauvism and Early Expressionism Mode 2)

- [ ] **Fauvism open flags (David):** Kirchner *Self-Portrait as a Soldier* plate (2400 px) from a press page, colour not checked against a museum image; *Woman with a Hat* is an 1860 px Commons file from an older SFMOMA URL, not a museum-supplied scan; Gerstl *Self-Portrait, Laughing* dated 1908 per the Belvedere (a chronology gives 1907); *Composition VII* size "about 79 × 118 in." from a Tretyakov "200 x 300" with no units; work slides run 94–146 words; *English Step Dancers* shown with full sheet and margins. Not yet reviewed in the slide editor.
- [ ] **Nolde, *The Last Supper* (release Jan 2027):** scheduled task "Nolde page: ready to publish" fires Jan 2 2027. Held text is in the old page model; the course-builder project rewrites it as a Mode 2 slide (Look-at bullets from the plate, two review rounds), then this project adds slide, credit and source on a branch, inserted chronologically after *Street, Dresden*.
- [ ] **Resubmit `sitemap.xml` in Google Search Console:** Fauvism's URLs changed (21 pages; old URLs redirect, noindex).

### From November 9 2026 (Post-Impressionism Mode 2)

- [ ] **Post-Impressionism open flags (David):** Van Gogh *Self-Portrait* facts from the Orsay-supplied Google Arts & Culture page (Orsay record unreachable; RF 1949 17 unverified, not on the page); *Mont Sainte-Victoire* plate is a Commons PD-Art file from an NGA 2006 exhibition page, not a museum scan; *The Starry Night* plate from Commons' 1920 px rendition of the GA&C scan; *The Talisman* source only 1606 × 2063 px; *The Sleeping Gypsy* plate now MoMA's GA&C scan (cooler, darker than the Oct file); work slides run about 95–120 words; *Divan Japonais* shows the poster's paper margin (kept). Not yet reviewed in the slide editor.
- [ ] **Resubmit `sitemap.xml` in Google Search Console:** Post-Impressionism's URLs changed (21 pages; old URLs redirect, noindex).

### From November 7 2026, evening (Classical Myth Mode 2)

- [ ] **Classical Myth open flags (David):** Dionysus Cup size from Beazley/CVA, not the museum, and flash glare on the plate (larger files are CC BY-SA); Vulcan's Forge plate colour not matched to the Prado's image, artist dates not re-read on a Prado page; Ulysses Deriding Polyphemus plate has no resolution headroom (1920 px source); Apollo Belvedere has no dimensions (Vatican record gives none); Venus de Milo date now follows the Louvre (about 150–125 BCE); Proserpina keeps internal image key `h9_bernini`; Artemision bronze titled "Bronze God from Cape Artemision" (museum: Zeus or Poseidon).
- [ ] **Count in credits meta description:** all 13 course settings files have a `creditsDescription` template with `{count}`. Not changed.
- [ ] **Resubmit `sitemap.xml` in Google Search Console:** Classical Myth's URLs changed (21 pages; old URLs redirect, noindex).

### From November 7 2026 (Impressionism Mode 2 + title pages)

- [ ] **Title pages are thin in the 12 other courses:** part overviews now show only their one-sentence summary (the works lists were removed). Add a second paragraph or a few bullets per overview in the slide editor, or as each course gets its Mode 2 rebuild. Classical Myth (Mode 2) has a home paragraph.
- [ ] **Impressionism open flags (David):** *The Child's Bath* (toddler bare from the waist up, kept); *Summer's Day* on loan to the Hugh Lane 2026–31 while `det` says National Gallery, London; *White Frost* image is a scan of a printed reproduction; catalogue raisonné numbers unverified (not shown on pages). Ten leads open with the artist's name, nationality and dates.
- [ ] **Resubmit `sitemap.xml` in Google Search Console:** Impressionism's URLs changed (21 pages; old URLs redirect, noindex).
- [ ] **Slide editor on David's Macs:** MacBook Air has the clone; `edit-course` is to be switched to `source ~/kiosk/tools/study/edit-course.zsh` and a fine-grained GitHub token (kiosk, Contents read/write) made before the first send (README).

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

- [x] **Keep the cart until payment is confirmed** — done September 30 2026 (evening); see "Completed This Session (September 30 2026)" in `CHANGELOG.md`.
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
- [ ] **On an iPhone, check the color wheel pop-up from the menu bubble (Oct 31 2026), on a shop page and a study page:** drops down from the top, every control responds to one tap (especially "+ Mix" and the sliders), Back and Close return to the same lesson.
- [ ] **After deploy, verify the October 2 batch on a phone and a desktop:** homepage shows the whole painting with caption and name on the first screen; 2025 is collapsed and opens on tap; menu opens on every page and each link lands; a print card opens with no size chosen and the button says "choose a size"; picking a box and adding to cart puts the right size and price in the cart.
- [ ] **After deploy, verify the true-scale wall (October 3 2026)** on a phone, an iPad and a desktop: every year is a cluster with the largest painting in the middle (top on a phone), nothing overlaps or runs off the right edge, tapping a painting opens its print card. If every painting is the same size, `/products` isn't returning `width` / `height` yet (Lambda deploy).
- [ ] **Admin dimensions for Alley, Western Auto / Commuter / Fast Eddy** — fix in admin to match Square (16 × 20, 30 × 30, 37 × 33) if they're wrong there; originals.html reads Square, admin inventory reads `dna-paintings`.
- [ ] **Fast Eddy SEO description in Square** describes another painting — rewrite it.
- [ ] **Print card share buttons go stale on next / previous (found October 3 2026).** `slideNav()` calls `populateDetail()` but not the share-row code in `openDetail()`, so Pinterest / Facebook share the first-opened print. Fix: move the share-row build into a helper and call it from both, as `renderOriginalRow()` now does.
- [ ] **Market items reachable from a print card (found October 2 2026).** `/products` returns "Market Item $40" and "Market Item $25" (no year, single `Regular` variation). `renderGrid()` skips no-year products, so they are **not** in the gallery grid (51 cards of 53 products), but `slideNav()` cycles the full `products` array, so next/previous arrows and swipe in a print card reach them and they can be added to the cart. Fix options: drop them from `/products` in `index.mjs`, or filter no-year items out of `products` in gallery.html (check kiosk.html, which also reads `/products`, before changing the endpoint). David to decide.
- [ ] **Update the `dna-kiosk-conventions` skill.** It still says "Single-file HTML, no frameworks, no build pipeline. This is a permanent architectural constraint" — no longer true (David, October 2 2026). Reword that line to match Key Principles here, and do it **before** the shared header/footer work so the skill doesn't steer that session back to single-file. While in there: note that Claude can now push to the repo (pushes to `main` deploy), so the "David pushes" assumption is out of date.
- [ ] **Shared header and footer (maybe).** The top bar, site menu and footer are copy-pasted into every public page (the menu alone is 11 copies). Restructure them as one shared header and one shared footer so an edit is made once and shows across the site. Options to weigh: a small shared JS file that injects them, or a build step in the deploy workflow that stamps them into each page. Decide the approach before building; keep the per-page differences (gallery's cart button opens the cart, other pages link to it; index footer has no guest-book button).
- [ ] **After deploy, verify the modal link:** open a print of an at-gallery painting (e.g. KS Wind Farm No. 1) on gallery.html — no "original available →"; open one that isn't at a gallery and is available — link still there.

- [ ] **Move the main-site pages onto `site-tokens.css`** (David, Oct 26 2026). Today each main page carries its own `:root` colors inline; the study pages already read `site-tokens.css` (light only). Swap each page's inline token block for the shared file and check each page looks unchanged. After that, a site-wide color or font change is one edit. (Dark mode for the main site was dropped Oct 27 2026 — David changed his mind.)
- [ ] **Move the main-site pages onto the shared top bar** (`<nav data-chrome-nav>` + `site-bar.js`), one page at a time. Index and gallery have their own bar variants (index pill + easter egg; gallery cart button opens the cart) — decide how the shared bar handles those first.
- [ ] **Square: fix "original oil painting" in SEO descriptions** (added Oct 30 2026, found while building the Oil vs Acrylic course). 27 of 30 Square listings say "original oil painting" in their SEO description while the Medium custom attribute says "Acrylic on Canvas". Square is the canonical catalog, so the wrong medium flows to the gallery, print pages and Merchant Center. Pull the listings, show David the before/after per item, and write only after his yes.
- [ ] **Review the Google Analytics setup, and walk David through what GA can tell him** (added Oct 26 2026). Check that every public page (including the new study pages) reports to `G-FL5BKJFVXF`, that the stream and Search Console link are healthy, then a short guided tour: traffic sources, which pages and prints get looked at, art-fair QR scans, and whether ad clicks show up. Teach-as-you-go, not a report.
- [ ] **Resubmit `sitemap.xml` in Google Search Console** (study section went live Oct 26 2026; replaced by the condensed Classical Myth Oct 27 2026 — the sitemap listed 77 URLs; 150 after Impressionism and 216 after Color Theory, both Oct 28 2026). After the Oct 27 deploy, spot-check on a phone: course home, one work page, Saved panel, search. Post-deploy checks already passed on the live site: shared bar/menu/footer on index, gallery and study pages; gallery prints load; `/color-theory.html` redirects; `#flashcards` opens the deck; course-home search; work-page pager; Jost loads.
- [x] **Study generator generalized + one layout** — done and deployed Oct 27 2026; see that session above.
- [ ] **Fauvism: add the held Nolde page** after Jan 1 2027 if a free image exists (see the Oct 29 2026 section).
- **Standing rule — study images (David, Oct 30 2026):** always shrink course images over 1600 px to max 1600 px on the long side (JPEG q85, Pillow LANCZOS) when installing a course, before committing. Rebuild afterwards (pages record image dimensions).
- [ ] **Next art-history courses** (Impressionism and Post-Impressionism done Oct 28 2026, Fauvism and Early Expressionism Oct 29 2026, Romanticism Oct 30 2026; next Renaissance, Baroque…): each is a data folder `study/art-history/<slug>/` (data files, `credits.js`, optional `sources.js`, `img/`) + a settings file in `tools/study/courses/` + one `tl-item` in date order in the `study.html` art history tab (technique courses: `tools/study/courses/<slug>.json` with `basePath: /study`, data under `study/<slug>/`, a `tl-item` in the technique tab). Run `node tools/study/build-course.js <slug>`. No viewer file needed.
- [x] **Delete the 114 unused images** in `study/art-history/classical-myth/img/` — done Oct 30 2026 (22 MB; the deploy's `--delete` sync removed them from S3). Full set still in git history and on `archive-classical-myth-full-2026-10-27`. S3 bucket was ~379 MB before (receipts 173 MB, `past/` 51 MB, study courses 146 MB).

### Ongoing

- [ ] **Meta/Instagram Ads — launching now** — $25/week test campaign, 4-week minimum run. Setup and creative plan are in "Completed This Session (July 10 2026)" in `CHANGELOG.md`. After 4 weeks: review per-ad results, double down on winners, pause losers, log spend under the Advertising expense category.
- [x] **Admin panel mobile/UX overhaul** — closed Nov 6 2026 (David): the UI was improved incrementally over October; no functionality changes are needed. Not a to-do.
- [ ] **Pinterest Ads** — ~$30/day minimum, paused (too expensive for now)
## On the Horizon

- **Newsletter + mailing list manager** — MailerLite vs. custom SES; `/unsubscribe` endpoint; low priority


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

- **Color wheel app has its own reference doc** — `Color-Wheel-App-Reference.md` at repo root. Read it before touching the wheel code. Since Oct 28 2026 the wheel lives in `study/color-wheel.html`; as of August 2026 it was inlined directly into `color-theory.html` (no more standalone `color-wheel-app.html`, no iframe — retired after a chain of mobile bugs the iframe architecture kept causing; see the reference doc's "Where this lives" section). Covers the mixing engine (measured-pigment Kubelka-Munk since October 22 2026 — spectral.js was used briefly that day and replaced; black stays on the hand-tuned model), the adaptive black-tinting model, and the naming system — a lot of non-obvious constants in that file exist for researched, specific reasons.

- **ACM certs for CloudFront must be in us-east-1** — any other region silently fails
- **HTML structure** — pages are single-file today with no framework or build pipeline; that is history, not a constraint (David, October 2 2026). Prefer simple shared files over copy-pasting the same block into many pages. Still no need for a framework.
- **Site menu and footer links live in one file: `site-chrome.js`** (Oct 26 2026). Pages carry an empty `<div id="menu-panel">` and an empty `<div class="f-links" data-chrome-footer>`; the script fills both. To add or rename a link, edit `MENU` / `FOOTER` there — never paste links into pages. Menu CSS is `site-chrome.css`. Bump `?v=` on both tags (all pages) when changing either file. The top bar is still per page (index has its own variant; gallery's cart is a button).
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
- **Admin SW cache key** — currently `dna-admin-v91` (bumped 2026-10-11: gallery sales reduce gallery stock); bump in `admin-sw.js` after every admin.html change
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
