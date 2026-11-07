/* Local slide editor, part 1: find a slide's fields in the data files and rewrite only those fields.
   Used by tools/study/edit-server.js. Never deployed (deploy.yml excludes tools/study/editor/).

   The data files are JavaScript object literals in two styles: JSON-like (double quotes, quoted keys)
   and hand-written (single quotes, bare keys, inline arrays). This file parses them with source
   positions, so a save replaces the exact characters of the changed values and leaves every other
   byte of the file (comments, spacing, quote style, untouched fields) as it was. After patching,
   the server re-runs every data file and checks that the only difference is the edited fields. */
'use strict';

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
    else if (e === '\n' || e === '\u2028' || e === '\u2029') { /* line continuation */ }
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

/* The handouts defined in one data file: `window.SITE = {… handouts: [ … ] }` and `SITE.handouts.push(…)`.
   Strings and comments are skipped while looking for those two statements. */
function handoutsIn(src, name) {
  const out = [];
  const p = new Parser(src);
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) { p.i = i; p.ws(); i = p.i; continue; }
    if (c === '"' || c === "'" || c === '`') { p.i = i; p.str(); i = p.i; continue; }
    const prev = src[i - 1] || ' ';
    if (c === 'S' && !/[\w$]/.test(prev)) {
      const rest = src.slice(i, i + 40);
      const isWindow = prev === '.' && src.slice(i - 7, i) === 'window.';
      let m;
      if ((prev !== '.' || isWindow) && (m = /^SITE\s*=\s*/.exec(rest))) {
        p.i = i + m[0].length;
        const site = p.value();
        if (site.type !== 'obj') throw new Error(`${name}: SITE is not an object`);
        const h = site.props.find((x) => x.key === 'handouts');
        if (h && h.value.type === 'arr') h.value.items.forEach((n) => out.push(n));
        i = p.i; continue;
      }
      if (prev !== '.' && (m = /^SITE\.handouts\.push\s*\(/.exec(rest))) {
        p.i = i + m[0].length;
        for (;;) {
          const v = p.value();
          if (v.type === 'obj') out.push(v);
          p.ws();
          if (src[p.i] === ',') { p.i++; continue; }
          if (src[p.i] !== ')') { p.fail(`${name}: expected ) after SITE.handouts.push(`); }
          p.i++; break;
        }
        i = p.i; continue;
      }
    }
    i++;
  }
  return out;
}

const prop = (obj, key) => obj.props.find((x) => x.key === key);

/* Find a page's editable objects. id is the page's body data-id: "h<n>-0" for a part overview, the
   work key for a work page. Returns null for pages this editor does not edit. */
function locate(files, id) {
  const m = /^h(\d+)-0$/.exec(id);
  for (const f of files) {
    for (const h of handoutsIn(f.src, f.name)) {
      if (m) {
        if (h.value.n === Number(m[1])) {
          const ov = prop(h, 'overview');
          if (!ov || ov.value.type !== 'obj') throw new Error(`${f.name}: part ${m[1]} has no overview object`);
          return { kind: 'overview', file: f.name, handout: h, overview: ov.value };
        }
        continue;
      }
      const sl = prop(h, 'slides');
      if (!sl || sl.value.type !== 'arr') continue;
      for (const s of sl.value.items) {
        if (s.type === 'obj' && s.value.type === 'work' && s.value.key === id) return { kind: 'work', file: f.name, handout: h, slide: s };
      }
    }
  }
  return null;
}

/* Which object holds each editable field. */
const FIELDS = {
  overview: { sub: ['handout', 'string'], sum: ['overview', 'string'], bul: ['overview', 'list'] },
  work: { det: ['slide', 'string'], lead: ['slide', 'string'], look: ['slide', 'list'], bul: ['slide', 'list'] },
};

function current(loc) {
  const out = {};
  for (const [k, [holder, kind]] of Object.entries(FIELDS[loc.kind])) {
    const v = loc[holder].value[k];
    out[k] = kind === 'list' ? (Array.isArray(v) ? v.slice() : []) : (v == null ? '' : v);
  }
  return out;
}

