# Study section: one-layout design brief

Written Oct 27 2026 for the art business project. Status: decided by David, not started. Branch: `generalize-study-generator` (the generalized generator it builds on).

## Why

Today the study section has two layouts built by two systems:

- **The guide** (`classical-myth.html`): a one-page slide viewer. Its layout CSS is copied out of the viewer file and embedded inside each generated page at build time. Only colors, fonts and site chrome are linked (`site-tokens.css`, `site-bar.js`, `site-chrome.js`) and update live.
- **The separate pages** (part and work pages, for Google): a different, scrolling layout styled by `study/study.css`. David finds they lose the charm of the guide.

Consequences: a layout restyle means editing a viewer file and rebuilding every course; the two page types drift apart. David's rule: **a style change must reach every page of every course from one edit, never page by page.**

## What David wants

1. Every slide is a **real page** that search engines can index, with the full content in the HTML.
2. It keeps **the look David likes** in the guide:
   - outline/navigation down the left;
   - search bar across the top;
   - image panel at left, notes at right;
   - Prev/Next bar at the bottom, with the counter and the Bookmark button.
3. **All styling in shared linked files.** Generated pages carry no `<style>` blocks and no color or font literals.
4. Bookmarks that are **easy to find and open** (see below).

## Design

- **One page per slide.** Overview (the part page), work, theme and text slides each get their own URL, in the slide layout. Existing indexed URLs (course home, part pages, work pages, credits, sources) do not change. Theme and text slides, now anchors on part pages, get their own pages.
- **One stylesheet for all courses.** Extract the guide's layout CSS from `tools/study/classical-myth-viewer.html` into `study/study.css` (or a sibling file) and make every generated page link it. Colors and fonts stay mapped to `site-tokens.css`. Per-course accents (Classical Myth's Greek-key divider) are an opt-in class set from the course settings file, not inline CSS.
- **One shared script, `study/guide.js`**, loaded by every page. It builds the outline rail, search, bookmarks, keyboard arrows, swipe and the full-screen image view from a per-course index file (below). No per-course viewer file.
- **Per-course index** (generated, e.g. `study/art-history/<slug>/index.js`): for every slide, its id, URL, part, kind, title, artist, date, thumbnail key, and the search text (titles, artists, dates, made-for line, summary, bullets, terms, quotes). Search behaves as it does now: accent-insensitive, all words must match, title and artist matches first, result rows with thumbnail and highlighted snippet.
- **Outline rail built by script from the index**, with the current item highlighted and scrolled into view, and its scroll position and collapsed state remembered across page loads (sessionStorage and localStorage, in try/catch). Crawl paths for search engines stay in static HTML: breadcrumbs, part link, Prev/Next links with `rel="prev"` and `rel="next"`, the part page's list of works, and the sitemap.
- **Prev/Next are plain links.** Add prefetch of the next and previous page, and the View Transitions API where supported, so page changes feel close to the old instant swap. Treat both as progressive enhancement.
- **Back button** is the browser's own: no custom history code.
- **Intro text** (the start slide) comes from the course settings file or the course data, not from a viewer file. Course settings (`tools/study/courses/<slug>.json`) stay as built on the branch.
- **Old links:** keep a small script on the course home that maps an old `#hN-M` hash to the new page URL. Do not auto-redirect visitors who arrive without a hash. Do not hide content from search engines that visitors see.

## Bookmarks (David could not find his saved slides)

Tested Oct 27 2026 in headless Chromium against the current code: saving, listing, clicking through and surviving a reload all work on desktop. The weak points are discoverability and scope:

- On desktop the saved list is a small gray "BOOKMARKS" heading at the top of the left rail. It disappears from view whenever the rail is scrolled down.
- On phones and portrait iPads (900 px and below) the rail is hidden. The saved slides are only a "Bookmarks" group inside the "Jump to slide" dropdown, and the Bookmark button is icon-only.
- Bookmarks live in one browser on one device (localStorage). A different device, browser or private window shows none, and nothing says so.

What happens today when you skip around or come back (Certain: read from the code and tested): a bookmark is a **pin on one slide**, kept in a list; skipping to other slides does not remove it (the test read a slide far from both pins and the list still showed them). The page address records the slide you are on, so a reload stays there, but opening the course fresh starts at "About this site". Nothing resumes where you left off, and nothing jumps you to a bookmark.

So there are two separate needs, and the new design covers both:

- **Saved slides** (several pins): the list and panel below.
- **Continue where you left off** (one automatic place-marker): remember the last slide read in each course (localStorage, by slide id). On the course home and at the top of the "Saved" panel, show a "Continue: <slide title>" link. Never redirect automatically: the course home URL must always show the same page to everyone, search engines included.

Required in the new design:

- A **"Saved (n)" button beside the search bar on every page and every screen size**, with the count. It opens a panel listing the saved slides, each a link to its page, with a remove control.
- The button label on the page bar reads "Bookmark" / "Bookmarked", with the icon plus text on phones too if it fits.
- The panel says plainly: "Saved in this browser only."
- Keep the desktop rail section as a convenience if it fits; the panel is the main route.
- Key bookmarks by slide id (work key), as now, so they survive reordering. Drop saved entries that no longer exist.

## Acceptance checks

1. **Content unchanged:** every slide's text in the new pages matches the data files (diff the text extracted from old and new pages for Classical Myth).
2. **No page-by-page styling:** `grep -l "<style" ` over generated pages returns nothing; no color or font literals in generated HTML. Then change one token in `site-tokens.css` locally and confirm it shows on the course home, a part page and a work page with no rebuild.
3. **Indexable:** every slide URL is in the sitemap, has a unique title, meta description, canonical, Open Graph and JSON-LD (as now), and its full text is in the HTML with JavaScript off.
4. **Navigation:** outline, search, Prev/Next, keyboard, swipe and the full-screen image all work at 1440, 820 and 390 px, light and dark.
5. **Bookmarks:** save on one page, find it through "Saved (n)" from another page, open it, reload, remove it; at 1440 and 390 px.
6. **Second course:** build a throwaway second course from the same generator and confirm nothing in it is Classical Myth specific.
7. Run the static checks from course-study-pack Public mode.

## Process

- Work on a branch from `generalize-study-generator`. **Prototype one work page and the shared CSS first and show David** (screenshots at desktop and phone width) before regenerating anything.
- Do not merge to `main` without David's approval; merging deploys.
- Every `admin.html` or service-worker rule in `dna-kiosk-conventions` still applies if those files are touched (they should not be).

## Open points (defaults in bold)

- Outline: **built by script from the index**, rather than 230 links in every page's HTML.
- Classical Myth: **rebuilt in the new layout before Impressionism is built**, so there is one layout from the start.
- Keep an instant, no-reload slide swap as a later enhancement: **only if the prefetch and View Transitions version feels slow.**
