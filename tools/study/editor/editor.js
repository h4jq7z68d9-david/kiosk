/* Local slide editor, part 2: the in-page editor. Loaded only by tools/study/edit-server.js, which adds it
   to course pages as it serves them. The built pages and the production viewer (study/guide.js) never
   reference this file, and deploy.yml excludes tools/study/editor/ from the upload.

   Edit slide → the slide's text becomes editable in place, showing the data file's text exactly.
   Save → the server writes the changed fields to the data file, rebuilds the course, runs check.js,
   and this page reloads with the result. Part overview: sub, sum, bul. Work: det, lead, look, bul. */
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
    + '<div class="ed-btns"><button type="button" class="ed-btn ed-edit" disabled>Edit slide</button>'
    + '<button type="button" class="ed-btn ed-primary ed-save" hidden>Save</button>'
    + '<button type="button" class="ed-btn ed-cancel" hidden>Discard</button></div>'
    + '<p class="ed-help" hidden>Click any outlined text to change it. Enter adds a bullet; Backspace in an empty bullet removes it. Save writes this slide to the data file.</p>'
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
    const what = here ? `Saved ${esc(r.changed.join(', '))} to ${esc(r.file)} at ${esc(r.at)}.` : `Last save: ${esc(r.id)} (${esc(r.changed.join(', '))}) at ${esc(r.at)}.`;
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

  /* ---------- the slide's field elements ---------- */
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const after = (ref, node) => { ref.parentNode.insertBefore(node, ref.nextSibling); return node; };
  const child = (sel) => Array.from(notes.children).find((e) => e.matches(sel));

  /* Each field: { el, kind: 'string'|'list', label }. Missing elements are created empty, in the place the
     generator would put them, so an absent field can be filled in. */
  function fields() {
    const f = {};
    if (data.kind === 'work') {
      const date = child('p.date'), lead = child('p.sum');
      f.det = { el: child('p.det') || after(date, el('p', 'det ed-new')), kind: 'string', label: 'Details line' };
      f.lead = { el: lead, kind: 'string', label: 'Lead' };
      let look = child('ul.look');
      if (!look) { const lab = after(lead, el('p', 'lab ed-new', 'Look at')); look = after(lab, el('ul', 'b look ed-new')); after(look, el('hr', 'rule ed-new')); }
      f.look = { el: look, kind: 'list', label: 'Look at bullet' };
      let bul = child('ul.b:not(.look)');
      if (!bul) { const ref = look.nextElementSibling && look.nextElementSibling.matches('hr.rule') ? look.nextElementSibling : look; bul = after(ref, el('ul', 'b ed-new')); }
      f.bul = { el: bul, kind: 'list', label: 'History bullet' };
    } else {
      const title = child('h1'), sum = child('p.sum');
      f.sub = { el: child('p.hsub') || after(title, el('p', 'hsub ed-new')), kind: 'string', label: 'Part subtitle' };
      f.sum = { el: sum, kind: 'string', label: 'Overview' };
      let bul = child('ul.b');
      if (!bul) { let ref = sum.nextElementSibling; while (ref && !ref.matches('hr.rule')) ref = ref.nextElementSibling; bul = after(ref || sum, el('ul', 'b ed-new')); }
      f.bul = { el: bul, kind: 'list', label: 'Bullet' };
    }
    return f;
  }
  let F = null;

  function editable(e, label) {
    e.contentEditable = 'plaintext-only';
    if (e.contentEditable !== 'plaintext-only') e.contentEditable = 'true';
    e.classList.add('ed-field'); e.dataset.edLabel = label; e.spellcheck = true;
  }
  function item(text, label) {
    const li = el('li', 'ed-li'), t = el('span', 'ed-t', text), x = el('button', 'ed-x ed-ui', '×');
    editable(t, label); x.type = 'button'; x.title = 'Remove this bullet'; x.setAttribute('aria-label', 'Remove this bullet');
    x.onclick = () => { li.remove(); dirty = true; };
    li.append(t, x); return li;
  }
  function start() {
    F = fields();
    for (const [k, f] of Object.entries(F)) {
      const v = data.values[k];
      if (f.kind === 'string') { f.el.textContent = v; editable(f.el, f.label); f.el.hidden = false; continue; }
      f.el.textContent = '';
      v.forEach((x) => f.el.append(item(x, f.label)));
      const add = el('button', 'ed-add ed-ui', '+ Add ' + f.label.toLowerCase()); add.type = 'button';
      add.onclick = () => { const li = item('', f.label); f.el.append(li); li.firstChild.focus(); dirty = true; };
      after(f.el, add);
    }
    document.body.classList.add('ed-on');
    editing = true; btnEdit.hidden = true; btnSave.hidden = false; btnCancel.hidden = false;
    $('.ed-help').hidden = false;   /* the last save's result stays visible below it */
    const first = notes.querySelector('.ed-field'); first && first.focus();
  }
  function values() {
    const v = {};
    for (const [k, f] of Object.entries(F)) {
      v[k] = f.kind === 'string' ? norm(f.el.innerText) : Array.from(f.el.querySelectorAll('.ed-t')).map((t) => norm(t.innerText)).filter(Boolean);
    }
    return v;
  }
  async function save() {
    if (saving) return;
    const v = values();
    if (JSON.stringify(v) === JSON.stringify(data.values)) { msg('No changes to save.'); return; }
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
    dirty = false; location.reload();
  }

  /* ---------- events ---------- */
  btnEdit.onclick = start;
  btnSave.onclick = save;
  btnCancel.onclick = () => { if (!dirty || confirm('Discard the changes on this slide?')) { dirty = false; location.reload(); } };
  notes.addEventListener('input', () => { dirty = true; });
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  /* keys typed in a field stay in the field: the viewer's arrow-key and "/" shortcuts must not fire */
  window.addEventListener('keydown', (e) => {
    if (editing && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); return; }
    const t = e.target;
    if (!t.classList || !t.classList.contains('ed-field')) return;
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      if (t.classList.contains('ed-t')) { const li = item('', t.dataset.edLabel); t.parentNode.after(li); li.firstChild.focus(); dirty = true; }
    } else if (e.key === 'Backspace' && t.classList.contains('ed-t') && !norm(t.innerText)) {
      e.preventDefault();
      const li = t.parentNode, prev = li.previousElementSibling;
      li.remove(); dirty = true;
      if (prev) { const p = prev.querySelector('.ed-t'); p.focus(); document.getSelection().selectAllChildren(p); document.getSelection().collapseToEnd(); }
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
    if (d.error) msg('<b>Cannot edit this slide:</b> ' + esc(d.error), 'bad');
    if (d.editable) { btnEdit.disabled = false; $('.ed-file').textContent = d.file; }
    else { btnEdit.hidden = true; if (!d.error) msg('This page has no editable text. Part overviews and work pages do.'); }
    const r = stored && stored.id === id ? stored : d.last;
    if (r) showResult(r, r === stored);
  }).catch((e) => msg('<b>The editor server did not answer.</b> ' + esc(e.message), 'bad'));
})();
