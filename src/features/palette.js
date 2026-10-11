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
        id: 'ext:research',
        group: 'Extension',
        label: 'Better Google Calendar: what is coming / report a problem',
        keywords: ['help', 'about', 'github', 'issue', 'bug', 'ayuda'],
        url: 'https://github.com/jperelli/better-google-calendar',
        newTab: true,
      },
    ];
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
    foot.innerHTML = '<span><kbd>↑</kbd><kbd>↓</kbd> choose</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span><span>Settings open Google\u2019s page; the toast tells you which section.</span>';
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
