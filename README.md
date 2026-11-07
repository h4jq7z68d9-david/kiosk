# kiosk

Code for davidnicholsonart.com and the art-fair kiosk. Current state, infrastructure and the session workflow are in `Kiosk-Project-Summary.md`; history is in `CHANGELOG.md`.

## Slide editor (local only, never deployed)

A local tool for reviewing and editing a study course's text in the real page layout, with the real image. It runs on your own computer, on a course's install branch, before that branch goes to `main`.

**What it is**

- `tools/study/edit-server.js` is a small local web server. It serves the built course pages from the repo and adds an editor panel to them as it sends them to the browser. The pages on disk are not changed.
- `tools/study/editor/` holds the editor itself (`editor.js`, `editor.css`) and the code that writes the course files (`source-edit.js`).
- Every page of the course is editable:
  - course home: subtitle, intro paragraph, images note (settings file `tools/study/courses/<slug>.json`)
  - part overview: subtitle, overview text, bullets, terms
  - work pages: artist, date, details line, lead, Look-at bullets, history bullets, and subject, terms and quotation where the course has them
  - theme and text pages: their statement, paragraph or summary, bullets and terms
  - sources page: intro, group headings and each entry (entries show their HTML as written, e.g. `&ldquo;`)
  - credits page: the intro only
- Not editable: titles (they set page URLs and file names) and the credit entries for each image.
- **Edit page** makes that page's text editable in place. In a list, Enter adds an item and Backspace in an empty item removes it.
- **Save** (or Cmd-S) writes the changed fields into the course files exactly as typed, changing nothing else in the files. It then runs `node tools/study/build-course.js <slug>` and `node tools/site/check.js <slug>` and reloads the slide. check.js errors and warnings are shown in the panel, on every page, until the next save.
- **Discard** reloads the page without saving.
- If the data file was changed on disk after the page was opened, Save refuses and nothing is written.
- Google Analytics tags are removed from the pages it serves, so editing sends no page views.

**Start**

One-time setup on a Mac with git and Node: `git clone https://github.com/h4jq7z68d9-david/kiosk.git ~/kiosk`.

From the repo root, on the course's branch (for example `install-impressionism`):

```
node tools/study/edit-server.js <course-slug>
```

Then open the address it prints, e.g. `http://localhost:8770/study/art-history/impressionism.html`. To use another port, add `--port 8771`.

**Stop**

Press Ctrl-C in the terminal where it is running. If that terminal is closed, run `pkill -f edit-server.js`.

**It never ships**

- The built pages never reference the editor. The server adds it only to what it sends to your browser.
- `.github/workflows/deploy.yml` excludes `tools/study/edit-server.js` and `tools/study/editor/*` from the S3 upload.
- `tools/site/check.js` fails if that exclusion is removed, or if any built page references `/__edit/`.
- The server listens on 127.0.0.1 only, and accepts saves only from its own editor page.

After editing, the course files on the branch hold your wording. Commit it on the branch and rerun `node tools/site/check.js` and `tools/site/smoke.js` before the branch goes to `main` (runbook: `study-site-builder` section 9.9).
