const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ics = require('../src/ics.js');

const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

test('parseContentLine handles params, quoted params and colons in values', () => {
  const line = 'ATTENDEE;CN="Bob, Jr.";RSVP=TRUE:mailto:bob@example.com';
  const r = ics.parseContentLine(line);
  assert.equal(r.name, 'ATTENDEE');
  assert.deepEqual(r.params, { CN: 'Bob, Jr.', RSVP: 'TRUE' });
  assert.equal(r.value, 'mailto:bob@example.com');
});

test('unfold joins continuation lines (CRLF and LF)', () => {
  assert.equal(ics.unfold('DESCRIPTION:abc\r\n def\r\n\tghi\r\nEND'), 'DESCRIPTION:abcdefghi\nEND');
});

test('parseDateTime: date, utc, tzid and floating', () => {
  assert.deepEqual(ics.parseDateTime('20260420', { VALUE: 'DATE' }), {
    year: 2026, month: 4, day: 20, hour: 0, minute: 0, second: 0, isDate: true, utc: false, tzid: null,
  });
  const utc = ics.parseDateTime('20260421T140000Z', {});
  assert.equal(utc.utc, true);
  assert.equal(utc.hour, 14);
  const tz = ics.parseDateTime('20260315T100000', { TZID: 'Europe/Madrid' });
  assert.equal(tz.tzid, 'Europe/Madrid');
  assert.equal(tz.utc, false);
  const floating = ics.parseDateTime('20260422T0900', {});
  assert.equal(floating.second, 0);
  assert.equal(floating.tzid, null);
  assert.equal(ics.parseDateTime('garbage', {}), null);
});

test('parseDuration', () => {
  assert.equal(ics.parseDuration('PT45M'), 45 * 60000);
  assert.equal(ics.parseDuration('P1DT2H30M'), 86400000 + 2 * 3600000 + 30 * 60000);
  assert.equal(ics.parseDuration('P2W'), 14 * 86400000);
  assert.equal(ics.parseDuration('-PT1H'), -3600000);
  assert.equal(ics.parseDuration('bogus'), null);
});

test('single event: all fields', () => {
  const { events } = ics.parseICS(fixture('single.ics'));
  assert.equal(events.length, 1);
  const ev = events[0];
  assert.equal(ev.uid, 'single-123@example.com');
  assert.equal(ev.summary, 'Team sync, Q1 review');
  assert.equal(
    ev.description,
    'Agenda:\n- numbers\n- hiring; budget\nSee you there, long line that is folded onto a second line.'
  );
  assert.equal(ev.location, 'Carrer de Pelai 1, Barcelona');
  assert.equal(ev.url, 'https://example.com/meet/123');
  assert.equal(ev.start.tzid, 'Europe/Madrid');
  assert.equal(ev.end.hour, 11);
  assert.equal(ev.end.minute, 30);
  assert.deepEqual(ev.attendees, [
    { email: 'ana@example.com', name: 'Ana García' },
    { email: 'bob@example.com', name: 'Bob, Jr.' },
  ]);
  assert.deepEqual(ev.organizer, { email: 'julian@example.com', name: 'Julian' });
  assert.equal(ev.transparent, false);
});

test('multi: all-day, duration, floating, rrule, nested VALARM, missing DTEND', () => {
  const parsed = ics.parseICS(fixture('multi.ics'));
  assert.equal(parsed.timezone, 'America/Argentina/Buenos_Aires');
  assert.equal(parsed.name, 'Conference 2026');
  const byUid = Object.fromEntries(parsed.events.map((e) => [e.uid, e]));
  assert.equal(parsed.events.length, 5);

  assert.equal(byUid['allday@example.com'].start.isDate, true);
  assert.equal(byUid['allday@example.com'].end.day, 22);

  const keynote = byUid['utc@example.com'];
  assert.equal(keynote.end.hour, 14);
  assert.equal(keynote.end.minute, 45);
  assert.equal(keynote.end.utc, true);

  assert.equal(byUid['floating@example.com'].transparent, true);
  assert.equal(byUid['floating@example.com'].start.tzid, null);

  const weekly = byUid['weekly@example.com'];
  assert.equal(weekly.rrule, 'FREQ=WEEKLY;BYDAY=FR;COUNT=4');
  assert.equal(weekly.description, ''); // VALARM description must not leak
  assert.equal(weekly.summary, 'Weekly retro');

  const holiday = byUid['nodtend@example.com'];
  assert.equal(holiday.end.day, 11);
  assert.equal(holiday.end.isDate, true);
});

test('outlook: VTIMEZONE with Windows TZID is kept on the event', () => {
  const parsed = ics.parseICS(fixture('outlook.ics'));
  assert.equal(parsed.events.length, 1);
  assert.equal(parsed.events[0].start.tzid, 'W. Europe Standard Time');
  assert.ok(parsed.vtimezones['W. Europe Standard Time']);
});

test('events without DTSTART are dropped, timed events without DTEND get zero duration', () => {
  const parsed = ics.parseICS(
    'BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:no start\nEND:VEVENT\nBEGIN:VEVENT\nDTSTART:20260101T100000Z\nSUMMARY:x\nEND:VEVENT\nEND:VCALENDAR'
  );
  assert.equal(parsed.events.length, 1);
  assert.deepEqual(parsed.events[0].end, parsed.events[0].start);
});
