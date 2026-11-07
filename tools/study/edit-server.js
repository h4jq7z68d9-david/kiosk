#!/usr/bin/env node
/* Local slide editor for a study course. Never deployed, never part of the built site.

   Start (repo root, on the course's install branch):   node tools/study/edit-server.js <course-slug> [--port 8770]
   Open:  http://localhost:8770/      Stop: Ctrl-C in that terminal

   Serves the repo's built pages as they are on disk and, only in what it sends to the browser,
   adds the editor (tools/study/editor/editor.js + editor.css) to this course's pages and removes the
   Google Analytics tags, so editing sends no page views. Nothing on disk is changed except by Save.

   Save (one slide at a time) writes the changed fields back into the course's data file, word for word,
   changing only those values; then runs  node tools/study/build-course.js <slug>  and
   node tools/site/check.js <slug>  and returns both outputs to the editor, which reloads the slide.
   Editable: the text of every page of the course (course home, part overviews, work, theme and text
   pages, sources page, credits intro), including titles and section names; not the per-image credit entries.
   A title or section-name change moves pages to new URLs. The server then fixes the redirects in the
   course's retired-urls.tsv: lines that pointed at a moved page point at its new URL, and a moved page that
   is already live (present on origin/main) gets a new line from its old URL, so links to it keep working.

   Stop (Ctrl-C): if anything was saved, the server commits it and pushes the branch to GitHub, never main.
   On main (a published course) it first moves the edits to a new branch edits-<slug>. --no-send skips this.
   Start it with  edit-course <slug>  (tools/study/edit-course.zsh), which picks the branch.

   Listens on 127.0.0.1 only. deploy.yml excludes this file and tools/study/editor/ from the S3 upload. */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');
const E = require('./editor/source-edit.js');

const ROOT = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const pi = args.indexOf('--port');
const PORT = pi >= 0 ? Number(args[pi + 1]) : 8770;
const SLUG = args.filter((a, i) => !a.startsWith('--') && !(pi >= 0 && i === pi + 1))[0];
if (!(PORT > 0 && PORT < 65536)) { console.error('--port needs a number'); process.exit(1); }
if (!SLUG || !/^[a-z0-9-]+$/.test(SLUG)) { console.error('usage: node tools/study/edit-server.js <course-slug> [--port 8770]'); process.exit(1); }
const CFG_FILE = path.join(ROOT, 'tools/study/courses', SLUG + '.json');
if (!fs.existsSync(CFG_FILE)) { console.error('no settings file: ' + path.relative(ROOT, CFG_FILE)); process.exit(1); }
const CFG = JSON.parse(fs.readFileSync(CFG_FILE, 'utf8'));
const BASE = (CFG.basePath || '/study/art-history').replace(/\/$/, '');
const COURSE = BASE + '/' + SLUG;                 // URL path of the course folder
const HOME = COURSE + '.html';
const DIR = path.join(ROOT, COURSE);
const EDITOR_DIR = path.join(__dirname, 'editor');
if (!fs.existsSync(path.join(ROOT, HOME))) { console.error(`${HOME} is not built yet: run node tools/study/build-course.js ${SLUG}`); process.exit(1); }

/* every file a save may write, as repo-relative names */
const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');
function readFiles() {
  const list = CFG.dataFiles.map((n) => ({ name: rel(path.join(DIR, n)), role: 'data' }));
  if (fs.existsSync(path.join(DIR, 'sources.js'))) list.push({ name: rel(path.join(DIR, 'sources.js')), role: 'sources' });
  list.push({ name: rel(CFG_FILE), role: 'settings' });
  return list.map((f) => Object.assign(f, { src: fs.readFileSync(path.join(ROOT, f.name), 'utf8') }));
}
const revOf = (files) => crypto.createHash('sha1').update(files.map((f) => f.name + '\0' + f.src).join('\0')).digest('hex').slice(0, 16);

