# Color Theory (technique, Mode 2 rebuild) — handoff to the art business project

## 1. Topic
- **Course:** Color Theory, slug `color-theory`, lane technique. Rebuild of the live course (same slug and home URL); install with `--force`.
- **Counts:** 1 section ("Light, Paint and the Eye"), 1 part ("The Ideas"), 18 slides: one `topen` (course home) + 17 `concept` slides, each with an `ex` example painting. Build reports `wrote 20 pages (17 works, 1 parts, 2 other)` — concept slides count as "works". 35 images, 9.1 MB. 63 redirect stubs.
- **Date:** Nov 10 2026.
- **Bundle folder:** `School v2/Art Technique Course Builder/Color Theory/Public Study Site - Mode 2/`
- **Bundle files:** `data.js`, `credits.js`, `sources.js`, `img/` (35 JPEGs), `color-theory.json`, `retired-urls.tsv`. Working files the generator ignores: `image_meta.json`, `check/`, this handoff.

## 2. Install
```
node tools/study/install-course.js color-theory --bundle "<bundle folder>" --lane technique \
  --name "Color Theory" --label "color theory" --card-img chevreul-chromatic-circle \
  --card-text "how color works for painters, from light and the color wheel to contrast, mixing and mood, shown with historic color plates and public-domain paintings." --force
```
Registry: same position; only card image and card text change.

## 3. Generator / test change (one)
- **File:** `tools/study/fixtures/technique-slides/data.js`. **Change:** `img: 'bezold-plate-iii'` → `img: 'chevreul-1890-plate-ii'`. Both fixture tests copy images from `study/color-theory/img/`, and `bezold-plate-iii` is not in the rebuilt course, so without this they fail with ENOENT.
- **Test:** `node tools/study/test-technique-slides.js` → PASS; `node tools/study/test-editor-technique.js` → PASS (both run in the test clone after the install).

## 4. Retired pages
`retired-urls.tsv`, 63 lines: old theme/work/part pages → the matching new concept page; five pigment pages (paint and pigment, where pigments come from, how pigments behave, limited palettes, glazing) → `/study/pigments-and-materials.html`; seven history/other pages → `/study/color-theory.html`.

## 5. Held works
None.

## 6. Open flags
- **Repeat across technique courses:** *The Milkmaid* (triads) is also in Oil vs Acrylic. Swap it there when that course is rebuilt. *The Night Café* also appears in Post-Impressionism (allowed, history ↔ technique).
- **Swaps from the approved outline:** Zorn dropped (his "limited palette" is a documented myth); Titian moved to mixing light and paint. Seurat's *Circus Sideshow* dropped (already in Composition and Post-Impressionism); optical mixing uses Cross, *Pines Along the Shore* (Met). Color wheel uses Signac, *Evening Calm, Concarneau* (Met). Simultaneous contrast uses the Getty *Irises* (1889), not the Met vase.
- **Signac:** the Met marks it not open access, but Signac died in 1935 and the work dates from 1891; the file is the Met's own photograph donated to Commons (CC0). Credited under the 2D rule.
- **Under 1600 px (carried from the live course):** most carried images are 1200 px on the long or short edge; landscape works (Newton plate, Bezold, Munsell charts, Titian, Turner, Corot ×2, Night Café, Battersea Reach, Agapanthus, Gauguin) are 1200 px long edge. Temperamentenrose is 934 px, from a catalogue scan.
- **Two generated diagrams** remain (contrast of area; local and expressive color): no plate found.
- **Chevreul 1890 Plate I:** the bottom-right disk reads slate (likely a faded violet); the text says slate.

## 7. Test build (content project, throwaway clone, Nov 10 2026)
- Clone at `origin/main` 363c071d. install-course: check PASS, smoke PASS (1440 and 390 px). Lightbox opens by click; screenshots in `check/` (home, two concept pages and the lightbox at 1440 and 390).
- Fact review: two independent rounds (round 1: 25 fixes; round 2: 5 fixes + 3 alt texts); reports in `Museum and Reference Notes/Fact review/Mode 2/`. Paraphrase check: only color-name lists and a book-title fragment matched sources; no repeated 6-word phrase across slides.

## 8. Prompt for the art business project
See the code block David pastes; same text as below.

```
Install the Mode 2 rebuild of the Color Theory technique course. Load study-site-builder (§9) and dna-kiosk-conventions.

Bundle: iCloud Drive/School v2/Art Technique Course Builder/Color Theory/Public Study Site - Mode 2/ (request folder access to the whole Color Theory folder if needed). Read HANDOFF to Art Business Project.md there first.

1. git pull; branch install-color-theory.
2. Fixture fix first (handoff §3): in tools/study/fixtures/technique-slides/data.js change img: 'bezold-plate-iii' to img: 'chevreul-1890-plate-ii'.
3. Run:
node tools/study/install-course.js color-theory --bundle "<bundle folder>" --lane technique --name "Color Theory" --label "color theory" --card-img chevreul-chromatic-circle --card-text "how color works for painters, from light and the color wheel to contrast, mixing and mood, shown with historic color plates and public-domain paintings." --force [--trailer lines per your instructions]
Expect: wrote 20 pages (17 works, 1 parts, 2 other); 63 redirect stubs; check PASS; smoke PASS.
4. Run node tools/study/test-technique-slides.js and node tools/study/test-editor-technique.js; both must PASS. Commit the fixture change on the branch.
5. When everything passes, merge to main and push. Do not wait for David's review; he reviews and edits live afterward in the slide editor (edit-course color-theory).
6. Report: anything that failed or changed from the handoff; open flags from handoff §6; counts; Actions run green and https://davidnicholsonart.com/study/color-theory.html loads.
```
