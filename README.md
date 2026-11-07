# kiosk

Code for davidnicholsonart.com and the art-fair kiosk. Current state, infrastructure and the session workflow are in `Kiosk-Project-Summary.md`; history is in `CHANGELOG.md`.

## Slide editor (local only, never deployed)

A local tool for reviewing and editing a study course's text in the real page layout, with the real image. It runs on your own computer, on a course's install branch, before that branch goes to `main`.

**What it is**

- `tools/study/edit-server.js` is a small local web server. It serves the built course pages from the repo and adds an editor panel to them as it sends them to the browser. The pages on disk are not changed.
- `tools/study/editor/` holds the editor itself (`editor.js`, `editor.css`) and the code that writes the data file (`source-edit.js`).
- Editable text: the part overview (subtitle `sub`, overview `sum`, bullets `bul`) and each work page (`det`, `lead`, the `look` bullets, the history bullets `bul`). Titles, artist and date are not editable here because they set the page URLs.
- **Edit slide** makes that slide's text editable in place. Enter adds a bullet. Backspace in an empty bullet removes it.
- **Save** (or Cmd-S) writes the changed fields into the course's data file exactly as typed, changing nothing else in the file. It then runs `node tools/study/build-course.js <slug>` and `node tools/site/check.js <slug>` and reloads the slide. check.js errors and warnings are shown in the panel, on every page, until the next save.
- **Discard** reloads the slide without saving.
- If the data file was changed on disk after the page was opened, Save refuses and nothing is written.
- Google Analytics tags are removed from the pages it serves, so editing sends no page views.

**Start**

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

After editing, the course's data file on the branch holds your wording. Commit it on the branch and rerun `node tools/site/check.js` and `tools/site/smoke.js` before the branch goes to `main` (runbook: `study-site-builder` section 9.9).
