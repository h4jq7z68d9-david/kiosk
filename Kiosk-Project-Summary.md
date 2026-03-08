# David Nicholson Art — Kiosk Project
*Last updated: March 2026*

---

## What's Live

**URL:** https://kiosk.davidnicholsonllc.com

The kiosk is deployed and working. Push any `.html` file to the `main` branch and GitHub Actions auto-deploys to S3 + invalidates CloudFront. Live in ~60 seconds.

---

## AWS Infrastructure

| Resource | Value |
|---|---|
| AWS Account ID | 892204037842 |
| Domain | davidnicholsonllc.com (Route 53) |
| S3 Bucket | `kiosk.davidnicholsonllc` (us-east-1, no .com) |
| CloudFront Distribution ID | E31J8ASEUTGXD9 |
| CloudFront Domain | d33vrz1flme0j4.cloudfront.net |
| SSL Cert | kiosk.davidnicholsonllc.com (ACM, us-east-1, auto-renews) |

**To update the kiosk:** push to `main` — GitHub Actions handles the rest.

**Manual update (fallback):**
1. Upload `.html` file(s) to S3 bucket `kiosk.davidnicholsonllc`
2. CloudFront → distribution → Invalidations → Create → path: `/*`
3. Live in ~30 seconds

**Old cert to delete:** `arn:aws:acm:us-east-2:892204037842:certificate/97eed359-f614-49e6-aaeb-f1cfe8c44424` (wrong region, unused)

---

## GitHub Actions Deploy Pipeline

**Repo:** https://github.com/h4jq7z68d9-david/kiosk
**Workflow:** `.github/workflows/deploy.yml`
**Trigger:** push to `main` → uploads all `*.html` files to S3 → CloudFront invalidation

**IAM setup (OIDC — no long-lived credentials):**
- Identity provider: `token.actions.githubusercontent.com` (added to IAM)
- Role: `github-kiosk-deploy` (arn:aws:iam::892204037842:role/github-kiosk-deploy)
- Policy: `kiosk-deploy-policy` — allows `s3:ListBucket`, `s3:PutObject`, `s3:DeleteObject`, `cloudfront:CreateInvalidation`
- GitHub secret: `AWS_ROLE_ARN` = `arn:aws:iam::892204037842:role/github-kiosk-deploy`

---

## Shopify API

| Item | Value |
|---|---|
| Store URL | https://0ipvjc-1v.myshopify.com (permanent, domain-independent) |
| Kiosk collection | `frontpage` (id: 337726701728) — 40 prints |
| Originals collection | `originals` (id: 341144928416) — 7 paintings |
| API endpoint | `/collections/frontpage/products.json?limit=250` |

**Important:** `/products.json?collection_id=X` does NOT work on the public Shopify API. Must use `/collections/{handle}/products.json`.

**To add a print to the kiosk:** add it to the `frontpage` collection in Shopify admin — appears automatically on next load, no code changes needed.

---

## kiosk.html — Key Config

```js
const SHOPIFY = 'https://0ipvjc-1v.myshopify.com';  // permanent
const LAMBDA_URL = '';  // fill in after Lambda deploy
const IG = 'https://instagram.com/dave_nichol_son';
// Endpoint: /collections/frontpage/products.json?limit=250
```

---

## kiosk.html — Features

- 3-column grid of prints, fetched dynamically from Shopify
- Tap print → detail modal (image, title)
- Left/right arrows + swipe to navigate between prints in landscape
- Tap image → fullscreen; tap again to close
- QR code always visible in modal — scan to order, tap to open in same window
- Email + phone fields always visible — send product link via mailto/sms
- Portrait mode: image full size at top, scroll down within modal for QR + send fields
- App bar name displayed in lowercase
- **Guest Book** — Name, Email, Note (optional) — saves to localStorage
- Export CSV hidden by default — triple-tap "Guest Book" title to reveal
- **Follow** modal — Instagram QR code for @dave_nichol_son
- Service worker caches everything after first load — works offline

---

## Next Steps

### 1. Lambda + SES + SNS (server-side email & text)
Replace mailto/sms so messages come from a dedicated address/number, not visitor's device.
- Create Lambda function + API Gateway endpoint
- SES: verify davidnicholsonllc.com, request production access (24-48hr approval)
- SNS: get dedicated phone number (~$1-2/month)
- Kiosk POSTs `{type, to, url}` to Lambda
- `LAMBDA_URL` constant already stubbed in kiosk.html — just needs the API Gateway URL
- Graceful fallback to mailto/sms if Lambda unreachable

### 2. Guest Book auto-email
Have every submission emailed to David immediately — no manual CSV export needed.
- Same Lambda function handles it
- POST `{type:'guestbook', name, email, note}` → SES sends to dave@davepainting.com

### 3. iPad setup for art fair
- Open kiosk.davidnicholsonllc.com in Safari
- Let all prints load on good WiFi (populates offline cache)
- Safari → Share → Add to Home Screen
- Settings → Accessibility → Guided Access to lock iPad to kiosk

---

## Platform Strategy

- Currently on Shopify $40/month for online store + Facebook/Instagram/Pinterest integrations
- Social commerce integrations were painful — don't touch until there's a clear reason to migrate
- Shopify Starter ($5/month): unlimited products, but 5% transaction fee — breakeven vs $40 plan is ~$1,667/month in sales
- David uses **Square** for in-person POS — Square also does online checkout (2.9% + 30¢, no monthly fee)
- Long-term option: migrate checkout to Square, eliminate $40/month Shopify bill
- Prints: 9×12 at $50, 5×7 at $35
- Flat-rate shipping is the right approach

---

## HIPAA Web App (Separate Future Project)

- Keep completely separate from this project and davidnicholsonllc.com
- Requires: AWS BAA, specific service configs, encryption, audit logging, access controls
- Consider a separate AWS account for clean compliance boundary
- Nothing to configure now — tackle when ready
