# Handoff: condensed Classical Myth + one-layout study pages

Written Oct 27 2026 by the Art History Course Builder project for the art business project.
Branch: `generalize-study-generator` (pushed; not merged; nothing deployed).
Status: **David approved the condensed content and the one-layout design on Oct 27 2026.** Deploying still needs his final yes on the real pages, as always.

## What is on the branch

| Path | What |
|---|---|
| `tools/study/build-course.js` | Generalized generator (live layout). Byte-identical Classical Myth output except two expected lines. |
| `tools/study/DESIGN-BRIEF.md` | The one-layout brief (decided). Read it first. |
| `study/guide.css`, `study/guide.js` | Shared stylesheet and script for the one-layout pages (all courses). |
| `tools/study/build-proto.js` | Prototype generator: one real page per slide, no `<style>` in pages. **Not production**: noindex, no canonical/OG/JSON-LD/GA, not in the sitemap. |
| `study/art-history/classical-myth-v2/` | The approved condensed bundle: `data.js` + `data_m2..m6.js` (7 modules, 60 works), `credits.js`, `sources.js`. Images are reused from `classical-myth/img/`. |
| `tools/study/courses/classical-myth-v2.json` | Settings for v2 (`imgFrom: classical-myth`). |
| `study/art-history/classical-myth-v2-proto/`, `classical-myth-proto/` | Prototype output (70 and 231 pages). Delete before merge. |
| `site-tokens.css`, `study/study.css`, generators | Dark mode removed (David's request). Live pages keep `color-scheme: light dark` until regenerated. |
| Remote branch `archive-classical-myth-full-2026-10-27` | Archive of the current live section (copy of `main` at that time). |

## Work data format (new)

A work slide now has `lead` (2-sentence paragraph), `bul` (4-5 bullets), `subj` (2 sentences on the myth) instead of `fn` + `sum`. The page shows no "Made for:" label; it shows a small "The subject" heading before `subj`. `build-proto.js` already renders both formats.

## Steps to go live (art business project)

1. **Make the one-layout pages production-ready** in the generator (merge `build-proto.js` into `build-course.js`, or extend it): the page shell from `build-course.js` (canonical, OG, Twitter, JSON-LD with `publisher` not `author`, GA, site nav/footer), no `noindex`, no `<style>` blocks. Follow the acceptance checks in `DESIGN-BRIEF.md`.
2. **Replace the live section at the same URL** (`/study/art-history/classical-myth`): move the v2 bundle into `study/art-history/classical-myth/` (data files, credits, sources; keep `img/`), switch `courses/classical-myth.json` to the v2 data files, delete the old 230+ generated pages, regenerate. David confirmed old URLs need no redirects (live about a day; sitemap never submitted to Google).
3. **Sitemap**: the generator rewrites its own block; check the count (about 70 URLs).
4. **study.html card**: update the Classical Myth card text (60 works, 7 modules).
5. **Delete** the two `-proto` folders and `build-proto.js` (or keep it as a dev tool, unlinked).
6. **Test** (Playwright, 1440 and 390 px): search, outline, Prev/Next, Saved (bookmarks) panel, Continue link, lightbox, no console errors, every image loads, `grep -L` confirms no `<style>` in generated pages.
7. **Show David** screenshots of the real pages; merge to `main` only on his yes (merging deploys).
8. Update `Kiosk-Project-Summary.md`.

## Content notes

- Facts come from museum records gathered Oct 27 2026; sources listed per work on the Sources page. Five records were reached only through David's desktop browser (Orsay, Art UK/Leeds, Munich via Bavarikon, two Louvre records).
- Secondary sources only (museum page unreachable): Caravaggio *Medusa*, Cellini *Perseus*, François Vase. Acceptable; noted here for the record.
- The Sources page lists museum records as links, not full Chicago citations; upgrade if David asks.
- Optional extra work researched but not included: Pompeii wall painting *The Sacrifice of Iphigenia* (David did not opt in).
