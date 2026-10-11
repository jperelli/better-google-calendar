const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCalendarUrl, dateUrl, buildCommands } = require('../src/palette.js');

const HREF = 'https://calendar.google.com/calendar/u/1/r/week/2026/11/9';
const NOW = new Date(2026, 9, 14);

test('parseCalendarUrl: account, view and date', () => {
  const c = parseCalendarUrl(HREF);
  assert.equal(c.base, 'https://calendar.google.com/calendar/u/1/r');
  assert.equal(c.view, 'week');
  assert.equal(c.date.getDate(), 9);
  assert.equal(parseCalendarUrl('https://calendar.google.com/calendar/r/month').view, 'month');
  assert.equal(parseCalendarUrl('https://calendar.google.com/calendar/r').date, null);
  assert.equal(parseCalendarUrl('https://calendar.google.com/calendar/u/0/r/settings').view, 'week');
});

test('dateUrl keeps the account and view', () => {
  const c = parseCalendarUrl(HREF);
  assert.equal(dateUrl(c, 'month', new Date(2027, 0, 3)), 'https://calendar.google.com/calendar/u/1/r/month/2027/1/3');
  assert.equal(dateUrl(c, null, null), 'https://calendar.google.com/calendar/u/1/r/week');
});

test('buildCommands: empty query lists navigation first, settings filter by plain words', () => {
  const all = buildCommands(HREF, '', { now: NOW, limit: 100 });
  assert.equal(all[0].label, 'Today');
  assert.equal(all.find((c) => c.id === 'nav:next').url, 'https://calendar.google.com/calendar/u/1/r/week/2026/11/16');
  assert.equal(all.find((c) => c.id === 'nav:prev').url, 'https://calendar.google.com/calendar/u/1/r/week/2026/11/2');

  const declined = buildCommands(HREF, 'declined', { now: NOW });
  assert.equal(declined[0].label, 'Show declined events');
  assert.equal(declined[0].url, 'https://calendar.google.com/calendar/u/1/r/settings');

  const meet = buildCommands(HREF, 'meet', { now: NOW });
  assert.match(meet[0].label, /Google Meet/);

  const es = buildCommands(HREF, 'lunes', { now: NOW });
  assert.match(es[0].label, /Week starts on/);

  const trash = buildCommands(HREF, 'deleted', { now: NOW });
  assert.equal(trash[0].url, 'https://calendar.google.com/calendar/u/1/r/trash');
  assert.equal(buildCommands(HREF, 'zzzz', { now: NOW }).length, 0);
});

test('extra commands rank with the rest', () => {
  const extra = [{ id: 'x', group: 'Extension', label: 'Hide the Quick add button', keywords: ['fab'] }];
  assert.equal(buildCommands(HREF, 'quick add', { extra })[0].id, 'x');
});
