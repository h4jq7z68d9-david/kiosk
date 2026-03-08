# David Nicholson Art — Project Summary
*Last updated: March 2026*

---

## What's Live

| URL | File | Purpose |
|---|---|---|
| kiosk.davidnicholsonllc.com | kiosk.html | iPad kiosk for art fairs |
| kiosk.davidnicholsonllc.com/index.html | index.html | Splash / main website |
| kiosk.davidnicholsonllc.com/shop.html | shop.html | Web gallery with buy buttons |

**To deploy any file:** upload to S3 → CloudFront invalidation `/*` → live in ~30 seconds.

The domain `davidnicholsonllc.com` (no subdomain) is a future step — index.html will eventually live there.

---

## AWS Infrastructure

| Resource | Value |
|---|---|
| AWS Account ID | 892204037842 |
| Domain | davidnicholsonllc.com (Route 53) |
| S3 Bucket | kiosk.davidnicholsonllc.com (us-east-1) |
| CloudFront Distribution ID | E31J8ASEUTGXD9 |
| CloudFront Domain | d33vrz1flme0j4.cloudfront.net |
| SSL Cert | kiosk.davidnicholsonllc.com (ACM, us-east-1, auto-renews) |

**Old cert to delete:** `arn:aws:acm:us-east-2:892204037842:certificate/97eed359-f614-49e6-aaeb-f1cfe8c44424` (wrong region, unused)

---

## GitHub Repo

**https://github.com/h4jq7z68d9-david/kiosk**

Files in repo: `kiosk.html`, `index.html`, `shop.html`, `Kiosk-Project-Summary.md`

