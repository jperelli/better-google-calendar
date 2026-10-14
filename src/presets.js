// Pure helpers for calendar-selection presets: which sidebar checkboxes to
// click to reach a saved set, and the preset list operations. No DOM here.
(function (root) {
  'use strict';

  // Account index from a Calendar URL path: /calendar/u/2/r/week -> 2 (default 0).
  function accountIndex(pathname) {
    const m = /\/u\/(\d+)\//.exec(pathname || '');
    return m ? Number(m[1]) : 0;
  }

  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

  function checkedNames(calendars) {
    return calendars.filter((c) => c.checked).map((c) => norm(c.name));
  }

  // calendars: [{ name, checked }] as read from the sidebar; wanted: names that
  // should end up checked. Returns the clicks to make and the preset names that
  // are no longer in the sidebar.
  function diffPreset(calendars, wanted) {
    const want = new Set((wanted || []).map(norm));
    const seen = new Set();
    const check = [];
    const uncheck = [];
    for (const c of calendars) {
      const name = norm(c.name);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const should = want.has(name);
      if (should && !c.checked) check.push(name);
      else if (!should && c.checked) uncheck.push(name);
    }
    const missing = Array.from(want).filter((n) => !seen.has(n));
    return { check, uncheck, missing };
  }

  function onlyThis(calendars, name) {
    return diffPreset(calendars, [name]);
  }

  function newId() {
    return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function upsertPreset(items, preset) {
    const list = (items || []).slice();
    const name = norm(preset.name);
    const calendars = Array.from(new Set((preset.calendars || []).map(norm).filter(Boolean)));
    const i = list.findIndex((p) => (preset.id && p.id === preset.id) || norm(p.name).toLowerCase() === name.toLowerCase());
    const next = { id: i >= 0 ? list[i].id : preset.id || newId(), name, calendars };
    if (i >= 0) list[i] = next;
    else list.push(next);
    return list;
  }

  function renamePreset(items, id, name) {
    return (items || []).map((p) => (p.id === id ? Object.assign({}, p, { name: norm(name) || p.name }) : p));
  }

  function deletePreset(items, id) {
    return (items || []).filter((p) => p.id !== id);
  }

  // Does the current selection equal a preset? (for marking the active one)
  function matches(calendars, preset) {
    const d = diffPreset(calendars, preset.calendars);
    return !d.check.length && !d.uncheck.length && !d.missing.length;
  }

  const api = { accountIndex, checkedNames, diffPreset, onlyThis, upsertPreset, renamePreset, deletePreset, matches, newId };
  root.BGC = root.BGC || {};
  root.BGC.presets = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
