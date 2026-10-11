// Natural-language "Quick Add" parser: turns "lunch with ana@x.com tomorrow
// 1-2pm at Bar Lobo every friday" into the same event object `parseICS`
// produces, so `buildEventEditUrl` can open Google's pre-filled form.
// English and Spanish. Shared between the content script (`BGC.quickadd`),
// the service worker (context menu) and the node tests.
(function (root) {
  'use strict';

  const WEEKDAYS = [
    ['sunday', 'sun', 'domingo'],
    ['monday', 'mon', 'lunes'],
    ['tuesday', 'tue', 'tues', 'martes'],
    ['wednesday', 'wed', 'miércoles', 'miercoles'],
    ['thursday', 'thu', 'thur', 'thurs', 'jueves'],
    ['friday', 'fri', 'viernes'],
    ['saturday', 'sat', 'sábado', 'sabado'],
  ];
  const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const MONTHS = [
    ['january', 'jan', 'enero', 'ene'],
    ['february', 'feb', 'febrero'],
    ['march', 'mar', 'marzo'],
    ['april', 'apr', 'abril', 'abr'],
    ['may', 'mayo'],
    ['june', 'jun', 'junio'],
    ['july', 'jul', 'julio'],
    ['august', 'aug', 'agosto', 'ago'],
    ['september', 'sep', 'sept', 'septiembre', 'setiembre', 'set'],
    ['october', 'oct', 'octubre'],
    ['november', 'nov', 'noviembre'],
    ['december', 'dec', 'diciembre', 'dic'],
  ];
  const ORDINALS = {
    first: 1, '1st': 1, primer: 1, primero: 1, primera: 1,
    second: 2, '2nd': 2, segundo: 2, segunda: 2,
    third: 3, '3rd': 3, tercer: 3, tercero: 3, tercera: 3,
    fourth: 4, '4th': 4, cuarto: 4, cuarta: 4,
    last: -1, 'último': -1, ultimo: -1, 'última': -1, ultima: -1,
  };

  const alt = (list) => list.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const WD_RE = alt(WEEKDAYS.flat().sort((a, b) => b.length - a.length));
  const MONTH_RE = alt(MONTHS.flat().sort((a, b) => b.length - a.length));
  const ORD_RE = alt(Object.keys(ORDINALS).sort((a, b) => b.length - a.length));

  function weekdayIndex(word) {
    word = word.toLowerCase();
    return WEEKDAYS.findIndex((names) => names.includes(word));
  }
  function monthIndex(word) {
    word = word.toLowerCase();
    return MONTHS.findIndex((names) => names.includes(word));
  }

  // Working copy of the text: regexes run on the lowercased string and the
  // matched span is blanked in both strings so the title keeps its case.
  function makeCursor(text) {
    const orig = String(text || '').replace(/\s+/g, ' ').trim();
    let low = orig.toLowerCase();
    if (low.length !== orig.length) low = orig; // exotic case mapping, give up on case
    const cur = { orig, low };
    cur.take = function (re) {
      const m = re.exec(cur.low);
      if (!m) return null;
      const from = m.index;
      const to = m.index + m[0].length;
      const blank = ' '.repeat(to - from);
      m.origText = cur.orig.slice(from, to);
      cur.low = cur.low.slice(0, from) + blank + cur.low.slice(to);
      cur.orig = cur.orig.slice(0, from) + blank + cur.orig.slice(to);
      return m;
    };
    cur.takeAll = function (re) {
      const out = [];
      let m;
      while ((m = cur.take(re))) out.push(m);
      return out;
    };
    return cur;
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

  // "5", "5pm", "5:30", "17h", "17.30", "12 p.m." -> { hour, minute, explicit }
  const TIME_SRC = '(\\d{1,2})(?:[:.h](\\d{2}))?\\s*(am|pm|a\\.m\\.|p\\.m\\.|h|hs|hrs)?';
  function toTime(h, mm, suffix, hint) {
    let hour = +h;
    let minute = mm ? +mm : 0;
    if (hour > 23 || minute > 59) return null;
    const s = (suffix || '').replace(/\./g, '');
    const explicit = s === 'am' || s === 'pm' || hour > 12 || !!mm || s === 'h' || s === 'hs' || s === 'hrs';
    if (s === 'pm' && hour < 12) hour += 12;
    else if (s === 'am' && hour === 12) hour = 0;
    else if (s !== 'am' && s !== 'pm' && hour <= 12 && !s) {
      // No am/pm: "at 5" is 17:00, "at 9" is 09:00, like Google's old Quick Add.
      if (hint === 'afternoon' || hint === 'evening') {
        if (hour < 12) hour += 12;
      } else if (hint === 'morning') {
        if (hour === 12) hour = 0;
      } else if (hour >= 1 && hour <= 6) {
        hour += 12;
      }
    }
    return { hour, minute, explicit };
  }

  const DUR_UNIT = '(h|hr|hrs|hour|hours|hora|horas|m|min|mins|minute|minutes|minuto|minutos)';
  function toMinutes(n, unit) {
    const v = parseFloat(String(n).replace(',', '.'));
    if (!isFinite(v)) return null;
    return /^(h|hr|hrs|hour|hours|hora|horas)$/.test(unit) ? Math.round(v * 60) : Math.round(v);
  }

  function parseRecurrence(cur, state) {
    let m;
    // every 2 weeks / cada 3 días
    m = cur.take(/\b(?:every|cada|todos los|todas las)\s+(\d+)\s+(days?|weeks?|months?|years?|d[ií]as?|semanas?|mes(?:es)?|a[ñn]os?)\b/);
    if (m) {
      const unit = m[2];
      const freq = /^d/.test(unit) ? 'DAILY' : /^(w|s)/.test(unit) ? 'WEEKLY' : /^m/.test(unit) ? 'MONTHLY' : 'YEARLY';
      return `FREQ=${freq};INTERVAL=${+m[1]}`;
    }
    // every last friday (of the month) / cada último viernes (del mes)
    m = cur.take(new RegExp(`\\b(?:every|cada|el)\\s+(${ORD_RE})\\s+(${WD_RE})\\b(?:\\s+(?:of\\s+(?:the|every)\\s+month|del\\s+mes|de\\s+cada\\s+mes))?`));
    if (m) {
      const n = ORDINALS[m[1]];
      const wd = weekdayIndex(m[2]);
      state.firstWeekday = wd;
      state.setpos = n;
      return `FREQ=MONTHLY;BYDAY=${n}${BYDAY[wd]}`;
    }
    // every last day of the month / cada último día del mes
    m = cur.take(/\b(?:every|cada|el)\s+(?:last|último|ultimo)\s+(?:day\s+of\s+(?:the\s+|every\s+)?month|d[ií]a\s+del?\s+(?:cada\s+)?mes)\b/);
    if (m) {
      state.lastDayOfMonth = true;
      return 'FREQ=MONTHLY;BYMONTHDAY=-1';
    }
    // every weekday / entre semana
    m = cur.take(/\b(?:every\s+)?(?:weekdays?|workdays?|on\s+weekdays|entre\s+semana|d[ií]as?\s+de\s+semana|cada\s+d[ií]a\s+h[áa]bil)\b/);
    if (m) {
      state.weekdays = [1, 2, 3, 4, 5];
      return 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
    }
    // every monday and wednesday / todos los lunes y miércoles / cada martes
    m = cur.take(new RegExp(`\\b(?:every|cada|todos los|todas las)\\s+((?:${WD_RE})(?:\\s*(?:,|and|y|&|e)\\s*(?:${WD_RE}))*)\\b`));
    if (m) {
      const days = [];
      const re = new RegExp(`(${WD_RE})`, 'g');
      let w;
      while ((w = re.exec(m[1]))) {
        const idx = weekdayIndex(w[1]);
        if (idx >= 0 && !days.includes(idx)) days.push(idx);
      }
      days.sort((a, b) => a - b);
      state.weekdays = days;
      return `FREQ=WEEKLY;BYDAY=${days.map((d) => BYDAY[d]).join(',')}`;
    }
    // every day / every week / cada mes / every year
    m = cur.take(/\b(?:every|cada)\s+(day|week|month|year|d[ií]a|semana|mes|a[ñn]o)\b/);
    if (m) {
      const unit = m[1];
      const freq = /^d/.test(unit) ? 'DAILY' : /^(w|s)/.test(unit) ? 'WEEKLY' : /^m/.test(unit) ? 'MONTHLY' : 'YEARLY';
      return `FREQ=${freq}`;
    }
    m = cur.take(/\b(daily|weekly|monthly|yearly|annually|diario|diariamente|a\s+diario|semanal|semanalmente|mensual|mensualmente|anual|anualmente)\b/);
    if (m) {
      const w = m[1];
      const freq = /^(daily|diario|diariamente|a diario)$/.test(w) ? 'DAILY'
        : /^(weekly|semanal|semanalmente)$/.test(w) ? 'WEEKLY'
          : /^(monthly|mensual|mensualmente)$/.test(w) ? 'MONTHLY' : 'YEARLY';
      return `FREQ=${freq}`;
    }
    return null;
  }

  function parseExplicitDate(cur, now, order) {
    let m;
    // 2026-11-14
    m = cur.take(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
    if (m) return { year: +m[1], month: +m[2], day: +m[3], explicitYear: true };
    // 14/11, 14/11/2026, 11.14 (order dmy|mdy)
    m = cur.take(/\b(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?\b(?!\s*(?:am|pm|h\b))/);
    if (m) {
      let a = +m[1];
      let b = +m[2];
      let year = m[3] ? +m[3] : null;
      if (year != null && year < 100) year += 2000;
      let day = order === 'mdy' ? b : a;
      let month = order === 'mdy' ? a : b;
      if (month > 12 && day <= 12) [day, month] = [month, day];
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return { year, month, day, explicitYear: year != null };
    }
    // 14 nov, 14th of november, 14 de noviembre de 2026
    m = cur.take(new RegExp(`\\b(?:on\\s+|el\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+|de\\s+)?(${MONTH_RE})\\b(?:,?\\s+(?:of\\s+|de\\s+|del\\s+)?(\\d{4}))?`));
    if (m) return { year: m[3] ? +m[3] : null, month: monthIndex(m[2]) + 1, day: +m[1], explicitYear: !!m[3] };
    // nov 14, november 14th, 2026
    m = cur.take(new RegExp(`\\b(?:on\\s+)?(${MONTH_RE})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s+(\\d{4}))?`));
    if (m) return { year: m[3] ? +m[3] : null, month: monthIndex(m[1]) + 1, day: +m[2], explicitYear: !!m[3] };
    return null;
  }

  function parseRelativeDate(cur, now) {
    let m;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const plus = (days) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
    m = cur.take(/\b(?:the\s+)?day\s+after\s+tomorrow\b|\bpasado\s+ma[ñn]ana\b/);
    if (m) return plus(2);
    m = cur.take(/\b(?:today|tonight|hoy|esta\s+noche)\b/);
    if (m) {
      if (/tonight|esta noche/.test(m[0])) cur.hint = 'evening';
      return plus(0);
    }
    m = cur.take(/\b(?:tomorrow|tmrw|tmr)\b|(?<!(?:la|de|por la|de la)\s)\bma[ñn]ana\b/);
    if (m) return plus(1);
    m = cur.take(/\b(?:in|en|dentro\s+de)\s+(\d+)\s+(days?|weeks?|months?|d[ií]as?|semanas?|mes(?:es)?)\b/);
    if (m) {
      const n = +m[1];
      if (/^(d)/.test(m[2])) return plus(n);
      if (/^(w|s)/.test(m[2])) return plus(7 * n);
      return new Date(today.getFullYear(), today.getMonth() + n, today.getDate());
    }
    m = cur.take(/\b(?:next|la\s+semana\s+que\s+viene|la\s+pr[óo]xima\s+semana|pr[óo]xima\s+semana)\b(?:\s+week)?/);
    if (m && /week|semana/.test(m[0])) return plus(7);
    if (m) {
      // "next" alone: put it back as a weekday qualifier handled below
      cur.nextQualifier = true;
    }
    m = cur.take(/\b(?:next\s+month|el\s+mes\s+que\s+viene|el\s+pr[óo]ximo\s+mes)\b/);
    if (m) return new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    m = cur.take(new RegExp(`\\b(?:(next|this|coming|on|el|este|pr[óo]ximo|que viene)\\s+)?(${WD_RE})\\b(?:\\s+(que\\s+viene|pr[óo]ximo))?`));
    if (m) {
      const wd = weekdayIndex(m[2]);
      const qualifier = m[1] || m[3] || (cur.nextQualifier ? 'next' : '');
      let diff = (wd - today.getDay() + 7) % 7;
      if (diff === 0 && /next|pr[óo]ximo|que viene/.test(qualifier)) diff = 7;
      cur.weekdayToday = diff === 0;
      return plus(diff);
    }
    return null;
  }

  function parsePeriod(cur) {
    const m = cur.take(/\b(?:in\s+the\s+|por\s+la\s+|de\s+la\s+|en\s+la\s+|a\s+la\s+)?(morning|afternoon|evening|night|ma[ñn]ana|tarde|noche|noon|midday|midnight|mediod[ií]a|medianoche)\b/);
    if (!m) return null;
    const w = m[1];
    if (/^(morning|ma[ñn]ana)$/.test(w)) return { hint: 'morning' };
    if (/^(afternoon|tarde)$/.test(w)) return { hint: 'afternoon' };
    if (/^(evening|night|noche)$/.test(w)) return { hint: 'evening' };
    if (/^(noon|midday|mediod[ií]a)$/.test(w)) return { time: { hour: 12, minute: 0, explicit: true } };
    return { time: { hour: 0, minute: 0, explicit: true } };
  }

  function parseTimes(cur, hint) {
    let m;
    const T = TIME_SRC;
    // from 9 to 10:30 / 9am-11am / de 9 a 10 / 17:00-18:00
    m = cur.take(new RegExp(`\\b(?:from\\s+|de\\s+|desde\\s+|at\\s+|a\\s+las?\\s+|@\\s*)?${T}\\s*(?:-|–|—|to|until|till|a|hasta)\\s*${T}\\b`));
    if (m) {
      const a = toTime(m[1], m[2], m[3], hint);
      let b = toTime(m[4], m[5], m[6], hint);
      if (a && b) {
        // "9-10" with the first one bumped to pm by the heuristic but not the second
        if (!m[3] && !m[6] && +m[1] <= 6 && +m[4] <= 6 && a.hour >= 12 && b.hour < 12) b.hour += 12;
        if (m[6] && !m[3] && /pm/.test(m[6]) && a.hour < 12 && a.hour <= b.hour - 12 + 12 && +m[1] < +m[4]) a.hour += 12;
        if (m[6] && !m[3] && /pm/.test(m[6]) && +m[1] > +m[4] && a.hour < 12) a.hour += 12;
        if (b.hour * 60 + b.minute <= a.hour * 60 + a.minute && b.hour < 12) b = { hour: b.hour + 12, minute: b.minute, explicit: true };
        return { start: a, end: b };
      }
    }
    // at 5pm / a las 17:30 / @ 9
    m = cur.take(new RegExp(`\\b(?:at|a\\s+las?|@)\\s*${T}\\b`));
    if (m) {
      const t = toTime(m[1], m[2], m[3], hint);
      if (t) return { start: t, end: null };
    }
    // bare 5pm / 17:30 / 17h
    m = cur.take(new RegExp(`\\b(\\d{1,2})(?::(\\d{2}))\\s*(am|pm|a\\.m\\.|p\\.m\\.)?\\b`));
    if (m) {
      const t = toTime(m[1], m[2], m[3], hint);
      if (t) return { start: t, end: null };
    }
    m = cur.take(/\b(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)\b/);
    if (m) {
      const t = toTime(m[1], null, m[2], hint);
      if (t) return { start: t, end: null };
    }
    m = cur.take(/\b(\d{1,2})h(\d{2})?\b/);
    if (m) {
      const t = toTime(m[1], m[2], 'h', hint);
      if (t) return { start: t, end: null };
    }
    return null;
  }

  function parseDuration(cur) {
    let m = cur.take(new RegExp(`\\b(?:for|during|durante|por)\\s+(\\d+(?:[.,]\\d+)?)\\s*${DUR_UNIT}\\b`));
    if (m) return toMinutes(m[1], m[2]);
    m = cur.take(new RegExp(`\\((\\d+(?:[.,]\\d+)?)\\s*${DUR_UNIT}\\)`));
    if (m) return toMinutes(m[1], m[2]);
    m = cur.take(/\b(?:for|durante|por)\s+(?:an?\s+|una?\s+|media\s+|half\s+an?\s+)(hour|hora|minute|minuto)\b/);
    if (m) return /media|half/.test(m[0]) ? 30 : /hour|hora/.test(m[1]) ? 60 : 1;
    m = cur.take(/\b(\d+)h(\d{2})\b(?=\s|$)/); // "1h30" left over after times
    if (m && +m[1] <= 12) return +m[1] * 60 + +m[2];
    return null;
  }

  function parseLocation(cur) {
    let m = cur.take(/\s(?:at|@|en)\s+((?!(?:the|a|an|el|la|los|las)\s*$)[^,;]+?)\s*$/);
    if (m && m[1].trim()) return m.origText.trim().replace(/^(at|@|en)\s+/i, '').trim();
    // "in <Capitalized place>" only, so "check in" is not a place
    const re = /\s(in)\s+([^,;]+?)\s*$/;
    const mm = re.exec(cur.low);
    if (mm) {
      const placeOrig = cur.orig.slice(mm.index + mm[0].indexOf(mm[2]), mm.index + mm[0].length).trim();
      if (/^[A-ZÁÉÍÓÚÑ]/.test(placeOrig)) {
        cur.take(re);
        return placeOrig;
      }
    }
    return null;
  }

  function cleanTitle(orig) {
    let t = orig.replace(/\s+/g, ' ').trim();
    t = t.replace(/^[\s,;:.\-–—]+|[\s,;:.\-–—]+$/g, '');
    const dangling = /\b(on|at|in|from|to|with|the|a|an|and|el|la|los|las|de|del|con|y|a las|por|para|desde|hasta|every|cada|next|this|pr[óo]ximo|que viene)$/i;
    let prev;
    do {
      prev = t;
      t = t.replace(dangling, '').replace(/[\s,;:.\-–—]+$/g, '').trim();
    } while (t !== prev);
    t = t.replace(/^(on|at|in|with|el|la|a las|con)\s+/i, '');
    t = t.replace(/\s{2,}/g, ' ').trim();
    if (t) t = t[0].toUpperCase() + t.slice(1);
    return t;
  }

  // Options: now (Date), defaultMinutes (60), dateOrder ('dmy' | 'mdy').
  // Returns { event, ctx, meta } or null for empty input.
  function parseQuickAdd(text, opts) {
    opts = opts || {};
    const now = opts.now ? new Date(opts.now) : new Date();
    const defaultMinutes = opts.defaultMinutes || 60;
    const order = opts.dateOrder || 'dmy';
    const cur = makeCursor(text);
    if (!cur.orig) return null;

    const attendees = cur
      .takeAll(/(?:\b(?:with|con|invite|invitar a?|invita a?)\s+)?([\w.+-]+@[\w-]+(?:\.[\w-]+)+)\s*(?:,|\band\b|\by\b)?/)
      .map((m) => ({ email: m[1], name: null }));
    const allDay = !!cur.take(/\b(?:all[\s-]day|todo el d[ií]a|d[ií]a completo)\b/);
    const durationMinutes = parseDuration(cur);
    const recState = {};
    const rrule = parseRecurrence(cur, recState);
    const explicit = parseExplicitDate(cur, now, order);
    const relative = explicit ? null : parseRelativeDate(cur, now);
    const period = parsePeriod(cur);
    let hint = (period && period.hint) || cur.hint || null;
    let times = parseTimes(cur, hint);
    if (!times && period && period.time) times = { start: period.time, end: null };
    if (!times && hint) {
      const h = hint === 'morning' ? 9 : hint === 'afternoon' ? 15 : 19;
      times = { start: { hour: h, minute: 0, explicit: true }, end: null };
    }
    const location = parseLocation(cur);
    const summary = cleanTitle(cur.orig);

    // ---- resolve the start date -------------------------------------------
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDay;
    let hasDate = true;
    let fromRecurrence = false;
    if (explicit) {
      let year = explicit.year;
      if (year == null) {
        year = now.getFullYear();
        const candidate = new Date(year, explicit.month - 1, explicit.day);
        if (candidate < today) year += 1;
      }
      startDay = new Date(year, explicit.month - 1, explicit.day);
    } else if (relative) {
      startDay = relative;
    } else if (recState.weekdays && recState.weekdays.length) {
      startDay = nextListedWeekday(today, recState.weekdays, false);
      fromRecurrence = true;
    } else if (recState.lastDayOfMonth) {
      startDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      if (startDay < today) startDay = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    } else if (recState.firstWeekday != null) {
      startDay = nthWeekday(today.getFullYear(), today.getMonth(), recState.firstWeekday, recState.setpos);
      if (startDay < today) startDay = nthWeekday(today.getFullYear(), today.getMonth() + 1, recState.firstWeekday, recState.setpos);
    } else {
      startDay = today;
      hasDate = false;
    }

    let start;
    let end;
    if (times && !allDay) {
      start = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate(), times.start.hour, times.start.minute);
      // "lunch at 1pm" typed at 3pm means tomorrow (unless a date was given);
      // "every monday and wednesday at 7am" typed on a Wednesday at 10 starts Monday.
      if (!hasDate && start <= now) {
        start = new Date(start.getTime() + 86400000);
      } else if (fromRecurrence && start <= now) {
        const d = nextListedWeekday(today, recState.weekdays, true);
        start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), times.start.hour, times.start.minute);
      }
      if (times.end) {
        end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), times.end.hour, times.end.minute);
        if (end <= start) end = new Date(end.getTime() + 86400000);
      } else {
        end = new Date(start.getTime() + (durationMinutes || defaultMinutes) * 60000);
      }
    } else {
      start = startDay;
      end = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + 1);
    }

    const isDate = !(times && !allDay);
    const event = {
      uid: null,
      summary,
      description: '',
      location: location || '',
      url: '',
      start: comps(start, isDate),
      end: comps(end, isDate),
      rrule,
      attendees,
      organizer: null,
      transparent: false,
      status: null,
      recurrenceId: null,
    };
    return {
      event,
      ctx: { timezone: null, vtimezones: {} },
      meta: {
        hasDate: hasDate || !!relative || !!explicit,
        hasTime: !!times && !allDay,
        hasEndTime: !!(times && times.end) && !allDay,
        allDay: isDate,
        durationMinutes: durationMinutes || null,
      },
    };
  }

  function nextListedWeekday(today, weekdays, excludeToday) {
    let diff = 7;
    for (const wd of weekdays) {
      let d = (wd - today.getDay() + 7) % 7;
      if (d === 0 && excludeToday) d = 7;
      diff = Math.min(diff, d);
    }
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff);
  }

  function nthWeekday(year, month, weekday, n) {
    if (n > 0) {
      const first = new Date(year, month, 1);
      const diff = (weekday - first.getDay() + 7) % 7;
      return new Date(year, month, 1 + diff + (n - 1) * 7);
    }
    const last = new Date(year, month + 1, 0);
    const diff = (last.getDay() - weekday + 7) % 7;
    return new Date(year, month + 1, 0 - diff);
  }

  // Recurrence rules Google's own repeat dialog cannot express (or hides).
  // `rrule(start)` gets the event start as a Date.
  const RECURRENCE_PRESETS = [
    { id: 'none', label: 'Does not repeat', rrule: () => null },
    { id: 'daily', label: 'Every day', rrule: () => 'FREQ=DAILY' },
    { id: 'weekdays', label: 'Every weekday (Mon–Fri)', rrule: () => 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
    { id: 'weekly', label: 'Every week', rrule: (d) => `FREQ=WEEKLY;BYDAY=${BYDAY[d.getDay()]}` },
    { id: 'biweekly', label: 'Every 2 weeks', rrule: (d) => `FREQ=WEEKLY;INTERVAL=2;BYDAY=${BYDAY[d.getDay()]}` },
    { id: 'monthly-date', label: 'Monthly on this date', rrule: (d) => `FREQ=MONTHLY;BYMONTHDAY=${d.getDate()}` },
    { id: 'monthly-last-day', label: 'Last day of every month', rrule: () => 'FREQ=MONTHLY;BYMONTHDAY=-1' },
    { id: 'monthly-first-wd', label: 'First weekday of the month', rrule: () => 'FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=1' },
    { id: 'monthly-last-wd', label: 'Last weekday of the month', rrule: () => 'FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1' },
    {
      id: 'monthly-nth',
      label: 'Monthly on the nth weekday (e.g. 2nd Tuesday)',
      rrule: (d) => `FREQ=MONTHLY;BYDAY=${Math.ceil(d.getDate() / 7)}${BYDAY[d.getDay()]}`,
    },
    { id: 'monthly-last', label: 'Monthly on the last such weekday', rrule: (d) => `FREQ=MONTHLY;BYDAY=-1${BYDAY[d.getDay()]}` },
    { id: 'quarterly', label: 'Every 3 months', rrule: (d) => `FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=${d.getDate()}` },
    { id: 'yearly', label: 'Every year', rrule: () => 'FREQ=YEARLY' },
  ];

  const api = { parseQuickAdd, RECURRENCE_PRESETS, nthWeekday, WEEKDAYS, MONTHS };
  root.BGC = root.BGC || {};
  root.BGC.quickadd = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
