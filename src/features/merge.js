// Merge duplicate events: when the same event (title + start/end) is drawn on
// several visible calendars, hide all but the first chip and paint that one
// with diagonal stripes of every calendar's colour. The wildcard title
// (default "Busy") merges by time only. Re-applied on every grid rescan.
(function () {
  'use strict';
  const BGC = window.BGC;
  const { toast } = BGC.ui;
  const settings = BGC.settings;
  const { groupDuplicates, stripeGradient, calendarOf } = BGC.merge;

  const DEFAULTS = { enabled: true, wildcard: 'Busy' };
  let prefs = DEFAULTS;
  const touched = new Map(); // node -> { visibility, backgroundImage, title, inner, innerBg }

  function paintTarget(node) {
    // Google draws the colour on the chip itself or on a child; find the first opaque one.
    if (!node) return null;
    const own = getComputedStyle(node).backgroundColor;
    if (own && own !== 'rgba(0, 0, 0, 0)' && own !== 'transparent') return node;
    for (const child of node.querySelectorAll('*')) {
      if (child.getAttribute('aria-hidden') === 'true' && !child.children.length) continue;
      const bg = getComputedStyle(child).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return child;
    }
    return node;
  }

  function remember(node) {
    if (touched.has(node)) return touched.get(node);
    const inner = paintTarget(node);
    const rec = { visibility: node.style.visibility, backgroundImage: node.style.backgroundImage, title: node.getAttribute('title'), inner, innerBg: inner && inner !== node ? inner.style.backgroundImage : null };
    touched.set(node, rec);
    return rec;
  }

  function restore(node) {
    const rec = touched.get(node);
    if (!rec) return;
    if (node.style.visibility !== rec.visibility) node.style.visibility = rec.visibility;
    if (node.style.backgroundImage !== rec.backgroundImage) node.style.backgroundImage = rec.backgroundImage;
    if (rec.inner && rec.inner !== node && rec.inner.style.backgroundImage !== rec.innerBg) rec.inner.style.backgroundImage = rec.innerBg;
    if (rec.title == null) node.removeAttribute('title');
    else if (node.getAttribute('title') !== rec.title) node.setAttribute('title', rec.title);
    node.removeAttribute('data-bgc-merged');
    touched.delete(node);
  }

  function setAttr(node, name, value) {
    if (node.getAttribute(name) !== value) node.setAttribute(name, value);
  }

  function apply(model) {
    const keep = new Set();
    if (prefs.enabled !== false && model.chips && model.chips.length) {
      if (!model.ok && model.chips.length > 1) BGC.liveGrid.showNotice('Merge duplicate events');
      const groups = model.ok ? groupDuplicates(model.chips, { wildcard: prefs.wildcard }) : [];
      for (const g of groups) {
        const names = Array.from(new Set(g.chips.map((c) => calendarOf(c.text, c.title)).filter(Boolean)));
        const tip = names.length ? `${g.chips.length} events merged (${names.join(', ')})` : `${g.chips.length} events merged`;
        const survivor = g.survivor.node;
        const rec = remember(survivor);
        keep.add(survivor);
        const gradient = stripeGradient(g.colors);
        const target = rec.inner || survivor;
        if (gradient && g.colors.length > 1 && rec.applied !== gradient) {
          target.style.backgroundImage = gradient; // the browser re-serialises the value, so remember what we set
          rec.applied = gradient;
        }
        if (survivor.style.visibility !== rec.visibility) survivor.style.visibility = rec.visibility;
        setAttr(survivor, 'title', tip);
        setAttr(survivor, 'data-bgc-merged', String(g.chips.length));
        for (const c of g.hidden) {
          remember(c.node);
          keep.add(c.node);
          if (c.node.style.visibility !== 'hidden') c.node.style.visibility = 'hidden';
          setAttr(c.node, 'data-bgc-merged', 'hidden');
        }
      }
    }
    for (const node of Array.from(touched.keys())) if (!keep.has(node)) restore(node);
  }

  settings.get('merge', DEFAULTS).then((p) => {
    prefs = p;
    apply(BGC.liveGrid.get());
  });
  settings.onChange('merge', (p) => {
    prefs = p || DEFAULTS;
    apply(BGC.liveGrid.get());
  });
  BGC.liveGrid.onChange(apply);

  function commands() {
    return [
      {
        id: 'ext:merge',
        group: 'Extension',
        label: `${prefs.enabled !== false ? 'Turn off' : 'Turn on'}: merge duplicate events into one striped chip`,
        keywords: ['merge', 'duplicate', 'duplicates', 'stripes', 'striped', 'same event', 'busy', 'unir', 'duplicados'],
        run: () => settings.set('merge', { enabled: prefs.enabled === false }).then(() => toast(prefs.enabled === false ? 'Duplicate events are no longer merged.' : 'Duplicate events are merged into striped chips.')),
      },
    ];
  }

  if (BGC.features && BGC.features.settingsUi) {
    BGC.features.settingsUi.register({
      id: 'merge',
      title: 'Duplicate events',
      render(body, h) {
        h.note(body, 'The same event on several visible calendars (same title and time) becomes one chip striped with the calendars’ colours; hover it to see which calendars. Clicking opens the first copy.');
        h.check(body, 'Merge duplicate events into one striped chip', prefs.enabled !== false, (v) => settings.set('merge', { enabled: v }));
        h.text(body, 'Wildcard title merged by time only (e.g. "Busy" blocks copied from another calendar)', prefs.wildcard == null ? 'Busy' : prefs.wildcard, (v) => settings.set('merge', { wildcard: v.trim() }), 'Busy', 'Leave empty to merge only identical titles.');
      },
    });
  }

  BGC.features = BGC.features || {};
  BGC.features.merge = { get: () => prefs, set: (patch) => settings.set('merge', patch), commands, isHidden: (node) => node && node.getAttribute && node.getAttribute('data-bgc-merged') === 'hidden' };
})();
