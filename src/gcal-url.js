// Builds Google Calendar "new event" URLs from parsed ICS events.
// Google Calendar accepts a pre-filled event form at
//   https://calendar.google.com/calendar/u/<n>/r/eventedit?text=..&dates=..
// (the same endpoint the "Add to Google Calendar" links on the web use).
(function (root) {
  'use strict';

  const ics = root.BGC && root.BGC.ics ? root.BGC.ics : require('./ics.js');

  // Windows / Exchange timezone names -> IANA, for the most common ones.
  const WINDOWS_TZ = {
    'Dateline Standard Time': 'Etc/GMT+12',
    'Hawaiian Standard Time': 'Pacific/Honolulu',
    'Alaskan Standard Time': 'America/Anchorage',
    'Pacific Standard Time': 'America/Los_Angeles',
    'Pacific Standard Time (Mexico)': 'America/Tijuana',
    'Mountain Standard Time': 'America/Denver',
    'US Mountain Standard Time': 'America/Phoenix',
    'Central Standard Time': 'America/Chicago',
    'Central Standard Time (Mexico)': 'America/Mexico_City',
    'Canada Central Standard Time': 'America/Regina',
    'Eastern Standard Time': 'America/New_York',
    'US Eastern Standard Time': 'America/Indianapolis',
    'Atlantic Standard Time': 'America/Halifax',
    'SA Pacific Standard Time': 'America/Bogota',
    'SA Western Standard Time': 'America/La_Paz',
    'Venezuela Standard Time': 'America/Caracas',
    'Argentina Standard Time': 'America/Buenos_Aires',
    'E. South America Standard Time': 'America/Sao_Paulo',
    'Pacific SA Standard Time': 'America/Santiago',
    'Montevideo Standard Time': 'America/Montevideo',
    'Greenwich Standard Time': 'Atlantic/Reykjavik',
    'GMT Standard Time': 'Europe/London',
    'W. Europe Standard Time': 'Europe/Berlin',
    'Romance Standard Time': 'Europe/Paris',
    'Central Europe Standard Time': 'Europe/Budapest',
    'Central European Standard Time': 'Europe/Warsaw',
    'E. Europe Standard Time': 'Europe/Chisinau',
    'FLE Standard Time': 'Europe/Kiev',
    'GTB Standard Time': 'Europe/Bucharest',
    'Russian Standard Time': 'Europe/Moscow',
    'Turkey Standard Time': 'Europe/Istanbul',
    'Israel Standard Time': 'Asia/Jerusalem',
    'Egypt Standard Time': 'Africa/Cairo',
    'South Africa Standard Time': 'Africa/Johannesburg',
    'Arabian Standard Time': 'Asia/Dubai',
    'Arab Standard Time': 'Asia/Riyadh',
    'Iran Standard Time': 'Asia/Tehran',
    'Pakistan Standard Time': 'Asia/Karachi',
    'India Standard Time': 'Asia/Calcutta',
    'Sri Lanka Standard Time': 'Asia/Colombo',
    'Bangladesh Standard Time': 'Asia/Dhaka',
    'SE Asia Standard Time': 'Asia/Bangkok',
    'China Standard Time': 'Asia/Shanghai',
    'Singapore Standard Time': 'Asia/Singapore',
    'Taipei Standard Time': 'Asia/Taipei',
    'W. Australia Standard Time': 'Australia/Perth',
    'Tokyo Standard Time': 'Asia/Tokyo',
    'Korea Standard Time': 'Asia/Seoul',
    'AUS Central Standard Time': 'Australia/Darwin',
    'Cen. Australia Standard Time': 'Australia/Adelaide',
    'AUS Eastern Standard Time': 'Australia/Sydney',
    'E. Australia Standard Time': 'Australia/Brisbane',
    'Tasmania Standard Time': 'Australia/Hobart',
    'New Zealand Standard Time': 'Pacific/Auckland',
    UTC: 'Etc/UTC',
    'Coordinated Universal Time': 'Etc/UTC',
  };

  function isValidTimeZone(tz) {
    if (!tz) return false;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
      return true;
    } catch (e) {
      return false;
    }
  }

  // TZID -> IANA zone name, or null when it cannot be resolved.
  function resolveTimeZone(tzid, vtimezones) {
    if (!tzid) return null;
    const vt = vtimezones && vtimezones[tzid];
    if (vt && vt.iana && isValidTimeZone(vt.iana)) return vt.iana;
    if (isValidTimeZone(tzid)) return tzid;
    if (WINDOWS_TZ[tzid] && isValidTimeZone(WINDOWS_TZ[tzid])) return WINDOWS_TZ[tzid];
    // "/mozilla.org/20050126_1/Europe/Berlin" or "/freeassociation.sourceforge.net/Europe/Berlin"
    const parts = tzid.split('/').filter(Boolean);
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('/');
      if (isValidTimeZone(candidate)) return candidate;
    }
    const lower = tzid.toLowerCase();
    if (lower === 'utc' || lower === 'gmt' || lower === 'z') return 'Etc/UTC';
    return null;
  }

  // Offset (ms) of `tz` at the given UTC instant.
  function tzOffsetMs(utcMs, tz) {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts = {};
    for (const p of dtf.formatToParts(new Date(utcMs))) parts[p.type] = p.value;
    const asUtc = Date.UTC(
      +parts.year,
      +parts.month - 1,
      +parts.day,
      +parts.hour % 24,
      +parts.minute,
      +parts.second
    );
    return asUtc - utcMs;
  }

  // Wall-clock components in `tz` -> UTC epoch ms.
  function zonedToUtcMs(c, tz) {
    const naive = ics.naiveMs(c);
    let guess = naive - tzOffsetMs(naive, tz);
    guess = naive - tzOffsetMs(guess, tz);
    return guess;
  }

  function pad(n, len) {
    return String(n).padStart(len || 2, '0');
  }

  function fmtDate(c) {
    return `${pad(c.year, 4)}${pad(c.month)}${pad(c.day)}`;
  }

  function fmtLocal(c) {
    return `${fmtDate(c)}T${pad(c.hour)}${pad(c.minute)}${pad(c.second)}`;
  }

  function fmtUtcMs(ms) {
    const d = new Date(ms);
    return (
      `${pad(d.getUTCFullYear(), 4)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
      `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
    );
  }

  // One side of the `dates` parameter. Floating times (no tz) are left
  // unqualified so Google interprets them in the user's calendar timezone,
  // unless the calendar declared X-WR-TIMEZONE.
  function fmtInstant(c, ctx) {
    if (c.isDate) return fmtDate(c);
    if (c.utc) return fmtUtcMs(ics.naiveMs(c));
    const tz = resolveTimeZone(c.tzid, ctx.vtimezones) || resolveTimeZone(ctx.timezone, ctx.vtimezones);
    if (tz) return fmtUtcMs(zonedToUtcMs(c, tz));
    return fmtLocal(c);
  }

  function formatDates(event, ctx) {
    return `${fmtInstant(event.start, ctx)}/${fmtInstant(event.end, ctx)}`;
  }

  // Derive ".../calendar/u/<n>/r/eventedit" from the current calendar URL so
  // the event lands in the same Google account the user is looking at.
  function eventEditBase(href) {
    let origin = 'https://calendar.google.com';
    let account = '';
    try {
      const u = new URL(href);
      if (/calendar\.google\.com$/.test(u.hostname)) origin = u.origin;
      const m = u.pathname.match(/^\/calendar\/(u\/\d+|b\/\d+)\//);
      if (m) account = `/${m[1]}`;
      else if (u.searchParams.get('authuser')) account = `/u/${u.searchParams.get('authuser')}`;
    } catch (e) {
      /* ignore */
    }
    return `${origin}/calendar${account}/r/eventedit`;
  }

  const MAX_DETAILS = 7000;

  function buildDetails(event) {
    let details = event.description || '';
    if (event.url && !details.includes(event.url)) {
      details = details ? `${details}\n\n${event.url}` : event.url;
    }
    if (details.length > MAX_DETAILS) details = `${details.slice(0, MAX_DETAILS - 1)}…`;
    return details;
  }

  // ctx: { timezone, vtimezones } from parseICS; opts: { base }
  function buildEventEditUrl(event, ctx, opts) {
    ctx = ctx || {};
    opts = opts || {};
    const params = new URLSearchParams();
    params.set('text', event.summary || '(No title)');
    params.set('dates', formatDates(event, ctx));
    const details = buildDetails(event);
    if (details) params.set('details', details);
    if (event.location) params.set('location', event.location);
    if (event.rrule) params.set('recur', `RRULE:${event.rrule}`);
    if (event.attendees && event.attendees.length) {
      params.set('add', event.attendees.map((a) => a.email).join(','));
    }
    if (event.transparent) params.set('crm', 'AVAILABLE');
    const base = opts.base || eventEditBase(typeof location !== 'undefined' ? location.href : '');
    return `${base}?${params.toString()}`;
  }

  const api = {
    WINDOWS_TZ,
    isValidTimeZone,
    resolveTimeZone,
    tzOffsetMs,
    zonedToUtcMs,
    formatDates,
    eventEditBase,
    buildEventEditUrl,
  };

  root.BGC = root.BGC || {};
  root.BGC.gcal = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
