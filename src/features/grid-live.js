// Live grid model: finds Google Calendar's day columns, hour gutter and event
// chips using roles, data attributes and text (never class names), re-reads
// them on DOM changes and lets the other features subscribe. If the page no
// longer matches, `ok` is false, dependent features stay off and a small notice
// explains why, instead of corrupting the view.
(function () {
  'use strict';
  const BGC = window.BGC;
  if (!BGC || !BGC.ui || !BGC.grid) return;
  const { dateFromDatekey, parseHourLabel, parseChipTime } = BGC.grid;

  // textContent glues adjacent spans together ("Busy 1" + "9:30am" -> "Busy 19:30am");
  // join text nodes with spaces so the time range stays intact.
  function spacedText(node) {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const parts = [];
    while (walker.nextNode()) parts.push(walker.currentNode.nodeValue);
    return parts.join(' ');
  }

  const { el, addStyle, mount, shadow } = BGC.ui;

  const listeners = [];
  let model = { ok: false, reason: 'not scanned', view: null, columns: [], chips: [], gutter: null, main: null };
  let noticeShown = false;

  addStyle(`
    .bgc-grid-notice { position: fixed; left: 24px; bottom: 80px; z-index: 2147483640; background: #fef7e0; color: #5f6368; border: 1px solid #fdd663;
      border-radius: 8px; padding: 8px 12px; font: 12px Roboto, Arial, sans-serif; max-width: 360px; }
    .bgc-grid-notice a { color: #1a73e8; }
    .bgc-grid-notice button { float: right; border: 0; background: transparent; cursor: pointer; color: #5f6368; font-size: 14px; margin-left: 8px; }
  `);

  function viewFromUrl() {
    const m = location.pathname.match(/\/r\/([a-z]+)/);
    return m ? m[1] : 'week';
  }

  function scan() {
    const main = document.querySelector('[role="main"]');
    const view = viewFromUrl();
    if (!main) return fail('no main region', view);
    // Day columns: elements with data-datekey that contain gridcells (week/day/custom) or are gridcells (month).
    const keyed = Array.from(main.querySelectorAll('[data-datekey]'));
    const columns = [];
    const seen = new Set();
    for (const node of keyed) {
      const date = dateFromDatekey(node.getAttribute('data-datekey'));
      if (!date) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) continue;
      const k = `${node.getAttribute('data-datekey')}:${Math.round(rect.left)}:${Math.round(rect.top)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      columns.push({ node, date, rect, header: node.getAttribute('role') === 'columnheader' });
    }
    // Hour gutter: >= 20 short labels that parse as hours, vertically stacked.
    let gutter = null;
    const labels = [];
    for (const node of main.querySelectorAll('div, span')) {
      if (node.children.length) continue;
      const t = node.textContent.trim();
      if (!t || t.length > 8) continue;
      const h = parseHourLabel(t);
      if (h == null) continue;
      const r = node.getBoundingClientRect();
      if (r.height < 5 || r.width > 120) continue;
      labels.push({ hour: h, top: r.top, node });
    }
    if (labels.length >= 20) {
      labels.sort((a, b) => a.top - b.top);
      const byHour = labels.filter((l, i) => i === 0 || l.hour !== labels[i - 1].hour);
      const first = byHour[0];
      const last = byHour[byHour.length - 1];
      const spanHours = last.hour - first.hour || 23;
      const pxPerHour = (last.top - first.top) / spanHours;
      if (pxPerHour > 10 && pxPerHour < 400) {
        gutter = { labels: byHour, pxPerHour, topOfHour: (h) => first.top + (h - first.hour) * pxPerHour, zeroTop: first.top - first.hour * pxPerHour };
      }
    }
    // Event chips.
    const chips = [];
    for (const node of main.querySelectorAll('[data-eventid]')) {
      const rect = node.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) continue;
      const text = spacedText(node);
      const time = parseChipTime(text);
      const titleEl = node.querySelector('[aria-hidden="true"]') || node;
      const title = (titleEl.textContent || '').trim();
      const style = getComputedStyle(node);
      let color = style.backgroundColor;
      if (!color || color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
        const inner = node.querySelector('[role="button"]') || node.firstElementChild;
        if (inner) {
          const cs = getComputedStyle(inner);
          color = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : cs.borderColor || cs.borderLeftColor;
        }
      }
      const col = columns.find((c) => !c.header && rect.left >= c.rect.left - 1 && rect.right <= c.rect.right + 1 && rect.top >= c.rect.top - 1 && rect.bottom <= c.rect.bottom + 1)
        || columns.find((c) => !c.header && rect.left + rect.width / 2 >= c.rect.left && rect.left + rect.width / 2 <= c.rect.right);
      const declined = /line-through/.test(getComputedStyle(titleEl).textDecorationLine || '') || /line-through/.test(style.textDecorationLine || '');
      chips.push({ node, rect, text, title, time, color, date: col ? col.date : null, declined, eventId: node.getAttribute('data-eventid'), allDay: !time });
    }
    const timed = /^(week|day|customday|customweek)$/.test(view) || (view === 'week');
    if (!columns.length) return fail('no day columns found', view, main);
    if (timed && !gutter) return fail('no hour gutter found', view, main, columns, chips);
    model = { ok: true, reason: null, view, columns, chips, gutter, main };
    noticeShown = false;
    hideNotice();
    emit();
  }

  function fail(reason, view, main, columns, chips) {
    model = { ok: false, reason, view, columns: columns || [], chips: chips || [], gutter: null, main: main || null };
    emit();
  }

  function emit() {
    for (const cb of listeners) {
      try {
        cb(model);
      } catch (e) {
        console.error('[Better Google Calendar] grid listener failed', e);
      }
    }
  }

  let notice = null;
  function showNotice(feature) {
    if (noticeShown || !/\/r\/(week|day|custom|month)?/.test(location.pathname)) return;
    noticeShown = true;
    mount();
    notice = el('div', 'bgc-grid-notice');
    notice.innerHTML = `Better Google Calendar: <b>${feature}</b> is paused because Google Calendar\u2019s layout changed (${model.reason}). <a href="https://github.com/jperelli/better-google-calendar/issues" target="_blank" rel="noopener">Tell us</a> so we can fix it.`;
    const x = el('button', null, '\u00d7');
    x.addEventListener('click', hideNotice);
    notice.prepend(x);
    shadow.appendChild(notice);
  }
  function hideNotice() {
    if (notice) notice.remove();
    notice = null;
  }

  // Debounced rescans: Google re-renders a lot; coalesce into one scan per frame.
  let pending = null;
  function schedule() {
    if (pending) return;
    pending = setTimeout(() => {
      pending = null;
      scan();
    }, 150);
  }
  const observer = new MutationObserver((muts) => {
    for (const m of muts) {
      const t = m.target;
      if (t && t.nodeType === 1 && t.closest && t.closest('#better-google-calendar-root')) continue;
      schedule();
      return;
    }
  });
  function start() {
    const body = document.body;
    if (!body) return setTimeout(start, 100);
    observer.observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-datekey', 'data-eventid', 'style', 'class'] });
    window.addEventListener('resize', schedule);
    let lastHref = location.href;
    setInterval(() => {
      if (location.href !== lastHref) {
        lastHref = location.href;
        schedule();
      }
    }, 500);
    schedule();
  }
  start();

  BGC.liveGrid = {
    get: () => model,
    onChange: (cb) => {
      listeners.push(cb);
      if (model.view) cb(model);
    },
    rescan: schedule,
    showNotice,
  };
})();
