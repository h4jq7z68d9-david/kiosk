# Kiosk — Changelog

Session-by-session history of davidnicholsonart.com and the kiosk/admin system, newest first, moved here from `Kiosk-Project-Summary.md` on Nov 6 2026 (blocks unchanged). Current state lives in `Kiosk-Project-Summary.md`; each session adds its "Completed This Session (date)" block at the top of this file.

-----

## Completed This Session (November 7 2026, evening) — Classical Myth Mode 2 rebuild; count taglines removed (branch `install-classical-myth`, pushed to `main`)

- **Classical Myth in Art (Mode 2):** replaced the 60-work, 7-part course with the 18-work rebuild (one section "Greece to Paris, 530 BCE–1890", one part; 21 pages; 18 images, 5.2 MB) via `install-course.js --force`; kept its first place in the art history lane. 67 retired URLs redirect: 18 old work pages to the same work's new page, 49 (7 part overviews, 42 cut works) to the course home. No generator changes.
- **Count taglines removed (David's instruction):** Classical Myth part subtitle cleared; "eighteen" removed from the home summary, settings `intro`, `homeDescription`, `ldDescription` and the card text. Impressionism card text: "in 18 works" removed. Rule proposed for study-site-builder §4: no work/part counts in visible or metadata text.
- `check.js` PASS, `smoke.js` PASS after each change; other courses' pages unchanged.

-----

## Completed This Session (November 7 2026) — Impressionism Mode 2 rebuild; title pages; slide editor (branch `install-impressionism`, pushed to `main`)

- **Impressionism (Mode 2):** replaced the 60-work course with the 18-work rebuild (one section, one part; 21 pages). 70 retired URLs redirect: 18 old work pages to the same work's new page, 52 to the course home. David's edit from the slide editor: the part subtitle cleared.
- **check.js:** Mode 2 slides may have 3 to 5 Look-at bullets (was exactly 3).
- **Generator, all courses:** no "About this site" page and no how-to bullets, images note or "Continue where you left off". A one-part course opens on its part overview, titled and listed with the course name, with no part heading. Title pages (part overviews, multi-part course homes) list no works or parts; they take one or two paragraphs (`sum2`; settings `intro2`) and optional bullets (settings `introBul`). An empty part subtitle is left out. "Saved (n)" is "Bookmarks (n)", hidden until a page is bookmarked. `guideCss` 17, `guideJs` 13.
- **Redirect stubs** are written by `build-course.js` from `<course>/retired-urls.tsv` on every build. Rebuilds used to delete hand-made stubs (any subfolder holding only `.html` is cleared).
- **Slide editor (local only, never deployed):** `tools/study/edit-server.js <slug>` + `tools/study/editor/` + `tools/study/edit-course.zsh` (`edit-course <slug>`). Every page's text is editable in the real layout, titles and section names included; Save patches only the changed values in the course files, verifies the result, rebuilds and runs check.js. Title moves retarget `retired-urls.tsv` and add redirects for URLs already live. Ctrl-C commits and pushes the edits to `edits-<slug>` (or the install branch), never `main`. `deploy.yml` excludes the editor from the S3 sync; `check.js` enforces that and fails on any page referencing `/__edit/`. README.md added (editor documentation).

-----

## Completed This Session (November 6 2026, late night) — Khnopff and Exekias text fixes (not deployed; branch `text-fixes`)

Applied the two course-builder text fixes by replacing only the listed data file each: Post-Impressionism `data-m7.js` (three Khnopff bullets: the far-off street view, frame "not shown here", cool greys with the warm notes named) and Classical Myth `data_m4.js` (Exekias bullet now "On the outside, not shown here: …"). Diffed against `main`: only those four strings changed. Rebuilt both courses (84 and 70 pages); every other page in the two courses changed only in the search-index cache string. `check.js` PASS, `smoke.js` PASS; new text is on both work pages and in the site search index. Open flag from the Classical Myth HANDOFF, not applied: the cup is dated "c. 530 BCE" on the page; the CVA catalogue says "um 540 v. Chr."

-----

## Completed This Session (November 6 2026, night) — Neoclassicism and Rococo re-install; installer `--force` fix

Re-installed Neoclassicism and Rococo from the licence-clean bundle: 67 works, 77 pages, 67 images (17.0 MB), every image public domain or CC0. Part 4 is now "Chardin, Greuze and the Salon" (`enlightenment/chardin-greuze-and-the-salon.html`); the old Part 4 page, the Würzburg ceiling page and `tiepolo-wurzburg.jpg` are gone and nothing in the sitemap or search index points at them. Kept its place after Japanese Woodblock Prints / before Romanticism (the HANDOFF's `--after classical-myth` was not used). The re-install exposed two installer gaps, done by hand that time and now fixed in `install-course.js`: `--force` did not delete files a new bundle drops, and did not update an existing registry entry (the card would have kept "sixty-eight works"). Tested on a throwaway course: planted stale files removed, card text updated, checks green; test branch deleted. Released together with the licence updates below.

-----

## Completed This Session (November 6 2026, night) — Image licence updates for five live courses (not deployed; branch `licence-updates`)

David's rule (Nov 6): images must be certainly public domain or CC0 — no CC BY / BY-SA, no "©" in credits. Applied the course-builder bundles by copying only the files each HANDOFF listed (no text, URL or generator change): Post-Impressionism (`khnopff-door`, `klimt-pallas` images + credits + settings `creditsIntro`/`imagesNote`), Romanticism (`barry-pugin-palace-of-westminster` → Library of Congress photochrom + credits + settings), Classical Myth (`h9_exekias` → PD-self photo + credits), Color Theory (Munch credit line + settings), Value and Light (two La Tour credit lines). Verified by diff that only the listed credit entries and the two settings keys changed; new images are 1600 px RGB. All courses rebuilt; `check.js` PASS, `smoke.js` PASS. Sweep of every course's `credits.js`: no CC BY anywhere; the only "©" left is David's own work in Oil vs. Acrylic. Open flags from the HANDOFFs (text, not applied): three Khnopff reviewer notes; Exekias bullet describes the outside of the cup, which the image doesn't show.
## Completed This Session (November 6 2026, evening) — Neoclassicism and Rococo installed (not deployed; branch `install-neoclassicism-and-rococo`)

First course installed with `tools/study/install-course.js`. Bundle staged from iCloud (`School v2/Art History Course Builder/Neoclassicism and Rococo/Public Study Site/`); placed `--after japanese-woodblock-prints` (directly before Romanticism). Counts match the handoff: 3 sections, 7 parts, 68 works, 78 pages; 68 images, 18.2 MB; three under 1600 px as the handoff lists (Robert 1440, David self-portrait 1452, Kauffman 1538 — Déjeuner is now 1600). `V.chrome` 18→19, 13 courses rebuilt, `check.js` PASS, `smoke.js` PASS (credits chain: Japanese Woodblock Prints → Neoclassicism and Rococo → Romanticism). Handoff flag 7 closed: the Yale record (tms:810) confirms Gavin Hamilton, *The Death of Lucretia*, 1763–67, 84 × 104 in. Flags 1–6 stay open with David; flag 1 can change a part URL, so this is held until he approves.

-----

## Completed This Session (November 6 2026, midday) — Deploy gate (branch `deploy-gate`)

Sixth and last item of the process backlog. Two steps added to `deploy.yml` ahead of "Generate print pages": one decides from `git diff --name-only <before> <sha>` (the base commit is fetched with `--depth=1`, no full-history clone) whether anything `check.js` validates changed, the other runs `node tools/site/check.js` when it did. Trigger paths go beyond the backlog's `study/`, `tools/study/`, `*.html`: `tools/site/`, `tools/lambda/`, `index.mjs` (the route tests live in `check.js` now), `site-*.js/.css` (an unbumped chrome edit is what the check catches) and the workflow itself (changing the gate exercises it). Verified the path filter against 16 sample paths and the shell step by simulation against real commits; the first live run is the push of this branch, which touches the workflow and so runs the gate.

-----

## Completed This Session (November 6 2026, late morning) — Steering-doc split (branch `steering-split`)

Fifth item of the process backlog. `Kiosk-Project-Summary.md` (1660 lines) is now current state only — 26 sections, ~800 lines: Start here, What's Live, infrastructure, HTML files, tables, IAM, Pending, On the Horizon, setup notes, Key Principles, Contacts. All 52 "Completed This Session" blocks, the two "Previously Completed" sections and the Sept 30 2026 "Findings This Session" block moved here unchanged, newest first. Verified by script: each of the original 81 `##` headings appears in exactly one of the two files; the only lines that differ are six cross-references rewritten to say "in `CHANGELOG.md`" (Start-here steps 2 and 6, the admin four-tab note, and three Pending items). Start-here step 6 now says new session blocks go at the top of this file. `check.js` PASS.

-----

## Completed This Session (November 6 2026, afternoon) — install-course.js (not deployed; branch `install-tooling`)

Fourth item of the process backlog. Tested end to end on a fake bundle (a copy of Realism as `realism-test`, built output stripped, name changed) from a clean tree: 9.0 branch, 9.1 copy, 9.2 resize (49 images, 9.9 MB), 9.4 build (59 pages), 9.5 registry + `V.chrome` 18→19 + rebuild of all 13 courses, 9.6 `check.js` PASS, 9.7 `smoke.js` PASS with the two screenshots, 9.8 commit — 881 files in the commit, no hand step. The first run found a real gap: `build-registry.js` bumped a named list of 11 pages and missed `study/color-wheel.html`, which `check.js` caught; the bump now rewrites `?v=` in every `.html` in the repo. The test branch was deleted; nothing from it is on `main`. Nothing visible changed.
## Completed This Session (November 6 2026, afternoon) — Course registry (not deployed; branch `course-registry`)

Third item of the process backlog. The registry was derived from today's `study.html` and JSON-LD, so the first run of `build-registry.js --check` passed against the existing hand-maintained content — the generator reproduces it byte for byte; the only diff on `site-chrome.js` and `study.html` is the marker lines and two comments. Proven by breaking things: a course line deleted from `STUDY` (the Oct 30 Japanese Woodblock Prints bug) → `--check` fails; a settings file with no registry entry → fails; a bad card image key → fails; a real label change → writes both outputs, bumps `V.chrome` 18→19 in `build-course.js` and on all 11 pages (reverted after the test; live stays at 18 since nothing changed). `check.js` now runs the dry-run alongside its existing "course not in STUDY" check. Nothing visible changed; `check.js` PASS, `smoke.js` PASS.
## Completed This Session (November 6 2026, afternoon) — Shared chrome for the 10 main pages (not deployed; branch `shared-chrome`)

Second item of the process backlog. David confirmed index is meant to look different (pill, no cart) and approved: pill kept via page attribute, shop left out, phone sizes unchanged, only shared CSS moved. `site-bar.js` gained `data-ig="pill"` / `data-cart="off"` and an `openCart()` click hook; `site-bar.css` gained the pill/egg rules scoped to the bar. A one-off script replaced each page's `<nav>…</nav>` with the `data-chrome-nav` element + inline `site-bar.js` load, added the two stylesheet links, and stripped only `:root` (index keeps `--accent-lo`, `--wrap`) and bar rules from the inline `<style>` — 21–25 rules per page, 372 lines removed in all; index gained `body { padding-top: var(--nav-h) }` because its bar was sticky, the shared one is fixed. `V.bar` 4→5, all 12 courses rebuilt (cache strings only), `study.html` bumped. Before/after screenshots of all 10 bars at 1440 and 390: pixel-identical on 7 pages; index 1 px shorter (63→62, border now inside the box); gallery and originals cart hit-area 38/40→44 px so the icons sit ~3 px left; gallery phone side padding 16→20 px to match the other nine. Egg hover, menu and gallery cart verified in screenshots. `check.js` PASS (766 pages, 262 Lambda assertions), `smoke.js` PASS.
## Completed This Session (November 6 2026, later) — Lambda route tests (not deployed; branch `lambda-route-tests`)

First item of the process backlog. `tools/lambda/test.js` (CommonJS, like `check.js`) registers a Node module hook that resolves every `@aws-sdk/*` import to `tools/lambda/aws-stubs.mjs` — fake clients whose `send()` is logged and whose DynamoDB tables are in-memory Maps — then imports the untouched `index.mjs` and calls `handler` with API Gateway v2 events. Square is a replaced `https.request` that records the request and answers with a payment link. Env is set in the test (`SQUARE_LOC=TESTLOC00000`, test tokens/PINs). Each invariant was proven by breaking `index.mjs` on purpose and watching the test fail (gallery sale writing `dna-paintings` → 1 failure; auth gate removed → 118; Missouri id hardcoded in `/checkout` → 3; Jill accepting `ADMIN_TOKEN` → 26), then reverting. `check.js` now runs the suite after the service-worker sanity block and reports the one-line result; a failure lists each failed assertion as a check error. Nothing visible changed; `smoke.js` PASS, `check.js` PASS (766 pages, 12 courses, 262 Lambda assertions). Test-only mistakes found along the way: `/cart` reads `?products=`, not `?items=`; `/checkout` returns `checkout_url`. No Lambda code was changed.
## Completed This Session (November 6 2026) — Process hardening: Start-here runbook, check.js, smoke.js, first check findings fixed (deployed Nov 6 2026)

**Instructions.** "Start here" section added at the top of this file (session workflow, which skill governs what, push policy); the stale "David downloads and pushes" note retired; "Process and tooling backlog" added under Pending. Skills updated by David: `study-site-builder` §9 is now a numbered runbook with pass conditions; `dna-kiosk-conventions` corrected (single-file is not a rule; rebuild-all loop; `V.chrome` bump touches 11 main pages; 1600 px image rule; no content edits here). Project instructions rewritten to point at Start here.

**`tools/site/check.js`** (static, ~2 s): local links/images resolve; `<title>`, canonical, description, `og:title`, `og:image` on every indexable page, titles and canonicals unique; JSON-LD parses; sitemap ↔ files both ways; `?v=` on shared assets matches `V` in `build-course.js`; banned phrases on study pages (course codes allowed only in `sources.html`); per course: Look-at = 3 bullets, image keys ↔ credits ↔ `img/` files, long edge ≤ 1600 px, course present in `STUDY` and `study.html`, sources/credits pages exist. Skips admin, kiosk, booth, Jill's page, shop (legacy); treats `/hero-pool.js` as build-time. Exit 1 on errors.

**`tools/site/smoke.js`** (Playwright, ~2 min): serves the repo locally with analytics hosts blocked; 9 main pages and every course's home, one work page and credits page at 1440 and 390 px: console errors, sideways scroll, images loaded, menu opens and lists every course; course pages: site bar, search, outline, search results, on phones document does not scroll and Prev/Next bar is inside the viewport; focus course (`smoke.js <slug>`): lightbox opens, bookmark survives reload, screenshots `tools/site/out/<slug>-home-1440.png` and `<slug>-work-390.png` (gitignored). Needs `npm i playwright` in `../pw` (outside the repo) and Chromium or `/usr/bin/google-chrome`.

**Admin side (later the same morning).** **The manual `admin-sw.js` cache bump is gone:** `deploy.yml` now stamps `CACHE` with a 12-char sha256 of `admin.html` + `admin.webmanifest` + `admin-sw.js` before the S3 sync (live: `dna-admin-fc26277af7f5`, run on f7a8b75). The `v91` string in the repo is only a placeholder; never bump it. `check.js` sanity-checks that the stamp step is still in the workflow and `node --check`s `index.mjs` and `admin-sw.js`. `smoke.js` loads admin and Jill's page logged out at 1440/390 and kiosk/booth at iPad widths (1024/820, 1440/820 — kiosk overflows at 390 px by design; it is not a phone page). Decisions: Jill's page stays separate from admin (big bugs only; functionality changes discussed with Jill first); the admin mobile/UX overhaul to-do is closed — improved incrementally, nothing outstanding. Lambda route tests added to the backlog.

**First run on main found 31 problems, all fixed the same session:** 16 portrait course images capped at 1200 wide but 1627–2388 px tall (Color Theory 4, Post-Impressionism 10, Oil vs Acrylic 1, Pigments 1) resized to 1600 px long edge, q85, and those four courses rebuilt (only `og:image` dimensions changed); canonicals added to the five show pages and varied-readings, the five show pages added to `sitemap.xml`; `og:url`/`og:title`/`og:image` added to shipping.html; `study.html` `site-bar.css?v=1` → `?v=4`. Both checks pass on main.
## Completed This Session (November 5 2026) — "Look at" list on study work pages (deployed Nov 5 2026)

From the Art History Course Builder project (page model approved Nov 5 2026). `build-course.js`: a `work` slide may carry `look: []` (always three bullets, written from the image); the page renders lead → "Look at" label + list → divider → `bul` with no label. Slides without `look` render exactly as before: a rebuild of all 12 courses changed only the `guide.css` cache string per page (`guideCss` 16; `guide.js` untouched). `guide.css`: `.look` label spacing, `.det` wraps anywhere. `look` is in the search index. Inches with ¼ ½ ¾ in `det` confirmed clean at 390 px. **Detail crops dropped** (David, Nov 5 2026, after a first version rendered `img/<key>-detail.jpg`): nothing in the generator, CSS or data uses them. Not done: WebP/srcset output — separate branch; the deploy workflow would also need `*.webp` in the S3 sync. Skill note for the course-builder projects: `tools/study/SKILL-UPDATE-2026-11-05.md`. Headless-tested on a throwaway fixture at 1440/390 px, 0 console errors, no sideways scroll (fixture removed); approved and merged to main the same evening.


-----

## Completed This Session (November 1 2026) — Study lightbox steps through images again (deployed Nov 1 2026)

**David:** the full-screen image on study pages couldn't advance like the original guide's. Restored: ←/→ buttons (hidden ≤900 px, as before), arrow keys and swipe inside the lightbox step through every image in the course (items with a `thumb`, plus the current page's image); the next/previous page is fetched for its image and preloaded; closing goes to the page of the last image shown; buttons dim at the first/last image. Markup in `build-course.js` (`#lbp` / `#lbn`), behavior in `guide.js`, `.lb .nav:disabled` in `guide.css`. `guideJs` v11, `guideCss` v15, all 12 courses rebuilt (only the lightbox line and cache strings changed). New courses get it automatically from the generator — nothing per course. Tested headless at 1440 / 390 px; real iPhone swipe not yet confirmed.


-----

## Completed This Session (October 31 2026, midday) — Header icons (deployed Oct 31 2026)

**David:** lighter header after the home page. On every page except the home page, the "follow on instagram" button is replaced by Instagram's colored glyph (`.nav-ig`, 24 px, links to @dave_nichol_son, `aria-label="Instagram"`) — in `site-bar.js` and the 10 pages with an inline bar. The home page keeps its pill button (and has no bag). The bag icon is the site navy (`--accent`) on every page (`site-chrome.css`). `site-bar.js` v4, `site-chrome` v17, all courses rebuilt.


-----

## Completed This Session (October 31 2026, late morning) — Color wheel: recipe mixer (deployed Oct 31 2026)

**David's ask:** see the progression of a mix, and add white or black at any point — including starting from white ("white, a touch of yellow, a touch of red" is a different mix from adding titanium white at the end). **Built in `study/color-wheel.html` (page and menu pop-up):** the mixer is a list of steps in the order mixed. Centered **+ color / + white / + black** buttons sit above the list. Each row: what was added, a slider for how much went into the mix so far (defaults: color an even share, white 25%, black 5%), the mix after that step, and × to remove it. Result and Clear at the bottom. The wheel's needle shows the selected color row; tap a row, then tap the wheel to change it. Max 8 steps. The White/Black sliders and "+ Mix" are gone.

**Mix blocks (follow-up):** a **+ mix** button (centered, under the mixes) starts a new block whose base is everything mixed so far (e.g. get an orange, then see what a touch of blue does). One mix is open at a time (accordion); the others fold to their result swatch and name ("Mix 1 · Orange"). The + color / + white / + black buttons add to whichever mix is open, so an earlier mix can be corrected and every later mix updates. The open mix has its own header ("mix 2 ▾", tap to fold) and **clear** (mix 1: clears the whole recipe; a later mix: removes it and any after it); there is no separate result row — each row's right-hand swatch and each folded mix show the results. All mixer text is lower case. **Needles back (David):** one needle per color in the open mix (up to 4, the original needle styles) — drag a needle to change that color; moving the needle in a mix with no color yet adds one. Tapping a row settles which needle moves: a drag grabs the selected row's needle when it is nearly as close as the closest one (within 36 px), and a tap on a wedge moves the selected row's needle. Tapping the open mix's header folds it too, so every mix shows as a result row for side-by-side comparison; the add buttons then go to the last mix (and open it), and the wheel changes nothing until a mix is open. A block after the first has an × to remove it. Max 12 steps across all blocks. **The recipe is saved in the browser** (`localStorage` key `dna-color-wheel-recipe`) and restored on the next visit, page or pop-up; the saved-palette feature stays retired (hidden). **Math:** hues and white blend as measured pigment recipes, so later colors mix into earlier white; black stays on the hand-tuned `shade()` model at each stage's black share (the measured black was rejected) — the one approximation. **Checked:** every hue alone = its swatch; white alone = #ffffff; hue-only mixes equal the old chain math exactly; white or black as the last step equals the old White/Black sliders exactly. Details in `Color-Wheel-App-Reference.md`.


-----

## Completed This Session (October 31 2026, morning) — Color wheel becomes a quick tool opened from the menu (deployed Oct 31 2026)

**David's call:** the wheel is a quick mixing check ("what does this green plus yellow make"), not a palette builder or a lesson. **The tool:** 12-hue wheel and the mixer only — color ratio slider, White, Black, Clear. Hidden (code left in place): the 3/6/12/24 switch, the palette and Save to Palette, the relationships panel, the tool's own "color wheel / reference" header and the study links. The PaintMixing credit line stays (CC BY 4.0 requires it).

**How it's reached:** a **"color wheel" bubble (icon + words) at the very bottom of the site menu on every page** opens the wheel pop-up; the menu closes first. The pop-up code moved from `study/guide.js` to **`site-chrome.js`** (styles in `site-chrome.css`): it loads `/study/color-wheel.html?embed=1` in a frame that drops down under the site bar — a card at the right on desktop, full width on phones with a grab handle (swipe up to close); Back, Escape, the scrim or ✕ shut it; the page behind is scroll-locked while open (`html.wheel-open`) so iPhone Safari's toolbar, and with it the frame's height, can't change. **Removed:** the "color wheel" menu line, the course top-bar wheel button (generator), the earlier course-page pop-up.

**iPad and desktop (later, David):** above 700 px the pop-up is a floating card that can be **moved** (drag the strip at its top) and **resized** (drag the bottom-right corner), min 320×380; position and size are remembered in the browser (`dna-wheel-pos`). The wheel grows with the card. Phones (700 px and under) keep the fixed card. Escape inside the wheel now closes the pop-up too (postMessage to the page). Known risk: on iPad the frame changes size while resizing, and Safari can swallow the first tap after a resize. `site-chrome` css and js v10. **Findable again (David, later):** the wheel page is back in search — `noindex` removed, back in `sitemap.xml` and `study.html`'s JSON-LD/description; new title "Paint Mixing Color Wheel — Mix Colors Like Paint | David Nicholson", description, Open Graph/Twitter tags, `WebApplication` JSON-LD (free, feature list), and a short lower-case intro under the heading on the page (hidden in the pop-up). The menu's color wheel item (the pill outline dropped later the same day: now a plain menu row under its own divider, wheel icon at the right end like the study chevron; the icon is `color-wheel-mark-96.png`, the wheel cut out of the app icon without its white square) is now a real link to the page (crawlable; Ctrl/Cmd-click opens the page) whose plain click opens the pop-up. `site-chrome` css and js v14. **`study/color-wheel.html` stays as a file** — the pop-up's frame loads it, and it is still the home-screen app `start_url` — but nothing on the site links to it except three Color Theory text links. It now shows the same quick tool (later the same day it was made findable again — see above). No bubble on that page itself.

**Phones, follow-up (David):** the site menu and the wheel pop-up are now floating cards with visible edges — 10 px in from each side, 6 px under the site bar, rounded corners and a shadow — instead of full-width sheets (the menu had been full width on phones since Oct 2). **iPad and desktop menu (later, David):** the same rounded floating card (6 px under the bar, 14 px corners, shadow) — it had stayed a square dropdown above 600 px, which wasn't said when the phone card went out. The phone menu card is 250 px wide with tighter rows (42 px; study course list 34 px). **"study" in the menu now opens and closes the course list (chevron) on every page instead of linking to `study.html`;** the list starts collapsed except inside a course, where it starts open with the current course marked. The list's "technique" / "art history" headings link to `study.html`. **Later (David):** art history listed first, then technique; each group folds — its heading still links to the study page, a chevron beside it opens the courses — and inside a course only that course's group starts open (`site-chrome` v16). **Then (David):** "study" is a plain link to `study.html` again, with its two groups always showing beneath it (each still folded until its chevron is tapped, except the current course's group) — no study toggle (`site-chrome` v18). `site-chrome` css and js v9 on every page (generator `V.chrome` 9). **Caches:** `site-chrome` css and js v6 on every page (generator `V.chrome` 6); `guideCss` 13, `guideJs` 10; all 12 courses rebuilt.

**Tested (headless Chromium, 1440 / 390 px):** bubble → pop-up on index, gallery, a Color Theory page and study.html; palette, relationships and size switch hidden; "+ Mix" on one tap; Back closes the pop-up and stays on the page; menu closed; no script errors. **Still needs the real-iPhone tap check** (to-do below).


-----

## Completed This Session (October 31 2026, later) — Site menu regrouped, color wheel item, wheel button and pop-up on course pages (deployed Oct 31 2026)

**Site menu (David, choice "B").** Three groups: home, prints, available originals — **color wheel**, study — shipping & returns, guest book, contact. "color wheel" is its own line (no icon) above "study"; it is no longer listed again in the study course list. `isCurrent` in `site-chrome.js`: a section match (study) gives way when another menu item is an exact match for the page, so on the wheel page only "color wheel" is marked. `site-chrome` cache v4 → v5 (all pages).

**Menu icon (later the same day, David's "B"):** short bar stubs with large blocks — red 12×7, yellow 9×5, blue 12×7 (24-unit icon); `site-bar.js` v3. Earlier: **menu icon blocks** a little larger and stronger: red `#D62A1E` 5×5, yellow `#F2B705` 5×5, blue `#1F57D6` 3×5 (24-unit icon); bar positions unchanged.

**Course pages: color wheel button** (icon only, `title`/`aria-label` "Color wheel") between search and Saved in every course's top bar, phone and desktop. Phone top bar no longer wraps (search `flex:1 1 0`).

**Color wheel pop-up.** The course button opens `/study/color-wheel.html?embed=1` in a panel: desktop slides in from the right over the notes (below the site bar), phones and portrait iPads full screen. Back, Escape, Close or the scrim shuts it; "Open full page" and Ctrl/Cmd-click go to the real page. The frame is made on first open and never changes size (it slides in and out) — resizing an iframe on iOS eats the next tap inside it (see `Color-Wheel-App-Reference.md`). **`color-wheel.html` embed mode:** `?embed=1` adds `.embed` to `<html>`, hiding nav, menu, title and footer; links open in the course window (`target=_top`). The site menu's "color wheel" still opens the full page; the page stays the home-screen app `start_url`. Generator `V`: chrome 5, guideCss 9, guideJs 7 (all 12 courses rebuilt).

**Tested (headless Chromium, 1440 / 390 px):** menu order and current marking; wheel button centered; pop-up opens, inner nav hidden, "+ Mix" works on one tap, Back/Escape close it and stay on the page; no script errors. **Needs a real iPhone check** (headless can't reproduce iOS Safari's iframe tap quirk).

**Follow-ups the same morning:** on phones the pop-up is a bottom sheet at 85% height (rounded top, grab handle, swipe down or tap the dimmed lesson to close, ✕ only); in embed mode the wheel also hides its own "color wheel / reference" header. **`study.html` no longer has the color wheel button** beside the heading (David: the wheel is its own thing now, reached from the menu and course pages); `.wheel-btn` rules in `study.css` are unused.

**Open idea (not built):** wheel page relationship labels linking to their Color Theory pages, and a "learn the ideas" row of course cards under the tool (mocked up Oct 31, awaiting David).


-----

## Completed This Session (October 31 2026) — Search across all study courses, menu icon, bigger wheel button, viewer layout (deployed Oct 31 2026)

**Search across all study courses (David).** One search covers every study course (study section only — never the shop, gallery or main pages). New `tools/study/build-search.js` reads every course in `tools/study/courses/` and writes `study/search-index.js` (`window.STUDY_SEARCH`: courses + items; credits and sources pages left out). `build-course.js` runs it after every course build, so it is always current. New shared `study/search.js` (`StudySearch.attach`) loads the full index the first time a search box is focused (`?d=` day stamp; ~586 KB raw, ~200 KB gzipped — not loaded on page view). On a course page the course's own `index.js` answers at once while the full index loads; the current course's results come first; every result is labeled with its course ("Impressionism · part · kind"). `guide.js` search code replaced by a call to `StudySearch.attach`. **Back-button fix (later):** going to a result and pressing Back brought the page back with the results still open over it (the browser restores the page as it was left); `search.js` now closes the results on `pagehide` and `pageshow` — the search text stays and tapping the box reopens them (search.js v2). **Split results (later, David):** on a course page the results list this course's pages under their own count ("3 pages in this course"), then a divider ("24 pages in 3 other courses") and the rest — one scrolling list, 40 pages max, this course first; no matches here → it starts at the divider. The study page keeps one list. Search box placeholder is just "Search" (search.js v3, guideCss 14). Placeholder on every course page: "Search all courses…". **`study.html`** has a new search box under the heading (`.study-search` in `study.css`).

**Menu icon (David, site-wide).** The three-line menu icon is now "I1": three dark bars of uneven length (site ink, accent on hover) ending in small red `#C8382F`, yellow `#E3B220` and blue `#2F5FC8` blocks, loosely Mondrian-inspired. Icon only, still no "menu" word. Changed in `site-bar.js` and the 11 pages with an inline top bar (index, gallery, originals, shipping, varied-readings, the five show pages, `study/color-wheel.html`). Rejected the same session: plain tricolor bars (read as a flag) and a literal Mondrian grid (too much like Mondrian).

**Color wheel button on `study.html`.** Phones keep the 40 px wheel; 601 px and up 72 px, 1024 px and up 88 px, with the label stacked under the wheel across both lead rows so the heading spacing is unchanged. `study.css` v10 → v11.

**Course viewer (desktop).** The notes column width is set by the window (`clamp(320px, 32vw, 470px)`), not by the outline, so hiding the outline gives all the freed space to the image; collapsed `.app` max width 1600 px. Images never enlarge past their own pixel size or the slide height (unchanged `width/height:auto`). Phones unchanged.

**Caches:** generator `V` — bar 1 → 2, guideCss 6 → 7, guideJs 5 → 6, new search 1; `study.html` `site-bar.js?v=2`. All 12 courses rebuilt (only cache strings, the search placeholder and the new `search.js` tag changed; sitemap and course indexes unchanged).

**Tested (headless Chromium, 1440 / 820 / 390 px):** study.html and course search return labeled results from several courses and no non-study URLs; outline hidden → notes stayed 461 px, image 521 → 905 px wide (A Burial at Ornans); menu opens on index, gallery and study.html; no script errors, no horizontal scroll.

**Still to do:** upload the site sheet (David held it until these changes settled).


-----

## Completed This Session (October 30 2026, late night) — study.html: art history first, color wheel button, technique order (deployed Oct 30 2026)

**study.html (David).** Opens on the **art history** tab; **technique** is the second tab and opens with `#technique` (old `#art-history` links still open art history; a `hashchange` listener switches tabs when a menu link points at the page you're already on). Art history panel now comes first in the HTML too. The **color wheel** card is gone: the wheel is a button (`.wheel-btn`, 76 px icon, 56 px on phones) at the top right, level with the "study" heading, labeled "color wheel" (`.lead-row` flex). Blurb under the heading: "art history and technique". **Later the same night:** the lead is a 2×2 grid (`.lead.lead-row`, the `.wheel-btn` link spans both rows with `grid-template-rows: subgrid`) so the wheel (52 px, 40 px on phones) is centered on the heading's row and its "color wheel" label on the blurb's row — fixes the uneven look on iPhone (`study.css` v10). **Color wheel page** (`study/color-wheel.html`) now opens on the **12**-color wheel (was 6). Technique order (cards, JSON-LD `hasPart`, `STUDY` in `site-chrome.js`, so also the menu and next-course chain): Color Theory → Value and Light → Composition → Pigments and Materials → Oil vs Acrylic (Oil vs Acrylic is the last, Next disabled on its credits page). `study.css` v8 → v9.

**Links that follow the new default tab:** `site-chrome.js` `STUDY` group links — technique → `/study.html#technique`, art history → `/study.html`; generator breadcrumb (`build-course.js` `crumbHtml` lane) — Technique → `/study.html#technique`, Art history → `/study.html`. `site-chrome` cache v3 → v4 (all 12 courses rebuilt — only cache strings and crumb links changed; 11 main pages, `study.html`, `study/color-wheel.html` edited to `?v=4`).

**Tested (headless Chromium, 1440 / 390 px):** default tab, tab click sets `#technique`, `#technique` / `#art-history` load, hash change on the same page, wheel button → color wheel page, crumbs and menu group links, technique card order, next-course chain — no script errors, no horizontal scroll.


-----

## Completed This Session (October 30 2026, late night) — Realism; next-course link at the end of every course (deployed Oct 30 2026)

**Realism** added at `/study/art-history/realism.html`, built by the art-history course builder (iCloud `School v2/Art History Course Builder/Realism/Public Study Site/`, see `HANDOFF to Art Business Project.md` there, including its "Update (Oct 30, after install)" section). 49 works in 2 sections (Realism in France: Barbizon and the Open Air, Courbet, Peasants and Labor, The City and the Street; Realism Abroad: Britain and Europe, America), 6 parts; 59 pages (49 works, 6 parts, 4 other). Data: `data.js`, `credits.js`, `sources.js`, `img/` (49 images). Settings: `tools/study/courses/realism.json` (`introImg: courbet-burial-at-ornans`). `study.html`: art-history timeline entry "1830s–1890s" between Romanticism and Impressionism + JSON-LD entry. `site-chrome.js` `STUDY`: "realism" after romanticism. Images: Daumier *Laundress*, Leibl, Manet *Street Singer*, Tanner cut to 1600 px long edge.
- **Changed from the handoff (David):** "fifty works" → "forty-nine works" in `realism.json` (intro, homeDescription) and the study.html card — the course has 49 works. The iCloud `realism.json` still says fifty; don't reinstall it without fixing.
- **Update after install:** new `data.js`, `credits.js`, `img/tanner-banjo-lesson.jpg` — dimensions for Tanner (124.5 × 90.2 cm), Repin (160.5 × 167.5 cm), Courbet *Young Ladies on the Banks of the Seine* (174 × 206 cm); new Tanner image and credit link.
- **Known limits (from the handoff):** Repin *They Did Not Expect Him* — facts other than dimensions from secondary sources; Tanner *Banjo Lesson* colour not checked against the original; Courbet *Bonjour Monsieur Courbet* rests on the Musée Fabre education sheet; *The Stonebreakers* has no Dresden record (Winterthur version confirmed by the Oskar Reinhart collection); Eakins *Gross Clinic* image may predate the 2010 restoration; Frith *Railway Station* 800 px wide, Brown *Last of England* 932 px.

**Next course at the end of every course (David).** A course runs last slide → sources → image credits; on the credits page Next (button, arrow key, swipe) now reads "Next course →" and opens the next course's start page, in `STUDY` order within the same group (technique: study.html card order; art history: date order). The last course in each group keeps Next disabled (no crossing between groups). Done in `site-chrome.js` (it already holds `STUDY`, and loads after `guide.js`), so adding a course to `STUDY` links it in with no extra rebuild. `site-chrome` cache v2 → v3 (`V.chrome` in `build-course.js`; every course rebuilt; the 11 main pages, `study.html` and `study/color-wheel.html` edited to `?v=3`).

**Rebuild list:** after any `guide.css`/`guide.js`/generator change, rebuild all twelve courses: classical-myth, impressionism, color-theory, post-impressionism, fauvism-and-expressionism, romanticism, realism, japanese-woodblock-prints, pigments-and-materials, oil-vs-acrylic, composition, value-and-light.

**Tested (headless Chromium, 1440 / 390 px, GA blocked):** all 59 Realism pages — no script errors, every image loads, no horizontal scroll; start page and each part screenshotted; every course's credits page points at the right next course; arrow key and phone tap reach it.


-----

## Completed This Session (October 30 2026, night) — Value and Light course; Japanese Woodblock Prints menu fix (deployed Oct 30 2026)

**Value and Light** added at `/study/value-and-light.html`, built by the art technique course builder (iCloud `School v2/Art Technique Course Builder/Value and Light/Public Study Site/`, see `HANDOFF to Art Business Project.md` there). Technique course under `/study/`, concept pages labeled "Concept". 7 parts in 3 sections (Foundations: A Short History, Value; Seeing Light: Light on Form, Light Sources; Light in Painting: Edges, Styles of Light, Working in Value); 51 pages (17 works, 7 parts, 27 other). Concept images mostly plates from Mary Merrifield's *Handbook of Light and Shade* (1880) and Anson Cross's *Light and Shade* (1897), Internet Archive scans; artworks public domain. Data: `study/value-and-light/data.js`, `credits.js`, `sources.js`, `img/` (41 images). Settings: `tools/study/courses/value-and-light.json` (`introImg: merrifield-pl09`). No generator change; other courses' HTML unchanged. `study.html`: technique-tab card after Composition ("course · 7 parts") + JSON-LD entry. `site-chrome.js` `STUDY`: "value and light" after composition. Sitemap: +51 URLs.

**Images (standing shrink rule):** `leonardo-virgin-of-the-rocks` and `cross-figs-08-10-11` resized to 1600 px long edge; three over 300 KB re-saved at q82 (Sargent stays ~440 KB, Hammershøi ~305 KB — re-encoding didn't shrink them). All now ≤1600 px. iCloud copy unchanged.

**Menu fix:** Japanese Woodblock Prints was missing from the `STUDY` list in `site-chrome.js` (added after Classical Myth, date order). `site-chrome` cache left at v2 (bumping touches every page); browsers holding the old file pick up the new lines when their cache expires.

**Rebuild list:** after any `guide.css`/`guide.js`/generator change, rebuild all eleven courses: classical-myth, impressionism, color-theory, post-impressionism, fauvism-and-expressionism, romanticism, japanese-woodblock-prints, pigments-and-materials, oil-vs-acrylic, composition, value-and-light.

**Tested (headless Chromium, 1440 / 390 px, GA blocked):** all 51 pages plus `study.html` — no console errors, every image loads, no horizontal scroll; screenshots of the first page of each of the 7 parts and the new card; study menu on a Japanese Woodblock Prints page lists every course with the current one marked.


-----

## Completed This Session (October 30 2026, later) — Study navigation between courses (deployed Oct 30 2026)

**Problem (David):** inside a course you got stranded: the only way out was menu → study, which always opened the technique tab; no course linked to another.

**Menu course list.** On any page under `/study/`, the site menu lists every course under "study", grouped **technique** (study.html card order) and **art history** (date order, same as the timeline); the current course is marked. The group labels link to `study.html` and `study.html#art-history`. Main-site pages and `study.html` keep the plain menu. List lives in `STUDY` in `site-chrome.js` — **adding a course means adding one line there** (as well as its card on `study.html`). Menu panel now scrolls when taller than the screen (`max-height` + `overscroll-behavior: contain`); on phones guest book and contact sit below the fold on study pages. `site-chrome` cache v2 (`V.chrome` in `build-course.js`; the 11 main pages and `study.html`/`color-wheel.html` edited to `?v=2`).

**Desktop breadcrumb.** The bottom-bar crumb now reads Study › Technique|Art history › Course › Part (generator `crumbHtml`; sources/credits pages end in their own label; course start page ends at the course). 901–1199 px shows only Study › lane (course and part in `.tail`, hidden) so the links are never cut off; ≥1200 px a long part name can end in "…". Phones unchanged (crumb hidden). `guide.css` v6. JSON-LD breadcrumbs unchanged.

**Considered, not built:** next-course hand-off on a course's last page, course switcher in the outline rail, cross-lane "Related" links (needs tags from the course builders).

**Rebuild list:** after any `guide.css`/`guide.js`/generator change, rebuild all nine courses: classical-myth, impressionism, color-theory, post-impressionism, fauvism-and-expressionism, romanticism, pigments-and-materials, oil-vs-acrylic, composition.

**Tested (headless Chromium, 390 / 960 / 1210 / 1440 px):** menu on Romanticism, Color Theory and gallery; crumb on Romanticism, Fauvism, Pigments and Materials and the longest Romanticism part — no console errors, no horizontal scroll; rebuilt HTML differs from main only in crumb lines and cache strings.

---
## Completed This Session (October 30 2026, evening) — Japanese Woodblock Prints; repetition cleanup for three courses; study tab gap fix (deployed Oct 30 2026)

**Japanese Woodblock Prints** added at `/study/art-history/japanese-woodblock-prints.html`, built by the art-history course builder (iCloud `School v2/Art History Course Builder/Japanese Woodblock Prints/Public Study Site/`, see `HANDOFF to Art Business Project.md` there). 64 works in 3 sections (The Floating World Takes Shape; Beauties and Actors; Landscape and Legend), 7 parts; 74 pages (64 works, 7 parts, 3 other). Short pages by David's request (one-sentence lead, three bullets). Data: `data.js`, `data-m1.js`…`data-m7.js`, `credits.js`, `sources.js`, `img/` (64 images, already ≤1600 px — no resize needed). Settings: `tools/study/courses/japanese-woodblock-prints.json` (`introImg: hokusai-red-fuji`). `study.html`: art-history timeline entry "c. 1680–1927" between Classical Myth and Romanticism (timeline ordered by start date) + JSON-LD entry. Sitemap: 648 URLs.
- **Known limits (from the handoff):** Harunobu *Osen of the Kagiya* is 394 px wide (reads fine on phone); Monkey Bridge image cropped to the print; Kuniyoshi *Takiyasha the Witch* left out (Nelson-Atkins keeps image rights); Whistler *Caprice in Purple and Gold: The Golden Screen* (Freer CC0) replaces the planned *Nocturne*; shin-hanga limited to Yoshida Hiroshi's 1927 print (Hasui, Shinsui restricted); the Great Wave and Hiroshige's Plum Garden also appear in technique courses for different points; three works give height × width reversed from the museum record to match the image (Basket of Peonies, Driving Rain at Shōno, Kunisada's Artisans); some points credited to curator lectures (Sarah Thompson, MFA Boston; Capucine Korenberg, British Museum). Template note: part overviews have no terms field, so Edo, ukiyo-e, kabuki and Meiji appear in overviews before their definitions.

**Repetition cleanup** (iCloud `School v2/Art History Course Builder/HANDOFF - Repetition cleanup.md`; per-course `REPETITION-CHANGES.md`). Impressionism, Post-Impressionism and Classical Myth predate David's no-repetition rule; their data files were replaced (repetition removed; five part subtitles rewritten, David approved). Only data files changed — no images, credits, sources or settings. Rebuilt 73, 84, 70 pages; 152 pages changed in content, all tested at 1440/390 px. Three fact corrections (the handoff says "four" but lists and logs three): 1874 exhibitor range "between nine (1882) and thirty-one (1874)"; Havemeyer **gave** *The Railway* to the NGA in 1956; Vuillard "about 21" in *Self-Portrait with Waroquy*. **Reported, not fixed (open):** Toulouse-Lautrec *At the Moulin Rouge* — "may have been shown first at Les XX, January 1892" sits awkwardly with a start date of 1892 (check the Art Institute record); Impressionism image keys `sisley-villeneuve` (actually Pissarro's *Orchard in Bloom, Louveciennes*) and `bracquemond-umbrellas` (actually *Le Goûter*) — internal names only.

**study.html gap fix:** the no-JS spacing rule (`.stab-panel + .stab-panel`) also applied when JS showed only the art history tab, adding 40 px above its first entry. Now `.stab-panel:not([hidden]) + .stab-panel:not([hidden])`; both tabs 34 px; no-JS still 40 px. `study.css` `?v=7` → `?v=8`.

**Rebuild list:** after any `guide.css`/`guide.js`/generator change, rebuild all ten courses: classical-myth, impressionism, color-theory, post-impressionism, fauvism-and-expressionism, romanticism, japanese-woodblock-prints, pigments-and-materials, oil-vs-acrylic, composition.


-----

## Completed This Session (October 30 2026, afternoon) — Composition course (deployed Oct 30 2026)

**Composition** added at `/study/composition.html`, built by the art technique course builder (iCloud `School v2/Art Technique Course Builder/Composition/Public Study Site/`, see `HANDOFF to Art Business Project.md` there). Technique course under `/study/`, concept pages labeled "Concept". 6 parts (A Short History; The Frame; Shape and Value; Balance and Structure; Movement and Depth; Unity); 49 pages (20 works, 6 parts, 23 other). Follows the plates-first rule: 25 plates from Arthur Wesley Dow's *Composition* (1914) and Henry R. Poore's *Pictorial Composition* (c. 1915), from Project Gutenberg scans; one original diagram (Depth by Design); 20 public-domain artworks. Data: `study/composition/data.js`, `credits.js`, `sources.js`, `img/` (46 images). Settings: `tools/study/courses/composition.json` (`introImg: poore-fundamental-forms`). `study.html`: technique-tab card after Oil vs Acrylic ("course · 6 parts") + JSON-LD entry. Sitemap: 574 URLs.

**Changed from the handoff (David, Oct 30 2026):** 21 images over 1600 px resized to max 1600 px, JPEG q85 (folder 23 MB → 11 MB); rebuilt. David made this a standing rule for every install (see the to-do list). The iCloud copy still has the full-size images.

**Rebuild list:** after any `guide.css`/`guide.js`/generator change, rebuild all nine courses: classical-myth, impressionism, color-theory, post-impressionism, fauvism-and-expressionism, romanticism, pigments-and-materials, oil-vs-acrylic, composition.

**Tested (headless Chromium, 1440 / 390 px):** start page plus one page from each of the 6 parts, and `study.html` — every image loads, no horizontal scroll, phone Prev/Next row outside `.app`; the 393 px Dow No. 44 plate (Positive and Negative Space) reads clearly at both sizes.

**Known limits (from the handoff):** several Dow and Poore plates are 400–650 px wide, Dow No. 44 is 393 px (David: use them anyway); golden ratio and rule of thirds presented with their evidence (Palmer's Berkeley result is a conference poster); visual readings in our own words for the Colonna Altarpiece symmetry, Cassatt balance, *Sudden Shower* rhythm and the Circus Sideshow look-for line; Simon Kelly (2014) lecture claims rest on auto-captions and are hedged; Brooklyn Museum credit line for Hiroshige *Plum Estate* is in credits.js; mandala medium glossed as "distemper (glue-based paint)" (standard usage, not the museum record).

**Not yet shrunk (older courses, images over 1600 px):** Post-Impressionism 10, Color Theory 4, Pigments and Materials 2, Oil vs Acrylic 1.


-----

## Completed This Session (October 30 2026, afternoon) — Plate retrofit for the three technique courses (deployed Oct 30 2026)

**David's standing rule (Oct 30 2026):** technique courses use old public-domain plates instead of newly generated diagrams wherever possible. This retrofit swapped 19 diagrams for plates (iCloud `School v2/Art Technique Course Builder/HANDOFF - Plate retrofit.md`; each course folder has `RETROFIT-CHANGES.md` with before/after text and `IMG-CHANGES.json`).
- **Color Theory (15):** Bezold, *The Theory of Color* (1876); Munsell, *Atlas* (1915); Field, *Chromatography* (1835); Ostwald, *Farbenfibel* (1921); Goethe's color circle (1809, Freies Deutsches Hochstift scan); Goethe & Schiller, *Temperamentenrose* (1798–99, Klassik Stiftung Weimar).
- **Pigments and Materials (3):** Rand's 1841 paint-tube patent; Collaert after Stradanus, *Color Olivi* (c. 1600, Met CC0); *Encyclopédie*, Peinture Pl. IV (1771).
- **Oil vs Acrylic (1):** Rand's 1841 paint-tube patent.

Replaced `data.js`, `credits.js`, `sources.js` and `tools/study/courses/<course>.json` for each course (intro, homeDescription, imagesNote, creditsIntro now mention historic plates; Oil vs Acrylic keeps `imagesNote: ""`). 19 images added, 18 removed (the replaced `ct-*`, `pm-canvas`, `pm-h-chemists`, `pm-oil`, `oa-h-oil` diagrams; none referenced elsewhere). Rebuilt: 66, 50, 38 pages; 30 pages changed in content (19 swapped slides, Color Theory's "Value and Temperature" overview, each course's start/credits/sources); the rest changed only the `index.js?v=` hash. `study.html`: the three technique card texts updated to the new homeDescription.

**Tested (headless Chromium, 1440 / 390 px):** all 30 changed pages plus `study.html` — no console errors or failed requests, every image loads, no horizontal scroll; all 19 swapped slides checked visually.

**Known limits (from the handoff):** Goethe 1809 circle from museum-digital:hessen (rights field Public Domain; portal shows a generic CC BY-NC-SA notice that appears to cover its text); *Temperamentenrose* is a scan from a 2006 exhibition catalogue via Wikimedia Commons (catalogue page number retouched out); scan blemishes retouched on four plates, no drawing content altered; two long Color Theory slides — Mixing Light vs. Mixing Paint (124 words) and Complementary (96). Bezold's solar spectrum on Light and the Spectrum is a thin strip and displays small.


-----

## Completed This Session (October 30 2026, afternoon) — Oil vs Acrylic course (deployed Oct 30 2026)

**Oil vs Acrylic** added at `/study/oil-vs-acrylic.html`, built by the art technique course builder (iCloud `School v2/Art Technique Course Builder/Oil vs Acrylic/Public Study Site/`, see `HANDOFF to Art Business Project.md` there). Technique course under `/study/`, concept pages labeled "Concept". 6 parts in 3 sections (Two Paints; Working with Each; Over Time); 38 pages (9 works, 6 parts, 23 other). Data: `study/oil-vs-acrylic/data.js`, `credits.js`, `sources.js`, `img/` (29 images: 20 original diagrams, 7 public-domain artworks, 2 of David's acrylics — *Early, Still* 2025 and *Umbrella, Reverie* 2024, credited "© David Nicholson"). Settings: `tools/study/courses/oil-vs-acrylic.json` (`introImg: oa-binders`). `study.html`: technique-tab card after Pigments and Materials ("course · 6 parts") + JSON-LD entry. Sitemap: 525 URLs.

**Changed from the handoff (David, Oct 30 2026):** the 7 public-domain artwork images were resized to max 1600 px, JPEG q85 (folder 9.4 MB → 4.6 MB; Ryder 1.7 MB → 0.64 MB). The course-wide images note ("Diagrams and the acrylic examples are David Nicholson's own work…") was removed — David: not needed, the credit on his images is enough. The iCloud copy still has the large images and the old note; the repo is now the source of truth for this course.

**Generator change:** `build-course.js` — `imagesNote: ""` now omits the start page's image-rights line (missing key still gives the public-domain default, which would be wrong for a course with copyrighted images). All eight courses rebuilt; the other seven unchanged.

**Rebuild list:** after any `guide.css`/`guide.js`/generator change, rebuild all eight courses: classical-myth, impressionism, color-theory, post-impressionism, fauvism-and-expressionism, romanticism, pigments-and-materials, oil-vs-acrylic.

**Tested (headless Chromium, 1440 / 390 px):** start page plus one page from each of the 6 parts, `study.html`, and *Early, Still* (image + "© David Nicholson" credit) — every image loads, no horizontal scroll, phone Prev/Next row outside `.app`; Open Time shows "minutes to a few hours".

**Known limits (from the handoff):** "colors dry slightly darker" (one paint maker) and the isolation coat (paint makers' recommendation) are labeled as brand claims; gels and modeling paste described only in general terms; fat over lean rests on Univ. of Delaware MITRA guides (National Gallery explains the wrinkling but not the term); acrylic drying "minutes to a few hours" because sources range; no lecture compares the two paints, acrylic facts from Getty, Tate and Smithsonian; Hockney, Lichtenstein, Louis, Frankenthaler and Olitski named only (copyrighted). Optional, not done: link from Pigments and Materials' "Oil" page to this course (and the earlier Color Theory → Pigments link).


-----

## Completed This Session (October 30 2026, later) — Pigments and Materials course; study.html tabs (deployed Oct 30 2026)

**Pigments and Materials** added at `/study/pigments-and-materials.html`, built by the art technique course builder (iCloud `School v2/Art Technique Course Builder/Pigments and Materials/Public Study Site/`, see `HANDOFF to Art Business Project.md` there). A technique course like Color Theory: lives under `/study/`, concept pages labeled "Concept". 5 parts (A Short History of Paint; Pigments by Color; Binders and Media; Supports and Grounds; How Paintings Change); 50 pages (19 works, 5 parts, 26 other). Data: `study/pigments-and-materials/data.js`, `credits.js`, `sources.js`, `img/` (42 images: 23 original diagrams, 19 artworks). Settings: `tools/study/courses/pigments-and-materials.json` (`basePath: /study`, `themeLabel: Concept`, `introImg: pm-binder`). No generator change; the other courses' HTML unchanged. Sitemap: 487 URLs. Not done: the handoff's optional step 5 (link from Color Theory's "Paint and Pigment" part to this course).

**study.html — two tabs (David, Oct 30 2026).** `technique` tab: color wheel ("tool"), Color Theory and Pigments and Materials ("course · N parts") in one left-aligned column of large cards (`.tl.tl-plain`, no rail); images shown whole on white (`object-fit: contain`), so the wheel icon has no grey panel and diagram labels aren't cropped. `art history` tab: the timeline, unchanged. Tabs are buttons (`.stabs`, ARIA tablist); a small inline script switches panels; `#art-history` opens the second tab; without JS both panels show. Lead line: "painting technique and art history study guides." `study/study.css` `?v=6` → `?v=7`. JSON-LD `hasPart` lists Pigments and Materials after Color Theory. To add a course: copy a `tl-item` into the right panel (technique: label "course · N parts"; art history: date label, in date order).

**Rebuild list:** after any `guide.css`/`guide.js`/generator change, rebuild all seven courses: classical-myth, impressionism, color-theory, post-impressionism, fauvism-and-expressionism, romanticism, pigments-and-materials.

**Tested (headless Chromium, 1440 / 390 px):** start page plus one page from each of the 5 parts, and `study.html` (both tabs, `#art-history` deep link, JS off) — every image loads, no horizontal scroll, phone Prev/Next row outside `.app`; inline script passes `node --check`; only console error is the deliberately blocked GA script.

**Known limits (from the handoff):** diagram pigment colors are screen approximations (each diagram says so); *Magdalen Reading* (van der Weyden) large file is from an aggregator, color unconfirmed against the National Gallery; Giotto *Madonna and Child* filed under Egg Tempera though the museum says only "tempera" (page never claims egg); Arlanza lion not confirmed true fresco (page stays general); a few news/student-blog sources listed because the notes cite them; Rembrandt, Titian, Van Gogh and van der Weyden each appear twice on different topics.


-----

## Completed This Session (October 30 2026) — Romanticism study section; study.html art-history timeline (deployed Oct 30 2026)

**Romanticism** added at `/study/art-history/romanticism.html`, built by the art-history course builder (iCloud `School v2/Art History Course Builder/Romanticism/Public Study Site/`, see `HANDOFF to Art Business Project.md` there). 64 works in 3 sections (Revolution and Nightmare; France; Landscape and the Sublime), 7 parts; 74 pages (64 works, 7 parts, 3 other). Data: `study/art-history/romanticism/data.js`, `data-m1.js`…`data-m7.js`, `credits.js`, `sources.js`, `img/` (64 JPEGs). Settings: `tools/study/courses/romanticism.json` (`introImg: gericault-raft-medusa`, `subjLabel: ""`). No generator change; rebuilding left the other courses' HTML unchanged. Sitemap: 437 URLs.

**study.html — art history as a vertical timeline (David chose option B of two mockups, Oct 30 2026).** The art-history grid is replaced by `.tl`: one left-aligned column in date order, a rail with a dot and a date label per course, large image cards (16:7 desktop, 4:3 phone). Styles at the end of `study/study.css`; link bumped `?v=5` → `?v=6` (only study.html uses study.css). Color cards unchanged. Dates: Classical Myth c. 575 bce–1903 (earliest/latest work dates in its data), Romanticism 1760s–1860s (course settings), Impressionism 1860s–1890s, Post-Impressionism 1880s–1900s, Fauvism 1905–1918 (the last three are estimates from the course intros and work dates; David may adjust). To add a course: copy a `tl-item` in date order, plus a JSON-LD `hasPart` entry.

**Rebuild list:** after any `guide.css`/`guide.js`/generator change, rebuild all six courses: classical-myth, impressionism, color-theory, post-impressionism, fauvism-and-expressionism, romanticism.

**Tested (headless Chromium, 1440 / 390 px):** start page plus one work page from each of the 7 parts, and `study.html` — every image loads, no horizontal scroll, no "The subject", phone Prev/Next row outside `.app`; the only console error is the deliberately blocked GA script (same on the live Fauvism page).

**Known limits (from the handoff):** #59 Durand *Kindred Spirits* low resolution (872 px, only free file); #18 Géricault *The Charging Chasseur* color not checked against the Louvre's image (swap if a better PD file appears); two photo credits (Rude relief — Jebulon CC0; Palace of Westminster — Terry Ott CC BY 2.0, credit required); provenance stated neutrally for #51 Friedrich *Wanderer* and #55 Dahl; three sources without links (two UK Parliament "Living Heritage" pages, NGA audio stop 701); #63 Church *Heart of the Andes* width 305.3 cm converted from the Met's inches.


-----

## Completed This Session (October 29 2026) — Fauvism and Early Expressionism study section; "The subject" heading removed from every course (deployed Oct 29 2026)

**Fauvism and Early Expressionism** added at `/study/art-history/fauvism-and-expressionism.html`, built by the art-history course builder (iCloud `School v2/Art History Course Builder/Fauvism and Early Expressionism/Public Study Site/`, see `HANDOFF to Art Business Project.md` there). 54 works in 4 sections (Paris; Dresden and Berlin; Munich; Vienna), 6 parts; 63 pages (54 works, 6 parts, 3 other). Data: `study/art-history/fauvism-and-expressionism/data.js`, `data-m1.js`…`data-m6.js`, `credits.js`, `sources.js`, `img/` (54 JPEGs, ~16 MB). Settings: `tools/study/courses/fauvism-and-expressionism.json` (`introImg: matisse-the-green-line`). The Wild Beasts part overview uses *Woman with a Hat* (David, Oct 29; the handoff had *The Green Line*, which already opens the course). `study.html`: fourth art-history card (*The Green Line*) and a JSON-LD `hasPart` entry; meta description rewritten (it still listed the retired color theory flashcards). Sitemap: 363 URLs.

**Generator change — no "The subject" heading (David, Oct 29 2026).** `tools/study/build-course.js`: `subjLabel` now defaults to none (`CFG.subjLabel == null ? '' : CFG.subjLabel`); a course can still set a label. The subject text stays, after the divider. Classical Myth, Impressionism, Post-Impressionism and Color Theory rebuilt; 194 pages changed and a script confirmed the removed heading is the only difference. `tools/study/SKILL-UPDATE-2026-10-27.md` and `tools/study/HANDOFF-classical-myth-v2.md` updated.

**Rebuild list:** after any `guide.css`/`guide.js`/generator change, rebuild all five courses: classical-myth, impressionism, color-theory, post-impressionism, fauvism-and-expressionism. (The `dna-kiosk-conventions` skill still lists only three — update it.)

**Tested (headless Chromium, 1440 / 390 px):** all 63 Fauvism pages plus one page from every other course and `study.html` — no console errors, no failed requests, every image loads (only the `#lbimg` lightbox placeholder has no src, by design), no page contains "The subject".

**Held — Nolde, *The Last Supper* (#18).** Not published: Nolde (d. 1956) enters EU public domain Jan 1 2027. A scheduled task on Jan 2 2027 checks SMK (KMS6202) / Wikimedia Commons for a free image. To add it, follow the handoff's "Held page" steps (files `data-hold-nolde.js`, `sources-hold-nolde.json` in the iCloud folder, not in the repo), rebuild, check, and get David's approval.

**Known limits (from the handoff):** low-resolution images (800–1182 px) on #1, #6, #9, #25, #26, #34, #54; hedged facts on #11, #12, #15, #31, #47; #54 has no published dimensions; #24 Beckmann *The Night* is an open restitution case, stated neutrally.
## Completed This Session (October 28 2026, evening) — Post-Impressionism study section (deployed Oct 28 2026)

**Post-Impressionism** added at `/study/art-history/post-impressionism.html`, built by the art-history course builder (iCloud `School v2/Art History Course Builder/Post-Impressionism/Public Study Site/`, see `HANDOFF to Art Business Project.md` there). 74 works in 3 sections (Order and Science; Color as Feeling; Dream, Decoration and the Wider World), 7 parts; 84 pages (74 works, 7 parts, 3 other). Data: `study/art-history/post-impressionism/data.js`, `data-m1.js`…`data-m7.js`, `credits.js`, `sources.js`, `img/` (74 JPEGs, ~24 MB). Settings: `tools/study/courses/post-impressionism.json` (`introImg: vangogh-starry-night`, `imagesNote` and `creditsIntro` worded for open licenses). No generator change; other courses' HTML untouched. `study.html`: third art-history card (*The Starry Night*, "from seurat and cézanne to van gogh, gauguin, the nabis and the symbolists in 74 works, across 7 parts") and a JSON-LD `hasPart` entry. Sitemap: 300 URLs.

**Rebuild list:** after any `guide.css`/`guide.js`/generator change, rebuild all four courses: classical-myth, impressionism, color-theory, post-impressionism. (The `dna-kiosk-conventions` skill still lists only three — update it.)

**Tested (headless Chromium, 1440 / 390 px, GA blocked):** all 84 pages plus `study.html` — inline scripts pass `node --check`, no missing local links or images, no console errors, no broken images (`#lbimg` lightbox placeholder has no src by design); document/body don't scroll on phones. Credits page shows the two open-license attributions exactly as in `credits.js`: Klimt *Pallas Athene* (CC BY 4.0, Wien Museum, "Gustav Klimt; Foto: TimTom") and Khnopff *I Lock My Door upon Myself* (CC BY-SA 4.0, Neue Pinakothek).

**Open:** from the content side, the Signac lecture (Wildenstein Plattner) shows a YouTube posted date of October 1, 2026 — possibly a re-upload date; cited as shown. Delete remote branch `post-impressionism-study` (merged).
## Completed This Session (October 28 2026, later) — phone fixes for every study page (deployed Oct 28 2026; David confirmed on iPhone)

**Prev/Next took several taps after scrolling on iPhone** (one tap before any scroll). The Oct 27 change (scroll inside `<body>` so Safari's toolbar can't shrink) had fixed the toolbar but left the Prev/Next bar `position:fixed` inside the scrolling `<body>`; after a scroll, Safari mis-registers taps on a fixed element inside a scrolled container. **Fix (run 40750171338):** at ≤900 px, `html` and `body` don't scroll at all; `.app` is the scroller; `study/guide.js` moves `.main > .bar` out of `.app` to sit under it as a plain row (`position:relative`, not fixed), and moves it back above 900 px. Toolbar still never shrinks. **Rule: on phones, never put a fixed or tappable bottom bar inside the scrolling element, and never let the document or `<body>` scroll on study pages.**

**Phone page menu** (`#jump`): each part's first page is now listed under the part name instead of "Overview" (run 40751219501). Desktop outline and bottom bar unchanged.

Cache: `guide.css` v5, `guide.js` v5 (`V` in `build-course.js`); all three courses rebuilt (cache strings only). Tested in Chromium with touch at 390 / 820 / 1440 px; David confirmed the tap fix and menu on his iPhone.
## Completed This Session (October 28 2026, afternoon) — Color Theory course (deployed Oct 28 2026)

**Color Theory** course at `/study/color-theory.html`, built by the art-technique course builder (iCloud `School v2/Art Technique Course Builder/Color Theory/Public Study Site/`, see `HANDOFF to Art Business Project.md` there). 8 parts in 3 sections (Foundations, Relationships, Color in painting); 66 pages: concept pages (original diagrams), four history pages, and example pages (public-domain or openly licensed paintings). Data: `study/color-theory/data.js`, `credits.js`, `sources.js`, `img/` (57 images, ~9 MB). Settings: `tools/study/courses/color-theory.json` (`basePath: /study`, `themeLabel: Concept`, `subjLabel: ""`, `imagesNote`, `introImg: ct-complementary`).

**Generator (`generator-changes.patch`, David approved):** optional settings `basePath`, `themeLabel`, `subjLabel`, `imagesNote`; theme slides accept `alt` and `label`; `study/guide.js` shows the theme label in outline and search; `guideJs` cache 3. Classical Myth and Impressionism rebuilt: HTML changed only cache strings; their `index.js` gained `"themeLabel":"Theme"`.

**Color wheel** moved to `study/color-wheel.html` (supplied page: flashcards tab, iframe and `ctShow` removed; links to the course). `color-theory.webmanifest`: `start_url` `/study/color-wheel.html`, description "An interactive color wheel by David Nicholson." Home-screen installs made earlier open the course until re-added. **Flashcards retired:** root and `study/` `color-theory-app.html` redirect to the course. `study.html` color group: wheel card → `/study/color-wheel.html`; course card (thumbnail `ct-complementary.jpg`); JSON-LD `hasPart` updated. Sitemap: 216 URLs.

**Tested (headless Chromium, 1440 / 390 px):** 216 study pages — no broken local links/images, JSON-LD parses, no label/bar repeats; course start, overview, concept, history, example pages and the wheel — no console errors, no 4xx, no horizontal scroll; outline and search show Concept/History; arrow keys; the three redirects land on the course.

**Open:** concept and history page URLs keep the generator's `theme-` prefix (e.g. `/study/color-theory/foundations/theme-newton-splits-white-light.html`) — published that way, so changing it now means new URLs. `study.html` meta description still mentions "color theory flashcards". Branches `mix-percentages` and `spectral-mix-toggle` edit the old wheel file — retarget to `study/color-wheel.html` before merging. Delete remote branch `course/color-theory` (superseded).
## Completed This Session (October 28 2026) — Impressionism study section (deployed Oct 28 2026, run 40690321923)

**Impressionism** added at `/study/art-history/impressionism.html`, built by the art-history course builder (iCloud `School v2/Art History Course Builder/Impressionism/Public Study Site/`, see `HANDOFF to Art Business Project.md` there). 60 works in 3 sections (Beginnings, Modern Life, Late Impressionism), 6 parts, 4 theme pages; 73 pages. Data: `study/art-history/impressionism/data.js`, `data-2.js`, `credits.js`, `sources.js`, `img/` (60 JPEGs, ~16 MB). Settings: `tools/study/courses/impressionism.json` (`introImg: monet-impression`). `study.html`: second art-history card (*Impression, Sunrise*, "from the paris salon and manet to monet’s water lilies in 60 works, across 6 parts") and a JSON-LD `hasPart` entry. Sitemap: 150 URLs.

**Generator change — no repeated titles on a page (David, Oct 28 2026).** In `tools/study/build-course.js`: work, theme and text pages show the **section** in the top label (`Theme · <section>` on themes); the bottom bar shows **only the part**; part overviews show "Overview" in the bar (the h1 is the part). BreadcrumbList JSON-LD unchanged. Classical Myth rebuilt with the same change (67 pages, label/bar lines only). `partLink` in the generator is now unused.

**Tested (headless Chromium, 1440 / 390 px):** all 144 study pages — no broken local links or images, no repeated label/bar text on work, theme and overview pages, inline script parses, no horizontal scroll, no console errors (GA blocked during tests). Live check after deploy: study page, Impressionism start page, a work page and an image return 200 with the new label/bar.

**Open:** Sources and Image credits pages still repeat "Sources" (top label and bar) in both courses — not in the approved change. From the content side: open the archived NGV essay link on the "Tools for Painting Outdoors" theme once; seven images are public domain but not museum-sourced (listed in iCloud `../Handoff - Impressionism.txt`).
## Completed This Session (October 27 2026) — Study: one layout, condensed Classical Myth (deployed Oct 27 2026)

**One layout for every study page.** `tools/study/build-course.js` now writes **one real, indexable page per slide** in the guide's look: outline rail at left (built by `study/guide.js` from the course index; part links stay in the static HTML), search bar and **Saved (n)** button on top, image left / notes right, Prev/Next bar under the slide (pinned to the bottom of the screen at ≤900 px, with Bookmark and the counter). No per-course viewer file any more; `tools/study/classical-myth-viewer.html` and `build-proto.js` are deleted.
- **Shared files, no page-by-page styling:** layout `study/guide.css`, behavior `study/guide.js`, colors/fonts `site-tokens.css`, bar `site-bar.js`, menu `site-chrome.js`. Generated pages carry no `<style>`, no `style=` and no color literals — **the generator throws if one does.** A token change in `site-tokens.css` reaches every page with no rebuild (tested). Bump the `V` cache numbers at the top of `build-course.js` after editing `guide.css`/`guide.js`, then regenerate. `study/study.css` now only serves `study.html`; `study/study.js` is deleted.
- **Per-course index** `study/art-history/<slug>/index.js` (generated; cache-busted by a content hash): outline, search text, thumbnails. Search is accent-insensitive, all words must match, title/artist hits first.
- **URLs:** course home `<slug>.html` = start page; part `<slug>/<section>/<part>.html`; work `<slug>/<section>/<work-title>.html`; theme/text slides `<section>/theme-<title>.html` / `note-<title>.html`; `<slug>/{sources,credits}.html`. The generator deletes any course sub-folder holding only `.html` before writing (keeps `img/`).
- **SEO per page:** unique title and description, canonical, OG/Twitter with the work's image, JSON-LD (`publisher`, never `author`): VisualArtwork + WebPage on works, LearningResource/CollectionPage on parts, BreadcrumbList everywhere; `rel=prev/next`; full text in the HTML with JavaScript off; GA.
- **Bookmarks:** "Saved (n)" on every page and width opens a panel (saved pages as links, remove ✕, "Saved in this browser only."); Bookmark/Bookmarked button with text on phones; "Continue where you left off" on the course home and at the top of the panel when the last page read isn't the current one (localStorage per course: `study:<slug>:saved` / `:last`). Never auto-redirects.
- **Greek key** is opt-in: settings `"greekKey": true` → `body.greek-key`; other courses get a plain rule.
- **Start page always has an image** (David, Oct 27 2026): settings `introImg` (a work key) is required; Classical Myth uses *The Return of Persephone*.
- **Settings file** (`tools/study/courses/<slug>.json`): `name`, `dataFiles`, `introImg` (required); optional `greekKey`, `intro`, `homeDescription`, `ldDescription`, `sourcesDescription`, `creditsIntro`, `creditsDescription`, `imgFrom`. Data files may use the old work format (`fn` + `sum`) or the artwork-first one (`lead`, `bul`, `subj`).
- **Progressive enhancement:** neighbors prefetched; cross-document View Transitions where supported.

**Classical Myth replaced by the condensed edition** at the same URL (David approved content and design Oct 27 2026). 60 works in 7 modules, facts from museum records (sources page lists them per work). Data: `study/art-history/classical-myth/data.js`, `data_m2..m6.js`, `credits.js`, `sources.js`. The 230+ old pages are gone; no redirects (David: live about a day, sitemap not yet resubmitted). Old version archived on branch `archive-classical-myth-full-2026-10-27`. `img/` still holds all 174 old images; only 60 are used (cleanup optional). Sitemap course block: 70 URLs (77 total). `study.html` card: Birth of Venus image, "60 paintings, sculptures, and vases, across 7 modules". Dark mode removed from `site-tokens.css`, study pages and `study.html` (David). **No dark mode anywhere on the site — decided Oct 27 2026; not a to-do.**

**Fix after deploy:** the Greek-key divider had collapsed to 0 px on desktop two-column slides (flex shrink); `guide.css` now sets `.rule{flex:none}`.

**Tested (headless Chromium, 1440 / 820 / 390 px, 77 checks):** search, outline highlight and hide, arrow keys, swipe, Prev/Next, bar pinned at bottom on phones (replaced Oct 28 2026: bar sits under the scrolling `.app`), jump menu, Bookmark → Saved from another page → open → reload → remove, Continue link, lightbox, site menu, every image on all 70 pages, no horizontal scroll, no console errors, no 4xx; all 688 data fields present on their pages; unique titles/descriptions; JSON-LD parses; every sitemap URL exists; a throwaway second course built with nothing Classical-Myth-specific (removed). Not tested: real Jost (blocked in sandbox).


-----

## Completed This Session (October 26 2026) — Study section (deployed Oct 26 2026, run 40387472373)

**Shared site pieces.** `site-tokens.css` holds the site's colors and fonts (light only since Oct 27 2026; dark mode dropped). `site-bar.js` + `site-bar.css` draw the top bar into an empty `<nav data-chrome-nav>` (study pages only for now; bar styles are scoped to that attribute so main pages are unaffected). `site-chrome.js` + `site-chrome.css`: menu and footer links.

**Shared menu and footer.** New `site-chrome.js` + `site-chrome.css`. The 11 public pages with the menu (index, gallery, originals, shipping, color theory, varied-readings, five art-fair pages) now load them instead of carrying their own copies (~750 lines removed). Menu/footer output tested identical to before except the intended change: "color theory" → "study", and the five art-fair footers gain the study link they were missing. shop.html untouched (legacy).

**Study section.** `study.html` landing (site look: Jost, lowercase) with color and art-history card groups. Color theory moved to `/study/` with redirect stubs at the old URLs; manifest `start_url` → `/study/color-theory.html`, `scope: "/"`; favicon paths made absolute; `#flashcards` opens the deck.

**Classical Myth in Art** (David's coursework study site, content final and fact-checked). Static pages generated by `tools/study/build-course.js` (settings in `tools/study/courses/classical-myth.json`) from the course data files (`study/art-history/classical-myth/data*.js`, `credits.js`), 174 images in `.../img/` (30 MB, all public domain / CC0, Wikimedia Commons). Output: the course home **is the one-page guide** (David's original viewer, `tools/study/classical-myth-viewer.html`, restyled to the site and wrapped in the site bar/menu/footer: search, outline rail on desktop / dropdown on phones, Prev/Next bottom right — pinned to the bottom of the screen on phones and portrait iPads — swipe, full-screen images, `#hN-M` slide links). Plus 16 part pages, 170 work pages and a credits page for Google, each with an "Open in the guide" button to its slide. History: the viewer was briefly dropped for separate pages only (deployed Oct 26 2026); David restored it the same day — the guide is the main experience, the separate pages are entry points. Every page: unique title, meta description from the summary, canonical, OG/Twitter tags with the work's image, alt text, schema.org JSON-LD (VisualArtwork / LearningResource + CollectionPage / BreadcrumbList), GA. Styled like the main site (Jost, site colors via `site-tokens.css`, light and dark mode); the one carry-over from the original guide is the Greek-key divider in clay, kept because it fits the subject (David). Study pages keep normal capitalization; the lowercase voice is for site chrome only. Shared styles/script: `study/study.css`, `study/study.js`. The generator also rewrites this course's block in `sitemap.xml` between its comment markers. Re-run it after any data edit: `node tools/study/build-course.js classical-myth` (the old `node tools/study/build-classical-myth.js` still works).

**Sources and paraphrase check (Oct 26 2026).** Every slide's text (1,726 fields) was checked against the course textbook (*Mythology Unbound*, Mellenthin & Shapiro, CC BY-NC-SA 4.0), all supplemental readings, handouts and lecture transcripts for shared 6+ word runs. No close paraphrase: the longest matches are stock phrases ("one of the seven wonders of the ancient world", "son of Zeus and Leto") and one handout's period/date chart (facts). Quotations are all public-domain translations (Evelyn-White 1914, Butler 1898/1900, Dryden 1697). Added a "Sources and further reading" slide before Image credits (data: `study/art-history/classical-myth/sources.js`) and a matching `sources.html` page for Google. Left out on purpose: lectures and the professor (public-mode rule), the two course videos, and Powell's *A Short Introduction to Classical Myth* (named in the syllabus but not among the course files; not used).

**URLs are `.html` files, not folders,** because CloudFront's default root object only applies at `/`; folder URLs would need a CloudFront Function on E2EJH38GWGPEPG (which also serves kiosk/admin). David chose no CloudFront change.

**Tested (headless Chromium, 1440 / 820 / 390 px):** every internal link, anchor and image path resolves (191 pages); no horizontal scroll; no JS errors; menu opens and marks "study" current; footer filled; full-screen image view opens/closes; credit links go to Commons in a new tab; search returns results that open the right page; card corners rounded at all widths; Prev/Next side by side at the bottom right on every screen size (David, Oct 26 2026 — no top pager), swipe and arrow keys turn the page; no week numbers or course codes; "Theme" label on every theme; no image twice in a row or more than twice on a page. Not tested here: real Google Fonts (blocked in the test sandbox) and live API-driven content on the old pages.

**Post-deploy checks (passed Oct 26 2026 on the live site):** `/study.html`, the menu on a phone on index and gallery, `/color-theory.html` redirects, `/study/color-theory.html#flashcards`, one work page and one part page on a phone, search on the course home, a credits link. Then resubmit the sitemap in Search Console.


-----

## Completed This Session (October 24 2026)

**expenses-jill-nicholson.html + `/admin/jill/*` Lambda routes** — see the HTML Files and Lambda sections. Tested headless against the real `index.mjs` handler with an in-memory DynamoDB (25 checks: auth isolation both directions, tour + onboarded flag, bank-CSV import with title line / quoted commas / money-in filter / category mapping / new category / duplicate re-import, receipt key, revenue, mileage math, recurring 3-month backfill, rename relabel, P&L CSV, session reload, 390px phone width, no page errors). **Not yet live until the AWS setup below is done.**

**One-time AWS setup (David):**
1. DynamoDB → create table `jill-expenses`, partition key `id` (String), on-demand, us-east-1.
2. IAM → `dna-kiosk-role` → add GetItem/PutItem/DeleteItem/Scan on `arn:aws:dynamodb:us-east-1:*:table/jill-expenses` (S3 `receipts/*` is already covered).
3. Lambda `dna-kiosk` → env vars `JILL_PASSWORD` (her password) and `JILL_TOKEN` (long random string, e.g. `openssl rand -hex 32`; must differ from `ADMIN_TOKEN`).
4. Open the page, sign in once to confirm, then send Jill the link + password.
## Completed This Session (October 22 2026)

**color-theory.html — color wheel: spectral.js mixing + mixer/readout UI** (commit `07b9a6f`, deployed)

- ✓ **spectral.js 3.0.0 is now the live mixing engine** (needles, White, Black) — chosen by David after a temporary A/B toggle; toggle removed before shipping. Known trade-offs accepted: Red+Blue reads grayish, complements don't fully neutralize. Wheel-position math kept as automatic fallback if the jsDelivr script fails. `Color-Wheel-App-Reference.md` updated with the history and the "don't revert without asking" note.
- ✓ **Mix chips show each color's real share** (e.g. 34 / 33 / 33) — the cascading ratio sliders hid the actual split.
- ✓ **Colored sliders** — tracks show the actual 0→100% color range, thumb shows current color; live during drag.
- ✓ **Readout: Chroma meter + Value 7 Tint** — for mixing Gamblin Radiant–style high-chroma tints (color + white at Munsell value 7).
- ✓ **Spectral corrections: split-primary shift + per-hue tinting strength** — Red+Blue now Violet (was Gray), Green+Violet now Blue (was Green); all 24 two-color pairs at 60°/120° name as the wheel's target. Complements still don't fully neutralize (Yellow+Violet → "Orange"). Details in `Color-Wheel-App-Reference.md`.
- ✓ **Measured-pigment engine replaced spectral.js** — 13 Kimera paints from PaintMixing (miciwan, data CC BY 4.0; credit line in the wheel footer — keep it). Built-in Kubelka-Munk mixer + display calibration; no CDN dependency. White uses measured white paint; **Black stays on the hand-tuned adaptive model** (measured black tested and rejected — Yellow+black went brown). Fitting scripts in `tools/pigment-fit/` (not deployed). David's rule: only use data that's certainly free to use.
- **Workflow note:** test builds are reviewed in chat as files, not pushed as GitHub branches. Two experiment branches from this session (`spectral-mix-toggle`, `mix-percentages`) couldn't be deleted from the session — delete them on GitHub.


-----

## Completed This Session (October 11 2026)

**Gallery print sales now come out of gallery stock, not main print stock**

David logged a gallery sale and asked which inventory it reduced. It was main print stock (`dna-paintings.stock`) — wrong: a print sold at the gallery was on consignment there, so it should leave `dna-gallery-stock`. Before this, no sale path wrote to gallery stock at all; it only changed through the +/− buttons in the Gallery Stock view.

- ✓ **`index.mjs` — `adminAddSale` + new `reduceGalleryStock()`** — with `decrementStock: true`, a `large`/`small` sale on `channel: 'gallery'` takes one off the gallery record (`{paintingId}__{Gallery_Name}`, `stockLg`/`stockSm`) and returns `galleryStock: {galleryName, reduced, record}`. Main stock is not touched. No record, or zero of that size → the sale is still logged, nothing is reduced, `reduced: false`. **Done as Scan + conditional `PutCommand` (`#f = :cur`, re-read and retry up to 3×), not `UpdateCommand`, on purpose:** Scan and PutItem are what the gallery-stock routes already use, and the role's UpdateItem/GetItem permission on `dna-gallery-stock` isn't documented — an `UpdateCommand` could have deployed fine and then failed on access. If the stock write fails for any other reason the response carries `error: true` and the admin says to fix the count by hand, rather than reporting it as "none on record". `galleryName` defaults to `DEFAULT_GALLERY` ('Phoenix Gallery') so an older cached admin that doesn't send it still lands on gallery stock. Other channels and originals are unchanged.
- ✓ **`admin.html` — Sell window Log sale (`sellLog`)** — gallery print sales send `galleryName`, no longer subtract from the on-screen main stock, and the status line reads e.g. `Logged Wayside (small) — Phoenix Gallery small stock now 1` (or says the gallery had none on record and nothing was changed).
- ✓ **`admin.html` — sale modal (`saveSale`, row + Log Sale)** — gallery print sales now send `decrementStock` + `galleryName` and skip the painting PUT (so they also no longer clear `priceOverride`). If the gallery had none on record, an alert says so after the sale is logged.
- ✓ **`admin.html` — moving a sale to another painting** — each side uses the stock its channel sells from: a gallery sale gives the old painting's gallery count back (+1, `gsBump()` via `PUT /admin/gallery-stock`) and takes one from the new painting's gallery count (Lambda, on the re-created sale). Non-gallery moves are unchanged.
- ✓ **New helpers (admin.html, after `gsAdjust`)** — `saleGalleryName()`, `gsApplySaleResult()` (merges the returned record into `gsData`, re-renders the Gallery Stock view if it's open), `gsSaleNote()`, `gsBump()`.
- ✓ **Admin SW cache bumped to `dna-admin-v91`.**
- **Tested:** `node --check` on `index.mjs` and both inline scripts; the real `adminAddSale` run against a local DynamoDB emulator (dynalite) for gallery small / large / zero-stock / no-record / fair / original / no-flag / three simultaneous sales against two in stock / stock table unreachable; `admin.html` driven in headless Chromium against a mocked API for the Sell window (gallery, fair), the sale modal (gallery, gallery at zero, fair, stock-write failure) and a gallery-sale move. **Not yet run against live DynamoDB** — first real gallery sale after deploy is the confirmation.
- **Not corrected by this change:** the gallery sale David logged on October 11 before the fix (main stock is one low and Phoenix Gallery one high for that print) — fix by hand in Inventory and Gallery Stock.

**Known limits:** gallery print sales logged before October 11 2026 came out of main stock, so moving one of those to another painting now shifts gallery counts instead of main. Editing a sale's source in place (e.g. fair → gallery) and deleting a sale still adjust no stock in either pool (unchanged). The Sell window's "Prints in stock" line and picker rows still show main stock when Source is Gallery.

**Noticed, not changed:** sale ids are `'s' + Date.now()`, so two `adminAddSale` calls landing in the same millisecond would share an id and the second would overwrite the first. Only showed up in the simultaneous-sales test; one person logging sales by hand can't hit it.


-----

## Completed This Session (October 3 2026)

- ✓ **`gallery.html` — true-scale wall.** The masonry grid is replaced by a wall per year where every painting shows at its real relative size, largest in the centre on wide screens and leading on phones. Year headings moved to the right with a rule. See the gallery.html section for the as-built detail. Reverses the June 1 "gallery stays a pure image wall" layout only in arrangement — still no titles or prices on the wall. Tested headless at 1280, 1680, 820, 1024 and 390 wide with all 51 prints: no overlaps, no horizontal overflow, print card opens from a click, desktop → phone resize re-hangs; also with every Width / Height missing (fallback).
- ✓ **`index.mjs` — `/products` returns `width` and `height`.** `buildProductList()` now reads the Square `Width` and `Height` custom attributes (it previously stopped at `Original Available`). Additive; `/feed`, `/hero`, kiosk.html and generate-prints.js ignore the new fields.
- ✓ **Square dimensions corrected (via the Square connector):** Alley, Western Auto 30 × 30 → 16 × 20; Commuter blank → 30 × 30; Fast Eddy 33 × 37 → 37 × 33 (width and height were swapped). All 51 prints now have Width and Height, and each agrees with its live image's proportions within about 2.5%. **Admin keeps its own width / height in `dna-paintings`, so these three were not changed there.**
- ✓ **`gallery.html` print card — original's size on the link.** The link at the bottom of the card now reads `18 × 24" original available →` (width × height from `/products`); with no Width / Height in Square it falls back to `original available →`. Still shown only when `originalAvail && !atGallery`. Built by a new `renderOriginalRow(p)`, called from `openDetail()` **and `slideNav()`** — before this the row was only set on open, so arrowing or swiping to another print kept the first painting's link (a sold print could show "original available"). The link's `onclick` is set as an attribute because `renderAddButton()` re-creates the row from its `outerHTML`. Tested headless on desktop and phone: available, sold, at-gallery, no-dimensions, after choosing a size, and a full next-arrow walk of all 53 products with no mismatches.
- **Found, not changed:** the share buttons (Pinterest / Facebook) have the same staleness — `slideNav()` doesn't rebuild `#share-row`, so after arrowing to another print they still share the first-opened one.
- **Considered and rejected this session:** captions under each print (title + dimensions, then "original and prints available"); looser borderless masonry; big-and-small mosaic; uneven staggered columns; centerpiece ring (sold-first centerpiece rule was chosen, then dropped in favour of largest-in-centre once sizes were true-scale).
- **Noticed, not changed:** Fast Eddy's `ecom_seo_data.page_description` in Square describes a different painting ("three pedestrians walking a trail… original oil painting").
## Completed This Session (October 2 2026)

- ✓ **`originals.html` — paintings at a gallery are hidden.** `loadOriginals()` now filters `!p.atGallery` on the `/originals` response (same rule booth.html already used), so the list, size dropdown counts, year nav, and lightbox all exclude consigned pieces. Reverses the June 9 note "originals.html behavior unchanged (still shows them)". No Lambda change, no service worker involved. Live data at time of change: 47 originals, 5 tagged at gallery (Junction, KS Wind Farm No. 1, Sunflower No. 1, Sunflower No. 2, Waverly Church) → 42 shown.
- ✓ **`gallery.html` modal — "original available →" hidden for at-gallery paintings.** `/products` now returns `atGallery: true/false` per product (new `loadAtGalleryMatcher()` in `index.mjs`: one `dna-paintings` scan run in parallel with the Square calls, matched by squareId or normalized title — same rule as `/originals`). Only `getProducts` uses it; `/feed` and `/hero` are unchanged. The scan is wrapped in try/catch, so a DynamoDB failure can't take down the storefront — the link just shows as before. gallery.html shows the link only when `p.originalAvail && !p.atGallery`. `originalAvail` itself is unchanged (still the raw Square toggle), so admin/dashboard numbers are unaffected.
- ✓ **Site menu on every public page.** A three-line menu icon (since Oct 31 2026 the Mondrian-inspired "I1" icon; menu regrouped the same day with "color wheel" above "study" — see those sessions) at the left of the top bar (icon only, no "menu" word — David's choice, October 2 2026; the button carries `aria-label="menu"`) opens a panel: home, prints, available originals — divider — color theory, shipping & returns, guest book, contact. Current page highlighted. Left-anchored dropdown on desktop, full-width sheet ≤600px, scrim + Esc to close. **The same CSS/HTML/JS block is inlined in 11 files** (index, gallery, originals, shipping, color-theory, varied-readings, and the five art-fair pages) — search `SITE MENU`; a menu change means editing all 11. Not added to legacy shop.html, kiosk, booth, admin. Guest book item calls the page's `openGB()` when it exists, otherwise goes to `/#guest-book`; contact uses the split-string mailto. Footer links unchanged. The "prints / originals" tab row was prototyped and rejected (menu only).
- ✓ **`index.html` hero, past-year collapse; `generate-prints.js` pool; `gallery.html` size boxes** — see the index.html, gallery.html and generate-prints.js sections above for the as-built detail.
- **Prototypes (Claude artifacts, David's account):** "Outlined Hero Homepage" and "Gallery Menu and Tabs" — the design references for this batch.
- **How to hide/show an original:** admin → Inventory → expand row → At Gallery = Phoenix Gallery (or — to bring it back). Do not turn off `Original Available` in Square for a consigned piece — that makes it count as sold on the dashboard and blocks price tags.
## Completed This Session (September 30 2026, evening)

- ✓ **`originals.html` — size dropdown.** One left-aligned "size" `<select>` under the page intro; options generated from live `/originals` data (`sizeOf(p)` = smaller × larger side, so 22 × 28 and 28 × 22 are one entry), sorted small → large by area, each with a count; "all sizes" default. List, year sidebar/pills, and lightbox all run off a filtered `shown` array (`buildNav` now clears and rebuilds). Empty result shows "No originals in that size right now." Tested headless against the 41-painting data set: 13 options, 22 × 28 → 12 rows, no errors.
- ✓ **`gallery.html` — cart kept until payment confirmed.** `checkout()` no longer clears `dna_cart` before redirecting to Square; the existing `?success=1` handler is the only place it clears. Added a `pageshow` (bfcache) handler that resets the checkout button so a Back from Square doesn't leave it stuck on "one moment…". Headless round trip: old file → cart 0 after Back; new file → cart 1 after Back, 0 after `?success=1`. Known edge: a buyer who pays and closes the tab before the redirect keeps a stale cart on that browser (auto-log work can clear it properly).
- ✓ **`index.html` — Instagram easter egg (homepage only, David's choice).** Hovering the nav "follow on instagram" pill for 1.5s reveals a dark tooltip (right-anchored under the pill, text left-aligned): "This button is here because one time someone scanned a business card and they were upset that it *only* went to my website and they didn't see [instagram glyph]". Pure CSS (`transition-delay: 1.5s` on hover-in, 0 on hover-out); gated by `@media (hover: hover) and (pointer: fine)`, so it never appears on phones/tablets (no hover there). Tooltip is `aria-hidden` so the link's accessible name stays "follow on instagram".

- ✓ **Online sales auto-log (`index.mjs`) — server-side sweep.** First built as a browser-side confirm (gallery saved the order ID and called a new public `/checkout/complete` on the `?success=1` return, retrying on later visits). **Replaced the same evening** after David's review: (1) a buyer whose confirm failed isn't coming back, so their browser can't be the safety net; (2) a new public path depends on API Gateway routing we couldn't verify. Now the Lambda itself asks Square for paid online orders whenever admin loads (and monthly) — see "Online sale sync" under Lambda endpoints. No new route, no AWS change, no gallery.html involvement. **Ship-to state is stored as `shipState`, not `state`** — `state` means the fair's state on fair sales and drives admin's KS/MO filters and edit-modal select. Sales tax isn't stored on online rows (Square collects $0 — see Online sales tax). Tested: real handler run against faked Square/DynamoDB — admin load logged only the paid online order (3 rows incl. qty 2, stock −1/−2), skipped unpaid / fair-POS / Missouri-location / canceled orders; reload and scheduled run added nothing; a Square search error still returned admin 200. Square check: no online orders (open or completed) since Sept 21, so `ONLINE_LOG_SINCE` = Sept 22 misses nothing.
- ✓ **Expenses & Mileage lists: date range + search replace the year filter.** Each list has its own Search box (Expenses: description + category; Mileage: purpose + notes) and From–To dates (inline mono style, same as Inventory's "Sold between"); From defaults to Jan 1 of the current year, To open (`populateExpYearFilter()` sets the defaults, `inDateRange()` filters). The old `exp-year-filter` select is gone — it also couldn't be reached from the Mileage subtab. Admin SW → `dna-admin-v90`.
- ✓ **Advertising reminder now on the Expenses tab too** (top of tab, same banner as Reports; `renderAdvReminder()` fills every `.adv-reminder`). **Mileage: single current rate, saved per entry** (see Mileage features). `index.mjs` `adminAddMileage`/`adminUpdateMileage` keep `rate`. Admin SW → `dna-admin-v89`.
- ✓ **Admin "new online sale" alert (`admin.html`).** Green-bordered banner under the top bar, on every tab: "New online sale logged" (or "N new online sales logged"), a line saying they're in the Sales Log and out of stock with the pre-shipping total, and one row per sale: date · title · size · price · ships to {state}. **Got it** stores the newest `syncedAt` in `localStorage` `dna-online-seen`; the banner reappears only for rows synced after that. Per device — phone and desktop each show it once. Driven by `syncedAt` on synced rows (manual online sales have none, so they never trigger it). Tested headless: shows on first load, gone after Got it and reload, returns only for a newly synced sale. Admin SW → **`dna-admin-v85`**.
- ✓ **Sync hardening (same evening):** marker row per order (see Lambda "Online sale sync") so a deleted/edited synced sale is never re-logged; refunded orders skipped; `adminUpdateSale` keeps `shipState`/`syncedAt`. Tested: delete 2 synced rows → reload → not re-logged, stock untouched; edit price → `shipState`/`syncedAt` kept.
- ✓ **Admin Settings panel + Reports rework (`admin.html`, `index.mjs`).** See "Settings panel" and "Reports tab" under admin.html. New Lambda: `GET/PUT /admin/print-prices`, `irsRates` in config. Removed the Inventory rate bar (rate chip + $/sq in + print cost inputs) and every scattered ↓ CSV button (Inventory Stock/Sales, Gallery Stock, Expenses, Mileage, Revenue by State, Estimated Tax). Tested headless: Reports order, Taxes Collected range math, all 5 reports download with correct date filtering, only one CSV button remains, Settings margin + hover tip, Square warning shown and **no PUT until "Yes, update Square"**, IRS rate saved to config. Lambda price update tested only against fakes — **first real use: change one size, confirm in Square Dashboard.** Admin SW → `dna-admin-v86`.
- ✓ **Report picker moved to the top of Reports, opens a per-report form modal; Inventory "⋯" button renamed "Tools ▾"** (contents unchanged: Checklist, Take inventory, Price list, Price tags — "Tools" chosen over "Menu"/"Actions" because it names what's inside and "Menu" reads as main navigation on a phone). Tested headless: picker first in tab, all 5 reports download from the form, bad date range blocked, picker resets after each run, Tools opens/closes. Follow-up: picker right-aligned (David's request — where he looks for it), report-form dates use the standard modal `.field` style, Taxes Collected dates match the Inventory/chart inline date pickers. Admin SW → `dna-admin-v88`.
- **Lesson:** don't make a customer's browser responsible for recording the business's own data — anything the customer can abandon mid-flow will eventually go unrecorded. Pull from the source of truth (Square) on our side instead.
- ✓ **Gallery cart re-priced on load.** `refreshCartFromCatalog()` runs after `/products` loads: updates each stored line's price/title/size name/image from the live catalog and drops lines whose print or variation no longer exists (toast: "a print in your cart is no longer available").

**Auto-log groundwork (Square checks, read-only)**

- Every payment link Square returns already carries its `order_id` at creation time (confirmed via `listPaymentLinks` — e.g. link `75FWESBMK7CY47JY` → order `cFhfbe5…`). The Lambda `/checkout` already has it (`related_resources.orders[0]`, saved to `dna-orders`) but doesn't return it to the page.
- Square staff (developer forums, 2024) say production appends `orderId` to the redirect URL; not verified on our live flow.
- ~~**Recommended design:**~~ *(superseded — built, then replaced by the server-side sweep above)* return `order_id` from `/checkout`, store it in `localStorage` as pending before redirect, and on `?success=1` POST it to a new public endpoint that verifies COMPLETED and logs sales + decrements stock (idempotent on order ID). Doesn't depend on Square's redirect params. A webhook (`payment.updated`/`order.updated`) would also catch buyers who close the tab before the redirect — optional second layer.
- Webhook subscriptions couldn't be read from the Square connector (missing `DEVELOPER_APPLICATION_WEBHOOKS_READ` scope). Check in the Developer Dashboard if going the webhook route.


-----

## Completed This Session (September 29 2026)

**admin.html — unified Sale window: log / cart → Square Tap to Pay → auto-logged sales + stock**

Goal: stop the two-step fair routine (charge in the Square app, log prints in admin later). Square only processes the card; admin owns tax math, the sales log, and stock. **One `+ Sale` button** (topbar) opens the Sale window (`openSellModal()`), which now covers everything the old quick-sale modal did — originals, gallery sales (with your %), and a custom date. The old modal (`openQuickSaleModal()`) is no longer linked from the UI; its code is left in place (edit-sale still uses the same modal via `openEditSaleModal`).

- ✓ **`+ Sale` button** — shows cart count (`+ Sale · 2`). Opens the Sale window: search + image grid of Square prints → tap a painting → **Large $40 / Small $25** (prices from Square variations) → Source (Art fair / Online) and State (KS / MO, fair only) prefilled from defaults, changeable per sale.
- ✓ **Originals, gallery, date, and per-sale overrides (after first real test)** — the grid lists every inventory painting (`db.paintings`, minus market items and `Unknown`), with images from the catalog endpoint (which now also returns originals-only Square items, `variations: []`). Options per painting: Large / Small (if Square has print variations) and **Original** (price = `retail(p)`, i.e. `priceOverride` or rounded sq-in price; flags "original sold"). Source dropdown: Art fair / Online / **Gallery**; State shows for fair; **Your % of sale** shows for gallery (net = price × %). **Date** field (defaults today) applies to Log sale; checkout sales use the Square payment date. **Sales tax %** field under the cart starts at the default and can be changed for the current cart (`sessionStorage` `dna-sell-rate`, reset when the cart empties). Gallery sales are Log sale only (Add to cart / Checkout blocked — the gallery collects payment).
- ✓ **Sale window painting picker is a lookup list** — the square thumbnail grid (tiles overlapped on iPhone Safari; `aspect-ratio` on buttons didn't hold) was replaced by a scrollable list: 44px thumbnail, title, print stock per row; selected row highlighted. Decision (David): no collected-tax reporting in admin — tax owed is computed from revenue at filing. A Sales Tax expense category was added then removed at David's request.
- ✓ **Selling defaults** now include Gallery as a source and a **Gallery %** default.
- ✓ **Checkout line format** — `[ref, 'f'|'o', state, priceCents, 'p'|'o']`: kind `p` = print (ref = Square variation ID), kind `o` = original (ref = `dna-paintings` id, price required, no stock decrement). Lambda fetches original rows with `GetCommand`. **Original checkout path has not been run against real Square yet.**
- ✓ **Adjustable price** — picking Large/Small prefills a Price field from Square; edit it before Log sale / Add to cart. Adjusted cart lines show the list price struck through. The adjusted cents travel in the checkout `state` (`[variationId, channel, state, priceCents]`); Lambda uses them for the sale price and tax split and still requires Square's charged total to equal those prices + tax.
- ✓ **Three actions** — **Log sale** (logs just that print now, no charge, pre-tax Square price, decrements stock server-side via `decrementStock: true`); **Add to cart**; **Checkout** (adds the current pick if complete, then sends the whole cart to Square). Cart shows lines with × remove, **Clear cart**, subtotal + tax + total.
- ✓ **Cart storage** — `sessionStorage` (`dna-sell-cart`): survives iOS app switches/reloads, clears when the window/tab is closed.
- ✓ **Selling defaults card (Reports tab, top)** — Source, State, Sales tax % (per device, `localStorage` `dna-sell-defaults`). Also shows tax collected through Sell checkout this month by state (sum of `sale.tax`).
- ✓ **Tax** — admin computes it (Square is told `clear_default_fees: true`, so it adds none). Formula `Math.round(sub × rateMilli / 100000)` lives in both `sellTaxCents()` (admin.html) and `regTaxCents()` (index.mjs) — **keep them identical** or payment verification fails. Square's own reports show $0 tax for these charges; the admin `tax` field is the record. Set the fair city's rate before each fair (Kansas is destination-based).
- ✓ **Square POS API (iOS web)** — `square-commerce-v1://payment/create`, callback `https://davidnicholsonart.com/admin.html`, note lists prints, `state` carries the compact cart. Card only.
- ✓ **Return flow** — `sellHandleReturn()` runs on page load **before the PIN gate**, POSTs to the public `/admin/register/complete`, and shows a banner above the gate (z-index 9000). If already logged in, it re-fetches paintings. Failed log → **Retry** (idempotent). Canceled payment keeps the cart.
- ✓ **Lambda** — `registerCatalog`, `registerComplete`, `regSizeOf`, `regTaxCents`, `regPaintingIndex`; `UpdateCommand` import; `adminAddSale` opt-in atomic stock decrement; `adminUpdateSale` preserves `tax`/`squareTxn`. Routes are under `/admin/register/*` (existing CloudFront `/admin/*` behavior) and matched **before** the auth gate.
- ✓ **Admin SW cache bumped to `dna-admin-v84`** (v74 build, v75 adjustable price, v76 single Sale button, v77 cart-clear fix + login scroll reset, v78 originals/gallery/date/tax override, v79 Sales Tax category (reverted), v80 lookup-list picker, v81 new admin icons, v82 Add to cart next to the painting title, v83 Add to cart moved under the size picker + price, above Source, v84 silent cart keep on cancel).
- ✓ **Cart cleared after Safari returns (fix after first real test)** — iOS returns from Square into Safari, not the home-screen app, so the app's cart survived a successful charge. Checkout now sends a random `cartId` in `state` (stored on each sale row as `cartId`) and remembers it in `sessionStorage` (`dna-sell-pending`). When the app regains focus it calls the public `GET /admin/register/status?cart=ID` (scans `dna-sales` for that `cartId`): logged → clears the cart with a banner; not logged → keeps the cart silently (v84: the earlier Keep/Clear prompt was removed — canceling in Square should need no action). Square always opens the callback URL, in Safari, even on cancel; iOS can't route it back into the home-screen app, so on cancel the Safari tab just says to switch back.
- ✓ **Login scroll reset** — after PIN entry the input is blurred and the page scrolled to top so the mobile tab menu is visible on open (iOS left a keyboard scroll offset). Unverified on device.
- ✓ **Doc fix** — PWA-mode note corrected (home-screen launch no longer hides tabs).
- ✗ **register.html** — built earlier this session as a standalone page, then replaced by the admin Sell window before deploy. Never shipped.

**Manual steps (David):**
1. Square Developer Dashboard → the production application → **Point of Sale API** → **Web** section (not iOS — bundle IDs / URL schemes are for native apps) → Web Callback URL `https://davidnicholsonart.com/admin.html` (exact). Copy the **Application ID** (`sq0idp-…`). ✓ Done and verified with a real charge 2026-09-29.
2. Lambda `dna-kiosk` → env var `SQUARE_APP_ID` = that Application ID.
3. Square token needs `ORDERS_READ` and `ITEMS_READ` (a personal access token has them).
4. iPhone: Square POS app ≥ 6.0 with Tap to Pay enabled.
5. First real test: check out one small print, confirm the Sales Log row (with tax) + stock decrement, then refund in Square and delete the row in admin.

**Known limits:** Square cash payments return no order ID, so Checkout is card-only (log cash with Log sale or + Sale). Paintings not matched to a Square item can't be picked in Sell (use + Sale). Moving a Sell-checkout sale to another painting in the edit modal drops its `tax`/`squareTxn` (the move re-creates the row).

**Existing bug noticed, not changed:** quick sale's stock decrement PUTs the painting with a fixed field list that omits `priceOverride` (and `squareId`, which is backfilled on next load) — `adminUpdatePainting` rewrites the record, so a quick-sale print sale silently clears that painting's price override. The Sell window avoids this via the server-side atomic decrement.


-----

## Findings This Session (September 30 2026) — no code shipped

Discussion/audit session. Nothing was changed in the repo or in Square (read-only checks only). All open work is in **Pending → Next session** below.

**Online sales tax — current behavior (verified against real orders)**

- Nexus: **Kansas only** (David). The Missouri location + 4.22% tax exist for in-person MO fair sales under a temporary permit.
- `checkout()` in `index.mjs` creates a Square Payment Link with `location_id: SQUARE_LOC` (= `LYVD3ZGR3X4KE`, Roeland Park KS), line items by `catalog_object_id` only, and sets no tax or fee options.
- **Every completed online (payment-link, `source: headless`) shipment order checked has `total_tax_money: 0`**, even though the Kansas 9.35% tax is attached to that location. Orders checked 2026-09-30: Rantoul IL (2026-09-21, $25 + $8 shipping, $0 tax), **Prairie Village KS (2026-09-12, $40 + $8 shipping, $0 tax)**, Atlanta GA (2026-05-22, $35 + $8, $0 tax), plus three March 2026 test orders ($0 tax).
- So: out-of-state buyers are correctly charged nothing; **Kansas-destination buyers are also charged nothing, and David owes that tax out of pocket.** The voice-session assumption that payment links charge every buyer 9.35% was wrong — the orders show no tax at all.
- Why this can't be fixed in the Lambda: the buyer's address is entered on Square's hosted checkout page, after the link (and any tax) is already fixed. Nothing on davidnicholsonart.com ever sees the address before payment.
- Reported in the voice session but **not re-verified**: Square's docs say payment links don't support manually applied online taxes on shipping orders, and destination-based tax is a Square Online feature, not a Checkout API / payment link feature. Re-check before relying on it.
- Current decision: leave online payment links untaxed; remit Kansas tax on Kansas-destination online orders manually. Revisit if Square adds destination-based tax to payment links.
- Shipping: Square adds a flat $8 "Flat Rate Shipping, USPS First Class Mail" service charge (non-taxable) on the hosted page — it's not in our Lambda.

**Gallery checkout — issues found (carried over from the admin Sale-window work)**

1. `gallery.html` `checkout()` empties `dna_cart` **before** redirecting to Square. A customer who backs out of Square's page returns to an empty cart. Admin had the same class of bug and fixed it by clearing only on confirmed completion.
2. Online sales never reach `dna-sales` and never decrement stock — `/checkout` only writes `dna-orders`. `?success=1` is unverified (anyone loading that URL clears their cart and sees "order placed").
3. The cart stores each line's price in localStorage for display; Square charges the catalog price (correct), but a stale stored price can show a different total than what's charged.

**Originals page — scope decided**

- The chip/filter/"fits a space" mockup was rejected as too many controls. Wanted: **one dropdown of sizes; pick a size → list shows only paintings of that size.**
- Live `/originals` data (41 paintings, fetched 2026-09-30) has **13 distinct sizes**, not the 5 standard + 1 oddball David expected — see the to-do for the list.

-----

## Completed This Session (September 19 2026)

**Print production cost tracking + steering doc staleness audit**

- ✓ **`printCostSmall` ($5) / `printCostLarge` ($12) config fields** — new fields on the `__config__` DynamoDB record, alongside `rate`. `adminGetConfig`/`adminGetPaintings` return them (defaulting 5/12 if unset); `adminUpdateConfig` (`index.mjs`) now does a read-merge-write instead of a blind `PutCommand` overwrite, so updating the rate alone no longer risks wiping the print-cost fields (or vice versa).
- ✓ **Rate bar UI (admin.html)** — added **Small print cost** / **Large print cost** `$` inputs next to the existing Price/sq in field; same debounced-autosave pattern (`setPrintCost(size, val)` → `saveRatesDebounced()` → `saveRates()` now sends all three fields together).
- ✓ **Inventory filter revenue readout** — `updateFilterRevenue()` now renders a small stacked stat block instead of one line: **Total revenue** (all filtered sale types) always shown, plus **Print sales** / **Print cost** / **Print profit** rows (print revenue only, `printCostFor(sale)`: `printCostLarge`/`printCostSmall`/`0` for large/small/original, and print revenue − print cost) whenever the filtered set contains any print sales. **Originals are excluded from the Print sales/cost/profit rows by design** — David's instruction: cost applies to prints only, not originals; they still count toward Total revenue.
- ✓ **Sales CSV export** — added `Print Cost` and `Net Profit` columns per row.
- ✓ **Admin SW cache bumped to `dna-admin-v70`** (v69 then v70 across two rounds this session — the readout was reworked from a single line into a stacked stat block partway through).
- ✓ **Steering doc audit** — the "Five-tab layout" section had drifted badly out of date (last touched well before several since-shipped changes). Corrected to reflect the actual current **four tabs** (Expenses & Mileage, Inventory, Booth Planner, Reports [renamed from Dashboard]); documented that Prints, Sales Log, and Gallery Stock are no longer separate tabs — all three were absorbed into Inventory as filter modes / a view toggle over past sessions, and this doc never caught up. Also corrected the "dual rate adjuster (standard + large ≥30")" claim — `rateLarge` was removed end-to-end in an earlier session (per-painting `priceOverride` replaced its use case) but the doc still described the old two-rate UI.
- ✓ **Cost basis (David's own materials pricing, not app-derived):** Canon PRO-310 on Hahnemühle German Etching 310gsm — small = 5×7 printed 2-up on 8.5×11 sheets, large = 9×12 printed on 11×17 sheets; plus a 25-count show-kit box of mats/backing/bags per finished size (8×10 kit box $90 incl. upgraded backing, 12×16 kit box $150 incl. upgraded backing, each divided per unit). Landed to $5.00/small print, $12.00/large print.


-----

## Completed This Session (September 6 2026)

**admin.html — inventory filters + flat icon pass**

- ✓ **"0 large" / "0 small" filter chips** — appear alongside Sold/Unsold when Prints mode is active (`typeFilter==='prints'`); filter to `stock.large===0` / `stock.small===0`; reset when switching type filters; combinable with all existing filters.
- ✓ **All emoji/3D icons replaced with flat inline SVGs** — new `ICON_EXPAND`, `ICON_SHARE`, `ICON_CHEVRON`, `ICON_FILE` constants near the top of the main `<script>` block (currentColor-based, so callers set color via CSS). Replaced: 📎 (receipt view → expand icon, `var(--accent-ink)` blue), ⬆️ (lightbox Share → share-nodes icon, left white on the dark overlay — navy would nearly vanish there), 📄 (PDF message → file outline icon, also white on dark overlay).
- ✓ **Inventory row expand indicator redesigned** — went through two iterations before landing: first a maximize/minimize icon pair (swapped on open state), then per feedback that pattern read as unintuitive, replaced with a rotating chevron (`ICON_CHEVRON`, rotates 90° open) — the conventional accordion pattern, closest match to the original behavior of the `▶` glyph it replaced.
- ✓ **Gallery Stock tab now sorts stocked prints to the top** — two-tier sort (any stock at that gallery first, by title; zero-stock below, by title, still dimmed) instead of pure alphabetical.
- ✓ **Admin SW cache key bumped to `dna-admin-v41`** — required since admin.html changed.

**booth.html — Shuffle and Align buttons**

- ✓ **Align button** — re-packs each wall's *existing* pieces into a top-aligned grid (`packWallGrid()`): fills left-to-right with a 4" gap (`GRID_GAP_IN` constant), wraps to a new row (4" gap) when a piece won't fit, row height = tallest piece in that row. Doesn't reassign walls, just tidies. Confirmed working after one round of live testing; gap is a single easy-to-tune constant if 4" reads wrong on an actual wall (David: "may have to look into again with testing").
- ✓ **Shuffle button** — pools every currently-placed piece across all walls, Fisher-Yates shuffles them, redistributes round-robin across walls (skipping a wall if the piece is wider than it), then runs the same `packWallGrid()` on each wall so the result never overlaps. Chosen over pure-random-position placement per David's preference (spread out, no overlaps, since the tool already has overlap-flagging elsewhere but that's not what he wanted here).
- ✓ **Design note for future reference** — hamburger icon was considered and rejected for the row-expand indicator (see admin.html above) because it's conventionally "open a nav menu," not "expand this row" — worth remembering if it comes up again elsewhere in the site.


-----

## Completed This Session (August 31 2026)

**Color wheel: retired the iframe architecture entirely (mobile bug chain)**

Started as a request to fix mobile scrolling on the color wheel tool
inside `color-theory.html`'s "Wheel" tab, and escalated through a chain of
narrower fixes before the actual root cause (the iframe itself) was
addressed:

- ✓ **3/6/12/24 hue-count toggle added** — `HUES3`/`HUES6` pulled from
  `HUES12` at indices [0,4,8] (primaries) and [0,2,4,6,8,10]
  (primaries+secondaries), same pattern as the existing `HUES24`. Default
  changed to 6.
- ✓ **Naming/mixing bug fixed** — at reduced hue counts (3/6), mixed
  results were being colored *and* named against only that reduced set,
  so e.g. Red+Yellow read as "Yellow" instead of Orange (no "Orange" in a
  3-name vocabulary). Fixed by separating concerns: the dial's hue count
  now only controls what you can pick as an ingredient; the actual blend
  color and its name are always computed against the full 24-hue wheel
  (`NAME_HUES`/`NAME_STEP` constants, independent of the display
  `wheelSize`). Verified Red+Yellow→Orange, Yellow+Blue→Green,
  Red+Blue→Violet.
- ✓ **iframe resize feedback loop found and fixed** — the "fit iframe to
  content" script and the child's own `body{min-height:100dvh}` fed each
  other: parent sets iframe height → child's rendered height changes
  (because it's pinned to a % of the iframe's own current height) →
  `ResizeObserver` (watching exactly that) fires → parent sets a new
  height → repeat, surfacing as "Uncaught Script error" spam in the
  console, far more than the handful of edits leading up to it would
  suggest.
- ✓ **iOS double-tap bug found (root cause, not patched)** — resizing an
  `<iframe>` element's own box is a known WebKit quirk that can eat the
  next tap inside it; since this app resizes on nearly every interaction
  (adding a mix color, expanding a relationship), that turned into
  needing to double-tap almost everything, most visibly "+ Mix."
- ✓ **Root cause identified: the iframe architecture itself.** Each fix
  above solved one symptom and re-triggered another (fixing the resize
  loop broke exact-fit sizing again; fixing sizing needed the iframe to
  resize, which re-triggered the tap-eating bug). The three goals — box
  exactly fits content, only the page scrolls, taps never need repeating
  — turned out to structurally conflict as long as a same-origin iframe
  plus JS-measured resizing was in the loop.
- ✓ **Fix: retired `/color-wheel-app.html` as a standalone page and
  iframe target entirely; inlined the wheel directly into
  `color-theory.html`.** No more cross-document height measuring, no
  `ResizeObserver`, no double-scroll, no iframe-resize tap bug — it's now
  plain page content, sized and scrolled the same as everything else on
  the page. Two things made this safe:
  - `header`/`main`/`footer` (and their bare-tag CSS rules) renamed to
    `.wheel-header`/`.wheel-main`/`.wheel-footer`, since `color-theory.html`
    already has its own real `<main>`/`<footer>` with their own bare-tag
    rules that would otherwise collide directly.
  - The wheel's own `:root` CSS variables rescoped to `.wheel-app`
    instead of global, and its entire `<script>` wrapped in one IIFE, so
    none of its ~70 top-level functions/consts (the `$` helper included)
    leak onto `window` and risk colliding with `color-theory.html`'s own
    script.
- ✓ **`Color-Wheel-App-Reference.md` and this doc updated** to point at
  the new location (inline in `color-theory.html`) instead of the retired
  standalone file.

**Lesson for next time:** when a same-origin-iframe embed starts
generating a chain of mobile-only bugs that each fix seems to re-trigger
another one of, stop patching symptoms and ask whether the iframe itself
is structurally necessary. Here it wasn't — it existed only to avoid a
CSS selector collision, which a rename fixes in a few minutes and
permanently removes the whole bug category.


-----

## Completed This Session (July 26 2026)

**Color theory study deck — new public page**

- ✓ **`color-theory.html`** (new) — site-chrome wrapper page: fixed nav with back-link + instagram + cart badge, lowercase intro, bordered deck panel, full-bleed site footer. GA + favicons + OG tags included.
- ✓ **`color-theory-app.html`** (new) — the deck itself (~175 cards), embedded via iframe, `noindex`. Rethemed from its original warm/Space-Grotesk look to the live site tokens (white bg, `--ink #2b3640`, `--accent #2f4f75`, Jost). Swatch colors deliberately left literal.
- ✓ **Footer nav — “color theory” link added** to `index.html`, `gallery.html`, `originals.html`, `shipping.html`, `varied-readings.html`, and the new page itself. Inserted before “contact” on each. Note the footers are NOT identical: `originals.html` uses `onclick="contact()"` (not the split-string mailto), and `shipping.html` has no self-link, so the anchor line differs per file.
- ✓ **`sitemap.xml`** — added `color-theory.html` (priority 0.5, monthly). The app file is intentionally omitted (noindex).
- ✓ **Steering doc palette correction** — the “Key Principles” entry still prescribed the retired warm theme (`--bg #f8f6f3`, `--accent #e07030` orange, `--ink2 #5e6b78` / `--ink3 #64707c`). The live site has been white / `#2b3640` ink / `#2f4f75` steel-blue accent for some time. Principle rewritten with the current tokens + measured AA ratios (ink 12.3:1, ink2 6.05:1, ink3 4.76:1, accent 8.41:1 on white) and an explicit note that the orange palette in the April/June 2026 session logs is historical. Verified identical tokens across all five public pages before rewriting.

- ✓ **Card ordering fixed (caught by David)** — the deck opened with four near-identical red/green cards, all Complementary. Two causes: builders looped hue-outer/treatment-inner so all six value treatments of one hue pair clustered; and the deck was dealt in generation order, so the first 20 cards shared one answer and the quiz was guessable by position. Fixed by making builders treatment-major (hue varies fastest) and dealing shuffled by default with a local repair pass (`spread()`). See the `color-theory.html` section for why the "largest group first" greedy was rejected.

**Iframe rationale:** the deck app uses generic element selectors (`header`, `main`, `button`, `footer`); inlining it into a site page would collide with site CSS. The iframe seals it off, which is why the two-file split exists.

**Bug worth remembering (cost two rounds):** the deck's swatch fronts rendered as name labels with no color. Cause was a height chain — the card sized via CSS `aspect-ratio` with absolutely-positioned faces, and an inner wrapper (`.fade`) had no height, so `height:100%` on the swatches resolved to zero and the color blocks collapsed. Fix: explicit card height, `height:100%` on the wrapper, and paint the color as the swatch's own `background` rather than a child block. Same class of bug bit the Albers “grounds” sample square (percentage height inside a flex parent) — also given an explicit height. **General lesson:** percentage heights need an unbroken chain of resolved heights; when a colored box vanishes, walk the ancestor chain before suspecting the color values.


-----

## Completed This Session (July 10 2026)

**Instagram/Meta ad campaign — planned and ready to launch**

Strategy session (no code changes). Decision: keep the full-time job, grow the art business as a long-game side track, and start driving online demand with a small paid test. Consulting/SaaS side-business ideas were explored and deliberately shelved — not to-dos.

**Campaign structure (Meta Ads Manager):**

- One campaign → one ad set ($25/week budget, Conversions objective) → **five ads, one print image each**. Meta auto-shifts budget to whichever ad converts — this answers "which print should I promote" with data instead of guessing. Not a carousel (carousel hides per-print performance).
- Targeting: broad art/illustration/painting/design interests, ages 18–60, US (+ anywhere with prior sales)
- Each ad links to gallery.html — ideally the specific print via `/prints/{slug}.html` or `?view=` deep link
- Run 4 weeks minimum before judging; check daily the first week only
- Same copy pool pasted into all five ads (Ads Manager allows up to 5 primary texts + 5 headlines per ad and mix-and-matches); the image is the only variable being tested

**Ad creative — five prints, chosen from sales-log analysis (CSV export, July 2026):**

1. **KS Wind Farm No. 2** — top print seller (4 sales), repeat gallery seller
2. **KS Wind Farm No. 1** — one of only two prints ever sold *online* (full $60) — proven online converter
3. **For the Next Hour** — the other online sale, plus a fair sale
4. **U.S. 50 East** — 2 large fair sales at full price
5. **Commuter** — sold prints *and* the original (Utility Pastel and Alley Western Auto share this pattern — good alternates)

Key data insight: sales are breadth-driven — on a fair day David sells ~10 *different* prints, one each, not multiples of one. So limited editions were rejected as a strategy; the print-everything catalog approach stays. The bottleneck is overall demand/discovery, hence advertising.

**Final ad copy (lowercase brand voice, "regionalist pop" positioning mixed with plain-language options so the data shows which converts):**

Primary text options:
1. "wind farms, highways, and quiet streets — the midwest, painted in oil. prints from $35."
2. "the places you drive past every day. worth a longer look. prints from $35."
3. "regionalist pop — the midwest in bright, saturated oil. wind farms, highways, quiet streets. prints from $35."
4. "grant wood meets pop color. paintings of the everyday midwest. prints from $35."
5. "a utility pole at 6am can be beautiful. prints from $35."

Headlines: "the midwest, painted" · "regionalist pop" · "prints from $35" · "art of ordinary places"

Description (rarely shown on IG placements): "painted in oil. printed to last."

**Where copy goes in Ads Manager:** Primary text = caption above the image (hook must land in first ~125 chars); Headline = bold line next to the Shop Now button; Description = small gray text (mostly Facebook-only).

**Follow-ups:**

- Log ad spend under the **Advertising** expense category (dashboard reminder banner already nags monthly)
- After 4 weeks: pull per-ad results, keep winners, note whether the "regionalist pop" copy or plain copy converts better
- New to-do added to Pending: **admin panel mobile/UX overhaul** (exporting the sales CSV on iPad was painful — admin has outgrown its five-tab single-page layout)


-----

## Completed This Session (June 26 2026)

**Market-item support + gallery-stock auth fix**

Goal: sell small originals at first market via a manual Square line item, track them in the Sales Log only — keep them out of Inventory, Prints, Gallery Stock, and the public/kiosk feeds.

- ✓ **`marketItem` flag (admin.html)** — paintings with `marketItem: true` are filtered out of the Inventory tab, Prints tab, Gallery Stock (render + CSV), dashboard stock/count math (`renderCards` now builds a `realPaintings` list excluding them), inventory CSV export, and price-tag printing. They still appear in the Sales Log (which iterates all paintings) and in the sale-modal painting picker (so a market sale can be logged against them).
- ✓ **`manual_sale` placeholder record (`dna-paintings`)** — single record, `id: manual_sale`, `marketItem: true` (Boolean), `title` "Small Original (Market)". All market small-original sales attach to it as `dna-sales` children. **Title MUST be type String (S)** — a String Set (SS) breaks every `.localeCompare` render. No `stock` field needed (code is now guarded).
- ✓ **`Market Item` Square custom attribute (`index.mjs`)** — `getAttr('Market Item') === true` now read into `squareData.marketItem`; the auto-create loop skips Square items flagged true, so "Large Print" / "Small Print" quick-charge line items no longer get auto-created into `dna-paintings`. (Existing Large/Small Print records must be deleted manually once; they won't return.)
- ✓ **Defensive guards (admin.html)** — every `p.stock.large/small` → `p.stock?.…`; every `p.sales.forEach/filter` → `(p.sales||[])`; title sorts → `(a.title||'')`. A malformed/market record can no longer crash a render.
- ✓ **Gallery-stock auth bug fixed (admin.html)** — `loadGalleryStock` and `gsAdjust` were using raw `fetch('/admin/gallery-stock')` (relative path, **no token**) instead of the `api()` helper. This 401'd once the relative-path routing stopped working, blanking the Gallery Stock tab. Now routed through `api('GET'/'PUT', '/gallery-stock')` — `API_BASE` already ends in `/admin`, so the path is `/gallery-stock` (NOT `/admin/gallery-stock`, which would double the prefix). Authenticated and consistent with all other calls.
- ✓ **Admin SW cache key** — bumped to `dna-admin-v30`.

**Debug note:** symptoms (empty inventory, zeroed gallery stock, dead sale button, missing dashboard revenue) were all downstream of unguarded `.stock`/`.title` access on the market record plus the unauthenticated gallery-stock fetch. The "missing total revenue" was a red herring — the dashboard has no single Total Revenue card by design (revenue is split into fair/online/gallery cards). Root cause of the final breakage: `title` added in DynamoDB as a String Set instead of a String.

**Manual steps (David):** create `Market Item` boolean custom attribute in Square + set true on Large Print and Small Print; delete the existing Large Print / Small Print records from `dna-paintings`.


-----

## Completed This Session (June 11 2026)

**Maintainability review + security fixes**

- ✓ **Server-side admin auth enforced (`index.mjs`)** — `checkAdminAuth()` now actually validates the token (was `return true`). Accepts `?token=` or `X-Admin-Token` header, compares to `ADMIN_TOKEN` env var with `crypto.timingSafeEqual`. All `/admin/*` routes 401 without a valid token.
- ✓ **PIN moved out of public HTML (`index.mjs` + `admin.html`)** — new public endpoint `POST /admin/verify-password` checks the submitted PIN against new Lambda env var `PASSWORD` (timing-safe) and returns `{verified:true, token:ADMIN_TOKEN}`. admin.html no longer contains `PASSWORD` or `ADMIN_TOKEN` constants; on login it fetches the token and keeps it in a JS variable (`sessionToken`) for the page session. Auto-submit at 6 digits preserved; in-flight guard prevents double-submit; 401 on any API call logs out with “Session expired.”
- ✓ **Logout clears the token** — closing/reloading the page requires the PIN again (token lives only in memory, not storage).
- ✓ **Admin SW cache key** — bumped to `dna-admin-v26`.
- ✓ **shop.html marked LEGACY** — noindex/nofollow meta, source-comment header (“do not add features here; update gallery.html”), visible archived-banner linking to gallery.html, removed from sitemap.xml. Kept for old links.
- ✓ **Secrets scrubbed from this doc** — Square production token, admin token, and PIN values removed; doc now points to Lambda env vars. NOTE: old values remain in git history — rotating the Square token is recommended (reminder set).

**AWS step required (manual):** add Lambda env var `PASSWORD` to `dna-kiosk` before deploying — see below.


-----

## Completed This Session (June 10 2026)

**Kiosk taken off the Square storefront**

- ✓ kiosk.html QR code, tap-to-open, and email-link now build `davidnicholsonart.com/gallery.html?view={id}` via a new `pieceUrl(p)` helper, instead of the Square `p.url`. Opens the exact scanned piece on the own domain with the site cart + Square payment-link checkout. Chosen over the `prints/{slug}.html` page (which only redirects to the same `?view=` target) to avoid coupling the kiosk to build-time slug-dedup. If Square ever changes terms on the hosted storefront, the booth flow is unaffected.

**SMS / toll-free retired — replaced by QR + email** (details under “SMS — retired” above)

- ✓ Removed the dead SMS “Text” button + phone input from kiosk.html; `sendLink()` is now email-only.
- ✓ Lambda `index.mjs`: removed SNS import, client, `sendSMS`, and the `sms` branch in `/send-link`.
- ✓ Toll-free `+18444767251` released; `AmazonSNSFullAccess` detached from `dna-kiosk-role`.

**Booth planner — wall size toggles (shipped)**

- ✓ New **Walls** button opens a panel: per-wall width steppers + one shared height stepper (1-ft steps; width 4–20 ft, height 6–10 ft). Resizing rescales the scene live and clamps placed pieces back onto shrunken walls. “Reset to 10·7·10” restores defaults.
- ✓ Wall dimensions now persist per layout. Save format bumped to `{v:2, dims:[{w,h}], pieces:[[...]]}`; `parseLayout()`/`applyLayout()` load it and stay backward-compatible with legacy array-only saves (which open at the default 10·7·10 × 8). `wallName(w)` renders live dims in tags/readout; `totalWin()` is now a function so scale recomputes on resize. Removed dead `safeParseWalls`.

**Recurring expenses — shipped (`index.mjs` + `admin.html`)**

- ✓ No new table: recurring definitions live in `dna-expenses` as `type:'recurring'` (alongside `expense`/`mileage`). Fields: `category, desc, amount, dayOfMonth (1–28, clamped), startMonth (YYYY-MM), active, lastRun`.
- ✓ Endpoints: `GET/POST /admin/recurring`, `PUT/DELETE /admin/recurring/{id}`, `POST /admin/recurring/run`. Recurring defs are also included in the `/admin/expenses` payload (`{ expenses, mileage, recurring }`).
- ✓ `generateAllRecurring()` brings every active def current: one expense per month from each def’s `startMonth` through the current month, dated with the def’s `dayOfMonth`. Idempotent via a per-month existence check (`recurringId` + month) — re-running, backfilling, and the cron never duplicate. Generated rows are normal `type:'expense'` records tagged `recurringId` + `auto:true`, fully editable and included in the CSV export.
- ✓ Admin UI: **Recurring** section in the Expenses & Mileage tab (add/edit modal: category, amount, day-of-month, start month, active; inline On/Off toggle; single **↺ Generate expenses** button). Dashboard gains a **Recurring / month** card listing active items + monthly total.
- ✓ EventBridge **Scheduler** schedule `dna-recurring-expenses`: `cron(0 6 1 * ? *)` America/Chicago → Lambda `dna-kiosk`, constant input `{"task":"recurring"}`. Handler detects `event.task === 'recurring'` at the top and runs the generator. No new Lambda IAM (DynamoDB already covered); Scheduler’s auto-created role grants invoke. The cron is only a monthly wake-up — start months and day-of-month are handled in code, so the cron date matches nothing by design.
- ✓ Design note: dropped an initial January-only “Backfill year” button in favor of per-item `startMonth` + one “Generate expenses” that fills each item from its own start.

**Advertising category + reminder (`admin.html`)**

- ✓ New **Advertising** expense category (teal `cat-advertising` badge) added to the filter, expense modal, recurring modal, and `CAT_CLASS`. No Lambda change — category is a free-text stored string.
- ✓ Dashboard reminder banner: shows “No Advertising expense logged for {Month Year} yet” whenever the current month has no Advertising expense; the **Add advertising expense** button opens the modal pre-set to Advertising. Current-month only (no nagging about past months); clears automatically once an entry exists (manual or recurring).

**Deploy footgun found: stale `index.js`**

- ✓ The repo tracks both `index.js` (old, pre-SNS-cleanup) and `index.mjs` (current). The workflow deploys **only** `index.mjs` (`zip lambda.zip index.mjs`). Editing `index.js` does nothing — this caused a session where `startMonth` wouldn’t save (new frontend, stale Lambda). **TODO: `git rm index.js`** to remove the footgun. Always edit `index.mjs`.


-----

## Completed This Session (June 9 2026)

**Booth Planner (`booth.html`) — complete build**

New standalone page for pre-fair layout planning. Noindex, linked from admin topbar (Booth Planner button, left of + Sale). No PWA/SW dependency — unregisters any active SW on load so admin/kiosk SWs don’t interfere.

- ✓ **Three-wall layout** — Left 10×8, Center 7×8, Right 10×8 ft, shown to scale in browser. Walls sized correctly to match real panel height (8 ft) rather than booth footprint (10 ft).
- ✓ **Live catalog from `/originals`** — painting list with thumbnails, real Square dimensions. Phoenix Gallery paintings excluded via `atGallery` field added to `getOriginals` response (DynamoDB scan of `dna-paintings` cross-referenced by squareId + normalized title).
- ✓ **title reserved word fix** — DynamoDB `ProjectionExpression` aliases `title` as `#t` in ExpressionAttributeNames; previously threw a ValidationException silently killing `/originals`.
- ✓ **Drag & tap placement** — tap to arm a painting (gold highlight), tap wall to place; or drag from palette directly onto wall. Placed pieces drag to reposition; tap ✕ to remove. Touch scroll fixed: palette items use `touch-action: pan-y` + `pointercancel` handler so vertical list scroll works without accidentally picking up paintings.
- ✓ **Coverage readout** — per-wall coverage %, sparse/balanced/crowded verdict, overlap detection (red outline).
- ✓ **Server-side layout storage** — new DynamoDB table `dna-booth-layouts` (PK: `id`, fields: `title`, `wallsJson`, `updatedAt`). Lambda routes: `GET/PUT/DELETE /booth-layout`, `GET /booth-layouts`.
- ✓ **CloudFront behaviors** — `/booth-layout*` and `/booth-layouts*` added to E2EJH38GWGPEPG pointing to API Gateway. **Critical:** booth.html calls `davidnicholsonart.com/booth-layout` (same-origin via CloudFront), not the raw API Gateway URL. This avoids CORS preflight failures — admin.html always used same-origin calls so PUT CORS had never been tested on this Lambda.
- ✓ **Named multi-layout save/load** — Save button prompts for a name, saves to DynamoDB, URL gains `?id=UUID`. “Open saved” fetches all layouts from server (`GET /booth-layouts`) so any device sees the full list without needing a URL. Layout select dropdown in toolbar for quick switching.
- ✓ **Server delete** — `DELETE /booth-layout?id=X` removes from DynamoDB; × in Open saved panel calls it.
- ✓ **SW unregister** — booth.html detects any active SW (admin or kiosk), unregisters all, and auto-reloads so the page runs SW-free. Prevents admin-sw and kiosk SW from intercepting API calls.
- ✓ **Admin SW v22** — `/booth-layout` path added to passthrough list; kiosk SW fixed to handle all API methods (not just GET).
- ✓ **IAM** — `dna-kiosk-role` inline policy `booth-layouts-access`: GetItem, PutItem, DeleteItem, Scan on `dna-booth-layouts` table.
- ✓ **Prints tab simplified** — removed the four color-coded tier sections (Out of Stock red, Low Stock yellow, etc.). Prints now render as one sortable flat table; only controls are the two checkboxes (0 large / 0 small). Tier grouping was redundant once the stock columns are visible.
- ✓ **atGallery in `/originals`** — Lambda now scans `dna-paintings` in parallel, builds a gallery set by squareId + normalized title, tags each painting `atGallery: true` if matched. Booth planner filters these out; originals.html behavior unchanged (still shows them).
- ✓ **Shuffle / Align (September 2026)** — see "Completed This Session (September 6 2026)" below.
## Completed This Session (June 1 2026)

**Hero image performance — daily-rotating build-time pool**

- ✓ **Root cause** — homepage hero painted only after two serial uncached round trips: `loadHero()` → raw API Gateway `/hero` (never CDN-cached, cold-start-prone, re-fetched the entire Square catalog to pick one painting) → then set `img.src` → second hop to `/image?id=`. Image was also only appended on `onload`, so no progressive paint and the preload scanner never saw it.
- ✓ **`generate-prints.js`** — now also writes `hero-pool.js` to repo root at build time: `window.__HERO_POOL__ = [{img,title}]` for 2025–26 prints (falls back to all prints with images). Picked up by the existing `*.js` S3 sync; regenerated every deploy.
- ✓ **`index.html`** — loads `hero-pool.js`, picks one painting **client-side, rotating daily** (`Math.floor(Date.now()/86400000) % pool.length`), inserts the `<img>` immediately (progressive paint) with `fetchpriority="high"` / `decoding="async"`, reserves a square box to avoid layout shift, and `preconnect`s to davidnicholsonart.com. Old live `/hero` fetch kept as fallback if the pool file is missing. No Lambda change. Net: the only hot-path request is the (CloudFront-cached) image; because everyone gets the same painting on a given day it stays cache-warm.

**SMS opt-in language** — see “SMS — retired” (June 10 2026); toll-free verification flagged opt-in wording, compliant one-time/transactional language drafted.

**Public site styling pass (fair-season, first-time visitors)**

- ✓ **AA contrast (site-wide tokens)** — secondary grays were failing WCAG AA on the `#f8f6f3` bg (`--ink2 #7a8a99` = 3.3:1, `--ink3 #9aa0a8` = 2.4:1). Darkened to **`--ink2 #5e6b78`** (5.06:1) and **`--ink3 #64707c`** (4.69:1) in both `index.html` and `gallery.html`. In gallery modal/cart, the `#a8a39d` micro-labels (size/share/optional/giclée note, 2.2:1 on the `#f5f2ed` sheet) bumped to `#6b6560` (5.1:1).
- ✓ **index.html — container** — kept the original **left-anchored** layout (`margin: 0`, desktop `padding: 0 40px 60px 10%`) per David’s preference; centering was tried (`margin: 0 auto`) and reverted. Added a mobile breakpoint (`@media max-width:600px → padding: 0 20px 60px`) to fix the phone squeeze, which was the real issue.
- ✓ **index.html — primary CTA = Instagram** — under the title, “follow on instagram” is now the filled orange primary, “view gallery” the outline secondary (with arrow). Rationale: business-card scans already land people on the site, so the face-up button adds value by giving a one-tap follow. Hero image still links to gallery. Old `.follow-btn` class renamed `.cta-secondary`.
- ✓ **index.html — staggered load reveal** — repurposed the unused `sk` keyframe into a `reveal` fade-up; staggered across title→about→future→represented→past; gated behind `prefers-reduced-motion`; no-base-opacity so content never gets stuck hidden if animation doesn’t run.
- ✓ **gallery.html — type unified to Jost** — was DM Sans + Playfair Display; switched font link + `--font` token to Jost and retired the `--serif` token (cart/guestbook/product titles now Jost). Homepage and gallery now read as one brand.
- ✓ **gallery.html — staggered reveal** — same `reveal` keyframe applied per year-section as it renders (`revealIdx`, capped at ~0.4s), reduced-motion guarded.
- ✓ **Decision: gallery stays a pure image wall** — no card titles/prices/buttons added (David’s call).
- ✓ **gallery.html — image load resilience** — card images were firing ~40 simultaneous `/image?id=` requests; on a cold cache the proxy (CloudFront → Lambda → Square) throttled and ~1/3 failed, rendering blank with no recovery (refresh “fixed” it by warming the cache). Added `loading="lazy"` + `decoding="async"` to spread the requests, and an `onerror` retry (up to 3×, backoff, cache-busting `retry=N` param) so transient blanks self-heal without a manual refresh. Not caused by the styling pass.

**Files touched:** `index.html`, `generate-prints.js`, `gallery.html` (+ new generated `hero-pool.js`).


-----

## Completed This Session (April 14 2026)

- ✓ **Admin inventory Original column** — now driven by Square `Original Available` attribute; green “sold” badge when false/unset, blank when true; filter chip updated to match
- ✓ **Dashboard Originals Sold/In Stock** — both now use Square `originalAvail` data instead of DynamoDB sales records
- ✓ **`originalAvail` in Lambda `/products`** — `buildProductList` reads Square `Original Available` custom attribute and includes `originalAvail: true/false` on every product
- ✓ **`originalAvail` in Lambda `adminGetPaintings`** — fetches Square catalog in parallel, merges `originalAvail` onto each painting by normalized title match
- ✓ **Gallery modal “original available →” link** — appears below share buttons when `p.originalAvail` is true; links to originals.html; right-aligned orange text with arrow
- ✓ **originals.html renamed “Available Originals”** — title, h1, OG/Twitter tags updated; subtitle is plain text (no link)
- ✓ **originals.html contact link** — “contact” mailto link with painting title as subject and title/medium+dims/price as body, stacked one per line
- ✓ **originals.html click behavior** — thumbnail click opens lightbox; contact click opens mailto; row click does nothing; row no longer shows pointer or hover highlight
- ✓ **originals.html nav** — back arrow links to gallery.html and reads “prints”; instagram button reads “follow on instagram”
- ✓ **originals.html footer** — added “david nicholson” link to index.html
- ✓ **gallery.html footer** — added “available originals” link to originals.html before shipping & returns
- ✓ **Receipt upload feedback** — save button disables and shows “Uploading…” during S3 PUT; zone shows ⏳/✓/✗; PUT response checked for errors
- ✓ **S3 sync receipt bug fixed** — `--exclude "receipts/*"` added to deploy.yml before `--delete`; previous deploys were wiping all uploaded receipts
- ✓ **DynamoDB title corrections** — all 6 painting titles corrected via admin UI
- ✓ **admin-sw.js cache** — bump to `dna-admin-v4` after pushing admin.html changes this session
## Completed This Session (May 22 2026)

- ✓ **Prints tab — show all paintings** — removed filter that required stock > 0 or a print sale; all paintings now appear in the Prints tab regardless of stock (the point is to show what needs to be printed)
- ✓ **🏷 Tags button moved to Inventory tab** — removed from topbar; now sits in the Inventory tab header alongside ↓ CSV and + Add Painting; topbar now only has + Sale and sign out
- ✓ **Sales Log tab** — new fifth tab; filterable table of all sales with date range (from/to), channel (all/art fair/online/gallery), and state (all/KS/MO) filters; summary bar shows sale count, total revenue, and net; CSV export; covers art fair debrief, monthly KS sales tax reporting, and year-end taxes
- ✓ **Art fair state field** — sale modal shows KS/MO state dropdown when channel is “Art fair”; state saved with sale record; shown inline in inventory expand row (e.g. “Art fair · KS”); edit modal restores state correctly
- ✓ **Lambda — state field in sales** — `adminAddSale` and `adminUpdateSale` now destructure and persist `state` field to DynamoDB `dna-sales`
- ✓ **Square auto-sync confirmed** — new paintings added in Square automatically appear in admin Inventory on next load (Lambda `adminGetPaintings` auto-creates DynamoDB records by title match); no sync button needed; Prints tab shows them once they exist in inventory
- ✓ **Admin SW cache key** — bump to `dna-admin-v6` after deploying this session’s admin.html
## Completed This Session (May 21 2026)

- ✓ **index.html — Varied Readings moved to past** — removed from future section; added 2026 year header in past with “varied readings at phoenix gallery” / lawrence, ks; same link (/varied-readings.html), no arrow
- ✓ **index.html — Crossroads Night Market added** — july 3rd, 4th & 5th, kansas city, mo; link to kccrossroads.org/night-market/; future section now ascending: OP art fair → Crossroads
- ✓ **index.html — Phoenix Gallery represented link updated** — now points to /collections/david-nicholson page
- ✓ **SNS carrier registration submitted** — form completed (use case: transactional notifications); was sitting incomplete since March 19; check back in ~1 week
- ✓ **List cleanup** — removed: admin token auth, www→apex redirect, print wall configurator, color picker, art fair mode enhancements, DynamoDB migration, CloudFront Pro (already done); mileage bug confirmed resolved
## Completed This Session (May 9 2026)

- ✓ **Dual pricing** — second “Large (≥30”) / sq in” rate field in inventory rate bar; if either dimension ≥ 30, `effectiveRate(p)` uses `rateLarge` instead of `rate`; both rates saved to DynamoDB `__config__`; inventory table, sort, CSV export, and price tags all use effective rate per painting
- ✓ **Rate bar inputs** — changed from number spinners to plain text fields (`inputmode="decimal"`); larger, squarish, centered text
- ✓ **Sale → stock decrement** — logging a new print sale (large or small) decrements that size’s stock count by 1 immediately; no floor (can go negative); edit-sale does not touch stock
- ✓ **🏷 Tags button** — prints Avery 5371/5871 price tags (3.5×2”, 10/sheet) for all currently-available originals; shows title, year, medium + “ on canvas” (appended only if not already present), dimensions, original price; skips sold originals
- ✓ **Medium in adminGetPaintings** — `medium` field from Square `Medium` custom attribute now correctly merged onto existing DynamoDB painting records (was missing from the `.map()` return; only auto-created records had it)
- ✓ **Medium display logic** — appends “ on canvas” if Square `Medium` value doesn’t already contain “on canvas”; falls back to “oil on canvas” if attribute is empty
- ✓ **Admin SW cache key** — bumped to `dna-admin-v5`
## Completed This Session (May 4 2026)

- ✓ **Prints tab** — new fourth tab in admin.html; four separate tables by stock tier (Out of Stock / Low Stock / Below Goal / Stocked); ranked by popularity score (70% sales volume, 30% recency) within each tier; “Zero stock only” checkbox filters to both-sizes-at-zero; column header click collapses to flat sortable table with “✕ Clear sort” to return; Print Lg/Print Sm columns show quantity needed to reach goal (2 large, 3 small); stock in red when below goal
- ✓ **Dashboard top print cards** — two new cards: Top Large Print and Top Small Print, showing title and units sold; show “—” when no sales recorded yet
## Completed This Session (April 15 2026)

- ✓ **Receipt lightbox** — tapping 📎 receipt now opens an in-app lightbox instead of navigating away; image receipts show inline; PDF receipts show Open in browser link; close via ✕ button, backdrop tap, or Escape key
- ✓ **Receipt share sheet** — ⬆️ Share button in lightbox fetches receipt as blob and invokes native iOS share sheet (`navigator.share({ files })`); supports both JPG and PDF; falls back to URL share then window.open
- ✓ **Google brand exclusion** — “David Nicholson” brand approved and applied as exclusion on Performance Max campaign
- ✓ **Google Merchant Center feed** — manual fetch triggered; product type warnings cleared
- ✓ **2026 receipts** — all 23 expense records updated with receipts via admin PWA
- ✓ **Receipt persistence** — confirmed receipts survive deploy (S3 sync bug was the cause, now fixed)
## Previously Completed — originals.html & Square attributes

- ✓ **`originals.html`** — new page listing available original paintings; light theme, year sections, thumbnail rows with medium/dimensions/price, fullscreen lightbox with swipe nav, contact mailto link
- ✓ **Lambda `/originals` endpoint** — filters Square catalog for items where `Original Available` custom attribute is true; reads `Width`, `Height`, `Medium`, `Year` from Square custom attributes; calculates price from `width × height × rate` (rounded to nearest $50) using admin config rate from DynamoDB
- ✓ **Square custom attributes created** — `Width (in)`, `Height (in)`, `Medium`, `Original Available` (toggle); all paintings being filled in
- ✓ **Square title standardization** — all 6 DynamoDB titles corrected to match Square canonical names


-----

## Previously Completed — Site-wide light theme & gallery redesign

- ✓ **Google Performance Max campaign launched** — $5/day, Maximize Conversion Value, US only
- ✓ **Gallery redesign** — masonry columns (3 desktop / 2 mobile), natural image proportions, white mat/padding effect on cards
- ✓ **Gallery year sections** — chronological year sections; sidebar and mobile bar are anchor jump-nav with scroll spy
- ✓ **Site-wide light theme** — gallery.html, index.html, varied-readings.html (kiosk.html stays dark)
  - Palette: `--bg: #f8f6f3`, `--ink: #1a2a3a`, `--ink2: #7a8a99`, `--ink3: #9aa0a8`, `--accent: #e07030`
- ✓ **shipping.html** — full light theme; consistent nav and footer
- ✓ **index.html footer full-bleed** — removed max-width constraint; added shipping & returns link
- ✓ **Guestbook modal** — rounded corners (16px) and orange submit button consistent across all pages
- ✓ `varied-readings.html` created — Varied Readings show page, April 24, 2026, Phoenix Gallery Lawrence KS
- ✓ Pinterest share buttons added to gallery.html product modal
- ✓ Per-product /prints/ pages implemented
- ✓ Pinterest Verified Merchant — ✓ verified April 2026
- ✓ CloudFront Pro upgrade — ✓ April 2026; 25-behavior limit no longer a constraint