/* ---------- running build and check ---------- */
function run(cmd) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, cmd, { cwd: ROOT });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { out += d; });
    p.on('close', (code) => resolve({ cmd: 'node ' + cmd.join(' '), code, out: out.trim() }));
  });
}
/* id → URL of every page, from the built index.js */
function pageUrls() {
  const f = path.join(DIR, 'index.js');
  if (!fs.existsSync(f)) return {};
  const ctx = {}; require('vm').runInNewContext(fs.readFileSync(f, 'utf8'), { window: ctx });
  const m = {}; ((ctx.GUIDE && ctx.GUIDE.items) || []).forEach((it) => { m[it.id] = it.url; });
  return m;
}
/* is this URL live: is the file on origin/main in this clone? */
function live(url) {
  const r = require('child_process').spawnSync('git', ['cat-file', '-e', 'origin/main:' + url.replace(/^\//, '')], { cwd: ROOT });
  return r.status === 0;
}
/* After pages moved: retarget and extend retired-urls.tsv. Returns [{ from, to, redirect }]. */
function fixRedirects(before, after) {
  const moves = Object.keys(after).filter((id) => before[id] && before[id] !== after[id]).map((id) => ({ from: before[id], to: after[id] }));
  if (!moves.length) return moves;
  const file = path.join(DIR, 'retired-urls.tsv');
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : 'old\tredirect to\n';
  const lines = text.split(/\r?\n/), head = lines[0];
  let rows = lines.slice(1).filter((l) => l.trim()).map((l) => l.split('\t').map((x) => x.trim()));
  for (const mv of moves) {
    rows.forEach((r) => { if (r[1] === mv.from) r[1] = mv.to; });
    mv.redirect = live(mv.from);
    if (mv.redirect && !rows.some((r) => r[0] === mv.from)) rows.push([mv.from, mv.to]);
  }
  const current = new Set(Object.values(after));
  rows = rows.filter((r) => !current.has(r[0]));                    // a URL in use again is a page, not a redirect
  const to = new Map(rows.map((r) => [r[0], r[1]]));
  rows.forEach((r) => { let t = r[1], n = 0; while (to.has(t) && n++ < 50) t = to.get(t); r[1] = t; });   // no redirect chains
  fs.writeFileSync(file, [head, ...rows.map((r) => r.join('\t'))].join('\n') + '\n');
  return moves;
}

let last = null;            // the last save's result, shown on every page
let busy = Promise.resolve();

async function save(body) {
  const files = readFiles();
  if (body.rev !== revOf(files)) {
    return { ok: false, stale: true, error: 'The data file changed on disk after this page was loaded. Nothing was saved. Reload the page and make the edit again.' };
  }
  const patched = E.patch(files, body.id, body.values || {});
  if (!patched.changed.length) return { ok: true, changed: [], note: 'No changes to save.' };
  E.verify(files, patched);
  const urlsBefore = pageUrls();
  for (const f of patched.files) fs.writeFileSync(path.join(ROOT, f.name), f.src);
  /* pages first, to learn any new URLs; then fix retired-urls.tsv; then the full build with the stubs */
  let build = await run(['tools/study/build-course.js', SLUG, '--no-stubs']);
  let moves = [];
  if (build.code === 0) {
    moves = fixRedirects(urlsBefore, pageUrls());
    build = await run(['tools/study/build-course.js', SLUG]);
  }
  const check = build.code === 0 ? await run(['tools/site/check.js', SLUG]) : null;
  const r = { ok: true, id: body.id, file: patched.files.map((f) => f.name).join(', '), changed: patched.changed, moves, url: pageUrls()[body.id] || null, build, check, at: new Date().toLocaleTimeString() };
  last = r;
  const status = build.code !== 0 ? 'BUILD FAILED' : (check.code === 0 ? 'check PASS' : 'check FAIL');
  console.log(`${r.at}  saved ${body.id} (${patched.changed.join(', ')}) in ${r.file}: ${status}`);
  return r;
}

/* ---------- static files ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon', '.webp': 'image/webp' };
const isCoursePage = (u) => u === HOME || (u.startsWith(COURSE + '/') && u.endsWith('.html'));

function sendFile(res, file, urlPath) {
  const ext = path.extname(file).toLowerCase();
  let data = fs.readFileSync(file);
  if (ext === '.html') {
    let html = data.toString('utf8')
      .replace(/<script async src="https:\/\/www\.googletagmanager\.com\/[^"]*"><\/script>\s*/g, '')
      .replace(/<script>window\.dataLayer=[^<]*<\/script>\s*/g, '');
    if (isCoursePage(urlPath)) {
      html = html.replace('</head>', '<link rel="stylesheet" href="/__edit/editor.css">\n</head>')
        .replace('</body>', '<script src="/__edit/editor.js"></script>\n</body>');
    }
    data = Buffer.from(html);
  }
  res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(data);
}
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };

