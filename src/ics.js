// Minimal iCalendar (RFC 5545) parser: enough to turn an .ics file into a
// list of plain event objects. Shared between the content script (global
// `BGC.ics`) and the node tests (`module.exports`).
(function (root) {
  'use strict';

  function unfold(text) {
    return String(text)
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n[ \t]/g, '');
  }

  // "NAME;PARAM=a;OTHER="quoted:value":the value" -> { name, params, value }
  function parseContentLine(line) {
    let i = 0;
    let inQuotes = false;
    for (; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ':' && !inQuotes) break;
    }
    const head = line.slice(0, i);
    const value = line.slice(i + 1);
    const parts = [];
    let cur = '';
    inQuotes = false;
    for (const ch of head) {
      if (ch === '"') inQuotes = !inQuotes;
      if (ch === ';' && !inQuotes) {
        parts.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    parts.push(cur);
    const name = parts.shift().toUpperCase();
    const params = {};
    for (const p of parts) {
      const eq = p.indexOf('=');
      if (eq === -1) continue;
      const key = p.slice(0, eq).toUpperCase();
      const raw = p.slice(eq + 1);
      params[key] = raw.replace(/^"(.*)"$/, '$1');
    }
    return { name, params, value };
  }

  function unescapeText(value) {
    return String(value)
      .replace(/\\n/gi, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  // Dates are kept as naive components plus a tz marker so the URL builder
  // can decide how to express them. { year, month, day, hour, minute, second,
  // isDate, utc, tzid }
  function parseDateTime(value, params) {
    params = params || {};
    const v = String(value).trim();
    const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/i);
    if (!m) return null;
    const isDate = !m[4] || (params.VALUE || '').toUpperCase() === 'DATE';
    return {
      year: +m[1],
      month: +m[2],
      day: +m[3],
      hour: isDate ? 0 : +m[4],
      minute: isDate ? 0 : +m[5],
      second: isDate ? 0 : +(m[6] || 0),
      isDate,
      utc: !isDate && !!m[7],
      tzid: isDate || m[7] ? null : params.TZID || null,
    };
  }

  // Duration like P1DT2H30M or PT45M or P2W -> milliseconds (sign aware).
  function parseDuration(value) {
    const m = String(value)
      .trim()
      .match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);
    if (!m) return null;
    const sign = m[1] === '-' ? -1 : 1;
    const ms =
      (+m[2] || 0) * 7 * 86400000 +
      (+m[3] || 0) * 86400000 +
      (+m[4] || 0) * 3600000 +
      (+m[5] || 0) * 60000 +
      (+m[6] || 0) * 1000;
    return sign * ms;
  }

  function naiveMs(c) {
    return Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second);
  }

  function fromNaiveMs(ms, like) {
    const d = new Date(ms);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      hour: d.getUTCHours(),
      minute: d.getUTCMinutes(),
      second: d.getUTCSeconds(),
      isDate: like.isDate,
      utc: like.utc,
      tzid: like.tzid,
    };
  }

  function addMs(c, ms) {
    return fromNaiveMs(naiveMs(c) + ms, c);
  }

  function mailtoToEmail(value) {
    return String(value).replace(/^mailto:/i, '').trim();
  }

  function finishEvent(ev, raw) {
    if (!ev.start) return null;
    if (!ev.end) {
      if (raw.duration != null) ev.end = addMs(ev.start, raw.duration);
      else if (ev.start.isDate) ev.end = addMs(ev.start, 86400000);
      else ev.end = Object.assign({}, ev.start);
    }
    if (ev.start.isDate && naiveMs(ev.end) <= naiveMs(ev.start)) {
      ev.end = addMs(ev.start, 86400000);
    }
    return ev;
  }

  function newEvent() {
    return {
      uid: null,
      summary: '',
      description: '',
      location: '',
      url: '',
      start: null,
      end: null,
      rrule: null,
      attendees: [],
      organizer: null,
      transparent: false,
      status: null,
      recurrenceId: null,
    };
  }

  // Returns { events: [...], timezone: 'X-WR-TIMEZONE' | null,
  //           vtimezones: { TZID: { iana: 'Area/City' | null } } }
  function parseICS(text) {
    const lines = unfold(text).split('\n');
    const result = { events: [], timezone: null, vtimezones: {}, name: null };
    const stack = [];
    let ev = null;
    let raw = null;
    let tz = null;

    for (const line of lines) {
      if (!line.trim()) continue;
      const { name, params, value } = parseContentLine(line);
      if (name === 'BEGIN') {
        const comp = value.toUpperCase();
        stack.push(comp);
        if (comp === 'VEVENT') {
          ev = newEvent();
          raw = { duration: null };
        } else if (comp === 'VTIMEZONE') {
          tz = { tzid: null, iana: null };
        }
        continue;
      }
      if (name === 'END') {
        const comp = value.toUpperCase();
        stack.pop();
        if (comp === 'VEVENT' && ev) {
          const done = finishEvent(ev, raw);
          if (done) result.events.push(done);
          ev = null;
          raw = null;
        } else if (comp === 'VTIMEZONE' && tz) {
          if (tz.tzid) result.vtimezones[tz.tzid] = { iana: tz.iana };
          tz = null;
        }
        continue;
      }
      const top = stack[stack.length - 1];
      if (top === 'VCALENDAR') {
        if (name === 'X-WR-TIMEZONE') result.timezone = value.trim();
        else if (name === 'X-WR-CALNAME') result.name = unescapeText(value);
        continue;
      }
      if (top === 'VTIMEZONE' && tz) {
        if (name === 'TZID') tz.tzid = value.trim().replace(/^"(.*)"$/, '$1');
        else if (name === 'X-LIC-LOCATION') tz.iana = value.trim();
        continue;
      }
      if (top !== 'VEVENT' || !ev) continue;

      switch (name) {
        case 'UID':
          ev.uid = value.trim();
          break;
        case 'SUMMARY':
          ev.summary = unescapeText(value).trim();
          break;
        case 'DESCRIPTION':
          ev.description = unescapeText(value).trim();
          break;
        case 'LOCATION':
          ev.location = unescapeText(value).trim();
          break;
        case 'URL':
          ev.url = value.trim();
          break;
        case 'DTSTART':
          ev.start = parseDateTime(value, params);
          break;
        case 'DTEND':
          ev.end = parseDateTime(value, params);
          break;
        case 'DURATION':
          raw.duration = parseDuration(value);
          break;
        case 'RRULE':
          ev.rrule = value.trim();
          break;
        case 'RECURRENCE-ID':
          ev.recurrenceId = parseDateTime(value, params);
          break;
        case 'ATTENDEE': {
          const email = mailtoToEmail(value);
          if (email && !ev.attendees.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
            ev.attendees.push({ email, name: params.CN || null });
          }
          break;
        }
        case 'ORGANIZER':
          ev.organizer = { email: mailtoToEmail(value), name: params.CN || null };
          break;
        case 'TRANSP':
          ev.transparent = value.trim().toUpperCase() === 'TRANSPARENT';
          break;
        case 'STATUS':
          ev.status = value.trim().toUpperCase();
          break;
        default:
          break;
      }
    }
    return result;
  }

  const api = {
    unfold,
    parseContentLine,
    unescapeText,
    parseDateTime,
    parseDuration,
    parseICS,
    naiveMs,
    addMs,
  };

  root.BGC = root.BGC || {};
  root.BGC.ics = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
