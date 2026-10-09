// Content script for calendar.google.com: catches dropped .ics files and
// opens Google Calendar's own "new event" form pre-filled from the file.
// One event -> navigate straight to the form. Several -> list them in a modal
// with an "Open to add" button each.
(function () {
  'use strict';
  if (window.__betterGoogleCalendarLoaded) return;
  window.__betterGoogleCalendarLoaded = true;

  const BGC = window.BGC;
  const { parseICS, naiveMs } = BGC.ics;
  const { buildEventEditUrl, eventEditBase, resolveTimeZone, zonedToUtcMs } = BGC.gcal;

  const STYLE = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .bgc-overlay {
      position: fixed; inset: 0; z-index: 2147483646;
      background: rgba(26, 115, 232, 0.08);
      display: flex; align-items: center; justify-content: center;
      pointer-events: none;
      font-family: 'Google Sans', Roboto, Arial, sans-serif;
    }
    .bgc-overlay::before {
      content: ''; position: absolute; inset: 12px;
      border: 2px dashed #1a73e8; border-radius: 12px;
    }
    .bgc-overlay-card {
      background: #fff; color: #3c4043; border-radius: 8px;
      padding: 20px 28px; font-size: 16px; line-height: 24px;
      box-shadow: 0 4px 8px 3px rgba(60,64,67,.15), 0 1px 3px rgba(60,64,67,.3);
      display: flex; align-items: center; gap: 12px;
    }
    .bgc-overlay-card svg { width: 28px; height: 28px; fill: #1a73e8; flex: none; }
    .bgc-backdrop {
      position: fixed; inset: 0; z-index: 2147483647;
      background: rgba(0, 0, 0, 0.5);
      display: flex; align-items: center; justify-content: center;
      font-family: Roboto, 'Google Sans', Arial, sans-serif;
      color: #3c4043;
    }
    .bgc-dialog {
      background: #fff; border-radius: 8px; width: 640px; max-width: calc(100vw - 32px);
      max-height: calc(100vh - 64px); display: flex; flex-direction: column;
      box-shadow: 0 24px 38px 3px rgba(0,0,0,.14), 0 9px 46px 8px rgba(0,0,0,.12), 0 11px 15px -7px rgba(0,0,0,.2);
      outline: none;
    }
    .bgc-header {
      display: flex; align-items: center; gap: 8px; padding: 14px 12px 10px 24px;
      border-bottom: 1px solid #dadce0;
    }
    .bgc-title { font-family: 'Google Sans', Roboto, Arial, sans-serif; font-size: 20px; line-height: 28px; flex: 1; color: #202124; }
    .bgc-subtitle { font-size: 13px; color: #5f6368; margin-top: 2px; }
    .bgc-icon-btn {
      border: 0; background: transparent; width: 40px; height: 40px; border-radius: 50%;
      cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: #5f6368;
    }
    .bgc-icon-btn:hover { background: rgba(60,64,67,.08); }
    .bgc-icon-btn svg { width: 24px; height: 24px; fill: currentColor; }
    .bgc-list { overflow: auto; padding: 8px 0; margin: 0; list-style: none; }
    .bgc-row {
      display: grid; grid-template-columns: 56px 1fr auto; gap: 0 16px; align-items: center;
      padding: 10px 24px;
    }
    .bgc-row:hover { background: #f8f9fa; }
    .bgc-row.bgc-opened { opacity: .72; }
    .bgc-date { text-align: center; line-height: 1.1; }
    .bgc-date .bgc-dow { font-size: 11px; text-transform: uppercase; color: #70757a; letter-spacing: .8px; }
    .bgc-date .bgc-dom {
      font-family: 'Google Sans', Roboto, Arial, sans-serif; font-size: 24px; color: #3c4043;
      width: 44px; height: 44px; margin: 2px auto 0; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .bgc-row.bgc-opened .bgc-dom { background: #1a73e8; color: #fff; }
    .bgc-main { min-width: 0; }
    .bgc-summary { font-size: 14px; font-weight: 500; color: #202124; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bgc-meta { font-size: 13px; color: #5f6368; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bgc-chip {
      display: inline-block; font-size: 11px; line-height: 16px; padding: 0 6px; border-radius: 8px;
      background: #e8f0fe; color: #1967d2; margin-left: 6px; vertical-align: 1px;
    }
    .bgc-btn {
      font-family: 'Google Sans', Roboto, Arial, sans-serif; font-size: 14px; font-weight: 500;
      line-height: 36px; height: 36px; padding: 0 16px; border-radius: 4px; cursor: pointer;
      border: 1px solid #dadce0; background: #fff; color: #1a73e8; white-space: nowrap;
    }
    .bgc-btn:hover { background: #f6fafe; border-color: #d2e3fc; }
    .bgc-btn:focus-visible { outline: 2px solid #1a73e8; outline-offset: 1px; }
    .bgc-btn.bgc-primary { background: #1a73e8; color: #fff; border-color: #1a73e8; }
    .bgc-btn.bgc-primary:hover { background: #1b66c9; box-shadow: 0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15); }
    .bgc-btn.bgc-text { border-color: transparent; }
    .bgc-btn.bgc-text:hover { background: rgba(26,115,232,.04); }
    .bgc-footer {
      display: flex; align-items: center; justify-content: flex-end; gap: 8px;
      padding: 12px 16px 16px; border-top: 1px solid #dadce0;
    }
    .bgc-footer .bgc-hint { flex: 1; font-size: 12px; color: #5f6368; }
    .bgc-toast {
      position: fixed; left: 24px; bottom: 24px; z-index: 2147483647;
      background: #202124; color: #e8eaed; font-family: Roboto, Arial, sans-serif; font-size: 14px;
      line-height: 20px; padding: 14px 24px; border-radius: 4px; max-width: 480px;
      box-shadow: 0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12);
    }
  `;

  const ICON_CALENDAR_PLUS =
    '<svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14v11zm-8-9h2v3h3v2h-3v3h-2v-3H8v-2h3v-3z"/></svg>';
  const ICON_CLOSE =
    '<svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

  const host = document.createElement('div');
  host.id = 'better-google-calendar-root';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = STYLE;
  shadow.appendChild(style);

  function mount() {
    if (!host.isConnected) (document.body || document.documentElement).appendChild(host);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // ---- drop overlay -------------------------------------------------------

  let overlay = null;
  let dragDepth = 0;

  function showOverlay() {
    mount();
    if (!overlay) {
      overlay = el('div', 'bgc-overlay');
      const card = el('div', 'bgc-overlay-card');
      card.innerHTML = ICON_CALENDAR_PLUS;
      card.appendChild(el('span', null, 'Drop the .ics file to add its events'));
      overlay.appendChild(card);
    }
    if (!overlay.isConnected) shadow.appendChild(overlay);
  }

  function hideOverlay() {
    dragDepth = 0;
    if (overlay && overlay.isConnected) overlay.remove();
  }

  function hasFiles(e) {
    const dt = e.dataTransfer;
    if (!dt) return false;
    const types = Array.from(dt.types || []);
    return types.includes('Files');
  }

  window.addEventListener(
    'dragenter',
    (e) => {
      if (!hasFiles(e)) return;
      dragDepth++;
      e.preventDefault();
      e.stopPropagation();
      showOverlay();
    },
    true
  );

  window.addEventListener(
    'dragover',
    (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      if (!overlay || !overlay.isConnected) showOverlay();
    },
    true
  );

  window.addEventListener(
    'dragleave',
    (e) => {
      if (!hasFiles(e)) return;
      e.stopPropagation();
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) hideOverlay();
    },
    true
  );

  window.addEventListener(
    'drop',
    (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      hideOverlay();
      handleFiles(Array.from(e.dataTransfer.files));
    },
    true
  );

  // ---- toast --------------------------------------------------------------

  let toastNode = null;
  let toastTimer = null;
  function toast(message) {
    mount();
    if (!toastNode) toastNode = el('div', 'bgc-toast');
    toastNode.textContent = message;
    if (!toastNode.isConnected) shadow.appendChild(toastNode);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastNode.remove(), 5000);
  }

  // ---- file handling ------------------------------------------------------

  function isIcsFile(file) {
    return /\.(ics|ical|icalendar|ifb)$/i.test(file.name) || /text\/calendar/i.test(file.type || '');
  }

  function readFile(file) {
    if (typeof file.text === 'function') return file.text();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  async function handleFiles(files) {
    const icsFiles = files.filter(isIcsFile);
    if (!icsFiles.length) {
      toast(files.length ? 'Only .ics calendar files can be dropped here.' : 'Drop a .ics file to add its events.');
      return;
    }
    const items = [];
    for (const file of icsFiles) {
      try {
        const parsed = parseICS(await readFile(file));
        for (const event of parsed.events) items.push({ event, ctx: parsed, file: file.name });
      } catch (err) {
        console.error('[Better Google Calendar] failed to read', file.name, err);
        toast(`Could not read ${file.name}.`);
      }
    }
    if (!items.length) {
      toast('No events were found in the dropped file.');
      return;
    }
    const base = eventEditBase(location.href);
    for (const item of items) item.url = buildEventEditUrl(item.event, item.ctx, { base });
    items.sort((a, b) => startMs(a) - startMs(b));

    if (items.length === 1) {
      location.assign(items[0].url);
      return;
    }
    showEventList(items, icsFiles.map((f) => f.name));
  }

  // ---- event list modal ---------------------------------------------------

  function startMs(item) {
    const c = item.event.start;
    if (c.isDate) return naiveMs(c);
    return instantMs(c, item.ctx);
  }

  function instantMs(c, ctx) {
    if (c.utc) return naiveMs(c);
    const tz = resolveTimeZone(c.tzid, ctx.vtimezones) || resolveTimeZone(ctx.timezone, ctx.vtimezones);
    if (tz) return zonedToUtcMs(c, tz);
    return new Date(c.year, c.month - 1, c.day, c.hour, c.minute, c.second).getTime();
  }

  const fmtDow = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
  const fmtDay = new Intl.DateTimeFormat(undefined, { day: 'numeric' });
  const fmtLongDate = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

  function describeWhen(item) {
    const { start, end } = item.event;
    if (start.isDate) {
      const s = new Date(start.year, start.month - 1, start.day);
      const e = new Date(end.year, end.month - 1, end.day - 1);
      const days = Math.round((naiveMs(end) - naiveMs(start)) / 86400000);
      if (days <= 1) return `${fmtLongDate.format(s)} · All day`;
      return `${fmtLongDate.format(s)} – ${fmtLongDate.format(e)} · All day`;
    }
    const s = new Date(instantMs(start, item.ctx));
    const e = new Date(instantMs(end, item.ctx));
    const sameDay = s.toDateString() === e.toDateString();
    if (sameDay) {
      if (s.getTime() === e.getTime()) return `${fmtLongDate.format(s)} · ${fmtTime.format(s)}`;
      return `${fmtLongDate.format(s)} · ${fmtTime.format(s)} – ${fmtTime.format(e)}`;
    }
    return `${fmtLongDate.format(s)}, ${fmtTime.format(s)} – ${fmtLongDate.format(e)}, ${fmtTime.format(e)}`;
  }

  let dialogBackdrop = null;

  function closeDialog() {
    if (dialogBackdrop) dialogBackdrop.remove();
    dialogBackdrop = null;
    document.removeEventListener('keydown', onKeydown, true);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeDialog();
    }
  }

  function openUrls(urls) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: 'bgc:open-tabs', urls }, (res) => {
          if (chrome.runtime.lastError || !res || !res.ok) fallback();
          resolve();
        });
      } catch (err) {
        fallback();
        resolve();
      }
      function fallback() {
        for (const url of urls) window.open(url, '_blank', 'noopener');
      }
    });
  }

  function showEventList(items, fileNames) {
    mount();
    closeDialog();
    dialogBackdrop = el('div', 'bgc-backdrop');
    dialogBackdrop.addEventListener('click', (e) => {
      if (e.target === dialogBackdrop) closeDialog();
    });

    const dialog = el('div', 'bgc-dialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.tabIndex = -1;

    const header = el('div', 'bgc-header');
    const titleWrap = el('div', 'bgc-title');
    titleWrap.appendChild(el('div', null, `${items.length} events found`));
    const fileLabel = fileNames.length === 1 ? fileNames[0] : `${fileNames.length} files`;
    titleWrap.appendChild(el('div', 'bgc-subtitle', `${fileLabel} · choose which ones to add to Google Calendar`));
    header.appendChild(titleWrap);
    const closeBtn = el('button', 'bgc-icon-btn');
    closeBtn.type = 'button';
    closeBtn.title = 'Close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = ICON_CLOSE;
    closeBtn.addEventListener('click', closeDialog);
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    const list = el('ul', 'bgc-list');
    const rows = [];
    for (const item of items) {
      const row = el('li', 'bgc-row');
      const startDate = new Date(startMs(item));

      const date = el('div', 'bgc-date');
      date.appendChild(el('div', 'bgc-dow', fmtDow.format(startDate)));
      date.appendChild(el('div', 'bgc-dom', fmtDay.format(startDate)));
      row.appendChild(date);

      const main = el('div', 'bgc-main');
      const summary = el('div', 'bgc-summary', item.event.summary || '(No title)');
      if (item.event.rrule) summary.appendChild(el('span', 'bgc-chip', 'Repeats'));
      if (item.event.attendees.length) {
        summary.appendChild(el('span', 'bgc-chip', `${item.event.attendees.length} guests`));
      }
      main.appendChild(summary);
      const metaParts = [describeWhen(item)];
      if (item.event.location) metaParts.push(item.event.location);
      if (fileNames.length > 1) metaParts.push(item.file);
      const meta = el('div', 'bgc-meta', metaParts.join(' · '));
      meta.title = metaParts.join('\n');
      main.appendChild(meta);
      row.appendChild(main);

      const btn = el('button', 'bgc-btn', 'Open to add');
      btn.type = 'button';
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        await openUrls([item.url]);
        btn.disabled = false;
        btn.textContent = 'Open again';
        row.classList.add('bgc-opened');
      });
      row.appendChild(btn);
      list.appendChild(row);
      rows.push({ row, btn });
    }
    dialog.appendChild(list);

    const footer = el('div', 'bgc-footer');
    footer.appendChild(el('span', 'bgc-hint', 'Each event opens in a new tab with Google\u2019s form pre-filled; review and press Save.'));
    const openAll = el('button', 'bgc-btn bgc-primary', `Open all ${items.length}`);
    openAll.type = 'button';
    openAll.addEventListener('click', async () => {
      openAll.disabled = true;
      await openUrls(items.map((it) => it.url));
      openAll.disabled = false;
      for (const { row, btn } of rows) {
        row.classList.add('bgc-opened');
        btn.textContent = 'Open again';
      }
    });
    footer.appendChild(openAll);
    const done = el('button', 'bgc-btn bgc-text', 'Close');
    done.type = 'button';
    done.addEventListener('click', closeDialog);
    footer.appendChild(done);
    dialog.appendChild(footer);

    dialogBackdrop.appendChild(dialog);
    shadow.appendChild(dialogBackdrop);
    document.addEventListener('keydown', onKeydown, true);
    dialog.focus();
  }
})();
