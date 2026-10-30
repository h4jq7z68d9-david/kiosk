# Skill update: study pages are now one layout (Oct 27 2026)

For the Art History Course Builder conversation. Paste this whole note there and ask it to update the skills it uses (`art-history-course-builder`, and `course-study-pack` where it produces public study pages) to match. Repo: `h4jq7z68d9-david/kiosk`, branch `main` (deployed Oct 27 2026). Authoritative current state: `Kiosk-Project-Summary.md` → "Completed This Session (October 27 2026)".

## What changed

1. **One page per slide, one layout.** `tools/study/build-course.js` writes every slide (start, part overview, work, theme, text, sources, credits) as its own indexable page in the guide layout. The separate scrolling "Google pages" and the one-page viewer are gone.
2. **No viewer file per course.** `tools/study/classical-myth-viewer.html` and `tools/study/build-proto.js` are deleted. A course needs only a data folder, a settings file and a `study.html` card. The start-page text comes from the settings file (`intro`) or a built-in default.
3. **All styling is shared.** Layout `study/guide.css`, behavior `study/guide.js`, colors/fonts `site-tokens.css`. Generated pages contain no `<style>`, no `style=` and no color literals; **the generator throws if they do.** `study/study.css` now serves only `study.html`; `study/study.js` is deleted.
4. **Classical Myth is the condensed edition** (60 works, 7 modules) at the same URL. The 230+ old pages are gone, no redirects. Old version on branch `archive-classical-myth-full-2026-10-27`.
5. **Dark mode removed** from study pages and `site-tokens.css` (David).
6. **Bookmarks:** "Saved (n)" button and panel on every page, "Continue where you left off" link. Nothing for the skill to produce; it comes from `guide.js`.

## What the skill must produce now (the data bundle contract)

Folder `study/art-history/<slug>/`:

| File | Content |
|---|---|
| `data.js` (+ more data files, any names) | `window.SITE = { title, sections: {<wk>: '<section name>'}, handouts: [] }`; later files may `SITE.handouts.push({...})`. |
| `credits.js` | `window.CREDITS = { <imageKey>: { work, page, file, license, author?, source? } }` — `source` defaults to "Wikimedia Commons". One entry per image used. |
| `sources.js` (optional) | `window.SOURCES = { intro, groups: [{ title, items: [{ html, url? }] }] }` — becomes a Sources page. |
| `img/<key>.jpg` | JPEG per image key (width/height are read from the file). Public domain or CC0 only. |

A handout (= part): `{ n, wk, title, sub, quote?, overview: { img, cap: [artist, title, date], sum, bul: [], terms: [[term, def]] }, slides: [] }`.

Slides, by `type`:
- `work` — **preferred, artwork-first format:** `{ type:'work', key, artist, title, date, det, lead (2 sentences), bul (4–5), subj (2 sentences on the myth/subject), terms?, quote? }`. The page shows `subj` after a divider, with no heading (the heading was removed from every course on Oct 29 2026; set `subjLabel` in a course's settings to show one); no "Made for:" label. The older format (`fn` + `sum` + `bul`) still renders.
- `theme` — `{ type:'theme', img, title, stmt, para, bul, terms?, works: [keys], quote? }`
- `text` — `{ type:'text', title, sub?, sum, bul, terms }`

Rules the generator enforces or relies on: work titles must be unique within a section (they become file names); slide ids/work keys unique; every image key needs a credits entry; no "Free study guide", "Text by David Nicholson" or "Week N" anywhere (build fails).

## Settings file `tools/study/courses/<slug>.json`

```json
{
  "name": "Course Name",
  "dataFiles": ["data.js", "data_m2.js"],
  "greekKey": false,
  "introImg": "<work key>",
  "intro": "Optional start-page paragraph.",
  "homeDescription": "Meta description for the course home.",
  "ldDescription": "One-line course description (rail subtitle, start page, JSON-LD).",
  "sourcesDescription": "Meta description for sources.html ({name} allowed).",
  "creditsIntro": "Intro paragraph on the credits page.",
  "creditsDescription": "Meta description for credits.html ({name}, {count} allowed).",
  "imgFrom": "optional-other-slug"
}
```

Only `name`, `dataFiles` and `introImg` are required. **Rule (David, Oct 27 2026): every course's start page has an image** — `introImg` names a work key (Classical Myth: `h1_persephone`, *The Return of Persephone*); the build fails without it. `viewer`, `viewerName` and `strip` are no longer read. `greekKey: true` is for Classical Myth only.

## Build and publish

- `node tools/study/build-course.js <slug>` writes the pages, `study/art-history/<slug>/index.js` (outline + search) and the course's block in `sitemap.xml`.
- URLs: home `<slug>.html`; part `<slug>/<section>/<part-title>.html`; work `<slug>/<section>/<work-title>.html`; theme/text `<section>/theme-<title>.html`, `note-<title>.html`; `<slug>/{sources,credits}.html`.
- Add one card to `study.html` (lowercase site voice, image from the course's `img/`).
- Nothing deploys until David approves real-page screenshots at desktop and phone width; merging/pushing to `main` deploys.

## Edits for the skills

- Remove any step that creates or edits a per-course viewer HTML file, `build-proto.js`, or inline CSS in pages.
- Make the artwork-first work format (`lead`, `bul`, `subj`) the default output.
- Put the start-page text in the settings file (`intro`), not in a viewer.
- "Public mode" checks: run `build-course.js` (it fails on styling, banned wording and duplicate URLs), then check images load, titles/descriptions unique, every sitemap URL exists, and screenshots at 1440 and 390 px.
- Course-study-pack's "site format at any time" output (David's request) is now just: the data bundle + settings file above, then run the generator.
