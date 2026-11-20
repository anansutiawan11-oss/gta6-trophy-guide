// FIFTY-FIVE — GTA VI trophy tracker. Static, offline, no network at runtime.
// Progress lives in localStorage; export/import round-trips the same JSON shape.
const KEY = 'fiftyfive-progress-v1';
const params = new URLSearchParams(location.search);

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));
const sources = new Map(doc.sources.map((s) => [s.id, s]));

let saved = null;
try { saved = JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { saved = null; }
let state = saved && Array.isArray(saved.earned)
  ? { earned: new Set(saved.earned), counters: saved.counters ?? {} }
  : { earned: new Set(), counters: {} };

const hadSaved = !!saved;
if (params.get('demo') === '1' && !hadSaved) {
  // Demo seed for screenshots: 10 earned, 6 of 18 meditations.
  [2, 3, 4, 5, 6, 8, 9, 10, 11, 12].forEach((id) => state.earned.add(id));
  state.counters = { 28: 6 };
}

let spoiler = params.get('spoiler') === 'on';
const spoilerToggle = document.getElementById('spoilerToggle');
spoilerToggle.checked = spoiler;
spoilerToggle.addEventListener('change', () => { spoiler = spoilerToggle.checked; renderAll(); });

let selectedId = Number(params.get('trophy') ?? '') || null;
let currentView = params.get('view') || 'tracker';

function save() {
  localStorage.setItem(KEY, JSON.stringify({ earned: [...state.earned], counters: state.counters }));
}
function isRevealed(t) { return !t.hidden || state.earned.has(t.id) || !spoiler; }
function displayName(t) { return isRevealed(t) ? t.name : 'Hidden trophy'; }
function displayDesc(t) { return isRevealed(t) ? t.description : 'Hidden — earn this trophy to reveal its name and description.'; }
function gradeLabel(g) { return g[0].toUpperCase() + g.slice(1); }
function sourceNote(n) { const s = sources.get(n); return s ? `[${n}] ${s.name}` : `[${n}]`; }

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList'), detailEl = $('detailPane');

function renderHeader() {
  const total = trophies.length, done = state.earned.size;
  const pct = Math.round((done / total) * 100);
  $('progressBig').textContent = `${done} / ${total}`;
  $('progressText').textContent = `${done} earned · ${pct}%`;
  $('progressBar').style.width = `${pct}%`;
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const all = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && state.earned.has(t.id)).length;
    return `${gradeLabel(g)} ${got}/${all}`;
  });
  $('gradeBreakdown').textContent = parts.join(' · ');
}

function renderProof() {
  const steps = trophies.reduce((a, t) => a + (t.steps ? t.steps.length : 0), 0);
  $('proofStrip').innerHTML =
    `<strong>Proof:</strong> ${trophies.length}/${trophies.length} official trophy names · ` +
    `${steps} cited guide steps · ${doc.sources.length} sources · ${doc.disputes.length} disputes shown both sides · ` +
    `${trophies.filter((t) => t.hidden).length} hidden · ${trophies.filter((t) => t.unconfirmed).length} unconfirmed · ` +
    `1 possibly missable. Roadmap: 3 stages, ~200 hours [1].`;
}

function kindProgressHTML() {
  const kinds = [...new Set(trophies.map((t) => t.kind))];
  return kinds.map((k) => {
    const all = trophies.filter((t) => t.kind === k);
    const got = all.filter((t) => state.earned.has(t.id)).length;
    const pct = all.length ? Math.round((got / all.length) * 100) : 0;
    return `<div class="kind-row"><strong>${k}</strong> — ${got}/${all.length} (${pct}%)<div class="bar"><span style="width:${pct}%"></span></div></div>`;
  }).join('');
}

