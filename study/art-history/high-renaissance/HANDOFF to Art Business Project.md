# Build record — High Renaissance

## 1. Topic, slug, counts, date
- Topic: High Renaissance (art history, Mode 2)
- Slug: `high-renaissance`
- Counts: 1 section ("Italy, 1481–1538"), 1 part, 16 works, 0 themes
- Date: Nov 20 2026

## 2. Install steps
- Bundle: `data.js`, `credits.js`, `sources.js`, `img/` (16 JPEGs), `high-renaissance.json` (settings).
- Command (study-site-builder §9), from the repo root:
  `node tools/study/install-course.js high-renaissance --bundle <bundle folder> --lane art-history --name "High Renaissance" --label "high renaissance" --card-img raphael-school-of-athens --dates "1481–1538" --after early-renaissance --trailer "<co-author line>" --trailer "<session line>"`
- Registry entry (`tools/study/courses.json`): lane art-history, dates "1481–1538", card image `raphael-school-of-athens`; position after Early Renaissance in Italy (date order).
- Settings file goes to `tools/study/courses/high-renaissance.json`. One-part course: no `intro`/`intro2`.

## 3. Approved generator changes
None.

## 4. Pages to retire
None (new course; no `retired-urls.tsv`).

## 5. Held works
None.

## 6. Open flags (not yet decided by David)
a. `titian-assumption` image is soft (847 × 1600 px, WGA scan), and its red is disputed: the largest Commons scan reads crimson-magenta where the Frari's own image and every other source show orange-red. The chosen file matches the Frari image; no signed source describes the reds.
b. Three color corrections are approximate: `raphael-sistine-madonna` (matched to a small SKD thumbnail), `perugino-keys` (matched to a Vatican detail band; still +14/+10/+1 off on that band) and `michelangelo-adam` (matched to a Vatican banner crop). A fourth, `raphael-meadow`, matches the KHM image within 1 level. See `image_meta.json`.
c. `raphael-school-of-athens` is credited as public domain with `licenseUrl` null (photographer's CC0 plus PD-Art on Commons; the bundle credits PD only, per §2).
d. Giorgione's date ("about 1505–8") rests on Smarthistory (Jewitt) only; the Accademia record gives no date.
e. The Last Supper size is hedged ("about 189 × 346 1/2 in."): the ICCD record prints 480 × 880 with no unit.
f. Six works have no owning-museum collection record (Perugino, Last Supper, School of Athens, Creation of Adam, Libyan Sibyl, Assumption); facts come from the managing institutions' pages, state catalogue cards and signed essays (same exception as the Masaccio frescoes in Early Renaissance).
g. Creation of Adam and Libyan Sibyl "about 1511–12" are inferred from the ceiling's campaign split, not a record date.
h. "Italian" in the artist lines rests on birthplace for Perugino, Leonardo, Giorgione and Titian; Bellini's NG page says "Venetian".
i. No curricula check was done for this course (the outline flag: the Early Renaissance curricula were not re-opened), so the Sources page has no Curricula group. Coverage came from David's ARTH 38300 lectures and his direction.
j. The Sources page names David's Lindenwood course as a lecture source, as in Early Renaissance; he may want it removed.
k. Paraphrase check: Smarthistory SH-Keys, S1 and the Met E1/M3 texts could not be retrieved for n-gram comparison in Round 1 (HTTP 403/429).

## 7. Install
No install prompt: install per §9 and push to main when the checks pass, then report.
