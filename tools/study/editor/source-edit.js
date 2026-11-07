/* Local slide editor, part 1: find a page's text fields in the course files and rewrite only those fields.
   Used by tools/study/edit-server.js. Never deployed (deploy.yml excludes tools/study/editor/).

   Course text lives in three kinds of file:
     data files (dataFiles in the settings)  window.SITE = {…}  and  SITE.handouts.push({…})
     sources.js                              window.SOURCES = {…}
     tools/study/courses/<slug>.json         settings: course-home and credits-page text
   They are JavaScript object literals in two styles: JSON-like (double quotes, quoted keys) and
   hand-written (single quotes, bare keys, inline arrays). This file parses them with source positions,
   so a save replaces the exact characters of the changed values and leaves every other byte of the
   file (comments, spacing, quote style, untouched fields) as it was. After patching, verify() reloads
   every file and checks that the only difference is the edited fields.

   Page ids are the built page's <body data-id>: "start" (course home), "h<n>-0" (part overview),
   the work key (work page), "h<n>-<i>" (theme or text slide i), "sources", "credits".
   Titles are never editable here: they set page URLs. Credits entries are not editable here. */
'use strict';
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);

/* ---------- parser: object literals with positions ---------- */
function Parser(src) { this.s = src; this.i = 0; }
Parser.prototype.fail = function (msg) {
  const line = this.s.slice(0, this.i).split('\n').length;
  throw new Error(`${msg} at line ${line}`);
};
Parser.prototype.ws = function () {
  const s = this.s;
  for (;;) {
    while (this.i < s.length && /\s/.test(s[this.i])) this.i++;
    if (s.startsWith('//', this.i)) { const e = s.indexOf('\n', this.i); this.i = e < 0 ? s.length : e + 1; continue; }
    if (s.startsWith('/*', this.i)) { const e = s.indexOf('*/', this.i + 2); if (e < 0) this.fail('unclosed comment'); this.i = e + 2; continue; }
    return;
  }
};
Parser.prototype.value = function () {
  this.ws();
  const c = this.s[this.i];
  if (c === '{') return this.obj();
  if (c === '[') return this.arr();
  if (c === '"' || c === "'" || c === '`') return this.str();
  const m = /^(-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|true|false|null|undefined)/.exec(this.s.slice(this.i, this.i + 40));
  if (!m) this.fail(`unexpected "${c}"`);
  const start = this.i; this.i += m[1].length;
  const t = m[1];
  return { type: 'lit', start, end: this.i, value: t === 'undefined' ? undefined : JSON.parse(t) };
};
Parser.prototype.str = function () {
  const s = this.s, q = s[this.i], start = this.i++;
  let v = '';
  for (;;) {
    if (this.i >= s.length) this.fail('unclosed string');
    const c = s[this.i++];
    if (c === q) break;
    if (q === '`' && c === '$' && s[this.i] === '{') this.fail('template literal with ${} cannot be edited');
    if (c !== '\\') { if (c === '\n' && q !== '`') this.fail('newline in string'); v += c; continue; }
    const e = s[this.i++];
    const simple = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
    if (e in simple && !(e === '0' && /\d/.test(s[this.i]))) v += simple[e];
    else if (e === 'x') { v += String.fromCharCode(parseInt(s.substr(this.i, 2), 16)); this.i += 2; }
    else if (e === 'u' && s[this.i] === '{') { const k = s.indexOf('}', this.i); v += String.fromCodePoint(parseInt(s.slice(this.i + 1, k), 16)); this.i = k + 1; }
    else if (e === 'u') { v += String.fromCharCode(parseInt(s.substr(this.i, 4), 16)); this.i += 4; }
    else if (e === '\r') { if (s[this.i] === '\n') this.i++; }
    else if (e === '\n' || e === LS || e === PS) { /* line continuation */ }
    else v += e;
  }
  return { type: 'str', start, end: this.i, value: v, quote: q };
};
Parser.prototype.arr = function () {
  const start = this.i++, items = [];
  for (;;) {
    this.ws();
    if (this.s[this.i] === ']') { this.i++; break; }
    items.push(this.value());
    this.ws();
    if (this.s[this.i] === ',') { this.i++; continue; }
    if (this.s[this.i] !== ']') this.fail('expected , or ]');
  }
  return { type: 'arr', start, end: this.i, items, value: items.map((n) => n.value) };
};
Parser.prototype.obj = function () {
  const start = this.i++, props = [];
  for (;;) {
    this.ws();
    if (this.s[this.i] === '}') { this.i++; break; }
    const keyStart = this.i;
    let key, quoted = false;
    const c = this.s[this.i];
    if (c === '"' || c === "'") { key = this.str().value; quoted = c; }
    else {
      const m = /^[A-Za-z_$][\w$]*|^\d+/.exec(this.s.slice(this.i, this.i + 80));
      if (!m) this.fail('expected a property name');
      key = m[0]; this.i += key.length;
    }
    const keyEnd = this.i;
    this.ws();
    if (this.s[this.i] !== ':') this.fail('expected :');
    this.i++;
    const value = this.value();
    props.push({ key, keyStart, keyEnd, quoted, value });
    this.ws();
    if (this.s[this.i] === ',') { this.i++; continue; }
    if (this.s[this.i] !== '}') this.fail('expected , or }');
  }
  const value = {}; for (const p of props) value[p.key] = p.value.value;
  return { type: 'obj', start, end: this.i, props, value };
};

