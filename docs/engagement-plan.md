# Engagement plan: replying where people asked for these features

Goal: get the first users and feedback by answering, one by one, the public threads whose complaint we
now solve. Every reply follows the same rules so it reads as help, not spam.

## Rules

1. Reply only where the thread's exact problem is solved by a shipped feature; say which one in one line.
2. Lead with the native workaround if Google has one (buried setting, URL trick); mention the extension
   second. People upvote answers that solve the problem without an install.
3. One link, to the Chrome Web Store listing (or the GitHub repo until it is published). No tracking
   parameters, no screenshots of other products, no "check out my".
4. Disclose: "I made this extension" in every post. Never post twice in the same thread; never post
   from more than one account.
5. Keep it under 6 lines, plain English (or Spanish where the thread is in Spanish). Match the thread's
   register; no emojis, no exclamation marks.
6. Reddit: read each subreddit's self-promotion rule first (r/GoogleCalendar's AutoMod removes links in
   comments; post the extension name and say "it is on the Chrome Web Store", users search it).
   Google Help Community: answers that are only a link get removed; explain the fix in the answer.
7. Pace: at most 3 replies per day, spread across platforms, so no platform sees a burst.
8. Reply to every answer we get within 24 h; file real bugs as GitHub issues and link them back.
9. Track each post in the table below (date, URL, status, replies) so nothing is answered twice.

## Prerequisites before posting

- Publish the new version on the Chrome Web Store (store/listing.md is updated; screenshots need a
  refresh: Quick Add box, palette, grid shading, free-times dialog).
- Grid features verified on a real signed-in calendar.google.com (week view, 2026-10-11); threads 7–9
  can be answered.
- Create a short GitHub issue template for "layout changed" reports.

## Threads to answer (in order)

