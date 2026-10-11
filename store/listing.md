# Chrome Web Store listing

Dev console: https://chrome.google.com/webstore/devconsole
Package: `npm run zip` -> `dist/better-google-calendar.zip`
Screenshots (1280x800): `store/screenshots/1-event-list.png`, `store/screenshots/2-drop-overlay.png`
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
More Google Calendar improvements are planned; this is the first one.

## Single purpose description

Add events from dropped .ics files to Google Calendar by opening Google Calendar's pre-filled
"new event" form.

## Permission justifications

Host permission `https://calendar.google.com/*`: the content script must run on Google Calendar to
receive the dropped .ics file and display the list of events found in it. No calendar data is read.

Remote code: No, this extension does not use remote code.

## Data usage disclosures

- Does not collect or use any user data (tick none of the data types).
- Certifications: does not sell data, does not use data for unrelated purposes, does not use data
  for creditworthiness.

## Distribution

Public, all regions, free.
