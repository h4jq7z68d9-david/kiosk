# Composition (technique, Mode 2 rebuild) — handoff to the art business project

## 1. Topic
- **Course:** Composition, slug `composition`, lane technique. Rebuild of the live course (same slug and home URL); install with `--force`.
- **Counts:** 1 section ("Arranging a Picture"), 1 part ("The Principles"), 17 slides: one `topen` (course home) + 16 `concept` slides, each with an `ex` example artwork. Build reports `wrote 19 pages (16 works, 1 parts, 2 other)` — concept slides count as "works". 33 images, 6.7 MB. 46 redirect stubs.
- **Date:** Nov 11 2026.
- **Bundle folder:** `School v2/Art Technique Course Builder/Composition/Public Study Site - Mode 2/`
- **Bundle files:** `data.js`, `credits.js`, `sources.js`, `img/` (33 JPEGs), `composition.json`, `retired-urls.tsv`. This handoff is a working file the generator ignores.

## 2. Install
```
node tools/study/install-course.js composition --bundle "<bundle folder>" --lane technique \
  --name "Composition" --label "composition" --card-img poore-fundamental-forms \
  --card-text "how painters arrange a picture, from format and cropping to value massing, balance, line, rhythm, depth and unity." --force
```
Registry: same position and card image; only the card text changes.

## 3. Generator / test changes
None.

## 4. Retired pages
`retired-urls.tsv`, 46 lines: every old theme, work and part page → the matching new concept page under `/study/composition/arranging-a-picture/` (cut works go to the nearest concept: *Alba Madonna* → Format, *Paris Street; Rainy Day* → Cropping, *The Night Watch* → Focal Point, Radial Balance, the mandala and *The Harvesters* → Armatures, The Academy's Rules → Thirds and the Golden Ratio, Dow, Japan and Notan → Value Massing). Two history pages (A Short History, Alberti's Window) → `/study/composition.html`. The old section folders (`foundations`, `arranging-the-picture`, `putting-it-together`) keep only redirect stubs.

## 5. Held works
None.

## 6. Open flags
- **Repeat cleared:** *The Harvesters* is now the Oil vs Acrylic example; Armatures uses a new work, Andrea del Sarto, *The Holy Family with the Young Saint John the Baptist*, ca. 1528 (Met 22.75, Open Access; image from the Met, 1600 px).
- **Repeats with art history courses (allowed, one each):** Great Wave and Plum Estate (Japanese Woodblock Prints), Cassatt (Impressionism), Death of Socrates (Neoclassicism), Oxbow (Romanticism).
- **Plates:** every concept image is a Dow (1914) or Poore (c. 1915) plate, PD. The generated depth diagram (`comp-depth`) is replaced by a crop of Dow No. 36 (Hiroshige tracing); Positive and Negative Space now uses a crop of Dow No. 43 (one design in three value schemes). Plates stay at their Gutenberg size (six under 500 px); no upscaling.
- **Cut:** Radial Balance; history slides folded into the opening; second examples (*Alba Madonna*, *Paris Street*, *Night Watch*).
- **Sizes:** inches are rounded to the nearest quarter (museum fractions such as 49 3/8 show as 49 1/4).
- **Own readings:** symmetry of the Colonna Altarpiece, balance of the Cassatt, and the rhythm of *Sudden Shower* are descriptions of the images, not museum text.

## 7. Test build (content project, throwaway clone, Nov 11 2026)
- Clone at `origin/main`. install-course: check PASS, smoke PASS (1440 and 390 px). `wrote 19 pages (16 works, 1 parts, 2 other)`; 33 images, 6.7 MB; 46 redirect stubs.
- Fact review: three independent rounds (round 1: 1 fail, 28 fixes; round 2 on changed lines: 12 fixes; round 3 on changed lines: 2 fixes); all applied. Fixture test `test-technique-slides.js` PASS. Reports in `Museum and Reference Notes/Fact review/Mode 2/`. No 6-word phrase shared with the live text, the source notes or between slides, except two credited quotes.
- Nothing from the clone was committed or pushed; the clone was deleted.

## 8. Prompt for the art business project
```
Install the Mode 2 rebuild of the Composition technique course. Load study-site-builder (§9) and dna-kiosk-conventions.

Bundle: iCloud Drive/School v2/Art Technique Course Builder/Composition/Public Study Site - Mode 2/ (request folder access to the whole "School v2/Art Technique Course Builder" folder if needed). Read HANDOFF to Art Business Project.md there first.

1. git pull; branch install-composition.
2. Run:
node tools/study/install-course.js composition --bundle "<bundle folder>" --lane technique --name "Composition" --label "composition" --card-img poore-fundamental-forms --card-text "how painters arrange a picture, from format and cropping to value massing, balance, line, rhythm, depth and unity." --force [--trailer lines per your instructions]
Expect: wrote 19 pages (16 works, 1 parts, 2 other); 46 redirect stubs; check PASS; smoke PASS.
3. Run node tools/study/test-technique-slides.js; it must PASS.
4. When everything passes, merge to main and push. Do not wait for David's review; he reviews and edits live afterward in the slide editor (edit-course composition).
5. Report: anything that failed or changed from the handoff; open flags from handoff §6; counts; Actions run green and https://davidnicholsonart.com/study/composition.html loads.
```
