// Service worker: opens tabs for the content script (so several pre-filled
// forms can open at once without the popup blocker interfering) and owns the
// "Add to Google Calendar" context menu for selected text on any page.
importScripts('ics.js', 'gcal-url.js', 'quickadd.js');

const MENU_ID = 'bgc-quick-add-selection';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'bgc:open-tabs' || !Array.isArray(msg.urls)) return false;
  (async () => {
    for (const url of msg.urls) await chrome.tabs.create({ url, active: msg.urls.length === 1 });
    sendResponse({ ok: true });
  })();
  return true;
});

function registerMenu() {
  if (!chrome.contextMenus) return;
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Add "%s" to Google Calendar',
      contexts: ['selection'],
    });
  });
}

chrome.runtime.onInstalled.addListener(registerMenu);
chrome.runtime.onStartup.addListener(registerMenu);

if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== MENU_ID || !info.selectionText) return;
    const stored = await chrome.storage.sync.get('bgc:quickadd');
    const prefs = (stored && stored['bgc:quickadd']) || {};
    const result = BGC.quickadd.parseQuickAdd(info.selectionText.slice(0, 400), {
      defaultMinutes: prefs.defaultMinutes || 60,
      dateOrder: prefs.dateOrder || 'dmy',
    });
    if (!result) return;
    const fromCalendar = tab && tab.url && /^https:\/\/calendar\.google\.com\//.test(tab.url);
    const base = BGC.gcal.eventEditBase(fromCalendar ? tab.url : 'https://calendar.google.com/');
    const url = BGC.gcal.buildEventEditUrl(result.event, result.ctx, { base });
    await chrome.tabs.create({ url, index: tab ? tab.index + 1 : undefined });
  });
}
