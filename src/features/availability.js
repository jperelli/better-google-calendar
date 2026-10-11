// Share availability as text: from the visible week, list the free gaps inside
// your working hours and copy them as "Tue 25 Mar: 9:00–11:00, 14:00–16:00".
// Only what is on screen is read; no account access.
(function () {
  'use strict';
  const BGC = window.BGC;
  if (!BGC || !BGC.liveGrid || !BGC.grid || !BGC.ui) return;
  const { freeSlots, formatSlots } = BGC.grid;
  const { el, toast, openDialog } = BGC.ui;

  function compute() {
    const model = BGC.liveGrid.get();
    if (!model.ok) return null;
    const theme = BGC.features && BGC.features.gridTheme ? BGC.features.gridTheme.get() : { workStart: 9, workEnd: 18, workDays: [1, 2, 3, 4, 5] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = model.columns.filter((c) => !c.header && c.date >= today && theme.workDays.includes(c.date.getDay())).map((c) => c.date);
    const uniq = [];
    for (const d of days) if (!uniq.some((u) => u.toDateString() === d.toDateString())) uniq.push(d);
    uniq.sort((a, b) => a - b);
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const busy = model.chips
      .filter((c) => c.time && c.date && !c.declined)
      .map((c) => ({ date: c.date, startMin: c.time.startMin, endMin: c.time.endMin }));
    for (const d of uniq) if (d.toDateString() === new Date().toDateString()) busy.push({ date: d, startMin: 0, endMin: Math.ceil(nowMin / 30) * 30 });
    for (const d of uniq) for (const c of model.chips) if (c.allDay && c.date && c.date.toDateString() === d.toDateString() && /out of office|ooo|vacation|holiday|vacaciones/i.test(c.title)) busy.push({ date: d, startMin: 0, endMin: 1440 });
    return { days: freeSlots(uniq, busy, { startMin: theme.workStart * 60, endMin: theme.workEnd * 60, minMinutes: 30 }), theme };
  }

  function open() {
    const res = compute();
    if (!res) return toast('The week grid could not be read on this page. Open the week view first.');
    const h12 = /AM|PM/i.test((res.days[0] && BGC.liveGrid.get().gutter && BGC.liveGrid.get().gutter.labels[0].node.textContent) || '');
    let minMinutes = 30;
    const { dialog, close } = openDialog({ title: 'Share your free times', subtitle: `Free gaps in the visible week, ${res.theme.workStart}:00–${res.theme.workEnd}:00 on your working days. Edit, then copy.` });
    const body = el('div');
    body.style.cssText = 'padding: 12px 24px 0;';
    const ta = el('textarea');
    ta.style.cssText = 'width:100%;min-height:180px;font:14px Roboto,Arial,sans-serif;padding:10px;border:1px solid #dadce0;border-radius:8px;color:#202124;';
    const refresh = () => {
      const again = compute();
      const days = again ? again.days.map((d) => ({ date: d.date, slots: d.slots.filter(([a, b]) => b - a >= minMinutes) })) : [];
      ta.value = formatSlots(days, { h12 }) || 'No free gaps in the visible days inside your working hours.';
    };
    refresh();
    body.appendChild(ta);
    const row = el('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:10px;font-size:12px;color:#5f6368;';
    row.appendChild(el('span', null, 'Minimum gap'));
    const sel = el('select', 'bgc-qa-select');
    for (const m of [30, 45, 60, 90, 120]) {
      const o = el('option', null, `${m} min`);
      o.value = String(m);
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => {
      minMinutes = +sel.value;
      refresh();
    });
    row.appendChild(sel);
    row.appendChild(el('span', null, 'Working hours come from the palette command "Set working hours".'));
    body.appendChild(row);
    dialog.appendChild(body);
    const footer = el('div', 'bgc-footer');
    const copyBtn = el('button', 'bgc-btn bgc-primary', 'Copy');
    copyBtn.type = 'button';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(ta.value).then(() => {
        toast('Free times copied. Paste them in your e-mail or chat.');
        close();
      });
    });
    const cancel = el('button', 'bgc-btn bgc-text', 'Close');
    cancel.type = 'button';
    cancel.addEventListener('click', close);
    footer.append(cancel, copyBtn);
    dialog.appendChild(footer);
    ta.focus();
    ta.select();
  }

  BGC.features = BGC.features || {};
  BGC.features.availability = { open, compute };
})();
