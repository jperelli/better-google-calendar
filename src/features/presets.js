// Calendar-selection presets: save the set of checked calendars in the left
// sidebar under a name and restore it with one click (DOM clicks on the sidebar
// checkboxes). Presets live in storage.sync per account (/u/N/). Exposed in the
// palette ("Preset: <name>", "Only this calendar: <name>"), the settings modal
// and a small "Presets" button injected next to the sidebar's "My calendars".
(function () {
  'use strict';
  const BGC = window.BGC;
  const { el, toast, openDialog, closeDialog, addStyle } = BGC.ui;
  const settings = BGC.settings;
  const P = BGC.presets;

  const HEADER_RE = /^(my calendars|mis calendarios|meine kalender|mes agendas|i miei calendari|meus calendários)$/i;
  const GROUP_RE = /calendars|calendarios|kalender|agendas|calendari|calendários/i;

  addStyle(`
    .bgc-pre-list { margin: 0; padding: 8px 0; list-style: none; overflow: auto; }
    .bgc-pre-row { display: flex; align-items: center; gap: 8px; padding: 6px 24px; font-size: 14px; }
    .bgc-pre-row:hover { background: #f8f9fa; }
    .bgc-pre-row .bgc-pre-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bgc-pre-row .bgc-pre-cals { font-size: 12px; color: #5f6368; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bgc-pre-row.bgc-active .bgc-pre-name::before { content: '\\2713 '; color: #1e8e3e; }
    .bgc-pre-row button, .bgc-pre-save button { border: 0; background: transparent; color: #1a73e8; cursor: pointer; font: 500 13px 'Google Sans', Roboto, Arial, sans-serif; padding: 4px 8px; border-radius: 4px; white-space: nowrap; }
    .bgc-pre-row button:hover, .bgc-pre-save button:hover { background: rgba(26,115,232,.08); }
    .bgc-pre-save { display: flex; gap: 8px; align-items: center; padding: 8px 24px 4px; }
    .bgc-pre-save input { flex: 1; font: 14px Roboto, Arial, sans-serif; border: 1px solid #dadce0; border-radius: 4px; padding: 7px 10px; }
    .bgc-pre-save input:focus { outline: 2px solid #1a73e8; outline-offset: -1px; }
    .bgc-pre-hint { padding: 4px 24px 8px; font-size: 12px; color: #5f6368; }
    .bgc-pre-empty { padding: 8px 24px; font-size: 13px; color: #80868b; }
    .bgc-pre-h { padding: 10px 24px 2px; font: 500 12px 'Google Sans', Roboto, Arial, sans-serif; color: #5f6368; text-transform: uppercase; letter-spacing: .6px; }
  `);

  // ---- sidebar access ---------------------------------------------------------
  const ourHost = () => BGC.ui.host;

  function labelOf(box) {
    let label = box.getAttribute('aria-label');
    if (!label && box.getAttribute('aria-labelledby')) {
      label = box
        .getAttribute('aria-labelledby')
        .split(/\s+/)
        .map((id) => (document.getElementById(id) || {}).textContent || '')
        .join(' ');
    }
    if (!label && box.id) {
      const lab = document.querySelector(`label[for="${box.id}"]`);
      if (lab) label = lab.textContent;
    }
    if (!label) {
      const lab = box.closest('label') || box.closest('[role="listitem"], li');
      if (lab) label = lab.textContent;
    }
    return String(label || '').replace(/\s+/g, ' ').trim();
  }

  function isChecked(box) {
    if (box.tagName === 'INPUT') return !!box.checked;
    return box.getAttribute('aria-checked') === 'true';
  }

  // Checkboxes that are not in the grid, our UI, or a dialog: the sidebar calendar lists.
  function readCalendars() {
    const boxes = Array.from(document.querySelectorAll('input[type="checkbox"], [role="checkbox"]'));
    const out = [];
    const seen = new Set();
    for (const box of boxes) {
      if (box.closest('[role="main"], [role="dialog"], #better-google-calendar-root')) continue;
      const rect = box.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0 && box.offsetParent === null && !box.closest('label')) continue;
      const name = labelOf(box);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push({ name, checked: isChecked(box), node: box });
    }
    return out;
  }

  function menuButton() {
    return document.querySelector('[aria-label="Main drawer"], [aria-label="Main menu"], [aria-label="Menú principal"], [role="banner"] button[aria-label*="drawer" i], [role="banner"] button[aria-label*="menu" i]');
  }

  // Expand collapsed calendar groups ("My calendars" / "Other calendars" headers with aria-expanded=false).
  function expandGroups() {
    const toggled = [];
    for (const b of document.querySelectorAll('[aria-expanded="false"]')) {
      if (b.closest('[role="main"], [role="dialog"], #better-google-calendar-root')) continue;
      const text = (b.getAttribute('aria-label') || b.textContent || '').trim();
      if (GROUP_RE.test(text) && text.length < 40) {
        b.click();
        toggled.push(b);
      }
    }
    return toggled;
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Run fn with the sidebar visible and the groups expanded, then put things back.
  async function withSidebar(fn) {
    let cals = readCalendars();
    let openedMenu = false;
    let toggled = [];
    if (!cals.length) {
      toggled = expandGroups();
      if (toggled.length) await sleep(250);
      cals = readCalendars();
    }
    if (!cals.length) {
      const menu = menuButton();
      if (menu) {
        menu.click();
        openedMenu = true;
        await sleep(450);
        toggled = toggled.concat(expandGroups());
        if (toggled.length) await sleep(250);
        cals = readCalendars();
      }
    }
    try {
      if (!cals.length) {
        toast('Better Google Calendar: could not find the calendar list in the left sidebar. Open it (menu button) and try again.');
        return null;
      }
      return await fn(cals);
    } finally {
      for (const b of toggled) if (b.isConnected && b.getAttribute('aria-expanded') === 'true') b.click();
      if (openedMenu) {
        await sleep(150);
        const menu = menuButton();
        if (menu) menu.click();
      }
    }
  }

  async function applyNames(wanted) {
    return withSidebar(async (cals) => {
      const d = P.diffPreset(cals, wanted);
      for (const name of d.check.concat(d.uncheck)) {
        const c = cals.find((x) => x.name === name);
        if (c) {
          c.node.click();
          await sleep(30);
        }
      }
      if (d.missing.length) toast(`Preset applied; ${d.missing.length} calendar(s) no longer exist: ${d.missing.join(', ')}`);
      return d;
    });
  }

  // ---- storage ------------------------------------------------------------------
  let store = { accounts: {} };
  const account = () => String(P.accountIndex(location.pathname));
  const items = () => (store.accounts && store.accounts[account()]) || [];
  function saveItems(list) {
    const accounts = Object.assign({}, store.accounts, { [account()]: list });
    return settings.set('presets', { accounts });
  }
  settings.get('presets', { accounts: {} }).then((s) => {
    store = s;
  });
  settings.onChange('presets', (s) => {
    store = s || { accounts: {} };
    if (dialogList) renderDialog();
  });

  async function saveCurrent(name) {
    return withSidebar(async (cals) => {
      const list = P.upsertPreset(items(), { name, calendars: P.checkedNames(cals) });
      await saveItems(list);
      toast(`Preset "${name}" saved (${P.checkedNames(cals).length} calendars).`);
      return list;
    });
  }

  async function apply(preset) {
    const d = await applyNames(preset.calendars);
    if (d) toast(`Preset "${preset.name}" applied.`);
  }

  async function onlyThis(name) {
    const d = await applyNames([name]);
    if (d) toast(`Showing only "${name}".`);
  }

  // ---- dialog -------------------------------------------------------------------
  let dialogList = null;
  function renderDialog() {
    if (!dialogList || !dialogList.isConnected) return;
    dialogList.textContent = '';
    const cals = readCalendars();
    const list = items();
    dialogList.appendChild(el('div', 'bgc-pre-h', 'Saved presets'));
    if (!list.length) dialogList.appendChild(el('div', 'bgc-pre-empty', 'No presets yet. Tick the calendars you want, type a name above and press Save.'));
    for (const p of list) {
      const row = el('div', 'bgc-pre-row');
      if (cals.length && P.matches(cals, p)) row.classList.add('bgc-active');
      const name = el('span', 'bgc-pre-name', p.name);
      name.appendChild(el('span', 'bgc-pre-cals', p.calendars.join(', ')));
      row.appendChild(name);
      const applyBtn = el('button', 'bgc-pre-apply', 'Apply');
      applyBtn.type = 'button';
      applyBtn.addEventListener('click', () => apply(p).then(renderDialog));
      const upd = el('button', null, 'Update');
      upd.type = 'button';
      upd.title = 'Overwrite with the calendars checked now';
      upd.addEventListener('click', () => saveCurrent(p.name));
      const ren = el('button', null, 'Rename');
      ren.type = 'button';
      ren.addEventListener('click', () => {
        const v = prompt('New name for the preset:', p.name);
        if (v && v.trim()) saveItems(P.renamePreset(items(), p.id, v));
      });
      const del = el('button', null, 'Delete');
      del.type = 'button';
      del.addEventListener('click', () => saveItems(P.deletePreset(items(), p.id)));
      row.append(applyBtn, upd, ren, del);
      dialogList.appendChild(row);
    }
    if (cals.length) {
      dialogList.appendChild(el('div', 'bgc-pre-h', 'Only this calendar'));
      for (const c of cals) {
        const row = el('div', 'bgc-pre-row');
        row.appendChild(el('span', 'bgc-pre-name', c.name));
        const only = el('button', 'bgc-pre-only', 'Only this');
        only.type = 'button';
        only.addEventListener('click', () => onlyThis(c.name).then(renderDialog));
        row.appendChild(only);
        dialogList.appendChild(row);
      }
    }
  }

  function open() {
    const { dialog } = openDialog({ title: 'Calendar presets', subtitle: 'Save which calendars are ticked in the left sidebar and switch sets in one click' });
    dialog.classList.add('bgc-presets');
    const save = el('div', 'bgc-pre-save');
    const input = el('input', 'bgc-pre-name-input');
    input.type = 'text';
    input.placeholder = 'Name for the calendars ticked now (e.g. Work only)';
    const btn = el('button', 'bgc-btn bgc-primary', 'Save');
    btn.type = 'button';
    const doSave = () => {
      const name = input.value.trim();
      if (!name) return input.focus();
      saveCurrent(name).then((list) => {
        if (list) input.value = '';
        renderDialog();
      });
    };
    btn.addEventListener('click', doSave);
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') doSave();
    });
    save.append(input, btn);
    dialog.appendChild(save);
    dialog.appendChild(el('div', 'bgc-pre-hint', 'Also in the command palette (Ctrl+K): "Preset: <name>", "Only this calendar: <name>". Presets are kept per Google account and synced with Chrome.'));
    dialogList = el('div', 'bgc-pre-list');
    dialog.appendChild(dialogList);
    renderDialog();
    const footer = el('div', 'bgc-footer');
    const done = el('button', 'bgc-btn bgc-text', 'Close');
    done.type = 'button';
    done.addEventListener('click', closeDialog);
    footer.appendChild(done);
    dialog.appendChild(footer);
    input.focus();
  }

  // ---- "Presets" button next to "My calendars" -------------------------------------
  let button = null;
  let lastInject = 0;
  function findHeader() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (!HEADER_RE.test(n.nodeValue.trim())) continue;
      const elNode = n.parentElement;
      if (!elNode || elNode.closest('[role="main"], [role="dialog"], #better-google-calendar-root, script, style')) continue;
      return elNode;
    }
    return null;
  }

  function inject() {
    if (button && button.isConnected) return;
    const now = Date.now();
    if (now - lastInject < 1000) return;
    lastInject = now;
    const header = findHeader();
    if (!header) return;
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'bgc-presets-btn';
      button.textContent = 'Presets';
      button.title = 'Calendar presets (Better Google Calendar)';
      button.setAttribute('aria-label', 'Calendar presets');
      button.style.cssText =
        "margin-left: 8px; border: 1px solid #dadce0; background: #fff; color: #1a73e8; border-radius: 12px; padding: 1px 10px; font: 500 11px 'Google Sans', Roboto, Arial, sans-serif; cursor: pointer; vertical-align: middle; line-height: 18px;";
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        open();
      });
    }
    // Google's header is a button that collapses the group: place ours beside it, not inside.
    const target = header.closest('button, [role="button"]') || header;
    target.insertAdjacentElement('afterend', button);
  }

  if (BGC.liveGrid) BGC.liveGrid.onChange(() => inject());
  else inject();
  // The sidebar renders after the grid and does not trigger grid rescans: retry for a while.
  let tries = 0;
  const retry = setInterval(() => {
    inject();
    if ((button && button.isConnected) || ++tries > 30) clearInterval(retry);
  }, 1000);

  // ---- palette and settings -----------------------------------------------------------
  function commands() {
    const out = [];
    for (const p of items()) {
      out.push({ id: `preset:${p.id}`, group: 'Calendar presets', label: `Preset: ${p.name}`, hint: p.calendars.join(', '), keywords: ['preset', 'calendars', 'show', p.name], run: () => apply(p) });
    }
    out.push({ id: 'preset:save', group: 'Calendar presets', label: 'Save the calendars ticked now as a preset…', keywords: ['preset', 'save', 'calendars', 'group'], run: () => {
      const name = prompt('Preset name:');
      if (name && name.trim()) saveCurrent(name.trim());
    } });
    out.push({ id: 'preset:manage', group: 'Calendar presets', label: 'Manage calendar presets', keywords: ['preset', 'calendars', 'manage', 'rename', 'delete'], run: open });
    for (const c of readCalendars()) {
      out.push({ id: `preset:only:${c.name}`, group: 'Calendar presets', label: `Only this calendar: ${c.name}`, keywords: ['only', 'calendar', 'solo', c.name], run: () => onlyThis(c.name) });
    }
    return out;
  }

  if (BGC.features && BGC.features.settingsUi) {
    BGC.features.settingsUi.register({
      id: 'presets',
      title: 'Calendar presets',
      render(body, h) {
        h.note(body, 'Named sets of ticked sidebar calendars for this Google account. Apply from here, the palette ("Preset: <name>") or the Presets button next to "My calendars".');
        const list = items();
        h.list(body, list, (li, p) => {
          li.appendChild(el('span', null, `${p.name} (${p.calendars.length})`));
          for (const [label, fn] of [
            ['Apply', () => apply(p)],
            ['Rename', () => { const v = prompt('New name for the preset:', p.name); if (v && v.trim()) saveItems(P.renamePreset(items(), p.id, v)).then(h.rerender); }],
            ['Delete', () => saveItems(P.deletePreset(items(), p.id)).then(h.rerender)],
          ]) {
            const b = el('button', null, label);
            b.type = 'button';
            b.addEventListener('click', fn);
            li.appendChild(b);
          }
        });
        h.link(body, 'Save the calendars ticked now as a preset…', () => {
          const name = prompt('Preset name:');
          if (name && name.trim()) saveCurrent(name.trim()).then(h.rerender);
        });
      },
    });
  }

  BGC.features = BGC.features || {};
  BGC.features.presets = { open, apply, onlyThis, saveCurrent, readCalendars, commands, items };
})();