function filteredTrophies() {
  const q = $('search').value.trim().toLowerCase();
  const kind = $('kindFilter').value;
  const grade = $('gradeFilter').value;
  const sort = $('sortOrder').value;
  const hideEarned = $('hideEarned').checked;
  let out = trophies.filter((t) => {
    if (hideEarned && state.earned.has(t.id)) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (kind === 'missable') { if (!t.missable) return false; }
    else if (kind !== 'all' && t.kind !== kind) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
  if (sort === 'name') out = [...out].sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'grade') {
    const rank = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
    out = [...out].sort((a, b) => rank[a.grade] - rank[b.grade] || a.id - b.id);
  }
  return out;
}

function renderList() {
  const rows = filteredTrophies();
  listEl.replaceChildren();
  if (!rows.length) {
    const li = document.createElement('li');
    li.innerHTML = '<p class="muted" style="padding:12px">No trophies match these filters.</p>';
    listEl.append(li);
    return;
  }
  for (const t of rows) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'row' + (selectedId === t.id ? ' selected' : '');
    const earned = state.earned.has(t.id);
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned;
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      if (box.checked) state.earned.add(t.id); else state.earned.delete(t.id);
      save(); renderAll();
    });
    const mid = document.createElement('span');
    const name = document.createElement('span');
    name.className = 'tname' + (earned ? ' earned' : '');
    name.textContent = displayName(t);
    const desc = document.createElement('span');
    desc.className = 'tdesc';
    desc.textContent = displayDesc(t);
    mid.append(name, document.createElement('br'), desc);
    if (t.missable) { const tag = document.createElement('span'); tag.className = 'tag tag-missable'; tag.textContent = 'MISSABLE'; mid.append(tag); }
    if (t.unconfirmed) { const tag = document.createElement('span'); tag.className = 'tag tag-unconfirmed'; tag.textContent = 'UNCONFIRMED'; mid.append(tag); }
    if (t.hidden && !state.earned.has(t.id)) { const tag = document.createElement('span'); tag.className = 'tag tag-hidden'; tag.textContent = 'HIDDEN'; mid.append(tag); }
    const tag = document.createElement('span');
    tag.className = `grade-tag grade-${t.grade}`;
    tag.textContent = gradeLabel(t.grade);
    btn.append(box, mid, tag);
    btn.addEventListener('click', () => { selectedId = t.id; renderList(); renderDetail(); });
    li.append(btn);
    listEl.append(li);
  }
}

function renderDetail() {
  const t = selectedId ? byId.get(selectedId) : null;
  if (!t) { detailEl.innerHTML = '<p class="muted">Pick a trophy to see its full guide.</p>'; return; }
  const revealed = isRevealed(t);
  const earned = state.earned.has(t.id);
  const el = document.createElement('div');
  const h = document.createElement('h2');
  h.textContent = displayName(t);
  el.append(h);
  const tags = document.createElement('p');
  tags.innerHTML = '';
  const g = document.createElement('span'); g.className = `grade-tag grade-${t.grade}`; g.textContent = gradeLabel(t.grade);
  tags.append(g);
  for (const [label, val] of [['Kind', t.kind], ['Stage', `Roadmap stage ${t.stage}`]]) {
    const s = document.createElement('span'); s.className = 'tag tag-hidden'; s.textContent = `${label}: ${val}`; tags.append(s);
  }
  el.append(tags);
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `Official description: “${displayDesc(t)}”`;
  el.append(official);
  if (!revealed) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Spoiler shield is on. The guide for this hidden trophy is hidden until you earn it — or turn the shield off.';
    el.append(p);
  } else {
    if (t.missable) {
      const c = document.createElement('div'); c.className = 'callout';
      c.innerHTML = '<strong>Missable — read this first.</strong> One meditation spot is only available in Chapter 1. Do it before the chapter ends, or this trophy (and the platinum) needs a new playthrough [1].';
      el.append(c);
    }
    if (t.unconfirmed) {
      const c = document.createElement('div'); c.className = 'callout unconfirmed';
      c.textContent = 'UNCONFIRMED: no source had verified this trophy’s unlock method at launch. The guide below is a best guess from the description — treat it as unverified.';
      el.append(c);
    }
    if (t.counter) {
      const box = document.createElement('div'); box.className = 'counter-box';
      const cur = state.counters[t.id] ?? 0;
      const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', 'Decrease counter');
      const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', 'Increase counter');
      const label = document.createElement('span'); label.textContent = `Progress: ${cur} / ${t.counter.target} ${t.counter.unit}`;
      minus.addEventListener('click', () => { state.counters[t.id] = Math.max(0, (state.counters[t.id] ?? 0) - 1); save(); renderAll(); });
      plus.addEventListener('click', () => { state.counters[t.id] = Math.min(t.counter.target, (state.counters[t.id] ?? 0) + 1); save(); renderAll(); });
      box.append(minus, label, plus);
      el.append(box);
    }
    const guide = document.createElement('p'); guide.className = 'guide-text'; guide.textContent = t.guide;
    el.append(guide);
    const stepsTitle = document.createElement('h3'); stepsTitle.textContent = 'Steps';
    const ol = document.createElement('ol'); ol.className = 'steps';
    for (const s of t.steps ?? []) { const li = document.createElement('li'); li.textContent = s; ol.append(li); }
    el.append(stepsTitle, ol);
    const srcs = new Set();
    for (const m of (t.guide + ' ' + (t.steps ?? []).join(' ')).matchAll(/\[(\d+)\]/g)) srcs.add(Number(m[1]));
    if (srcs.size) {
      const box = document.createElement('div'); box.className = 'sources-box';
      box.innerHTML = '<strong>Sources for this trophy:</strong>';
      const ul = document.createElement('ul');
      for (const n of [...srcs].sort((a, b) => a - b)) { const li = document.createElement('li'); li.textContent = sourceNote(n); ul.append(li); }
      box.append(ul);
      el.append(box);
    }
  }
  const mark = document.createElement('button');
  mark.type = 'button'; mark.className = 'mark-btn';
  mark.textContent = earned ? 'Mark as not earned' : 'Mark as earned';
  mark.addEventListener('click', () => {
    if (state.earned.has(t.id)) state.earned.delete(t.id); else state.earned.add(t.id);
    save(); renderAll();
  });
  el.append(mark);
  detailEl.replaceChildren(el);
}

