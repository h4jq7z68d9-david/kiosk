# Kiosk Project Summary

## What's Live

| URL | Purpose |
|---|---|
| https://davidnicholsonart.com | Main entry point / homepage (index.html) — primary public site |
| https://davidnicholsonart.com/gallery.html | Public print gallery with cart + checkout |
| https://davidnicholsonart.com/shop.html | Shop page |
| https://davidnicholsonart.com/shipping.html | Shipping & returns info |
| https://davidnicholsonart.com/kiosk.html | iPad kiosk for art fairs |
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
| 4 | /prints/* | S3 | Per-product OG redirect pages |
| 5 | Default (*) | S3 | All other static files |

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
- Syncs `*.html`, `prints/*.html`, `*.png`, `*.jpg`, `*.xml`, `*.txt` files to S3
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
- Verified Merchant Program blocked until conversion source is healthy — not a priority until ads start
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

## Pending — In Order of Priority

- [ ] **Ad campaigns (mid-April)** — Google Shopping / Performance Max (~$5/day), Meta Ads (~$5/day), Pinterest Ads (~$30/day minimum)
- [x] **Pinterest Verified Merchant** — ✓ verified April 2026
- [ ] **SNS carrier registration** — waiting, nothing to do; SMS will work once cleared
- [ ] **Google Merchant Center** — monitor feed health; fix any product errors

---

## Up Next (Next Session)

- [x] **index.html footer full-bleed** — ✓ done
- **Sales/inventory dashboard**
- **Expense tracker**
- **Admin dashboard**
- **Print wall configurator**

## On the Horizon

- **Newsletter + mailing list manager** — MailerLite vs. custom SES; `/unsubscribe` endpoint; do together
- **Color picker filter for gallery** — maybe
- **Art fair mode enhancements** — maybe
- [x] **CloudFront Pro upgrade** — ✓ upgraded April 2026; 25-behavior limit no longer a constraint

---

## Completed This Session

- ✓ **Gallery redesign** — masonry columns (3 desktop / 2 mobile), natural image proportions, white mat/padding effect on cards, hover lift instead of opacity dim
- ✓ **Gallery year sections** — replaced filter/shuffle with chronological year sections; sidebar and mobile bar are now anchor jump-nav with scroll spy highlighting active year
- ✓ **Gallery nav** — removed "gallery" label, added ← back arrow to david nicholson home link
- ✓ **shipping.html** — full light theme conversion; consistent nav (← david nicholson + follow on instagram) and footer (gallery · contact · guest book) with working guestbook modal
- ✓ **index.html footer full-bleed** — removed max-width constraint and asymmetric padding; added shipping & returns link
- ✓ **Guestbook modal** — rounded corners (16px) and orange submit button consistent across gallery.html, index.html, shipping.html

## Previously Completed This Session (prior entry)

- ✓ **Shuffle button added to gallery.html sidebar** — appears below year filters (All / 2026 / 2025 / 2024 / 2023); shuffles current filtered set using Fisher-Yates; active state turns accent orange; icon is two vertical bowed arrows (SVG inline, no Font Awesome dependency); placeholder icon in place — swap for a better icon when found
- ✓ **gallery.html nav bar constrained** — top bar (David Nicholson / Gallery / Instagram / Cart) max-width constrained so it doesn't bleed to edges on iPad and desktop; content area width unchanged

## Previously Completed (prior session) — Site-wide light theme

- ✓ **Site-wide light theme applied** — gallery.html, index.html, and varied-readings.html converted from dark to light
  - Palette: `--bg: #f8f6f3`, `--ink: #1a2a3a`, `--ink2: #7a8a99`, `--ink3: #9aa0a8`, `--accent: #e07030`
  - kiosk.html intentionally left on dark theme
- ✓ **gallery.html nav:** Instagram as pill button (bordered); cart is bare icon with no circle border; active year filter in orange; 2-column mobile grid; add-to-cart and checkout buttons orange; footer links plain text (no pill borders)
- ✓ **index.html:** Event/venue links orange; footer links plain text; follow button uses `--border-mid` border
- ✓ **varied-readings.html:** Canvas bg updated to `#f8f6f3`; Phoenix Gallery link and footer link in orange
- ✓ **Pinterest boards created and populated**

- ✓ `varied-readings.html` created — interactive show page for Varied Readings (April 24, 2026, Phoenix Gallery, Lawrence KS)
  - 4×4 tile grid flip animation cycling through all 10 paintings in 5 diptych pairs
  - Snake pattern: top-down then bottom-up alternating between paintings
  - Each tile tracks its own sequence index independently — click any tile to advance it one step
  - Sweep respects manually advanced tiles, corrects tiles that jumped too far ahead
  - No pause — continuous animation, click interaction runs alongside
  - All 10 images base64 embedded — self-contained, no deploy dependency for images
  - Links back to davidnicholsonart.com via "david nicholson" footer link
- ✓ `index.html` updated:
  - "varied readings →" gold link added to future events section
  - "also at" changed to "represented at"
  - Dates changed from gold to white; "future" heading bumped to 26px
  - Lawrence, KS final friday artwalk @ phoenix gallery combined to one line, links to phoenixgalleryart.com
- ✓ Pinterest share buttons added to gallery.html product modal (Pinterest + Facebook)
- ✓ Pinterest tag base pagevisit fixed — click_id only included when epik param present
- ✓ Product modal title/description switched from Playfair Display to DM Sans
- ✓ Per-product /prints/ pages implemented (see full details in previous session entry)
- ✓ API_URL Lambda env var set to https://davidnicholsonart.com
- ✓ CloudFront /image* behavior Origin request policy set to AllViewerExceptHostHeader

## Previously Completed

- ✓ Pinterest tag base pagevisit fixed — `click_id` only included when `epik` param is present (omitting undefined key)
- ✓ Product modal title and description switched from Playfair Display (serif/italic) to DM Sans to match site nav typography
- ✓ Share buttons added to product modal — Pinterest and Facebook, styled to match nav buttons
- ✓ Per-product `/prints/` pages architecture implemented:
  - `generate-prints.js` build script added to repo root
  - `deploy.yml` updated to run script and sync `prints/*.html` to S3
  - CloudFront behavior `/prints/*` added to E2EJH38GWGPEPG pointing to S3
  - `handleViewParam()` added to gallery.html to open product modal from `?view=` param
  - Call order fixed: `handleViewParam` before `handleIncomingProduct` to prevent URL wipe
- ✓ `API_URL=https://davidnicholsonart.com` added to Lambda environment variables — image URLs now use CloudFront domain (required for Pinterest share button image validation)
- ✓ CloudFront `/image*` behavior Origin request policy set to AllViewerExceptHostHeader — forwards query string to Lambda so image proxy works

---

## Previously Completed

- ✓ Junction and Terminal added to Square — product descriptions and SEO descriptions written
- ✓ `/hero` endpoint updated to limit random selection to 2025–2026 prints
- ✓ Confirmed: SES production access granted, guestbook email notification working
- ✓ Confirmed: Instagram Shop live; Facebook Shop working
- ✓ Pinterest Tag added to gallery.html
- ✓ Google Search Console coverage issues resolved
- ✓ `shipping.html` noindex tag removed
- ✓ `sitemap.xml` updated to include shop.html and shipping.html
- ✓ Checkout page — nixed; Square hosted Payment Links handle checkout entirely
- ✓ Pinterest domain claimed; feed submitted
- ✓ Google Merchant Center feed submitted
- ✓ Google Analytics linked to Ads, Merchant Center, Search Console
- ✓ Product descriptions written for all 40 prints
- ✓ Facebook and Instagram shops reconnected to Square
- ✓ SEO pass: meta tags, OG, Twitter cards on all pages
- ✓ og-image.jpg created and deployed
- ✓ sitemap.xml and robots.txt added

---

## Cloudflare Note

`davidnicholsonllc.com` was previously on Cloudflare. Cloudflare injects email obfuscation scripts. Workaround: all mailto links use split-string JS (`'mai'+'lto:...'`). **Do not use plain `href="mailto:..."` links anywhere.**

---

## iPad Art Fair Setup

1. Open https://davidnicholsonart.com/kiosk.html in Safari
2. Let all prints load on good WiFi (populates offline cache)
3. Safari → Share → Add to Home Screen
4. Settings → Accessibility → Guided Access to lock iPad to kiosk

---

## Key Principles

- **ACM certs for CloudFront must be in us-east-1** — any other region silently fails
- **Single-file HTML** — no frameworks, no build pipeline for HTML files, keep it that way
- **Admin features hidden** — triple-tap pattern for CSV export
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
