const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ics = require('../src/ics.js');
const gcal = require('../src/gcal-url.js');

const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
const BASE = 'https://calendar.google.com/calendar/u/0/r/eventedit';
const params = (url) => new URL(url).searchParams;

test('eventEditBase keeps the account path of the current calendar URL', () => {
  assert.equal(gcal.eventEditBase('https://calendar.google.com/calendar/u/2/r/week'), BASE.replace('u/0', 'u/2'));
  assert.equal(gcal.eventEditBase('https://calendar.google.com/calendar/b/1/r'), BASE.replace('u/0', 'b/1'));
  assert.equal(gcal.eventEditBase('https://calendar.google.com/calendar/r?authuser=3'), BASE.replace('u/0', 'u/3'));
  assert.equal(gcal.eventEditBase('https://calendar.google.com/'), 'https://calendar.google.com/calendar/r/eventedit');
  assert.equal(gcal.eventEditBase('not a url'), 'https://calendar.google.com/calendar/r/eventedit');
});

test('resolveTimeZone: IANA, Windows names, Mozilla prefixes, X-LIC-LOCATION, unknown', () => {
  assert.equal(gcal.resolveTimeZone('Europe/Madrid'), 'Europe/Madrid');
  assert.equal(gcal.resolveTimeZone('W. Europe Standard Time'), 'Europe/Berlin');
  assert.equal(gcal.resolveTimeZone('/mozilla.org/20050126_1/Europe/Berlin'), 'Europe/Berlin');
  assert.equal(gcal.resolveTimeZone('Custom', { Custom: { iana: 'Asia/Tokyo' } }), 'Asia/Tokyo');
  assert.equal(gcal.resolveTimeZone('Nowhere/Zone'), null);
  assert.equal(gcal.resolveTimeZone(null), null);
});

test('zonedToUtcMs handles DST on both sides', () => {
  // 2026-03-15 10:00 Madrid is CET (UTC+1) -> 09:00Z
  const winter = { year: 2026, month: 3, day: 15, hour: 10, minute: 0, second: 0 };
  assert.equal(new Date(gcal.zonedToUtcMs(winter, 'Europe/Madrid')).toISOString(), '2026-03-15T09:00:00.000Z');
  // 2026-07-01 10:00 Madrid is CEST (UTC+2) -> 08:00Z
  const summer = { year: 2026, month: 7, day: 1, hour: 10, minute: 0, second: 0 };
  assert.equal(new Date(gcal.zonedToUtcMs(summer, 'Europe/Madrid')).toISOString(), '2026-07-01T08:00:00.000Z');
  // Buenos Aires has no DST (UTC-3)
  const ba = { year: 2026, month: 4, day: 22, hour: 9, minute: 0, second: 0 };
  assert.equal(new Date(gcal.zonedToUtcMs(ba, 'America/Argentina/Buenos_Aires')).toISOString(), '2026-04-22T12:00:00.000Z');
});

test('single event URL carries every field', () => {
  const parsed = ics.parseICS(fixture('single.ics'));
  const url = gcal.buildEventEditUrl(parsed.events[0], parsed, { base: BASE });
  assert.ok(url.startsWith(BASE + '?'));
  const p = params(url);
  assert.equal(p.get('text'), 'Team sync, Q1 review');
  assert.equal(p.get('dates'), '20260315T090000Z/20260315T103000Z');
  assert.equal(p.get('location'), 'Carrer de Pelai 1, Barcelona');
  assert.equal(
    p.get('details'),
    'Agenda:\n- numbers\n- hiring; budget\nSee you there, long line that is folded onto a second line.\n\nhttps://example.com/meet/123'
  );
  assert.equal(p.get('add'), 'ana@example.com,bob@example.com');
  assert.equal(p.get('recur'), null);
  assert.equal(p.get('crm'), null);
});

test('multi event URLs: all-day, UTC+duration, floating w/ X-WR-TIMEZONE, recurrence', () => {
  const parsed = ics.parseICS(fixture('multi.ics'));
  const byUid = Object.fromEntries(
    parsed.events.map((e) => [e.uid, params(gcal.buildEventEditUrl(e, parsed, { base: BASE }))])
  );
  assert.equal(byUid['allday@example.com'].get('dates'), '20260420/20260422');
  assert.equal(byUid['utc@example.com'].get('dates'), '20260421T140000Z/20260421T144500Z');
  assert.equal(byUid['utc@example.com'].get('location'), 'Main hall');
  // floating 09:00 in Buenos Aires (UTC-3) -> 12:00Z
  assert.equal(byUid['floating@example.com'].get('dates'), '20260422T120000Z/20260422T130000Z');
  assert.equal(byUid['floating@example.com'].get('crm'), 'AVAILABLE');
  assert.equal(byUid['weekly@example.com'].get('recur'), 'RRULE:FREQ=WEEKLY;BYDAY=FR;COUNT=4');
  assert.equal(byUid['nodtend@example.com'].get('dates'), '20260510/20260511');
});

test('floating time without any calendar timezone stays unqualified', () => {
  const parsed = ics.parseICS(
    'BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART:20260422T090000\nDTEND:20260422T100000\nSUMMARY:Floating\nEND:VEVENT\nEND:VCALENDAR'
  );
  const p = params(gcal.buildEventEditUrl(parsed.events[0], parsed, { base: BASE }));
  assert.equal(p.get('dates'), '20260422T090000/20260422T100000');
  assert.equal(p.get('details'), null);
});

test('outlook Windows timezone converts to UTC (CET in November)', () => {
  const parsed = ics.parseICS(fixture('outlook.ics'));
  const p = params(gcal.buildEventEditUrl(parsed.events[0], parsed, { base: BASE }));
  assert.equal(p.get('dates'), '20261105T130000Z/20261105T140000Z');
});

test('missing summary and long details are handled', () => {
  const ev = {
    summary: '',
    description: 'x'.repeat(9000),
    location: '',
    url: '',
    start: { year: 2026, month: 1, day: 1, hour: 0, minute: 0, second: 0, isDate: true, utc: false, tzid: null },
    end: { year: 2026, month: 1, day: 2, hour: 0, minute: 0, second: 0, isDate: true, utc: false, tzid: null },
    attendees: [],
    rrule: null,
    transparent: false,
  };
  const p = params(gcal.buildEventEditUrl(ev, {}, { base: BASE }));
  assert.equal(p.get('text'), '(No title)');
  assert.equal(p.get('details').length, 7000);
});
