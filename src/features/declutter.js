// Declutter, print and density: small independent CSS toggles injected into
// the page (not the shadow root). Each one is isolated, so a stale selector
// only stops hiding one thing. Toggled from the command palette (Ctrl+K).
(function () {
  'use strict';
  const BGC = window.BGC;
  if (!BGC || !BGC.settings) return;
  const settings = BGC.settings;

  const TOGGLES = {
    print: {
      label: 'Readable printing (wrap titles, dark text, no chrome)',
      css: `@media print {
        [data-eventid], [data-eventid] * { white-space: normal !important; overflow: visible !important; text-overflow: clip !important; color: #000 !important; }
        [data-eventid] { height: auto !important; min-height: 1.2em !important; position: static !important; margin: 1px 0 !important; }
        [role="main"] { color: #000 !important; font-size: 11px !important; }
        [role="navigation"], [role="banner"], [role="complementary"], header, #better-google-calendar-root { display: none !important; }
      }`,
      default: true,
    },
    compact: {
      label: 'Compact density (smaller text, more rows)',
      css: `[role="main"] { font-size: 12px !important; } [role="main"] [data-eventid] { font-size: 11px !important; line-height: 14px !important; }`,
      default: false,
    },
    hideImages: {
      label: 'Hide event illustrations and avatars in event details',
      css: `[role="dialog"] img[src*="googleusercontent"], [role="dialog"] img[src*="gstatic.com/calendar"], [data-eventid] img { display: none !important; }`,
      default: false,
    },
    hideMeet: {
      label: 'Hide "Join with Google Meet" buttons in event details',
      css: `[role="dialog"] [aria-label*="Google Meet" i], [role="dialog"] a[href*="meet.google.com"] + *, [role="dialog"] [data-is-meet] { display: none !important; }`,
      default: false,
    },
    hidePromos: {
      label: 'Hide upgrade / Workspace promotions',
      css: `[aria-label*="Upgrade" i], [aria-label*="Get Google Workspace" i], a[href*="workspace.google.com/pricing"], a[href*="workspace.google.com/intl"][href*="pricing"] { display: none !important; }`,
      default: false,
    },
    highContrast: {
      label: 'Higher contrast text',
      css: `[role="main"] { --bgc-c: #202124; } [role="main"] [data-eventid] { font-weight: 500 !important; } [role="main"] [role="columnheader"], [role="main"] [role="gridcell"] > div:first-child { color: #202124 !important; }`,
      default: false,
    },
  };

  const nodes = {};
  function apply(prefs) {
    for (const [id, t] of Object.entries(TOGGLES)) {
      const on = prefs[id] != null ? !!prefs[id] : t.default;
      if (on && !nodes[id]) {
        const s = document.createElement('style');
        s.id = `bgc-declutter-${id}`;
        s.textContent = t.css;
        (document.head || document.documentElement).appendChild(s);
        nodes[id] = s;
      } else if (!on && nodes[id]) {
        nodes[id].remove();
        delete nodes[id];
      }
    }
  }

  let prefs = {};
  settings.get('declutter', {}).then((p) => {
    prefs = p;
    apply(prefs);
  });
  settings.onChange('declutter', (p) => {
    prefs = p || {};
    apply(prefs);
  });

  BGC.features = BGC.features || {};
  BGC.features.declutter = {
    TOGGLES,
    isOn: (id) => (prefs[id] != null ? !!prefs[id] : TOGGLES[id].default),
    toggle: (id) => settings.set('declutter', { [id]: !(prefs[id] != null ? !!prefs[id] : TOGGLES[id].default) }),
  };
})();
