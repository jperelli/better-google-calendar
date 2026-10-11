// Command palette model: the list of things the palette can do, built from the
// current calendar URL, plus a fuzzy filter. Pure (no DOM) so it is unit tested;
// the feature script renders it and runs the chosen command.
(function (root) {
  'use strict';

  const VIEWS = {
    day: 'day', week: 'week', month: 'month', year: 'year', agenda: 'agenda', customday: 'customday', customweek: 'customweek',
  };

  // "https://calendar.google.com/calendar/u/0/r/week/2026/11/14" ->
  // { base: ".../calendar/u/0/r", view: "week", date: Date|null }
  function parseCalendarUrl(href) {
    let origin = 'https://calendar.google.com';
    let account = '';
    let view = 'week';
    let date = null;
    try {
      const u = new URL(href);
      if (/calendar\.google\.com$/.test(u.hostname)) origin = u.origin;
      const m = u.pathname.match(/^\/calendar\/(u\/\d+|b\/\d+)?\/?r(?:\/([a-z]+))?(?:\/(\d{4})\/(\d{1,2})\/(\d{1,2}))?/);
      if (m) {
        if (m[1]) account = `/${m[1]}`;
        if (m[2] && VIEWS[m[2]]) view = m[2];
        if (m[3]) date = new Date(+m[3], +m[4] - 1, +m[5]);
      } else if (u.searchParams.get('authuser')) {
        account = `/u/${u.searchParams.get('authuser')}`;
      }
    } catch (e) {
      /* ignore */
    }
    return { base: `${origin}/calendar${account}/r`, view, date };
  }

  function dateUrl(ctx, view, d) {
    const v = view || ctx.view || 'week';
    if (!d) return `${ctx.base}/${v}`;
    return `${ctx.base}/${v}/${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  }

  // Google's settings pages. Sections inside the General page have no stable
  // anchors, so each entry says where to look once the page opens.
  const SETTINGS = [
    ['Week starts on (Monday / Sunday)', 'settings', 'General > View options > Start week on', ['first day', 'monday', 'sunday', 'semana empieza', 'lunes']],
    ['Show declined events', 'settings', 'General > View options', ['declined', 'rechazados', 'hide declined']],
    ['Show week numbers', 'settings', 'General > View options', ['week number', 'número de semana']],
    ['Reduce brightness of past events', 'settings', 'General > View options', ['dim past', 'past events', 'brightness']],
    ['Custom view length (2–7 days, 2–4 weeks)', 'settings', 'General > View options > Set custom view', ['custom view', '4 days', '2 weeks', 'vista personalizada']],
    ['Stop adding invitations automatically / only from known senders', 'settings', 'General > Event settings > Add invitations to my calendar', ['invitations', 'spam', 'invitaciones', 'auto add']],
    ['Default event duration and speedy meetings', 'settings', 'General > Event settings > Default duration', ['duration', 'speedy', 'duración', 'default length']],
    ['Stop adding Google Meet to every event', 'settings', 'General > Event settings > Automatically add Google Meet video conferences', ['meet', 'video conference', 'videollamada']],
    ['Default guest permissions', 'settings', 'General > Event settings > Default guest permissions', ['guest', 'invitados', 'modify event']],
    ['Default notifications (e.g. 30 minutes before)', 'settings', 'Settings for my calendars > (calendar) > Event notifications', ['notification', 'reminder', 'recordatorio', 'alert']],
    ['Daily agenda email', 'settings', 'Settings for my calendars > (calendar) > Other notifications > Daily agenda', ['agenda email', 'daily agenda', 'correo']],
    ['Working hours and location', 'settings', 'General > Working hours & location', ['working hours', 'horario laboral', 'work hours', 'location']],
    ['Time zone / secondary time zones', 'settings', 'General > Time zone', ['time zone', 'timezone', 'zona horaria', 'secondary']],
    ['World clock', 'settings', 'General > World clock', ['world clock', 'reloj mundial']],
    ['Enable keyboard shortcuts', 'settings', 'General > Keyboard shortcuts', ['keyboard', 'shortcuts', 'atajos', 'teclado']],
    ['Events from Gmail (flights, reservations)', 'settings', 'General > Events from Gmail', ['gmail', 'reservations', 'flights', 'vuelos']],
    ['Birthdays calendar (hide duplicates, contacts)', 'settings', 'Settings for other calendars > Birthdays', ['birthday', 'cumpleaños', 'duplicate birthdays']],
    ['Alternate calendar (lunar, Hebrew, Hijri…)', 'settings', 'General > View options > Alternate calendar', ['alternate', 'lunar', 'hebrew', 'hijri']],
    ['Appointment schedules (booking page)', 'settings/appointment', 'Appointment schedules', ['appointment', 'booking', 'citas', 'reservas']],
    ['Import an .ics / .csv file', 'settings/export', 'Import & export > Import', ['import', 'importar', 'ics', 'csv']],
    ['Export all calendars (.ics)', 'settings/export', 'Import & export > Export', ['export', 'exportar', 'backup']],
    ['Trash (deleted events, 30 days)', 'trash', 'Trash', ['trash', 'bin', 'deleted', 'papelera', 'restore']],
    ['Add a calendar / subscribe to a URL', 'settings/addcalendar', 'Add calendar', ['add calendar', 'subscribe', 'url', 'suscribir', 'holidays']],
    ['Create a new calendar', 'settings/createcalendar', 'Create new calendar', ['new calendar', 'crear calendario']],
    ['Browse calendars of interest (holidays, sports)', 'settings/addcalendar/browse', 'Browse calendars of interest', ['holidays', 'festivos', 'sports', 'moon phases']],
    ['Density and color (appearance)', 'settings', 'Gear menu > Appearance (density, dark theme)', ['dark', 'theme', 'density', 'compact', 'oscuro', 'appearance']],
  ];

  function settingsCommands(ctx) {
    return SETTINGS.map(([label, path, hint, keywords]) => ({
      id: `settings:${label}`,
      group: 'Google settings',
      label,
      hint,
      keywords: keywords.concat(['setting', 'ajustes', 'configuración']),
      url: `${ctx.base}/${path}`,
    }));
  }

  function viewCommands(ctx) {
    const d = ctx.date;
    const items = [
      ['Day view', 'day', ['1', 'día']],
      ['Week view', 'week', ['2', 'semana']],
      ['Month view', 'month', ['3', 'mes']],
      ['Year view', 'year', ['año']],
      ['Schedule (agenda) view', 'agenda', ['5', 'list', 'agenda']],
      ['Custom view (days)', 'customday', ['4', 'custom', '4 days']],
      ['Custom view (weeks)', 'customweek', ['custom', '2 weeks', '4 weeks', 'quincena']],
    ];
    return items.map(([label, view, kw]) => ({
      id: `view:${view}`,
      group: 'Views',
      label,
      keywords: kw.concat(['view', 'vista', 'show']),
      url: dateUrl(ctx, view, d),
    }));
  }

  function navCommands(ctx, now) {
    now = now || new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const base = ctx.date || today;
    const step = ctx.view === 'day' ? 1 : ctx.view === 'month' ? 30 : ctx.view === 'year' ? 365 : 7;
    const shift = (days) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
    return [
      { id: 'nav:today', group: 'Go to', label: 'Today', keywords: ['today', 'hoy', 'now', 't'], url: dateUrl(ctx, null, null) },
      { id: 'nav:next', group: 'Go to', label: `Next ${ctx.view === 'day' ? 'day' : ctx.view === 'month' ? 'month' : ctx.view === 'year' ? 'year' : 'week'}`, keywords: ['next', 'siguiente', 'forward'], url: dateUrl(ctx, null, ctx.view === 'month' ? new Date(base.getFullYear(), base.getMonth() + 1, 1) : ctx.view === 'year' ? new Date(base.getFullYear() + 1, 0, 1) : shift(step)) },
      { id: 'nav:prev', group: 'Go to', label: `Previous ${ctx.view === 'day' ? 'day' : ctx.view === 'month' ? 'month' : ctx.view === 'year' ? 'year' : 'week'}`, keywords: ['previous', 'prev', 'anterior', 'back'], url: dateUrl(ctx, null, ctx.view === 'month' ? new Date(base.getFullYear(), base.getMonth() - 1, 1) : ctx.view === 'year' ? new Date(base.getFullYear() - 1, 0, 1) : shift(-step)) },
      { id: 'nav:search', group: 'Go to', label: 'Search events…', keywords: ['search', 'find', 'buscar'], url: `${ctx.base}/search`, takesQuery: true },
    ];
  }

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Score: every query word must appear in label/keywords/hint/group; earlier,
  // label-prefix matches rank higher.
  function score(cmd, query) {
    const q = norm(query).trim();
    if (!q) return 1;
    const label = norm(cmd.label);
    const hay = `${label} ${norm((cmd.keywords || []).join(' '))} ${norm(cmd.hint)} ${norm(cmd.group)}`;
    const kw = norm((cmd.keywords || []).join(' '));
    let total = 0;
    for (const word of q.split(/\s+/)) {
      if (!word) continue;
      const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`(^|\\W)${esc}(\\W|$)`).test(label)) total += 6;
      else if (new RegExp(`(^|\\W)${esc}`).test(label)) total += 5;
      else if (new RegExp(`(^|\\W)${esc}(\\W|$)`).test(kw)) total += 4;
      else if (label.includes(word)) total += 3;
      else if (hay.includes(word)) total += 1;
      else return 0;
    }
    return total;
  }

  // Build the full list for the given page + query. `extra` are commands the
  // feature script adds (extension toggles, "go to <typed date>").
  function buildCommands(href, query, opts) {
    opts = opts || {};
    const ctx = parseCalendarUrl(href);
    let all = [].concat(opts.extra || [], navCommands(ctx, opts.now), viewCommands(ctx), settingsCommands(ctx));
    return all
      .map((c) => Object.assign({}, c, { score: score(c, query) }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.limit || 12);
  }

  const api = { parseCalendarUrl, dateUrl, buildCommands, score, SETTINGS };
  root.BGC = root.BGC || {};
  root.BGC.palette = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
