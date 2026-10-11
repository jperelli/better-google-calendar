// Features that read the event chips of the live grid:
//  - dim past / declined events (CSS opacity on the chip itself)
//  - weekly totals per colour/calendar (panel in the shadow root)
//  - "Now" bar: current event with time left, next event with countdown, Join link
(function () {
  'use strict';
  const BGC = window.BGC;
  if (!BGC || !BGC.liveGrid || !BGC.grid || !BGC.ui) return;
  const { totals, fmtMinutes } = BGC.grid;
  const { el, addStyle, mount, shadow } = BGC.ui;
  const settings = BGC.settings;

  const DEFAULTS = { dimPast: true, dimDeclined: true, pastOpacity: 0.55, declinedOpacity: 0.45, showTotals: true, showNowBar: true };
  let prefs = DEFAULTS;
  let model = null;

  addStyle(`
    .bgc-now { position: fixed; top: 8px; left: 50%; transform: translateX(-50%); z-index: 2147483639; display: flex; gap: 14px; align-items: center;
      background: #202124; color: #e8eaed; border-radius: 20px; padding: 6px 14px; font: 13px Roboto, Arial, sans-serif; box-shadow: 0 2px 6px rgba(0,0,0,.3); max-width: 70vw; }
    .bgc-now b { color: #fff; font-weight: 500; }
    .bgc-now .bgc-now-sep { opacity: .4; }
    .bgc-now a { color: #8ab4f8; text-decoration: none; font-weight: 500; }
    .bgc-now .bgc-now-x { cursor: pointer; opacity: .6; margin-left: 4px; }
    .bgc-totals { position: fixed; left: 16px; bottom: 24px; z-index: 2147483639; background: #fff; color: #3c4043; border-radius: 10px; padding: 10px 14px;
      font: 12px Roboto, Arial, sans-serif; box-shadow: 0 1px 3px rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15); min-width: 180px; }
    .bgc-totals h4 { margin: 0 0 6px; font: 500 13px 'Google Sans', Roboto, Arial, sans-serif; color: #202124; display: flex; justify-content: space-between; gap: 8px; }
    .bgc-totals .bgc-tot-row { display: flex; align-items: center; gap: 8px; line-height: 20px; }
    .bgc-totals .bgc-dot { width: 10px; height: 10px; border-radius: 50%; flex: none; }
    .bgc-totals .bgc-tot-row span:last-child { margin-left: auto; font-variant-numeric: tabular-nums; }
    .bgc-totals button { border: 0; background: transparent; color: #1a73e8; cursor: pointer; font-size: 12px; padding: 0; }
  `);

  // ---- dimming ------------------------------------------------------------
  const dimmed = new Set();
  function applyDim() {
    for (const n of dimmed) {
      n.style.opacity = '';
      n.removeAttribute('data-bgc-dim');
    }
    dimmed.clear();
    if (!model || !model.ok) return;
    const now = BGC.liveGrid.now();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (const c of model.chips) {
      let op = null;
      if (prefs.dimDeclined && c.declined) op = prefs.declinedOpacity;
      else if (prefs.dimPast && c.date) {
        const d = c.date;
        const past = d < today || (d.getTime() === today.getTime() && c.time && c.time.endMin <= nowMin);
        if (past) op = prefs.pastOpacity;
      }
      if (op != null) {
        c.node.style.opacity = String(op);
        c.node.setAttribute('data-bgc-dim', '1');
        dimmed.add(c.node);
      }
    }
  }

  // ---- totals ---------------------------------------------------------------
  let totalsBox = null;
  let totalsCollapsed = false;
  function renderTotals() {
    if (!prefs.showTotals || !model || !model.ok || !/week|day|custom/.test(model.view)) {
      if (totalsBox) totalsBox.remove();
      return;
    }
    mount();
    if (!totalsBox) totalsBox = el('div', 'bgc-totals');
    totalsBox.textContent = '';
    const timed = model.chips.filter((c) => c.time && !c.declined);
    const t = totals(timed.map((c) => ({ key: c.color || 'other', startMin: c.time.startMin, endMin: c.time.endMin })));
    const h = el('h4');
    h.appendChild(el('span', null, `${fmtMinutes(t.total)} in ${timed.length} events`));
    const toggle = el('button', null, totalsCollapsed ? 'details' : 'hide');
    toggle.addEventListener('click', () => {
      totalsCollapsed = !totalsCollapsed;
      renderTotals();
    });
    h.appendChild(toggle);
    totalsBox.appendChild(h);
    if (!totalsCollapsed) {
      const rows = Object.entries(t.byKey).sort((a, b) => b[1] - a[1]);
      for (const [color, mins] of rows) {
        const row = el('div', 'bgc-tot-row');
        const dot = el('span', 'bgc-dot');
        dot.style.background = color;
        row.appendChild(dot);
        const sample = timed.find((c) => c.color === color);
        row.appendChild(el('span', null, sample ? sample.title.slice(0, 22) : color));
        row.appendChild(el('span', null, `${fmtMinutes(mins)} · ${Math.round((100 * mins) / Math.max(1, t.total))}%`));
        totalsBox.appendChild(row);
      }
      const hint = el('div', null, 'Timed events in view, grouped by colour. Declined ones excluded.');
      hint.style.cssText = 'color:#70757a;margin-top:6px;';
      totalsBox.appendChild(hint);
    }
    if (!totalsBox.isConnected) shadow.appendChild(totalsBox);
  }

  // ---- now bar --------------------------------------------------------------
  let nowBar = null;
  let nowHidden = false;
  function findJoin(chip) {
    const a = chip.node.querySelector('a[href*="meet.google.com"], a[href*="zoom.us"], a[href*="teams.microsoft.com"]');
    if (a) return a.href;
    const m = (chip.text || '').match(/https?:\/\/(?:meet\.google\.com|[\w.]*zoom\.us|teams\.microsoft\.com)\/\S+/);
    return m ? m[0].replace(/[,.;:)]+$/, '') : null;
  }
  function renderNow() {
    if (!prefs.showNowBar || nowHidden || !model || !model.ok) {
      if (nowBar) nowBar.remove();
      return;
    }
    const now = BGC.liveGrid.now();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const todayChips = model.chips.filter((c) => c.time && c.date && c.date.toDateString() === now.toDateString() && !c.declined);
    const current = todayChips.find((c) => c.time.startMin <= nowMin && c.time.endMin > nowMin);
    const next = todayChips.filter((c) => c.time.startMin > nowMin).sort((a, b) => a.time.startMin - b.time.startMin)[0];
    if (!current && !next) {
      if (nowBar) nowBar.remove();
      return;
    }
    mount();
    if (!nowBar) nowBar = el('div', 'bgc-now');
    nowBar.textContent = '';
    if (current) {
      const left = current.time.endMin - nowMin;
      const s = el('span');
      s.innerHTML = `Now: <b></b> · ${fmtMinutes(left)} left`;
      s.querySelector('b').textContent = current.title || '(No title)';
      nowBar.appendChild(s);
      const join = findJoin(current);
      if (join) {
        const a = el('a', null, 'Join');
        a.href = join;
        a.target = '_blank';
        a.rel = 'noopener';
        nowBar.appendChild(a);
      }
    }
    if (current && next) nowBar.appendChild(el('span', 'bgc-now-sep', '|'));
    if (next) {
      const inMin = next.time.startMin - nowMin;
      const s = el('span');
      s.innerHTML = `Next: <b></b> in ${fmtMinutes(inMin)}`;
      s.querySelector('b').textContent = next.title || '(No title)';
      nowBar.appendChild(s);
    }
    const x = el('span', 'bgc-now-x', '\u00d7');
    x.title = 'Hide for this page load';
    x.addEventListener('click', () => {
      nowHidden = true;
      renderNow();
    });
    nowBar.appendChild(x);
    if (!nowBar.isConnected) shadow.appendChild(nowBar);
  }

  function refresh() {
    applyDim();
    renderTotals();
    renderNow();
  }

  settings.get('gridEvents', DEFAULTS).then((p) => {
    prefs = Object.assign({}, DEFAULTS, p);
    refresh();
  });
  settings.onChange('gridEvents', (p) => {
    prefs = Object.assign({}, DEFAULTS, p);
    refresh();
  });
  BGC.liveGrid.onChange((m) => {
    model = m;
    refresh();
  });
  setInterval(() => {
    applyDim();
    renderNow();
  }, 30000);

  BGC.features = BGC.features || {};
  BGC.features.gridEvents = { get: () => prefs, set: (patch) => settings.set('gridEvents', patch), DEFAULTS };
})();