/* The top-level objects in one course file: `window.X = {…}` for X in SITE / SOURCES / CREDITS, and the
   arguments of `SITE.handouts.push(…)`. Strings and comments are skipped while looking for them. */
function rootsIn(src, name) {
  const out = { handouts: [], SOURCES: null };
  const p = new Parser(src);
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) { p.i = i; p.ws(); i = p.i; continue; }
    if (c === '"' || c === "'" || c === '`') { p.i = i; p.str(); i = p.i; continue; }
    const prev = src[i - 1] || ' ';
    if (/[A-Z]/.test(c) && !/[\w$]/.test(prev)) {
      const rest = src.slice(i, i + 40);
      const isWindow = prev === '.' && src.slice(i - 7, i) === 'window.';
      let m;
      if ((prev !== '.' || isWindow) && (m = /^(SITE|SOURCES|CREDITS)\s*=\s*/.exec(rest))) {
        p.i = i + m[0].length;
        const v = p.value();
        if (v.type !== 'obj') throw new Error(`${name}: ${m[1]} is not an object`);
        if (m[1] === 'SITE') { const h = prop(v, 'handouts'); if (h && h.value.type === 'arr') h.value.items.forEach((n) => out.handouts.push(n)); }
        if (m[1] === 'SOURCES') out.SOURCES = v;
        i = p.i; continue;
      }
      if (prev !== '.' && (m = /^SITE\.handouts\.push\s*\(/.exec(rest))) {
        p.i = i + m[0].length;
        for (;;) {
          const v = p.value();
          if (v.type === 'obj') out.handouts.push(v);
          p.ws();
          if (src[p.i] === ',') { p.i++; continue; }
          if (src[p.i] !== ')') p.fail(`${name}: expected ) after SITE.handouts.push(`);
          p.i++; break;
        }
        i = p.i; continue;
      }
    }
    i++;
  }
  return out;
}
function handoutsIn(src, name) { return rootsIn(src, name).handouts; }

function prop(obj, key) { return obj.props.find((x) => x.key === key); }
const val = (obj, key) => (obj && prop(obj, key) ? prop(obj, key).value.value : undefined);

/* ---------- the course: every file the editor may write ---------- */
/* files: [{ name, src, role: 'data'|'sources'|'settings' }] */
function course(files) {
  const handouts = [];   // in SITE.handouts order: { node, file }
  let sources = null, settings = null;
  for (const f of files) {
    if (f.role === 'settings') { const p = new Parser(f.src); settings = { node: p.value(), file: f.name }; continue; }
    const r = rootsIn(f.src, f.name);
    r.handouts.forEach((node) => handouts.push({ node, file: f.name }));
    if (r.SOURCES) sources = { node: r.SOURCES, file: f.name };
  }
  return { handouts, sources, settings };
}

/* A field: one editable value. type: 'string' | 'list' (strings) | 'pairs' (terms: [term, meaning]).
   obj: the object node holding it; prop: its property name; path: where it sits in the loaded data
   (root, then keys), used by verify(). dflt: the page shows built-in default text when the property is absent. */
function field(key, label, type, file, obj, p, path, extra) {
  const v = val(obj, p);
  const value = type === 'string' ? (v == null ? (extra && extra.dflt ? null : '') : v) : (Array.isArray(v) ? JSON.parse(JSON.stringify(v)) : []);
  return Object.assign({ key, label, type, file, obj, prop: p, path: path.concat(p), value }, extra || {});
}

