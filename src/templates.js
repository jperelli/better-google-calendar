// Event templates: reusable presets ("Shift 2", "Dentist", "1:1 with Ana")
// applied on top of what the Quick Add parser understood from the typed text.
// Pure functions shared by the content script (`BGC.templates`) and the tests;
// storage lives in the feature script.
(function (root) {
  'use strict';

  function newId() {
    return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  // A template is: { id, name, title, minutes, allDay, location, description,
  // guests: [email], rrule, free }
  function templateFromResult(result, name) {
    const ev = result.event;
    const start = toDate(ev.start);
    const end = toDate(ev.end);
    return {
      id: newId(),
      name: String(name || ev.summary || 'Template').trim(),
      title: ev.summary || '',
      minutes: ev.start.isDate ? null : Math.max(5, Math.round((end - start) / 60000)),
      allDay: !!ev.start.isDate,
      location: ev.location || '',
      description: ev.description || '',
      guests: (ev.attendees || []).map((a) => a.email),
      rrule: ev.rrule || null,
      free: !!ev.transparent,
      startHour: ev.start.isDate ? null : ev.start.hour,
      startMinute: ev.start.isDate ? null : ev.start.minute,
    };
  }

  function toDate(c) {
    return new Date(c.year, c.month - 1, c.day, c.hour, c.minute, c.second || 0);
  }

  function comps(d, isDate) {
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: isDate ? 0 : d.getHours(),
      minute: isDate ? 0 : d.getMinutes(),
      second: 0,
      isDate: !!isDate,
      utc: false,
      tzid: null,
    };
  }

  // Merge: what the user typed wins when it says something (a time, a place,
  // guests, a repeat rule); the template fills the rest. The typed title, if
  // any, is appended to the template title ("Shift 2" + "cover for Ana").
  function applyTemplate(result, tpl) {
    if (!result || !tpl) return result;
    const ev = JSON.parse(JSON.stringify(result.event));
    const meta = Object.assign({}, result.meta);
    const typedTitle = ev.summary && ev.summary !== '(No title)' ? ev.summary : '';
    ev.summary = tpl.title ? (typedTitle ? `${tpl.title} ${typedTitle}` : tpl.title) : typedTitle;
    if (!ev.location && tpl.location) ev.location = tpl.location;
    if (!ev.description && tpl.description) ev.description = tpl.description;
    if (!(ev.attendees && ev.attendees.length) && tpl.guests && tpl.guests.length) {
      ev.attendees = tpl.guests.map((email) => ({ email, name: null }));
    }
    if (!ev.rrule && tpl.rrule) ev.rrule = tpl.rrule;
    if (tpl.free) ev.transparent = true;

    const start = toDate(ev.start);
    if (!meta.hasTime && !tpl.allDay && tpl.startHour != null) {
      // all-day result + timed template -> template time on the parsed day
      const s = new Date(start.getFullYear(), start.getMonth(), start.getDate(), tpl.startHour, tpl.startMinute || 0);
      const e = new Date(s.getTime() + (tpl.minutes || 60) * 60000);
      ev.start = comps(s, false);
      ev.end = comps(e, false);
      meta.hasTime = true;
      meta.allDay = false;
    } else if (meta.hasTime && !tpl.allDay && tpl.minutes && !meta.durationMinutes && !meta.hasEndTime) {
      // typed a start time only -> template length
      const e = new Date(start.getTime() + tpl.minutes * 60000);
      ev.end = comps(e, false);
    } else if (meta.hasTime && tpl.allDay) {
      // typed a time but the template is all-day -> keep what was typed
    }
    return { event: ev, ctx: result.ctx, meta };
  }

  const api = { templateFromResult, applyTemplate, newId };
  root.BGC = root.BGC || {};
  root.BGC.templates = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
