# Skill update: "Look at" list and detail crop on work pages (Nov 5 2026)

Successor to `SKILL-UPDATE-2026-10-27.md`; everything there still holds. For the course-builder projects: update `study-site-builder` §7 and §9 (and the builder skills where they describe the work slide) to match. Repo: `h4jq7z68d9-david/kiosk`, branch `study-look-list-detail-crop` (not on `main` until David approves).

## What changed in the generator (`tools/study/build-course.js`)

1. **`look` on work slides.** A `work` slide may carry `look: []` beside `bul`. The page renders, in order: `lead` → a small label **Look at** → the `look` bullets → the detail crop (below) → a divider → the `bul` bullets with no label. A slide without `look` renders exactly as before, so no existing course changed (verified: a rebuild of all 12 courses changed only the two cache strings on every page).
2. **Detail crop.** When `img/<key>-detail.jpg` exists next to `img/<key>.jpg`, it is shown as a small thumbnail under the Look-at list (max 260 × 180 px, left-aligned, 1 px border), full screen on click or Enter like the main image. When the file is absent nothing is rendered. The file name is exactly `<key>-detail.jpg` (same folder as the main image; `imgFrom` is honored).
3. **Alt text for the crop** comes from the slide's optional `detailAlt`; without it the generator uses "Detail of <title>". Put what the crop shows in `detailAlt` (plate standard 6).
4. **Search** indexes the `look` bullets with the rest of the page text.
5. **Size on the page.** No generator change. `det` now carries inches for new courses (e.g. `Oil on canvas, 50¾ × 58¾ in (129 × 149.2 cm). Musée Fabre, Montpellier`); ¼ ½ ¾ and "3/4" render cleanly at 390 px, and the details line now wraps at any point rather than forcing a sideways scroll.

Not done on this branch: sRGB WebP output with JPEG fallback and `srcset` (item d). It needs the deploy workflow to sync `*.webp` as well as `*.jpg`, so it stays a separate branch. Keep supplying the 1600 px JPEG.

## The work slide now

```js
{ type: 'work', key, artist, title, date, det, lead,
  look: ['…', '…', '…'],          // 2–3 bullets the viewer can confirm on the image
  detailAlt: 'Detail of …',        // optional; alt text for img/<key>-detail.jpg
  bul: ['…', '…'],                 // history bullets, at most 2, no label
  terms?, subj?, quote? }
```

Files per work: `img/<key>.jpg` (required) and `img/<key>-detail.jpg` (optional, shown only when `look` is present).

## Clear from study-site-builder §9 "Generator changes still pending"

- `look` list with divider on work pages — shipped (this branch).
- detail-crop display beside a Look-at bullet — shipped (this branch).
- size shown on the page from `det` — no generator change needed; confirmed.
- sRGB/WebP/srcset output — still pending.
