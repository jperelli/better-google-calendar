// Pure helpers for merging duplicate event chips: the same event shown on
// several visible calendars (same title, same start/end) collapses into one
// chip painted with diagonal stripes of all the calendars' colours. A wildcard
// title (default "Busy") merges by time only. No DOM here.
(function (root) {
  'use strict';

  const normTitle = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function timeKey(chip) {
    const date = chip.date instanceof Date ? `${chip.date.getFullYear()}-${chip.date.getMonth() + 1}-${chip.date.getDate()}` : String(chip.date || '');
    if (!chip.time) return `${date}|allday`;
    return `${date}|${chip.time.startMin}-${chip.time.endMin}`;
  }

  // chips: [{ title, text, time: {startMin, endMin} | null, date, color, ... }] in document order.
  // Returns groups with more than one chip: { key, title, survivor, hidden, chips, colors }.
  function groupDuplicates(chips, opts) {
    opts = opts || {};
    const wildcard = normTitle(opts.wildcard == null ? 'Busy' : opts.wildcard);
    const byTime = new Map();
    for (const chip of chips || []) {
      if (!chip || !chip.date) continue;
      const k = timeKey(chip);
      if (!byTime.has(k)) byTime.set(k, []);
      byTime.get(k).push(chip);
    }
    const groups = [];
    for (const [k, list] of byTime) {
      if (list.length < 2) continue;
      const byTitle = new Map();
      const wild = [];
      for (const chip of list) {
        const t = normTitle(chip.title);
        if (wildcard && t === wildcard) wild.push(chip);
        else {
          if (!byTitle.has(t)) byTitle.set(t, []);
          byTitle.get(t).push(chip);
        }
      }
      // Wildcard chips join the first titled group of that slot, or form their own group.
      if (wild.length) {
        const first = byTitle.keys().next();
        if (!first.done) byTitle.get(first.value).push(...wild);
        else byTitle.set(wildcard, wild);
      }
      for (const [t, members] of byTitle) {
        if (members.length < 2) continue;
        const survivor = members[0];
        groups.push({
          key: `${k}|${t}`,
          title: survivor.title,
          survivor,
          hidden: members.slice(1),
          chips: members,
          colors: uniqueColors(members.map((c) => c.color)),
        });
      }
    }
    return groups;
  }

  function uniqueColors(colors) {
    const out = [];
    for (const c of colors) {
      const v = String(c || '').trim();
      if (v && !out.includes(v)) out.push(v);
    }
    return out;
  }

  // CSS background for a merged chip: diagonal stripes, one band per colour.
  function stripeGradient(colors, bandPx) {
    const cs = uniqueColors(colors);
    const px = bandPx || 8;
    if (!cs.length) return '';
    if (cs.length === 1) return cs[0];
    const stops = cs.map((c, i) => `${c} ${i * px}px ${(i + 1) * px}px`);
    return `repeating-linear-gradient(135deg, ${stops.join(', ')})`;
  }

  // Calendar name from a chip's accessible text "10am to 11am, Team sync, Work, ..." given its title.
  function calendarOf(text, title) {
    const parts = String(text || '').split(/,\s*/).map((p) => p.trim()).filter(Boolean);
    const t = normTitle(title);
    const i = parts.findIndex((p) => normTitle(p) === t);
    if (i >= 0 && i + 1 < parts.length) return parts[i + 1].replace(/^(calendar|calendario|agenda)\s*:\s*/i, '');
    return '';
  }

  const api = { groupDuplicates, stripeGradient, calendarOf, normTitle, timeKey };
  root.BGC = root.BGC || {};
  root.BGC.merge = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
