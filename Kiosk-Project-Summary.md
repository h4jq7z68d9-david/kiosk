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
|Location ID            |`LYVD3ZGR3X4KE`                                                                  |

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
SES_FROM      = david@davidnicholsonart.com
NOTIFY_EMAIL  = david@davidnicholsonart.com
API_URL       = https://davidnicholsonart.com
ADMIN_TOKEN   = admin API token (see AWS console)
PASSWORD      = admin.html PIN (see AWS console) — added June 11 2026
```

**`API_URL` is critical:** Controls the domain used when building image proxy URLs (`/image?id=...`). Must be set to `https://davidnicholsonart.com` so image URLs use the CloudFront domain instead of the raw API Gateway domain. Pinterest rejects API Gateway domains in `image_url` fields.

**Endpoints:**

- `GET /products` — fetches Square catalog, excludes originals, returns prints with `id, title, desc, img, rawImg, url, variations, year`
- `GET /originals` — Square items with the `Original Available` toggle true; price is **computed**, not stored per painting: `Math.ceil(width × height × effRate / 50) × 50`, where `effRate = rateLarge` if `rateLarge` is set AND a side ≥ 30”, else base `rate`. Reads both `rate` and `rateLarge` from the `__config__` record so it matches admin.html’s `effectiveRate()` / `retail()`. originals.html fetches this directly from API Gateway (not via CloudFront), so config changes show on next load. **Fixed June 2026:** previously used only base `rate`, so large paintings (≥30”) ignored the large rate set in admin.
- `GET /feed` and `GET /feed.xml` — returns RSS/XML product catalog for Pinterest/Google; served publicly via CloudFront at `https://davidnicholsonart.com/feed.xml`
- `GET /hero` — returns a single random product with an image `{img, title, id}` — filtered to 2025–2026 prints, falls back to full catalog
- `GET /image?id=X` — proxies Square CDN image to avoid hotlink 403s; query string must be forwarded by CloudFront (Origin request policy: AllViewerExceptHostHeader)
- `POST /send-link` — sends email (SES) with product link (email-only; the `sms`/SNS path was removed June 10 2026)
- `POST /guestbook` — saves to DynamoDB (`dna-guestbook`) + emails [david@davidnicholsonart.com](mailto:david@davidnicholsonart.com); stores `name, email, note, subscribed (BOOL)`
- `POST /checkout` — accepts `{items:[{variation_id, item_id, title, price}]}`, creates Square Payment Link with `ask_for_shipping_address: true`, returns `{checkout_url}`
- `GET /booth-layout?id=X` — fetch a saved booth layout from DynamoDB
- `PUT /booth-layout` — save/overwrite a booth layout `{id, title, wallsJson}`
- `DELETE /booth-layout?id=X` — delete a booth layout from DynamoDB
- `GET /booth-layouts` — list all saved layouts `[{id, title, updatedAt}]` sorted newest first
- `GET /admin/paintings` — all paintings with sales joined
- `POST /admin/paintings` — add painting
- `PUT /admin/paintings/{id}` — update painting
- `DELETE /admin/paintings/{id}` — delete painting + all its sales
- `POST /admin/paintings/{id}/sales` — add sale
- `PUT /admin/paintings/{id}/sales/{saleId}` — edit sale
- `DELETE /admin/paintings/{id}/sales/{saleId}` — delete sale
- `GET/PUT /admin/config` — price/sq in rate (`rate`) and large-painting rate (`rateLarge`, optional); both stored in DynamoDB `__config__` record
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

All are single-file, no framework — intentional, keep it that way.

**Session workflow:** Claude generates files here, David downloads and pushes to GitHub. GitHub is NOT the source of truth during a session — the latest file Claude produced is. At the start of each session, upload all files from the repo as a starting point.

### Artist Style & Bio

**Style label:** "Regionalist Pop" — David's chosen term for use at art fairs and in conversation. Regionalist subject matter (everyday Midwestern places and people, vernacular scenes) combined with Pop Art's visual language and color confidence. Work is representational but not realistic — forms are distilled and simplified, color is observed then intensified.

**About statement (index.html + meta descriptions):**
> david nicholson is a kansas-based regionalist pop painter working from observation, using distilled, simplified compositions and color to express and reinterpret

**Meta description (og:description + twitter:description):**
> Kansas-based regionalist pop painter working from observation. Prints available online and at art fairs across the KC area.

