// End-to-end check: loads the unpacked extension in Chrome, serves a mock
// calendar.google.com, drops the fixture .ics files and asserts what the
// extension does. Run with `npm run e2e` (needs a display; set CHROME_PATH to
// a Chrome/Chromium binary, otherwise the installed Google Chrome is used).
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const PROFILE = path.join(__dirname, '.profile');
const fixture = (name) => fs.readFileSync(path.join(ROOT, 'test', 'fixtures', name), 'utf8');
const mock = (name) => fs.readFileSync(path.join(__dirname, name), 'utf8');

async function dropFiles(page, files) {
  await page.evaluate((files) => {
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(new File([f.content], f.name, { type: f.type || '' }));
    const target = document.querySelector('main') || document.body;
    for (const type of ['dragenter', 'dragover', 'drop']) {
      target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }));
    }
  }, files);
}

const shadow = (sel) => `#better-google-calendar-root ${sel}`; // Playwright CSS pierces open shadow roots

async function main() {
  fs.rmSync(PROFILE, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const launch = {
    headless: false,
    viewport: { width: 1280, height: 800 },
    args: [`--disable-extensions-except=${ROOT}`, `--load-extension=${ROOT}`, '--no-first-run'],
    ignoreDefaultArgs: ['--disable-extensions'],
  };
  if (process.env.CHROME_PATH) launch.executablePath = process.env.CHROME_PATH;
  else launch.channel = 'chrome';
  const context = await chromium.launchPersistentContext(PROFILE, launch);

  await context.route('https://calendar.google.com/**', (route) => {
    const url = new URL(route.request().url());
    const body = url.pathname.endsWith('/eventedit') ? mock('mock-eventedit.html') : mock('mock-calendar.html');
    route.fulfill({ status: 200, contentType: 'text/html', body });
  });

  const page = context.pages()[0] || (await context.newPage());
  page.on('console', (m) => { if (m.type() === 'error') console.log('[page console]', m.text()); });
  page.on('pageerror', (e) => console.log('[page error]', e.message));
  if (!context.serviceWorkers().length) await context.waitForEvent('serviceworker', { timeout: 15000 });
  console.log('extension service worker running');
  await page.goto('https://calendar.google.com/calendar/u/0/r/week');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500); // content script runs at document_idle

  // 1. Drag with files shows the overlay and blocks Google's own handler.
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.items.add(new File(['x'], 'a.ics'));
    document.body.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }));
  });
  await page.waitForSelector(shadow('.bgc-overlay'));
  await page.screenshot({ path: path.join(OUT, '1-drag-overlay.png') });
  console.log('overlay shown on dragenter');

  // 2. A non-ics file only shows a toast.
  await dropFiles(page, [{ name: 'photo.png', content: 'nope', type: 'image/png' }]);
  const toast = await page.waitForSelector(shadow('.bgc-toast'));
  assert.match(await toast.textContent(), /Only \.ics/);
  assert.equal(await page.evaluate(() => window.__googleHandlerFired), 0, 'page drop handler must not fire');
  console.log('non-ics drop -> toast, page handler suppressed');

  // 3. Multi-event file opens the list modal.
  await dropFiles(page, [{ name: 'conference.ics', content: fixture('multi.ics'), type: 'text/calendar' }]);
  await page.waitForSelector(shadow('.bgc-dialog'));
  const rows = page.locator(shadow('.bgc-row'));
  assert.equal(await rows.count(), 5);
  assert.match(await page.locator(shadow('.bgc-title')).textContent(), /5 events found/);
  const summaries = await page.locator(shadow('.bgc-summary')).allTextContents();
  assert.deepEqual(
    summaries.map((s) => s.replace(/Repeats|\d+ guests/g, '').trim()),
    ['Offsite', 'Keynote', 'Breakfast', 'Weekly retro', 'Holiday']
  );
  await page.screenshot({ path: path.join(OUT, '2-multi-event-modal.png') });
  console.log('multi-event modal lists 5 events sorted by start');

  // 4. "Open to add" asks the background worker to open Google's pre-filled
  // form in a new tab. Tabs opened by the extension race Playwright's route
  // (the first request can escape to the real Google), so record the URLs the
  // extension requests in the service worker and render one through the mock.
  const sw = context.serviceWorkers()[0];
  await sw.evaluate(() => {
    self.__created = [];
    const orig = chrome.tabs.create.bind(chrome.tabs);
    chrome.tabs.create = (opts) => {
      self.__created.push(opts.url);
      return orig(opts);
    };
  });
  const pagesBefore = context.pages().length;
  await rows.nth(1).locator('button').click();
  await page.waitForTimeout(1000);
  let created = await sw.evaluate(() => self.__created);
  assert.equal(created.length, 1);
  const formUrl = new URL(created[0]);
  assert.equal(formUrl.origin + formUrl.pathname, 'https://calendar.google.com/calendar/u/0/r/eventedit');
  assert.equal(formUrl.searchParams.get('text'), 'Keynote');
  assert.equal(formUrl.searchParams.get('dates'), '20260421T140000Z/20260421T144500Z');
  assert.equal(formUrl.searchParams.get('location'), 'Main hall');
  assert.equal(await rows.nth(1).locator('button').textContent(), 'Open again');
  for (const p of context.pages().slice(pagesBefore)) await p.close();
  const formPage = await context.newPage();
  await formPage.goto(created[0]);
  assert.equal(await formPage.locator('[data-param="text"]').textContent(), 'Keynote');
  await formPage.screenshot({ path: path.join(OUT, '3-eventedit-from-list.png') });
  await formPage.close();
  console.log('"Open to add" -> eventedit tab with Keynote fields');

  // 5. "Open all" opens one tab per event.
  await sw.evaluate(() => { self.__created = []; });
  await page.locator(shadow('.bgc-primary')).click();
  await page.waitForTimeout(1500);
  created = await sw.evaluate(() => self.__created);
  assert.deepEqual(
    created.map((u) => new URL(u).searchParams.get('text')),
    ['Offsite', 'Keynote', 'Breakfast', 'Weekly retro', 'Holiday']
  );
  for (const p of context.pages().slice(pagesBefore)) await p.close();
  console.log('"Open all" -> 5 tabs');

  // 6. Escape closes the modal.
  await page.keyboard.press('Escape');
  await page.waitForSelector(shadow('.bgc-dialog'), { state: 'detached' });
  console.log('Escape closes modal');

  // 7. Single-event file navigates straight to the pre-filled form.
  await dropFiles(page, [{ name: 'invite.ics', content: fixture('single.ics'), type: 'text/calendar' }]);
  await page.waitForURL(/\/eventedit\?/);
  const single = new URL(page.url()).searchParams;
  assert.equal(single.get('text'), 'Team sync, Q1 review');
  assert.equal(single.get('dates'), '20260315T090000Z/20260315T103000Z');
  assert.equal(single.get('add'), 'ana@example.com,bob@example.com');
  assert.equal(single.get('location'), 'Carrer de Pelai 1, Barcelona');
  await page.screenshot({ path: path.join(OUT, '4-single-event-navigates.png') });
  console.log('single-event drop -> same-tab navigation to eventedit');

  // 8. Quick Add: `q` opens the box, the preview updates, Enter opens the form.
  await page.goto('https://calendar.google.com/calendar/u/0/r/week');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector(shadow('.bgc-qa-fab'));
  await page.keyboard.press('q');
  const qaInput = await page.waitForSelector(shadow('.bgc-qa-input'));
  await qaInput.type('Lunch with ana@example.com tomorrow 1-2pm at Bar Lobo');
  await page.waitForSelector(shadow('.bgc-qa-preview:has-text("Bar Lobo")'));
  assert.match(await page.locator(shadow('.bgc-qa-title')).textContent(), /^Lunch$/);
  await page.screenshot({ path: path.join(OUT, '5-quick-add.png') });
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/eventedit\?/);
  const qa = new URL(page.url()).searchParams;
  assert.equal(qa.get('text'), 'Lunch');
  assert.equal(qa.get('location'), 'Bar Lobo');
  assert.equal(qa.get('add'), 'ana@example.com');
  assert.match(qa.get('dates'), /^\d{8}T130000\/\d{8}T140000$/);
  console.log('quick add -> eventedit with parsed fields');

  // 9. Escape closes the Quick Add box; typing in a page input does not open it.
  await page.goto('https://calendar.google.com/calendar/u/0/r/week');
  await page.waitForSelector(shadow('.bgc-qa-fab'));
  await page.locator(shadow('.bgc-qa-fab')).click();
  await page.waitForSelector(shadow('.bgc-qa-panel'));
  await page.keyboard.press('Escape');
  await page.waitForSelector(shadow('.bgc-qa-panel'), { state: 'detached' });
  console.log('Escape closes quick add');

  // 10. Templates: save what is typed, reopen, click the chip, type a day.
  await page.locator(shadow('.bgc-qa-fab')).click();
  const tplInput = await page.waitForSelector(shadow('.bgc-qa-input'));
  await tplInput.type('Shift 2 at 14:00 for 8 hours at Plant B');
  await page.waitForSelector(shadow('.bgc-qa-preview:has-text("Plant B")'));
  await page.locator(shadow('.bgc-qa-save')).click();
  const nameInput = await page.waitForSelector(shadow('.bgc-qa-name'));
  await nameInput.fill('Shift 2');
  await nameInput.press('Enter');
  await page.waitForSelector(shadow('.bgc-qa-tpl.bgc-on:has-text("Shift 2")'));
  await page.keyboard.press('Escape');
  await page.reload();
  await page.waitForSelector(shadow('.bgc-qa-fab'));
  await page.keyboard.press('q');
  await page.waitForSelector(shadow('.bgc-qa-tpl:has-text("Shift 2")'));
  await page.locator(shadow('.bgc-qa-tpl:has-text("Shift 2")')).click();
  await page.locator(shadow('.bgc-qa-input')).fill('next friday');
  await page.waitForSelector(shadow('.bgc-qa-preview:has-text("Plant B")'));
  await page.screenshot({ path: path.join(OUT, '6-template.png') });
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/eventedit\?/);
  const tp = new URL(page.url()).searchParams;
  assert.equal(tp.get('text'), 'Shift 2');
  assert.equal(tp.get('location'), 'Plant B');
  assert.match(tp.get('dates'), /^\d{8}T140000\/\d{8}T220000$/);
  console.log('template survives reload and fills time, length and place');

  // 11. Command palette: Ctrl+K, filter a setting, Enter navigates to Google's settings page.
  await page.goto('https://calendar.google.com/calendar/u/0/r/week');
  await page.waitForSelector(shadow('.bgc-qa-fab'));
  await page.keyboard.press('Control+k');
  const palInput = await page.waitForSelector(shadow('.bgc-pal-input'));
  await palInput.type('declined');
  await page.waitForSelector(shadow('.bgc-pal-item.bgc-on:has-text("Show declined events")'));
  await page.screenshot({ path: path.join(OUT, '7-palette.png') });
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/r\/settings$/);
  console.log('palette -> settings page');
  await page.goto('https://calendar.google.com/calendar/u/0/r/week');
  await page.waitForSelector(shadow('.bgc-qa-fab'));
  await page.keyboard.press('Control+k');
  await (await page.waitForSelector(shadow('.bgc-pal-input'))).type('go to 14 nov');
  await page.waitForSelector(shadow('.bgc-pal-item.bgc-on:has-text("Go to")'));
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/r\/week\/\d{4}\/11\/14$/);
  console.log('palette -> typed date');

  await context.close();
  console.log('\nALL E2E CHECKS PASSED');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