/* The fields of one page, in page order. Returns null when the id is not a page of this course. */
function pageFields(files, id) {
  const C = course(files);
  const out = [];
  const S = C.settings;
  if (id === 'start') {
    out.push(field('ldDescription', 'Course subtitle', 'string', S.file, S.node, 'ldDescription', ['CFG']));
    out.push(field('intro', 'Intro paragraph', 'string', S.file, S.node, 'intro', ['CFG'], { dflt: true }));
    out.push(field('imagesNote', 'Images note', 'string', S.file, S.node, 'imagesNote', ['CFG'], { dflt: true }));
    return { kind: 'intro', fields: out };
  }
  if (id === 'credits') {
    out.push(field('creditsIntro', 'Credits intro', 'string', S.file, S.node, 'creditsIntro', ['CFG'], { dflt: true }));
    return { kind: 'credits', fields: out };
  }
  if (id === 'sources') {
    if (!C.sources) return null;
    const so = C.sources, f = so.file;
    out.push(field('intro', 'Sources intro', 'string', f, so.node, 'intro', ['SOURCES']));
    const g = prop(so.node, 'groups');
    (g && g.value.type === 'arr' ? g.value.items : []).forEach((gn, gi) => {
      if (gn.type !== 'obj') return;
      out.push(field(`groups.${gi}.title`, 'Group heading', 'string', f, gn, 'title', ['SOURCES', 'groups', gi]));
      const it = prop(gn, 'items');
      (it && it.value.type === 'arr' ? it.value.items : []).forEach((inode, ii) => {
        if (inode.type === 'obj') out.push(field(`groups.${gi}.items.${ii}.html`, 'Source entry (HTML)', 'string', f, inode, 'html', ['SOURCES', 'groups', gi, 'items', ii]));
      });
    });
    return { kind: 'sources', fields: out };
  }
  const m = /^h(\d+)-(\d+)$/.exec(id);
  for (let hi = 0; hi < C.handouts.length; hi++) {
    const { node: h, file: f } = C.handouts[hi];
    const H = ['SITE', 'handouts', hi];
    const quote = (obj, path) => {
      const q = prop(obj, 'quote');
      if (!q || q.value.type !== 'obj') return;
      out.push(field('quote.q', 'Quotation', 'string', f, q.value, 'q', path.concat('quote')));
      out.push(field('quote.by', 'Quotation source', 'string', f, q.value, 'by', path.concat('quote')));
    };
    if (m && m[2] === '0') {
      if (val(h, 'n') !== Number(m[1])) continue;
      const ov = prop(h, 'overview');
      if (!ov || ov.value.type !== 'obj') throw new Error(`${f}: part ${m[1]} has no overview object`);
      const O = ov.value, OP = H.concat('overview');
      out.push(field('sub', 'Part subtitle', 'string', f, h, 'sub', H));
      out.push(field('sum', 'Overview', 'string', f, O, 'sum', OP));
      quote(h, H);
      out.push(field('bul', 'Bullet', 'list', f, O, 'bul', OP));
      out.push(field('terms', 'Term', 'pairs', f, O, 'terms', OP));
      return { kind: 'overview', file: f, fields: out };
    }
    const sl = prop(h, 'slides');
    if (!sl || sl.value.type !== 'arr') continue;
    for (let si = 0; si < sl.value.items.length; si++) {
      const s = sl.value.items[si];
      if (s.type !== 'obj') continue;
      const P = H.concat('slides', si), type = val(s, 'type');
      const hit = m ? (val(h, 'n') === Number(m[1]) && si + 1 === Number(m[2]) && type !== 'work') : (type === 'work' && val(s, 'key') === id);
      if (!hit) continue;
      const F = (k, label, t, extra) => out.push(field(k, label, t, f, s, k, P, extra));
      if (type === 'work') {
        F('artist', 'Artist', 'string'); F('date', 'Date', 'string'); F('det', 'Details line', 'string');
        if (val(s, 'lead') != null) {
          F('lead', 'Lead', 'string'); F('look', 'Look at bullet', 'list'); F('bul', 'History bullet', 'list');
          if (val(s, 'subj') != null) F('subj', 'Subject', 'string');
          F('terms', 'Term', 'pairs'); quote(s, P);
          return { kind: 'work', format: 'lead', file: f, fields: out };
        }
        F('fn', 'Made for', 'string'); F('sum', 'Summary', 'string'); F('bul', 'Bullet', 'list'); F('terms', 'Term', 'pairs'); quote(s, P);
        return { kind: 'work', format: 'old', file: f, fields: out };
      }
      if (type === 'theme') {
        F('stmt', 'Statement', 'string'); F('para', 'Paragraph', 'string'); F('bul', 'Bullet', 'list'); F('terms', 'Term', 'pairs'); quote(s, P);
        return { kind: 'theme', file: f, fields: out };
      }
      F('sub', 'Subtitle', 'string'); F('sum', 'Summary', 'string'); F('bul', 'Bullet', 'list'); F('terms', 'Term', 'pairs');
      return { kind: 'text', file: f, fields: out };
    }
  }
  return null;
}

