# Kiosk Project Summary

## What's Live

| URL | Purpose |
|---|---|
| https://davidnicholsonart.com | Main entry point / homepage (index.html) — primary public site |
| https://davidnicholsonart.com/gallery.html | Public print gallery with cart + checkout |
| https://davidnicholsonart.com/shop.html | Shop page |
| https://davidnicholsonart.com/shipping.html | Shipping & returns info |
| https://davidnicholsonart.com/kiosk.html | iPad kiosk for art fairs |
| https://davidnicholsonart.com/admin.html | Admin dashboard — password gated (172377) |
| https://davidnicholsonart.com/prints/{slug}.html | Per-product pages with OG tags — redirect to gallery modal |
| https://davidnicholsonart.com/varied-readings.html | Varied Readings show page — interactive tile flip animation |
| https://kiosk.davidnicholsonllc.com | Legacy URL — still works, same content |

The site is deployed and working. Push changes to GitHub — deploy is automatic.
**Deploy:** Push to GitHub → GitHub Actions auto-deploys to S3, deploys Lambda, and invalidates both CloudFront distributions in ~60 seconds.

---

## AWS Infrastructure

| Resource | Value |
|---|---|
| AWS Account | 892204037842 |
| S3 Bucket | kiosk.davidnicholsonllc (us-east-2) |
| CloudFront Distribution — davidnicholsonart.com | E2EJH38GWGPEPG (dbhpvmx9kl58h.cloudfront.net) |
| CloudFront Distribution — kiosk.davidnicholsonllc.com | E31J8ASEUTGXD9 (d33vrz1flme0j4.cloudfront.net) |
| SSL Cert — davidnicholsonart.com | ACM us-east-1, covers apex + www, auto-renews |
| SSL Cert — kiosk.davidnicholsonllc.com | ACM us-east-1, auto-renews |
| IAM Role | github-kiosk-deploy — has S3, CloudFront invalidation, and Lambda UpdateFunctionCode permissions |

**CloudFront E2EJH38GWGPEPG behaviors (in order):**

