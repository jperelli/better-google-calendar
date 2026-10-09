// Captures the Chrome Web Store assets: 1280x800 screenshots of the extension
// over a mocked calendar page, plus the 440x280 promo tile.
// Usage: CHROME_PATH=/path/to/chrome node store/screenshots.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'screenshots');
const PROFILE = path.join(__dirname, '.profile');
const fixture = (name) => fs.readFileSync(path.join(ROOT, 'test', 'fixtures', name), 'utf8');
const shadow = (sel) => `#better-google-calendar-root ${sel}`;

async function main() {
  fs.rmSync(PROFILE, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const launch = {
    headless: false,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    args: [`--disable-extensions-except=${ROOT}`, `--load-extension=${ROOT}`, '--no-first-run'],
    ignoreDefaultArgs: ['--disable-extensions'],
  };
  if (process.env.CHROME_PATH) launch.executablePath = process.env.CHROME_PATH;
  else launch.channel = 'chrome';
  const context = await chromium.launchPersistentContext(PROFILE, launch);
  await context.route('https://calendar.google.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: fs.readFileSync(path.join(__dirname, 'mock-calendar.html'), 'utf8') })
  );
  if (!context.serviceWorkers().length) await context.waitForEvent('serviceworker', { timeout: 15000 });

  const page = context.pages()[0] || (await context.newPage());
  await page.goto('https://calendar.google.com/calendar/u/0/r/week');
  await page.waitForTimeout(800);

  // 1. drag overlay
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.items.add(new File(['x'], 'invite.ics', { type: 'text/calendar' }));
    document.body.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }));
  });
  await page.waitForSelector(shadow('.bgc-overlay'));
  await page.screenshot({ path: path.join(OUT, '2-drop-overlay.png') });

  // 2. multi-event modal
  await page.evaluate((content) => {
    const dt = new DataTransfer();
    dt.items.add(new File([content], 'conference-2026.ics', { type: 'text/calendar' }));
    document.body.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  }, fixture('multi.ics'));
  await page.waitForSelector(shadow('.bgc-dialog'));
  await page.locator(shadow('.bgc-row')).nth(1).locator('button').hover();
  await page.screenshot({ path: path.join(OUT, '1-event-list.png') });

  // 3. promo tile
  const tile = await context.newPage();
  await tile.setViewportSize({ width: 440, height: 280 });
  await tile.goto('file://' + path.join(__dirname, 'promo-tile.html'));
  await tile.waitForTimeout(300);
  await tile.screenshot({ path: path.join(OUT, 'promo-tile-440x280.png') });

  await context.close();
  console.log(fs.readdirSync(OUT).map((f) => 'store/screenshots/' + f).join('\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
