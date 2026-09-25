// Fills elements marked data-claude="<field>" with the Claude Code version and
// model published in status.json by sync-status.sh. Used by this page and by the
// Claude Code card on swchoi1994.github.io, so neither hardcodes a model.
(function () {
  var script = document.currentScript;
  var STATUS_URL = new URL('status.json', script ? script.src : window.location.href);
  var FAMILIES = { opus: 'Opus', sonnet: 'Sonnet', haiku: 'Haiku', fable: 'Fable' };

  // 'claude-opus-5-5[1m]' -> 'Opus 5.5'. Claude Code's display name can be just
  // 'Opus', so the ID wins unless the display name carries its own version number.
  function modelName(id, displayName) {
    var display = (displayName || '').replace(/\s*\([^)]*context[^)]*\)\s*$/i, '').trim();
    if (display && /\d/.test(display)) return display;
    var match = /claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?!\d)/i.exec(id || '');
    if (match) {
      var family = FAMILIES[match[1].toLowerCase()] || match[1];
      return family + ' ' + match[2] + (match[3] ? '.' + match[3] : '');
    }
    return display || id || 'Claude';
  }

  // 1000000 -> '1M context', 200000 -> '200K context'.
  function contextLabel(size, id, displayName) {
    size = Number(size);
    if (!(size > 0) && (/\[1m\]/i.test(id) || /\b1M\b/.test(displayName || ''))) size = 1000000;
    if (!(size > 0)) return '';
    return (size >= 1000000 ? +(size / 1000000).toFixed(1) + 'M' : Math.round(size / 1000) + 'K') + ' context';
  }

  function fill(field, text) {
    var nodes = document.querySelectorAll('[data-claude="' + field + '"]');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = text;
  }

  function render(status) {
    var model = status.model || {};
    var name = modelName(model.id, model.display_name);
    var context = contextLabel(status.context_window_size, model.id, model.display_name);
    var version = status.claude_code_version;

    if (version) {
      fill('version', version);
      fill('version-tag', 'v' + version);
    }
    fill('model', name);
    fill('model-full', context ? name + ' (' + context + ')' : name);
    fill('badge', [version ? 'v' + version : '', 'Claude ' + name, context].filter(Boolean).join(' · '));

    var updated = new Date(status.updated_at);
    if (!isNaN(updated.getTime())) {
      fill('synced-date', updated.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    }
  }

  function load() {
    var url = new URL(STATUS_URL);
    url.searchParams.set('t', Date.now());
    fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(render)
      .catch(function () { /* keep the values built into the page */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
