// Pure helpers for reading Google Calendar's grid: the `data-datekey` day
// encoding, hour-gutter labels and the time range written in an event chip's
// accessible text. No DOM here so it is unit tested; src/features/grid-*.js
// use it and disable themselves when these parsers stop matching.
(function (root) {
  'use strict';

  // data-datekey = (year-1970)*512 + month*32 + day  (msteffen/gcal-gray-weekends)
  function dateFromDatekey(key) {
    const n = parseInt(key, 10);
    if (!isFinite(n)) return null;
    const year = (n >> 9) + 1970;
    const month = (n & 511) >> 5;
    const day = n & 31;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return new Date(year, month - 1, day);
  }
  function datekeyFromDate(d) {
    return ((d.getFullYear() - 1970) << 9) + ((d.getMonth() + 1) << 5) + d.getDate();
  }

  // "1 AM", "13:00", "1pm", "1 p.m.", "01" -> hour 0-23, or null
  function parseHourLabel(text) {
    const t = String(text || '').trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
    let m = t.match(/^(\d{1,2})(?::(\d{2}))?\s?(am|pm)$/);
    if (m) {
      let h = +m[1] % 12;
      if (m[3] === 'pm') h += 12;
      return h;
    }
    m = t.match(/^(\d{1,2})(?::(\d{2}))?(?:\s?h)?$/);
    if (m && +m[1] <= 23) return +m[1];
    return null;
  }

  // Time range inside a chip's text, e.g. "10am to 11:30am, Standup",
  // "10:00 – 11:00", "10:30am – 11am", "10:00 a 11:00", "9 – 10pm".
  // Returns { startMin, endMin, rest } (minutes from midnight) or null.
  const T = '(\\d{1,2})(?::(\\d{2}))?\\s?(am|pm|a\\.m\\.|p\\.m\\.)?';
  const RANGE_RE = new RegExp(`(?:^|[^\\d])${T}\\s*(?:to|–|—|-|a|hasta|bis|à)\\s*${T}`, 'i');
  function parseChipTime(text) {
    const s = String(text || '').replace(/\u202f|\u00a0/g, ' ');
    const m = RANGE_RE.exec(s);
    if (!m) return null;
    const toMin = (h, mm, ap, other) => {
      let hour = +h;
      const sfx = (ap || other || '').replace(/\./g, '').toLowerCase();
      if (hour > 23 || (mm && +mm > 59)) return null;
      if (sfx === 'pm' && hour < 12) hour += 12;
      if (sfx === 'am' && hour === 12) hour = 0;
      return hour * 60 + (mm ? +mm : 0);
    };
    const a = toMin(m[1], m[2], m[3], m[3] ? null : m[6]);
    const b = toMin(m[4], m[5], m[6], null);
    if (a == null || b == null) return null;
    if (!m[3] && !m[6] && +m[1] <= 12 && +m[4] <= 12 && a > b) return null; // "3 - 2" is not a time
    return { startMin: a, endMin: b <= a ? b + 24 * 60 : b, rest: s.slice(m.index + m[0].length).replace(/^[\s,:–-]+/, '') };
  }

  // Which weekday/holiday/today class a date gets.
  function dayKind(date, today, holidays) {
    const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (holidays && holidays.includes(ymd)) return 'holiday';
    if (today && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()) return 'today';
    return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
  }

  // Sum chip durations per key (colour or calendar). chips: [{ key, startMin, endMin }]
  function totals(chips) {
    const out = {};
    let all = 0;
    for (const c of chips) {
      const mins = Math.max(0, c.endMin - c.startMin);
      out[c.key] = (out[c.key] || 0) + mins;
      all += mins;
    }
    return { byKey: out, total: all };
  }

  function fmtMinutes(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? `${h}h${m ? ` ${String(m).padStart(2, '0')}` : ''}` : `${m} min`;
  }

  // Free gaps per day inside [startMin, endMin), skipping busy ranges and gaps
  // shorter than minMinutes. busy: [{ date: Date, startMin, endMin }].
  function freeSlots(days, busy, opts) {
    opts = opts || {};
    const startMin = opts.startMin != null ? opts.startMin : 9 * 60;
    const endMin = opts.endMin != null ? opts.endMin : 18 * 60;
    const minMinutes = opts.minMinutes || 30;
    const out = [];
    for (const day of days) {
      const key = day.toDateString();
      const ranges = busy
        .filter((b) => b.date && b.date.toDateString() === key)
        .map((b) => [b.startMin, b.endMin])
        .sort((a, b) => a[0] - b[0]);
      let cursor = startMin;
      const slots = [];
      for (const [a, b] of ranges) {
        if (a - cursor >= minMinutes) slots.push([cursor, Math.min(a, endMin)]);
        cursor = Math.max(cursor, b);
        if (cursor >= endMin) break;
      }
      if (endMin - cursor >= minMinutes) slots.push([cursor, endMin]);
      out.push({ date: day, slots: slots.filter(([a, b]) => b - a >= minMinutes) });
    }
    return out;
  }

  function fmtClock(min, h12) {
    const h = Math.floor(min / 60) % 24;
    const m = min % 60;
    if (!h12) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const ap = h >= 12 ? 'pm' : 'am';
    const hh = h % 12 || 12;
    return m ? `${hh}:${String(m).padStart(2, '0')}${ap}` : `${hh}${ap}`;
  }

  // "Tue 25 Mar: 9:00–11:00, 14:00–16:00 (CET)" lines
  function formatSlots(days, opts) {
    opts = opts || {};
    const fmtD = new Intl.DateTimeFormat(opts.locale, { weekday: 'short', day: 'numeric', month: 'short' });
    const tz = opts.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const lines = [];
    for (const d of days) {
      if (!d.slots.length) continue;
      lines.push(`${fmtD.format(d.date)}: ${d.slots.map(([a, b]) => `${fmtClock(a, opts.h12)}–${fmtClock(b, opts.h12)}`).join(', ')}`);
    }
    if (!lines.length) return '';
    return `${lines.join('\n')}\n(${tz})`;
  }

  // "GMT-04", "GMT+05:30", "UTC+1" (the label Google prints above the hour gutter) -> offset in minutes, else null.
  function parseTzOffset(text) {
    const m = String(text || '').trim().match(/^(?:GMT|UTC)\s?([+-])(\d{1,2})(?::?(\d{2}))?$/i);
    if (!m) return null;
    const sign = m[1] === '-' ? -1 : 1;
    return sign * (+m[2] * 60 + (+m[3] || 0));
  }

  // -240 -> "GMT-04", 330 -> "GMT+05:30"
  function fmtTzOffset(min) {
    const sign = min < 0 ? '-' : '+';
    const a = Math.abs(min);
    const hh = String(Math.floor(a / 60)).padStart(2, '0');
    return `GMT${sign}${hh}${a % 60 ? ':' + String(a % 60).padStart(2, '0') : ''}`;
  }

  // A Date whose local getters (getHours, getDate, ...) read as wall-clock time at the given UTC offset.
  function shiftedNow(offsetMin, nowMs) {
    const now = new Date(nowMs == null ? Date.now() : nowMs);
    if (offsetMin == null) return now;
    return new Date(now.getTime() + (offsetMin + now.getTimezoneOffset()) * 60000);
  }

  const api = { freeSlots, fmtClock, formatSlots, dateFromDatekey, datekeyFromDate, parseHourLabel, parseChipTime, parseTzOffset, fmtTzOffset, shiftedNow, dayKind, totals, fmtMinutes };
  root.BGC = root.BGC || {};
  root.BGC.grid = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
