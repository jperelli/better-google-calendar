// Tiny settings store shared by every feature: chrome.storage.sync when the
// extension API is available, localStorage otherwise (tests, mock pages).
// Values are kept under one key per feature so features never clobber each other.
(function (root) {
  'use strict';

  const PREFIX = 'bgc:';
  const listeners = [];

  function hasChromeStorage() {
    try {
      return typeof chrome !== 'undefined' && !!(chrome.storage && chrome.storage.sync);
    } catch (e) {
      return false;
    }
  }

  function get(key, defaults) {
    const full = PREFIX + key;
    return new Promise((resolve) => {
      if (hasChromeStorage()) {
        chrome.storage.sync.get(full, (res) => {
          const stored = res && res[full];
          resolve(Object.assign({}, defaults || {}, stored || {}));
        });
      } else {
        let stored = null;
        try {
          stored = JSON.parse(localStorage.getItem(full) || 'null');
        } catch (e) {
          stored = null;
        }
        resolve(Object.assign({}, defaults || {}, stored || {}));
      }
    });
  }

  function set(key, patch) {
    const full = PREFIX + key;
    return get(key, {}).then((current) => {
      const next = Object.assign({}, current, patch || {});
      return new Promise((resolve) => {
        if (hasChromeStorage()) {
          chrome.storage.sync.set({ [full]: next }, () => resolve(next));
        } else {
          try {
            localStorage.setItem(full, JSON.stringify(next));
          } catch (e) {
            /* ignore */
          }
          resolve(next);
        }
      });
    }).then((next) => {
      for (const l of listeners) if (l.key === key) l.cb(next);
      return next;
    });
  }

  function onChange(key, cb) {
    listeners.push({ key, cb });
  }

  if (hasChromeStorage() && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      for (const full of Object.keys(changes)) {
        if (!full.startsWith(PREFIX)) continue;
        const key = full.slice(PREFIX.length);
        for (const l of listeners) if (l.key === key) l.cb(changes[full].newValue || {});
      }
    });
  }

  const api = { get, set, onChange };
  root.BGC = root.BGC || {};
  root.BGC.settings = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
