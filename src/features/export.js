// Data out: copy the visible day/week as text, Markdown or CSV; download the
// visible events as an .ics file; and an "Export .ics" button in Google's event
// details popover. Everything is read from what is on screen (no API).
(function () {
  'use strict';
  const BGC = window.BGC;
  if (!BGC || !BGC.liveGrid || !BGC.icsWrite || !BGC.ui) return;
  const { buildICS, eventsToText, eventsToCsv } = BGC.icsWrite;
  const { parseChipTime } = BGC.grid;
  const { el, toast } = BGC.ui;

  function comps(d, h, m, isDate) {
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: isDate ? 0 : h, minute: isDate ? 0 : m, second: 0, isDate: !!isDate, utc: false, tzid: null };
  }

  // Chips of the live grid -> event objects (title, start/end, colour as "calendar").
  function visibleEvents() {
    const model = BGC.liveGrid.get();
    if (!model.ok) return [];
    const out = [];
    for (const c of model.chips) {
      if (!c.date) continue;
      let ev;
      if (c.time) {
        const s = c.time.startMin;
        const e = c.time.endMin;
        const endDate = e >= 1440 ? new Date(c.date.getFullYear(), c.date.getMonth(), c.date.getDate() + 1) : c.date;
        ev = { summary: c.title, start: comps(c.date, Math.floor(s / 60), s % 60, false), end: comps(endDate, Math.floor((e % 1440) / 60), e % 60, false) };
      } else {
        const next = new Date(c.date.getFullYear(), c.date.getMonth(), c.date.getDate() + 1);
        ev = { summary: c.title, start: comps(c.date, 0, 0, true), end: comps(next, 0, 0, true) };
      }
      ev.location = '';
      ev.description = '';
      ev.attendees = [];
      ev.calendar = '';
      ev.color = c.color;
      ev.uid = c.eventId ? `${c.eventId}@google` : null;
      if (c.declined) ev.status = 'CANCELLED';
      out.push(ev);
    }
    return out;
  }

  function copy(text, what) {
    navigator.clipboard.writeText(text).then(
      () => toast(`${what} copied to the clipboard.`),
      () => toast('Could not write to the clipboard.')
    );
  }

  function download(text, name, type) {
    const blob = new Blob([text], { type: type || 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function fileStamp() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  const commands = () => {
    const events = visibleEvents();
    const n = events.length;
    return [
      { id: 'exp:text', group: 'Export', label: `Copy visible events as text (${n})`, keywords: ['copy', 'agenda', 'text', 'standup', 'copiar'], run: () => copy(eventsToText(events), `${n} events`) },
      { id: 'exp:md', group: 'Export', label: `Copy visible events as Markdown (${n})`, keywords: ['copy', 'markdown', 'notes'], run: () => copy(eventsToText(events, { markdown: true }), `${n} events`) },
      { id: 'exp:csv', group: 'Export', label: `Copy visible events as CSV (${n}, for a spreadsheet / timesheet)`, keywords: ['csv', 'spreadsheet', 'timesheet', 'excel', 'hours'], run: () => copy(eventsToCsv(events), `${n} rows`) },
      { id: 'exp:ics', group: 'Export', label: `Download visible events as .ics (${n})`, keywords: ['ics', 'export', 'download', 'ical', 'exportar'], run: () => download(buildICS(events, { name: 'Google Calendar export' }), `calendar-${fileStamp()}.ics`) },
    ];
  };

  // ---- "Export .ics" button in the event details popover ---------------------
  const MONTHS = /(january|february|march|april|may|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i;
  function eventFromDialog(dialog) {
    const text = dialog.innerText || dialog.textContent || '';
    const heading = dialog.querySelector('h1, h2, [role="heading"]');
    const title = heading ? heading.textContent.trim() : (text.split('\n').find((l) => l.trim()) || '').trim();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const dateLine = lines.find((l) => MONTHS.test(l) && /\d/.test(l) && l.length < 80);
    let date = new Date();
    if (dateLine) {
      const m = dateLine.match(/(\d{1,2})\D+(january|february|march|april|may|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i);
      if (m) {
        const monthWord = (m[2] || m[3]).toLowerCase();
        const day = +(m[1] || m[4]);
        const idx = ['january','february','march','april','may','june','july','august','september','october','november','december'].indexOf(monthWord);
        const idxEs = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'].indexOf(monthWord);
        const month = idx >= 0 ? idx : idxEs;
        const y = (dateLine.match(/\b(20\d{2})\b/) || [])[1];
        const year = y ? +y : new Date().getFullYear();
        if (month >= 0 && day) date = new Date(year, month, day);
      }
    }
    const time = parseChipTime(dateLine || text);
    let ev;
    if (time) {
      ev = { summary: title, start: comps(date, Math.floor(time.startMin / 60), time.startMin % 60, false), end: comps(date, Math.floor((time.endMin % 1440) / 60), time.endMin % 60, false) };
    } else {
      const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      ev = { summary: title, start: comps(date, 0, 0, true), end: comps(next, 0, 0, true) };
    }
    // Google labels each row with a visually hidden "Location:" / "Description:" line before its value.
    const after = (re) => {
      const i = lines.findIndex((l) => re.test(l));
      return i >= 0 && i + 1 < lines.length ? lines[i + 1] : '';
    };
    const loc = dialog.querySelector('a[href*="maps.google"], a[href*="google.com/maps"]');
    ev.location = loc ? loc.textContent.trim() : after(/^(location|ubicaci\u00f3n|lugar|ort|lieu):?$/i);
    const meet = dialog.querySelector('a[href*="meet.google.com"], a[href*="zoom.us"], a[href*="teams.microsoft.com"]');
    const desc = after(/^(description|descripci\u00f3n|beschreibung):?$/i);
    ev.description = [desc, meet && !desc.includes(meet.href) && meet.href !== ev.location ? meet.href : ''].filter(Boolean).join('\n');
    const seen = new Set();
    ev.attendees = Array.from(dialog.querySelectorAll('[data-hovercard-id], [data-email]'))
      .map((n) => ({ email: n.getAttribute('data-hovercard-id') || n.getAttribute('data-email'), name: null }))
      .filter((a) => a.email && a.email.includes('@') && !seen.has(a.email) && seen.add(a.email));
    return ev;
  }

  function decorateDialog(dialog) {
    if (dialog.querySelector('.bgc-export-btn')) return;
    if (!/\d/.test(dialog.textContent || '') || dialog.querySelector('input, textarea')) return; // not an event *details* popover
    const btn = el('button', 'bgc-export-btn', '\u2913 .ics');
    btn.type = 'button';
    btn.title = 'Better Google Calendar: download this event as an .ics file';
    btn.style.cssText = 'position:absolute;left:16px;top:14px;z-index:5;border:1px solid #dadce0;background:#fff;color:#1a73e8;border-radius:14px;padding:3px 10px;font:12px Roboto,Arial,sans-serif;cursor:pointer;';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ev = eventFromDialog(dialog);
      download(buildICS([ev]), `${(ev.summary || 'event').replace(/[^\w\-]+/g, '_').slice(0, 40)}.ics`);
    });
    const cs = getComputedStyle(dialog);
    if (cs.position === 'static') dialog.style.position = 'relative';
    dialog.appendChild(btn);
  }

  const obs = new MutationObserver(() => {
    for (const d of document.querySelectorAll('[role="dialog"]')) {
      if (d.closest('#better-google-calendar-root')) continue;
      decorateDialog(d);
    }
  });
  function start() {
    if (!document.body) return setTimeout(start, 100);
    obs.observe(document.body, { childList: true, subtree: true });
  }
  start();

  BGC.features = BGC.features || {};
  BGC.features.export = { commands, visibleEvents, eventFromDialog };
})();
