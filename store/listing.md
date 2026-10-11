# Chrome Web Store listing

Dev console: https://chrome.google.com/webstore/devconsole
Package: `npm run zip` -> `dist/better-google-calendar.zip`
Screenshots (1280x800, real calendar, v1.0.0): `store/screenshots/1-quick-add.png`, `2-popover-ics.png`,
`3-grid-now-bar.png`, `4-palette.png`, `5-free-times.png`, `6-templates.png`, `7-ics-drop.png`, `8-palette-export.png`, `9-palette-date.png`, `10-dim-past.png` (store takes max 5, pick)
Small promo tile (440x280): `store/screenshots/promo-tile-440x280.png`
Store icon (128x128): `icons/icon128.png`
Privacy policy URL: https://github.com/jperelli/better-google-calendar/blob/main/PRIVACY.md
Homepage URL: https://github.com/jperelli/better-google-calendar
Category: Productivity > Workflow & Planning
Language: English

## Title (max 45 chars)

Better Google Calendar

## Summary (max 132 chars)

Quick-add events in plain words, templates, free-times text, hour totals, shading, dimming, .ics drop/paste. No account access.

## Description

Better Google Calendar adds the small things people keep asking Google for, without ever asking for
access to your Google account: everything works inside the page or through Google's own URLs.

• Quick add in plain words: press q and type "Lunch with ana@x.com tomorrow 1-2pm at Bar Lobo every
  friday" (English and Spanish). Google's own "new event" form opens pre-filled. Repeat rules Google's
  dialog cannot express (last day of month, last Friday, 2nd Tuesday, quarterly) are one click away.
• Right-click any selected text on any page: "Add … to Google Calendar".
• Event templates: save "Shift 2 at 14:00 for 8 hours at Plant B" once, then click the chip and type a day.
• Drop or paste .ics files: one event opens the form, several show a list with "Open to add".
• Command palette (Ctrl+K): find buried settings by plain words ("declined", "invitations", "meet",
  "week starts"), jump to any date ("14 nov", "next friday"), switch views, search.
• Working-hours shading, weekend/holiday/today colours, start the day at your first working hour.
• Dim past events, fade declined ones.
• Hours total per colour for the visible week (time tracking without a separate app).
• Now bar: time left in the current meeting, countdown to the next one, one-click Join.
• Share my free times: the free gaps of the visible week as copy-paste text, no booking link needed.
• Export: copy the visible events as text/Markdown/CSV, download them as .ics, export one event from
  its details popover.
• Declutter and print: readable printing, compact density, hide illustrations, Meet buttons and promos.

Privacy: no server, no analytics, no Google account access. Features that read your events only look
at what is already drawn on your screen, inside your browser.

Better Google Calendar is open source: https://github.com/jperelli/better-google-calendar
Missing something? Open an issue there.

## Single purpose description

Improve the Google Calendar web app: add events faster (plain-words quick add, templates, dropped or
pasted .ics files) by opening Google Calendar's own pre-filled "new event" form, and add view helpers
(working-hours shading, dimming, hour totals, now bar, free-times text, export, declutter) on top of the
calendar page.

## Permission justifications

Host permission `https://calendar.google.com/*`: the content script must run on Google Calendar to show
the quick-add box, receive dropped .ics files, shade the grid and read the events already drawn on the
page for totals, now bar, free times and export. Nothing leaves the browser.

`storage`: saves the user's settings (which features are on, working hours) and their event templates in
chrome.storage.sync.

`contextMenus`: adds the "Add … to Google Calendar" item for selected text on any page; the selected
text is only used to build the Google Calendar "new event" URL.

Remote code: No, this extension does not use remote code.

## Data usage disclosures

- Does not collect or use any user data (tick none of the data types).
- Certifications: does not sell data, does not use data for unrelated purposes, does not use data
  for creditworthiness.

## Distribution

Public, all regions, free.
