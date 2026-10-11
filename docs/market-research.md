# Market research: what Google Calendar users say is missing

Purpose: decide what "Better Google Calendar" should build next, based on what people actually
complain about, and on what a Manifest V3 content-script extension on `calendar.google.com`
can realistically do.

Research done 2026-10-11 (sources read between 2026-10-10 and 2026-10-11).

## 1. Method

### What the extension can technically do today (baseline for feasibility)

Read from `README.md`, `manifest.json`, `src/content.js`, `src/gcal-url.js`:

- Content script on `https://calendar.google.com/*`, run at `document_idle`; UI is drawn inside a
  shadow root (`#better-google-calendar-root`) so Google's CSS never touches it.
- Actions are URL based: `calendar/u/<n>/r/eventedit?text&dates&details&location&add&recur&crm`
  (the same endpoint "Add to Google Calendar" links use). Also usable: `/r/day/YYYY/M/D`,
  `/r/week/...`, `/r/month/...`, `/r/customweek/...`, `/r/agenda`, `/r/search?q=`, `/r/settings/...`.
- Background service worker only opens tabs. No backend, no OAuth, no Google Calendar API.
- Anything that must *read* events that are not painted on screen, or *modify* existing events,
  needs the Google Calendar API + OAuth. That is a different product: OAuth consent screen,
  Google verification for sensitive scopes, privacy policy audit, and a much longer Web Store review.
  Reviews of OAuth-based extensions (Zoom Scheduler, Checker Plus, Reclaim) show users distrust
  "keys to the castle" permissions; HN 39032999 is a whole thread about how scary the Calendar
  consent screen is. Not needing OAuth is a selling point, so the feasibility column below treats
  API+OAuth as a big jump.
- Reading what *is* painted on screen (event chips, their `aria-label`/text with times, the day
  headers, the time gutter) is possible but Google's class names are obfuscated and change
  without notice. Reviews of G-calize (Sep 2024, Aug 2023) and Event Merge show these extensions
  breaking for days when Google ships a DOM change. Anything that depends on Google's DOM is
  marked fragile and gets a higher difficulty.

Feasibility legend used below:
`URL` = build a Google URL and navigate/open a tab; `CSS` = inject stylesheet only;
`DOM` = observe/parse Google's markup and inject UI (fragile);
`API` = needs Google Calendar API + OAuth; `ext-API` = needs a third-party API (weather, maps);
`No` = not possible from an extension.

Difficulty: S (days), M (1-2 weeks), L (several weeks), XL (OAuth/API product work or constant
upkeep). Demand 1-5 is a judgement from volume + repetition across independent sources.

### Sources read