function renderNextUp() {
  const next = trophies.filter((t) => !state.earned.has(t.id)).slice(0, 3);
  $('nextUp').innerHTML = next.length
    ? `<strong>Next up:</strong> ${next.map((t) => displayName(t)).join(' · ')}`
    : '<strong>Next up:</strong> nothing left — the platinum is yours.';
}

function renderRoadmap() {
  $('roadmapList').innerHTML = doc.roadmap.map((s) =>
    `<li><strong>${s.title}</strong><p>${s.text}</p></li>`).join('');
  $('roadmapKinds').innerHTML = kindProgressHTML();
}

function renderMissables() {
  const cards = [];
  const med = byId.get(28);
  cards.push(`<article class="card"><h3>${med.name} — MISSABLE</h3>
    <p>${med.guide}</p>
    <p><strong>Do this in Chapter 1:</strong> meditate at Jason's house before the chapter ends [1].</p></article>`);
  const watch = [
    [25, 'Strangers &amp; Freaks', 'Start stranger strands when they appear. Sources disagree on whether all eight can wait until after the story, so do not leave them all for free roam [1].'],
    [31, 'You WAiNKer!', 'Scan every new vehicle and location with WAiNK from the start — 200 vehicle models and 100 locations feed the 100% checklist [1].'],
    [15, 'Cunning Stunts', 'Stunts are scattered across the map; attempting them as you travel beats a dedicated sweep later. 250 for the trophy, 300 for 100% [1].'],
    [30, 'Don’t Touch My Deck', 'Cards are easy to walk past. Pick them up as you explore — 3 sets for the trophy, 15 for 100% [2].'],
  ];
  for (const [id, name, text] of watch) {
    cards.push(`<article class="card watch"><h3>${name} — watch list</h3><p>${text}</p></article>`);
  }
  cards.push(`<article class="card watch"><h3>Cheats — watch list</h3><p>Cheats disable trophies and saving, so keep them off your platinum save entirely [1].</p></article>`);
  $('missableCards').innerHTML = cards.join('');
}

function renderSources() {
  $('sourceList').innerHTML = doc.sources.map((s) =>
    `<li><strong>[${s.id}] ${s.name}</strong> — <a href="${s.url}" target="_blank" rel="noopener">${s.url}</a><br>${s.note}</li>`).join('');
  $('disputeList').innerHTML = doc.disputes.map((d) =>
    `<article class="dispute"><h4>${d.id} — ${d.title}</h4><p><strong>Side A:</strong> ${d.sideA}</p><p><strong>Side B:</strong> ${d.sideB}</p><p class="verdict">Our call: ${d.verdict}</p></article>`).join('');
}

function setView(v) {
  currentView = v;
  for (const b of document.querySelectorAll('.tabs button')) {
    b.setAttribute('aria-selected', String(b.dataset.view === v));
  }
  for (const s of document.querySelectorAll('.view')) {
    s.hidden = s.id !== `view-${v}`;
  }
  const url = new URL(location.href);
  url.searchParams.set('view', v);
  history.replaceState(null, '', url);
}
for (const b of document.querySelectorAll('.tabs button')) {
  b.addEventListener('click', () => setView(b.dataset.view));
}

function renderAll() {
  renderHeader(); renderProof(); renderList(); renderDetail(); renderNextUp();
  renderRoadmap(); renderMissables(); renderSources();
  $('kindProgress').innerHTML = kindProgressHTML();
  setView(currentView);
}

$('search').addEventListener('input', renderList);
$('kindFilter').addEventListener('change', renderList);
$('gradeFilter').addEventListener('change', renderList);
$('sortOrder').addEventListener('change', renderList);
$('hideEarned').addEventListener('change', renderList);

$('exportBtn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ earned: [...state.earned], counters: state.counters }, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
});
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.earned)) throw new Error('bad file');
    state = { earned: new Set(data.earned.filter((id) => byId.has(id))), counters: data.counters ?? {} };
    save(); renderAll();
  } catch { alert('That file is not a valid progress export.'); }
});
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies and counters?')) return;
  state = { earned: new Set(), counters: {} };
  save(); renderAll();
});

renderAll();
if (selectedId && byId.has(selectedId)) { renderDetail(); }