/* What the editor shows: key, label, type, value (null = the built-in default is showing). */
const publicFields = (pf) => pf.fields.map((x) => ({ key: x.key, label: x.label, type: x.type, value: x.value, dflt: !!x.dflt }));

/* ---------- writing ---------- */
function lit(v, q) {
  if (q === "'") return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').split(LS).join('\\u2028').split(PS).join('\\u2029') + "'";
  if (q === '`') return '`' + v.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
  return JSON.stringify(v);
}
function lineIndent(src, pos) {
  const ls = src.lastIndexOf('\n', pos - 1) + 1;
  return /^[ \t]*/.exec(src.slice(ls))[0];
}
/* Quote style for new strings in this object: an existing string value's quote, else the key quote, else ". */
function quoteOf(obj) {
  for (const p of obj.props) {
    if (p.value.type === 'str') return p.value.quote;
    if (p.value.type === 'arr') { const s = p.value.items.find((n) => n.type === 'str'); if (s) return s.quote; }
  }
  const k = obj.props.find((p) => p.quoted);
  return k ? k.quoted : '"';
}
/* One indent step in this object, from its first property line vs the line the object opens on. */
function unitOf(src, obj) {
  const p = obj.props[0];
  if (p && src.slice(obj.start, p.keyStart).includes('\n')) {
    const a = lineIndent(src, obj.start), b = lineIndent(src, p.keyStart);
    if (b.length > a.length && b.startsWith(a)) return b.slice(a.length);
  }
  return /^\t/m.test(src) ? '\t' : (/^ {2}\S/m.test(src) ? '  ' : ' ');
}
/* An array value written out: one line, or one item per line in the file's layout. */
function fmt(v, base, unit, multi, q) {
  if (typeof v === 'string') return lit(v, q);
  if (!v.length) return '[]';
  if (!multi) return '[' + v.map((x) => fmt(x, base, unit, false, q)).join(', ') + ']';
  return '[\n' + v.map((x) => base + unit + fmt(x, base + unit, unit, true, q)).join(',\n') + '\n' + base + ']';
}
function arrText(src, obj, node, value, q, keyPos) {
  /* follow the array's own layout; for a new or empty array, a sibling array's layout; else the object's */
  const sib = obj.props.find((x) => x.value.type === 'arr' && x.value.items.length);
  const ref = node && node.items.length ? node : (sib ? sib.value : obj);
  const multi = src.slice(ref.start, ref.end).includes('\n');
  return fmt(value, lineIndent(src, keyPos), unitOf(src, obj), multi, q);
}
const shapeOk = (type, v) => (type === 'string' ? typeof v === 'string'
  : type === 'list' ? Array.isArray(v) && v.every((x) => typeof x === 'string')
    : Array.isArray(v) && v.every((x) => Array.isArray(x) && x.length === 2 && x.every((y) => typeof y === 'string')));
const sameShape = (node, value) => (node.type === 'str' ? typeof value === 'string'
  : node.type === 'arr' && Array.isArray(value) && node.items.length === value.length && node.items.every((n, i) => sameShape(n, value[i])));
/* replace only the strings that changed, when the array keeps its shape */
function leafEdits(node, value) {
  if (node.type === 'str') return node.value === value ? [] : [{ start: node.start, end: node.end, text: lit(value, node.quote) }];
  return node.items.flatMap((n, i) => leafEdits(n, value[i]));
}
const firstQuote = (node) => (node.type === 'str' ? node.quote : (node.items || []).map(firstQuote).find(Boolean));