| Source | What was read | Notes |
| --- | --- | --- |
| Google Workspace Updates blog, label "Google Calendar" | Every post 2025-01 to 2026-10 (list pages + the individual posts cited below) | Used to mark things Google already shipped |
| Google Calendar Help Community (support.google.com/calendar/thread/...) | 20+ threads found through search (recurrence, templates, bulk edit, hidden hours, countdown, declined events, search, travel time, daily notes, Quick Add) | Thread titles + first page of replies; vote counts are not exposed so "many +1 replies" is used as the signal |
| Google Issue Tracker | 36753322 (ICS import API), 36756505 (move event between calendars), 112063903 / 122674818 (Out of office API) | Star counts noted |
| Hacker News (Algolia API + threads) | 60 top stories matching "google calendar", plus threads 15493728, 2718483, 16441317, 43997749, 14010130, 23026058, 28426487, 39032999, 35849243, 25769329, 46707222 | Points/comments noted |
| Reddit r/GoogleCalendar | Top posts of the year and all-time (rendered via Chrome; old.reddit and Reddit search are behind a login wall), plus threads 1j8x7pt (tool showcase, 104 comments), 1s8nlty, 1p8ls8n, 1uvaruu, 1thys69 | The subreddit is small (~1k members, top posts 5-7 upvotes), so Reddit is a weak volume signal; r/productivity, r/gsuite and r/chrome searches could not be read (login wall) |
| Chrome Web Store listings + review aggregators (chrome-stats, extpose, extscope) | Checker Plus (1M+ users, 4.4), G-calize (4.2), Event Merge (4.3, 225) + MV3 fork, GcalColor (4.5, 521), GCalPlus, Shade Calendar, Calendar Clarity, Event Templates, Google Calendar Bulk Edit, Right Click, Event & Meeting Duration, Toolset, Week Increment, Clean workspace, Resize Sidebar, gcalweather, BoldCal, Zoom Scheduler (chrome-stats reviews), Clockwise (deprecated), Toggl Track | Including 1-3 star reviews where the aggregator exposed them |
| Product Hunt (via hunted.space dashboards) | Button for Google Calendar (521 upvotes, #1 of the day 2021), Lyra (186), misc 2025 launches | |
| Twitter/X | Only indirectly: Collison/Pichai "duplicate event" exchange reported by TechCrunch (Aug 2025) | X search is not readable without login |
| Blogs | Android Authority "4 biggest annoyances" (2026), Android Police add-ons roundup (2025) and custom-view guide, Lifehacker "hide wasted hours" (2018), XDA "ditched Google Calendar for Notion Calendar", itfuckup.com 2017 redesign rant, joshdance "I miss Quick Add", UCals "6 things missing", productivewithchris review, online-tech-tips weather, PCWorld 21 tricks, webapps.stackexchange threads 4535, 19759, 24157, 92316, 111787, 114768 | |
| Competitors' own marketing | Fantastical (usecarly comparison), Notion Calendar (XDA), Vimcal (site + TechCrunch), Morgen, Akiflow, Amie (toolradar, efficient.app), Reclaim (Trustpilot 2.7), Clockwise | Advertised advantages read as implicit complaints |

### Already shipped by Google (excluded or marked below)

- Custom event colours, 24 defaults + RGB picker, up to 200 per calendar (2026-06-17).
- Up to three time zones on the web grid (2026-09-25); time-zone picker search (2026-03-16).
- Better scaling on large monitors / density (2026-03-10).
- Block senders of unsolicited invitations (2026-08-18); suppress email responses to invites (2026-08-28).
- Block off time for a task (tasks with duration, 2025-11-17).
- Duplicate event on the web (Aug 2025, the Collison/Pichai X exchange).
- Dark theme on the web (Oct 2024, Material 3 refresh).
- Week numbers (2018), speedy meetings and default event duration, working hours (Workspace),
  appointment schedules (one booking page free), "show declined events", "week starts on",
  "automatically add invitations: only if sender known", hide birthdays, "add Meet automatically" toggle.

A recurring pattern: many "missing features" exist but are buried settings (see item 44).

## 2. The list

Format per item: **pain**; **evidence** (links + volume); **shipped?**; **how** (feasibility);
**difficulty** (with reason); **demand**.

### A. Creating events

**1. Natural-language "Quick Add" box** ("lunch with Ana tomorrow 1-2pm at Bar Lobo").
Pain: Google removed Quick Add in the 2017 redesign; today typing "x at 5pm" in the title works for a
1 h event but ranges, locations ("at"/"@") and recurrence are not parsed. People still ask for it.
Evidence: support threads [181289347 "Bring back Quick Add!!"](https://support.google.com/calendar/thread/181289347/bring-back-quick-add?hl=en),
[55538170](https://support.google.com/calendar/thread/55538170/can-quick-add-be-reinstated?hl=en);
[HN 15493728](https://news.ycombinator.com/item?id=15493728) (redesign thread, 174 pts / 112 c, Quick Add called "the most valuable feature");
[Ask HN 28426487](https://news.ycombinator.com/item?id=28426487);
[joshdance: "84 posts and hundreds of upvotes" in the help forum](https://joshdance.medium.com/i-miss-google-cal-quick-add-d4beee62fd27);
[webapps.SE 111787](https://webapps.stackexchange.com/questions/111787/new-google-calendar-2017-quick-add);
[rip_quick_add](https://github.com/mtimkovich/rip_quick_add) (open-source parser that does exactly this via the eventedit URL);
Checker Plus and Fantastical both market NL input.
Shipped: partially (title-only parsing). How: `URL` + shadow-DOM input, parser (chrono-style) ->
`eventedit?text&dates&location&recur`. Difficulty: **S/M** (zero Google-DOM dependency; parser quality is the work).
Demand: **5**.

**2. Event templates / presets** (one click "Shift 2", "1:1 with X", "Dentist").
Pain: shift workers and people with repeated appointment types re-type everything; "duplicate" only
copies an existing event. Evidence: [support 403228219 (2026-01)](https://support.google.com/calendar/thread/403228219/creating-event-templates?hl=en);
[reddit 1s8nlty "Create templates for appointments"](https://www.reddit.com/r/GoogleCalendar/comments/1s8nlty/create_templates_for_appointments/) (5 pts, replies from shift workers);
[Event Templates for Google Calendar (CWS, uses the API)](https://chromewebstore.google.com/detail/event-templates-for-googl/npgpcehplabnkmcpbclnkmammhnchgkh);
[Calendar EventTemplates (Marketplace add-on)](https://workspace.google.com/marketplace/app/calendar_eventtemplates/65028291685).
Shipped: no (duplicate event, Aug 2025, is the closest). How: `URL` for creation (templates in
`chrome.storage.sync`, apply = eventedit URL with chosen date); `DOM` only for the nice-to-have
"right-click a day cell". Difficulty: **M** (S without the day-cell hook). Demand: **4**.

**3. Create an event from selected text on any page** (context menu).
Pain: copying date/place from an email or web page into the form is tedious. Evidence:
[Google Calendar Right Click (CWS)](https://chromewebstore.google.com/detail/google-calendar-right-cli/gecagpecilkplgfkfpbpfhjkfelfdocd);
Checker Plus (1M+ users) sells this; a 2026 Checker Plus review laments the "read the current page into an event" feature disappearing
([extpose reviews](https://extpose.com/ext/40810)). Shipped: no (Gmail auto-adds some reservations only).
How: `contextMenus` permission (no extra host permission needed, `selectionText` is given) -> parser from item 1 -> eventedit tab.
Difficulty: **S**. Demand: **3**.

**4. Recurrence presets Google's dialog can't express** (last day of month, last Friday, every 2nd Tuesday, weekdays only in term time).
Pain: "repeat every last day of month is missing", users are told to import an .ics with `BYMONTHDAY=-1`.
Evidence: [support 143707333](https://support.google.com/calendar/thread/143707333/repeat-every-last-day-of-month-is-missing?hl=en) (locked, long "me too" tail);
[UCals "per-day overrides of recurring events"](https://ucals.com/articles/stop-using-google-calendar-self-employed).
Shipped: no. How: `URL` (`recur=RRULE:...` already supported by `buildEventEditUrl`); only at creation time, editing an existing series needs `API`.
Difficulty: **S/M**. Demand: **3**.

**5. Paste or open an .ics from anywhere** (clipboard, `webcal://` links, email attachments, "Add to calendar" buttons that download a file).
Pain: Google only imports .ics through Settings > Import, several clicks deep; the drop feature covers the file case only.
Evidence: [Issue Tracker 36753322 (iCalendar import API)](https://issuetracker.google.com/issues/36753322);
Toolset for Google Calendar offers ICS export/import ([extscope](https://extscope.org/extension/ckjjfpcdnccfjnkpnlfndpmlbdlohgcm)).
Shipped: no. How: `URL` (reuse parser + modal; paste handler on the page; optional `webcal:` link interception needs a broader host permission).
Difficulty: **S**. Demand: **3**.

**6. Add one event to several calendars at once.**
Pain: people keep a work and a family calendar and create the same event twice.
Evidence: MultiCal extension promoted in [reddit tools showcase (104 comments)](https://www.reddit.com/r/GoogleCalendar/comments/1j8x7pt/showcase_your_google_calendar_tools_apps/).
Shipped: no. How: `URL` opening one pre-filled form per calendar is possible but the form's calendar
selector cannot be pre-set reliably from the URL (`src=` is undocumented), so the user picks each
calendar; proper = `API`. Difficulty: **M**. Demand: **2**.

**7. Import a shift roster / spreadsheet as events.**
Pain: "massive roster spreadsheet, 30 minutes picking out my shifts".
Evidence: [reddit top post of the year](https://www.reddit.com/r/GoogleCalendar/top/?t=year) (6 pts / 15 c).
Shipped: no. How: `URL` (paste table -> column mapping -> the existing multi-event modal). Difficulty: **M**. Demand: **2**.

**8. Bulk select / move / delete / re-colour many events.**
Pain: "It's not possible to bulk delete calendar events within Google Calendar" (product expert answer).
Evidence: [support 246289422](https://support.google.com/calendar/thread/246289422/selecting-multiple-events?hl=en);
[Google Calendar Bulk Edit (CWS, marquee select, OAuth)](https://chromewebstore.google.com/detail/google-calendar-bulk-edit/kklojeonebikceffbffplnkajeckobbk);
GCalExtras add-on in [Android Police roundup](https://www.androidpolice.com/time-saving-calendar-addons/);
[Bulk-Edit-Calendar-Events-GAS](https://github.com/derekantrican/bulk-edit-calendar-events-gas).
Shipped: no. How: `API` (DOM drag per event cannot be batched; marquee selection on the grid is also `DOM`-fragile). Difficulty: **XL**. Demand: **4**.

**9. Move an event to another calendar in one click.**
Pain: it exists but is hidden in the full edit page. Evidence: [Issue Tracker 36756505](https://issuetracker.google.com/issues/36756505).
Shipped: yes in the edit page (UI friction only). How: `API`. Difficulty: **L**. Demand: **2**.

**10. "Roll over" an unfinished event to tomorrow / postpone.**
Pain: people use a "TODAY" event as a to-do list and drag it every day.
Evidence: [reddit 1p8ls8n](https://www.reddit.com/r/GoogleCalendar/comments/1p8ls8n/can_i_get_a_calendar_event_to_roll_to_the_next/) (18 comments; answers point at Tasks or Reclaim).
Shipped: Tasks do this natively. How: `API` for events. Difficulty: **L**. Demand: **2**.

### B. Reading the grid

**11. Hide / compress night and early-morning hours.**
Pain: "I don't want to scroll down over 1am-7am", the "Hide morning & night" Lab was removed in 2017 and never came back.
Evidence: [support 957275](https://support.google.com/calendar/thread/957275/how-do-i-change-the-start-and-end-times-of-my-day?hl=en) (years of "+1", "Annoying night hours!!!");
[webapps.SE 4535](https://webapps.stackexchange.com/questions/4535/is-there-a-way-to-have-google-calendar-scroll-to-normal-hours-by-default), [114768](https://webapps.stackexchange.com/questions/114768/how-to-limit-visible-hours-in-new-google-calendar);
[Lifehacker 2018](https://lifehacker.com/this-extension-brings-back-working-hours-to-google-cale-1827815781);
[GCalPlus](https://chromewebstore.google.com/detail/gcalplus/mjelhipeelammmhpghkpigkdonihkakj) sells it as a headline option.
Shipped: no (the 2026-03 "large monitor scaling" only changes the default zoom). How: `CSS`/`DOM`
(shrink the hour rows outside a range; the grid is absolutely positioned so event chips must be re-mapped, fragile).
Difficulty: **M**. Demand: **4**.

**12. Colour weekends, holidays and "today"; shade off-hours / custom time blocks.**
Pain: all days look the same; Workspace users can't shade off hours because admins control working time.
Evidence: [G-calize](https://chromewebstore.google.com/detail/g-calize/piiljfhidimfponnkjlkecnpjhdijfde) (4.2, hundreds of ratings, reviews "should be an option in GCal");
Google Calendar Weekend Highlighter (4.1); [Shade Calendar](https://chromewebstore.google.com/detail/shade-calendar-for-google/hdlfamnpialfmlkddnmijnimciflhbjo);
[reddit 1thys69 "Alternative to Shade"](https://www.reddit.com/r/GoogleCalendar/comments/1thys69/alternative_to_shade_extension/).
Shipped: no. How: `CSS`/`DOM` (day columns carry a date, but class names are obfuscated; G-calize breaks every time Google changes them).
Difficulty: **M** (fragile DOM, must self-heal on view changes). Demand: **4**.

**13. Dim past events / grey out past days.**
Pain: the pre-2017 "event dimming" setting is gone; "focus on what's next".
Evidence: [PCWorld 21 tricks (old setting)](https://www.pcworld.com/article/456118/power-through-schedules-with-21-google-calendar-tricks.html);
GcalColor reviews ask for past-event greying ([extscope](https://extscope.org/extension/edegnmdhngniabdiiidplepangdoccna)); Checker Plus "gray out past days"; [Calendar Clarity](https://www.calendarclarity.app/).
Shipped: no. How: `DOM` (parse chip time from its accessible label, compare with now, set opacity; re-run on a timer).
Difficulty: **M**. Demand: **3**.

**14. Fade declined / tentative / solo / external events, and a one-key toggle for "show declined".**
Pain: everything is "at the same volume"; "show declined events" is a buried setting with no shortcut.
Evidence: [support 263443248 "Shortcut to show/hide declined"](https://support.google.com/calendar/thread/263443248/shortcut-to-show-hide-declined-events?hl=en);
[Calendar Clarity](https://www.calendarclarity.app/) built a product on it. Shipped: no.
How: `DOM` for fading (declined chips already have a distinct style to key off); the toggle needs automating the settings page (`DOM`, fragile).
Difficulty: **M**. Demand: **3**.

**15. Duration / end time on event chips (and in month view).**
Pain: month view shows only the start time; week chips don't show length in text.
Evidence: [Event & Meeting Duration for GCal](https://chromewebstore.google.com/detail/event-meeting-duration-fo/pefipdhbcfmfncaiopkegoonbncfcaej);
Toolset ([extscope](https://extscope.org/extension/ckjjfpcdnccfjnkpnlfndpmlbdlohgcm)); [Checker Plus forum 6461](https://jasonsavard.com/forum_vanilla/discussion/6461/tooltip-showing-end-time).
Shipped: no. How: `DOM` (chip label contains "10am to 11am"; inject a small badge). Difficulty: **S/M**. Demand: **3**.

**16. Weekly / daily totals: hours per calendar or colour ("Time Insights" for everyone).**
Pain: consumer accounts have no analytics; freelancers count billable hours by hand.
Evidence: Google Calendar Hour Calculator (5.0), TrakkyTime, [CalendarWorkHoursCounter](https://github.com/) type scripts, Toggl Track (1,543 reviews on [extscope](https://extscope.org/extension/oejgccbfbmkkpaidnkphaiaecficdnfn));
[productivewithchris: "no analytics"](https://productivewithchris.com/tools/google-calendar/); Time Insights is Workspace-only ([Workspace Updates 2026-01-28](https://workspaceupdates.googleblog.com/search/label/Google%20Calendar)).
Shipped: Workspace only. How: `DOM` (sum visible chips in week view by colour/calendar; panel in shadow DOM; export CSV).
Difficulty: **M**. Demand: **4**.

**17. Colour the event title text per calendar (old-style look) / stronger calendar distinction.**
Pain: since 2018 chips are solid blocks; some want coloured text on white.
Evidence: [GcalColor](https://chromewebstore.google.com/detail/gcalcolor/edegnmdhngniabdiiidplepangdoccna) (4.5, 521 ratings).
Shipped: no (custom colours June 2026 are a different thing). How: `CSS`. Difficulty: **S**. Demand: **2**.

**18. Merge the same event shown on several calendars into one striped chip.**
Pain: an invite accepted on two calendars (or a shared partner calendar) shows twice and eats space.
Evidence: [Event Merge](https://chromewebstore.google.com/detail/event-merge-for-google-ca/idehaflielbgpaokehlhidbjlehlfcep) (4.3, 225) and its [MV3 fork](https://chromewebstore.google.com/detail/event-merge-for-google-ca/leoimkcbknpkpgoddcmbilnbkgmpjbkj) still active in 2026;
GCalPlus "Hide invites on shared calendars"; [webapps.SE 60747](https://webapps.stackexchange.com/questions/60747).
Shipped: no. How: `DOM` (match title+time, hide duplicates, restyle survivor; layout fights Google's absolute positioning).
Difficulty: **L** (the two existing extensions have a history of perf and breakage reviews). Demand: **3**.

**19. More events per day in month view, more all-day rows, compact headers.**
Pain: "+3 more" hides things; all-day area truncates.
Evidence: [GCalPlus](https://chromewebstore.google.com/detail/gcalplus/mjelhipeelammmhpghkpigkdonihkakj) "Expand the Month Grid", "Show more all-day events".
Shipped: density setting only (2026-03). How: `CSS`/`DOM`. Difficulty: **M**. Demand: **3**.

**20. Move a multi-week custom view one week at a time (continuous scrolling).**
Pain: month view jumps a whole month; events crossing month boundaries are hard to see.
Evidence: [Week Increment Google Calendar Custom View](https://chromewebstore.google.com/detail/week-increment-google-cal/mpdpfnabohjiinfoagikghmlnpnjmihg) (URL-based);
[Android Police custom-view guide](https://www.androidpolice.com/google-calendars-custom-view/).
Shipped: no. How: `URL` (`/r/customweek/YYYY/M/D` + keyboard shortcut). Difficulty: **S**. Demand: **2**.

**21. Control the stacking order / priority of overlapping events.**
Pain: no way to say "my calendar on top". Evidence: [discuss.google.dev 191595](https://discuss.google.dev/t/google-calendar-order-of-event-display/191595) ("many users have raised this").
Shipped: no. How: `DOM` (re-layout of absolutely positioned chips). Difficulty: **L**. Demand: **2**.

**22. Declutter: hide upgrade promos, Meet buttons, event illustrations, app bar; resizable sidebar.**
Pain: "peaceful workspace", small screens.
Evidence: [Clean workspace for Google Calendar](https://chromewebstore.google.com/detail/clean-workspace-for-googl/ebkneamblgmofakepopmjhibenkbpcdg),
Google Calendar Resize Sidebar (4.9), FullScreen Calendar, Toolset "remove Meet buttons", GCalPlus "Hide images".
Shipped: no. How: `CSS`. Difficulty: **S** (selectors need upkeep). Demand: **3**.

**23. Readable printing and denser / higher-contrast typography.**
Pain: printed month view cuts titles off and uses light grey text; 2011 and 2017 redesign threads complain about contrast and density.
Evidence: [webapps.SE 92316](https://webapps.stackexchange.com/questions/92316/how-do-i-print-a-google-calendar-in-monthly-view-that-shows-multiple-lines-of-an),
[vucavucalife Stylus hack](https://vucavucalife.com/en/google-calendar-wo-miyasuku-print-sitainoyo/), [SitePoint](https://www.sitepoint.com/community/t/google-calendar-cuts-off-info-when-printing/23899),
[HN 2718483](https://news.ycombinator.com/item?id=2718483) (146 pts), [itfuckup 2017](https://itfuckup.com/2017/10/26/new-google-calendar-design-oh-shit/).
Shipped: density setting (2026-03) partly. How: `CSS` (`@media print` + a few density presets). Difficulty: **S/M**. Demand: **3**.

**24. Mini-calendar dots on days that have events.**
Pain: the left mini calendar gives no hint of busy days.
Evidence: [reddit feature request (2026)](https://www.reddit.com/r/GoogleCalendar/search/?q=feature+request); GCalPlus "Highlight busy/free" (needs OAuth).
Shipped: no. How: `DOM` for the currently loaded range only; complete = `API`. Difficulty: **L**. Demand: **2**.

**25. Auto colour-code events by rule (keyword, guest, domain).**
Pain: colouring is manual, one event at a time.
Evidence: ClearCal and GCal Pro / Tint Calendar extensions; [reddit 1j0ruzy "Limited custom color options"](https://www.reddit.com/r/GoogleCalendar/comments/1j0ruzy/limited_custom_color_options/) (pre-June-2026).
Shipped: the palette yes (2026-06), rules no. How: `DOM` for a visual-only recolour in this browser; persisting the colour = `API`.
Difficulty: **M** (visual) / **L** (persist). Demand: **3**.

**26. Week numbers.** Shipped (Settings > View options, since 2018). Skip.

**27. Dark theme on the web.** Shipped (Oct 2024). Residual: colour set can't be changed in dark mode ([help 15240542](https://support.google.com/calendar/answer/15240542)) -> fold into item 23 as a theme preset. Skip as its own item.

**28. More than one extra time zone.** Shipped (three zones, 2026-09-25). [HN 14010130](https://news.ycombinator.com/item?id=14010130) travel itineraries remain awkward but per-event time zones exist. Skip.

### C. Time awareness and notifications

**29. "Now" bar: countdown to the next event, time left in the current one, one-click Join.**
Pain: "how much time is left in this meeting without doing maths"; "see what's next at a glance" is the #1 reason people cite menu-bar apps.
Evidence: [support 1715316 (2019, long +1 tail)](https://support.google.com/calendar/thread/1715316/countdown-for-google-calendar?hl=en), [241772818](https://support.google.com/calendar/thread/241772818/countdown-in-google-calendar?hl=en);
[webapps.SE 24157](https://webapps.stackexchange.com/questions/24157/show-remaining-countdown-time-to-events); Checker Plus forum [5992](https://jasonsavard.com/forum_vanilla/discussion/5992/current-event-remaining-time), [8588](https://jasonsavard.com/forum_vanilla/discussion/8588/i-need-time-until-next-event-to-show-all-calendars);
[Button for Google Calendar, 521 Product Hunt upvotes](https://www.hunted.space/dashboard/button-for-google-calendar/launches/button-for-google-calendar); Meety (reddit showcase); [XDA Notion Calendar piece](https://www.xda-developers.com/ditched-google-calendar-for-notion-calendar/); Fantastical/Notion "join" buttons.
Shipped: no. How: `DOM` (parse today's chips incl. Meet/Zoom links from the chip or its popover; sticky bar in shadow DOM; extension badge text).
Difficulty: **M**. Demand: **4**.

**30. Reliable desktop notifications: snooze, alarm-like, when the tab is not focused.**
Pain: Google's browser notifications are easy to miss, can't snooze, and Checker Plus moved these behind a paywall in 2026.
Evidence: Checker Plus 1M+ users exists mostly for this; [extpose reviews 2026](https://extpose.com/ext/40810) ("wants you to PAY"); [reddit 1q7wc76 ring like an alarm](https://www.reddit.com/r/GoogleCalendar/comments/1q7wc76/how_to_have_calendar_notifications_ring_like/) (6 pts / 11 c);
[reddit 1uvaruu daily agenda email stopped](https://www.reddit.com/r/GoogleCalendar/comments/1uvaruu/email_daily_agenda_is_that_gone/) (12 c).
Shipped: basic. How: `DOM` + `chrome.alarms`/`chrome.notifications` works only while a Calendar tab is open (cache today's events); full fidelity = `API`.
Difficulty: **M** (tab-open version) / **XL** (API). Demand: **4**.

### D. Scheduling and sharing

**31. Share availability as text (pick free slots on the grid, copy "Tue 3/25: 9-11, 2-4 CET").**
Pain: booking links feel impersonal; typing availability by hand is tedious and error-prone.
Evidence: [Offer Times (extension doing exactly this)](https://offer-times.com/), [ShareAvailability](https://www.shareavailability.com/), [Vimcal Slots](https://docs.vimcal.com/vimcalea/slots), [HN 23026058](https://news.ycombinator.com/item?id=23026058), Vimcal/Akiflow marketing.
Shipped: no (appointment schedules are the booking-link model). How: `DOM` (drag-select on the grid -> read overlapping chips -> formatted text with time zone; no OAuth needed because only the visible week is read).
Difficulty: **L** (grid geometry is fragile). Demand: **4**.

**32. Booking links / appointment pages.** Shipped (appointment schedules, one page free). Skip.

**33. Travel time between events (and "leave now" warnings).**
Pain: Apple Calendar has it; "no way to automatically add travel time".
Evidence: [support 356609465](https://support.google.com/calendar/thread/356609465/how-to-automatically-add-travel-time-to-google-calendar?hl=en), [242500740](https://support.google.com/calendar/thread/242500740/i-can%E2%80%99t-set-travel-time-in-calendar?hl=en);
[reddit 1sgtx4q](https://www.reddit.com/r/GoogleCalendar/comments/1sgtx4q/estimated_drive_time_from_current_location_to/); SmartCommute and addtraveltime.com in the showcase thread.
Shipped: manual only (click location -> Maps side panel). How: `ext-API` (routes) + `DOM` for a visual warning; inserting travel blocks = `API`.
Difficulty: **L/XL**. Demand: **3**.

**34. Automatic focus time / buffers / smart rescheduling.**
Pain: back-to-back meetings. Evidence: Clockwise extension (deprecated, Workspace only), [Reclaim Trustpilot 2.7](https://ca.trustpilot.com/review/reclaim.ai) (users hate it moving things without asking); [HN 43997749](https://news.ycombinator.com/item?id=43997749).
Shipped: speedy meetings + Workspace focus time. How: `API` and heavy trust issues. Difficulty: **XL**. Demand: **2**.

**35. Recurring / convertible Out-of-office events.** Evidence: [Issue Tracker 112063903](https://issuetracker.google.com/issues/112063903) (596 stars). How: `API`. Difficulty: **L**. Demand: **2**. Skip.

### E. Data in and out

**36. Export a single event as .ics / copy event as text.**
Pain: Google only exports whole calendars; sharing one event cross-platform means re-typing.
Evidence: [Morgen feedback request](https://feedback.morgen.so/p/create-export-ics-file-for-a-calendar-event), Toolset "export event as ICS", Outlook users asking the same ([MS Q&A](https://learn.microsoft.com/en-us/answers/questions/4624957/how-to-export-an-event-as-ics-file)).
Shipped: no. How: `DOM` (read the event detail popover: title, time, location, description, guests -> build VEVENT -> download; the extension already has the inverse parser).
Difficulty: **M**. Demand: **3**.

**37. Copy the visible day/week as text or CSV (stand-ups, timesheets).**
Pain: no "copy agenda" on the web. Evidence: Toolset/GCalPlus feature lists; overlaps item 16 users. Shipped: no. How: `DOM`. Difficulty: **S/M**. Demand: **2**.

**38. Notes per day (daily journal inside the calendar).**
Pain: "daily notes inside calendar dates".
Evidence: [support 412303676 (2026)](https://support.google.com/calendar/thread/412303676/feature-request-%E2%80%93-daily-notes-inside-calendar-dates?hl=en); Google Calendar Notes extension (showcase thread); Notion Calendar marketing.
Shipped: no. How: `DOM` (inject a notes button per day header; store in `chrome.storage.sync`, 100 KB limit, or as an all-day event via `URL`).
Difficulty: **M**. Demand: **3**.

**39. Weather on day headers.**
Pain: Google removed built-in weather years ago.
Evidence: [online-tech-tips](https://www.online-tech-tips.com/how-to-add-weather-to-google-calendar/); [gcalweather (open source)](https://chromewebstore.google.com/detail/gcalweather/pgihmbabjpniakkeljafiecjefnodlng), BoldCal (4.3); Fantastical lists weather as an advantage.
Shipped: no. How: `DOM` + `ext-API` (Open-Meteo needs no key; location permission or a typed city). Difficulty: **M**. Demand: **3**.

**40. Cost / budget field, life categories, linked events.** Evidence: [UCals](https://ucals.com/articles/stop-using-google-calendar-self-employed) only. How: `API`/`No`. Demand: **1**. Skip.

### F. Navigation, search, settings

**41. Command palette / keyboard-first navigation** ("go to 14 Nov", "next week", "toggle declined", "open settings > view").
Pain: Gmail-grade shortcuts are missing; arrow-key navigation and "create on selected day" were asked years ago; Vimcal's whole pitch is speed.
Evidence: [webapps.SE 19759](https://webapps.stackexchange.com/questions/19759/are-there-advanced-keyboard-shortcuts-for-google-calendar); [Vimcal](https://www.vimcal.com/), [TechCrunch on Vimcal](https://techcrunch.com/2022/11/15/vimcal-wants-be-the-most-nifty-calendar-app-on-the-block/); Akiflow "command bar".
Shipped: basic shortcuts only. How: `URL` (date/view URLs) + shadow-DOM palette; some actions by dispatching Google's own shortcut keys.
Difficulty: **M**. Demand: **3**.

**42. Search: 200-result cap, multi-word "Doesn't have" broken, date range hidden.**
Evidence: [help 37176](https://support.google.com/calendar/answer/37176) (cap), [support 410627616](https://support.google.com/calendar/thread/410627616/using-the-search-feature-in-google-calendar?hl=en).
Shipped: advanced search exists. How: `URL` (`/r/search?q=`) can only re-run searches; fixing results needs `API`. Difficulty: **L**. Demand: **2**. Skip.

**43. Daily agenda email that actually arrives.** Evidence: [reddit 1uvaruu](https://www.reddit.com/r/GoogleCalendar/comments/1uvaruu/email_daily_agenda_is_that_gone/). How: `No` (an extension can't send email); a local morning notification is item 30. Skip.

**44. Settings finder / quick toggles for buried settings.**
Pain: a large share of "annoyances" are settings people can't find: week starts on Sunday, invites auto-added, duplicate birthdays, 30-minute default reminder, show declined, Meet auto-added, keyboard shortcuts off by default, default duration.
Evidence: [Android Authority "4 biggest annoyances" (all four are settings)](https://www.androidauthority.com/fixed-four-biggest-google-calendar-annoyances-how-3708184/);
[support 244166792 (how to see declined)](https://support.google.com/calendar/thread/244166792/is-the-way-to-see-declined-events?hl=en); [support 263443248](https://support.google.com/calendar/thread/263443248/shortcut-to-show-hide-declined-events?hl=en).
Shipped: the settings exist; discoverability doesn't. How: `URL` (deep links to `/r/settings/...` sections) + a searchable panel. Difficulty: **S**. Demand: **3**.

**45. Spam / unsolicited invites.** Evidence: [HN 16441317](https://news.ycombinator.com/item?id=16441317) (173 pts), [Ask HN 46707222](https://news.ycombinator.com/item?id=46707222). Shipped: block senders (2026-08) + "only if sender known". Skip (link from item 44).

**46. Tasks: recurring tasks with subtasks, repeat bug, faded task colours.**
Evidence: [support 416186348](https://support.google.com/calendar/thread/416186348/feature-request-recurring-tasks-with-subtasks?hl=en); [reddit 1q9droq](https://www.reddit.com/r/GoogleCalendar/comments/1q9droq/) (3-year-old repeat bug); [reddit 1pkzpyw](https://www.reddit.com/r/GoogleCalendar/comments/1pkzpyw/so_annoyed_about_update_to_tasks/); [HN 35849243](https://news.ycombinator.com/item?id=35849243) (122 pts, Reminders -> Tasks migration); GCalPlus "Solid Tasks".
Shipped: task time-blocking (2025-11). How: `CSS` for the visual part; subtasks/recurrence = Tasks `API`. Difficulty: **S** (visual) / **XL**. Demand: **2**.

**47. Desktop / menu-bar app feel.** Evidence: [HN 25769329](https://news.ycombinator.com/item?id=25769329), XDA. How: `No` from a content script (a popup agenda needs `API` or a cached scrape). Demand: **2**. Skip.

**48. Hover preview of event details without clicking.** Evidence: Toolset "hover info". How: `DOM` (open popover is click-only; would need to re-create the card from chip text). Difficulty: **M**. Demand: **2**.

**49. Extension hygiene users ask of every Calendar extension: settings import/export and sync, Workspace custom-domain support, surviving Google DOM changes.**
Evidence: G-calize reviews ([extpose](https://extpose.com/ext/41325): Sep 2024 and Aug 2023 breakages, "no sync", "does not work on Workspace custom address").
How: `chrome.storage.sync`, selector health checks + a "something changed, report it" banner. Difficulty: **S**. Demand: **3** (it is what 1-star reviews are made of).

## 3. Prioritization

Sorted by demand (high first), then difficulty (low first). Items marked shipped or demand 1 are
left out of the first two tables and listed under "skip".

### Quick wins (demand >= 3, S or M, no OAuth)

| # | Item | Demand | Difficulty | How | Why it is a quick win |
| --- | --- | --- | --- | --- | --- |
| 1 | Natural-language Quick Add | 5 | S/M | URL | Zero dependency on Google's DOM; reuses the URL builder |
| 2 | Event templates / presets | 4 | M (S without day-cell hook) | URL (+DOM) | Storage + URL; the only fragile part is optional |
| 11 | Hide / compress night hours | 4 | M | CSS/DOM | Single most repeated grid complaint since 2017 |
| 12 | Weekend / holiday / today colours, off-hours shading | 4 | M | CSS/DOM | Proven demand (G-calize, Shade); must self-heal |
| 16 | Weekly totals per calendar/colour | 4 | M | DOM | Reads only what is on screen; unlocks timesheets |
| 29 | "Now" bar: countdown, time left, Join | 4 | M | DOM | 500+ PH upvotes for the popup version; works in-page |
| 30 | Snooze-able notifications while a tab is open | 4 | M | DOM | Checker Plus paywalled this in 2026 |
| 3 | Create event from selected text | 3 | S | URL | contextMenus + item 1 parser |
| 5 | Paste / open .ics from anywhere | 3 | S | URL | Extends the existing feature |
| 22 | Declutter (promos, Meet buttons, illustrations, sidebar width) | 3 | S | CSS | Pure CSS, several small extensions prove demand |
| 44 | Settings finder / quick toggles | 3 | S | URL | Most "annoyances" are hidden settings |
| 49 | Hygiene: settings sync, self-healing selectors, Workspace domains | 3 | S | - | Prevents the 1-star reviews every DOM extension gets |
| 4 | Recurrence presets (last day of month, etc.) | 3 | S/M | URL | `recur=` already supported |
| 15 | Duration / end time on chips | 3 | S/M | DOM | Chip label already contains both times |
| 23 | Print stylesheet + density/contrast presets | 3 | S/M | CSS | Stylus hacks exist; package them |
| 13 | Dim past events | 3 | M | DOM | Timer + opacity |
| 14 | Fade declined/tentative/solo events | 3 | M | DOM | Calendar Clarity's whole pitch |
| 19 | Expand month grid / more all-day rows | 3 | M | CSS/DOM | GCalPlus headline option |
| 25 | Rule-based colouring (visual only) | 3 | M | DOM | Persisting needs API; visual is fine for one browser |
| 36 | Export a single event as .ics | 3 | M | DOM | Inverse of what the extension already does |
| 38 | Notes per day | 3 | M | DOM | Local storage; no API |
| 39 | Weather on day headers | 3 | M | DOM + Open-Meteo | Keyless API |
| 41 | Command palette / go-to-date | 3 | M | URL | Mostly URL navigation |

### Big bets (high demand but L/XL, or OAuth)

| # | Item | Demand | Difficulty | Why it is big |
| --- | --- | --- | --- | --- |
| 31 | Share availability as copyable text | 4 | L | Needs reliable grid geometry (drag-select over Google's absolutely positioned chips), but no OAuth; closest thing to a paid-app feature (Vimcal Slots) |
| 8 | Bulk select / move / delete | 4 | XL | Only sane with Calendar API + OAuth; brings verification, consent screen and user distrust |
| 30b | Notifications when no Calendar tab is open | 4 | XL | API + background polling; this is Checker Plus's product |
| 18 | Merge duplicate events across calendars | 3 | L | Re-layout of Google's grid; two existing extensions show the breakage cost |
| 33 | Travel time between events | 3 | L/XL | Routes API key + inserting blocks needs Calendar API; visual-only warning is M |
| 25b | Rule-based colouring that persists | 3 | L | API write access to colour events |
| 24 | Mini-calendar busy dots | 2 | L | Needs data beyond the visible range (API) |
| 21 | Overlap stacking priority | 2 | L | Deep re-layout, fragile |

### Not feasible / skip (with reason)

| # | Item | Reason |
| --- | --- | --- |
| 26, 27, 28, 32, 45 | Week numbers, dark theme, 3 time zones, booking pages, invite spam controls | Shipped by Google (see "Already shipped"); at most link them from the settings finder (44) |
| 9 | Move event to another calendar | Exists in the edit page; proper fix needs API for a 2-demand item |
| 10 | Roll over unfinished "TODAY" event | Needs API to modify events; Tasks already roll over |
| 34 | Auto focus time / smart rescheduling | API + the Reclaim reviews show users resent automation they don't control |
| 35 | Recurring / convertible Out of office | API, Workspace-centric |
| 40 | Cost field, life categories, linked events | Needs server-side data model; a different product |
| 42 | Fix search cap / filters | Results come from Google's backend; API would be a parallel search UI |
| 43 | Daily agenda e-mail reliability | An extension cannot send e-mail; item 30 is the local substitute |
| 46b | Recurring tasks with subtasks | Tasks API + OAuth for a 2-demand item (visual task tweaks stay in 22/23) |
| 47 | Desktop / menu-bar app | Not a content-script problem |
| 6 | One event to many calendars | eventedit URL cannot pre-select the calendar; half-solution confuses users |

## 4. Recommended top-10 roadmap

Ordering principle: ship the URL-only features first (they cannot break when Google changes markup),
then the CSS/DOM features behind one shared, self-healing "grid model", then the one big bet that
needs no OAuth. Everything below stays within the current manifest (`calendar.google.com` host
permission, `storage`, `contextMenus`, `alarms`/`notifications`); nothing needs OAuth.

**1. Natural-language Quick Add (item 1, plus items 3 and 4).**
Add a small floating "+" in the shadow root (and the `q`/`Ctrl+K` key when Google's shortcuts are
off) that opens a one-line input. Parse it with a chrono-style grammar inside `src/` (dates, ranges,
"every last friday", "at <place>", "with a@b.com") into the same event object `parseICS` produces,
then call the existing `buildEventEditUrl` and navigate, exactly like the single-event .ics path.
Register a `contextMenus` entry "Add to Google Calendar" that runs the same parser on
`selectionText` and opens the form in a new tab from `background.js`. Expose the recurrence
builder as presets (last day of month, nth weekday, weekdays) that fill `recur=`. No Google DOM
involved; unit tests in `test/` cover the parser.

**2. Event templates (item 2).**
Keep templates in `chrome.storage.sync` (title, duration, location, description, guests, recurrence,
busy/free). A templates panel in the shadow root lists them; clicking one asks for a date/time
(default: the day currently in view, next round hour) and opens the eventedit URL. As an optional
enhancement, listen for right-click on the grid, read the clicked column's date from the visible
day header text, and offer the templates in a context menu; if the header can't be read, fall back
to the date picker, so the feature never breaks completely. "Save as template" can parse an
open event popover (same reader as roadmap item 8).

**3. Grid model + "hide night hours" and "working hours shading" (items 11, 12).**
Build one small module that locates the time gutter (hour labels are plain text, locale-aware via
`Intl`), the day columns (header text contains the date) and the chip layer, using text content and
ARIA roles rather than class names, and that re-validates itself on `MutationObserver` ticks and
URL changes. On top of it: a CSS variable that scales rows outside `[start, end]` to a few pixels
(with chips re-positioned by the same factor), per-weekday/holiday/today background tints, and
shaded blocks per weekday. If the model fails validation, the module disables itself and shows a
one-line "layout changed, tell us" notice instead of corrupting the view (lesson from G-calize's
September 2024 reviews). Settings live in `chrome.storage.sync` with import/export (item 49).

**4. "Now" bar with countdown and one-click Join (item 29).**
Using the grid model, read today's chips (title, start/end from the accessible label, calendar
colour) and render a thin sticky bar at the top of the grid: current event with time left, next
event with countdown, and a Join button if the chip's popover or title contains a Meet/Zoom/Teams
URL. Mirror the countdown into the extension badge via `chrome.action.setBadgeText` from the
content script through a message to `background.js`. While any Calendar tab is open, schedule
`chrome.alarms` for the next starts and raise `chrome.notifications` with a Snooze button (item 30,
tab-open version); state the limitation honestly in the options page.

**5. Weekly totals (item 16).**
With the same chip reader, sum durations per calendar colour (and per keyword when item 25's
rules exist) for the visible range in week/day/custom views, and show them in a collapsible shadow
DOM panel under the mini calendar, with "copy as CSV". Because it only counts what is on screen it
needs no permissions, and it degrades gracefully: when the chip reader fails, the panel says so.

**6. Dim past, declined, tentative and solo events (items 13, 14).**
A timer (every minute) marks chips whose end is before now; declined chips are detected by the
strike-through/outline style Google already applies and tentative ones by their pattern class, so
detection uses computed styles rather than class names. Apply user-chosen opacity (never below 30%,
as Calendar Clarity does) through CSS variables. Add a quick toggle in the Now bar for "show
declined" that deep-links to the right settings section (URL) because the setting itself cannot be
flipped from outside.

**7. Declutter, print and density pack (items 22, 23, 19).**
A set of independent CSS toggles injected into the page (not the shadow root): hide upgrade
promos, Meet buttons on hover, event illustrations, the app bar; sidebar width; "more rows in
month view"; a `@media print` stylesheet that wraps titles, darkens text and removes chrome; two
density presets. Each toggle is tiny and failure-isolated (a stale selector just stops hiding one
thing). Keep a small `selectors.json` so updates after a Google change are one-file fixes.

**8. Export event as .ics and copy day/week as text (items 36, 37, 5).**
Add an "Export .ics" and "Copy" button to Google's event popover by observing for the popover's
dialog role and appending into a shadow host next to it. Read title, time, location, description,
guests from the popover text, build a VEVENT (new `src/ics-write.js`, the mirror of `src/ics.js`) and
download it; "copy visible day/week" reuses the chip reader for Markdown/CSV. Also accept pasted
ICS text (`paste` event on the page) and feed it to the existing modal, so the import side covers
clipboard and not only files.

**9. Settings finder and command palette (items 44, 41).**
A searchable palette (`Ctrl+K`) listing: Google settings deep links (`/r/settings/...` sections with
plain-language names like "stop adding invitations automatically", "week starts on Monday", "show
declined events"), view/date navigation ("go to 14 nov", "4 weeks", "today") built as URLs, and
the extension's own toggles. Because it is URL-driven it cannot break; it also turns a large chunk
of the "annoyances" articles into one-click fixes.

**10. Share availability as text (item 31, the one big bet).**
After the grid model has proven stable for a few releases: a "Share times" mode where the user drags
over free areas of the week view; the extension converts pixel ranges to times through the gutter
mapping, subtracts overlapping chips, and produces a formatted list ("Tue 25 Mar: 9:00-11:00,
14:00-16:00 CET") with a time-zone switch and copy button. Needs no OAuth because it only uses the
visible week, which is exactly how Offer Times works. If precision on the drag proves too fragile,
fall back to click-selecting whole free gaps that the chip reader already knows.

Deliberately not on the roadmap: anything that needs the Calendar API (bulk edit, persistent
recolouring, notifications without a tab, travel blocks). Revisit only if the extension gets enough
users to justify the OAuth verification and the trust cost; the research shows users punish
extensions that ask for broad calendar access.
