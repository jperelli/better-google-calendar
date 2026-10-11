// Quick Add: a one-line natural-language box ("lunch with Ana tomorrow 1-2pm
// at Bar Lobo every friday") that opens Google's pre-filled "new event" form.
// Opened with the floating button, the `q` key, or Alt+Shift+Q.
(function () {
  'use strict';
  const BGC = window.BGC;
  if (!BGC || !BGC.ui || !BGC.quickadd) return;
  const { el, addStyle, toast, openUrls, isEditable, mount, shadow } = BGC.ui;
  const { parseQuickAdd, RECURRENCE_PRESETS } = BGC.quickadd;
  const { buildEventEditUrl, eventEditBase } = BGC.gcal;
  const { templateFromResult, applyTemplate } = BGC.templates;
  const settings = BGC.settings;
  let templates = [];
  settings.get('templates', { items: [] }).then((t) => {
    templates = t.items || [];
  });
  settings.onChange('templates', (t) => {
    templates = (t && t.items) || [];
    if (panel && panel.__renderTemplates) panel.__renderTemplates();
  });
  function saveTemplates(items) {
    templates = items;
    return settings.set('templates', { items });
  }

  addStyle(`
    .bgc-qa-fab {
      position: fixed; right: 24px; bottom: 24px; z-index: 2147483640;
      height: 44px; padding: 0 18px 0 14px; border-radius: 22px; border: 0; cursor: pointer;
      background: #1a73e8; color: #fff; font: 500 14px 'Google Sans', Roboto, Arial, sans-serif;
      box-shadow: 0 1px 3px rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15);
      display: inline-flex; align-items: center; gap: 8px;
    }
    .bgc-qa-fab:hover { background: #1b66c9; }
    .bgc-qa-fab svg { width: 22px; height: 22px; fill: #fff; }
    .bgc-qa-fab kbd { font: 11px Roboto, Arial, sans-serif; opacity: .8; border: 1px solid rgba(255,255,255,.5); border-radius: 3px; padding: 0 4px; }
    .bgc-qa-panel {
      position: fixed; right: 24px; bottom: 80px; z-index: 2147483645; width: 520px; max-width: calc(100vw - 48px);
      background: #fff; color: #3c4043; border-radius: 12px; padding: 16px;
      box-shadow: 0 8px 10px 1px rgba(0,0,0,.14), 0 3px 14px 2px rgba(0,0,0,.12), 0 5px 5px -3px rgba(0,0,0,.2);
      font: 14px Roboto, Arial, sans-serif;
    }
    .bgc-qa-input {
      width: 100%; font: 16px 'Google Sans', Roboto, Arial, sans-serif; padding: 10px 12px; border-radius: 8px;
      border: 1px solid #dadce0; outline: none; color: #202124; background: #fff;
    }
    .bgc-qa-input:focus { border-color: #1a73e8; box-shadow: 0 0 0 1px #1a73e8; }
    .bgc-qa-preview { margin: 10px 2px 0; min-height: 40px; line-height: 20px; color: #3c4043; }
    .bgc-qa-preview .bgc-qa-title { font-weight: 500; color: #202124; }
    .bgc-qa-preview .bgc-qa-muted { color: #70757a; }
    .bgc-qa-row { display: flex; gap: 8px; align-items: center; margin-top: 12px; flex-wrap: wrap; }
    .bgc-qa-row label { color: #5f6368; font-size: 12px; }
    .bgc-qa-select {
      font: 13px Roboto, Arial, sans-serif; padding: 6px 8px; border-radius: 6px; border: 1px solid #dadce0; background: #fff; color: #3c4043;
    }
    .bgc-qa-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
    .bgc-qa-hint { font-size: 12px; color: #70757a; margin-top: 10px; line-height: 16px; }
    .bgc-qa-hint code { background: #f1f3f4; padding: 0 4px; border-radius: 3px; }
    .bgc-qa-tpls { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 10px; }
    .bgc-qa-tpls label { color: #5f6368; font-size: 12px; margin-right: 2px; }
    .bgc-qa-tpl {
      display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 10px; border-radius: 14px;
      border: 1px solid #dadce0; background: #fff; color: #3c4043; font: 13px Roboto, Arial, sans-serif; cursor: pointer;
    }
    .bgc-qa-tpl:hover { background: #f8f9fa; }
    .bgc-qa-tpl.bgc-on { background: #e8f0fe; border-color: #d2e3fc; color: #1967d2; }
    .bgc-qa-tpl .bgc-qa-x { display: none; width: 16px; height: 16px; border-radius: 50%; line-height: 16px; text-align: center; font-size: 12px; color: #5f6368; }
    .bgc-qa-tpl:hover .bgc-qa-x { display: inline-block; }
    .bgc-qa-tpl .bgc-qa-x:hover { background: #dadce0; color: #202124; }
    .bgc-qa-tpl.bgc-qa-save { border-style: dashed; color: #1a73e8; }
    .bgc-qa-name { font: 13px Roboto, Arial, sans-serif; padding: 4px 8px; border: 1px solid #1a73e8; border-radius: 14px; outline: none; width: 160px; }
  `);

  const ICON_BOLT = '<svg viewBox="0 0 24 24"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>';
  const DURATIONS = [15, 30, 45, 60, 90, 120];
  const DEFAULTS = { defaultMinutes: 60, dateOrder: guessDateOrder(), showFab: true };
  let prefs = Object.assign({}, DEFAULTS);
  let panel = null;
  let fab = null;

  function guessDateOrder() {
    const lang = (navigator.language || '').toLowerCase();
    return lang === 'en-us' || lang === 'en' ? 'mdy' : 'dmy';
  }

  settings.get('quickadd', DEFAULTS).then((p) => {
    prefs = p;
    renderFab();
  });
  settings.onChange('quickadd', (p) => {
    prefs = Object.assign({}, DEFAULTS, p);
    renderFab();
  });

  function renderFab() {
    if (prefs.showFab === false) {
      if (fab) fab.remove();
      return;
    }
    if (!fab) {
      fab = el('button', 'bgc-qa-fab');
      fab.type = 'button';
      fab.title = 'Quick add an event in plain words (q)';
      fab.innerHTML = `${ICON_BOLT}<span>Quick add</span><kbd>q</kbd>`;
      fab.addEventListener('click', () => togglePanel());
    }
    mount();
    if (!fab.isConnected) shadow.appendChild(fab);
  }

  const fmtDate = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  const toDate = (c) => new Date(c.year, c.month - 1, c.day, c.hour, c.minute, c.second);

  function describe(result) {
    const { event, meta } = result;
    const parts = [];
    const s = toDate(event.start);
    const e = toDate(event.end);
    if (meta.allDay) {
      const days = Math.round((e - s) / 86400000);
      parts.push(`${fmtDate.format(s)}${days > 1 ? ` – ${fmtDate.format(new Date(e - 86400000))}` : ''} · all day`);
    } else {
      parts.push(`${fmtDate.format(s)} · ${fmtTime.format(s)} – ${fmtTime.format(e)}`);
    }
    if (event.location) parts.push(event.location);
    if (event.attendees.length) parts.push(`${event.attendees.length} guest${event.attendees.length > 1 ? 's' : ''}`);
    if (event.rrule) parts.push(`repeats (${event.rrule.replace('FREQ=', '').toLowerCase().replace(/;/g, ', ')})`);
    return parts;
  }

  function describeTemplate(tpl) {
    const parts = [tpl.title];
    if (tpl.allDay) parts.push('all day');
    else if (tpl.startHour != null) parts.push(`${String(tpl.startHour).padStart(2, '0')}:${String(tpl.startMinute || 0).padStart(2, '0')}, ${tpl.minutes} min`);
    if (tpl.location) parts.push(tpl.location);
    if (tpl.guests && tpl.guests.length) parts.push(`${tpl.guests.length} guests`);
    if (tpl.rrule) parts.push(tpl.rrule);
    return parts.join(' · ');
  }

  function closePanel() {
    if (panel) panel.remove();
    panel = null;
    document.removeEventListener('keydown', onPanelKey, true);
  }

  function onPanelKey(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closePanel();
    }
  }

  function togglePanel(initialText) {
    if (panel) return closePanel();
    mount();
    panel = el('div', 'bgc-qa-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Quick add');

    const input = el('input', 'bgc-qa-input');
    input.type = 'text';
    input.placeholder = 'Lunch with ana@x.com tomorrow 1-2pm at Bar Lobo every friday';
    input.setAttribute('aria-label', 'Describe the event in plain words');
    if (initialText) input.value = initialText;
    panel.appendChild(input);

    const preview = el('div', 'bgc-qa-preview');
    panel.appendChild(preview);

    const tplRow = el('div', 'bgc-qa-tpls');
    panel.appendChild(tplRow);
    let activeTemplate = null;
    let naming = false;
    function renderTemplates() {
      tplRow.textContent = '';
      tplRow.appendChild(el('label', null, 'Templates'));
      for (const tpl of templates) {
        const chip = el('button', 'bgc-qa-tpl' + (activeTemplate && activeTemplate.id === tpl.id ? ' bgc-on' : ''));
        chip.type = 'button';
        chip.title = describeTemplate(tpl);
        chip.appendChild(el('span', null, tpl.name));
        const x = el('span', 'bgc-qa-x', '\u00d7');
        x.title = 'Delete template';
        x.addEventListener('click', (e) => {
          e.stopPropagation();
          if (activeTemplate && activeTemplate.id === tpl.id) activeTemplate = null;
          saveTemplates(templates.filter((t) => t.id !== tpl.id)).then(() => {
            renderTemplates();
            update();
          });
        });
        chip.appendChild(x);
        chip.addEventListener('click', () => {
          activeTemplate = activeTemplate && activeTemplate.id === tpl.id ? null : tpl;
          renderTemplates();
          update();
          input.focus();
        });
        tplRow.appendChild(chip);
      }
      if (naming) {
        const name = el('input', 'bgc-qa-name');
        name.placeholder = 'Template name, Enter to save';
        name.value = (current && current.event.summary) || '';
        name.addEventListener('keydown', (e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            const base = activeTemplate ? current : current;
            if (!base) return;
            const tpl = templateFromResult(base, name.value.trim() || base.event.summary);
            saveTemplates(templates.filter((t) => t.name !== tpl.name).concat([tpl])).then(() => {
              naming = false;
              activeTemplate = tpl;
              renderTemplates();
              update();
              toast(`Template "${tpl.name}" saved. Click it, type a day, press Enter.`);
            });
          } else if (e.key === 'Escape') {
            e.preventDefault();
            naming = false;
            renderTemplates();
            input.focus();
          }
        });
        tplRow.appendChild(name);
        setTimeout(() => name.focus(), 0);
      } else {
        const save = el('button', 'bgc-qa-tpl bgc-qa-save', '+ Save as template');
        save.type = 'button';
        save.title = 'Keep title, time, length, place, guests and repeat rule of what is typed as a reusable template';
        save.addEventListener('click', () => {
          if (!current) {
            toast('Type the event first (e.g. "Shift 2 at 14:00 for 8 hours at Plant B"), then save it as a template.');
            return;
          }
          naming = true;
          renderTemplates();
        });
        tplRow.appendChild(save);
      }
    }
    panel.__renderTemplates = renderTemplates;

    const row = el('div', 'bgc-qa-row');
    const durLabel = el('label', null, 'Default length');
    const dur = el('select', 'bgc-qa-select');
    for (const m of DURATIONS) {
      const o = el('option', null, m >= 60 ? `${m / 60} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`);
      o.value = String(m);
      dur.appendChild(o);
    }
    dur.value = String(prefs.defaultMinutes || 60);
    dur.addEventListener('change', () => {
      settings.set('quickadd', { defaultMinutes: +dur.value });
      prefs.defaultMinutes = +dur.value;
      update();
    });
    const recLabel = el('label', null, 'Repeat');
    const rec = el('select', 'bgc-qa-select');
    const auto = el('option', null, 'As typed');
    auto.value = 'auto';
    rec.appendChild(auto);
    for (const p of RECURRENCE_PRESETS) {
      const o = el('option', null, p.label);
      o.value = p.id;
      rec.appendChild(o);
    }
    rec.addEventListener('change', update);
    const order = el('select', 'bgc-qa-select');
    for (const [v, label] of [['dmy', 'day/month'], ['mdy', 'month/day']]) {
      const o = el('option', null, label);
      o.value = v;
      order.appendChild(o);
    }
    order.value = prefs.dateOrder || 'dmy';
    order.title = 'How to read numeric dates like 3/11';
    order.addEventListener('change', () => {
      settings.set('quickadd', { dateOrder: order.value });
      prefs.dateOrder = order.value;
      update();
    });
    row.append(durLabel, dur, recLabel, rec, order);
    panel.appendChild(row);

    const actions = el('div', 'bgc-qa-actions');
    const cancel = el('button', 'bgc-btn bgc-text', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', closePanel);
    const newTab = el('button', 'bgc-btn', 'Open in new tab');
    newTab.type = 'button';
    newTab.title = 'Shift+Enter';
    const go = el('button', 'bgc-btn bgc-primary', 'Open event form');
    go.type = 'button';
    go.title = 'Enter';
    actions.append(cancel, newTab, go);
    panel.appendChild(actions);

    const hint = el('div', 'bgc-qa-hint');
    hint.innerHTML =
      'Understands English and Spanish: <code>tomorrow</code>, <code>next friday</code>, <code>14 nov</code>, ' +
      '<code>1-2pm</code>, <code>a las 17</code>, <code>for 45 min</code>, <code>at Bar Lobo</code>, e-mails as guests, ' +
      '<code>every weekday</code>, <code>every last friday</code>, <code>cada último día del mes</code>. ' +
      'Google\u2019s form opens pre-filled; nothing is saved until you press Save there.';
    panel.appendChild(hint);

    let current = null;
    function update() {
      preview.textContent = '';
      current = null;
      let text = input.value.trim();
      if (!text && activeTemplate) text = 'today';
      if (!text) {
        preview.appendChild(el('span', 'bgc-qa-muted', 'Type what, when and where. Enter opens Google\u2019s pre-filled form.'));
        return;
      }
      let result = parseQuickAdd(text, { defaultMinutes: prefs.defaultMinutes, dateOrder: prefs.dateOrder });
      if (!result) return;
      if (activeTemplate) result = applyTemplate(result, activeTemplate);
      if (rec.value !== 'auto') {
        const preset = RECURRENCE_PRESETS.find((p) => p.id === rec.value);
        result.event.rrule = preset ? preset.rrule(toDate(result.event.start)) : result.event.rrule;
      }
      current = result;
      preview.appendChild(el('div', 'bgc-qa-title', result.event.summary || '(No title)'));
      preview.appendChild(el('div', 'bgc-qa-muted', describe(result).join(' · ')));
    }

    function submit(inNewTab) {
      if (!current) return;
      const url = buildEventEditUrl(current.event, current.ctx, { base: eventEditBase(location.href) });
      closePanel();
      if (inNewTab) openUrls([url]);
      else location.assign(url);
    }

    input.addEventListener('input', update);
    input.addEventListener('keydown', (e) => {
      e.stopPropagation(); // keep Google's single-key shortcuts away from the box
      if (e.key === 'Enter') {
        e.preventDefault();
        submit(e.shiftKey);
      }
    });
    input.addEventListener('keyup', (e) => e.stopPropagation());
    input.addEventListener('keypress', (e) => e.stopPropagation());
    go.addEventListener('click', () => submit(false));
    newTab.addEventListener('click', () => submit(true));

    shadow.appendChild(panel);
    document.addEventListener('keydown', onPanelKey, true);
    renderTemplates();
    update();
    input.focus();
    input.select();
  }

  document.addEventListener(
    'keydown',
    (e) => {
      const path = e.composedPath ? e.composedPath() : [e.target];
      if (path.some((n) => n === BGC.ui.host)) return;
      const plainQ = e.key === 'q' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && !isEditable(e.target);
      const altQ = e.altKey && e.shiftKey && (e.key === 'Q' || e.key === 'q' || e.code === 'KeyQ');
      if (!plainQ && !altQ) return;
      if (document.querySelector('[role="dialog"]') && !altQ) return; // Google has a dialog open
      e.preventDefault();
      e.stopPropagation();
      togglePanel();
    },
    true
  );

  // The service worker forwards text selected on other pages (context menu)
  // when the user chose "Review here" instead of opening the form directly.
  try {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === 'bgc:quick-add-text') togglePanel(msg.text);
    });
  } catch (e) {
    /* not in an extension context */
  }

  BGC.features = BGC.features || {};
  BGC.features.quickAdd = { open: togglePanel, close: closePanel };
})();
