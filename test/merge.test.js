const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../src/merge.js');

const d = new Date(2026, 3, 21);
const chip = (title, start, end, color, text) => ({ title, time: start == null ? null : { startMin: start, endMin: end }, date: d, color, text: text || `${title}` });

test('groupDuplicates groups same title + same start/end, keeps document order', () => {
  const a = chip('Team sync', 600, 660, 'rgb(3, 155, 229)');
  const b = chip('Lunch', 720, 780, 'rgb(230, 124, 115)');
  const c = chip('team  sync', 600, 660, 'rgb(51, 182, 121)');
  const e = chip('Team sync', 600, 720, 'rgb(0, 0, 0)'); // different end
  const groups = M.groupDuplicates([a, b, c, e]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].survivor, a);
  assert.deepEqual(groups[0].hidden, [c]);
  assert.deepEqual(groups[0].colors, ['rgb(3, 155, 229)', 'rgb(51, 182, 121)']);
});

test('groupDuplicates separates days and all-day events', () => {
  const a = chip('Offsite', null, null, 'red');
  const b = chip('Offsite', null, null, 'blue');
  const c = Object.assign(chip('Offsite', null, null, 'green'), { date: new Date(2026, 3, 22) });
  const groups = M.groupDuplicates([a, b, c]);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].chips, [a, b]);
  assert.equal(M.groupDuplicates([chip('X', null, null, 'red'), chip('X', 0, 60, 'blue')]).length, 0);
});

test('wildcard title merges by time only, titled chip survives', () => {
  const busy = chip('Busy', 600, 660, 'purple');
  const real = chip('Team sync', 600, 660, 'blue');
  const groups = M.groupDuplicates([busy, real], { wildcard: 'Busy' });
  assert.equal(groups.length, 1);
  assert.equal(groups[0].survivor, real);
  assert.deepEqual(groups[0].hidden, [busy]);
  // two wildcards alone also merge; disabled wildcard keeps them apart from titled chips
  assert.equal(M.groupDuplicates([busy, chip('busy', 600, 660, 'pink')]).length, 1);
  assert.equal(M.groupDuplicates([busy, real], { wildcard: '' }).length, 0);
  assert.equal(M.groupDuplicates([chip('Ocupado', 600, 660, 'x'), real], { wildcard: 'ocupado' })[0].survivor, real);
});

test('chips without a date are ignored', () => {
  assert.equal(M.groupDuplicates([{ title: 'A', time: null, date: null }, { title: 'A', time: null, date: null }]).length, 0);
});

test('stripeGradient builds one band per distinct colour', () => {
  assert.equal(M.stripeGradient(['red']), 'red');
  assert.equal(M.stripeGradient(['red', 'red']), 'red');
  assert.equal(M.stripeGradient([]), '');
  assert.equal(M.stripeGradient(['red', 'blue']), 'repeating-linear-gradient(135deg, red 0px 8px, blue 8px 16px)');
  assert.equal(M.stripeGradient(['a', 'b', 'c'], 6), 'repeating-linear-gradient(135deg, a 0px 6px, b 6px 12px, c 12px 18px)');
});

test('calendarOf reads the calendar name after the title in the accessible text', () => {
  assert.equal(M.calendarOf('10am to 11am, Team sync, Work, Accepted', 'Team sync'), 'Work');
  assert.equal(M.calendarOf('10am to 11am, Team sync', 'Team sync'), '');
  assert.equal(M.calendarOf('All day, Offsite, Personal', 'offsite'), 'Personal');
});
