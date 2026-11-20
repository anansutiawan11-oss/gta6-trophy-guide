// FIFTY-FIVE — GTA VI trophy guide & tracker. Static, offline, no network at runtime.
// Progress lives in localStorage; export/import round-trips it as JSON.
(function () {
  'use strict';
  var KEY = 'fifty-five-gta6-progress-v1';
  var params = new URLSearchParams(location.search);
  var doc = null;
  var earned = {};
  var counters = {};
  var spoiler = false;
  var selectedId = null;

  var GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  var KIND_LABELS = { story: 'Story', side: 'Side strands', collectible: 'Collectibles', activity: 'Activities', crime: 'Crime', misc: 'Misc', platinum: 'Platinum', completion: '100% completion' };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        earned = parsed.earned || {};
        counters = parsed.counters || {};
      }
    } catch (e) { earned = {}; counters = {}; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ earned: earned, counters: counters })); } catch (e) {}
  }
  function hasSaved() {
    try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
  }
  // Demo seed: 10 earned + 6/18 meditations, only when nothing is saved yet.
  function maybeDemo() {
    if (params.get('demo') !== '1' || hasSaved()) return;
    var seed = ['just-like-paradise', 'paradise-lost', 'trust', 'break-the-bank', 'master-of-none', 'stick-fiddler', 'baited-my-tackle', 'a-classic-blitz-play', 'on-the-spot', 'treat-yo-self'];
    seed.forEach(function (id) { earned[id] = true; });
    counters['positive-mental-attitude'] = 6;
    save();
  }

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function trophyById(id) { return doc.trophies.find(function (t) { return t.id === id; }); }
  function isHidden(t) { return t.hidden && spoiler && !earned[t.id]; }
  function displayName(t) { return isHidden(t) ? 'Hidden trophy — spoiler shield on' : t.name; }
  function displayDesc(t) { return isHidden(t) ? 'Earn this trophy to reveal its name and description.' : t.description; }
  function sourceById(n) { return doc.sources.find(function (s) { return s.id === n; }); }

  function earnedCount() { return doc.trophies.filter(function (t) { return earned[t.id]; }).length; }

  function renderHeader() {
    var grades = ['platinum', 'gold', 'silver', 'bronze'];
    el('gradeProgress').innerHTML = grades.map(function (g) {
      var total = doc.trophies.filter(function (t) { return t.grade === g; }).length;
      var got = doc.trophies.filter(function (t) { return t.grade === g && earned[t.id]; }).length;
      return '<span><b>' + got + ' / ' + total + '</b> ' + g + '</span>';
    }).join('');
    el('totalProgress').textContent = earnedCount() + ' / ' + doc.trophies.length + ' earned';
    var steps = doc.trophies.reduce(function (n, t) { return n + t.guide.length; }, 0);
    el('proofStrip').innerHTML =
      '<span><b>55 / 55</b> trophy names listed</span>' +
      '<span><b>' + steps + '</b> guide steps, each citing a source</span>' +
      '<span><b>' + doc.sources.length + '</b> launch-week sources</span>' +
      '<span><b>' + doc.disputes.length + '</b> disputes shown both sides</span>' +
      '<span><b>' + doc.trophies.filter(function (t) { return t.unconfirmed; }).length + '</b> trophies honestly labelled unconfirmed</span>';
  }

  function filtered() {
    var q = el('searchBox').value.trim().toLowerCase();
    var kind = el('kindFilter').value;
    var sort = el('sortBox').value;
    var onlyRemaining = el('onlyRemaining').checked;
    var list = doc.trophies.filter(function (t) {
      if (onlyRemaining && earned[t.id]) return false;
      if (kind === 'missable') { if (!t.missable) return false; }
      else if (kind !== 'all' && t.kind !== kind) return false;
      if (q && (t.name.toLowerCase().indexOf(q) === -1 && t.description.toLowerCase().indexOf(q) === -1)) return false;
      return true;
    });
    if (sort === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else if (sort === 'grade') list.sort(function (a, b) { return GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.name.localeCompare(b.name); });
    else list.sort(function (a, b) { return a.stage - b.stage || doc.trophies.indexOf(a) - doc.trophies.indexOf(b); });
    return list;
  }

  function renderList() {
    var list = filtered();
    var ul = el('trophyList');
    ul.innerHTML = '';
    list.forEach(function (t) {
      var li = document.createElement('li');
      if (earned[t.id]) li.className = 'earned';
      if (t.id === selectedId) li.className += ' selected';
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = !!earned[t.id];
      box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
      box.addEventListener('click', function (e) { e.stopPropagation(); });
      box.addEventListener('change', function () {
        if (box.checked) earned[t.id] = true; else delete earned[t.id];
        save(); renderAll();
      });
      var div = document.createElement('div');
      var flags = '';
      if (t.missable) flags += '<span class="pill flag">Missable</span>';
      if (t.unconfirmed) flags += '<span class="pill flag">Unconfirmed</span>';
      div.innerHTML = '<div class="t-name' + (isHidden(t) ? ' hidden-name' : '') + '">' + esc(displayName(t)) + '</div>' +
        '<div class="t-desc">' + esc(displayDesc(t)) + '</div>' +
        '<div class="t-meta"><span class="pill ' + t.grade + '">' + t.grade + '</span>' +
        '<span class="pill kind">' + esc(KIND_LABELS[t.kind] || t.kind) + '</span>' +
        '<span class="pill kind">Stage ' + t.stage + '</span>' + flags + '</div>';
      li.appendChild(box);
      li.appendChild(div);
      li.addEventListener('click', function () { select(t.id); });
      ul.appendChild(li);
    });
    el('countLine').textContent = 'Showing ' + list.length + ' of ' + doc.trophies.length + ' trophies · ' + earnedCount() + ' earned';
    renderNextUp();
    renderKindProgress();
  }

  function renderNextUp() {
    var ol = el('nextUpList');
    var next = doc.trophies.filter(function (t) { return !earned[t.id]; })
      .sort(function (a, b) { return a.stage - b.stage || doc.trophies.indexOf(a) - doc.trophies.indexOf(b); })
      .slice(0, 5);
    ol.innerHTML = '';
    next.forEach(function (t) {
      var li = document.createElement('li');
      li.innerHTML = '<a href="#" data-id="' + t.id + '">' + esc(isHidden(t) ? 'Hidden story trophy' : t.name) + '</a> — ' + esc(KIND_LABELS[t.kind] || t.kind) + ', stage ' + t.stage;
      li.querySelector('a').addEventListener('click', function (e) { e.preventDefault(); select(t.id); });
      ol.appendChild(li);
    });
  }

  function renderKindProgress() {
    var kinds = Object.keys(KIND_LABELS);
    el('kindProgress').innerHTML = kinds.map(function (k) {
      var total = doc.trophies.filter(function (t) { return t.kind === k; }).length;
      if (!total) return '';
      var got = doc.trophies.filter(function (t) { return t.kind === k && earned[t.id]; }).length;
      var pct = Math.round(got / total * 100);
      return '<div class="kind-bar"><span style="width:130px">' + esc(KIND_LABELS[k]) + '</span><span class="bar"><i style="width:' + pct + '%"></i></span><span>' + got + '/' + total + '</span></div>';
    }).join('');
  }

  function select(id) {
    selectedId = id;
    renderList();
    renderDetail();
    var pane = el('detailPane');
    if (pane && window.innerWidth < 860) pane.scrollIntoView({ behavior: 'smooth' });
  }

  function renderDetail() {
    var pane = el('detailPane');
    var t = selectedId ? trophyById(selectedId) : null;
    if (!t) { pane.innerHTML = '<p class="detail-empty">Pick a trophy to see its full guide.</p>'; return; }
    var html = '<h2 class="' + (isHidden(t) ? 'hidden-name' : '') + '">' + esc(displayName(t)) + '</h2>';
    html += '<blockquote>“' + esc(displayDesc(t)) + '”</blockquote>';
    html += '<div class="tags"><span class="pill ' + t.grade + '">' + t.grade + '</span>' +
      '<span class="pill kind">' + esc(KIND_LABELS[t.kind] || t.kind) + '</span>' +
      '<span class="pill kind">Roadmap stage ' + t.stage + '</span>' +
      (t.hidden ? '<span class="pill kind">Hidden</span>' : '<span class="pill kind">Visible</span>') + '</div>';
    if (t.missable) html += '<div class="callout"><strong>Missable — do it early.</strong> This trophy is reported as possibly missable; see the Missables tab for the exact warning.</div>';
    if (t.unconfirmed) html += '<div class="callout warn"><strong>UNCONFIRMED.</strong> No launch-week guide has verified how to unlock this trophy. The steps below say so plainly — do not chase a guessed method.</div>';
    if (t.counter) {
      var cur = counters[t.id] || 0;
      html += '<div class="counter-box"><span>' + esc(t.counter.label) + ':</span><button type="button" data-d="-1" aria-label="Decrease counter">−</button><strong>' + cur + ' / ' + t.counter.target + (t.counter.unit ? ' ' + esc(t.counter.unit) : '') + '</strong><button type="button" data-d="1" aria-label="Increase counter">+</button></div>';
    }
    html += '<h3>Guide</h3><ol class="steps">' + t.guide.map(function (s) {
      return '<li>' + esc(s.text) + ' <sup>[' + s.source + ']</sup></li>';
    }).join('') + '</ol>';
    var used = [];
    t.guide.forEach(function (s) { if (used.indexOf(s.source) === -1) used.push(s.source); });
    html += '<div class="sources-box"><strong>Sources for this trophy:</strong><br>' + used.map(function (n) {
      var s = sourceById(n);
      return '[' + n + '] ' + esc(s.name) + ' — <a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.url) + '</a>';
    }).join('<br>') + '</div>';
    html += '<button type="button" class="mark-btn' + (earned[t.id] ? ' earned' : '') + '" id="markBtn">' + (earned[t.id] ? '✓ Earned — click to unmark' : 'Mark as earned') + '</button>';
    pane.innerHTML = html;
    pane.querySelectorAll('.counter-box button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cur = counters[t.id] || 0;
        cur = Math.max(0, Math.min(t.counter.target, cur + Number(btn.getAttribute('data-d'))));
        counters[t.id] = cur;
        if (cur >= t.counter.target) earned[t.id] = true;
        save(); renderAll(); renderDetail();
      });
    });
    el('markBtn').addEventListener('click', function () {
      if (earned[t.id]) delete earned[t.id]; else earned[t.id] = true;
      save(); renderAll(); renderDetail();
    });
  }

  function renderRoadmap() {
    el('roadmapStages').innerHTML = doc.roadmap.map(function (stage) {
      var names = doc.trophies.filter(function (t) { return t.stage === stage.stage; }).map(function (t) { return t.name; });
      return '<div class="stage"><h3>' + esc(stage.title) + '</h3><p>' + esc(stage.text) + '</p>' +
        '<p class="stage-trophies">' + names.length + ' trophies in this stage: ' + esc(names.join(' · ')) + '</p></div>';
    }).join('');
  }

  function card(t) {
    return '<div class="card"><h4>' + esc(t.name) + ' <span class="pill ' + t.grade + '">' + t.grade + '</span>' +
      (t.unconfirmed ? ' <span class="pill flag">Unconfirmed</span>' : '') +
      (t.missable ? ' <span class="pill flag">Missable</span>' : '') + '</h4>' +
      '<p><em>' + esc(t.description) + '</em></p>' +
      '<p>' + t.guide.map(function (s) { return esc(s.text) + ' <sup>[' + s.source + ']</sup>'; }).join(' ') + '</p></div>';
  }

  function renderMissables() {
    el('watchList').innerHTML = doc.watch.map(function (w) {
      return '<div class="card"><h4>' + esc(w.title) + '</h4><p>' + esc(w.text) + '</p></div>';
    }).join('');
    el('missableCards').innerHTML = doc.trophies.filter(function (t) { return t.missable; }).map(card).join('');
    el('unconfirmedCards').innerHTML = doc.trophies.filter(function (t) { return t.unconfirmed; }).map(card).join('');
  }

  function renderSources() {
    el('sourceList').innerHTML = doc.sources.map(function (s) {
      return '<li><strong>' + esc(s.name) + '</strong><br><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.url) + '</a><br>' + esc(s.note) + '</li>';
    }).join('');
    el('disputeList').innerHTML = doc.disputes.map(function (d) {
      return '<div class="dispute"><h4>' + esc(d.id) + ' — ' + esc(d.title) + '</h4>' +
        '<div class="sides"><div class="side"><b>' + esc(d.side_a.label) + '</b>' + esc(d.side_a.text) + ' <sup>' + d.side_a.sources.map(function (n) { return '[' + n + ']'; }).join(' ') + '</sup></div>' +
        '<div class="side"><b>' + esc(d.side_b.label) + '</b>' + esc(d.side_b.text) + ' <sup>' + d.side_b.sources.map(function (n) { return '[' + n + ']'; }).join(' ') + '</sup></div></div>' +
        '<p class="verdict"><strong>Our take:</strong> ' + esc(d.verdict) + '</p></div>';
    }).join('');
  }

  function setView(name) {
    document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-view') === name); });
    document.querySelectorAll('.view').forEach(function (v) { v.classList.toggle('active', v.id === 'view-' + name); });
  }

  function renderAll() { renderHeader(); renderList(); }

  function init() {
    load();
    maybeDemo();
    var view = params.get('view');
    if (params.get('spoiler') === 'on') spoiler = true;
    el('spoilerToggle').checked = spoiler;
    fetch('data/trophies.json').then(function (r) { return r.json(); }).then(function (data) {
      doc = data;
      renderAll();
      renderRoadmap();
      renderMissables();
      renderSources();
      if (view && ['tracker', 'roadmap', 'missables', 'sources'].indexOf(view) !== -1) setView(view);
      var tid = params.get('trophy');
      if (tid && trophyById(tid)) select(tid);
    }).catch(function () {
      el('trophyList').innerHTML = '<li>Could not load data/trophies.json.</li>';
    });

    document.querySelectorAll('.tab').forEach(function (b) {
      b.addEventListener('click', function () { setView(b.getAttribute('data-view')); });
    });
    el('spoilerToggle').addEventListener('change', function (e) { spoiler = e.target.checked; renderAll(); renderDetail(); });
    ['searchBox', 'kindFilter', 'sortBox', 'onlyRemaining'].forEach(function (id) {
      el(id).addEventListener('input', renderList);
      el(id).addEventListener('change', renderList);
    });
    el('exportBtn').addEventListener('click', function () {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify({ earned: earned, counters: counters }, null, 2)], { type: 'application/json' }));
      a.download = 'fifty-five-progress.json';
      a.click();
    });
    el('importBtn').addEventListener('click', function () { el('importFile').click(); });
    el('importFile').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      file.text().then(function (text) {
        var parsed = JSON.parse(text);
        earned = parsed.earned || {};
        counters = parsed.counters || {};
        save(); renderAll(); renderDetail();
      }).catch(function () { alert('That file is not valid progress JSON.'); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