| Precedence | Path | Origin | Notes |
|---|---|---|---|
| 0 | /products | API Gateway | Lambda products endpoint |
| 1 | /hero | API Gateway | Lambda hero endpoint |
| 2 | /image* | API Gateway | Lambda image proxy — forwards query string |
| 3 | /feed.xml | API Gateway | Lambda feed endpoint |
| 4 | /admin/* | API Gateway | Lambda admin endpoints |
| 5 | /prints/* | S3 | Per-product OG redirect pages |
| 6 | Default (*) | S3 | All other static files |

**DNS:** `davidnicholsonart.com` is registered with AWS and DNS is in Route 53. Both apex and www point to CloudFront distribution E2EJH38GWGPEPG.

**ACM validation tip:** When requesting a cert, the "Create records in Route 53" button only works if a hosted zone already exists. After setting nameservers, NS records in Route 53 Registered Domains must match the hosted zone NS records exactly — no trailing dots.

**To update any file:**
1. Edit the file
2. `git add . && git commit -m "your message" && git push`
3. GitHub Actions deploys to S3 + invalidates both CloudFront distributions automatically
4. Live in ~60 seconds

---

## GitHub Actions Auto-Deploy

Fully configured. Push any file to the repo → live in ~60 seconds.
- IAM role: `github-kiosk-deploy` (OIDC, no static keys)
- Repo secret set: `AWS_ROLE_ARN`
- Workflow file: `.github/workflows/deploy.yml`
- Syncs `*.html`, `prints/*.html`, `*.png`, `*.jpg`, `*.xml`, `*.txt`, `*.js`, `*.webmanifest` files to S3
- Zips and deploys `index.mjs` to Lambda function `dna-kiosk`
- Invalidates both distributions: E31J8ASEUTGXD9 and E2EJH38GWGPEPG
- **Generate print pages step:** runs `generate-prints.js` before S3 sync — fetches catalog from Lambda API Gateway URL directly (bypasses CloudFront), writes `prints/*.html` files locally, S3 sync picks them up

---

## Square

| Item | Value |
|---|---|
| Square Online Store | https://david-nicholson-art.square.site |
| Application ID | `sq0idp-6D-Q6hGLP9tk-medwFpxvQ` |
| Production Access Token | `EAAAl92H7EIacTMeOgSxuIcLAxZlfv5DAG7OhNhxC97Qk6YnJJAFQ5QZruKwvh53` |
| Location ID | `LYVD3ZGR3X4KE` |

**Product URL pattern:**
```
https://david-nicholson-art.square.site/product/{slug}/{ITEM_ID}
```
Slug = item name lowercased, non-alphanumeric replaced with hyphens. Lambda generates this automatically.

**Originals:** Excluded from API/kiosk by detecting single "Default Title" variation.

**Images:** Product images are hosted by Square. No dependency on Shopify CDN.

**Product descriptions:** All 40 prints have customer-facing product descriptions and SEO descriptions entered in Square (completed 2025-03-23). Reference file: `painting-descriptions.md` in repo.

---

## Pinterest

| Item | Value |
|---|---|
| Account | Business account, claimed domain davidnicholsonart.com |
| Domain verification tag | `<meta name="p:domain_verify" content="e2ca69d5bcbd54035f416124bf0b4508">` (in index.html) |
| Feed URL | `https://davidnicholsonart.com/feed.xml` |
| Tag advertiser ID | 549769596185 |

**Notes:**
- Pinterest Tag live in gallery.html — fires 4 events: `pagevisit` (page load), `pagevisit` with `product_id` (product modal open), `addtocart`, `checkout`; all include `click_id` (epik) when present
- Base `pagevisit` on page load only includes `click_id` if `epik` param is present in URL — omits key entirely when absent (Pinterest treats explicit `undefined` differently)
- Conversion source health requires all 3 event types fired by real users in last 30 days — without ad traffic this will stay yellow
- Verified Merchant Program — ✓ verified April 2026
- 3 dead Shopify catalogs exist on Pinterest account — harmless, can't be deleted without Shopify app
- Share button on product modal links to `/prints/{slug}.html` — Pinterest receives correct image URL and description

---

## Per-Product Print Pages (`/prints/`)

Static HTML files generated at build time by `generate-prints.js`. One file per product.

**Purpose:** Provide per-product OG tags for Facebook/Pinterest share previews, Google SEO, and ad creative. Without these, all share links show the generic gallery OG image.

**How it works:**
1. `generate-prints.js` runs in GitHub Actions before S3 sync
2. Fetches product catalog from Lambda API Gateway URL directly (not through CloudFront — CloudFront blocks GitHub Actions IPs)
3. Generates `prints/{slug}.html` for each product with OG tags + `window.location.replace()` redirect
4. Redirect URL uses `?view={ITEM_ID}` param — opens the product modal in gallery.html
5. S3 sync uploads `prints/*.html` to S3
6. CloudFront behavior `/prints/*` routes to S3

**Redirect flow:**
- User clicks share link → hits `/prints/beer-drinker.html`
- Browser reads OG tags (Facebook/Pinterest scrape these)
- `window.location.replace()` redirects to `gallery.html?view=ITEM_ID`
- `handleViewParam()` in gallery.html reads `?view=` param and calls `openDetail(idx)` — modal opens
- `history.replaceState` cleans URL to `/gallery.html`

**Important:** `handleViewParam()` must be called BEFORE `handleIncomingProduct()` in `loadProducts()` — `handleIncomingProduct` calls `history.replaceState` unconditionally, wiping the `?view=` param before `handleViewParam` can read it.

**Slug format:** `item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')` — matches between `generate-prints.js` and `openDetail()` share button logic.

**Facebook share preview:** Shows product image and title correctly. Image may appear cropped because paintings are square and Facebook link previews are landscape (1200×630). Not fixable without creating custom cropped OG images per product.

---

## Lambda (`dna-kiosk`)

| Item | Value |
|---|---|
| Function name | `dna-kiosk` |
| Runtime | nodejs22.x, us-east-1 |
| Role | `arn:aws:iam::892204037842:role/dna-kiosk-role` |
| API Gateway URL | `https://doqg3wcta7.execute-api.us-east-1.amazonaws.com` |

**Environment variables:**
```
SQUARE_TOKEN=EAAAl92H7EIacTMeOgSxuIcLAxZlfv5DAG7OhNhxC97Qk6YnJJAFQ5QZruKwvh53
SQUARE_LOC=LYVD3ZGR3X4KE
SES_FROM=david@davidnicholsonart.com
NOTIFY_EMAIL=david@davidnicholsonart.com
API_URL=https://davidnicholsonart.com
ADMIN_TOKEN=dna-admin-k7x2mP9qR4wL8nJ3vF6tY1hB5cZ0sE
```

**`API_URL` is critical:** Controls the domain used when building image proxy URLs (`/image?id=...`). Must be set to `https://davidnicholsonart.com` so image URLs use the CloudFront domain instead of the raw API Gateway domain. Pinterest rejects API Gateway domains in `image_url` fields.

**Endpoints:**
- `GET /products` — fetches Square catalog, excludes originals, returns prints with `id, title, desc, img, rawImg, url, variations, year`
- `GET /feed` and `GET /feed.xml` — returns RSS/XML product catalog for Pinterest/Google; served publicly via CloudFront at `https://davidnicholsonart.com/feed.xml`
- `GET /hero` — returns a single random product with an image `{img, title, id}` — filtered to 2025–2026 prints, falls back to full catalog
- `GET /image?id=X` — proxies Square CDN image to avoid hotlink 403s; query string must be forwarded by CloudFront (Origin request policy: AllViewerExceptHostHeader)
- `POST /send-link` — sends email (SES) or SMS (SNS) with product link
- `POST /guestbook` — saves to DynamoDB (`dna-guestbook`) + emails david@davidnicholsonart.com; stores `name, email, note, subscribed (BOOL)`
- `POST /checkout` — accepts `{items:[{variation_id, item_id, title, price}]}`, creates Square Payment Link with `ask_for_shipping_address: true`, returns `{checkout_url}`
- `GET /admin/paintings` — all paintings with sales joined
- `POST /admin/paintings` — add painting
- `PUT /admin/paintings/{id}` — update painting
- `DELETE /admin/paintings/{id}` — delete painting + all its sales
- `POST /admin/paintings/{id}/sales` — add sale
- `PUT /admin/paintings/{id}/sales/{saleId}` — edit sale
- `DELETE /admin/paintings/{id}/sales/{saleId}` — delete sale
- `GET/PUT /admin/config` — price/sq in rate

**To redeploy Lambda:** Push `index.mjs` to GitHub — deploy is automatic via GitHub Actions.

**Note on images:** Square catalog API returns URLs that 403 in browsers due to hotlink protection. Lambda `/image` endpoint proxies them. All image elements use `referrerPolicy = 'no-referrer'` as a fallback.

**Email sender:** All emails send as `"David Nicholson Art" <david@davidnicholsonart.com>`. Display name set in code; address set via `SES_FROM` env var.

---

## Google Merchant Center

| Item | Value |
|---|---|
| Account | Existing account, davidnicholsonart.com claimed and verified |
| Feed URL | `https://davidnicholsonart.com/feed.xml?v=1` |
| Feed type | Scheduled fetch, daily, XML |

**Notes:**
- Same Lambda `/feed.xml` endpoint used for both Pinterest and Google
- `?v=1` query string required — Google's URL validator rejected the bare URL without it; bump to `?v=2` etc. to force a re-fetch if needed
- Missing GTIN warnings are expected and acceptable for handmade/art items

---

## SES (Email)

- Domain `davidnicholsonart.com` verified in SES ✓
- **Production access approved ✓** — guestbook notifications and send-link emails are live
- Sends from `david@davidnicholsonart.com` with display name "David Nicholson Art"

---

## SNS (SMS)

| Item | Value |
|---|---|
| Phone number | +18444767251 |
| Type | Toll-free |
| Phone number ID | phone-0c0649f801484987accc2fbeb0f0ed3b |
| ARN | arn:aws:sms-voice:us-east-1:892204037842:phone-number/phone-0c0649f801484987accc2fbeb0f0ed3b |
| Status | Pending carrier registration (up to 15 business days) |
| Monthly fee | $2.00 |

Lambda `sendSMS` updated with `OriginationNumber: '+18444767251'`. SMS will work once carrier registration clears.

---

## Email — david@davidnicholsonart.com

Set up via iCloud+ custom domain. DNS records added to Route 53:
- TXT: `apple-domain=...` verification + SPF record
- MX: `mx01.mail.icloud.com.` and `mx02.mail.icloud.com.` (both priority 10)
- CNAME: `sig1._domainkey` → iCloud DKIM

Sends and receives from Apple Mail on all devices.

---

## Favicon

- `favicon96.png` — 96x96, used as browser tab icon
- `favicon180.png` — 180x180, used as Apple touch icon (home screen)
- Both files in repo root, deployed to S3 via GitHub Actions
- Tags added to all HTML files

---

## SEO & Analytics

- **Google Analytics** — Measurement ID: `G-FL5BKJFVXF`, Stream ID: `14175458930`; snippet on all HTML pages
- **Google Analytics linked to:** Google Ads, Google Merchant Center, Google Search Console ✓
- **Google Search Console** — verified via GA tag; sitemap submitted and confirmed fetched
- **Open Graph** — `og-image.jpg` (1200×630, Shuttlecock No. 2) in repo root; OG + Twitter card tags on index.html and gallery.html
- **Per-product OG tags** — `/prints/{slug}.html` files have product-specific title, description, and image for Facebook/Pinterest share previews and Google SEO
- **sitemap.xml** — lists index.html, gallery.html, shop.html, shipping.html
- **robots.txt** — allows all crawlers, disallows kiosk.html, references sitemap
- **kiosk.html** — has `noindex, nofollow` meta tag; excluded from sitemap
- **Product image alt text** — gallery.html uses Square product description as `alt` text on all images (falls back to title if no description)

---

## Shopify — Cancelled

Shopify has been cancelled. All product images were already in Square — no image migration needed.
- Facebook/Instagram shops reconnected to Square ✓
- Pinterest shop reconnected via custom feed ✓

---

## HTML Files

All are single-file, no framework — intentional, keep it that way.

**Session workflow:** Claude generates files here, David downloads and pushes to GitHub. GitHub is NOT the source of truth during a session — the latest file Claude produced is. At the start of each session, upload all files from the repo as a starting point.

### index.html (homepage)
- Hero column width: 820px
- Hero calls Lambda `GET /hero` for a single random product image — fast, no full catalog fetch
- Image appears at natural aspect ratio (`height: auto`) — no fixed placeholder, no skeleton
- Caption (print title) appears only after image loads
- `referrerPolicy = 'no-referrer'` on hero image to avoid S3 403
- Guest book POSTs to Lambda; includes newsletter opt-in checkbox ("casually stay informed") — `subscribed` bool stored in DynamoDB
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
  - "Add to cart" button — adds selected variant, closes modal, returns to grid
  - Swipe left/right to browse on mobile
  - Click image → fullscreen shadowbox
- **Fullscreen shadowbox:** left/right arrows + swipe to navigate; tap background or ✕ to close
- Cart modal: shows all items with thumbnail, title, size, price, remove button, running total
- Checkout button → POSTs to Lambda `/checkout` → redirects to Square hosted checkout
- Checkout redirect URL: `https://davidnicholsonart.com/gallery.html?success=1`
- Product modal title and description use DM Sans (var(--font)) — not serif
- Product modal shows description + "Giclée prints are signed and dated, matted and ready to frame."
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
- Send-link (email/SMS) uses `p.url`
- Guest book POSTs to Lambda → email notification; includes newsletter opt-in
- Export CSV hidden behind triple-tap on "Guest Book" title
- Service worker cache key: `dna-v3`
- **Service worker blocks external image requests** — SW only passes through fonts, cdnjs, and Lambda API

### admin.html (admin dashboard)
- Password gate: `172377`
- **Always open at `https://davidnicholsonart.com/admin.html`** (apex, no www) — Safari CORS redirect cache issue
- **PWA:** installable as home screen app on iPhone/iPad via Safari → Share → Add to Home Screen
  - `admin.webmanifest` — app manifest (name: "DNA Admin", theme: #f8f6f3, orange icon)
  - `admin-sw.js` — service worker caches admin shell; passes API calls and S3 receipt URLs through to network
  - `admin-icon.png` — 512×512 orange DN icon
  - Safe area insets applied to topbar and main padding for iPhone notch

**Three-tab layout:**
- **Dashboard tab** — revenue cards (originals sold, large/small prints sold, art fair/online/gallery revenue) + expense cards (total expenses, top expense categories, miles driven, mileage deduction) + Revenue by Month chart (orange bars) + Expenses by Month chart (red bars, independent date range filter)
- **Inventory tab** — price/sq in rate adjuster + sortable/filterable painting table with inline editing; `↓ CSV` export
- **Expenses & Mileage tab** — expense table with year + category filters + `↓ CSV` export; mileage table with `↓ CSV` export

**Inventory features:**
- All paintings sortable by title, year, price, rounded price
- Filters: Never sold, Sold, Original available, Low print stock, Mom doesn't have
- Click row → expand: inline edit (title, month, year, dimensions, stock counts, Mom's Prints checkbox) + sale history
- Sale logging: date, type (original/large/small), channel (fair/online/gallery), price; gallery channel tracks gross + % + net
- Stock +/− buttons autosave immediately
- CSV export: title, month, year, dimensions, sq in, price, rounded, stock counts, units sold, original sold status

**Expense features:**
- Categories: Printing, Presentation, Art Supplies, Art Fair Fees, Retail & Packaging, Equipment, Marketing, Licenses & Fees, Travel, Other
- Color-coded category badges
- Receipt upload: file picker supports Camera, Photo Library, Browse on iPhone (no `capture` attribute — full iOS sheet)
- Hurdlr receipt URLs show as normal `📎 receipt` links; if link fails on click, shows "no longer available" inline
- Entries with no receipt show "no receipt"
- CSV export includes date, category, vendor, description, amount, receipt URL; respects active year/category filter

**Mileage features:**
- IRS standard rate hardcoded per year at top of script (`IRS_RATE_BY_YEAR`) — update each January
- 2025/2026 rate: $0.70/mile; 2024: $0.67/mile
- Deduction auto-calculated per entry using rate for that entry's year
- CSV export includes date, purpose, miles, IRS rate, deduction, notes

**Data storage — current state (localStorage, pending backend migration):**
- Expenses and mileage stored in `localStorage` key `dna-admin-expenses`
- Pre-seeded on first load with all 2024 + 2025 Hurdlr data (77 expenses, 2 mileage entries) mapped to new categories
- Inventory/sales stored in DynamoDB via Lambda API (already live)
- **To reset expense data to seed:** clear `dna-admin-expenses` from localStorage (DevTools → Application → Local Storage)

**Admin token:** `dna-admin-k7x2mP9qR4wL8nJ3vF6tY1hB5cZ0sE` — stored as Lambda env var `ADMIN_TOKEN`; currently bypassed (passed as `?token=` query param); auth enforcement deferred

### varied-readings.html (show page)
- Standalone page for the Varied Readings show, April 24, 2026
- 10 paintings in 5 diptych pairs, all base64 embedded
- 4×4 tile grid, each tile has independent sequence index
- Snake flip animation: even pairs top-down, odd pairs bottom-up
- Click any tile to advance it one step in the sequence
- Pairs: Junction & Terminal, Early Still & U.S. 50 East, Johnson Drive 6am & 6:01am, KS Wind Farm 1 & 2, Sunflower 1 & 2
- Links to phoenixgalleryart.com for gallery info
- No nav — standalone experience, "david nicholson" footer links back to index.html

### generate-prints.js (build script)
- Runs in GitHub Actions before S3 sync
- Fetches from `API_URL` (raw API Gateway URL) — NOT through CloudFront (CloudFront blocks GitHub Actions IPs)
- Writes `prints/{slug}.html` per product
- Each file: OG meta tags + `window.location.replace("gallery.html?view=ITEM_ID")`
- Slug logic matches gallery.html share button slug generation

---

## Expense Tracker — Backend Migration (Pending)

Current state: expenses/mileage in localStorage. Backend wiring is ~2–3 hours in one session.

**What's needed:**
1. **DynamoDB** — new table `dna-expenses`; expenses and mileage in same table with `type` field. ~15 min in AWS console
2. **Lambda** — add routes to `index.mjs`:
   - `GET/POST/PUT/DELETE /admin/expenses`
   - `GET/POST/PUT/DELETE /admin/mileage`
   - `POST /admin/expenses/receipt-url` — pre-signed S3 URL for receipt upload (~10 lines)
3. **S3** — new `receipts/` prefix in existing bucket; CORS policy for browser PUT. ~5 min
4. **IAM** — add `dynamodb:*` on `dna-expenses` and `s3:PutObject` on receipts prefix to `github-kiosk-deploy` role
5. **Admin frontend** — swap `loadExpState`/`saveExpState` from localStorage to API calls; two `TODO` comments already mark the exact spots; receipt upload swaps `URL.createObjectURL` for pre-signed URL fetch
6. **Data migration** — one-time script to POST each localStorage record to the new API

---

## Pending — In Order of Priority

- [ ] **Expense tracker backend** — wire localStorage to DynamoDB/Lambda/S3 (see section above); ~2–3 hours
- [ ] **Google brand exclusion** — "David Nicholson" brand requested; check back to add as exclusion once approved
- [ ] **Meta Ads** — ~$5/day, not yet started
- [ ] **Pinterest Ads** — ~$30/day minimum, not yet started
- [ ] **SNS carrier registration** — waiting; check AWS Console → Pinpoint → Phone numbers → +18444767251 for status; SMS works once Active
- [ ] **Google Merchant Center** — trigger manual feed fetch to clear product type warnings; monitor feed health
- [ ] **Re-enable admin token auth** — CloudFront query string forwarding to Lambda needs investigation; currently auth is bypassed
- [ ] **www → apex redirect** — add CloudFront Function to redirect www to apex permanently

## On the Horizon

- **Print wall configurator**
- **Newsletter + mailing list manager** — MailerLite vs. custom SES; `/unsubscribe` endpoint; do together
- **Color picker filter for gallery** — maybe
- **Art fair mode enhancements** — maybe

---

## Completed This Session

- ✓ **Admin expense & mileage tracker built** — Expenses & Mileage tab in admin.html
  - Categories: Printing, Presentation, Art Supplies, Art Fair Fees, Retail & Packaging, Equipment, Marketing, Licenses & Fees, Travel, Other (derived from actual 2024–2025 Hurdlr data)
  - 2024 + 2025 Hurdlr expense data imported (77 records, $15,876 total) — mapped to new categories, Hurdlr S3 receipt URLs preserved
  - 2025 mileage imported: 488 miles (448 Lawrence + 40 Westport/KC), $341.60 deduction @ $0.70/mile
  - Expense and mileage CSVs exportable with active filters applied
  - Receipt upload with camera/photo library/browse on iPhone
- ✓ **Admin dashboard tab** — Dashboard / Inventory / Expenses & Mileage three-tab layout
  - Dashboard: all revenue + expense summary cards + both charts
  - Inventory: rate bar + table (rate bar moved from dashboard)
  - Expenses: data entry tables only, no duplicate cards
- ✓ **Expense chart** — Expenses by Month bar chart (red bars) with independent date range filter, mirrors revenue chart pattern
- ✓ **CSV export** — inventory, expenses, mileage all exportable; filenames include year/filter context
- ✓ **Admin PWA** — installable as iPhone home screen app
  - `admin.webmanifest`, `admin-sw.js`, `admin-icon.png` added to repo
  - `deploy.yml` updated to sync `*.js` and `*.webmanifest` to S3
  - Safe area insets for iPhone notch
  - Service worker caches shell, passes API calls through to network
  - SW cache version: `dna-admin-v1` — bump to v2 on next significant admin.html change

## Previously Completed This Session (prior entry)

- ✓ **Admin dashboard built** — `admin.html` at `https://davidnicholsonart.com/admin.html`; password-gated (172377); fully wired to DynamoDB via Lambda API
  - Inventory table: all 42 paintings, sortable, filterable, expandable rows with inline editing
  - Filters: Never sold, Sold, Original available, Low print stock, Mom doesn't have
  - Columns: Title, Year, Dimensions, Price (sq in calc), Rounded (nearest $50), Lg stock, Sm stock, Lg sold, Sm sold, Original status
  - Sale logging: date, type (original/large/small), channel (fair/online/gallery), price; gallery channel tracks gross + % + net
  - Edit painting details inline (title, month, year, dimensions, stock counts, Mom's Prints checkbox)
  - Edit/delete individual sales; delete painting with confirmation showing sale count
  - Summary cards: Originals Sold (in stock sub), Large Prints Sold, Small Prints Sold, Art Fair Revenue, Online Revenue, Gallery Revenue
  - Revenue chart by month with date range filter; Total Revenue card embedded left of chart
  - Price/sq in adjuster affects Price and Rounded columns live; persisted to DynamoDB config record
- ✓ **DynamoDB tables created** — `dna-paintings` (42 records + `__config__` rate record) and `dna-sales` (6 seeded records from inventory CSV); both PAY_PER_REQUEST in us-east-1
- ✓ **Lambda admin endpoints added** to `index.mjs`
- ✓ **CloudFront behavior `/admin/*`** added to E2EJH38GWGPEPG pointing to API Gateway; CachingDisabled; AllViewerExceptHostHeader; allows DELETE/PUT/POST
- ✓ **IAM policies updated** — `lambda-deploy` user gets `dna-dynamodb-admin` policy; `dna-kiosk-role` gets `dna-dynamodb-paintings` policy for DynamoDB read/write
- ✓ **Seed script** (`seed-admin-tables.js`) — one-time Node.js script that created both tables and loaded all data from localStorage export

## Admin Dashboard — Key Notes

- URL: `https://davidnicholsonart.com/admin.html` — always use apex (no www) to avoid Safari CORS redirect cache issue
- Admin token: `dna-admin-k7x2mP9qR4wL8nJ3vF6tY1hB5cZ0sE` — stored as Lambda env var `ADMIN_TOKEN`; currently bypassed, passed as `?token=` query param
- DynamoDB paintings table stores paintings without sales array; sales stored separately in `dna-sales` with `paintingId` foreign key and GSI `paintingId-index`
- `__config__` record in `dna-paintings` stores the price/sq in rate
- Stock count +/− buttons autosave immediately via PUT to Lambda
- Painting edit form requires explicit "Save changes" button
- Mom's Prints checkbox seeded from CSV (37 checked; Beer Drinker, Evening Walkers, U.S. 50 East, Junction, U.S. 69 unchecked)
- SW cache key is `dna-admin-v1` — bump to `dna-admin-v2` in `admin-sw.js` after any significant `admin.html` update

---

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

---

## Cloudflare Note

`davidnicholsonllc.com` was previously on Cloudflare. Cloudflare injects email obfuscation scripts. Workaround: all mailto links use split-string JS (`'mai'+'lto:...'`). **Do not use plain `href="mailto:..."` links anywhere.**

---

## iPad Art Fair Setup

1. Open https://davidnicholsonart.com/kiosk.html in Safari
2. Let all prints load on good WiFi (populates offline cache)
3. Safari → Share → Add to Home Screen
4. Settings → Accessibility → Guided Access to lock iPad to kiosk

## iPhone Admin Setup

1. Open https://davidnicholsonart.com/admin.html in Safari
2. Safari → Share → Add to Home Screen
3. Opens full-screen as "DNA Admin" with orange DN icon

---

## Key Principles

- **ACM certs for CloudFront must be in us-east-1** — any other region silently fails
- **Single-file HTML** — no frameworks, no build pipeline for HTML files, keep it that way
- **Always ask which file** — if a request doesn't specify which HTML file to update, ask before making changes
- **Square Payment Links**: use `checkout_options: { ask_for_shipping_address: true }`
- **No mailto links** — use split-string JS onclick to prevent Cloudflare obfuscation
- **S3 bucket is in us-east-2** — despite most other resources being in us-east-1
- **IAM role must explicitly list both CloudFront distribution ARNs** for invalidation to work
- **S3 bucket name is `kiosk.davidnicholsonllc`** (no .com)
- **`davidnicholsonart.com` is served by E2EJH38GWGPEPG** — not E31J8ASEUTGXD9 (that's the kiosk legacy domain)
- **CloudFront /image* must forward query strings** — set Origin request policy to AllViewerExceptHostHeader; without this Lambda never receives the `?id=` param and returns 404
- **API_URL Lambda env var** — must be `https://davidnicholsonart.com`; controls image URL domain; Pinterest rejects raw API Gateway URLs
- **generate-prints.js fetches from API Gateway directly** — not through CloudFront; CloudFront blocks GitHub Actions runner IPs
- **handleViewParam before handleIncomingProduct** — handleIncomingProduct wipes the URL unconditionally; view param must be read first
- **Kiosk service worker blocks all external requests** except fonts, cdnjs, and Lambda
- **Admin SW cache key** — bump `dna-admin-v1` → `dna-admin-v2` in `admin-sw.js` after significant admin.html changes

---

## Contacts & Accounts

| Service | Detail |
|---|---|
| Instagram | @dave_nichol_son |
| Personal email | david@davidnicholsonart.com (iCloud+ custom domain) |
| Notification email | david@davidnicholsonart.com |
| Send-from email | david@davidnicholsonart.com |
| Square Online | https://david-nicholson-art.square.site |
| GitHub repo | https://github.com/h4jq7z68d9-david/kiosk |
| Google Analytics | G-FL5BKJFVXF, Stream ID 14175458930 |
| Google Search Console | davidnicholsonart.com, verified via GA tag |
