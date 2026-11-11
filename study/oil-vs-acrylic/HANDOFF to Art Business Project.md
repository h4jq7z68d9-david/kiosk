# Oil vs Acrylic (technique, Mode 2 rebuild) — handoff to the art business project

## 1. Topic
- **Course:** Oil vs Acrylic, slug `oil-vs-acrylic`, lane technique. Rebuild of the live course (same slug and home URL); install with `--force`.
- **Counts:** 1 section ("Two Paints Compared"), 1 part ("The Ideas"), 10 slides: one `topen` (course home) + 9 `concept` slides, each with an `ex` example painting. Build reports `wrote 12 pages (9 works, 1 parts, 2 other)` — concept slides count as "works". 19 images, 3.9 MB. 35 redirect stubs.
- **Date:** Nov 11 2026.
- **Bundle folder:** `School v2/Art Technique Course Builder/Oil vs Acrylic/Public Study Site - Mode 2/`
- **Bundle files:** `data.js`, `credits.js`, `sources.js`, `img/` (19 JPEGs), `oil-vs-acrylic.json`, `retired-urls.tsv`. This handoff is a working file the generator ignores.

## 2. Install
```
node tools/study/install-course.js oil-vs-acrylic --bundle "<bundle folder>" --lane technique \
  --name "Oil vs Acrylic" --label "oil vs acrylic" --card-img oa-binders \
  --card-text "how oil and acrylic paint differ, from binders and drying to open time, blending, impasto, painting over and aging." --force
```
Registry: same position; only card image and card text change.

## 3. Generator / test changes
None.

## 4. Retired pages
`retired-urls.tsv`, 35 lines: old theme, work and part pages → the matching new concept page under `/study/oil-vs-acrylic/two-paints-compared/` (The Milkmaid → Painting Over Dry Paint; Rembrandt's 1659 Self-Portrait → Impasto); seven with no successor (the three history pages and their part page, Surfaces, Grounds for Each, Choosing Between Them) → `/study/oil-vs-acrylic.html`.

## 5. Held works
None.

## 6. Open flags
- **Repeats cleared:** *The Milkmaid* (also in Color Theory) and Rembrandt's 1659 *Self-Portrait* (also in Pigments and Materials) are gone from this course.
- **New works:** Rembrandt, *Lucretia*, 1664 (NGA, CC0) for Impasto — the Rembrandt Research Project (2015) questioned the attribution; the NGA keeps it as Rembrandt. Velázquez, *Philip IV*, about 1628 (Prado P001182) for How Oil Ages — the Prado record page was not opened; facts from Gallagher, Met Journal 45 (2010); image from Commons (PD-Art).
- **David Nicholson's paintings:** *Umbrella, Reverie* now carries Color Shift as It Dries, based on David's account (Nov 11) that its colors deepened as they dried. Both of his works remain his copyright (credits say so).
- **Cut or folded:** history pages → opening; Solvent and Water Acrylic → opening; Fat Over Lean → Oil Cures bullet; Mixing the Two in Layers → Painting Over bullet; Mediums and safety → Two Binders bullet; How Acrylic Ages → Acrylic Dries bullet; Varnishing → Open Time bullet; Grounds for Each and Choosing Between Them cut.
- **Images:** diagrams and carried paintings are 1200 px as in the live course; the two new paintings are 1600 px.

## 7. Test build (content project, throwaway clone, Nov 11 2026)
- Clone at `origin/main`. install-course: check PASS, smoke PASS (1440 and 390 px). `wrote 12 pages (9 works, 1 parts, 2 other)`; 19 images, 3.9 MB.
- Fact review: three independent rounds (round 1: 5 fails, 22 fixes; round 2 on the reworded text: 4 fails, 12 fixes; round 3 on changed lines: 1 fail, 3 fixes); all applied. Fixture test `test-technique-slides.js` PASS. Reports in `Museum and Reference Notes/Fact review/Mode 2/`. No 6-word phrase shared between slides.
- Nothing from the clone was committed or pushed; the clone was deleted.

## 8. Prompt for the art business project
```
Install the Mode 2 rebuild of the Oil vs Acrylic technique course. Load study-site-builder (§9) and dna-kiosk-conventions.

Bundle: iCloud Drive/School v2/Art Technique Course Builder/Oil vs Acrylic/Public Study Site - Mode 2/ (request folder access to the whole "School v2/Art Technique Course Builder" folder if needed). Read HANDOFF to Art Business Project.md there first.

1. git pull; branch install-oil-vs-acrylic.
2. Run:
node tools/study/install-course.js oil-vs-acrylic --bundle "<bundle folder>" --lane technique --name "Oil vs Acrylic" --label "oil vs acrylic" --card-img oa-binders --card-text "how oil and acrylic paint differ, from binders and drying to open time, blending, impasto, painting over and aging." --force [--trailer lines per your instructions]
Expect: wrote 12 pages (9 works, 1 parts, 2 other); 35 redirect stubs; check PASS; smoke PASS.
3. Run node tools/study/test-technique-slides.js; it must PASS.
4. When everything passes, merge to main and push. Do not wait for David's review; he reviews and edits live afterward in the slide editor (edit-course oil-vs-acrylic).
5. Report: anything that failed or changed from the handoff; open flags from handoff §6; counts; Actions run green and https://davidnicholsonart.com/study/oil-vs-acrylic.html loads.
```
