# Kiosk Project Summary

## What's Live

**URL:** https://kiosk.davidnicholsonllc.com
| URL | Purpose |
|---|---|
| https://kiosk.davidnicholsonllc.com | Main entry point / homepage (index.html) |
| https://kiosk.davidnicholsonllc.com/shop.html | Public print gallery with cart + checkout |
| https://kiosk.davidnicholsonllc.com/kiosk.html | iPad kiosk for art fairs |

The kiosk is deployed and working. Push changes to GitHub — deploy is automatic.
**Deploy:** Push to GitHub → GitHub Actions auto-deploys to S3 in ~60 seconds. No manual upload needed.

---

## AWS Infrastructure

| Resource | Value |
|---|---|
| AWS Account | 892204037842 |
| S3 Bucket | kiosk.davidnicholsonllc.com (us-east-1) |
| CloudFront Distribution ID | E31J8ASEUTGXD9 |
| CloudFront Domain | d33vrz1flme0j4.cloudfront.net |
| SSL Cert | kiosk.davidnicholsonllc.com (ACM, us-east-1, auto-renews) |
| IAM User | lambda-deploy (AKIA47O4BG3JHDCHUU5W) |

**Old cert to delete:** `arn:aws:acm:us-east-2:892204037842:certificate/97eed359-f614-49e6-aaeb-f1cfe8c44424` (wrong region, unused)

**To update any file:**
1. Edit the file
2. `git add . && git commit -m "your message" && git push`
3. GitHub Actions deploys to S3 + invalidates CloudFront automatically
4. Live in ~60 seconds

---

## GitHub Actions Auto-Deploy

Fully configured. Push any file to the repo → live in ~60 seconds.
- IAM user: `lambda-deploy`
- Repo secrets set: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Workflow file: `.github/workflows/deploy.yml`

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

**Fix needed in Square dashboard:** "Resurrection\tLilies" has a tab character in the name — rename it.

---

## AWS Lambda

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
SES_FROM=noreply@davidnicholsonart.com
NOTIFY_EMAIL=dave@davepainting.com
```

**Endpoints:**
- `GET /products` — fetches Square catalog, excludes originals, returns prints with `id, title, desc, img, url, variations`
- `POST /send-link` — sends email (SES) or SMS (SNS) with product link
- `POST /guestbook` — emails dave@davepainting.com on guest book submission
- `POST /checkout` — **pending implementation** — should accept `{items:[{variation_id, item_id, title, price}]}`, create Square Checkout session, return `{checkout_url}`

**To redeploy Lambda:** Replace `index.mjs` in local lambda folder on Mac, run `./deploy.sh`.

**Note on images:** Square catalog API returns S3 URLs that 403 in browsers due to hotlink protection. Fixed in shop.html and index.html by setting `referrerPolicy = 'no-referrer'` on all image elements.

---

## SES (Email)

| Domain/Address | Status |
|---|---|
| dave@davepainting.com | Verified ✓ |
| davidnicholsonart.com | DNS records added, awaiting verification |

- SES still in **sandbox mode** — need to request production access
- **TODO:** AWS Console → SES → Account dashboard → Request production access (24-48hr approval)
- **Hold all email work** until davidnicholsonart.com domain is transferred and SES verification completes

---

## SNS (SMS)

Not yet set up. SMS send-link will fail until a dedicated phone number is provisioned (~$1-2/month in AWS SNS).

---

## Shopify (Being Cancelled)

- Old permanent URL: `https://0ipvjc-1v.myshopify.com` (keep until image migration complete)
- **DO NOT cancel until all 84 product images are downloaded** — CDN URLs will die
- Image download list: `image-urls.txt` (84 URLs)
- Rename map: `rename-map.txt` (handle-1.jpg / handle-2.jpg pattern)

---

## Image Migration Plan (In Progress)

1. Bulk download 84 images using `image-urls.txt`
2. Rename per `rename-map.txt` (handle-1.jpg / handle-2.jpg)
3. Add to GitHub repo under `/images/` folder → auto-deploys to S3
4. In Square dashboard: manually assign images to each product
5. Once done, Lambda `/products` will return image URLs and kiosk/shop will show them

---

## HTML Files

All three are single-file, no framework, no build step — intentional, keep it that way.

**Session workflow:** Claude generates files here, David downloads and pushes to GitHub. GitHub is NOT the source of truth during a session — the latest file Claude produced is. At the start of each session, fetch all 4 files from the repo as a starting point, but trust whatever was last produced in the session over GitHub.

