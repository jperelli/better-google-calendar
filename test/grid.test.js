const test = require('node:test');
const assert = require('node:assert/strict');
const g = require('../src/grid.js');

test('datekey round trip and known values', () => {
  assert.equal(g.dateFromDatekey('33').toDateString(), new Date(1970, 0, 1).toDateString());
  const d = new Date(2026, 10, 14);
  assert.equal(g.dateFromDatekey(String(g.datekeyFromDate(d))).toDateString(), d.toDateString());
  assert.equal(g.dateFromDatekey('abc'), null);
});

test('hour labels in several locales', () => {
  assert.equal(g.parseHourLabel('1 AM'), 1);
  assert.equal(g.parseHourLabel('12 PM'), 12);
  assert.equal(g.parseHourLabel('12 AM'), 0);
  assert.equal(g.parseHourLabel('11pm'), 23);
  assert.equal(g.parseHourLabel('13:00'), 13);
  assert.equal(g.parseHourLabel('07'), 7);
  assert.equal(g.parseHourLabel('GMT+02'), null);
  assert.equal(g.parseHourLabel('Mon'), null);
});

test('chip time ranges', () => {
  assert.deepEqual(g.parseChipTime('10am to 11:30am, Standup, Work'), { startMin: 600, endMin: 690, rest: 'Standup, Work' });
  assert.equal(g.parseChipTime('9 – 10pm, Dinner').startMin, 21 * 60);
  assert.equal(g.parseChipTime('10:00 – 11:00, Reunión').endMin, 660);
  assert.equal(g.parseChipTime('10:00 a 11:00, Reunión').startMin, 600);
  assert.equal(g.parseChipTime('11:30pm – 12:30am, Late').endMin, 24 * 60 + 30);
  assert.equal(g.parseChipTime('All day, Holiday'), null);
  assert.equal(g.parseChipTime('Room 3 - 2 people'), null);
});

test('dayKind and totals', () => {
  const today = new Date(2026, 9, 14);
  assert.equal(g.dayKind(new Date(2026, 9, 17), today), 'sat');
  assert.equal(g.dayKind(today, today), 'today');
  assert.equal(g.dayKind(new Date(2026, 11, 25), today, ['2026-12-25']), 'holiday');
  const t = g.totals([{ key: 'a', startMin: 0, endMin: 90 }, { key: 'a', startMin: 0, endMin: 30 }, { key: 'b', startMin: 60, endMin: 120 }]);
  assert.deepEqual(t, { byKey: { a: 120, b: 60 }, total: 180 });
  assert.equal(g.fmtMinutes(125), '2h 05');
  assert.equal(g.fmtMinutes(45), '45 min');
});
