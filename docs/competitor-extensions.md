# Competitor extensions for Google Calendar: what they do, what we should absorb

Companion to [`market-research.md`](market-research.md) (49 user complaints, numbered; referenced below as **MR-n**). That document looks at what users ask for; this one looks at what the installed base of Google Calendar extensions already delivers, how, and what people say about it.

## 1. Method and date

Research date: **2026-10-14**.

- Chrome Web Store (CWS) searched in the browser (the store is JS-rendered) for `Google Calendar`, `gcal`, `calendar`, `ics`, `webcal`, `google calendar colors`, `google calendar dark`, `week number`, `hours`, plus every named competitor in the brief (Checker Plus, G-calize, GCal Colors, Event Merge, Calendar Weather, Right-Click Google Calendar, Toggl Track, Clockwise, Reclaim, Zoom, Calendar Companion, Google Calendar Plus, Calendar Enhancer, TimeNavi, Cal.com, Calendly, Notion Calendar, Vimcal, HubSpot, Salesforce, Shift, Kiwi, bookmarklets, ICS importers). "Load more" was clicked until exhausted: **762 unique listings**, **449** of them calendar-related after filtering names/overviews.
- Every one of the 449 detail pages was read in the browser (name, users, rating, #ratings, version, last update, size, "offers in-app purchases", developer, privacy section, overview, screenshots). User counts are the rounded figures the store shows.
- For the 154 candidates with >= ~250 users the CRX package was downloaded and `manifest.json` parsed to classify the approach: **API/OAuth** (has an `oauth2` block / Calendar scopes), **DOM** (content script on `calendar.google.com`), **popup** (own UI, no Calendar page injection). This is more reliable than the listing text.
- The 50 most recent reviews of each top-12 extension were read (sorted by recency; the store's star filter is not linkable). Quotes below are verbatim, reviewer name and date as shown on the store; the links go to the extension's review tab.
- Developer sites read where the listing was thin: jasonsavard.com, gcalplus (Neil Gerstenberg), calendarclarity.com, bluenexa GitLab, offer-times.com, trysundial.ai, calcheckr.com, shadecalendar.com, patii.uk, text-to-cal.com, flowtrace.co, manganum.app.
- Firefox: AMO public API (`/api/v5/addons/search/?q=google calendar&sort=users`). Edge: Add-ons store search page in the browser (shows no install counts).
- Google-shipped features: Google Workspace Updates blog (feed read 2026-10-14) plus the items already marked shipped in MR.

Caveats: CWS user counts are rounded buckets (300,000 can mean 300k-399k); AMO reports *average daily users*, not installs; several large extensions (Zoom, Boomerang, Calendly, Todoist, Toggl, HubSpot) only touch Google Calendar as a side feature and are listed as "adjacent", not ranked as competitors.

## 2. Ranked table

### 2.1 Extensions whose main job is Google Calendar (ranked by users)

| # | Extension | Users | Rating (#) | Updated | Price | Approach | One-line pitch |
|---|---|---:|---|---|---|---|---|
| 1 | [Checker Plus for Google Calendar](https://chromewebstore.google.com/detail/hkhggnncdpfibdhinjiegagmopldibha) | 300,000 | 4.3 (2.1K) | 2026-10-14 | freemium ("extra features" contribution) | API/OAuth (calendar, tasks), optional DOM | Calendar in a toolbar popup with desktop notifications, snooze, quick add, Tasks; by far the most complete. |
| 2 | [G-calize](https://chromewebstore.google.com/detail/piiljfhidimfponnkjlkecnpjhdijfde) | 200,000 | 4.0 (218) | 2026-08-16 | free | DOM/CSS | Colour weekdays, weekends, holidays and today in the grid. |
| 3 | [Custom Calendar Background](https://chromewebstore.google.com/detail/acjecbgflnhmeldadcbblhfdimhifpki) | 200,000 | 3.8 (149) | 2026-02-09 | freemium (theme packs) | DOM/CSS | Put your own image behind Google Calendar. |
| 4 | [Button for Google Calendar](https://chromewebstore.google.com/detail/lfjnmopldodmmdhddmeacgjnjeakjpki) | 100,000 | 4.3 (210) | 2026-09-06 | free (ad-supported) | API/OAuth (calendar.readonly) | Agenda popup in the toolbar, reminders, one-click join Meet/Zoom/Teams. |
| 5 | [More Colors for Calendar!](https://chromewebstore.google.com/detail/gmfgalicoeacemhkeakceigfeofbchod) | 70,000 | **1.1** (274) | 2023-01-24 | free | DOM | Custom colours in the event colour picker. Broken; Google now ships this. |
| 6 | [GCalPlus](https://chromewebstore.google.com/detail/mjelhipeelammmhpghkpigkdonihkakj) | 70,000 | 3.9 (160) | 2026-07-18 | free | DOM + optional API/OAuth | 30+ "look & feel" switches: expanded month grid, time range, hide duplicates, hover popups, multiple copy. |
| 7 | [Manganum: Sidebar with Gmail and Google Calendar](https://chromewebstore.google.com/detail/jbfeongihppeenfnaofmdeikahaefljd) | 50,000 | 3.3 (1.2K) | 2026-10-13 | freemium (7-day trial, then paid) | own sidebar UI | Side panel with Calendar, Gmail, Tasks, Keep, ChatGPT. |
| 8 | [Calendar Selector for Google Calendar](https://chromewebstore.google.com/detail/nmliklikilkjommabacojbijjimlgjck) | 40,000 | 4.5 (36) | 2025-08-16 | free, open source | DOM | Save and restore groups of selected calendars (presets, shortcut). |
| 9 | [Tags for Google Calendar](https://chromewebstore.google.com/detail/ncpjnjohbcgocheijdaafoidjnkpajka) | 30,000 | 3.9 (85) | 2024-02-28 | free | DOM/CSS | `Tag: title` becomes a coloured tag chip; `title?` renders as tentative. |
| 10 | [Calendar Clarity](https://chromewebstore.google.com/detail/fadonemflmjiddpmnpehmiemedpjdgml) | 20,000 | 4.1 (59) | 2026-09-21 | free (sign-in for actions) | DOM + optional API/OAuth | Dim solo/external/declined events, unlimited named colours, focus timer, event actions. |
| 11 | [crx-gcal-url-opener](https://chromewebstore.google.com/detail/pjginhohpenlemfdcjbahjbhnpinfnlm) | 10,000 | 4.8 (9) | 2024-11-29 | free | API/OAuth | Auto-opens the Meet/Zoom link one minute before each event. |
| 12 | [Clockwise (deprecated)](https://chromewebstore.google.com/detail/hjcneejoopafkkibfbcaeoldpjjiamog) | 10,000 | 4.4 (89) | 2026-03-28 | free | popup | Legacy shell of the Clockwise SaaS; the product moved out of the extension. |
| 13 | [ICS to GCal](https://chromewebstore.google.com/detail/ljobcbehhifehkmamikmchekbbljopao) | 10,000 | 3.7 (27) | 2024-10-26 | free | API/OAuth | Right-click an .ics link to import it into a chosen calendar. |
| 14 | [Hue: More Colors for Google Calendar](https://chromewebstore.google.com/detail/gglmljnnfgfkajefpbgjaeobelpokhbn) | 10,000 | 3.5 (42) | 2025-01-21 | free | DOM | Extra colour palette (pre-dates Google's custom colours). |
| 15 | [Google Calendar Quick Duplicate](https://chromewebstore.google.com/detail/belnijodgolpgmpahmdkjbjehbobnfpd) | 10,000 | 4.0 (119) | 2024-06-17 | free, open source | DOM | "Duplicate" icon on the event card; alt+click duplicates. |
| 16 | [Google Calendar Event Checker](https://chromewebstore.google.com/detail/ignkdmgghpdgdlnljcmimlabaiekglhg) | 10,000 | 4.4 (43) | 2026-09-11 | freemium | DOM | Mark events done/cancelled with emoji, checkmark or strikethrough. |
| 17 | [Easy Grouping for Google Calendar](https://chromewebstore.google.com/detail/kohnpgjnebgngobifoimegihoblapbnl) | 10,000 | 4.5 (13) | 2026-05-11 | free | DOM | Named groups of calendars, switch in one click. |
| 18 | [App for Google Calendar](https://chromewebstore.google.com/detail/bkefjjedeepgicbfgckepjoklaebjcde) | 10,000 | 4.9 (118) | 2026-01-16 | free | own UI + optional OAuth | Mini calendar in a popup. |
| 19 | [Cal Merge for Google Calendar](https://chromewebstore.google.com/detail/dchpdbljalbfnelbfbgncfidhjoibkah) | 10,000 | 4.4 (25) | 2024-10-28 | free | DOM | Merge the same event shown on several calendars into one striped chip (Event Merge successor). |
| 20 | [Google Calendar Weekend Highlighter](https://chromewebstore.google.com/detail/pdbcjcpinemooahpfnncddnmjgjhcfod) | 9,000 | 4.1 (56) | 2025-01-17 | free | DOM/CSS | Shade Saturday/Sunday columns. |
| 21 | [Calendar Extension for Google Calendar](https://chromewebstore.google.com/detail/dfbpjijneaihingmldgpgcodglkoamoe) | 7,000 | 4.5 (46) | 2026-10-03 | free | API/OAuth | Toolbar popup: day/week/month, create, RSVP, join, reminders (Alt+C). |
| 22 | [Google Calendar Disable Month Scroll](https://chromewebstore.google.com/detail/fhcfmpoiniaamlhkcpiaahokbpibjjoh) | 5,000 | 4.3 (45) | 2022-05-02 | free | DOM | Kills the month-view scroll wheel navigation. |
| 23 | [GcalColor](https://chromewebstore.google.com/detail/edegnmdhngniabdiiidplepangdoccna) | 5,000 | 4.5 (21) | 2024-05-25 | free | DOM/CSS | Event titles in the calendar colour, hide the dots (pre-2018 look). |
| 24 | [Add More Colors to Calendar](https://chromewebstore.google.com/detail/jgemmpmngfhhnfgielmdjajdccchedap) | 5,000 | 3.4 (42) | 2026-09-11 | freemium | DOM + OAuth | Custom palette that survives via API writes. |
| 25 | [Text to Google Calendar](https://chromewebstore.google.com/detail/bhgecckohnfhidakkkfanjmoedlaoine) | 4,000 | 3.3 (32) | 2026-06-09 | freemium | popup | Highlight text on any page, get an event (LLM parsing, multi-event, recurring). |
| 26 | [Multiple Calendars Selector](https://chromewebstore.google.com/detail/dlfbgdklfofchbhpeimkpepfldhkpojn) | 4,000 | 4.0 (28) | 2025-09-29 | free | DOM | Lightweight Calendar Selector alternative. |
| 27 | [Merge duplicate Google Calendar events into one rainbow](https://chromewebstore.google.com/detail/bdamkdibjdpgnpfpkbelkdngdcbbaeog) | 4,000 | 4.5 (22) | 2025-03-18 | free | DOM | Another Event Merge fork. |
| 28 | [Calendar Color Labels](https://chromewebstore.google.com/detail/nhbijjgmjdfoppaoogknapfokimbgjbp) | 4,000 | 3.1 (30) | 2022-05-24 | free | DOM | Name your 11 colours in the picker. |
| 29 | [Shade Calendar: Time Blocking](https://chromewebstore.google.com/detail/hdlfamnpialfmlkddnmijnimciflhbjo) | 3,000 | 3.7 (35) | 2026-05-24 | freemium | DOM/CSS | Recurring shaded time blocks (work hours, childcare, focus). |
| 30 | [Offset start-times in Google Calendar](https://chromewebstore.google.com/detail/lpgnioiegbijnllaabmnnjflkfnjnhbn) | 3,000 | 4.2 (10) | 2024-11-25 | free | DOM | New events default to :05 past the hour. |
| 31 | [Google Calendar Quick Add](https://chromewebstore.google.com/detail/nfjgfiefpjgdaocehhmegfnokjniemjm) | 3,000 | n/a (10) | 2026-05-04 | free | popup/URL | Right-click selected text, open pre-filled event page. |
| 32 | [Google Calendar Dark Mode](https://chromewebstore.google.com/detail/nbefdmllbjackokegljnjidmebhojghn) | 3,000 | n/a (5) | 2024-07-20 | free | CSS | Dark theme (Google now ships one). |
| 33 | [Toolset for Google Calendar](https://chromewebstore.google.com/detail/ckjjfpcdnccfjnkpnlfndpmlbdlohgcm) | 2,000 | 4.2 (13) | 2026-10-12 | free | DOM | Duration on chips, hover info, export event as .ics, more. |
| 34 | [Sundial: Google Calendar Reimagined for Enterprise](https://chromewebstore.google.com/detail/dkcgdknimgiffognmpiheegpfkkmcapk) | 2,000 | 4.9 (38) | 2026-10-09 | freemium | DOM + backend | Unlimited time zones, drag-to-share times, coworker time zones. |
| 35 | [Meeting Cost for Google Calendar](https://chromewebstore.google.com/detail/bjfhkjgmnlabpopcmgagbdgjfelndpfj) | 2,000 | 4.2 (5) | 2026-07-21 | free + paid plans | DOM + OAuth | Live cost estimate and policy nudges in the event editor. |
| 36 | [Google Calendar Time Spent](https://chromewebstore.google.com/detail/cfodljgdikllebejmhoifnmmcbfmamij) | 2,000 | 3.7 (29) | 2025-06-06 | free | DOM | Hours per colour for the visible week. |
| 37 | [Event Merge for Google Calendar (MV3)](https://chromewebstore.google.com/detail/fjaidefhllhbbhlfnnopcoljnhimiakp) | 2,000 | 4.8 (13) | 2026-02-10 | free, open source | DOM | MV3 port of the original Event Merge. |
| 38 | [Calendar Plus](https://chromewebstore.google.com/detail/kgbbebdcmdgkbopcffmpgkgcmcoomhmh) | 2,000 | 4.4 (22) | 2025-03-18 | free | DOM | Time charts, rule-based calendar assignment, title autocomplete, ghost events, condensed UI. |
| 39 | [Google Calendar Export GCal to CSV](https://chromewebstore.google.com/detail/fgomfahnlnkadfcbnlbfddbdfhckbamm) | 2,000 | 2.4 (15) | 2026-02-14 | free | DOM | Export visible events to CSV. |
| 40 | [Google Calendar Bulk Edit](https://chromewebstore.google.com/detail/kklojeonebikceffbffplnkajeckobbk) | 1,000 | 3.4 (5) | 2026-04-11 | free | DOM + OAuth | Marquee-select events, move or delete together. |
| 41 | [Custom Fields for Google Calendar](https://chromewebstore.google.com/detail/einookkhlkagdckkngcebldmicpilpmk) | 1,000 | 3.4 (27) | 2026-10-12 | free | DOM | Dropdown/date/checkbox fields on events. |
| 42 | [Google Calendar Natural Language Input](https://chromewebstore.google.com/detail/lgbbobpcjmjjdkobkellebdecpmfhipg) | 700 | 4.5 (10) | 2026-07-10 | free | DOM | Omnibox-style natural language event creation. |
| 43 | [Private Notes for Google Calendar](https://chromewebstore.google.com/detail/hkgjdddpkjdmondkjcbfpokacehkoljj) | 655 | 2.8 (9) | 2024-10-07 | free | DOM | Local notes attached to an event. |
| 44 | [RIP Quick Add](https://chromewebstore.google.com/detail/dpefadnnccbgjhgnnjilfgefcoallmji) | 534 | 4.4 (8) | 2025-01-24 | free, open source | popup/URL | Natural language in 10 languages, right-click selection. |
| 45 | [Bulk Edit, Move Events & Desktop - Pro](https://chromewebstore.google.com/detail/cfhahikbjmmkbiobhlgecilahemdfgph) | 460 | 4.5 (12) | 2026-10-13 | freemium | DOM + OAuth | Multi-move, bulk delete with undo, dark mode, "desktop app". |
| 46 | [Offer Times](https://chromewebstore.google.com/detail/obbaniekmhmiaidhihmnllgicfifedjb) | 295 | 4.9 (16) | 2026-09-28 | freemium | DOM + OAuth | Select free slots, copy them as text converted to the recipient's time zone. |
| 47 | [BoldCal: Weather in Google Calendar](https://chromewebstore.google.com/detail/kbcpnhhakolikaclafnlckpjikbhockf) | 197 | 3.4 (5) | 2025-08-15 | free | DOM + own API | Weather icons on day headers. |

Not found on CWS (October 2026): **Reclaim.ai** (no extension), **Vimcal** (no extension), **Notion Calendar** (desktop app only), **TimeNavi** (zero results), the original **Event Merge** (MV2, removed; three forks above), **Calendar Weather** (59 users), **Right-Click Google Calendar** (840 users as "Google Calendar Right Click"). **Clockwise** exists as a deprecated shell.

### 2.2 Adjacent (Calendar is a side feature; for scale only)

| Extension | Users | Rating (#) | Approach | What it does with Google Calendar |
|---|---:|---|---|---|
| [Zoom Chrome Extension](https://chromewebstore.google.com/detail/kgjfgplpablkjnlkjmjdecgdpfankdle) | 8,000,000 | 3.7 (1K) | DOM on calendar.google.com | "Make it a Zoom meeting" button in the event editor. |
| [HubSpot Sales](https://chromewebstore.google.com/detail/oiiaigjnkhngdbnoookogelabohpglmd) | 1,000,000 | n/a | side panel, `*://*/*` | Meeting links and CRM logging; Calendar sync happens server-side. |
| [Boomerang for Gmail](https://chromewebstore.google.com/detail/mdanidgdpmkimeiiojknlnekblgmpdll) | 900,000 | 4.9 (2.1K) | Gmail UI | Share availability from Gmail (reads Calendar via its backend). |
| [Calendly Browser Extension](https://chromewebstore.google.com/detail/cbhilkcodigmigfbnphipnnmamjfkipp) | 700,000 | 3.8 (153) | DOM (Gmail/LinkedIn) | Insert booking links and ad-hoc times. |
| [Todoist for Chrome](https://chromewebstore.google.com/detail/jldhpllghnbhlbpcmnajkpdmadaolakh) | 500,000 | 4.8 (51.4K) | popup | Task planner; Calendar sync is a Todoist account feature. |
| [Toggl Track](https://chromewebstore.google.com/detail/oejgccbfbmkkpaidnkphaiaecficdnfn) | 300,000 | 3.1 (1.5K) | DOM on 100+ sites incl. Calendar | Start a timer from a Calendar event. |
| [Meeting Scheduler for Gmail (cloudHQ)](https://chromewebstore.google.com/detail/dibjpgjiefaibdinijeddhaiiphfhejp) | 30,000 | n/a | Gmail UI | Booking pages. |
| [Cal.com Companion](https://chromewebstore.google.com/detail/cbhlgojmamgmdijlkkokcmmjghgckahc) | 1,000 | n/a | DOM | Insert Cal.com links. |

### 2.3 Firefox and Edge (brief)

Firefox (AMO, average daily users): Zoom 192k, Toggl Track 9.6k, **Pinned Google Calendar** 8.2k (4.3, 52), Calendly 7.3k, **Checker Plus** 4.1k (4.3, 132), Open Google Calendar toolbar button 1.9k, Google Cal Event Merge 594 (last updated 2019), G-CAL Highlighter 410. Offer Times also ships a Firefox build. Conclusion: Firefox is ~1-2% of the Chrome audience for this niche; Checker Plus is the only full-featured competitor present there.

Edge Add-ons (search "google calendar", 27 results, no user counts displayed): Checker Plus, Calendar Extension, Google Calendar Quick Add, Calendar Clock, Text to Google Calendar, Show/Hide all calendars buttons, Task Counter & Arrow Buttons, Custom Labels & Colors, Colorize your Calendar, Bulk Move Events (TryoTrix), Event Exporter CSV, CalendarBoost, Pomodoro Timer for Google Calendar, Calendar Liberator. Nothing Edge-only of note; Edge users install CWS extensions directly.

## 3. Top 10 in depth

Review links point at each listing's `/reviews` tab (the store does not deep-link to individual reviews). Star counts are from the 50 most recent reviews read on 2026-10-14.

### 3.1 Checker Plus for Google Calendar (300,000 users, 4.3 / 2.1K) — Jason Savard

Approach: MV3, OAuth scopes `calendar`, `calendar.readonly`, `calendar.events`, `tasks`; permissions `alarms, storage, tts, idle, contextMenus, notifications, activeTab, gcm, identity, unlimitedStorage, system.display, offscreen, scripting, sidePanel`; optional host `calendar.google.com`. Closed source. Side panel supported. Free core; "extra features" unlocked by a one-time contribution (themes/skins, some creation flows; the developer confirms in review replies that "all themes and skins were always part of the extra features").

Features (listing + jasonsavard.com):
- Toolbar popup / side panel showing agenda, day, week, month without opening Calendar; multiple Google accounts.
- Desktop notifications with **snooze**, rich popup reminders, **voice (TTS) reminders**, idle-aware delivery, Do Not Disturb hours, notifications even when Chrome's Calendar tab is closed.
- Quick add from the popup, natural-language parsing, **create events from selected text / context menu**, from the current page's content and links (a reviewer reports this disappeared after an update).
- Google Tasks in the popup.
- One-click **join Meet / Zoom** from the notification, auto-open meeting link.
- Badge with countdown or next-event time; today's date on the icon.
- Themes, skins, dark mode (paid tier); custom notification sounds; keyboard shortcuts; print agenda; offline cache.
- Firefox and Edge builds.

Reviews (16 x 1-star, 12 x 2-star, 50 x 5-star in the last 50) — [reviews](https://chromewebstore.google.com/detail/hkhggnncdpfibdhinjiegagmopldibha/reviews):
- Praise: "Honestly the best google chrome extension for google calendar. I use it for all my profiles. Easy to use with the best features and visuals." (Abisoye David Oke-lawal, Nov 11, 2025). Users praise notifications and the multi-account popup.
- Complaints: paywall perception, "This extension wants you to PAY for something that's already free. If you don't pay, it's just essentially a glorified way to LOOK at your google calendar" (Red Alert, Jul 26, 2026); "Used to have a dark theme, got signed out somehow and had to reattach, now behind payment" (T L, Aug 2, 2026); regressions after updates, "every time I get a popup and after I close it I get left with a blank box that I cant get rid of" (Michael Troya, Jan 16, 2026); whitespace/truncated titles after v46.2.1; OAuth "grant access" failing; a beloved feature (page content to event) vanishing.
- Takeaway: the market leader is an **API/OAuth notification client**, not an in-page enhancer. Its weak spots are trust (paywall surprises, closed source) and update regressions. Nothing it does in-page overlaps with us except quick add from selection.

### 3.2 G-calize (200,000 users, 4.0 / 218) — Yō Wauke

Approach: DOM/CSS content script on `calendar.google.com/calendar/*`; permissions `tabs, storage, contextMenus`; no OAuth. Settings in the popup (only works while a Calendar tab is active). Explicitly **does not work on custom Workspace domains** (MR-49).

Features:
- Text and background colour per weekday (Mon-Sun) applied to column headers, month cells and the mini calendar.
- Holiday colouring from Google's regional holiday calendars (strong Japanese user base).
- Today highlight colour.
- Hover highlight of the day column; optional time-grid tweaks.
- Light/dark aware presets.

Reviews (5 x 1, 8 x 2, 18 x 5) — [reviews](https://chromewebstore.google.com/detail/piiljfhidimfponnkjlkecnpjhdijfde/reviews):
- Praise: "This is perfect! Should be an option on Google Calendar!" (Victor, Apr 25, 2026); "I took a little time to customize the calendar colors and, now, it's so pretty and functional!" (Joshua Jacks, Jan 24, 2025).
- Complaints: "lack of export/import settings is disappointing. Manually configuring same settings on another PC is a real hassle" (H Y, Oct 10, 2024); "Doesn't work when I click on it" (Kelly Farrar, May 1, 2024) because the popup only works on the Calendar tab.
- Takeaway: 200k users for day colouring alone (MR-12). We already ship weekend/holiday/today colours; what people miss is **settings sync/export** (MR-49) and discoverability of the settings entry point.

### 3.3 Custom Calendar Background (200,000 users, 3.8 / 149) — Patrick Coleman

Approach: DOM/CSS; permissions `storage, identity, identity.email` (sign-in only to attach purchases); no Calendar OAuth. Free with a user-supplied image URL; curated theme packs are paid.

Features: background image by URL; opacity/blur/tint sliders so the grid stays readable; per-view behaviour; theme packs; survives Calendar redraws (mostly).

Reviews (10 x 1, 4 x 2, 19 x 5) — [reviews](https://chromewebstore.google.com/detail/acjecbgflnhmeldadcbblhfdimhifpki/reviews):
- Praise: "Works great, and was able to make my own graphic on canva ... Would be nice to be able to upload a file directly tho" (Kevyn Wang, Jan 26, 2026); "great! easy to paste own image urls in" (Aliana Thompson, Jan 25, 2026).
- Complaints: "It works for a second before it glitches and the picture isnt there anymore" (Harpuneet D, Apr 1, 2026); "it washes out the color of my 'all day' tasks and makes the text blurry" (sk, Jan 23, 2026).
- Takeaway: cosmetic, large audience (students), fragile against Google's CSS. Low value for a "power user" product; cheap to add as a setting if we want the audience.

### 3.4 Button for Google Calendar (100,000 users, 4.3 / 210) — BrowseCraft

Approach: MV3, OAuth `calendar.readonly`; permissions `alarms, identity, notifications, storage`. Own popup UI, nothing injected into Calendar. One Google account only; listing discloses ads.

Features: agenda popup (today/upcoming), reminders via Chrome notifications, join Meet/Zoom/Teams from the popup, quick link to create event, badge countdown.

Reviews (10 x 1, 30 x 5) — [reviews](https://chromewebstore.google.com/detail/lfjnmopldodmmdhddmeacgjnjeakjpki/reviews):
- Praise: "It's working nicely and is ... quite useful and simple! If it included desktop notifications as well, it'd be even better yet" (Bob Loucks, Jun 6, 2026).
- Complaints are about trust, not features: "Invasive, deceitful extension that opens up tabs that advertise for their other plug-ins. Shady marketing by shady people." (Jeffrey Munn, Jun 9, 2025, 12 helpful votes); "This addon opens a new tab with url joycast.ai when installed" (Igor Zviagintsev, Sep 10, 2025); "Developer themselves admitted that this extension is the one responsible for the shady pop-ups" (T (Tina), Sep 24, 2026).
- Takeaway: a 100k-user product whose top complaints are about the publisher's behaviour. Direct evidence that "no data collection, no ads, open source" sells (MR-49).

### 3.5 More Colors for Calendar! (70,000 users, 1.1 / 274, last updated January 2023)

Approach: DOM; permissions `declarativeContent, storage`. Injects extra swatches into the colour picker and re-colours chips client-side.

Reviews: 45 of the last 48 are 1-star — [reviews](https://chromewebstore.google.com/detail/gmfgalicoeacemhkeakceigfeofbchod/reviews): "Spent a lot of time adding colours. Was very excited. This program does NOTHING." (Deborah Schroeder, Apr 25, 2026); "Not work i'm now using [Add More Colors to Calendar]" (Michael Elbaz, Aug 2, 2026).
- Takeaway: a cautionary tale. Client-side-only colours break the moment Google changes the DOM, and Google shipped **custom event colours (24 defaults + RGB) in June 2026**, making the whole category obsolete. Skip (MR-25 covers rule-based colouring, which is different).

### 3.6 GCalPlus (70,000 users, 3.9 / 160) — Neil Gerstenberg

Approach: DOM content script plus optional OAuth (`calendar.readonly`, `calendar.settings.readonly`, openid/email/profile) used for descriptions on hover, Multiple Copy and Change Calendar. Permissions `scripting, activeTab, storage, identity, webNavigation, declarativeContent`. Free (donations). The CRX ships an OAuth client secret in the manifest (bad practice, noted and not reproduced here).

Features ("Look" tab): Expand the Month Grid (more rows, more events per day), Alphabetical All Day Events, Highlight Busy/Free, Hide Duplicate Invitations, Hide Images (profile pictures), Solid Tasks / Remove Task Circles, Large Dots Small Numbers (compact day/week headers), Hide Upgrade button, Colour Timed Events, Timed Bars (timed events drawn like all-day bars in month/year), Weekend Color, Adjacent-month date colour / hide, Today's Border, Dark mode toggle. ("Feel" tab): Disable Month Scrolling, Use L/R Arrows, Expand Overlapping Timed Events on hover, Show Titles/Descriptions on Hover, Disable Clicks on Location, Create Events from Year Previews, **Multiple Copy** (duplicate to one/many dates, with/without guests, via API), **Change Calendar in Event Popups** (delete + recreate via API), **Time Range** (hide hours before/after).

Reviews (8 x 1, 1 x 2, 28 x 5) — [reviews](https://chromewebstore.google.com/detail/mjelhipeelammmhpghkpigkdonihkakj/reviews):
- Praise: "Removes the excess times of day outside of our working hours so I don't have to scroll through" (Admin Slocum, Apr 24, 2026); "Love it for showing events in year view" (Alex, Oct 14, 2026); "What a legend for making this ... a real bugbear having migrated over to Google Calender" (Richard B, Aug 18, 2026).
- Complaints: popup "opens for a split second, closes, and just reloads the calendar tab" (Yuri Yang, Aug 10, 2026); "Time Range doesn't seem to change anything" (Kazutoshi Takayama, Apr 17, 2026); confusion about having to purchase (it is free).
- Takeaway: the closest thing to our product philosophy (many small DOM switches). Its most-praised features are **Time Range** (MR-11), **Expand the Month Grid** (MR-19), **hover descriptions** (MR-48) and **Multiple Copy**. Fragility and settings-UX complaints are the gap to beat.

### 3.7 Manganum (50,000 users, 3.3 / 1.2K)

Approach: own side panel (`sidePanel`, `scripting`, `history`, `cookies`, `bookmarks`, `topSites`, broad host access). Loads Google Calendar/Gmail/Keep/Tasks/ChatGPT/Todoist as embedded panels. 7-day trial then subscription.

Reviews: 37 of the last 52 are 1-star — [reviews](https://chromewebstore.google.com/detail/jbfeongihppeenfnaofmdeikahaefljd/reviews): "SCAM! It is not free, you need to pay after a 7 day trial" (Enes Akdeniz, Sep 7, 2026, 7 helpful); "Good in terms of utility but horribly invasive ... too pushy" (rohan panchal, Sep 10, 2026).
- Takeaway: not a Calendar competitor; it is a sidebar launcher with a hostile paywall. Skip.

### 3.8 Calendar Selector for Google Calendar (40,000 users, 4.5 / 36) — bluenexa (open source, [GitLab](https://gitlab.com/bluenexa/google-calendar-selector))

Approach: DOM; permission `storage`; data stays local except Chrome's built-in sync.

Features: save the current set of checked calendars as a named preset; restore with one click from an injected toolbar menu; keyboard shortcut (Ctrl+Alt+E) to switch; "only this calendar" quick toggle; presets synced via `chrome.storage.sync`.

Reviews (1 x 1, 1 x 2, 15 x 5) — [reviews](https://chromewebstore.google.com/detail/nmliklikilkjommabacojbijjimlgjck/reviews): "Surprised Google has not already come up with something like this by now. Really helps me have multiple calendars for different reasons" (CJ Swanberg, Apr 6, 2026); wish: "ctrl+alt+e would also allow you to type the names of presets" (Rinske Wijtmans Robinson, Jul 17, 2025); older complaint "Only worked half of the time for me" (Orest Tarasiuk, Nov 24, 2021), who then built Multiple Calendars Selector (4,000 users). Easy Grouping (10,000 users) is the same idea.
- Takeaway: three extensions, ~54k users combined, for one small DOM feature Google does not offer: **calendar selection presets**. Not in MR; easy for us (we already have a command palette to type preset names, which is exactly the wish above).

### 3.9 Tags for Google Calendar (30,000 users, 3.9 / 85)

Approach: DOM/CSS content script, no permissions at all, no settings UI.

Features: the text before the first `:` in a title is rendered as a coloured tag chip (colour hashed from the tag text); a title ending in `?` is rendered italic/semi-transparent as "tentative"; works in all views.

Reviews (8 x 1, 3 x 2, 24 x 5) — [reviews](https://chromewebstore.google.com/detail/ncpjnjohbcgocheijdaafoidjnkpajka/reviews): "This app made my calendar beautiful. 12/10 stars" (Alice Minium, Jul 17, 2026); feature requests for more markers "with the use of ';' or '!' and different color labels" (Laura Gil, Apr 4, 2025). Complaints: "Have no idea how to use this ... There are no directions" (Gas-Pro LLC Bailey, Dec 2, 2025); "when I click on this extension a youtube video for some animated movie opens up" (Phoenix Counseling, Apr 9, 2025, 15 helpful).
- Takeaway: title conventions are a zero-permission way to get **categories without OAuth**. Users want it configurable (which markers, which colours) and documented. Pairs with our hours-by-colour totals (tag totals) and with MR-25 rule-based colouring.

### 3.10 Calendar Clarity (20,000 users, 4.1 / 59) — Ali B ([calendarclarity.com](https://calendarclarity.com))

Approach: DOM content script; `storage, activeTab`, optional `identity` with optional `calendar.events` scope for event actions. Basic use needs no account.

Features: dim **solo** events (only you), **external** invites, **declined** and **tentative** events, each with its own opacity; unlimited **named colours** and colour groups applied client-side (reviews note they vanish in incognito or after some refreshes); hover details card; **focus timer** on the current event, ambient sounds, "Zen mode" that hides chrome; **event actions** on the popup (duplicate, split, spread across days, postpone, reschedule, extend; API); multi-calendar support; phone-synced colours via API writes.

Reviews (6 x 1, 3 x 2, 24 x 5) — [reviews](https://chromewebstore.google.com/detail/fadonemflmjiddpmnpehmiemedpjdgml/reviews): "Have loved using this app originally just for the colors ... Love the added focus feature" (Stephanie Neaves, Jul 22, 2026); "so glad it's up and working again after the update. I will say, there is an issue where the screen freezes and goes blurry" (Livi Van Steenberg, Jul 26, 2026). Complaints: "This doesn't work. Not sure if it's the most recent google calendar update" (Dana Sibilio, Jul 8, 2026); "Everytime I refresh the page, the color assigned is gone" (Esha Budhiraja, Feb 2, 2026); "It is having to many glitches, and I have to keep turning it off and back on" (Gas-Pro LLC Bailey, Aug 13, 2026).
- Takeaway: the richest "declutter" feature set (MR-14 exactly), and a demonstration that client-side colour overrides without persistence frustrate users. Event actions behind OAuth are the part we would not copy.

### Honourable mentions (ranks 11-47, one line each)
Quick Duplicate: one-click duplicate is loved but DOM-fragile ("no button is shown" Sep 2026) and jumps to today when used on far dates. Event Checker: done/cancelled marks turn Calendar into a task tracker, 10k users, freemium. Cal Merge / Event Merge forks: ~16k users want **duplicate events merged into one striped chip** with a wildcard for "busy" (MR-18). Toolset: duration on chips + hover info + export .ics, all DOM (MR-15/36/48). Time Spent and Calendar Plus: hours-per-colour (MR-16), charts, rule-based calendar assignment (MR-25), title autocomplete, ghost events. Shade Calendar: recurring shaded time blocks (MR-12 shading). Offer Times / Sundial: share availability as text with time-zone conversion (MR-31), Sundial adds unlimited world clocks. RIP Quick Add / NL Input / Quick Add / Text to GCal: natural-language event creation (MR-1/3) in four flavours, the paid one using an LLM. ICS to GCal: import via API (MR-5, our core). Offset start-times: default :05 starts. Private Notes / Custom Fields: per-event metadata stored locally (MR-38). Bulk Edit (two of them): marquee multi-select and move (MR-8), both need OAuth. BoldCal: weather on headers (MR-39), 197 users.

## 4. Feature matrix (top 10)

Y = yes, P = partial, $ = paid tier, - = no. Columns: CP Checker Plus, GZ G-calize, CB Custom Background, BT Button, MC More Colors, GP GCalPlus, MG Manganum, CS Calendar Selector, TG Tags, CC Calendar Clarity. "Others" lists smaller extensions that have the feature. **BGC** = Better Google Calendar today (per README).

| Feature | CP | GZ | CB | BT | MC | GP | MG | CS | TG | CC | Others | BGC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Agenda popup / side panel outside Calendar | Y | - | - | Y | - | - | Y | - | - | - | App for GCal, Calendar Extension | - |
| Desktop notifications, snooze, TTS | Y | - | - | P | - | - | P | - | - | - | Calendar Extension | - |
| Auto-open / one-click join meeting link | Y | - | - | Y | - | - | Y | - | - | - | crx-gcal-url-opener | P (Join on now bar) |
| Google Tasks in extension UI | Y | - | - | - | - | - | Y | - | - | - | | - |
| Weekday / weekend colours | - | Y | - | - | - | P | - | - | - | - | Weekend Highlighter, Gray Weekends | Y |
| Holiday colours | - | Y | - | - | - | - | - | - | - | - | | Y |
| Today highlight / border | - | Y | - | - | - | Y | - | - | - | - | | Y |
| Hide hours outside a time range | - | - | - | - | - | Y | - | - | - | - | | Y (night reduction) |
| Working-hours / recurring time-block shading | - | - | - | - | - | P | - | - | - | - | Shade Calendar | Y |
| Event title in calendar colour, hide dots | - | - | - | - | - | Y | - | - | - | - | GcalColor | - |
| Extra / custom colour palette | - | - | - | - | Y | - | - | - | - | Y | Hue, Add More Colors, Color Labels | - (Google shipped) |
| Rule-based colouring / calendar assignment | - | - | - | - | - | - | - | - | P | P | Calendar Plus | - |
| Title-convention tags (`Tag:`) | - | - | - | - | - | - | - | - | Y | - | | - |
| Dim declined / tentative / solo / external | - | - | - | - | - | - | - | - | P | Y | Calendar Plus (ghost) | P (declined) |
| Dim past events | - | - | - | - | - | - | - | - | - | - | | Y |
| Duration / end time on chips | - | - | - | - | - | P | - | - | - | - | Toolset | - |
| Hours totals per colour / calendar, charts | - | - | - | - | - | - | - | - | - | - | Time Spent, Calendar Plus | Y (by colour) |
| Expanded month grid / more all-day rows | - | - | - | - | - | Y | - | - | - | - | Disable Month Scroll | - |
| Compact headers / density / hide Upgrade & avatars | - | - | - | - | - | Y | - | - | - | P (Zen) | | Y (declutter, density) |
| Hide duplicate invitations / merge duplicates | - | - | - | - | - | Y | - | - | - | - | Cal Merge, Event Merge MV3, Rainbow | - |
| Hover card with title / description | - | - | - | - | - | Y | - | - | - | Y | Toolset | - |
| Expand overlapping events on hover | - | - | - | - | - | Y | - | - | - | - | | - |
| Duplicate event (one click) | - | - | - | - | - | Y(API) | - | - | - | Y(API) | Quick Duplicate (DOM), Bulk Edit Pro | - |
| Move event to another calendar from popup | - | - | - | - | - | Y(API) | - | - | - | - | | - |
| Bulk select / move / delete | - | - | - | - | - | - | - | - | - | - | Bulk Edit, Bulk Edit Pro ($) | - |
| Split / spread / postpone / extend actions | - | - | - | - | - | - | - | - | - | Y(API) | | - |
| Mark event done / cancelled | - | - | - | - | - | - | - | - | - | - | Event Checker | - |
| Calendar-selection presets | - | - | - | - | - | - | - | Y | - | - | Easy Grouping, Multiple Calendars Selector | - |
| Natural-language / selected-text event creation | $ | - | - | - | - | - | - | - | - | - | RIP Quick Add, NL Input, Quick Add, Text to GCal ($) | Y (EN/ES) |
| Event templates / presets | - | - | - | - | - | - | - | - | - | - | Google Calendar Templates | Y |
| ICS import | - | - | - | - | - | - | - | - | - | - | ICS to GCal (API) | Y |
| Export events (.ics / CSV / text) | P (print) | - | - | - | - | - | - | - | - | - | Toolset, Export to CSV, Calendar Plus | Y |
| Share availability as text, tz-converted | - | - | - | - | - | - | - | - | - | - | Offer Times ($), Sundial ($) | P (no tz conversion) |
| Multiple time zones / world clocks | - | - | - | - | - | - | - | - | - | - | Sundial | - (Google: 3 zones) |
| Themes / background image / dark mode | $ | - | $ | - | - | P | - | - | - | - | GCal Dark Mode, Bulk Edit Pro | - |
| Weather on day headers | - | - | - | - | - | - | - | - | - | - | BoldCal, Calendar Weather | - |
| Private notes / custom fields per event | - | - | - | - | - | - | - | - | - | - | Private Notes, Custom Fields | - |
| Focus timer / ambient sound / Zen mode | - | - | - | - | - | - | - | - | - | Y | Pomodoro Timer (Edge) | - |
| Meeting cost | - | - | - | - | - | - | - | - | - | - | Meeting Cost | - |
| Default start-time offset | - | - | - | - | - | - | - | - | - | - | Offset start-times | - |
| Title autocomplete | - | - | - | - | - | - | - | - | - | - | Calendar Plus | - |
| Keyboard tweaks (arrows), disable month scroll | - | - | - | - | - | Y | - | - | - | - | Disable Month Scroll | P (palette) |
| Settings export / import / sync | P | - | - | - | - | - | - | Y | - | - | | Y (sync) |
| Works on Workspace custom domains | Y | - | ? | Y | ? | ? | n/a | ? | ? | ? | | ? (MR-49) |

## 5. Per-feature feasibility

Columns: how many of the 47 ranked extensions offer it; whether Google now ships it; how we would do it (**CSS** inject styles, **DOM** read/modify the grid, **URL** `eventedit?...` params, **ext-API** Chrome extension APIs, **API** needs Calendar API + OAuth, **No**); difficulty S/M/L/XL with one line of reasoning; value 1-5 (install counts x review sentiment); MR item.

| Feature | # ext | Google shipped? | How | Diff. | Reasoning | Value | MR |
|---|---:|---|---|---|---|---:|---|
| Weekday/weekend/holiday/today colours | 5 | no (only one "weekend" tint setting) | CSS | S | shipped already; add import/export of settings | 4 | 12 |
| Hide hours outside a range | 1 (GP) | no | CSS/DOM | S | shipped (night reduction); GP's praise shows "collapse, don't just shrink" is wanted | 4 | 11 |
| Working-hours / time-block shading | 2 | no | CSS | S | shipped; Shade Calendar shows demand for multiple recurring named blocks | 3 | 12 |
| Dim declined/tentative/solo/external | 3 | no | DOM | M | we dim declined; solo/external need reading the guest list from the chip aria/popup, per-class opacity setting | 4 | 14 |
| Dim past events | 0 | no | CSS | S | shipped, and nobody else has it: a differentiator to advertise | 3 | 13 |
| Duration / end time on chips | 2 | no | DOM | S | parse chip aria-label times, append text; re-run on mutation | 4 | 15 |
| Hours totals per colour / calendar / tag | 3 | no | DOM | S-M | shipped by colour; add per-calendar and per-tag, plus a tiny bar chart (Calendar Plus) | 4 | 16 |
| Calendar-selection presets | 3 | no | DOM | S | click the sidebar checkboxes by label; store presets in `storage.sync`; expose in command palette | 4 | - |
| Title-convention tags (`Tag:`, `?`) | 1 | no | DOM/CSS | S | regex on chip title; configurable markers and colours; feeds totals | 3 | 25 |
| Rule-based colouring (regex -> colour/opacity) | 3 | partial (custom colours, manual) | CSS/DOM | M | client-side recolour of chips; persistence is only visual, must re-apply on every mutation | 4 | 25 |
| Hover card with full title/description | 3 | no | DOM | M | title: from aria-label (S); description needs opening the popup or API (L); do title+time+calendar first | 3 | 48 |
| Expand overlapping events on hover | 1 | no | CSS | S | `:hover { width:100%; z-index }` on chips | 3 | - |
| Expanded month grid / more all-day rows | 2 | partial (large-monitor options 2026-07) | CSS/DOM | M | Google virtualises rows; GP does it, so it is possible, but brittle | 3 | 19 |
| Compact headers, hide Upgrade/avatars/images | 1 | partial (density) | CSS | S | mostly shipped (declutter); add "hide Upgrade", "hide avatars" toggles | 3 | 22 |
| Merge duplicate events into one striped chip | 4 | no | DOM/CSS | M | group chips with same title+time in a column, hide all but one, paint stripes; wildcard rule for "busy" | 4 | 18 |
| Hide duplicate invitations | 1 | no | DOM | S | same grouping, hide instead of stripe | 3 | 18 |
| Event title in calendar colour / hide dots | 2 | no | CSS | S | pure CSS on month/all-day chips | 2 | - |
| Duplicate event (one click) | 4 | no | URL | M | read event details from the popup card, open `eventedit` prefilled; cannot copy guests/reminders without API | 4 | 2 |
| Move event to another calendar | 1 | no (only inside editor) | No (API) | XL | needs delete+insert via API; stay out | 3 | 9 |
| Bulk select / move / delete | 2 | no | No (API) | XL | OAuth write scopes | 3 | 8 |
| Split / spread / postpone / extend | 1 | no | URL (partial) | L | "postpone" = open editor prefilled with new date; others need API | 2 | - |
| Mark event done / strikethrough | 1 | no (Tasks only) | DOM + storage | S | store done event ids locally, add CSS class; not synced to other devices (say so) | 3 | 46 |
| Natural-language event creation | 5 | no (removed) | URL | S | shipped (EN/ES); add more languages via the parser, right-click already there | 5 | 1, 3 |
| ICS import, paste iCal | 1 | partial (Settings > Import) | URL | S | shipped, our core; ICS to GCal needs OAuth, we do not | 5 | 5 |
| Export visible events .ics/CSV/text | 3 | no | DOM | S | shipped | 3 | 36, 37 |
| Share availability as text with tz conversion | 2 | partial (booking pages) | DOM | M | shipped as text; add recipient time zone conversion (Offer Times' whole pitch) | 4 | 31 |
| Multiple time zones / world clocks | 1 | yes, 3 zones (2026-09-25) | CSS/DOM | L | Google covers most; skip beyond 3 | 2 | 28 |
| Agenda popup / side panel outside Calendar | 5 | no | No (API) | XL | needs read scope or an iframe (Calendar blocks framing) | 4 | 47 |
| Desktop notifications / snooze / TTS | 3 | partial (browser notifications from the open tab) | No (API) | XL | needs server-side data; the one thing Checker Plus owns | 4 | 30 |
| Auto-open / join meeting link | 3 | no | DOM | S | now bar has Join; add "auto-open N minutes before" while the tab is open | 3 | 29 |
| Custom colour palette | 4 | **yes (2026-06-17)** | - | - | obsolete; More Colors' 1.1 rating is the proof | 1 | - |
| Dark theme | 3 | **yes** | - | - | skip | 1 | 27 |
| Background image / themes | 2 | no | CSS | S | one URL + opacity setting; cheap audience grab, fragile readability | 2 | - |
| Weather on day headers | 2 | no | DOM + fetch | M | needs a weather API and location permission; privacy cost | 2 | 39 |
| Private notes / custom fields per event | 2 | no | DOM + storage | M | keyed by event id, local/sync storage; not visible on phone | 2 | 38 |
| Focus timer / Zen mode | 1 | no (Focus time event type only) | DOM | M | timer on current event + hide chrome; nice but not calendar-core | 2 | - |
| Meeting cost | 1 | no | DOM | S | guests x hourly rate shown in editor; niche | 1 | - |
| Default start-time offset | 1 | partial (Speedy meetings shortens end) | DOM | S | intercept editor time field; fragile | 1 | - |
| Title autocomplete | 1 | no | DOM | M | needs a corpus of past titles (read visible weeks, store locally) | 2 | 2 |
| Keyboard tweaks / disable month scroll | 2 | no | DOM | S | add to command palette settings | 2 | 41 |
| Settings export/import/sync | 2 | n/a | ext-API | S | we sync; add JSON export/import (G-calize's top complaint) | 3 | 49 |
| Workspace custom-domain support | ? | n/a | manifest | S | match `calendar.google.com/a/*` and `/calendar/*` paths; G-calize explicitly fails here | 3 | 49 |
| Resilience to Google DOM changes | all | n/a | DOM | M (ongoing) | every top-10 DOM extension has "stopped working after update" 1-stars; role/aria-based selectors + self-test | 5 | 49 |

## 6. Recommendations

### 6.1 Copy these first (high value, S/M, proven by several popular extensions)

1. **Calendar-selection presets** (Calendar Selector 40k + Easy Grouping 10k + Multiple Calendars Selector 4k). DOM clicks on the sidebar, presets in `storage.sync`, switchable from the command palette (the exact wish in Calendar Selector's reviews). S.
2. **Duration / end time on chips** (Toolset, GCalPlus Timed Bars). MR-15. S.
3. **Merge duplicate events into one striped chip, with a wildcard for "busy"** (Cal Merge, Event Merge MV3, Rainbow: ~16k users, consistently 4.4-4.8). MR-18. M.
4. **Dim solo / external / tentative events with per-class opacity** on top of our declined dimming (Calendar Clarity's core, 20k users). MR-14. M.
5. **Title-convention tags** (`Tag: title`, `title?`), configurable markers and colours, with per-tag hours totals (Tags 30k; reviewers asked for exactly this configurability). MR-25 lite. S.
6. **One-click duplicate via prefilled `eventedit` URL** (Quick Duplicate 10k, GCalPlus, Clarity). Read the popup card, build the URL; document that guests are not copied. MR-2. M.
7. **Hover card with title, time, calendar** (GCalPlus, Clarity, Toolset) and **expand overlapping chips on hover** (GCalPlus). MR-48. S/M.
8. **Settings JSON export/import** next to our existing sync (G-calize's top complaint). MR-49. S.
9. **Hide-hours as collapse, not shrink** and the GCalPlus "Look" toggles we lack: hide Upgrade button, hide avatars, title in calendar colour, adjacent-month dimming. MR-11, 19, 22. S each.
10. **Share availability with recipient time-zone conversion** (Offer Times, Sundial are paid for exactly this). MR-31. M.

### 6.2 Differentiators (nobody does it well; reviews complain)

- **Stability**: every DOM competitor's 1-star stream is "stopped working after Google's update". Ship a visible self-check ("3 of 14 features active, 1 degraded") and selectors based on roles/aria, and say so on the listing.
- **Open source, zero permissions beyond calendar.google.com, no sign-in, no ads, no trial**: Button (pop-up ads), Manganum (paywall after trial), Checker Plus (paid themes), More Colors (abandoned) show the trust gap. Put "no account, no data leaves the browser, source on GitHub" in the first line of the listing.
- **One extension instead of five**: a typical power user today runs G-calize + Calendar Selector + Cal Merge + Quick Duplicate + Toolset. Nobody bundles the DOM niceties with import/export/quick-add. GCalPlus is closest but has no import/export/templates/palette.
- **Dim past events and hours-by-colour** are already ours and absent from all top-10 competitors; advertise them.
- **Natural language in Spanish (and more languages)**: RIP Quick Add is the only multilingual one, 534 users; Checker Plus paywalled its version.
- **Workspace custom domains** support: G-calize's explicit gap.
- **Templates + ICS drop**: no in-page competitor has either; ICS to GCal needs OAuth.

### 6.3 Skip (with reasons)

- **Toolbar agenda popup, desktop notifications, snooze, TTS, Tasks in popup** (Checker Plus, Button, Calendar Extension): need OAuth read scopes or a backend. This is Checker Plus's moat and incompatible with our no-OAuth promise. MR-30/47.
- **Move to another calendar, bulk move/delete, split/spread/extend, Multiple Copy with guests**: write scopes. MR-8/9.
- **Custom colour palette / more colours**: Google shipped custom event colours (2026-06-17); the 70k-user incumbent sits at 1.1 stars.
- **Dark mode, multiple time zones (3), week numbers, booking pages**: Google shipped. MR-26/27/28/32.
- **Background images / theme packs**: cosmetic, breaks readability, 3.8-star category; at most a single "background URL + opacity" toggle later.
- **Sidebar launchers (Manganum), scheduling-link inserters (Calendly, Cal.com, HubSpot)**: different product.
- **Weather, meeting cost, custom fields, focus timer with ambient sounds**: niche (< 2k users each), and weather needs an external API + location.
- **Auto-open meeting tab X minutes before**: only works while the tab is open; the now-bar Join covers the no-OAuth part.

## 7. Privacy and trust angles

- 7 of the top 10 (Checker Plus, Button, GCalPlus, Calendar Clarity, Custom Background via `identity`, Manganum, More Colors) are closed source; two (Calendar Selector, Quick Duplicate in the top 15) are open source and both have the best complaint ratios.
- OAuth is the norm for anything beyond CSS: Checker Plus asks for full `calendar` + `tasks`, GCalPlus for `calendar.readonly` + settings and ships a client secret in the package, Button for `calendar.readonly`, Clarity/Bulk Edit/Offer Times for `calendar.events`. Google's OAuth "grant access" flow itself generates 1-star reviews ("I installed and gave permission ... nothing happens").
- Monetisation surprises are the most up-voted complaints in the whole sample: Button's promotional tabs (12 and 5 helpful votes), Manganum's post-trial paywall (7 and 9), Checker Plus's paid themes. Manganum additionally requests `history`, `cookies`, `bookmarks`, `topSites` and `*://*/*`.
- Our listing should state, in this order: open source (link), runs only on calendar.google.com, no Google sign-in, no analytics, no ads, settings synced only through Chrome's own `storage.sync`. Calendar Selector uses almost that exact wording and has the best rating-to-complaint ratio in the set.
- Everything we add from section 6.1 is CSS/DOM/URL plus `storage`, so the permission footprint does not grow.

## 8. Source notes

- Chrome Web Store listings and review tabs linked inline; counts as displayed on 2026-10-14.
- Google Workspace Updates posts used for "Google shipped": [custom event colours (2026-06-17)](https://workspaceupdates.googleblog.com/2026/06/custom-event-colors-in-google-calendar.html), [three time zones (2026-09-25)](https://workspaceupdates.googleblog.com/2026/09/view-up-to-three-time-zones-in-google-calendar-on-web.html), [large-monitor view options (2026-07-29)](https://workspaceupdates.googleblog.com/2026/07/updated-options-to-better-view-google-calendar-on-large-monitors.html), [block unsolicited invitations (2026-08-18)](https://workspaceupdates.googleblog.com/2026/08/managing-unsolicited-event-invitations-with-user-blocking-in-google-calendar.html), [suppress email responses (2026-08-28)](https://workspaceupdates.googleblog.com/2026/08/suppress-email-responses-to-calendar-invitations.html), [time zone search (2026-03-16)](https://workspaceupdates.googleblog.com/2026/03/easily-find-and-set-time-zones-in-google-calendar.html), [block time for a task (2025-11-17)](https://workspaceupdates.googleblog.com/2025/11/block-off-time-to-work-on-task-in-calendar.html). Older shipped items (dark theme, week numbers, booking pages, Focus time) are in `market-research.md`.
- Firefox numbers from `addons.mozilla.org/api/v5/addons/search/` (average daily users). Edge from `microsoftedge.microsoft.com/addons/search/google%20calendar`.
- Manifest data from the public CRX packages (version at research time); permissions can change with any update.