| # | Where | Thread | Feature we ship | Draft reply |
| --- | --- | --- | --- | --- |
| 1 | Google Help Community | [Bring back Quick Add!!](https://support.google.com/calendar/thread/181289347/bring-back-quick-add?hl=en) and [Can Quick Add be reinstated](https://support.google.com/calendar/thread/55538170/can-quick-add-be-reinstated?hl=en) | Quick Add | "Google still parses a bit of this: clicking a day and typing `Dentist 10am` sets the time, but ranges and places do not work. I made a free Chrome extension (Better Google Calendar) that brings the old behaviour back: press q, type `lunch with Ana tomorrow 1-2pm at Bar Lobo every friday`, and Google's own new-event form opens pre-filled. It never asks for account access; it only builds the URL Google uses for 'Add to Calendar' links." |
| 2 | Hacker News | [Ask HN: Is there no natural language input to create Google Calendar events?](https://news.ycombinator.com/item?id=28426487) (only if the thread is still open to comments; otherwise skip) | Quick Add | Same as 1, more technical: mention the `eventedit?text&dates&recur` endpoint and that the parser is open source. |
| 3 | GitHub | [mtimkovich/rip_quick_add](https://github.com/mtimkovich/rip_quick_add) issues/README | Quick Add | Open an issue thanking the author, linking our parser (EN+ES, recurrence presets) as an alternative; ask if they want to cross-link. |
| 4 | Google Help Community | [Creating Event Templates](https://support.google.com/calendar/thread/403228219/creating-event-templates?hl=en) | Templates | "Google has 'Duplicate event' on the web now (open the event, three dots, Duplicate), which covers the one-off case. For real templates (pick 'Shift 2', type a day) I made a free extension, Better Google Calendar: save what you typed once as a template, then click the chip and type `next friday`. No account access needed." |
| 5 | Reddit r/GoogleCalendar | [Create templates for appointments](https://www.reddit.com/r/GoogleCalendar/comments/1s8nlty/create_templates_for_appointments/) | Templates | Same as 4 in two lines; the thread has Italian shift workers, add one line in Italian/Spanish. No link (AutoMod). |
| 6 | Google Help Community | [Repeat every last day of month is missing](https://support.google.com/calendar/thread/143707333/repeat-every-last-day-of-month-is-missing?hl=en) (locked: answer the newest duplicate instead) | Recurrence presets | "The .ics trick in this thread works; the extension does it from the Quick Add box: type `rent every last day of the month` or pick 'Last day of every month' in the Repeat menu, and Google's form opens with the rule set." |
| 7 | Google Help Community | [How do I change the start and end times of my day?](https://support.google.com/calendar/thread/957275/how-do-i-change-the-start-and-end-times-of-my-day?hl=en) | Focus hours + shading | "There is still no setting. The extension scrolls each view to your first working hour and shades the hours outside your working hours, so the night is out of sight without hiding anything." (Only after the real-DOM check.) |
| 8 | Reddit r/GoogleCalendar | [Alternative to Shade extension?](https://www.reddit.com/r/GoogleCalendar/comments/1thys69/alternative_to_shade_extension/) | Working-hours shading | "Better Google Calendar shades outside your working hours per weekday and tints weekends; it works on Workspace accounts because it does not touch your settings." No link. |
| 9 | Google Help Community | [Countdown for Google Calendar](https://support.google.com/calendar/thread/1715316/countdown-for-google-calendar?hl=en) and [Countdown in Google calendar](https://support.google.com/calendar/thread/241772818/countdown-in-google-calendar?hl=en) | Now bar | "A small bar at the top shows the current event with minutes left, the next one with a countdown and a Join button; it reads what is on your screen, nothing else." |
| 10 | Google Help Community | [Shortcut to show/hide declined events](https://support.google.com/calendar/thread/263443248/shortcut-to-show-hide-declined-events?hl=en) | Palette + fade declined | "Native: Settings > View options > Show declined events. The extension's Ctrl+K palette finds that setting when you type 'declined', and it can fade declined events instead of hiding them." |
| 11 | Google Help Community | [Is the way to see declined events](https://support.google.com/calendar/thread/244166792/is-the-way-to-see-declined-events?hl=en) and other "where is the setting" threads (week start, invitations, Meet auto-add) | Palette | Native answer first (exact path), then one line: the palette finds any of these by plain words. |
| 12 | webapps.stackexchange | [Are there advanced keyboard shortcuts for Google Calendar?](https://webapps.stackexchange.com/questions/19759/are-there-advanced-keyboard-shortcuts-for-google-calendar) | Palette | Stack Exchange allows self-made tools if disclosed and the answer stands alone: list Google's shortcuts, then the palette (`go to 14 nov`, `month`, `search budget`). |
| 13 | Hacker News | [Show HN: free time slots for email](https://news.ycombinator.com/item?id=23026058) (old; only if a new related thread appears) | Share free times | Mention when a new "share availability" thread comes up; HN punishes necro-posting. |
| 14 | Morgen feedback board | [Create / export .ics file for a calendar event](https://feedback.morgen.so/p/create-export-ics-file-for-a-calendar-event) | Export .ics | Skip: it is a competitor's board; posting there is bad form. |
| 15 | webapps.stackexchange | [How do I print a Google Calendar in monthly view that shows multiple lines](https://webapps.stackexchange.com/questions/92316/) | Print stylesheet | "Native: none. The extension's 'Readable printing' toggle wraps titles and darkens text; or use Stylus with this CSS: …" (include the CSS so the answer stands alone). |
| 16 | Reddit r/GoogleCalendar | [Showcase Your Google Calendar Tools & Apps!](https://www.reddit.com/r/GoogleCalendar/comments/1j8x7pt/showcase_your_google_calendar_tools_apps/) | All | The one place where promotion is invited: follow the post's template (title, description, benefits, how it works, privacy). Post once, update by editing. |
| 17 | Product Hunt | New launch | All | Launch after 2 weeks of Web Store feedback; "Button for Google Calendar" got 521 upvotes with a similar no-account pitch. Prepare 4 screenshots + a 20 s GIF of Quick Add. |
| 18 | Chrome Web Store reviews of Checker Plus / G-calize | Do not reply there | - | Never comment on competitors' listings. Instead make sure our listing's description contains the words people search for after those reviews: "quick add", "working hours", "weekend", "countdown", "templates", "no account access". |

## Tracking

| Date | URL | Platform | Status (draft / posted / answered) | Replies / outcome |
| --- | --- | --- | --- | --- |
| | | | | |

## Open risk

The grid features (shading, totals, Now bar, dimming, free times, popover export) read Google's
rendered DOM (`data-datekey`, `data-eventid`, `role=main`, hour labels). They were verified on a real
signed-in calendar on 2026-10-11 (week view, en-US, GMT-04 calendar on a UTC machine), but Google can
change the markup at any time. If the layout differs, the features pause themselves and show a notice,
so nothing breaks for users; re-check after any Calendar redesign before posting about them.
