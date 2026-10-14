// Identity of the extension shown in About (page modal and toolbar popup).
// Change POST_URL here once the launch post exists; nothing else references it.
(function (root) {
  'use strict';
  const POST_URL = 'https://jperelli.com/';
  const api = {
    NAME: 'Better Google Calendar',
    AUTHOR: 'Julian Perelli',
    AUTHOR_URL: 'https://jperelli.com',
    REPO_URL: 'https://github.com/jperelli/better-google-calendar',
    ISSUES_URL: 'https://github.com/jperelli/better-google-calendar/issues',
    POST_URL,
    version: () => {
      try {
        return (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest().version) || '';
      } catch (e) {
        return '';
      }
    },
  };
  root.BGC = root.BGC || {};
  root.BGC.about = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
