// Command palette (Ctrl+K / Cmd+K): find buried Google Calendar settings by
// plain words, jump to a view or a typed date, search, and toggle the
// extension's own features. Everything is a URL, so it cannot break when
// Google changes its markup.
(function () {
  'use strict';
  const BGC = window.BGC;
  if (!BGC || !BGC.ui || !BGC.palette) return;
  const { el, addStyle, isEditable, mount, shadow, toast } = BGC.ui;
  const { buildCommands, parseCalendarUrl, dateUrl } = BGC.palette;
  const { parseQuickAdd } = BGC.quickadd;
  const settings = BGC.settings;

  addStyle(`
    .bgc-pal-backdrop { position: fixed; inset: 0; z-index: 2147483646; background: rgba(0,0,0,.25); display: flex; justify-content: center; align-items: flex-start; padding-top: 12vh; font: 14px Roboto, Arial, sans-serif; color: #3c4043; }
    .bgc-pal { width: 620px; max-width: calc(100vw - 32px); background: #fff; border-radius: 12px; box-shadow: 0 8px 10px 1px rgba(0,0,0,.14), 0 3px 14px 2px rgba(0,0,0,.12), 0 5px 5px -3px rgba(0,0,0,.2); overflow: hidden; }
    .bgc-pal-input { width: 100%; border: 0; outline: none; padding: 16px 20px; font: 18px 'Google Sans', Roboto, Arial, sans-serif; color: #202124; border-bottom: 1px solid #dadce0; background: #fff; }
    .bgc-pal-list { max-height: 60vh; overflow: auto; padding: 6px 0; margin: 0; list-style: none; }
    .bgc-pal-item { display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; padding: 8px 20px; cursor: pointer; }
    .bgc-pal-item:hover, .bgc-pal-item.bgc-on { background: #e8f0fe; }
    .bgc-pal-label { color: #202124; font-weight: 500; }
    .bgc-pal-hint { color: #5f6368; font-size: 12px; grid-column: 1 / -1; }
    .bgc-pal-group { color: #70757a; font-size: 11px; text-transform: uppercase; letter-spacing: .6px; align-self: center; }
    .bgc-pal-empty { padding: 16px 20px; color: #5f6368; }
    .bgc-pal-foot { padding: 8px 20px 10px; font-size: 12px; color: #70757a; border-top: 1px solid #f1f3f4; display: flex; gap: 14px; }
    .bgc-pal-gear { margin-left: auto; border: 0; background: transparent; color: #1a73e8; cursor: pointer; font: 500 12px 'Google Sans', Roboto, Arial, sans-serif; padding: 0 4px; border-radius: 4px; }
    .bgc-pal-gear:hover { background: rgba(26,115,232,.08); }
    .bgc-pal-foot kbd { font: 11px Roboto, Arial, sans-serif; border: 1px solid #dadce0; border-radius: 3px; padding: 0 4px; }
  `);

  let backdrop = null;
  let qaPrefs = { showFab: true };
  settings.get('quickadd', { showFab: true }).then((p) => (qaPrefs = p));
  settings.onChange('quickadd', (p) => (qaPrefs = p));

  function extensionCommands() {
    return [
      {
        id: 'ext:quickadd',
        group: 'Extension',
        label: 'Quick add an event in plain words',
        keywords: ['quick add', 'new event', 'create', 'nuevo evento', 'q'],
        run: () => BGC.features && BGC.features.quickAdd && BGC.features.quickAdd.open(),
      },
      {
        id: 'ext:fab',
        group: 'Extension',
        label: qaPrefs.showFab === false ? 'Show the Quick add button' : 'Hide the Quick add button (keep the q shortcut)',
        keywords: ['button', 'fab', 'hide', 'show', 'quick add', 'botón'],
        run: () => settings.set('quickadd', { showFab: qaPrefs.showFab === false }).then(() => toast('Quick add button toggled.')),
      },
      {
        id: 'ext:availability',
        group: 'Extension',
        label: 'Share my free times as text (from the visible week)',
        keywords: ['availability', 'free', 'slots', 'share', 'disponibilidad', 'huecos', 'schedule', 'meeting times'],
        run: () => BGC.features && BGC.features.availability && BGC.features.availability.open(),
      },
      ...(BGC.features && BGC.features.export ? BGC.features.export.commands() : []),
      ...declutterCommands(),
      ...(BGC.features && BGC.features.presets ? BGC.features.presets.commands() : []),
      ...(BGC.features && BGC.features.merge ? BGC.features.merge.commands() : []),
      ...gridCommands(),
      {
        id: 'ext:settings',
        group: 'Extension',
        label: 'Settings: every option of Better Google Calendar in one place',
        keywords: ['settings', 'options', 'preferences', 'configure', 'ajustes', 'configuración', 'gear'],
        run: () => BGC.features && BGC.features.settingsUi && BGC.features.settingsUi.open(),
      },
      {
        id: 'ext:about',
        group: 'Extension',
        label: 'About Better Google Calendar (version, author, post)',
        keywords: ['about', 'version', 'author', 'acerca de', 'info'],
        run: () => BGC.features && BGC.features.settingsUi && BGC.features.settingsUi.openAbout(),
      },
      {
        id: 'ext:research',
        group: 'Extension',
        label: 'Better Google Calendar: what is coming / report a problem',
        keywords: ['help', 'about', 'github', 'issue', 'bug', 'ayuda'],
        url: 'https://github.com/jperelli/better-google-calendar',
        newTab: true,
      },
    ];
  }

  function declutterCommands() {
    const d = BGC.features && BGC.features.declutter;
    if (!d) return [];
    return Object.entries(d.TOGGLES).map(([id, t]) => ({
      id: `ext:declutter:${id}`,
      group: 'Extension',
      label: `${d.isOn(id) ? 'Turn off' : 'Turn on'}: ${t.label}`,
      keywords: ['declutter', 'print', 'density', 'hide', 'toggle', 'theme', 'compact', id],
      run: () => d.toggle(id).then(() => toast(`${t.label}: ${d.isOn(id) ? 'on' : 'off'}`)),
    }));
  }

  function gridCommands() {
    const out = [];
    const gt = BGC.features && BGC.features.gridTheme;
    const ge = BGC.features && BGC.features.gridEvents;
    if (gt) {
      const p = gt.get();
      out.push({ id: 'ext:grid:theme', group: 'Extension', label: `${p.enabled ? 'Turn off' : 'Turn on'}: weekend/holiday/today colours and working-hours shading`, keywords: ['weekend', 'shade', 'working hours', 'colour', 'color', 'holiday', 'today'], run: () => gt.set({ enabled: !p.enabled }) });
      out.push({ id: 'ext:grid:focus', group: 'Extension', label: `${p.focusHours ? 'Turn off' : 'Turn on'}: start the day at ${p.workStart}:00 (skip night hours)`, keywords: ['night hours', 'morning', 'scroll', 'focus', 'hide hours', 'start hour'], run: () => gt.set({ focusHours: !p.focusHours }) });
      out.push({ id: 'ext:grid:hours', group: 'Extension', label: `Set working hours (now ${p.workStart}:00–${p.workEnd}:00)`, keywords: ['working hours', 'work hours', 'horario', 'shade'], run: () => {
        const v = prompt('Working hours as start-end, 24h (e.g. 9-18):', `${p.workStart}-${p.workEnd}`);
        const m = v && v.match(/^\s*(\d{1,2})\s*[-–]\s*(\d{1,2})\s*$/);
        if (m) gt.set({ workStart: +m[1], workEnd: +m[2] });
      } });
    }
    if (ge) {
      const p = ge.get();
      out.push({ id: 'ext:grid:dim', group: 'Extension', label: `${p.dimPast ? 'Turn off' : 'Turn on'}: dim past events`, keywords: ['dim', 'past', 'fade', 'grey'], run: () => ge.set({ dimPast: !p.dimPast }) });
      out.push({ id: 'ext:grid:declined', group: 'Extension', label: `${p.dimDeclined ? 'Turn off' : 'Turn on'}: fade declined events`, keywords: ['declined', 'fade', 'dim'], run: () => ge.set({ dimDeclined: !p.dimDeclined }) });
      out.push({ id: 'ext:grid:totals', group: 'Extension', label: `${p.showTotals ? 'Hide' : 'Show'}: hours total per colour`, keywords: ['totals', 'hours', 'time tracking', 'insights', 'sum'], run: () => ge.set({ showTotals: !p.showTotals }) });
      out.push({ id: 'ext:grid:now', group: 'Extension', label: `${p.showNowBar ? 'Hide' : 'Show'}: Now bar (countdown, time left, Join)`, keywords: ['now', 'countdown', 'next event', 'join', 'bar'], run: () => ge.set({ showNowBar: !p.showNowBar }) });
    }
    return out;
  }

  // "go to 14 nov" / "next friday" / "14/11" -> navigation command in the current view
  function dateCommand(query) {
    const q = query.replace(/^\s*(go\s*to|goto|jump\s*to|ir\s+a|open)\s+/i, '').trim();
    if (!q || q.length < 3) return null;
    const parsed = parseQuickAdd(q);
    if (!parsed || !parsed.meta.hasDate) return null;
    const leftovers = parsed.event.summary && parsed.event.summary.replace(/^(No title)$/, '');
    if (leftovers && leftovers.split(/\s+/).length > 1) return null;
    const s = parsed.event.start;
    const d = new Date(s.year, s.month - 1, s.day);
    const ctx = parseCalendarUrl(location.href);
    const label = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    return { id: 'nav:typed', group: 'Go to', label: `Go to ${label}`, keywords: [q, 'go to'], url: dateUrl(ctx, null, d), score: 100 };
  }

  function close() {
    if (backdrop) backdrop.remove();
    backdrop = null;
    document.removeEventListener('keydown', onKey, true);
  }
  function onKey(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  }

  function run(cmd, query) {
    close();
    if (cmd.run) return cmd.run();
    let url = cmd.url;
    if (cmd.takesQuery) {
      const q = query.replace(/^\s*(search|find|buscar)\s*/i, '').trim();
      url = `${url}?q=${encodeURIComponent(q)}`;
    }
    if (cmd.hint) toast(`Look under: ${cmd.hint}`);
    if (cmd.newTab) window.open(url, '_blank', 'noopener');
    else location.assign(url);
  }

  function open() {
    if (backdrop) return close();
    mount();
    backdrop = el('div', 'bgc-pal-backdrop');
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });
    const pal = el('div', 'bgc-pal');
    pal.setAttribute('role', 'dialog');
    pal.setAttribute('aria-label', 'Command palette');
    const input = el('input', 'bgc-pal-input');
    input.type = 'text';
    input.placeholder = 'Type a setting (“declined”, “meet”, “week starts”), a view, or a date (“14 nov”)…';
    const list = el('ul', 'bgc-pal-list');
    const foot = el('div', 'bgc-pal-foot');
    foot.innerHTML = '<span><kbd>↑</kbd><kbd>↓</kbd> choose</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span><span>Google settings open Google\u2019s page; the toast tells you which section.</span>';
    const gear = el('button', 'bgc-pal-gear', '\u2699 Settings');
    gear.type = 'button';
    gear.title = 'Better Google Calendar settings';
    gear.addEventListener('click', () => {
      close();
      if (BGC.features && BGC.features.settingsUi) BGC.features.settingsUi.open();
    });
    foot.appendChild(gear);
    pal.append(input, list, foot);
    backdrop.appendChild(pal);
    shadow.appendChild(backdrop);
    document.addEventListener('keydown', onKey, true);

    let items = [];
    let sel = 0;
    function render() {
      const query = input.value;
      const extra = extensionCommands();
      const typed = dateCommand(query);
      if (typed) extra.unshift(typed);
      items = buildCommands(location.href, query, { extra, limit: 14 });
      if (/^\s*(search|find|buscar)\s+\S/i.test(query)) {
        const s = items.find((c) => c.takesQuery) || buildCommands(location.href, 'search', {}).find((c) => c.takesQuery);
        if (s) items = [s].concat(items.filter((c) => c !== s));
      }
      sel = Math.min(sel, Math.max(0, items.length - 1));
      list.textContent = '';
      if (!items.length) {
        list.appendChild(el('div', 'bgc-pal-empty', 'Nothing matches. Try “declined”, “invitations”, “time zone”, “month”, “14 nov”, “search budget”.'));
        return;
      }
      items.forEach((cmd, i) => {
        const li = el('li', 'bgc-pal-item' + (i === sel ? ' bgc-on' : ''));
        li.appendChild(el('span', 'bgc-pal-label', cmd.label));
        li.appendChild(el('span', 'bgc-pal-group', cmd.group));
        if (cmd.hint) li.appendChild(el('span', 'bgc-pal-hint', cmd.hint));
        li.addEventListener('mouseenter', () => {
          sel = i;
          for (const n of list.children) n.classList.toggle('bgc-on', n === li);
        });
        li.addEventListener('click', () => run(cmd, input.value));
        list.appendChild(li);
      });
    }
    input.addEventListener('input', () => {
      sel = 0;
      render();
    });
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        sel = Math.min(items.length - 1, sel + 1);
        render();
        const node = list.children[sel];
        if (node && node.scrollIntoView) node.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        sel = Math.max(0, sel - 1);
        render();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[sel]) run(items[sel], input.value);
      }
    });
    input.addEventListener('keyup', (e) => e.stopPropagation());
    input.addEventListener('keypress', (e) => e.stopPropagation());
    render();
    input.focus();
  }

  document.addEventListener(
    'keydown',
    (e) => {
      const ctrlK = (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 'k' || e.key === 'K');
      const altP = e.altKey && e.shiftKey && (e.key === 'P' || e.key === 'p' || e.code === 'KeyP');
      if (!ctrlK && !altP) return;
      if (isEditable(e.target) && !ctrlK) return;
      e.preventDefault();
      e.stopPropagation();
      open();
    },
    true
  );

  BGC.features = BGC.features || {};
  BGC.features.palette = { open, close };
})();
