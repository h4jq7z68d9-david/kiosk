# Skill update: "Look at" list on work pages (Nov 5 2026)

Successor to `SKILL-UPDATE-2026-10-27.md`; everything there still holds. For the course-builder projects: update `study-site-builder` §2 (plate standard 5), §7 and §9, and the builder skills where they describe the work slide, to match. Repo: `h4jq7z68d9-david/kiosk`, branch `study-look-list-detail-crop` (not on `main` until David approves).

## What changed in the generator (`tools/study/build-course.js`)

1. **`look` on work slides.** A `work` slide may carry `look: []` beside `bul` — always three bullets, written from the image. The page renders, in order: `lead` → a small label **Look at** → the `look` bullets → a divider → the `bul` bullets with no label. A slide without `look` renders exactly as before, so no existing course changed (verified: a rebuild of all 12 courses changed only the `guide.css` cache string on every page).
2. **Search** indexes the `look` bullets with the rest of the page text.
3. **Size on the page.** No generator change. `det` now carries inches for new courses (e.g. `Oil on canvas, 50¾ × 58¾ in. Musée Fabre, Montpellier` — inches only, no cm on the page (cm stays in the ledger)); ¼ ½ ¾ and "3/4" render cleanly at 390 px, and the details line now wraps at any point rather than forcing a sideways scroll.

## Decision (David, Nov 5 2026): no detail crops

Detail-crop display was built and then removed on David's decision the same day. Nothing renders `img/<key>-detail.jpg`, and there is no `detailAlt` field. Remove plate standard 5 ("a detail crop where a Look-at bullet is about brushwork or surface") from `study-site-builder` §2 and the detail-crop item from §9; do not make the crops.

Not done on this branch: sRGB WebP output with JPEG fallback and `srcset`. It needs the deploy workflow to sync `*.webp` as well as `*.jpg`, so it stays a separate branch. Keep supplying the 1600 px JPEG.

## The work slide now

```js
{ type: 'work', key, artist, title, date, det, lead,
  look: ['…', '…', '…'],          // three bullets the viewer can confirm on the image
  bul: ['…', '…'],                 // history bullets, at most 2, no label
  terms?, subj?, quote? }
```

Files per work: `img/<key>.jpg` only.

## Clear from study-site-builder §9 "Generator changes still pending"

- `look` list with divider on work pages — shipped (this branch).
- detail-crop display beside a Look-at bullet — dropped (David, Nov 5 2026); delete the item.
- size shown on the page from `det` — no generator change needed; confirmed.
- sRGB/WebP/srcset output — still pending.
