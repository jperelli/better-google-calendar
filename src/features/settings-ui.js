// One Settings modal for every option of every feature, plus the About modal.
// Features that load later (presets, merge, ...) add their own section with
// BGC.features.settingsUi.register({ id, title, render(body, h) }). Opened from
// the command palette, the gear buttons, the toolbar popup (runtime message) or
// a #bgc-settings / #bgc-about hash on the Calendar URL.
(function () {
  'use strict';
  const BGC = window.BGC;
  const { el, openDialog, closeDialog, addStyle, toast } = BGC.ui;
  const settings = BGC.settings;
  const about = BGC.about;

  addStyle(`
    .bgc-set-body { overflow: auto; padding: 4px 24px 12px; }
    .bgc-set-section { padding: 14px 0 10px; border-bottom: 1px solid #f1f3f4; }
    .bgc-set-section:last-child { border-bottom: 0; }
    .bgc-set-section h3 { margin: 0 0 6px; font: 500 14px 'Google Sans', Roboto, Arial, sans-serif; color: #1a73e8; letter-spacing: .2px; }
    .bgc-set-note { font-size: 12px; color: #5f6368; margin: 2px 0 6px; line-height: 16px; }
    .bgc-set-row { display: flex; align-items: center; gap: 12px; min-height: 36px; font-size: 14px; color: #3c4043; }
    .bgc-set-row > label { flex: 1; cursor: pointer; }
    .bgc-set-row input[type="checkbox"] { width: 18px; height: 18px; accent-color: #1a73e8; cursor: pointer; }
    .bgc-set-row input[type="number"], .bgc-set-row input[type="text"], .bgc-set-row select {
      font: 14px Roboto, Arial, sans-serif; color: #3c4043; border: 1px solid #dadce0; border-radius: 4px; padding: 6px 8px; background: #fff; }
    .bgc-set-row input[type="number"] { width: 72px; }
    .bgc-set-row input[type="text"] { width: 180px; }
    .bgc-set-row input:focus, .bgc-set-row select:focus { outline: 2px solid #1a73e8; outline-offset: -1px; }
    .bgc-set-swatch { width: 18px; height: 18px; border-radius: 4px; border: 1px solid #dadce0; flex: none; }
    .bgc-set-days { display: flex; gap: 4px; }
    .bgc-set-days label { font-size: 12px; border: 1px solid #dadce0; border-radius: 12px; padding: 2px 8px; cursor: pointer; user-select: none; }
    .bgc-set-days label.bgc-on { background: #e8f0fe; border-color: #d2e3fc; color: #1967d2; }
    .bgc-set-days input { display: none; }
    .bgc-set-list { margin: 4px 0; padding: 0; list-style: none; }
    .bgc-set-list li { display: flex; align-items: center; gap: 8px; min-height: 32px; font-size: 13px; }
    .bgc-set-list li span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bgc-set-list button, .bgc-set-link { border: 0; background: transparent; color: #1a73e8; cursor: pointer; font: 500 13px 'Google Sans', Roboto, Arial, sans-serif; padding: 2px 6px; border-radius: 4px; }
    .bgc-set-list button:hover, .bgc-set-link:hover { background: rgba(26,115,232,.08); }
    .bgc-set-empty { font-size: 13px; color: #80868b; }
    .bgc-about { padding: 16px 24px 20px; font-size: 14px; line-height: 22px; color: #3c4043; }
    .bgc-about .bgc-about-name { font: 500 18px 'Google Sans', Roboto, Arial, sans-serif; color: #202124; }
    .bgc-about .bgc-about-ver { color: #5f6368; font-size: 13px; margin-bottom: 10px; }
    .bgc-about a { color: #1a73e8; text-decoration: none; display: block; }
    .bgc-about div > a { display: inline; }
    .bgc-about a:hover { text-decoration: underline; }
  `);

  // ---- small form helpers shared with feature-provided sections -------------
  const h = {
    note: (body, text) => body.appendChild(el('div', 'bgc-set-note', text)),
    row(body, label, control, hint) {
      const row = el('div', 'bgc-set-row');
      const lab = el('label', null, label);
      if (control.id) lab.htmlFor = control.id;
      row.appendChild(lab);
      row.appendChild(control);
      body.appendChild(row);
      if (hint) body.appendChild(el('div', 'bgc-set-note', hint));
      return row;
    },
    check(body, label, on, onChange, hint) {
      const input = el('input');
      input.type = 'checkbox';
      input.id = 'bgc-set-' + Math.random().toString(36).slice(2, 8);
      input.checked = !!on;
      input.addEventListener('change', () => onChange(input.checked));
      return h.row(body, label, input, hint);
    },
    number(body, label, value, onChange, opts) {
      opts = opts || {};
      const input = el('input');
      input.type = 'number';
      input.id = 'bgc-set-' + Math.random().toString(36).slice(2, 8);
      if (opts.min != null) input.min = opts.min;
      if (opts.max != null) input.max = opts.max;
      if (opts.step != null) input.step = opts.step;
      input.value = value;
      input.addEventListener('change', () => {
        const v = Number(input.value);
        if (!Number.isNaN(v)) onChange(v);
      });
      return h.row(body, label, input, opts.hint);
    },
    select(body, label, value, options, onChange) {
      const sel = el('select');
      sel.id = 'bgc-set-' + Math.random().toString(36).slice(2, 8);
      for (const [v, text] of options) {
        const o = el('option', null, text);
        o.value = v;
        sel.appendChild(o);
      }
      sel.value = value;
      sel.addEventListener('change', () => onChange(sel.value));
      return h.row(body, label, sel);
    },
    text(body, label, value, onChange, placeholder, hint) {
      const input = el('input');
      input.type = 'text';
      input.id = 'bgc-set-' + Math.random().toString(36).slice(2, 8);
      input.value = value || '';
      if (placeholder) input.placeholder = placeholder;
      input.addEventListener('change', () => onChange(input.value));
      return h.row(body, label, input, hint);
    },
    color(body, label, value, onChange) {
      const wrap = el('span');
      wrap.style.cssText = 'display:inline-flex;align-items:center;gap:8px';
      const swatch = el('span', 'bgc-set-swatch');
      swatch.style.background = value || 'transparent';
      const input = el('input');
      input.type = 'text';
      input.value = value || '';
      input.placeholder = 'CSS colour, empty = none';
      input.addEventListener('change', () => {
        swatch.style.background = input.value || 'transparent';
        onChange(input.value.trim());
      });
      wrap.append(swatch, input);
      return h.row(body, label, wrap);
    },
    list(body, items, render) {
      const ul = el('ul', 'bgc-set-list');
      if (!items.length) ul.appendChild(el('li', 'bgc-set-empty', 'Nothing saved yet.'));
      for (const item of items) {
        const li = el('li');
        render(li, item);
        ul.appendChild(li);
      }
      body.appendChild(ul);
      return ul;
    },
    link(body, label, onClick) {
      const b = el('button', 'bgc-set-link', label);
      b.type = 'button';
      b.addEventListener('click', onClick);
      body.appendChild(b);
      return b;
    },
    el,
    toast,
    rerender: () => rerender(),
  };

  const extra = [];
  function register(section) {
    extra.push(section);
    if (dialogNode) rerender();
  }

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  async function coreSections() {
    const F = BGC.features || {};
    const qa = await settings.get('quickadd', { defaultMinutes: 60, dateOrder: 'dmy', showFab: true });
    const tpl = await settings.get('templates', { items: [] });
    const out = [];

    out.push({
      id: 'quickadd',
      title: 'Quick add',
      render(body) {
        h.note(body, 'Press q (or the + button) and type “Lunch with ana@x.com tomorrow 1-2pm at Bar Lobo”; Google’s form opens pre-filled.');
        h.check(body, 'Show the floating Quick add button', qa.showFab !== false, (v) => settings.set('quickadd', { showFab: v }));
        h.number(body, 'Default event length (minutes) when no end is typed', qa.defaultMinutes || 60, (v) => settings.set('quickadd', { defaultMinutes: v }), { min: 5, max: 1440, step: 5 });
        h.select(body, 'Numeric dates are read as', qa.dateOrder || 'dmy', [['dmy', 'day/month (14/11)'], ['mdy', 'month/day (11/14)']], (v) => settings.set('quickadd', { dateOrder: v }));
      },
    });

    out.push({
      id: 'templates',
      title: 'Templates',
      render(body) {
        h.note(body, 'Saved from the Quick add box (“Save as template”). Click a template, type a day, press Enter.');
        const items = tpl.items || [];
        h.list(body, items, (li, t) => {
          li.appendChild(el('span', null, t.name));
          const del = el('button', null, 'Delete');
          del.type = 'button';
          del.addEventListener('click', () => settings.set('templates', { items: items.filter((x) => x.id !== t.id) }).then(rerender));
          li.appendChild(del);
        });
      },
    });

    if (F.declutter) {
      out.push({
        id: 'declutter',
        title: 'Look and declutter',
        render(body) {
          for (const [id, t] of Object.entries(F.declutter.TOGGLES)) {
            h.check(body, t.label, F.declutter.isOn(id), () => F.declutter.toggle(id));
          }
        },
      });
    }

    if (F.gridTheme) {
      out.push({
        id: 'gridTheme',
        title: 'Grid colours and working hours',
        render(body) {
          const p = F.gridTheme.get();
          const set = (patch) => F.gridTheme.set(patch);
          h.check(body, 'Colour weekends, holidays and today; shade non-working hours', p.enabled !== false, (v) => set({ enabled: v }));
          h.check(body, 'Shade hours outside working hours', p.shadeOffHours !== false, (v) => set({ shadeOffHours: v }));
          h.check(body, 'Start the day view at the first working hour (skip night hours)', p.focusHours !== false, (v) => set({ focusHours: v }));
          h.number(body, 'Working hours start (0–23)', p.workStart, (v) => set({ workStart: Math.max(0, Math.min(23, v)) }), { min: 0, max: 23 });
          h.number(body, 'Working hours end (1–24)', p.workEnd, (v) => set({ workEnd: Math.max(1, Math.min(24, v)) }), { min: 1, max: 24 });
          const days = el('div', 'bgc-set-days');
          DAYS.forEach((name, i) => {
            const lab = el('label', (p.workDays || []).includes(i) ? 'bgc-on' : '', name);
            const cb = el('input');
            cb.type = 'checkbox';
            cb.checked = (p.workDays || []).includes(i);
            cb.addEventListener('change', () => {
              const cur = new Set(F.gridTheme.get().workDays || []);
              if (cb.checked) cur.add(i);
              else cur.delete(i);
              lab.classList.toggle('bgc-on', cb.checked);
              set({ workDays: Array.from(cur).sort() });
            });
            lab.appendChild(cb);
            days.appendChild(lab);
          });
          h.row(body, 'Working days', days);
          const colors = p.colors || {};
          for (const [key, label] of [['sat', 'Saturday tint'], ['sun', 'Sunday tint'], ['holiday', 'Holiday tint'], ['today', 'Today tint']]) {
            h.color(body, label, colors[key], (v) => set({ colors: Object.assign({}, F.gridTheme.get().colors, { [key]: v }) }));
          }
          h.color(body, 'Non-working hours shade', p.shadeColor, (v) => set({ shadeColor: v }));
          h.text(body, 'Holidays (YYYY-MM-DD, comma separated)', (p.holidays || []).join(', '), (v) => set({ holidays: v.split(/[\s,]+/).filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s)) }), '2026-12-25, 2027-01-01');
        },
      });
    }

    if (F.gridEvents) {
      out.push({
        id: 'gridEvents',
        title: 'Events in the grid',
        render(body) {
          const p = F.gridEvents.get();
          const set = (patch) => F.gridEvents.set(patch);
          h.check(body, 'Dim past events', p.dimPast !== false, (v) => set({ dimPast: v }));
          h.number(body, 'Opacity of past events (0.1–1)', p.pastOpacity, (v) => set({ pastOpacity: Math.max(0.1, Math.min(1, v)) }), { min: 0.1, max: 1, step: 0.05 });
          h.check(body, 'Fade declined events', p.dimDeclined !== false, (v) => set({ dimDeclined: v }));
          h.number(body, 'Opacity of declined events (0.1–1)', p.declinedOpacity, (v) => set({ declinedOpacity: Math.max(0.1, Math.min(1, v)) }), { min: 0.1, max: 1, step: 0.05 });
          h.check(body, 'Show hours total per colour (bottom-left box)', p.showTotals !== false, (v) => set({ showTotals: v }));
          h.check(body, 'Show the Now bar (countdown, time left, Join)', p.showNowBar !== false, (v) => set({ showNowBar: v }));
        },
      });
    }

    out.push({
      id: 'tools',
      title: 'Export, free times and .ics import',
      render(body) {
        h.note(body, 'No options. From the palette (Ctrl+K): “Download visible events as .ics”, “Copy visible events”, “Share my free times” (uses the working hours above). Drop or paste .ics anywhere on the calendar to import.');
      },
    });
    return out;
  }

  // ---- settings modal -------------------------------------------------------
  let dialogNode = null;
  let bodyNode = null;

  async function render() {
    const sections = (await coreSections()).concat(extra);
    const body = el('div', 'bgc-set-body');
    for (const s of sections) {
      const sec = el('section', 'bgc-set-section');
      sec.dataset.section = s.id;
      sec.appendChild(el('h3', null, s.title));
      try {
        s.render(sec, h);
      } catch (e) {
        sec.appendChild(el('div', 'bgc-set-note', 'This section could not be rendered.'));
        console.error('[Better Google Calendar] settings section failed', s.id, e);
      }
      body.appendChild(sec);
    }
    return body;
  }

  async function rerender() {
    if (!dialogNode || !bodyNode) return;
    const scroll = bodyNode.scrollTop;
    const fresh = await render();
    if (!bodyNode.isConnected) return;
    bodyNode.replaceWith(fresh);
    bodyNode = fresh;
    bodyNode.scrollTop = scroll;
  }

  async function open() {
    const { dialog, close } = openDialog({ title: 'Settings', subtitle: 'Better Google Calendar · changes apply immediately' });
    dialog.classList.add('bgc-settings');
    dialogNode = dialog;
    bodyNode = await render();
    if (!dialog.isConnected) return;
    dialog.appendChild(bodyNode);
    const footer = el('div', 'bgc-footer');
    const hint = el('span', 'bgc-hint');
    const aboutLink = el('button', 'bgc-set-link', `About · v${about.version()}`);
    aboutLink.type = 'button';
    aboutLink.addEventListener('click', openAbout);
    hint.appendChild(aboutLink);
    footer.appendChild(hint);
    const done = el('button', 'bgc-btn bgc-text', 'Close');
    done.type = 'button';
    done.addEventListener('click', close);
    footer.appendChild(done);
    dialog.appendChild(footer);
    dialog.focus();
  }

  function openAbout() {
    const { dialog } = openDialog({ title: 'About' });
    dialog.classList.add('bgc-about-dialog');
    const box = el('div', 'bgc-about');
    box.appendChild(el('div', 'bgc-about-name', about.NAME));
    box.appendChild(el('div', 'bgc-about-ver', `Version ${about.version()}`));
    const by = el('div', null, 'by ');
    const a = el('a', null, about.AUTHOR);
    a.href = about.AUTHOR_URL;
    a.target = '_blank';
    a.rel = 'noopener';
    by.appendChild(a);
    by.style.display = 'block';
    box.appendChild(by);
    for (const [href, text] of [[about.REPO_URL, 'Source code and issues on GitHub'], [about.POST_URL, 'Read the post about the extension']]) {
      const link = el('a', null, text);
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener';
      box.appendChild(link);
    }
    box.appendChild(el('div', 'bgc-set-note', 'Works without access to your Google account: everything happens in this tab.'));
    dialog.appendChild(box);
    const footer = el('div', 'bgc-footer');
    const settingsBtn = el('button', 'bgc-btn bgc-text', 'Settings');
    settingsBtn.type = 'button';
    settingsBtn.addEventListener('click', open);
    const done = el('button', 'bgc-btn bgc-primary', 'Close');
    done.type = 'button';
    done.addEventListener('click', closeDialog);
    footer.append(settingsBtn, done);
    dialog.appendChild(footer);
    dialog.focus();
  }

  // ---- entry points: toolbar popup message and URL hash ----------------------
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (!msg) return false;
      if (msg.type === 'bgc:open-settings') open();
      else if (msg.type === 'bgc:open-about') openAbout();
      else return false;
      sendResponse({ ok: true });
      return false;
    });
  }

  function checkHash() {
    const m = /^#bgc-(settings|about)$/.exec(location.hash);
    if (!m) return;
    history.replaceState(null, '', location.pathname + location.search);
    if (m[1] === 'settings') open();
    else openAbout();
  }
  window.addEventListener('hashchange', checkHash);
  checkHash();

  BGC.features = BGC.features || {};
  BGC.features.settingsUi = { open, openAbout, register };
})();
