// Opens pre-filled Google Calendar event forms in new tabs on behalf of the
// content script (window.open would be popup-blocked past the first one).
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'bgc:open-tabs' || !Array.isArray(msg.urls)) return false;
  const urls = msg.urls.filter((u) => typeof u === 'string' && u.startsWith('https://calendar.google.com/'));
  const openerTabId = sender.tab ? sender.tab.id : undefined;
  Promise.all(
    urls.map((url, i) =>
      chrome.tabs.create({ url, active: i === 0, openerTabId })
    )
  )
    .then(() => sendResponse({ ok: true }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));
  return true;
});
