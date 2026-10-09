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

Drop .ics files onto Google Calendar and add their events through Google's own pre-filled "new event" form.

## Description

Got an .ics invitation by email or downloaded a schedule from a website? Drop the file straight onto
Google Calendar.

• One event in the file: Google Calendar's own "new event" form opens with title, date and time,
  description, location, guests and repeat rule already filled in. Check it and press Save.
• Several events: a list shows every event in the file, sorted by date, with an "Open to add" button
  for each one and an "Open all" button to open them all at once.

Works with files from Outlook, Apple Calendar, Eventbrite, Meetup, airlines, universities and any
other iCalendar (.ics) source. Timezones (including Outlook's Windows timezone names), all-day
events, durations and recurring events are handled.

Privacy: the file is read locally in your browser and nothing is stored or sent anywhere. The
extension only runs on calendar.google.com and only reacts when you drop a file.

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