**GitHub Actions auto-deploy (not yet set up — next session priority #1):**
- Push to `main` → automatically uploads to S3 + invalidates CloudFront
- Setup: IAM user with S3 write + CloudFront invalidation permissions → add as repo secrets → add `deploy.yml`
- Once live, workflow is: edit here → paste into local repo → `git push` → deployed

---

## Shopify

| Item | Value |
|---|---|
| Store URL | https://0ipvjc-1v.myshopify.com (permanent) |
| Kiosk/gallery collection | `frontpage` |
| Originals collection | `originals` |
| Public API endpoint | `/collections/frontpage/products.json?limit=250` |
| Print variants | 5×7 at $35, 9×12 at $50 — set up as **variants on each product** |

**Important:** Must use `/collections/{handle}/products.json` — `/products.json?collection_id=X` does NOT work on the public API.

**Storefront API (not yet enabled — next session priority #2):**
- Free, enable in Shopify admin → Settings → Apps → Develop apps
- Needed for: variant-aware cart, real add-to-cart, checkout URL generation
- Will replace the current public JSON fetch in both shop.html and eventually kiosk.html

---

## index.html — Splash Page

Single-column layout, left-justified at ~10% from left edge, 680px max-width.

- Hero image — random product photo from Shopify frontpage collection
- "david nicholson" title (weight 300) + "follow on instagram" pill button
- About section with **view gallery →** link (bold, steel blue `#a8b8c8`) → shop.html
- Future events: April 24 Final Friday Artwalk @ Phoenix Gallery; June 12–13 Downtown OP Art Fair
- Also at: Phoenix Gallery, 825 Massachusetts, Lawrence KS
- Past: Art Westport (KC), Art in the Park (Lawrence)
- Footer: © 2026 · contact (dave@davepainting.com) · guest book

**Guest Book** — localStorage, triple-tap "Guest Book" title → CSV export. Key: `dna_guests`.

**CSS palette:**
```css
--bg: #0a0a0a; --surface: #111; --border: #1e1e1e;
--ink: #f2ede8; --ink2: #999; --ink3: #777;
--accent: #a8b8c8; /* steel blue — dates + view gallery link */
--font: 'Jost', Futura, 'Trebuchet MS', Arial, sans-serif;
```
All text lowercase. Font weight 300 globally, 700 only on h2 headers and view gallery link.

---

## shop.html — Web Gallery

Dark aesthetic matching kiosk. Fixed nav: "david nicholson" (→ index.html) | "gallery" | "follow on instagram" pill.

- 3-column grid, `aspect-ratio: 4/5` cards, images centered with `object-fit: contain`
- Tap card → detail modal: large image, title, description, buy button
- **Current buy button** links out to Shopify product page (stopgap — headless upgrade is next)
- Footer: © 2026 · contact · guest book (same localStorage pattern as index)

---

## kiosk.html — Art Fair iPad Kiosk

iPad-optimized, fullscreen, no nav. Live at kiosk.davidnicholsonllc.com.

- 3-column grid of prints from Shopify `frontpage` collection
- Tap print → detail modal, swipe/arrow navigate, tap image → fullscreen
- "He doesn't have this print with him but I think I might want it" → QR code + email/SMS send link
- **QR codes currently point to Shopify product pages** — will be updated to shop.html once headless is live
- Guest Book (localStorage, triple-tap title → CSV export)
- Follow modal (Instagram QR for @dave_nichol_son)
- Service worker offline cache
- `LAMBDA_URL` constant stubbed for future server-side messaging

```js
const SHOPIFY = 'https://0ipvjc-1v.myshopify.com';
const LAMBDA_URL = ''; // fill in after Lambda deploy
const IG = 'https://instagram.com/dave_nichol_son';
```

---

## Headless Checkout — Roadmap

The goal: shop.html is a fully self-contained browse + checkout experience. Visitors never touch the generic Shopify storefront.

### Step 1 — Upgrade shop.html modal (next session priority #3)
- Enable Storefront API in Shopify admin (~2 min)
- Modal becomes a real product page:
  - Variant selector (5×7 / 9×12) with dynamic price
  - Add to cart → Shopify hosted checkout handoff (standard even for big headless stores)

### Step 2 — Update kiosk to hand off to shop.html
- QR code URLs → `shop.html?product={handle}` — page opens with that product's modal pre-loaded
- Send-link (email/SMS) sends shop.html URLs instead of Shopify URLs
- Swap Storefront API fetch into kiosk.html to replace current public JSON fetch
- Everything else in the kiosk stays exactly as-is

**Why this works well for the art fair UX:**
Visitor scans QR at the booth → lands on shop.html on their own phone → same look and feel they just saw on the kiosk → seamless path to checkout. Much better than dropping them into a generic Shopify storefront.

---

## Future: Lambda + SES + SNS

Replace kiosk mailto/sms with server-side sending from a dedicated address/number.

- Lambda function + API Gateway endpoint
- SES: verify davidnicholsonllc.com domain, request production access (24–48hr)
- SNS: dedicated phone number (~$1–2/month)
- Kiosk POSTs `{type, to, url}` to Lambda → sends email or SMS
- Same Lambda handles guest book auto-email → dave@davepainting.com
- `LAMBDA_URL` already stubbed in kiosk.html — just needs the API Gateway URL

---

## iPad Setup for Art Fairs

1. Open kiosk.davidnicholsonllc.com in Safari
2. Let all prints load on good WiFi (populates offline cache)
3. Safari → Share → Add to Home Screen
4. Settings → Accessibility → Guided Access to lock iPad to kiosk

---

## Platform Strategy

- Shopify $40/month — keeping for now due to FB/Instagram/Pinterest integrations (painful to configure, don't disrupt)
- Shopify Starter ($5/month): 5% transaction fee — breakeven vs $40 plan is ~$1,667/month in sales
- Square for in-person POS (2.9% + 30¢, no monthly fee)
- Long-term: once headless checkout is stable, evaluate dropping to Starter or migrating checkout to Square

---

## Key Technical Rules (Hard-Won)

- **ACM certs for CloudFront must be in us-east-1** — any other region silently fails
- **Shopify public API:** use `/collections/{handle}/products.json` — collection_id param doesn't work
- **Single-file HTML/CSS/JS** — no framework, no build step, intentional, keep it that way
- **HIPAA app must be completely separate** — separate AWS account recommended when that project starts

---

## Session Workflow

At the start of each session Claude should fetch:
- `https://raw.githubusercontent.com/h4jq7z68d9-david/kiosk/main/Kiosk-Project-Summary.md`
- `https://raw.githubusercontent.com/h4jq7z68d9-david/kiosk/main/kiosk.html`
- `https://raw.githubusercontent.com/h4jq7z68d9-david/kiosk/main/shop.html`
- `https://raw.githubusercontent.com/h4jq7z68d9-david/kiosk/main/index.html`

Treat `Kiosk-Project-Summary.md` as the steering document.

---

## Store Pages & Compliance (Pre-Launch Checklist)

Before shop.html is promoted as the primary storefront, the following pages are needed for Google Shopping, Meta Commerce, and Pinterest Catalogs to validate the store:

- **Return / Refund Policy** — required by all three platforms
- **Shipping Policy** — expected by customers and required by Google
- **Privacy Policy** — legally required; Meta won't approve without it
- **Terms of Service** — good practice, often required for catalog approval
- **Contact page or visible contact info** — email at minimum

These can live as simple HTML pages at kiosk.davidnicholsonllc.com/policies/ or be linked in the footer of shop.html and index.html. Shopify auto-generates draft versions of all of these — worth pulling those as a starting point rather than writing from scratch.

---

## Social Commerce — Do Not Break (Pre-Headless Checklist)

The Facebook, Instagram, and Pinterest catalog integrations were difficult to set up and must keep working. Before going headless on Shopify:

- **Verify** that the product catalog sync (FB/IG/Pinterest) pulls from Shopify's backend, not the storefront URL — it almost certainly does, meaning headless won't affect it
- **Do not** change the Shopify plan, disconnect sales channels, or unpublish products until this is confirmed
- **Test** that Instagram Shopping tags and Pinterest Product Pins still resolve correctly after any Shopify-side changes
- **Headless checkout only affects the buyer-facing URL** — Shopify still owns the product data and order processing, so catalog feeds should be unaffected, but confirm before fully cutting over