/* Replacements in src for one field set to value. Returns [{start, end, text}]. */
function edits(src, fld, value) {
  const obj = fld.obj, key = fld.prop, kind = fld.type;
  const p = prop(obj, key);
  const q = quoteOf(obj);
  if (!p) {
    if (kind === 'string' ? value === '' && !fld.dflt : !value.length) return [];   // nothing to add
    const last = obj.props[obj.props.length - 1];
    const multi = src.slice(obj.start, obj.end).includes('\n');
    const ind = last ? lineIndent(src, last.keyStart) : '';
    const keyTxt = last && last.quoted ? lit(key, last.quoted) : (obj.props.some((x) => x.quoted) ? lit(key, '"') : key);
    const valTxt = kind === 'string' ? lit(value, q) : arrText(src, obj, null, value, q, last ? last.keyStart : obj.start);
    const at = last ? last.value.end : obj.start + 1;
    return [{ start: at, end: at, text: (last ? ',' : '') + (multi ? '\n' + ind : ' ') + keyTxt + ': ' + valTxt }];
  }
  const v = p.value;
  if (kind === 'string') {
    if (v.type !== 'str' && !(v.type === 'lit' && v.value == null)) throw new Error(`"${key}" is not a string in the file`);
    if (v.value === value) return [];
    return [{ start: v.start, end: v.end, text: lit(value, v.type === 'str' ? v.quote : q) }];
  }
  if (v.type !== 'arr' || !shapeOk(kind, v.value)) throw new Error(`"${key}" in the file is not the expected list`);
  if (JSON.stringify(v.value) === JSON.stringify(value)) return [];
  if (sameShape(v, value)) return leafEdits(v, value);
  return [{ start: v.start, end: v.end, text: arrText(src, obj, v, value, firstQuote(v) || q, p.keyStart) }];
}

/* Apply new values to the page's file(s). values: { key: value } for the page's fields; a value of null
   for a default-text field means "leave as is". Returns { files: [{name, src}], changed: [key], applied }. */
function patch(files, id, values) {
  const pf = pageFields(files, id);
  if (!pf) throw new Error(`no editable page with id "${id}"`);
  const byFile = {}, changed = [], applied = [];
  let seq = 0;
  for (const fld of pf.fields) {
    if (!(fld.key in values) || values[fld.key] === null) continue;
    const v = values[fld.key];
    if (!shapeOk(fld.type, v)) throw new Error(`"${fld.key}" has the wrong shape`);
    const src = files.find((x) => x.name === fld.file).src;
    const r = edits(src, fld, v);
    if (r.length) { (byFile[fld.file] = byFile[fld.file] || []).push(...r.map((x) => Object.assign(x, { seq: seq++ }))); changed.push(fld.key); applied.push({ path: fld.path, value: v }); }
  }
  const out = [];
  for (const [name, reps] of Object.entries(byFile)) {
    reps.sort((a, b) => b.start - a.start || b.seq - a.seq);   // inserts at one spot land in field order
    for (let i = 1; i < reps.length; i++) if (reps[i].end > reps[i - 1].start) throw new Error('overlapping edits');
    let src = files.find((x) => x.name === name).src;
    for (const r of reps) src = src.slice(0, r.start) + r.text + src.slice(r.end);
    out.push({ name, src });
  }
  return { files: out, changed, applied, kind: pf.kind };
}

/* Load the course the way build-course.js does: data files and sources.js run in one context; settings parsed as JSON. */
function load(files) {
  const vm = require('vm');
  const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
  let CFG = null;
  for (const f of files) {
    if (f.role === 'settings') CFG = JSON.parse(f.src);
    else vm.runInContext(f.src, ctx, { filename: f.name });
  }
  return JSON.parse(JSON.stringify({ SITE: ctx.SITE, SOURCES: ctx.SOURCES || null, CFG }));
}

/* After a patch: every file must still load, and the course must equal the old course with only the edited
   fields changed. Throws if not; the caller then writes nothing. */
function verify(files, patched) {
  const before = load(files);
  const after = load(files.map((f) => { const p = patched.files.find((x) => x.name === f.name); return p ? Object.assign({}, f, { src: p.src }) : f; }));
  for (const a of patched.applied) {
    let o = before;
    for (const k of a.path.slice(0, -1)) o = o[k];
    o[a.path[a.path.length - 1]] = a.value;
  }
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('safety check failed: the patched file differs from the intended edit; nothing was written');
}

module.exports = { handoutsIn, rootsIn, pageFields, publicFields, patch, verify, load };
