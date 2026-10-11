// The inverse of ics.js: turn event objects (the shape parseICS / parseQuickAdd
// produce, or the one read from Google's event popover) into an iCalendar file.
(function (root) {
  'use strict';

  function pad(n, len) {
    return String(n).padStart(len || 2, '0');
  }

  function escapeText(v) {
    return String(v == null ? '' : v)
      .replace(/\\/g, '\\\\')
      .replace(/\r\n|\r|\n/g, '\\n')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,');
  }

  // RFC 5545 line folding at 75 octets (we fold at 70 chars; conservative).
  function fold(line) {
    const out = [];
    let s = line;
    while (s.length > 70) {
      out.push(s.slice(0, 70));
      s = ' ' + s.slice(70);
    }
    out.push(s);
    return out.join('\r\n');
  }

  function fmtComps(c) {
    if (c.isDate) return { params: ';VALUE=DATE', value: `${pad(c.year, 4)}${pad(c.month)}${pad(c.day)}` };
    const base = `${pad(c.year, 4)}${pad(c.month)}${pad(c.day)}T${pad(c.hour)}${pad(c.minute)}${pad(c.second || 0)}`;
    if (c.utc) return { params: '', value: `${base}Z` };
    if (c.tzid) return { params: `;TZID=${c.tzid}`, value: base };
    return { params: '', value: base };
  }

  function fmtStamp(d) {
    return `${pad(d.getUTCFullYear(), 4)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  }

  function uidFor(ev, now) {
    if (ev.uid) return ev.uid;
    const slug = (ev.summary || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24);
    return `${now.getTime().toString(36)}-${slug}@better-google-calendar`;
  }

  function eventLines(ev, opts) {
    const now = opts.now || new Date();
    const lines = ['BEGIN:VEVENT'];
    lines.push(`UID:${uidFor(ev, now)}`);
    lines.push(`DTSTAMP:${fmtStamp(now)}`);
    const s = fmtComps(ev.start);
    lines.push(`DTSTART${s.params}:${s.value}`);
    if (ev.end) {
      const e = fmtComps(ev.end);
      lines.push(`DTEND${e.params}:${e.value}`);
    }
    lines.push(`SUMMARY:${escapeText(ev.summary || '')}`);
    if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`);
    if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`);
    if (ev.url) lines.push(`URL:${ev.url}`);
    if (ev.rrule) lines.push(`RRULE:${ev.rrule.replace(/^RRULE:/i, '')}`);
    for (const a of ev.attendees || []) {
      const cn = a.name ? `;CN=${escapeText(a.name).replace(/[;:]/g, '')}` : '';
      lines.push(`ATTENDEE${cn}:mailto:${a.email}`);
    }
    if (ev.organizer && ev.organizer.email) {
      const cn = ev.organizer.name ? `;CN=${escapeText(ev.organizer.name).replace(/[;:]/g, '')}` : '';
      lines.push(`ORGANIZER${cn}:mailto:${ev.organizer.email}`);
    }
    if (ev.transparent) lines.push('TRANSP:TRANSPARENT');
    if (ev.status) lines.push(`STATUS:${ev.status}`);
    lines.push('END:VEVENT');
    return lines;
  }

  // events: array of event objects; opts: { now, name, timezone }
  function buildICS(events, opts) {
    opts = opts || {};
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Better Google Calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    if (opts.name) lines.push(`X-WR-CALNAME:${escapeText(opts.name)}`);
    if (opts.timezone) lines.push(`X-WR-TIMEZONE:${opts.timezone}`);
    for (const ev of events) lines.push(...eventLines(ev, opts));
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  // Plain-text / Markdown rendering of events (for "copy as text").
  function eventsToText(events, opts) {
    opts = opts || {};
    const fmtD = new Intl.DateTimeFormat(opts.locale, { weekday: 'short', day: 'numeric', month: 'short' });
    const fmtT = new Intl.DateTimeFormat(opts.locale, { hour: 'numeric', minute: '2-digit' });
    const toDate = (c) => new Date(c.year, c.month - 1, c.day, c.hour, c.minute, c.second || 0);
    const byDay = new Map();
    for (const ev of events) {
      const d = toDate(ev.start);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      if (!byDay.has(key)) byDay.set(key, { date: d, items: [] });
      byDay.get(key).items.push(ev);
    }
    const out = [];
    for (const [, day] of [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      out.push(`${opts.markdown ? '## ' : ''}${fmtD.format(day.date)}`);
      day.items.sort((a, b) => toDate(a.start) - toDate(b.start));
      for (const ev of day.items) {
        const when = ev.start.isDate ? 'all day' : `${fmtT.format(toDate(ev.start))}–${fmtT.format(toDate(ev.end || ev.start))}`;
        const extra = [ev.location, ev.calendar].filter(Boolean).join(', ');
        out.push(`${opts.markdown ? '- ' : '  '}${when}  ${ev.summary || '(No title)'}${extra ? ` (${extra})` : ''}`);
      }
      out.push('');
    }
    return out.join('\n').trim() + '\n';
  }

  function eventsToCsv(events) {
    const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const f = (c) => (c.isDate ? `${pad(c.year, 4)}-${pad(c.month)}-${pad(c.day)}` : `${pad(c.year, 4)}-${pad(c.month)}-${pad(c.day)} ${pad(c.hour)}:${pad(c.minute)}`);
    const rows = [['Start', 'End', 'Title', 'Location', 'Calendar', 'Minutes'].map(q).join(',')];
    for (const ev of events) {
      const mins = ev.start.isDate ? '' : Math.round((new Date(ev.end.year, ev.end.month - 1, ev.end.day, ev.end.hour, ev.end.minute) - new Date(ev.start.year, ev.start.month - 1, ev.start.day, ev.start.hour, ev.start.minute)) / 60000);
      rows.push([f(ev.start), ev.end ? f(ev.end) : '', ev.summary || '', ev.location || '', ev.calendar || '', mins].map(q).join(','));
    }
    return rows.join('\r\n') + '\r\n';
  }

  const api = { buildICS, eventsToText, eventsToCsv, escapeText, fold };
  root.BGC = root.BGC || {};
  root.BGC.icsWrite = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