const server = http.createServer((req, res) => {
  let u;
  try { u = new URL(req.url, 'http://localhost'); } catch (e) { res.writeHead(400); return res.end(); }
  const p = decodeURIComponent(u.pathname);

  if (p === '/__edit/api/slide' && req.method === 'GET') {
    try {
      const files = readFiles();
      const pf = E.pageFields(files, u.searchParams.get('id') || '');
      if (!pf || !pf.fields.length) return json(res, 200, { editable: false, last });
      const names = [...new Set(pf.fields.map((x) => x.file))];
      return json(res, 200, { editable: true, kind: pf.kind, format: pf.format || null, file: names.join(', '), fields: E.publicFields(pf), rev: revOf(files), last });
    } catch (e) { return json(res, 500, { editable: false, error: e.message, last }); }
  }
  if (p === '/__edit/api/save' && req.method === 'POST') {
    /* only the editor on this server may save (blocks other sites open in the same browser) */
    const origin = req.headers.origin || '';
    if (req.headers['x-edit'] !== '1' || (origin && origin !== `http://${req.headers.host}`)) return json(res, 403, { ok: false, error: 'forbidden' });
    let body = '';
    req.on('data', (d) => { body += d; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      busy = busy.then(async () => {
        try { json(res, 200, await save(JSON.parse(body))); }
        catch (e) { json(res, 200, { ok: false, error: e.message }); }
      });
    });
    return;
  }
  if (p === '/__edit/editor.js' || p === '/__edit/editor.css') return sendFile(res, path.join(EDITOR_DIR, path.basename(p)), p);
  if (p === '/' || p === '') { res.writeHead(302, { Location: HOME }); return res.end(); }

  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT + path.sep) || p.split('/').some((s) => s.startsWith('.'))) { res.writeHead(403); return res.end('forbidden'); }
  let f = file;
  try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch (e) { /* 404 below */ }
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('not found: ' + p); }
  sendFile(res, f, p);
});

/* ---------- on stop: commit the edits and push the branch (never main) ---------- */
function sendEdits() {
  const { spawnSync } = require('child_process');
  const git = (args, inherit) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: inherit ? 'inherit' : 'pipe' });
  const st = git(['status', '--porcelain']);
  if (st.status !== 0) { console.log('git status failed; your edits are still in the files. Tell Claude.'); return; }
  if (!st.stdout.trim()) { console.log('No edits to send.'); return; }
  let br = git(['branch', '--show-current']).stdout.trim();
  if (!br || br === 'main') {
    const t = 'edits-' + SLUG;
    if (git(['checkout', '-q', '-B', t]).status !== 0) { console.log(`Could not make branch ${t}; your edits are still in the files. Tell Claude.`); return; }
    br = t;
  }
  if (!/^(edits|install)-/.test(br)) { console.log(`On branch ${br}: edits left uncommitted. Tell Claude.`); return; }
  git(['add', '-A']);
  const who = git(['config', 'user.email']).stdout.trim() ? [] : ['-c', 'user.name=David Nicholson', '-c', 'user.email=h4jq7z68d9-david@users.noreply.github.com'];
  if (git([...who, 'commit', '-q', '-m', `Edits to ${CFG.name} from the slide editor`]).status !== 0) { console.log('Commit failed; your edits are still in the files. Tell Claude.'); return; }
  console.log(`Committed your edits on ${br}. Sending to GitHub…`);
  if (git(['push', '-q', '-u', 'origin', br], true).status !== 0) {
    console.log(`Not sent: the push failed. Your edits are safe in the commit on ${br}. Run  git push -u origin ${br}  or tell Claude.`);
    return;
  }
  console.log(`Sent. Tell Claude: "my edits are on ${br}".`);
}
let stopping = false;
function stop() {
  if (stopping) return; stopping = true;
  console.log('\nStopping the editor.');
  server.close();
  busy.then(() => { if (!args.includes('--no-send')) sendEdits(); process.exit(0); });
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`port ${PORT} is in use: another editor may be running (stop it with Ctrl-C in its terminal), or pass --port 8771`);
  else console.error(e.message);
  process.exit(1);
});
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Slide editor for ${CFG.name}: http://localhost:${PORT}${HOME}`);
  console.log(`Saves write to ${readFiles().map((f) => f.name).join(', ')} on branch ${branch()}. Stop with Ctrl-C.`);
});
function branch() { try { return require('child_process').execSync('git branch --show-current', { cwd: ROOT, encoding: 'utf8' }).trim() || '(detached)'; } catch (e) { return '(unknown)'; } }
