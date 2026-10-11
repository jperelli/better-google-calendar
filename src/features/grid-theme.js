// Grid theming on top of the live grid model: weekday/weekend/holiday/today
// column tints, shaded off-hours per weekday ("working hours"), and "focus
// hours" that scroll the day to your start hour. All CSS overlays in the page.
(function () {
  'use strict';
  const BGC = window.BGC;
  if (!BGC || !BGC.liveGrid || !BGC.grid) return;
  const { dayKind } = BGC.grid;
  const settings = BGC.settings;

  const DEFAULTS = {
    enabled: true,
    colors: { sat: 'rgba(26,115,232,0.06)', sun: 'rgba(217,48,37,0.06)', holiday: 'rgba(217,48,37,0.10)', today: 'rgba(251,188,4,0.10)', mon: '', tue: '', wed: '', thu: '', fri: '' },
    holidays: [],
    shadeOffHours: true,
    workStart: 9,
    workEnd: 18,
    workDays: [1, 2, 3, 4, 5],
    shadeColor: 'rgba(60,64,67,0.07)',
    focusHours: true,
  };
  let prefs = DEFAULTS;
  let layer = null;

  function ensureLayer() {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement('div');
    layer.id = 'bgc-grid-theme-layer';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;';
    document.documentElement.appendChild(layer);
    return layer;
  }

  function clear() {
    if (layer) layer.textContent = '';
  }

  function paint(model) {
    clear();
    if (!prefs.enabled || !model.ok) return;
    const root = ensureLayer();
    const today = BGC.liveGrid.now();
    const mainRect = model.main.getBoundingClientRect();
    for (const col of model.columns) {
      const kind = dayKind(col.date, today, prefs.holidays);
      const tint = prefs.colors[kind] || (kind === 'today' ? '' : '');
      const r = col.rect;
      const top = Math.max(r.top, mainRect.top);
      const bottom = Math.min(r.bottom, mainRect.bottom);
      if (tint && bottom > top) {
        const box = document.createElement('div');
        box.style.cssText = `position:absolute;left:${r.left}px;top:${top}px;width:${r.width}px;height:${bottom - top}px;background:${tint};`;
        root.appendChild(box);
      }
      if (prefs.shadeOffHours && model.gutter && !col.header) {
        const g = model.gutter;
        const isWorkDay = prefs.workDays.includes(col.date.getDay());
        const ranges = isWorkDay ? [[0, prefs.workStart], [prefs.workEnd, 24]] : [[0, 24]];
        for (const [a, b] of ranges) {
          if (b <= a) continue;
          const y1 = Math.max(g.topOfHour(a), top);
          const y2 = Math.min(g.topOfHour(b), bottom);
          if (y2 <= y1) continue;
          const box = document.createElement('div');
          box.style.cssText = `position:absolute;left:${r.left}px;top:${y1}px;width:${r.width}px;height:${y2 - y1}px;background:${prefs.shadeColor};`;
          root.appendChild(box);
        }
      }
    }
  }

  // Scroll the timed grid so the work start hour is at the top, once per view load.
  let scrolledFor = null;
  function focus(model) {
    if (!prefs.focusHours || !model.ok || !model.gutter) return;
    const key = location.pathname;
    if (scrolledFor === key) return;
    const label = model.gutter.labels.find((l) => l.hour === prefs.workStart) || model.gutter.labels[0];
    let scroller = label.node;
    while (scroller && scroller !== document.body) {
      const cs = getComputedStyle(scroller);
      if (/(auto|scroll)/.test(cs.overflowY) && scroller.scrollHeight > scroller.clientHeight + 10) break;
      scroller = scroller.parentElement;
    }
    if (!scroller || scroller === document.body) return;
    scrolledFor = key;
    const delta = label.top - scroller.getBoundingClientRect().top - 8;
    if (Math.abs(delta) > 4) scroller.scrollTop += delta;
  }

  settings.get('gridTheme', DEFAULTS).then((p) => {
    prefs = Object.assign({}, DEFAULTS, p, { colors: Object.assign({}, DEFAULTS.colors, p.colors || {}) });
    BGC.liveGrid.rescan();
  });
  settings.onChange('gridTheme', (p) => {
    prefs = Object.assign({}, DEFAULTS, p, { colors: Object.assign({}, DEFAULTS.colors, p.colors || {}) });
    scrolledFor = null;
    BGC.liveGrid.rescan();
  });
  BGC.liveGrid.onChange((model) => {
    paint(model);
    if (!model.ok && prefs.enabled && /week|day|custom/.test(model.view || '')) BGC.liveGrid.showNotice('day colours and working-hours shading');
    focus(model);
  });
  // Scrolling moves the columns: repaint on scroll without a full rescan.
  document.addEventListener('scroll', () => BGC.liveGrid.rescan(), true);

  BGC.features = BGC.features || {};
  BGC.features.gridTheme = { get: () => prefs, set: (patch) => settings.set('gridTheme', patch), DEFAULTS };
})();