-----

### index.html (homepage)

- Hero column width: 820px
- Hero calls Lambda `GET /hero` for a single random product image — fast, no full catalog fetch
- Image appears at natural aspect ratio (`height: auto`) — no fixed placeholder, no skeleton
- Caption (print title) appears only after image loads
- `referrerPolicy = 'no-referrer'` on hero image to avoid S3 403
- Guest book POSTs to Lambda; includes newsletter opt-in checkbox (“casually stay informed”) — `subscribed` bool stored in DynamoDB
- Contact link uses split string `'mai'+'lto:david@davidnicholsonart.com'` to prevent Cloudflare email obfuscation injection

### gallery.html (public gallery)

- Fetches from Lambda `GET /products`
- Sort: year descending, then alphabetical within same year
- Year sidebar filter — sticky left sidebar with year buttons
- **Cart** in top-right nav — shopping bag SVG icon with count badge
- Cart persists in localStorage (`dna_cart`) across page loads and browser closes
- Cart clears from localStorage after successful checkout
- Tap print → bottom sheet modal on mobile, side-by-side on desktop
  - Variant selector (size buttons) with name + price
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
- **Always open at `https://davidnicholsonart.com/admin.html`** (apex, no www) — Safari CORS redirect cache issue
- **PWA:** installable as home screen app on iPhone/iPad via Safari → Share → Add to Home Screen
  - `admin.webmanifest` — app manifest (name: “DNA Admin”, theme: #f8f6f3, orange icon)
  - `admin-sw.js` — service worker caches admin shell; passes all `/admin/*` API calls and S3 receipt URLs through to network
  - `admin-icon.png` — 512×512 orange DN icon
  - Safe area insets applied to topbar and main padding for iPhone notch
- **PWA mode behavior:** when launched from home screen (`navigator.standalone`), goes straight to Expenses & Mileage tab, hides Dashboard and Inventory tabs — full admin still accessible in Safari

**Five-tab layout:**

- **Dashboard tab** — revenue cards (originals sold, large/small prints sold, print inventory, top large print, top small print, art fair/online/gallery revenue) + expense cards (total expenses, top expense categories, miles driven, mileage deduction) + Revenue by Month chart (orange bars) + Expenses by Month chart (red bars, independent date range filter). Expense cards load in background on login so dashboard is always populated.
- **Inventory tab** — dual rate adjuster (standard + large ≥30”) + sortable/filterable painting table with inline editing; `↓ CSV` export; `🏷 Tags` button for price tag printing
- **Expenses & Mileage tab** — expense and mileage tables; tap any row to open edit modal; delete inside modal
- **Prints tab** — all paintings shown (no stock filter); sorted into four tables by stock tier (Out of Stock → Low Stock → Below Goal → Stocked), ranked by popularity score (70% sales volume, 30% recency) within each tier. “Zero stock only” checkbox filters to paintings where both sizes are at 0. Click any column header to collapse tiers into a single sortable flat table; “✕ Clear sort” returns to tiered view. Print Lg/Print Sm columns show how many to print to reach goal (2 large, 3 small); stock shown in red when below goal.
- **Sales Log tab** — filterable table of all sales; filters: date range (from/to), channel (all/art fair/online/gallery), state (all/KS/MO); summary bar shows count, total revenue, net; CSV export. Use cases: art fair debrief, monthly KS sales tax, year-end taxes.

**Inventory features:**

- All paintings sortable by title, year, price, rounded price
- Filters: Never sold, Sold, Original available, Low print stock, Mom doesn’t have
- Click row → expand: inline edit (title, month, year, dimensions, stock counts, Mom’s Prints checkbox) + sale history
- Sale logging: date, type (original/large/small), channel (fair/online/gallery), price; gallery channel tracks gross + % + net; art fair channel tracks state (KS/MO)
- Stock +/− buttons autosave immediately (floor at 0)
- Logging a new print sale automatically decrements the matching size stock by 1 (can go negative — intentional)
- **🏷 Tags button** in Inventory tab header: opens a printable Avery 5371/5871 price tag sheet (3.5×2”, 10/sheet) for all paintings currently marked as original available in Square — shows title, year, medium, original price
- CSV export: title, month, year, dimensions, sq in, effective rate, rounded price, stock counts, units sold, original sold status

**Expense features:**

- Categories: Printing, Framing, Art Supplies, Art Fair Fees, Retail & Packaging, Equipment, Marketing, Licenses & Fees, Insurance, Website & Software, Travel, Other
- Color-coded category badges
- Tap row to edit; delete button inside edit modal (not on row)
- Receipt upload: file picker supports Camera, Photo Library, Browse on iPhone
- Receipt files stored in S3 under `receipts/` prefix, served via CloudFront at `https://davidnicholsonart.com/receipts/...`
- Receipt filename convention: `{date}_{amount}_{category}.{ext}` — e.g. `2026-04-08_145.00_printing.jpg`
- Receipt links are publicly accessible — safe to share in CSV with accountant
- 📎 icon appears inline in description column on mobile so receipts are tappable without hidden column
- Amount column always visible (not hidden on mobile)
- Description column hidden in PWA mode to keep rows clean
- CSV export: date, category, description, amount, receipt URL — receipt URLs are clickable CloudFront links

**Mileage features:**

- IRS standard rate hardcoded per year at top of script (`IRS_RATE_BY_YEAR`) — update each January
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

### generate-prints.js (build script)

- Runs in GitHub Actions before S3 sync
- Fetches from `API_URL` (raw API Gateway URL) — NOT through CloudFront (CloudFront blocks GitHub Actions IPs)
- Writes `prints/{slug}.html` per product
- Each file: OG meta tags + `window.location.replace("gallery.html?view=ITEM_ID")`
- Slug logic matches gallery.html share button slug generation
- **Also writes `hero-pool.js`** (repo root, June 2026): `window.__HERO_POOL__ = [{img,title}]` for 2025–26 prints (fallback: all prints with images). The homepage loads it and picks a daily-rotating hero client-side — keeps the slow uncached `/hero` Lambda catalog fetch off the hot path. Deployed by the same `*.js` S3 sync.

-----

## DynamoDB Tables

|Table              |Purpose                                                                     |
|-------------------|----------------------------------------------------------------------------|
|`dna-paintings`    |All paintings + `__config__` record (stores `rate` and optional `rateLarge`)|
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

## Pending — In Order of Priority

- [ ] **Meta Ads** — ~$5/day, paused
- [ ] **Pinterest Ads** — ~$30/day minimum, paused

## On the Horizon

- **Newsletter + mailing list manager** — MailerLite vs. custom SES; `/unsubscribe` endpoint; low priority

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

- **ACM certs for CloudFront must be in us-east-1** — any other region silently fails
- **Single-file HTML** — no frameworks, no build pipeline for HTML files, keep it that way
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
- **Admin SW cache key** — currently `dna-admin-v26`; bump in `admin-sw.js` after every admin.html change
- **Lambda deploys from `index.mjs` only** — the workflow runs `zip lambda.zip index.mjs`. A stale `index.js` is also tracked in the repo and is NOT deployed; editing it leaves the live Lambda unchanged (symptom: frontend works, backend ignores new fields). Always edit `index.mjs`; `git rm index.js` to remove the trap.
- **Receipts are NOT in S3 Block Public Access whitelist** — served via CloudFront only; do not attempt to make `receipts/` prefix publicly readable via bucket policy
- **Receipt filename values read from DOM at save time** — not from pre-parsed JS variables, to ensure correct date/amount/category regardless of field fill order
- **S3 sync `--delete` wipes receipts** — deploy.yml must include `--exclude "receipts/*"` after the `--include "*.jpg"` line; without it every deploy deletes all uploaded receipts
- **Debug order: check the code first** — when something isn’t working after a push, review the code for bugs before assuming the deploy didn’t complete or the user made an error. Both Claude and David make mistakes; neither is infallible. Start with the code.
- **Public site uses Jost** — both `index.html` and `gallery.html` run on the Jost font stack (`'Jost', Futura, 'Trebuchet MS', Arial, sans-serif`); gallery was unified away from DM Sans + Playfair in June 2026. Keep new public pages on Jost for brand cohesion.
- **Secondary-text grays are AA-locked** — `--ink2: #5e6b78` and `--ink3: #64707c` on the `#f8f6f3` bg, `#6b6560` for muted labels on the `#f5f2ed` modal/cart sheet. These clear WCAG AA; do NOT revert to the old `#7a8a99` / `#9aa0a8` / `#a8a39d`, which failed contrast.
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