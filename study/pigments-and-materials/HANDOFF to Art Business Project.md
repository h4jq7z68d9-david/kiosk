# Pigments and Materials (technique, Mode 2 rebuild) — handoff to the art business project

## 1. Topic
- **Course:** Pigments and Materials, slug `pigments-and-materials`, lane technique. Rebuild of the live course (same slug and home URL); install with `--force`.
- **Counts:** 1 section ("What Paintings Are Made Of"), 1 part ("The Materials"), 18 slides: one `topen` (course home) + 17 `concept` slides, each with an `ex` example painting. Build reports `wrote 20 pages (17 works, 1 parts, 2 other)` — concept slides count as "works". 35 images, 8.2 MB. 47 redirect stubs.
- **Date:** Nov 11 2026.
- **Bundle folder:** `School v2/Art Technique Course Builder/Pigments and Materials/Public Study Site - Mode 2/`
- **Bundle files:** `data.js`, `credits.js`, `sources.js`, `img/` (35 JPEGs), `pigments-and-materials.json`, `retired-urls.tsv`. Working files the generator ignores: `image_meta.json`, this handoff.

## 2. Install
```
node tools/study/install-course.js pigments-and-materials --bundle "<bundle folder>" --lane technique \
  --name "Pigments and Materials" --label "pigments and materials" --card-img amenhotep-palette \
  --card-text "what paintings are made of, from pigments and binders to panels, canvas and grounds, and how colors change with time." --force
```
Registry: same position; only card image and card text change.

## 3. Generator / test changes
None. The technique-slides fixture is self-contained since 779eafb, so this rebuild does not touch it.

## 4. Retired pages
`retired-urls.tsv`, 47 lines: every old theme and work page → the matching new concept page under `/study/pigments-and-materials/what-paintings-are-made-of/`; nine pages with no successor (the three history pages, the Egyptian blue lump, the two part pages for colors and binders, What a Binder Does, Varnish, Looking Beneath the Surface) → `/study/pigments-and-materials.html`. Color Theory's existing redirects into this course point at the course home, which stays.

## 5. Held works
None.

## 6. Open flags
- **Repeat across technique courses:** Rembrandt, *Self-Portrait* (1659, NGA) is also in Oil vs Acrylic. David's call (Nov 11): keep it here; swap it in Oil vs Acrylic at its rebuild. *Sunflowers* also appears in Post-Impressionism (allowed, history ↔ technique).
- **Cut from the live course:** What a Binder Does, Varnish, Looking Beneath the Surface (approved outline); Hokusai's *Great Wave* dropped (already in Woodblocks and Composition).
- **Images under 1600 px (carried):** the 12 diagrams and most example paintings are 1200 px, as in the live course. New plates (palette, cochineal, two Sowerby pairs) are 1600 px.
- **Twelve diagrams kept:** no public-domain plate showed whites, blacks, earths, greens, the media or the supports as plainly (hunt logged in `Museum and Reference Notes/Plates - Mode 2.md`).
- **Giotto binder:** NGA says "Tempera"; egg not confirmed. The slide is Egg Tempera, the details line says Tempera, and the example line makes no egg claim.
- **Carried open items:** Arlanza lion not confirmed as true fresco (page stays general); *Magdalen Reading* image from an aggregator, color unverified against the National Gallery.
- **Cochineal engraving:** Wellcome gives no date; credited as made for *The Christian's Magazine*.
- **Liotard size:** Getty collection record (57.2 × 47 cm) used, not the article caption (54.9 × 44.8 cm).
- **Word count:** slides run about 85–115 visible words against the 50–80 guide.

## 7. Test build (content project, throwaway clone, Nov 11 2026)
- Clone at `origin/main` 779eafb. install-course: check PASS, smoke PASS (1440 and 390 px). `wrote 20 pages (17 works, 1 parts, 2 other)`; 35 images, 8.2 MB.
- Fact review: three independent rounds (round 1: 12 fails, 20 fixes; round 2 on the fully rewritten text: 13 fails, 17 fixes; round 3 on changed lines: 3 fails, 9 fixes; all applied). Reports and fix logs in `Museum and Reference Notes/Fact review/Mode 2/`. Paraphrase check: no 8-word run shared with any source; a few short source-faithful phrases (hedged facts, a quoted price comparison) remain; no 6-word phrase shared between slides.
- Fixture tests: `test-technique-slides.js` PASS (4 viewports), `test-editor-technique.js` PASS.
- Nothing from the clone was committed or pushed; the clone was deleted.

## 8. Prompt for the art business project
```
Install the Mode 2 rebuild of the Pigments and Materials technique course. Load study-site-builder (§9) and dna-kiosk-conventions.

Bundle: iCloud Drive/School v2/Art Technique Course Builder/Pigments and Materials/Public Study Site - Mode 2/ (request folder access to the whole "School v2/Art Technique Course Builder" folder if needed). Read HANDOFF to Art Business Project.md there first.

1. git pull; branch install-pigments-and-materials.
2. Run:
node tools/study/install-course.js pigments-and-materials --bundle "<bundle folder>" --lane technique --name "Pigments and Materials" --label "pigments and materials" --card-img amenhotep-palette --card-text "what paintings are made of, from pigments and binders to panels, canvas and grounds, and how colors change with time." --force [--trailer lines per your instructions]
Expect: wrote 20 pages (17 works, 1 parts, 2 other); 47 redirect stubs; check PASS; smoke PASS.
3. Run node tools/study/test-technique-slides.js; it must PASS.
4. When everything passes, merge to main and push. Do not wait for David's review; he reviews and edits live afterward in the slide editor (edit-course pigments-and-materials).
5. Report: anything that failed or changed from the handoff; open flags from handoff §6; counts; Actions run green and https://davidnicholsonart.com/study/pigments-and-materials.html loads.
```
