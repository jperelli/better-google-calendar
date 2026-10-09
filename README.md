# Better Google Calendar

Chrome extension that improves Google Calendar. First feature: **drop an `.ics` file onto
calendar.google.com to add its events**.

- One event in the file: Google's own "new event" form opens, with title, dates, description,
  location, guests and recurrence already filled. Review and press **Save**.
- Several events: a modal lists them (sorted by date) with an **Open to add** button each, plus
  **Open all** to open one pre-filled form per event in new tabs.

The pre-filled form is Google's own `calendar/r/eventedit?text=…&dates=…` page (the same endpoint
"Add to Google Calendar" links use), so nothing depends on Google Calendar's internal DOM.

## Install (unpacked)

1. Clone this repo.
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked** and pick the repo
   folder.
3. Open [calendar.google.com](https://calendar.google.com) and drag an `.ics` file onto it.

## What is read from the ICS

| ICS                             | Google form field                                         |
| ------------------------------- | --------------------------------------------------------- |
| `SUMMARY`                       | Title                                                     |
| `DTSTART` / `DTEND` / `DURATION`| Dates; all-day (`VALUE=DATE`) supported                   |
| `TZID`                          | Converted to UTC (IANA, Windows/Outlook names, Mozilla prefixes, `X-LIC-LOCATION`) |
| floating times                  | Interpreted in `X-WR-TIMEZONE` if present, else in your calendar timezone |
| `DESCRIPTION` + `URL`           | Description                                               |
| `LOCATION`                      | Location                                                  |
| `RRULE`                         | Repeat                                                    |
| `ATTENDEE`                      | Guests                                                    |
| `TRANSP:TRANSPARENT`            | Show as "Free"                                            |

Not carried over (Google's URL form has no field for them): alarms, `EXDATE`, attachments,
per-attendee RSVP state.

## Development

```
npm test        # unit tests for the ICS parser and URL builder (node --test)
npm run icons   # regenerate icons/*.png
npm run e2e     # loads the extension in Chrome against a mocked calendar.google.com
npm run zip     # dist/better-google-calendar.zip for the Web Store
```

Layout:

- `manifest.json` MV3 manifest
- `src/ics.js` iCalendar parser
- `src/gcal-url.js` builds the Google Calendar `eventedit` URL
- `src/content.js` drop handling, overlay and event-list modal (shadow DOM)
- `src/background.js` opens tabs for the modal buttons
- `test/` unit tests and fixtures, `e2e/` Playwright check

## Roadmap

More Google Calendar improvements will land here; the `.ics` drop is the first one.
