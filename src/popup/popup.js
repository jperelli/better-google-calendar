// Toolbar popup: Settings focuses an open calendar.google.com tab and asks the
// content script to open the settings modal (or opens Calendar with a hash the
// content script reads); About shows the extension identity in place.
(function () {
  'use strict';
  const about = window.BGC.about;
  const CAL = 'https://calendar.google.com/';
  const $ = (id) => document.getElementById(id);

  $('name').textContent = about.NAME;
  $('version').textContent = about.version();
  $('author').textContent = about.AUTHOR;
  $('author').href = about.AUTHOR_URL;
  $('repo').href = about.REPO_URL;
  $('post').href = about.POST_URL;

  async function calendarTab() {
    const tabs = await chrome.tabs.query({});
    const here = tabs.find((t) => t.active && (t.url || '').startsWith(CAL));
    return here || tabs.find((t) => (t.url || '').startsWith(CAL)) || null;
  }

  async function openInCalendar(what) {
    const tab = await calendarTab();
    if (tab) {
      try {
        await chrome.tabs.update(tab.id, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });
        await chrome.tabs.sendMessage(tab.id, { type: `bgc:open-${what}` });
        return window.close();
      } catch (e) {
        // the content script is not running in that tab (e.g. just installed); fall through
      }
    }
    await chrome.tabs.create({ url: `${CAL}calendar/r#bgc-${what}` });
    window.close();
  }

  $('settings').addEventListener('click', () => openInCalendar('settings'));
  $('about').addEventListener('click', () => {
    $('menu').style.display = 'none';
    $('hint').style.display = 'none';
    $('aboutView').classList.add('show');
  });
  $('back').addEventListener('click', () => {
    $('menu').style.display = '';
    $('hint').style.display = '';
    $('aboutView').classList.remove('show');
  });
})();
