const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../src/presets.js');

const sidebar = [
  { name: 'Work', checked: true },
  { name: 'Personal', checked: true },
  { name: 'Holidays in Spain', checked: true },
  { name: 'Team', checked: false },
];

test('accountIndex reads /u/N/ and defaults to 0', () => {
  assert.equal(P.accountIndex('/calendar/u/2/r/week'), 2);
  assert.equal(P.accountIndex('/calendar/r/week'), 0);
  assert.equal(P.accountIndex(''), 0);
});

test('checkedNames lists the checked calendars in sidebar order', () => {
  assert.deepEqual(P.checkedNames(sidebar), ['Work', 'Personal', 'Holidays in Spain']);
});

test('diffPreset computes the clicks needed and reports vanished calendars', () => {
  const d = P.diffPreset(sidebar, ['Work', 'Team', 'Old calendar']);
  assert.deepEqual(d.check, ['Team']);
  assert.deepEqual(d.uncheck, ['Personal', 'Holidays in Spain']);
  assert.deepEqual(d.missing, ['Old calendar']);
});

test('diffPreset is a no-op when the selection already matches (whitespace-insensitive)', () => {
  const d = P.diffPreset(sidebar, [' Work', 'Personal ', 'Holidays  in Spain']);
  assert.deepEqual(d, { check: [], uncheck: [], missing: [] });
  assert.equal(P.matches(sidebar, { calendars: ['Work', 'Personal', 'Holidays in Spain'] }), true);
  assert.equal(P.matches(sidebar, { calendars: ['Work'] }), false);
});

test('diffPreset ignores duplicate sidebar entries (same calendar listed twice)', () => {
  const d = P.diffPreset(sidebar.concat([{ name: 'Work', checked: false }]), ['Work']);
  assert.deepEqual(d.check, []);
  assert.deepEqual(d.uncheck, ['Personal', 'Holidays in Spain']);
});

test('onlyThis unchecks everything but one calendar', () => {
  const d = P.onlyThis(sidebar, 'Team');
  assert.deepEqual(d.check, ['Team']);
  assert.deepEqual(d.uncheck, ['Work', 'Personal', 'Holidays in Spain']);
});

test('upsertPreset adds, replaces by name (case-insensitive) or by id, dedupes calendars', () => {
  let items = P.upsertPreset([], { name: 'Focus', calendars: ['Work', 'Work', ' Team'] });
  assert.equal(items.length, 1);
  assert.deepEqual(items[0].calendars, ['Work', 'Team']);
  assert.ok(items[0].id);
  items = P.upsertPreset(items, { name: 'focus', calendars: ['Personal'] });
  assert.equal(items.length, 1);
  assert.deepEqual(items[0].calendars, ['Personal']);
  const id = items[0].id;
  items = P.upsertPreset(items, { id, name: 'Deep work', calendars: ['Work'] });
  assert.deepEqual(items.map((p) => p.name), ['Deep work']);
  items = P.upsertPreset(items, { name: 'Family', calendars: ['Personal'] });
  assert.equal(items.length, 2);
});

test('renamePreset and deletePreset', () => {
  const items = P.upsertPreset([], { id: 'a', name: 'Focus', calendars: ['Work'] });
  assert.equal(P.renamePreset(items, 'a', '  Deep ')[0].name, 'Deep');
  assert.equal(P.renamePreset(items, 'a', '')[0].name, 'Focus');
  assert.deepEqual(P.deletePreset(items, 'a'), []);
  assert.equal(P.deletePreset(items, 'zzz').length, 1);
});
