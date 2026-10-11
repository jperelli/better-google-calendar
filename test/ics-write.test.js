const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ics = require('../src/ics.js');
const { buildICS, eventsToText, eventsToCsv } = require('../src/ics-write.js');
const { parseQuickAdd } = require('../src/quickadd.js');

const NOW = new Date(Date.UTC(2026, 9, 14, 10, 0, 0));
const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

test('round trip: parse -> build -> parse keeps the fields', () => {
  const parsed = ics.parseICS(fixture('multi.ics'));
  const text = buildICS(parsed.events, { now: NOW, timezone: parsed.timezone });
  assert.match(text, /^BEGIN:VCALENDAR\r\n/);
  const again = ics.parseICS(text);
  assert.equal(again.events.length, parsed.events.length);
  for (let i = 0; i < parsed.events.length; i++) {
    const a = parsed.events[i];
    const b = again.events[i];
    assert.equal(b.summary, a.summary);
    assert.deepEqual(b.start, a.start);
    assert.deepEqual(b.end, a.end);
    assert.equal(b.location, a.location);
    assert.equal(b.description, a.description);
    assert.equal(b.rrule, a.rrule);
    assert.deepEqual(b.attendees.map((x) => x.email), a.attendees.map((x) => x.email));
  }
});

test('escaping and folding', () => {
  const ev = parseQuickAdd('Plan; review, budget tomorrow 9am at Room 1', { now: new Date(2026, 9, 14) }).event;
  ev.location = 'Room 1, floor 2';
  ev.description = 'line1\nline2 ' + 'x'.repeat(120);
  const text = buildICS([ev], { now: NOW });
  assert.match(text, /SUMMARY:Plan\\; review\\, budget/);
  assert.match(text, /LOCATION:Room 1\\, floor 2/);
  assert.match(text, /DESCRIPTION:line1\\nline2/);
  for (const line of text.split('\r\n')) assert.ok(line.length <= 71, `line too long: ${line.length}`);
  const back = ics.parseICS(text).events[0];
  assert.equal(back.summary, 'Plan; review, budget');
  assert.equal(back.description, ev.description);
  assert.equal(back.start.hour, 9);
});

test('text and csv renderings group by day', () => {
  const a = parseQuickAdd('Standup tomorrow 9-9:15', { now: new Date(2026, 9, 14) }).event;
  const b = parseQuickAdd('Lunch tomorrow 13:00 at Bar', { now: new Date(2026, 9, 14) }).event;
  b.calendar = 'Personal';
  const txt = eventsToText([b, a], { locale: 'en-US' });
  assert.match(txt, /^Thu, Oct 15\n  9:00 AM–9:15 AM  Standup\n  1:00 PM–2:00 PM  Lunch \(Bar, Personal\)\n$/);
  const md = eventsToText([a], { locale: 'en-US', markdown: true });
  assert.match(md, /^## Thu, Oct 15\n- 9:00 AM–9:15 AM  Standup\n$/);
  const csv = eventsToCsv([a]);
  assert.equal(csv.split('\r\n')[1], '"2026-10-15 09:00","2026-10-15 09:15","Standup","","","15"');
});