### index.html (homepage)
- Hero column width: 820px
- Hero fetches a random product image from Lambda on page load
- Image loads by creating a fresh `<img>` element and replacing the placeholder on `onload`
- `referrerPolicy = 'no-referrer'` on hero image to avoid S3 403
- Guest book saves to localStorage (`dna_guests`)
- Contact link uses split string `'mai'+'lto:...'` to prevent Cloudflare email obfuscation injection

### shop.html (public gallery)
- Fetches from Lambda `GET /products`
- Grid shuffled randomly on each page load (Fisher-Yates)
- **Cart** in top-right nav — shopping bag SVG icon with count badge
- Cart persists in localStorage (`dna_cart`) across page loads and browser closes
- Cart clears from localStorage after successful checkout
- Tap print → bottom sheet modal on mobile, side-by-side on desktop
  - Image at natural square aspect ratio
  - Variant selector (size buttons) with name + price
  - "Add to cart" button — adds selected variant, closes modal, returns to grid
  - Swipe left/right to browse on mobile
  - Click image on desktop → fullscreen
- Cart modal: shows all items with thumbnail, title, size, price, remove button, running total
- Checkout button → POSTs `{items:[{variation_id, item_id, title, price}]}` to Lambda `/checkout` → redirects to Square checkout URL *(endpoint pending)*
- Guest book in footer (localStorage)
- Contact link uses split string to prevent Cloudflare obfuscation

### kiosk.html (art fair iPad)
- Fetches from Lambda (with service worker offline cache)
- Detail modal: title + "Order this print" + QR code (links to `p.url`)
- Email/phone send fields POST to Lambda
- Guest book POSTs to Lambda → email notification to dave@davepainting.com
- Export CSV hidden behind triple-tap on "Guest Book" title

---

## Pending — In Order of Priority

- [ ] **Implement Lambda `POST /checkout`** — accept `{items:[{variation_id, item_id, title, price}]}`, create Square Checkout session for multiple items, return `{checkout_url}`
- [ ] **Build checkout.html** — post-cart checkout page (shipping info, order summary, payment)
- [ ] **Request SES production access** (AWS Console → SES → Account dashboard) — hold until davidnicholsonart.com domain transferred
- [ ] **Download 84 Shopify images** before cancelling Shopify
- [ ] **Rename and upload images** to GitHub /images/ and Square dashboard
- [ ] **Wait for davidnicholsonart.com SES verification** to go green
- [ ] **Fix "Resurrection\tLilies"** tab character in Square dashboard
- [ ] **Cancel Shopify** ($40/month) — only after images are safely migrated
- [ ] **Reconnect Facebook/Instagram shops** to Square after Shopify cancelled
- [ ] **Provision SNS phone number** for SMS (~$1-2/month)
- [ ] **Delete orphaned ACM cert** in us-east-2 (see above)

---

## Cloudflare Note

`davidnicholsonllc.com` was previously owned by someone else who had it on Cloudflare. Cloudflare is injecting email obfuscation scripts into pages served from this domain even though DNS is on AWS Route 53. Workaround: all mailto links use split-string JS (`'mai'+'lto:...'`) so Cloudflare's obfuscator doesn't recognize them. **Do not use plain `href="mailto:..."` links anywhere** — they will be rewritten and break page scripts.

---

## iPad Art Fair Setup

1. Open https://kiosk.davidnicholsonllc.com/kiosk.html in Safari
2. Let all prints load on good WiFi (populates offline cache)
3. Safari → Share → Add to Home Screen
4. Settings → Accessibility → Guided Access to lock iPad to kiosk

---

## Key Principles

- **ACM certs for CloudFront must be in us-east-1** — any other region silently fails
- **Single-file HTML** — no frameworks, no build pipeline, keep it that way
- **Admin features hidden** — triple-tap pattern for CSV export, never visible to kiosk visitors
- **Shopify social commerce integrations** — reconnect to Square after migration, don't disrupt until ready
- **HIPAA web app** — future, entirely separate AWS account, nothing to do now
- **Always ask which file** — if a request doesn't specify which HTML file to update, ask before making changes
- **No mailto links** — use split-string JS onclick to prevent Cloudflare obfuscation

---

## Contacts & Accounts

| Service | Detail |
|---|---|
| Instagram | @dave_nichol_son |
| Notification email | dave@davepainting.com |
| Send-from email | noreply@davidnicholsonart.com |
| Shopify store | https://0ipvjc-1v.myshopify.com |
| Square Online | https://david-nicholson-art.square.site |
| GitHub repo | https://github.com/h4jq7z68d9-david/kiosk |
