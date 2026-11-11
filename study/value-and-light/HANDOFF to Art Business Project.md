# Value and Light (technique, Mode 2 rebuild) — handoff to the art business project

## 1. Topic
- **Course:** Value and Light, slug `value-and-light`, lane technique. Rebuild of the live course (same slug and home URL); install with `--force`.
- **Counts:** 1 section ("Light, Shade and Form"), 1 part ("The Ideas"), 13 slides: one `topen` (course home) + 12 `concept` slides, each with an `ex` example work. Build reports `wrote 15 pages (12 works, 1 parts, 2 other)` — concept slides count as "works". 25 images, 5.3 MB. 48 redirect stubs.
- **Date:** Nov 11 2026.
- **Bundle folder:** `School v2/Art Technique Course Builder/Value and Light/Public Study Site - Mode 2/`
- **Bundle files:** `data.js`, `credits.js`, `sources.js`, `img/` (25 JPEGs), `value-and-light.json`, `retired-urls.tsv`. This handoff is a working file the generator ignores.

## 2. Install
```
node tools/study/install-course.js value-and-light --bundle "<bundle folder>" --lane technique \
  --name "Value and Light" --label "value and light" --card-img cross-fig21 \
  --card-text "how light and dark build form, from the value scale and the order of light and shadow to kinds of light, edges, chiaroscuro and tenebrism." --force
```
Registry: same position; only card image and card text change.

## 3. Generator / test changes
None.

## 4. Retired pages
`retired-urls.tsv`, 48 lines: old theme, work and part pages → the matching new concept page under `/study/value-and-light/light-shade-and-form/`; five with no successor (A Short History, Leonardo's Relief, The Drawing Manual, Simplifying What You See, Working in Value) → `/study/value-and-light.html`.

## 5. Held works
None.

## 6. Open flags
- **Replaced images, same keys:** the six Cross images (`cross-fig07`, `cross-figs-08-10-11`, `cross-figs-09-12`, `cross-fig13`, `cross-fig16`, `cross-fig21`) are new crops from a better scan (University of Toronto copy, about 2000 px per photo) and keep their keys; proportions changed slightly. If the installer keeps old thumbnails, delete them for these keys.
- **Cut:** The Drawing Manual, Core Shadow and Reflected Light (folded into the sequence slide), Flat Planes, Backlight, Two Lights at Once (Sargent dropped), Sfumato (into the Leonardo example), Simplifying, Toned Paper, Grisaille (into the Ingres example).
- **Painting details as concept images:** Morisot (key), Wright (candlelight), Rembrandt's *Aristotle* (chiaroscuro), Caravaggio's *Calling* (tenebrism); no plate shows these effects.
- **Drawing as example:** Prud'hon, *Study of Drapery* (chalk on blue paper) for Direction of Light.
- **Repeat:** Morisot, *Summer's Day*, is also in Impressionism (allowed, history ↔ technique).
- **Carried data gaps:** Sánchez Cotán size from the Meadows Museum (San Diego record behind a bot gate); Sorolla has no Ca' Pesaro record (facts from AMACI); Caravaggio has no museum record (in situ); Morisot on long loan to the Hugh Lane, Dublin, 2026–31.
- **Images under 1600 px (carried):** the paintings and Merrifield plates are 1200 px as in the live course; painting details are smaller (about 650–800 px).

## 7. Test build (content project, throwaway clone, Nov 11 2026)
- Clone at `origin/main` 779eafb. install-course: check PASS, smoke PASS (1440 and 390 px). `wrote 15 pages (12 works, 1 parts, 2 other)`; 25 images, 5.3 MB.
- Fact review: three independent rounds (round 1: 13 fails, 18 fixes; round 2 on the rewritten text: 3 fails, 21 fixes; round 3 on changed lines); all applied. Reports in `Museum and Reference Notes/Fact review/Mode 2/`. Text written fresh; no 6-word phrase shared between slides.
- Nothing from the clone was committed or pushed; the clone was deleted.

## 8. Prompt for the art business project
```
Install the Mode 2 rebuild of the Value and Light technique course. Load study-site-builder (§9) and dna-kiosk-conventions.

Bundle: iCloud Drive/School v2/Art Technique Course Builder/Value and Light/Public Study Site - Mode 2/ (request folder access to the whole "School v2/Art Technique Course Builder" folder if needed). Read HANDOFF to Art Business Project.md there first.

1. git pull; branch install-value-and-light.
2. Run:
node tools/study/install-course.js value-and-light --bundle "<bundle folder>" --lane technique --name "Value and Light" --label "value and light" --card-img cross-fig21 --card-text "how light and dark build form, from the value scale and the order of light and shadow to kinds of light, edges, chiaroscuro and tenebrism." --force [--trailer lines per your instructions]
Expect: wrote 15 pages (12 works, 1 parts, 2 other); 48 redirect stubs; check PASS; smoke PASS.
3. The six cross-* images keep their keys with new proportions: make sure their old thumbnails are regenerated.
4. Run node tools/study/test-technique-slides.js; it must PASS.
5. When everything passes, merge to main and push. Do not wait for David's review; he reviews and edits live afterward in the slide editor (edit-course value-and-light).
6. Report: anything that failed or changed from the handoff; open flags from handoff §6; counts; Actions run green and https://davidnicholsonart.com/study/value-and-light.html loads.
```
