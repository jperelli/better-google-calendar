# Privacy Policy — Better Google Calendar

_Last updated: 2026-10-09_

Better Google Calendar is a browser extension that lets you drop `.ics` calendar files onto
calendar.google.com and open Google Calendar's "new event" form pre-filled with the file's contents.

## Data we collect

None. The extension has no server, no analytics and no tracking.

## How your data is processed

- The `.ics` files you drop are read **locally in your browser**, only at the moment you drop them,
  and only on calendar.google.com.
- The parsed event fields (title, dates, description, location, guests, recurrence) are placed in a
  Google Calendar URL (`https://calendar.google.com/calendar/r/eventedit?...`) that is opened in your
  own browser. From that point on the data is handled by Google Calendar under
  [Google's privacy policy](https://policies.google.com/privacy).
- Nothing is stored by the extension: no file contents, no event data, no history, no identifiers.
- Nothing is transmitted to the extension developer or to any third party.

## What the extension reads on calendar.google.com

Some features (day colours, dimming, totals, Now bar, free times, export) read the event chips that
are already rendered on your screen: their title, time and colour. This happens inside your browser
tab only; nothing is stored beyond the current page view and nothing is sent anywhere. Copy and
download actions write to your clipboard or a local file only when you click them.

## Permissions

- **Host access to `https://calendar.google.com/*`**: required to detect files dropped on Google
  Calendar, show the event list and the Quick Add box there. The extension does not read your
  calendar data from Google's servers and never asks for access to your Google account.
- **`storage`**: keeps your preferences (for example the default event length) in Chrome's extension
  storage, synced with your Chrome profile. No event data is stored.
- **`contextMenus`**: adds the "Add … to Google Calendar" entry to the right-click menu for selected
  text. The selected text is parsed locally and placed in the Google Calendar URL; the extension does
  not read the page it was selected from.

## Changes

Updates to this policy are published in this file in the public repository
<https://github.com/jperelli/better-google-calendar>.

## Contact

Open an issue at <https://github.com/jperelli/better-google-calendar/issues>.
