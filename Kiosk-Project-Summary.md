# David Nicholson Art — Kiosk Project
*Last updated: March 2026*

---

## What's Live

| URL | Purpose |
|---|---|
| https://kiosk.davidnicholsonllc.com | Main entry point / homepage (index.html) |
| https://kiosk.davidnicholsonllc.com/shop.html | Public print gallery with checkout |
| https://kiosk.davidnicholsonllc.com/kiosk.html | iPad kiosk for art fairs |

**Deploy:** Push to GitHub → GitHub Actions auto-deploys to S3 in ~60 seconds. No manual upload needed.

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
| IAM User | lambda-deploy (AKIA47O4BG3JHDCHUU5W) |

**Old cert to delete:** `arn:aws:acm:us-east-2:892204037842:certificate/97eed359-f614-49e6-aaeb-f1cfe8c44424` (wrong region, unused)

---

## GitHub Actions Auto-Deploy

Fully configured. Push any file to the repo → live in ~60 seconds.
- IAM user: `lambda-deploy`
- Repo secrets set: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Workflow file: `.github/workflows/deploy.yml`

---

## Square (replacing Shopify)

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
- `GET /products` — fetches Square catalog, excludes originals, returns 40 prints with `id, title, desc, img, url, variations`
- `POST /send-link` — sends email (SES) or SMS (SNS) with product link
- `POST /guestbook` — emails dave@davepainting.com on guest book submission

**To redeploy Lambda:** Replace `index.mjs` in local lambda folder on Mac, run `./deploy.sh`.

---

## SES (Email)

| Domain/Address | Status |
|---|---|
| dave@davepainting.com | Verified ✓ |
| davidnicholsonart.com | DNS records added to Shopify DNS, awaiting verification |

- SES still in **sandbox mode** — need to request production access
- **TODO:** AWS Console → SES → Account dashboard → Request production access (24-48hr approval)
- DNS records for davidnicholsonart.com: 3 CNAMEs + 1 TXT, added to Shopify DNS

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
4. In Square dashboard: manually assign images to each product (88 uploads)
5. Once done, Lambda `/products` will return image URLs and kiosk/shop will show them

---

## Square Import

- `square_import.xlsx` — 84 variant rows, 40 prints, originals excluded
- Already imported to Square (40 prints confirmed in catalog)
- Prices: 5×7 at $35, 9×12 at $50

---

## HTML Files

All three are single-file, no framework, no build step — intentional, keep it that way.

### index.html (homepage)
- **TODO:** Update to fetch from Lambda instead of Shopify (4 find/replace edits — see below)

**Edits needed:**
1. Remove: `const SHOPIFY = 'https://0ipvjc-1v.myshopify.com';`
2. Replace fetch: `const r = await fetch(SHOPIFY + '/collections/frontpage/products.json?limit=250');`
   With: `const r = await fetch('https://doqg3wcta7.execute-api.us-east-1.amazonaws.com/products');`
3. Replace: `const withImg = products.filter(p => p.images?.[0]?.src);`
   With: `const withImg = products.filter(p => p.img);`
4. Replace: `img.src = p.images[0].src;`
   With: `img.src = p.img;`

### shop.html (public gallery)
- Fetches from Lambda
- Variant selector (size buttons) with dynamic price
- "Buy This Print" opens Square Online product page (`p.url`)
- Variant buttons: `white-space: normal`, 12px font, wraps long names gracefully

### kiosk.html (art fair iPad)
- Fetches from Lambda (with service worker offline cache)
- Detail modal: title + "I think I might want it" copy + QR code (links to `p.url`)
- Email/phone send fields POST to Lambda
- Guest book POSTs to Lambda → email notification to dave@davepainting.com
- Export CSV hidden behind triple-tap on "Guest Book" title

---

## Pending — In Order of Priority

- [ ] **Request SES production access** (AWS Console → SES → Account dashboard)
- [ ] **Update index.html** with 4 Lambda fetch edits above, push to GitHub
- [ ] **Push shop.html and kiosk.html** to GitHub repo
- [ ] **Download 84 Shopify images** before cancelling Shopify
- [ ] **Rename and upload images** to GitHub /images/ and Square dashboard
- [ ] **Wait for davidnicholsonart.com SES verification** to go green
- [ ] **Fix "Resurrection\tLilies"** tab character in Square dashboard
- [ ] **Cancel Shopify** ($40/month) — only after images are safely migrated
- [ ] **Reconnect Facebook/Instagram shops** to Square after Shopify cancelled
- [ ] **Provision SNS phone number** for SMS (~$1-2/month)
- [ ] **Delete orphaned ACM cert** in us-east-2 (see above)

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