/* ---------- writing ---------- */
function lit(v, q) {
  if (q === "'") return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + "'";
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

function listText(src, obj, node, values, q, keyPos) {
  if (!values.length) return '[]';
  /* follow the list's own layout; for a new or empty list, a sibling list's layout; else the object's */
  const sib = obj.props.find((x) => x.value.type === 'arr' && x.value.items.length);
  const ref = node && node.items.length ? node : (sib ? sib.value : obj);
  const multi = src.slice(ref.start, ref.end).includes('\n');
  if (!multi) return '[' + values.map((v) => lit(v, q)).join(', ') + ']';
  const base = lineIndent(src, keyPos), unit = unitOf(src, obj);
  return '[\n' + values.map((v) => base + unit + lit(v, q)).join(',\n') + '\n' + base + ']';
}

/* Replacements for one object: { obj, key, kind, value }. Returns [{start, end, text}]. */
function edits(src, obj, key, kind, value) {
  const p = prop(obj, key);
  const q = quoteOf(obj);
  if (!p) {
    if (kind === 'list' ? !value.length : value === '') return [];   // nothing to add
    const last = obj.props[obj.props.length - 1];
    const multi = src.slice(obj.start, obj.end).includes('\n');
    const ind = last ? lineIndent(src, last.keyStart) : '';
    const keyTxt = last && last.quoted ? lit(key, last.quoted) : (obj.props.some((x) => x.quoted) ? lit(key, '"') : key);
    const valTxt = kind === 'list' ? listText(src, obj, null, value, q, last ? last.keyStart : obj.start) : lit(value, q);
    const at = last ? last.value.end : obj.start + 1;
    return [{ start: at, end: at, text: (last ? ',' : '') + (multi ? '\n' + ind : ' ') + keyTxt + ': ' + valTxt }];
  }
  const v = p.value;
  if (kind === 'string') {
    if (v.type !== 'str' && !(v.type === 'lit' && v.value == null)) throw new Error(`"${key}" is not a string in the data file`);
    if (v.value === value) return [];
    return [{ start: v.start, end: v.end, text: lit(value, v.type === 'str' ? v.quote : q) }];
  }
  if (v.type !== 'arr' || v.items.some((n) => n.type !== 'str')) throw new Error(`"${key}" is not a list of strings in the data file`);
  if (JSON.stringify(v.value) === JSON.stringify(value)) return [];
  if (v.items.length === value.length) {
    return v.items.flatMap((n, i) => (n.value === value[i] ? [] : [{ start: n.start, end: n.end, text: lit(value[i], n.quote) }]));
  }
  const iq = v.items.length ? v.items[0].quote : q;
  return [{ start: v.start, end: v.end, text: listText(src, obj, v, value, iq, p.keyStart) }];
}

/* Apply new field values to the data file that holds the page. Returns { name, src, changed: [field] }. */
function patch(files, id, values) {
  const loc = locate(files, id);
  if (!loc) throw new Error(`no editable slide with id "${id}"`);
  const f = files.find((x) => x.name === loc.file);
  const spec = FIELDS[loc.kind];
  const reps = [], changed = [];
  for (const [k, [holder, kind]] of Object.entries(spec)) {
    if (!(k in values)) continue;
    const val = values[k];
    if (kind === 'list' ? !(Array.isArray(val) && val.every((x) => typeof x === 'string')) : typeof val !== 'string') throw new Error(`"${k}" must be ${kind === 'list' ? 'a list of strings' : 'a string'}`);
    const r = edits(f.src, loc[holder], k, kind, val);
    if (r.length) { reps.push(...r); changed.push(k); }
  }
  reps.sort((a, b) => b.start - a.start);
  for (let i = 1; i < reps.length; i++) if (reps[i].end > reps[i - 1].start) throw new Error('overlapping edits');
  let src = f.src;
  for (const r of reps) src = src.slice(0, r.start) + r.text + src.slice(r.end);
  return { name: f.name, src, changed, kind: loc.kind };
}

/* Run the data files the way build-course.js does and return SITE. */
function loadSite(files) {
  const vm = require('vm');
  const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
  for (const f of files) vm.runInContext(f.src, ctx, { filename: f.name });
  return JSON.parse(JSON.stringify(ctx.SITE));
}

/* After a patch: the new files must load, and SITE must equal the old SITE with only the edited fields changed. */
function verify(files, id, values, patched) {
  const before = loadSite(files);
  const after = loadSite(files.map((f) => (f.name === patched.name ? { name: f.name, src: patched.src } : f)));
  const m = /^h(\d+)-0$/.exec(id);
  for (const h of before.handouts) {
    let holders = null;
    if (m && h.n === Number(m[1])) holders = { handout: h, overview: h.overview };
    else if (!m) { const s = (h.slides || []).find((x) => x.type === 'work' && x.key === id); if (s) holders = { slide: s }; }
    if (!holders) continue;
    for (const [k, [holder, kind]] of Object.entries(FIELDS[patched.kind])) {
      if (!(k in values)) continue;
      const v = values[k];
      const cur = holders[holder][k];
      if (cur === undefined && (kind === 'list' ? !v.length : v === '')) continue;   // field left absent
      holders[holder][k] = v;
    }
  }
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('safety check failed: the patched data file differs from the intended edit; nothing was written');
}

module.exports = { handoutsIn, locate, current, patch, verify, loadSite, FIELDS };
