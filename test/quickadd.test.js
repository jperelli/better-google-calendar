const test = require('node:test');
const assert = require('node:assert/strict');
const { parseQuickAdd, RECURRENCE_PRESETS } = require('../src/quickadd.js');
const gcal = require('../src/gcal-url.js');

// Wednesday 2026-10-14 10:00 local
const NOW = new Date(2026, 9, 14, 10, 0, 0);
const q = (text, opts) => parseQuickAdd(text, Object.assign({ now: NOW }, opts || {}));
const at = (r) => `${r.event.start.year}-${String(r.event.start.month).padStart(2, '0')}-${String(r.event.start.day).padStart(2, '0')} ${String(r.event.start.hour).padStart(2, '0')}:${String(r.event.start.minute).padStart(2, '0')}`;
const endAt = (r) => `${String(r.event.end.hour).padStart(2, '0')}:${String(r.event.end.minute).padStart(2, '0')}`;

test('title + tomorrow + time range + location', () => {
  const r = q('Lunch with Ana tomorrow 1-2pm at Bar Lobo');
  assert.equal(r.event.summary, 'Lunch with Ana');
  assert.equal(at(r), '2026-10-15 13:00');
  assert.equal(endAt(r), '14:00');
  assert.equal(r.event.location, 'Bar Lobo');
  assert.equal(r.event.start.isDate, false);
});

test('"at 5" is 17:00, "at 9" is 09:00, default duration applies', () => {
  assert.equal(at(q('Call Bob at 5')), '2026-10-14 17:00');
  assert.equal(endAt(q('Call Bob at 5')), '18:00');
  assert.equal(endAt(q('Call Bob at 5', { defaultMinutes: 30 })), '17:30');
  // 9 already passed today at 10:00 -> tomorrow
  assert.equal(at(q('Standup at 9')), '2026-10-15 09:00');
  assert.equal(at(q('Standup at 9am tomorrow')), '2026-10-15 09:00');
});

test('weekdays: bare, next, this; dates with and without year; numeric order', () => {
  assert.equal(at(q('Dentist friday 10:30')), '2026-10-16 10:30');
  assert.equal(at(q('Dentist next wednesday 10:30')), '2026-10-21 10:30');
  assert.equal(at(q('Dentist on wednesday 10:30')), '2026-10-14 10:30');
  assert.equal(at(q('Flight 14 nov 6:45am')), '2026-11-14 06:45');
  assert.equal(at(q('Flight nov 14, 2027 6:45am')), '2027-11-14 06:45');
  assert.equal(at(q('Flight 3 jan')), '2027-01-03 00:00'); // past this year -> next year
  assert.equal(at(q('Review 14/11 17h')), '2026-11-14 17:00');
  assert.equal(at(q('Review 11/14 5pm', { dateOrder: 'mdy' })), '2026-11-14 17:00');
  assert.equal(at(q('Review 2026-12-01 at 8am')), '2026-12-01 08:00');
  assert.equal(q('Flight 3 jan').event.start.isDate, true);
});

test('all-day when no time; duration keywords; explicit all day', () => {
  const r = q('Holiday tomorrow');
  assert.equal(r.event.start.isDate, true);
  assert.equal(at(r), '2026-10-15 00:00');
  assert.equal(r.event.end.day, 16);
  assert.equal(endAt(q('Gym at 7am for 45 min')), '07:45');
  assert.equal(endAt(q('Workshop at 2pm for 2 hours')), '16:00');
  assert.equal(endAt(q('Workshop at 2pm (90 min)')), '15:30');
  assert.equal(q('Offsite friday all day 9am').event.start.isDate, true);
});

test('attendees are pulled out of the title', () => {
  const r = q('Design review with ana@example.com and bob@example.com thursday 15:00');
  assert.deepEqual(r.event.attendees.map((a) => a.email), ['ana@example.com', 'bob@example.com']);
  assert.equal(r.event.summary, 'Design review');
  assert.equal(at(r), '2026-10-15 15:00');
});

