// FIFTY-FIVE — GTA VI trophy guide & tracker. Static, offline, no network.
// Progress lives in localStorage; export/import round-trips it as JSON.
const KEY = 'fifty-five-gta6-progress-v1';
const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = Object.fromEntries(trophies.map((t) => [t.id, t]));

let saved = null;
try { saved = JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { saved = null; }
let earned = new Set(saved?.earned ?? []);
let counters = saved?.counters ?? {};

// ?demo=1 seeds 10 earned + 6/18 meditations, only when nothing is saved yet.
if (params.get('demo') === '1' && !saved) {
  earned = new Set(['just-like-paradise', 'paradise-lost', 'trust', 'family-matters', 'stick-fiddler', 'master-of-none', 'whip-it-good', 'the-goodtime-state', 'treat-yo-self', 'on-the-spot']);
  counters = { 'positive-mental-attitude': 6 };
  persist();
}

let spoiler = params.get('spoiler') === 'on';
let view = params.get('view') || 'tracker';
let selected = params.get('trophy') || null;

const $ = (id) => document.getElementById(id);
const listEl = $('list'), detailEl = $('detail');

function persist() {
  localStorage.setItem(KEY, JSON.stringify({ earned: [...earned], counters }));
}

function shielded(t) {
  return spoiler && t.hidden && t.kind === 'story' && !earned.has(t.id);
}

function gradeLabel(g) { return g[0].toUpperCase() + g.slice(1); }

function renderHeader() {
  const total = trophies.length;
  $('progress').textContent = `${earned.size} / ${total}`;
  $('barfill').style.width = `${(earned.size / total) * 100}%`;
  $('grade-progress').textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${trophies.filter((t) => t.grade === g && earned.has(t.id)).length}/${trophies.filter((t) => t.grade === g).length} ${g}`)
    .join(' · ');
  $('spoiler').checked = spoiler;
  const cited = trophies.reduce((a, t) => a + t.steps.length, 0);
  $('proof').innerHTML =
    `<span><b>${trophies.length}/${trophies.length}</b> trophy names listed</span>` +
    `<span><b>${cited}</b> cited guide steps</span>` +
    `<span><b>${doc.sources.length}</b> sources, read 20 Nov 2026</span>` +
    `<span><b>${trophies.filter((t) => t.hidden).length}</b> hidden · <b>${trophies.filter((t) => t.unconfirmed).length}</b> unconfirmed · <b>${trophies.filter((t) => t.missable).length}</b> missable</span>` +
    `<span>Platinum: ~200–300 hrs, 1 playthrough, 0 online trophies</span>`;
}

function filtered() {
  const q = $('search').value.trim().toLowerCase();
  const kind = $('kind').value;
  const grade = $('grade').value;
  const hideEarned = $('hide-earned').checked;
  let out = trophies.filter((t) => {
    if (hideEarned && earned.has(t.id)) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (kind === 'missable') { if (!t.missable) return false; }
    else if (kind !== 'all' && t.kind !== kind) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q))) return false;
    return true;
  });
  const sort = $('sort').value;
  const gradeRank = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  if (sort === 'name') out = [...out].sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'grade') out = [...out].sort((a, b) => gradeRank[a.grade] - gradeRank[b.grade] || a.name.localeCompare(b.name));
  else out = [...out].sort((a, b) => a.stage - b.stage || a.name.localeCompare(b.name));
  return out;
}

function renderList() {
  listEl.replaceChildren();
  for (const t of filtered()) {
    const li = document.createElement('li');
    if (selected === t.id) li.classList.add('selected');
    if (earned.has(t.id)) li.classList.add('earned');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${shielded(t) ? 'hidden story trophy' : t.name} earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      persist(); renderAll();
    });
    box.addEventListener('click', (e) => e.stopPropagation());
    const wrap = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = shielded(t) ? 'Hidden story trophy' : t.name;
    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = shielded(t) ? 'Spoiler shield is on — earn it to reveal the name.' : t.desc;
    const tags = document.createElement('span');
    tags.innerHTML =
      `<span class="tag ${t.grade}">${t.grade}</span>` +
      `<span class="tag">${t.kind}</span>` +
      `<span class="tag">stage ${t.stage}</span>` +
      (t.hidden ? `<span class="tag hidden">hidden</span>` : '') +
      (t.missable ? `<span class="tag missable">missable</span>` : '') +
      (t.unconfirmed ? `<span class="tag unconfirmed">unconfirmed</span>` : '');
    name.append(tags);
    wrap.append(name, desc);
    li.append(box, wrap);
    li.addEventListener('click', () => { selected = t.id; renderAll(); });
    listEl.append(li);
  }
  if (!listEl.children.length) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'No trophies match these filters.';
    listEl.append(p);
  }
}

function renderDetail() {
  const t = byId[selected];
  if (!t) {
    detailEl.innerHTML = '<p class="muted">Pick a trophy to see its full guide.</p>';
    return;
  }
  const isEarned = earned.has(t.id);
  const hidden = shielded(t);
  const srcMap = Object.fromEntries(doc.sources.map((s) => [s.n, s]));
  const stepsHtml = t.steps.map((st) =>
    `<li>${escapeHtml(st.t.replace(/ \[\d+\]/g, ''))} <sup>[${st.s}]</sup></li>`).join('');
  const counter = t.counter;
  const count = counter ? Math.min(counters[t.id] ?? 0, counter.target) : 0;
  detailEl.innerHTML = `
    <h2>${hidden ? 'Hidden story trophy' : escapeHtml(t.name)}</h2>
    <p>
      <span class="tag ${t.grade}">${t.grade}</span>
      <span class="tag">${t.kind}</span>
      <span class="tag">stage ${t.stage}</span>
      ${t.hidden ? '<span class="tag hidden">hidden</span>' : ''}
      ${t.missable ? '<span class="tag missable">missable</span>' : ''}
      ${t.unconfirmed ? '<span class="tag unconfirmed">unconfirmed</span>' : ''}
    </p>
    <p class="official">${hidden ? 'Name and description hidden by the spoiler shield.' : '“' + escapeHtml(t.desc) + '”'}</p>
    ${t.missable ? '<div class="callout"><b>Missable — read first.</b> The first meditation is only available in Chapter 1. Do it before the chapter ends, and keep a manual save at the start and end of every chapter.</div>' : ''}
    ${t.unconfirmed ? '<div class="callout amber"><b>UNCONFIRMED.</b> No guide has verified this method yet. The steps below are the best current guess — do not grind blindly; check the Sources tab for updates.</div>' : ''}
    ${counter ? `<div class="counter-box"><span>${escapeHtml(counter.label)}:</span><button type="button" data-d="-1" aria-label="Decrease counter">−</button><output>${count} / ${counter.target}</output><button type="button" data-d="1" aria-label="Increase counter">+</button></div>` : ''}
    <h3>Guide</h3>
    <ol class="steps">${stepsHtml}</ol>
    <p class="muted">Sources: ${[...new Set(t.steps.map((st) => st.s))].map((n) => `[${n}] ${escapeHtml(srcMap[n].name)}`).join('; ')}</p>
    <button type="button" id="mark-earned">${isEarned ? '✓ Earned — unmark' : 'Mark as earned'}</button>`;
  detailEl.querySelector('#mark-earned').addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
    persist(); renderAll();
  });
  detailEl.querySelectorAll('.counter-box button').forEach((b) => {
    b.addEventListener('click', () => {
      const cur = counters[t.id] ?? 0;
      counters[t.id] = Math.max(0, Math.min(counter.target, cur + Number(b.dataset.d)));
      persist(); renderAll();
    });
  });
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderNextUp() {
  const next = trophies.filter((t) => !earned.has(t.id)).slice(0, 5);
  $('nextup').replaceChildren();
  for (const t of next) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = shielded(t) ? 'Hidden story trophy' : t.name;
    b.addEventListener('click', () => { selected = t.id; renderAll(); });
    li.append(b);
    $('nextup').append(li);
  }
  const kinds = ['story', 'side', 'collectible', 'activity', 'crime', 'misc', 'completion', 'platinum'];
  $('bykind').replaceChildren();
  for (const k of kinds) {
    const inKind = trophies.filter((t) => t.kind === k);
    const done = inKind.filter((t) => earned.has(t.id)).length;
    const li = document.createElement('li');
    li.innerHTML = `<span>${k}</span><span>${done}/${inKind.length}</span>`;
    $('bykind').append(li);
  }
}

function renderRoadmap() {
  const el = $('roadmap');
  el.replaceChildren();
  for (const r of doc.roadmap) {
    const done = trophies.filter((t) => t.stage === r.stage && earned.has(t.id)).length;
    const total = trophies.filter((t) => t.stage === r.stage).length;
    const div = document.createElement('div');
    div.className = 'stage';
    div.innerHTML = `<h3>Stage ${r.stage} — ${escapeHtml(r.title)} <span class="hours">${escapeHtml(r.hours)} hours</span></h3><p>${escapeHtml(r.text)}</p><p class="muted">${done}/${total} stage trophies earned</p>`;
    el.append(div);
  }
}

function renderMissables() {
  const el = $('missables');
  el.replaceChildren();
  const watch = [
    { t: byId['positive-mental-attitude'], title: 'The one missable trophy', body: 'Meditate at all 18 spots. The first one — the balcony at Jason’s house with Lucia, after the mission Down to Earth — is only available in Chapter 1. Miss it and the trophy is locked for this playthrough.' },
    { t: null, title: 'No mission replay', body: 'There is no mission replay and no New Game+. Keep a manual save at the start and end of every chapter (15 slots).' },
    { t: null, title: 'Cheats disable trophies', body: 'Cheats unlock only after the story and disable both trophies and saving while active. Keep them off your platinum save.' },
    { t: null, title: 'Character-locked strands', body: 'Andy is Lucia-only; Tyrone and Bret are Jason-only. Switch characters for their strands.' },
    { t: null, title: 'Irredeemable profile', body: 'The Irredeemable criminal profile is permanent and makes the police more aggressive. Avoid it.' },
    { t: null, title: 'Unconfirmed methods', body: 'Six trophies are labelled UNCONFIRMED — their methods are not verified yet. Do not grind them blindly.' },
  ];
  for (const w of watch) {
    const div = document.createElement('div');
    div.className = 'watch-card';
    div.innerHTML = `<h3>${escapeHtml(w.title)}${w.t ? ` — ${escapeHtml(w.t.name)}` : ''}</h3><p>${escapeHtml(w.body)}</p>`;
    if (w.t) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Open guide';
      b.addEventListener('click', () => { selected = w.t.id; showView('tracker'); renderAll(); });
      div.append(b);
    }
    el.append(div);
  }
}

function renderSources() {
  const el = $('sources');
  el.replaceChildren();
  for (const s of doc.sources) {
    const li = document.createElement('li');
    li.innerHTML = `<b>[${s.n}]</b> <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a> — read ${escapeHtml(s.read)}`;
    el.append(li);
  }
  const dEl = $('disputes');
  dEl.replaceChildren();
  for (const d of doc.disputes) {
    const div = document.createElement('div');
    div.className = 'dispute';
    div.innerHTML = `<h3>${escapeHtml(d.topic)}</h3><p><b>Side A:</b> ${escapeHtml(d.sideA)}</p><p><b>Side B:</b> ${escapeHtml(d.sideB)}</p><p class="take">Our take: ${escapeHtml(d.take)}</p>`;
    dEl.append(div);
  }
}

function showView(v) {
  view = v;
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
  for (const name of ['tracker', 'roadmap', 'missables', 'sources']) {
    $(`view-${name}`).hidden = name !== v;
  }
}

function renderAll() {
  renderHeader(); renderList(); renderDetail(); renderNextUp(); renderRoadmap(); renderMissables(); renderSources();
}

document.querySelectorAll('.tabs button').forEach((b) =>
  b.addEventListener('click', () => { showView(b.dataset.view); }));
for (const id of ['search', 'kind', 'grade', 'sort', 'hide-earned']) {
  $(id).addEventListener('input', renderList);
  $(id).addEventListener('change', renderList);
}
$('spoiler').addEventListener('change', (e) => { spoiler = e.target.checked; renderAll(); });
$('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ earned: [...earned], counters }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fifty-five-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    earned = new Set((data.earned ?? []).filter((id) => byId[id]));
    counters = data.counters ?? {};
    persist(); renderAll();
  } catch { alert('That file is not valid progress JSON.'); }
  e.target.value = '';
});

showView(['tracker', 'roadmap', 'missables', 'sources'].includes(view) ? view : 'tracker');
renderAll();
