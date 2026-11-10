/* Local slide editor, part 2: the in-page editor. Loaded only by tools/study/edit-server.js, which adds it
   to course pages as it serves them. The built pages and the production viewer (study/guide.js) never
   reference this file, and deploy.yml excludes tools/study/editor/ from the upload.

   Edit page → the page's text becomes editable in place, showing the course files' text exactly.
   Save → the server writes the changed fields, rebuilds the course, runs check.js, and this page
   reloads with the result. Every page type is editable, titles included; not the per-image credit entries.
   A title or section-name change moves the page: the server fixes the redirects and the editor opens the new URL. */
(() => {
  'use strict';
  const id = document.body.dataset.id;
  const notes = document.querySelector('#slide .notes');
  if (!id || !notes) return;
  const API = '/__edit/api/';
  const NBSP = new RegExp(String.fromCharCode(160), 'g');
  const norm = (s) => s.replace(NBSP, ' ').replace(/\r?\n/g, ' ').trim();
  let data = null, editing = false, dirty = false, saving = false;

  /* ---------- panel ---------- */
  const panel = document.createElement('aside');
  panel.className = 'ed-panel';
  panel.setAttribute('aria-label', 'Slide editor');
  panel.innerHTML = '<div class="ed-head"><b>Slide editor</b><button type="button" class="ed-min" aria-expanded="true">Hide</button><span class="ed-file"></span></div>'
    + '<div class="ed-btns"><button type="button" class="ed-btn ed-edit" disabled>Edit page</button>'
    + '<button type="button" class="ed-btn ed-primary ed-save" hidden>Save</button>'
    + '<button type="button" class="ed-btn ed-cancel" hidden>Discard</button></div>'
    + '<p class="ed-help" hidden>Click any outlined text to change it. In a list, Enter adds an item and Backspace in an empty item removes it. Save writes this page to the course files.</p>'
    + '<div class="ed-msg" role="status"></div>'
    + '<details class="ed-log" hidden><summary>Build and check.js output</summary><pre></pre></details>';
  document.body.appendChild(panel);
  const $ = (s) => panel.querySelector(s);
  const btnEdit = $('.ed-edit'), btnSave = $('.ed-save'), btnCancel = $('.ed-cancel');
  /* Hide folds the panel to its header, so it does not cover the outline */
  $('.ed-min').onclick = (e) => { const min = panel.classList.toggle('ed-folded'); e.target.textContent = min ? 'Show' : 'Hide'; e.target.setAttribute('aria-expanded', String(!min)); };

  function msg(html, tone) { const m = $('.ed-msg'); m.className = 'ed-msg' + (tone ? ' ed-' + tone : ''); m.innerHTML = html; }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* check.js prints "ERRORS (n)" / "WARNINGS (n)" blocks of indented lines */
  function block(out, head) {
    const lines = out.split('\n'), i = lines.findIndex((l) => l.startsWith(head + ' ('));
    if (i < 0) return [];
    const r = [];
    for (let j = i + 1; j < lines.length && lines[j].startsWith('  '); j++) r.push(lines[j].trim());
    return r;
  }
  function showResult(r, here) {
    const log = $('.ed-log'), pre = log.querySelector('pre');
    const out = [r.build && ('$ ' + r.build.cmd + '\n' + r.build.out), r.check && ('$ ' + r.check.cmd + '\n' + r.check.out)].filter(Boolean).join('\n\n');
    pre.textContent = out; log.hidden = !out;
    const moved = (r.moves || []).map((m) => `<br>Moved ${esc(m.from)} → ${esc(m.to)}${m.redirect ? ' (live URL: redirect added)' : ''}.`).join('');
    const what = (here ? `Saved ${esc(r.changed.join(', '))} to ${esc(r.file)} at ${esc(r.at)}.` : `Last save: ${esc(r.id)} (${esc(r.changed.join(', '))}) at ${esc(r.at)}.`) + moved;
    if (r.build && r.build.code !== 0) { msg(`${what}<br><b>The build failed.</b> The pages were not rebuilt; see the output below.`, 'bad'); log.open = true; return; }
    const errs = block(r.check.out, 'ERRORS'), warns = block(r.check.out, 'WARNINGS');
    const list = (a) => '<ul>' + a.map((x) => `<li>${esc(x)}</li>`).join('') + '</ul>';
    if (r.check.code !== 0) {
      msg(`${what}<br><b>check.js failed (${errs.length} error${errs.length === 1 ? '' : 's'}):</b>${list(errs)}${warns.length ? `<b>Warnings:</b>${list(warns)}` : ''}`, 'bad');
      log.open = true;
    } else {
      msg(`${what}<br>Build and check.js passed.${warns.length ? `<br><b>Warnings (${warns.length}):</b>${list(warns)}` : ''}`, warns.length ? 'warn' : 'ok');
    }
  }

  /* ---------- where each field sits on the page ---------- */
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const after = (ref, node) => { ref.parentNode.insertBefore(node, ref.nextSibling); return node; };
  const before = (ref, node) => { ref.parentNode.insertBefore(node, ref); return node; };
  const kids = (sel) => Array.from(notes.children).filter((e) => e.matches(sel));
  const child = (sel) => kids(sel)[0];
  const nextRule = (e) => { let r = e && e.nextElementSibling; while (r && !r.matches('hr.rule')) r = r.nextElementSibling; return r; };
  const lastOf = (...a) => a.filter(Boolean).pop();
  /* a list or terms block that is not on the page yet goes after `ref` */
  const ensure = (sel, tag, cls, ref) => child(sel) || after(ref, el(tag, cls + ' ed-new'));

  /* Returns { key: element } for this page. Elements a field needs but the page lacks (empty lists,
     a missing details line) are created empty, where the generator would put them. */
  function slots() {
    const s = {}, F = new Set(data.fields.map((f) => f.key)), k = data.kind;
    const h1 = child('h1'), sums = kids('p.sum');
    const quote = () => { const bq = child('blockquote'); if (bq) { s['quote.q'] = bq.querySelector('p'); s['quote.by'] = bq.querySelector('cite'); } };
    const terms = (ref) => { s.terms = ensure('dl.terms', 'dl', 'terms', ref); };
    /* titles: the h1; the section name: the eyebrow over it (overview, work and text pages) */
    if (F.has('title')) s.title = h1;
    if (F.has('section')) s.section = child('p.eyebrow');
    if (k === 'intro') {
      s.ldDescription = child('p.hsub') || after(h1, el('p', 'hsub ed-new'));
      s.intro = sums[0] || after(s.ldDescription, el('p', 'sum ed-new'));
      s.intro2 = sums[1] || after(s.intro, el('p', 'sum ed-new'));
      s.introBul = ensure('ul.b', 'ul', 'b', s.intro2);
    } else if (k === 'credits') {
      s.creditsIntro = sums[0];
    } else if (k === 'sources') {
      s.intro = sums[0];
      kids('p.lab').forEach((e, i) => { s[`groups.${i}.title`] = e; });
      kids('div.cred').forEach((d, i) => Array.from(d.children).forEach((e, j) => { s[`groups.${i}.items.${j}.html`] = e; }));
    } else if (k === 'overview') {
      s.sub = child('p.hsub') || after(h1, el('p', 'hsub ed-new'));
      s.sum = sums[0];
      s.sum2 = sums[1] || after(s.sum, el('p', 'sum ed-new'));
      quote();
      s.bul = ensure('ul.b', 'ul', 'b', lastOf(s.sum2, child('blockquote')));
      terms(s.bul);
    } else if (k === 'work') {
      s.artist = child('p.artist') || before(h1, el('p', 'artist ed-new'));
      s.date = child('p.date');
      s.det = child('p.det') || after(s.date, el('p', 'det ed-new'));
      if (data.format === 'lead') {
        s.lead = sums[0];
        let look = child('ul.look');
        if (!look) { const lab = after(s.lead, el('p', 'lab ed-new', 'Look at')); look = after(lab, el('ul', 'b look ed-new')); after(look, el('hr', 'rule ed-new')); }
        s.look = look;
        const lr = look.nextElementSibling && look.nextElementSibling.matches('hr.rule') ? look.nextElementSibling : look;
        s.bul = child('ul.b:not(.look)') || after(lr, el('ul', 'b ed-new'));
        if (F.has('subj')) s.subj = sums[1];
        terms(lastOf(s.bul, s.subj));
      } else {
        s.fn = child('p.fn'); s.sum = sums[0];
        s.bul = ensure('ul.b', 'ul', 'b', nextRule(s.sum) || s.sum);
        terms(s.bul);
      }
      quote();
    } else if (k === 'theme') {
      s.stmt = child('p.stmt'); s.para = sums[0];
      s.bul = ensure('ul.b', 'ul', 'b', nextRule(s.para) || s.para);
      terms(s.bul); quote();
    } else if (k === 'topen') {   // technique slide model: opening slide
      s.para = sums[0];
    } else if (k === 'concept') {   // technique slide model: concept with its example painting
      s.stmt = child('p.stmt');
      s.look = child('ul.look');
      const ex = child('div.ex');
      if (ex) {
        s['ex.artist'] = ex.querySelector('.ex-a');
        /* the page shows "<i>title</i>, date" in one line: split it so title and date are separate fields */
        const t = ex.querySelector('.ex-t'), i = t.querySelector('i');
        if (!t.querySelector('.ed-date')) { const d = el('span', 'ed-date', t.textContent.slice(i.textContent.length).replace(/^,\s*/, '')); t.textContent = ''; t.append(i, ', ', d); }
        s['ex.title'] = i; s['ex.date'] = t.querySelector('.ed-date');
        s['ex.line'] = ex.querySelector('.ex-l');
        /* fields not visible on the page: shown in a box under the example while editing */
        const box = ex.parentNode.querySelector('.ed-extra') || after(ex, el('div', 'ed-extra ed-new'));
        ['ex.det', 'ex.alt'].forEach((key) => {
          const f = data.fields.find((x) => x.key === key);
          if (!f || box.querySelector(`[data-ed-key="${key}"]`)) return;
          const lab = el('p', 'ed-xlab', f.label); const p = el('p', 'ed-xval'); p.dataset.edKey = key;
          box.append(lab, p); s[key] = p;
        });
        ['ex.det', 'ex.alt'].forEach((key) => { s[key] = s[key] || box.querySelector(`[data-ed-key="${key}"]`); });
      }
      /* closing line: a divider and a paragraph after the example, created empty if the slide has none */
      s.bul = sums[0] || after(after(child('.ed-extra') || ex, el('hr', 'rule ed-new')), el('p', 'sum ed-new'));
    } else if (k === 'text') {
      s.sub = child('p.hsub') || after(h1, el('p', 'hsub ed-new'));
      s.sum = sums[0];
      s.bul = ensure('ul.b', 'ul', 'b', nextRule(s.sum) || s.sum);
      terms(s.bul);
    }
    return s;
  }
  let S = null;

  /* ---------- edit mode ---------- */
  function editable(e, label) {
    e.contentEditable = 'plaintext-only';
    if (e.contentEditable !== 'plaintext-only') e.contentEditable = 'true';
    e.classList.add('ed-field'); e.dataset.edLabel = label; e.spellcheck = true;
  }
  function removable(row, label) {
    const x = el('button', 'ed-x ed-ui', '×');
    x.type = 'button'; x.title = 'Remove this ' + label.toLowerCase(); x.setAttribute('aria-label', x.title);
    x.onclick = () => { row.remove(); dirty = true; };
    row.append(x);
  }
  function item(text, label) {
    const li = el('li', 'ed-li'), t = el('span', 'ed-t', text);
    editable(t, label); li.append(t); removable(li, label);
    return li;
  }
  function pair(p, label) {
    const row = el('div', 'ed-pair'), dt = el('dt'), dd = el('dd');
    const a = el('span', 'ed-t ed-pa', p[0]), b = el('span', 'ed-t ed-pb', p[1]);
    editable(a, label); editable(b, 'Meaning'); dt.append(a); dd.append(b);
    row.append(dt, dd); removable(row, label);
    return row;
  }
  function addButton(after_, label, make) {
    const add = el('button', 'ed-add ed-ui', '+ Add ' + label.toLowerCase()); add.type = 'button';
    add.onclick = () => { const r = make(); r.querySelector('.ed-t').focus(); dirty = true; };
    after(after_, add);
  }
  function start() {
    S = slots();
    for (const f of data.fields) {
      const e = S[f.key];
      if (!e) continue;
      if (f.type === 'string') {
        if (f.value === null) e.dataset.edDefault = norm(e.textContent);   // the built-in default text is showing
        else e.textContent = f.value;
        editable(e, f.label); e.hidden = false;
      } else if (f.type === 'list') {
        e.textContent = '';
        f.value.forEach((x) => e.append(item(x, f.label)));
        addButton(e, f.label, () => e.appendChild(item('', f.label)));
      } else {
        e.textContent = '';
        f.value.forEach((p) => e.append(pair(p, f.label)));
        addButton(e, f.label, () => e.appendChild(pair(['', ''], f.label)));
      }
    }
    document.body.classList.add('ed-on');
    editing = true; btnEdit.hidden = true; btnSave.hidden = false; btnCancel.hidden = false;
    $('.ed-help').hidden = false;   /* the last save's result stays visible below it */
    const first = notes.querySelector('.ed-field'); first && first.focus();
  }
  function values() {
    const v = {};
    for (const f of data.fields) {
      const e = S[f.key];
      if (!e) continue;
      if (f.type === 'string') {
        const t = norm(e.textContent);
        v[f.key] = f.value === null && t === e.dataset.edDefault ? null : t;
      } else if (f.type === 'list') {
        v[f.key] = Array.from(e.querySelectorAll('.ed-t')).map((t) => norm(t.textContent)).filter(Boolean);
      } else {
        v[f.key] = Array.from(e.querySelectorAll('.ed-pair')).map((r) => [norm(r.querySelector('.ed-pa').textContent), norm(r.querySelector('.ed-pb').textContent)]).filter((p) => p[0] || p[1]);
      }
    }
    return v;
  }
  const unchanged = (v) => data.fields.every((f) => !(f.key in v) || JSON.stringify(v[f.key]) === JSON.stringify(f.value));

  /* the same rules the server applies (required text, list sizes), checked here first so nothing is sent */
  function problems(v) {
    const out = [];
    for (const f of data.fields) {
      if (!(f.key in v) || v[f.key] === null) continue;
      const x = v[f.key];
      if (f.type === 'string' && f.required && !x) out.push(`${f.label} can't be empty`);
      if (f.type === 'list' && f.min != null && (x.length < f.min || x.length > f.max)) out.push(`${f.label}: needs ${f.min} to ${f.max}, has ${x.length}`);
    }
    return out;
  }
  async function save() {
    if (saving) return;
    const v = values();
    if (unchanged(v)) { msg('No changes to save.'); return; }
    const bad = problems(v);
    if (bad.length) { msg('<b>Not saved.</b><ul>' + bad.map((x) => `<li>${esc(x)}</li>`).join('') + '</ul>Your text is still on the page.', 'bad'); return; }
    saving = true; btnSave.disabled = btnCancel.disabled = true;
    msg('Saving, then rebuilding the course and running check.js. This takes about 15 seconds.');
    let r;
    try {
      const res = await fetch(API + 'save', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Edit': '1' }, body: JSON.stringify({ id, rev: data.rev, values: v }) });
      r = await res.json();
    } catch (e) { r = { ok: false, error: 'The editor server did not answer. Is it still running? (' + e.message + ')' }; }
    saving = false; btnSave.disabled = btnCancel.disabled = false;
    if (!r.ok) { msg('<b>Not saved.</b> ' + esc(r.error) + '<br>Your text is still on the page.', 'bad'); return; }
    if (!r.changed.length) { msg('No changes to save.'); return; }
    try { sessionStorage.setItem('ed-result', JSON.stringify(r)); } catch (e) { /* the result also comes back as "last" */ }
    dirty = false;
    if (r.url && r.url !== location.pathname) location.href = r.url;   // the page moved
    else location.reload();
  }

  /* ---------- events ---------- */
  btnEdit.onclick = start;
  btnSave.onclick = save;
  btnCancel.onclick = () => { if (!dirty || confirm('Discard the changes on this page?')) { dirty = false; location.reload(); } };
  notes.addEventListener('input', () => { dirty = true; });
  /* links on the page (sources entries, works lists) do not navigate away while a field is being edited */
  notes.addEventListener('click', (e) => { if (editing && e.target.closest('.ed-field')) e.preventDefault(); });
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  /* keys typed in a field stay in the field: the viewer's arrow-key and "/" shortcuts must not fire */
  window.addEventListener('keydown', (e) => {
    if (editing && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); return; }
    const t = e.target;
    if (!t.classList || !t.classList.contains('ed-field')) return;
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      if (t.classList.contains('ed-pa')) { t.closest('.ed-pair').querySelector('.ed-pb').focus(); return; }
      if (t.classList.contains('ed-pb')) { const row = pair(['', ''], t.closest('.ed-pair').querySelector('.ed-pa').dataset.edLabel); t.closest('.ed-pair').after(row); row.querySelector('.ed-pa').focus(); dirty = true; return; }
      if (t.classList.contains('ed-t')) { const li = item('', t.dataset.edLabel); t.parentNode.after(li); li.firstChild.focus(); dirty = true; }
    } else if (e.key === 'Backspace' && t.classList.contains('ed-t') && !t.classList.contains('ed-pb') && !norm(t.textContent)) {
      const row = t.closest('.ed-pair') || t.parentNode;
      if (row.classList.contains('ed-pair') && norm(row.querySelector('.ed-pb').textContent)) return;
      e.preventDefault();
      const prev = row.previousElementSibling;
      row.remove(); dirty = true;
      const p = prev && (prev.querySelector('.ed-pb') || prev.querySelector('.ed-t'));
      if (p) { p.focus(); document.getSelection().selectAllChildren(p); document.getSelection().collapseToEnd(); }
    }
  }, true);
  /* paste as plain text on one line */
  notes.addEventListener('paste', (e) => {
    if (!e.target.closest || !e.target.closest('.ed-field')) return;
    e.preventDefault();
    const text = (e.clipboardData.getData('text/plain') || '').replace(/\s*\r?\n\s*/g, ' ');
    document.execCommand('insertText', false, text);
  });

  /* ---------- load ---------- */
  let stored = null;
  try { stored = JSON.parse(sessionStorage.getItem('ed-result') || 'null'); sessionStorage.removeItem('ed-result'); } catch (e) { /* none */ }
  fetch(API + 'slide?id=' + encodeURIComponent(id), { cache: 'no-store' }).then((r) => r.json()).then((d) => {
    data = d;
    if (d.error) msg('<b>Cannot edit this page:</b> ' + esc(d.error), 'bad');
    if (d.editable) { btnEdit.disabled = false; $('.ed-file').textContent = d.file; }
    else { btnEdit.hidden = true; if (!d.error) msg('This page has no editable text.'); }
    const r = stored && stored.id === id ? stored : d.last;
    if (r) showResult(r, r === stored);
  }).catch((e) => msg('<b>The editor server did not answer.</b> ' + esc(e.message), 'bad'));
})();
