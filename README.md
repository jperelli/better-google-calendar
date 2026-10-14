# Better Google Calendar

Chrome extension that improves Google Calendar without asking for access to your Google account:
everything is done in the page or through Google's own URLs (no OAuth, no server). Features (see
[docs/market-research.md](docs/market-research.md) for why these):

## Drop an `.ics` file onto calendar.google.com to add its events

- One event in the file: Google's own "new event" form opens, with title, dates, description,
  location, guests and recurrence already filled. Review and press **Save**.
- Several events: a modal lists them (sorted by date) with an **Open to add** button each, plus
  **Open all** to open one pre-filled form per event in new tabs.

The pre-filled form is Google's own `calendar/r/eventedit?text=…&dates=…` page (the same endpoint
"Add to Google Calendar" links use), so nothing depends on Google Calendar's internal DOM.
Pasting iCalendar text (Ctrl+V anywhere on the calendar, e.g. an `.ics` opened in a text editor or
a `BEGIN:VCALENDAR` snippet from an e-mail) does the same as dropping a file.

## Quick Add in plain words

Press **q** (or **Alt+Shift+Q**, or the blue **Quick add** button bottom-right) and type something like
`Lunch with ana@example.com tomorrow 1-2pm at Bar Lobo every friday`. A live preview shows what was
understood; **Enter** opens Google's pre-filled form (Shift+Enter in a new tab). English and Spanish:

- dates: `today`, `tomorrow`, `next friday`, `14 nov`, `nov 14 2027`, `14/11`, `2026-11-14`, `in 3 days`,
  `mañana`, `el viernes`, `14 de noviembre`
- times: `at 5` (= 17:00), `9am`, `17:30`, `17h`, `1-2pm`, `de 17 a 18:30`, `tonight`, `por la tarde`,
  `for 45 min`, `(90 min)`; no time = all-day event
- place: `at Bar Lobo`, `en Bar Lobo`, `in Barcelona`; guests: any e-mail address
- repeat: `every weekday`, `every monday and wednesday`, `every 2 weeks`, `every last friday`,
  `every last day of the month`, `daily`, `cada mes`, `todos los lunes`; plus a **Repeat** menu with the
  rules Google's dialog cannot express (last day of month, last weekday, nth weekday, quarterly).

Select text on any web page, right-click, **Add "…" to Google Calendar**: the same parser fills the form.

## Command palette and settings finder

**Ctrl+K** (Cmd+K on Mac, or Alt+Shift+P) opens a palette. Type plain words to find Google's buried
settings: `declined`, `invitations`, `meet`, `week starts`, `time zone`, `agenda email`, `trash`,
`import`; the matching Google settings page opens and a toast tells you which section to look in.
Also: views (`month`, `agenda`, `4 days`), `today` / `next` / `previous`, `search budget`, and any date
in plain words (`14 nov`, `next friday`, `en 3 días`) to jump there in the current view.

## Settings modal, toolbar menu and About

- One **Settings** modal (shadow DOM, Esc closes) with every option of every feature, grouped by feature: quick add,
  templates, look/declutter toggles, grid colours and working hours, dimming/totals/now bar, export and import notes,
  calendar presets and duplicate merge. Changes apply immediately (same `chrome.storage.sync` store as the palette toggles).
- Open it from the command palette (Ctrl+K, "Settings"), the gear in the palette footer or the hours-total box, the
  extension icon menu, or by loading `https://calendar.google.com/calendar/r#bgc-settings`.
- The extension icon opens a small menu: **Settings** (focuses an open Calendar tab and opens the modal there, or opens
  Calendar with the hash) and **About** (version from the manifest, author, GitHub, and the post about the extension;
  `POST_URL` lives in `src/about.js`). About is also a modal in the page (palette: "About").

## Calendar-selection presets

- Save the calendars ticked in the left sidebar ("My calendars" + "Other calendars") under a name, then switch sets in
  one click: the **Presets** button next to "My calendars", the command palette ("Preset: Focus", "Only this calendar:
  Team", "Save the calendars ticked now as a preset") or the Settings modal (apply, update, rename, delete).
- Works by clicking the sidebar checkboxes; if the sidebar or a group is collapsed it is expanded for a moment and put
  back. Presets are stored in `chrome.storage.sync` per Google account (`/u/N/` in the URL), keyed by calendar name, so
  they follow you across computers. If the sidebar cannot be found a toast says so instead of failing silently.

## Grid features (read from what is on screen, nothing leaves the browser)

These read Google's week/day grid (day columns, hour gutter, event chips) through roles, data
attributes and text, never class names. If Google changes the layout they switch themselves off and
show a small "paused, tell us" notice instead of breaking the page. Toggle each one from the palette.

- **Day colours and working-hours shading**: Saturdays, Sundays, holidays and today get a tint;
  hours outside your working hours (default 9–18, Mon–Fri; palette: "Set working hours") are shaded.
- **Start the day at your first working hour**: the grid scrolls past the night hours when a view opens.
- **Dim past events** and **fade declined events** (opacity, nothing is hidden).
- **Hours total per colour**: a small panel sums the timed events in view (what Time Insights does for
  Workspace users) with a percentage per colour.
- **Now bar**: current event with minutes left, next event with a countdown, and a **Join** link when
  the event has a Meet/Zoom/Teams URL.
- **Share my free times**: lists the free gaps of the visible week inside your working hours as
  `Tue 25 Mar: 09:00–11:00, 14:00–16:00` text, ready to paste in an e-mail.
- **Export**: copy the visible events as text, Markdown or CSV (timesheets), download them as `.ics`,
  and an **⤓ .ics** button in Google's event details popover to export a single event.

## Declutter, print and density

Palette toggles: readable printing (titles wrap, dark text, no sidebars), compact density, hide event
illustrations, hide "Join with Google Meet" buttons, hide upgrade promotions, higher-contrast text.

## Event templates

In the Quick Add box, type an event once (`Shift 2 at 14:00 for 8 hours at Plant B`) and press
**+ Save as template**. From then on click the **Shift 2** chip, type just the day (`next friday`,
`14 nov`, or nothing for today) and press Enter: title, start time, length, place, guests and repeat
rule come from the template; anything you type on top (a different time, place or extra words) wins.
Templates are kept in Chrome's extension storage and sync with your Chrome profile. Hover a chip and
click **×** to delete it.

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

## Publishing to the Chrome Web Store

Everything needed for the listing is in `store/`: `listing.md` (texts, permission justifications,
data disclosures), `screenshots/` (1280x800 screenshots and the 440x280 promo tile, regenerated with
`node store/screenshots.js`) and the privacy policy in `PRIVACY.md`. Build the package with
`npm run zip` and upload `dist/better-google-calendar.zip` in the developer console.
