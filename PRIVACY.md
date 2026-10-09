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

## Permissions

- **Host access to `https://calendar.google.com/*`**: required to detect files dropped on Google
  Calendar and show the event list there. The extension does not read your calendar data.
- No other permissions are requested.

## Changes

Updates to this policy are published in this file in the public repository
<https://github.com/jperelli/better-google-calendar>.

## Contact

Open an issue at <https://github.com/jperelli/better-google-calendar/issues>.
