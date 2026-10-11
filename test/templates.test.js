const test = require('node:test');
const assert = require('node:assert/strict');
const { parseQuickAdd } = require('../src/quickadd.js');
const { templateFromResult, applyTemplate } = require('../src/templates.js');

const NOW = new Date(2026, 9, 14, 10, 0, 0); // Wed
const q = (t) => parseQuickAdd(t, { now: NOW });
const at = (r) => `${r.event.start.day} ${String(r.event.start.hour).padStart(2, '0')}:${String(r.event.start.minute).padStart(2, '0')}-${String(r.event.end.hour).padStart(2, '0')}:${String(r.event.end.minute).padStart(2, '0')}`;

test('templateFromResult captures title, time, length, place, guests, repeat', () => {
  const tpl = templateFromResult(q('Shift 2 at 14:00 for 8 hours at Plant B with boss@x.com every weekday'), 'Shift 2');
  assert.equal(tpl.name, 'Shift 2');
  assert.equal(tpl.title, 'Shift 2');
  assert.equal(tpl.minutes, 480);
  assert.equal(tpl.startHour, 14);
  assert.equal(tpl.location, 'Plant B');
  assert.deepEqual(tpl.guests, ['boss@x.com']);
  assert.equal(tpl.rrule, 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
  assert.equal(tpl.allDay, false);
  assert.ok(tpl.id);
});

test('applyTemplate: typed date only -> template time and length on that day', () => {
  const tpl = templateFromResult(q('Shift 2 at 14:00 for 8 hours at Plant B'), 'Shift 2');
  const r = applyTemplate(q('friday'), tpl);
  assert.equal(r.event.summary, 'Shift 2');
  assert.equal(at(r), '16 14:00-22:00');
  assert.equal(r.event.location, 'Plant B');
  assert.equal(r.meta.allDay, false);
});

test('applyTemplate: typed time wins, template length is used, typed title is appended', () => {
  const tpl = templateFromResult(q('Dentist at 10 for 45 min at Clinic'), 'Dentist');
  const r = applyTemplate(q('tomorrow at 16:30 checkup'), tpl);
  assert.equal(r.event.summary, 'Dentist Checkup');
  assert.equal(at(r), '15 16:30-17:15');
  // typed range beats the template length
  const r2 = applyTemplate(q('tomorrow 9-11'), tpl);
  assert.equal(at(r2), '15 09:00-11:00');
  // typed place beats the template place
  assert.equal(applyTemplate(q('tomorrow at 9 at Home'), tpl).event.location, 'Home');
});

test('applyTemplate: all-day template on a typed day stays all-day; rrule from template unless typed', () => {
  const tpl = templateFromResult(q('Holiday every year'), 'Holiday');
  assert.equal(tpl.allDay, true);
  const r = applyTemplate(q('25 dec'), tpl);
  assert.equal(r.event.start.isDate, true);
  assert.equal(r.event.rrule, 'FREQ=YEARLY');
  assert.equal(applyTemplate(q('25 dec every 2 years'), tpl).event.rrule, 'FREQ=YEARLY;INTERVAL=2');
});