test('recurrence: every weekday, every monday and wednesday, last friday, last day of month, every 2 weeks', () => {
  let r = q('Standup every weekday at 9:15');
  assert.equal(r.event.rrule, 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
  assert.equal(at(r), '2026-10-15 09:15'); // 9:15 today already passed

  r = q('Gym every monday and wednesday at 7am');
  assert.equal(r.event.rrule, 'FREQ=WEEKLY;BYDAY=MO,WE');
  assert.equal(at(r), '2026-10-19 07:00'); // today is Wed but 7am already passed -> next listed day, Monday
  assert.equal(r.event.summary, 'Gym');

  r = q('Invoices every last friday of the month at 4pm');
  assert.equal(r.event.rrule, 'FREQ=MONTHLY;BYDAY=-1FR');
  assert.equal(at(r), '2026-10-30 16:00');

  r = q('Rent every last day of the month');
  assert.equal(r.event.rrule, 'FREQ=MONTHLY;BYMONTHDAY=-1');
  assert.equal(at(r), '2026-10-31 00:00');
  assert.equal(r.event.summary, 'Rent');

  r = q('Retro every 2 weeks friday 11am');
  assert.equal(r.event.rrule, 'FREQ=WEEKLY;INTERVAL=2');
  assert.equal(at(r), '2026-10-16 11:00');

  assert.equal(q('Backup daily at 3am').event.rrule, 'FREQ=DAILY');
  assert.equal(q('Report monthly').event.rrule, 'FREQ=MONTHLY');
});

test('spanish', () => {
  let r = q('Almuerzo con Ana mañana a las 13 en Bar Lobo');
  assert.equal(r.event.summary, 'Almuerzo con Ana');
  assert.equal(at(r), '2026-10-15 13:00');
  assert.equal(r.event.location, 'Bar Lobo');

  r = q('Dentista el viernes a las 10:30');
  assert.equal(at(r), '2026-10-16 10:30');
  assert.equal(r.event.summary, 'Dentista');

  r = q('Gimnasio todos los lunes y miércoles a las 7 de la mañana');
  assert.equal(r.event.rrule, 'FREQ=WEEKLY;BYDAY=MO,WE');
  assert.equal(r.event.start.hour, 7);

  r = q('Alquiler cada último día del mes');
  assert.equal(r.event.rrule, 'FREQ=MONTHLY;BYMONTHDAY=-1');

  r = q('Reunión 14 de noviembre de 17 a 18:30');
  assert.equal(at(r), '2026-11-14 17:00');
  assert.equal(endAt(r), '18:30');

  r = q('Cena pasado mañana por la noche');
  assert.equal(at(r), '2026-10-16 19:00');
  assert.equal(r.event.summary, 'Cena');
});

test('period hints and tonight', () => {
  assert.equal(at(q('Movie tonight at 8')), '2026-10-14 20:00');
  assert.equal(at(q('Run tomorrow morning')), '2026-10-15 09:00');
  assert.equal(at(q('Call tomorrow afternoon at 3')), '2026-10-15 15:00');
  assert.equal(at(q('Lunch tomorrow at noon')), '2026-10-15 12:00');
});

test('title keeps its case and does not swallow "in" of a phrase', () => {
  assert.equal(q('Check in with the team at 4pm').event.summary, 'Check in with the team');
  assert.equal(q('Check in with the team at 4pm').event.location, '');
  assert.equal(q('Coffee in Barcelona tomorrow 9am').event.location, 'Barcelona');
  assert.equal(q('Coffee in Barcelona tomorrow 9am').event.summary, 'Coffee');
  assert.equal(q('   '), null);
});

test('result plugs into buildEventEditUrl as a floating local time', () => {
  const r = q('Lunch tomorrow 1-2pm at Bar Lobo every friday');
  const url = gcal.buildEventEditUrl(r.event, r.ctx, { base: 'https://calendar.google.com/calendar/u/0/r/eventedit' });
  const p = new URL(url).searchParams;
  assert.equal(p.get('text'), 'Lunch');
  assert.equal(p.get('dates'), '20261015T130000/20261015T140000'); // 'tomorrow' wins over the weekday list; no Z = floating
  assert.equal(p.get('location'), 'Bar Lobo');
  assert.equal(p.get('recur'), 'RRULE:FREQ=WEEKLY;BYDAY=FR');
});

test('recurrence presets produce valid RRULEs for a given start', () => {
  const d = new Date(2026, 10, 10); // Tue 10 Nov 2026 -> 2nd Tuesday
  const byId = Object.fromEntries(RECURRENCE_PRESETS.map((p) => [p.id, p.rrule(d)]));
  assert.equal(byId.none, null);
  assert.equal(byId.weekly, 'FREQ=WEEKLY;BYDAY=TU');
  assert.equal(byId['monthly-nth'], 'FREQ=MONTHLY;BYDAY=2TU');
  assert.equal(byId['monthly-last'], 'FREQ=MONTHLY;BYDAY=-1TU');
  assert.equal(byId['monthly-last-day'], 'FREQ=MONTHLY;BYMONTHDAY=-1');
  assert.equal(byId.quarterly, 'FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=10');
});
