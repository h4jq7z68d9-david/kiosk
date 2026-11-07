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
   Editable: part overview (sub, sum, bul) and work slides (det, lead, look, bul).

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

const readFiles = () => CFG.dataFiles.map((name) => ({ name, src: fs.readFileSync(path.join(DIR, name), 'utf8') }));
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
let last = null;            // the last save's result, shown on every page
let busy = Promise.resolve();

async function save(body) {
  const files = readFiles();
  if (body.rev !== revOf(files)) {
    return { ok: false, stale: true, error: 'The data file changed on disk after this page was loaded. Nothing was saved. Reload the page and make the edit again.' };
  }
  const values = body.values || {};
  const patched = E.patch(files, body.id, values);
  if (!patched.changed.length) return { ok: true, changed: [], note: 'No changes to save.' };
  E.verify(files, body.id, values, patched);
  fs.writeFileSync(path.join(DIR, patched.name), patched.src);
  const build = await run(['tools/study/build-course.js', SLUG]);
  const check = build.code === 0 ? await run(['tools/site/check.js', SLUG]) : null;
  const r = { ok: true, id: body.id, file: path.relative(ROOT, path.join(DIR, patched.name)), changed: patched.changed, build, check, at: new Date().toLocaleTimeString() };
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
      const loc = E.locate(files, u.searchParams.get('id') || '');
      if (!loc) return json(res, 200, { editable: false, last });
      return json(res, 200, { editable: true, kind: loc.kind, file: path.relative(ROOT, path.join(DIR, loc.file)), values: E.current(loc), rev: revOf(files), last });
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

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`port ${PORT} is in use: another editor may be running (stop it with Ctrl-C in its terminal), or pass --port 8771`);
  else console.error(e.message);
  process.exit(1);
});
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Slide editor for ${CFG.name}: http://localhost:${PORT}${HOME}`);
  console.log(`Saves write to ${path.relative(ROOT, DIR)}/ (${CFG.dataFiles.join(', ')}) on branch ${branch()}. Stop with Ctrl-C.`);
});
function branch() { try { return require('child_process').execSync('git branch --show-current', { cwd: ROOT, encoding: 'utf8' }).trim() || '(detached)'; } catch (e) { return '(unknown)'; } }
