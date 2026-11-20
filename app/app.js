// FIFTY-FIVE — GTA VI trophy guide & tracker. Static and offline: no network
// at run time. Loads app/data/trophies.json, renders tracker / roadmap /
// missables / sources, and keeps earned ticks plus per-trophy counters in
// localStorage.
const KEY_EARNED = 'fiftyfive-earned-v1';
const KEY_COUNTS = 'fiftyfive-counts-v1';
const KEY_SPOILER = 'fiftyfive-spoiler-v1';

const query = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const sourceById = new Map(doc.sources.map((s) => [s.id, s]));

let earned = readStored(KEY_EARNED);
let counts = readStored(KEY_COUNTS);
let spoilerOn = localStorage.getItem(KEY_SPOILER) === '1';
let activeFilter = 'all';
let searchText = '';
let sortMode = 'roadmap';
let selected = 0;
let currentView = 'tracker';

if (['tracker', 'roadmap', 'missables', 'sources'].includes(query.get('view'))) currentView = query.get('view');
if (query.get('spoiler') === 'on') spoilerOn = true;
if (query.get('demo') === '1' && earned.size === 0) seedDemo();
const picked = Number(query.get('trophy'));
if (query.get('trophy') !== null && Number.isInteger(picked) && picked >= 0 && picked < trophies.length) selected = picked;

function readStored(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (key === KEY_EARNED) return new Set(Array.isArray(raw) ? raw : []);
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return key === KEY_EARNED ? new Set() : {};
  }
}

function persist() {
  localStorage.setItem(KEY_EARNED, JSON.stringify([...earned]));
  localStorage.setItem(KEY_COUNTS, JSON.stringify(counts));
  localStorage.setItem(KEY_SPOILER, spoilerOn ? '1' : '0');
  document.getElementById('savedNote').textContent = 'Saved in this browser';
}

// Demo progress, only for the maker's screenshots (?demo=1): 10 earned,
// a half-finished meditation counter, and the Positive Mental Attitude
// guide open.
function seedDemo() {
  earned = new Set([1, 2, 7, 19, 20, 34, 41, 45, 52, 53]);
  counts = { 27: 6 };
  selected = 27;
  persist();
}

function masked(t) {
  return spoilerOn && t.hidden && !earned.has(trophies.indexOf(t));
}

function gradeLetter(g) {
  return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[g];
}

function citeList(ids) {
  return ids.map((id) => {
    const s = sourceById.get(id);
    return s ? `[${id}] ${s.name}` : `[${id}]`;
  }).join(' · ');
}

function fmt(n) {
  return n >= 1000 ? n.toLocaleString('en-US') : String(n);
}

function onWatchList(t) {
  return t.missable === 'possible' || t.note.startsWith('Watch list') || t.name === 'Strangers & Freaks';
}

function renderProofStrip() {
  const steps = trophies.reduce((n, t) => n + t.steps.length, 0);
  const twoPlus = trophies.filter((t) => t.sources.length >= 2).length;
  const hidden = trophies.filter((t) => t.hidden).length;
  const unconfirmed = trophies.filter((t) => t.note.includes('UNCONFIRMED')).length;
  const items = [
    '<b>55/55</b> official name, description &amp; grade',
    `<b>1P 2G 6S 46B</b> · <b>${hidden}</b> PSN-hidden`,
    `<b>55/55</b> guides cite sources · <b>${steps}</b> steps, all cited`,
    `<b>${twoPlus}</b> backed by 2+ sources`,
    '<b>7</b> sources read 20 Nov 2026',
    `<span class="warn"><b>1</b> possibly missable</span> · <b>${unconfirmed}</b> unconfirmed`,
    '<b>5</b> disputes shown both ways',
    '<b>0</b> online trophies',
  ];
  document.getElementById('proofStrip').innerHTML = items.map((x) => `<span>${x}</span>`).join('');
}

const FILTERS = [
  ['all', 'All 55'], ['story', 'Story 12'], ['side', 'Side quests 7'],
  ['collectible', 'Collectibles 5'], ['activity', 'Activities 8'], ['crime', 'Crime 10'],
  ['misc', 'Misc 11'], ['online', 'Online 0'], ['hidden', 'PSN-hidden 28'],
  ['watch', 'Watch list 8'], ['unconfirmed', 'Unconfirmed 6'], ['notearned', 'Not earned'],
];

function renderFilterChips() {
  const box = document.getElementById('filters');
  box.replaceChildren();
  for (const [key, label] of FILTERS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (key === activeFilter ? ' active' : '') + ((key === 'watch' || key === 'unconfirmed') ? ' warnchip' : '');
    b.textContent = label;
    b.addEventListener('click', () => {
      activeFilter = key;
      renderFilterChips();
      renderTrophyList();
    });
    box.append(b);
  }
}

function visibleTrophies() {
  let list = trophies.map((t, i) => ({ t, i }));
  if (activeFilter === 'hidden') list = list.filter(({ t }) => t.hidden);
  else if (activeFilter === 'watch') list = list.filter(({ t }) => onWatchList(t));
  else if (activeFilter === 'unconfirmed') list = list.filter(({ t }) => t.note.includes('UNCONFIRMED'));
  else if (activeFilter === 'notearned') list = list.filter(({ i }) => !earned.has(i));
  else if (activeFilter === 'online') list = [];
  else if (activeFilter !== 'all') list = list.filter(({ t }) => t.kind === activeFilter);
  if (searchText) {
    const q = searchText.toLowerCase();
    list = list.filter(({ t }) => (t.name + ' ' + t.description).toLowerCase().includes(q));
  }
  if (sortMode === 'name') list.sort((a, b) => a.t.name.localeCompare(b.t.name));
  else if (sortMode === 'grade') {
    const order = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
    list.sort((a, b) => order[a.t.grade] - order[b.t.grade] || a.t.name.localeCompare(b.t.name));
  } else list.sort((a, b) => a.t.stage - b.t.stage || a.i - b.i);
  return list;
}

function renderTrophyList() {
  const list = visibleTrophies();
  const ol = document.getElementById('trophyList');
  document.getElementById('shownCount').textContent = `${list.length} shown · ${earned.size} of 55 earned`;
  ol.replaceChildren();
  for (const { t, i } of list) {
    const li = document.createElement('li');
    if (i === selected) li.classList.add('sel');
    if (earned.has(i)) li.classList.add('earned');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(i);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('click', (e) => { e.stopPropagation(); toggleEarned(i); });
    const chip = document.createElement('span');
    chip.className = `gradechip ${t.grade}`;
    chip.textContent = gradeLetter(t.grade);
    const mid = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'tname';
    name.textContent = masked(t) ? 'Hidden trophy — earn it to reveal' : t.name;
    const desc = document.createElement('div');
    desc.className = 'tdesc';
    desc.textContent = masked(t) ? 'Hidden on PSN until earned.' : t.description;
    const meta = document.createElement('div');
    meta.className = 'tmeta';
    meta.textContent = `${t.grade} · ${t.kind} · Stage ${t.stage} · ${t.sources.length} src`;
    if (t.missable === 'possible') {
      const b = document.createElement('span');
      b.className = 'badge miss';
      b.textContent = 'POSSIBLY MISSABLE';
      meta.append(b);
    }
    if (onWatchList(t) && t.missable !== 'possible') {
      const b = document.createElement('span');
      b.className = 'badge watch';
      b.textContent = 'WATCH';
      meta.append(b);
    }
    if (t.note.includes('UNCONFIRMED')) {
      const b = document.createElement('span');
      b.className = 'badge unc';
      b.textContent = 'UNCONFIRMED';
      meta.append(b);
    }
    if (t.hidden && !masked(t)) {
      const b = document.createElement('span');
      b.className = 'badge hid';
      b.textContent = 'PSN-HIDDEN';
      meta.append(b);
    }
    if (t.count) {
      const have = counts[i] ?? 0;
      const b = document.createElement('span');
      b.className = 'badge hid';
      b.textContent = `${fmt(have)} / ${fmt(t.count.need)} ${t.count.label}`;
      meta.append(b);
    }
    mid.append(name, desc, meta);
    li.append(box, chip, mid);
    li.addEventListener('click', () => selectTrophy(i));
    ol.append(li);
  }
}

function toggleEarned(i) {
  if (earned.has(i)) earned.delete(i);
  else earned.add(i);
  persist();
  renderAll();
}

function selectTrophy(i) {
  selected = i;
  renderTrophyList();
  renderTrophyDetail();
  renderNextUp();
}

function renderTrophyDetail() {
  const t = trophies[selected];
  const i = selected;
  const pane = document.getElementById('detailPane');
  pane.replaceChildren();
  const h2 = document.createElement('h2');
  h2.textContent = masked(t) ? 'Hidden trophy' : t.name;
  pane.append(h2);
  const tags = document.createElement('div');
  tags.className = 'tagrow';
  for (const [label, cls] of [[t.grade, t.grade], [t.kind, 'kind'], [`Stage ${t.stage}`, 'stage']]) {
    const s = document.createElement('span');
    s.className = `tag ${cls}`;
    s.textContent = label;
    tags.append(s);
  }
  if (t.hidden) {
    const s = document.createElement('span');
    s.className = 'tag stage';
    s.textContent = 'PSN-hidden';
    tags.append(s);
  }
  pane.append(tags);

  if (masked(t)) {
    const call = document.createElement('div');
    call.className = 'callout note';
    call.innerHTML = '<b>Spoiler shield is on.</b> This trophy is hidden on PlayStation until earned, so its name, description and guide stay covered. Turn the shield off, or mark it earned, to read it.';
    pane.append(call);
  } else {
    const off = document.createElement('div');
    off.className = 'official';
    off.innerHTML = '<b>OFFICIAL DESCRIPTION — AS PLAYSTATION PUBLISHES IT</b>';
    off.append(document.createTextNode(`“${t.description}”`));
    pane.append(off);

    if (t.missable === 'possible') {
      const call = document.createElement('div');
      call.className = 'callout miss';
      call.innerHTML = '<b>POSSIBLY MISSABLE — the only one.</b> Do the Chapter 1 balcony meditation before Chapter 1 ends. Whether the trophy needs it is still unconfirmed; the safe play is to do it.';
      pane.append(call);
    }
    if (t.note) {
      const call = document.createElement('div');
      call.className = 'callout ' + (t.note.includes('UNCONFIRMED') ? 'unc' : 'note');
      call.textContent = t.note;
      pane.append(call);
    }
    if (t.count) {
      const have = counts[i] ?? 0;
      const row = document.createElement('div');
      row.className = 'counter';
      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      minus.addEventListener('click', () => {
        counts[i] = Math.max(0, (counts[i] ?? 0) - (t.count.step ?? 1));
        persist();
        renderAll();
      });
      const val = document.createElement('span');
      val.className = 'countval';
      val.textContent = `Your count — ${fmt(have)} / ${fmt(t.count.need)} ${t.count.label}`;
      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.addEventListener('click', () => {
        counts[i] = Math.min(t.count.need, (counts[i] ?? 0) + (t.count.step ?? 1));
        persist();
        renderAll();
      });
      row.append(minus, val, plus);
      pane.append(row);
    }

    const h3 = document.createElement('h3');
    h3.textContent = 'How to earn it — in our own words, each step cited';
    pane.append(h3);
    const ol = document.createElement('ol');
    ol.className = 'steps';
    for (const st of t.steps) {
      const li = document.createElement('li');
      li.textContent = st.t + ' ';
      const cite = document.createElement('span');
      cite.className = 'cite';
      cite.textContent = st.s.map((n) => `[${n}]`).join(' ');
      li.append(cite);
      ol.append(li);
    }
    pane.append(ol);

    const src = document.createElement('div');
    src.className = 'srcbox';
    src.innerHTML = '<b>Sources for this guide:</b> ';
    src.append(document.createTextNode(citeList(t.sources) + '. Full list, with links, under Sources & disputes.'));
    pane.append(src);
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'markbtn' + (earned.has(i) ? ' earned' : '');
  btn.textContent = earned.has(i) ? '✓ Earned — click to unmark' : 'Mark earned';
  btn.addEventListener('click', () => toggleEarned(i));
  pane.append(btn);
}

function renderNextUp() {
  const col = document.getElementById('sideCol');
  col.replaceChildren();
  const card = document.createElement('div');
  card.className = 'card';
  const h3 = document.createElement('h3');
  h3.textContent = 'Next up — roadmap order';
  card.append(h3);
  const ol = document.createElement('ol');
  ol.className = 'nextup';
  const next = trophies.map((t, i) => ({ t, i })).filter(({ i }) => !earned.has(i))
    .sort((a, b) => a.t.stage - b.t.stage || a.i - b.i).slice(0, 6);
  for (const { t, i } of next) {
    const li = document.createElement('li');
    li.textContent = masked(t) ? 'Hidden trophy' : t.name;
    const meta = document.createElement('div');
    meta.className = 'nmeta';
    meta.textContent = `${t.grade} · Stage ${t.stage}` + (t.missable === 'possible' ? ' · possibly missable — do first' : '');
    li.append(meta);
    li.addEventListener('click', () => selectTrophy(i));
    ol.append(li);
  }
  card.append(ol);
  col.append(card);

  const card2 = document.createElement('div');
  card2.className = 'card';
  const h32 = document.createElement('h3');
  h32.textContent = 'Progress by kind';
  card2.append(h32);
  const rows = document.createElement('div');
  rows.className = 'kindrows';
  const kinds = [['Story', 'story'], ['Side quests', 'side'], ['Collectibles', 'collectible'],
    ['Activities', 'activity'], ['Crime', 'crime'], ['Misc', 'misc']];
  for (const [label, kind] of kinds) {
    const all = trophies.map((t, i) => ({ t, i })).filter(({ t }) => t.kind === kind);
    const done = all.filter(({ i }) => earned.has(i)).length;
    const row = document.createElement('div');
    row.textContent = `${label} ${done}/${all.length}`;
    const bar = document.createElement('span');
    bar.className = 'bar';
    bar.style.width = '80px';
    const fill = document.createElement('i');
    fill.style.width = `${all.length ? Math.round((done / all.length) * 100) : 0}%`;
    bar.append(fill);
    row.append(bar);
    rows.append(row);
  }
  card2.append(rows);
  col.append(card2);
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  document.getElementById('earnedCount').textContent = done;
  const bar = document.getElementById('gradeBar');
  bar.replaceChildren();
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  const colors = { platinum: '#7fb3d5', gold: '#e8c15a', silver: '#b9c4c9', bronze: '#c98a4b' };
  for (const g of grades) {
    const all = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t, i) => t.grade === g && earned.has(i)).length;
    const seg = document.createElement('i');
    seg.style.width = `${(all / total) * 100}%`;
    const pct = all ? Math.round((got / all) * 100) : 0;
    seg.style.background = `linear-gradient(to right, ${colors[g]} ${pct}%, #55636c ${pct}%)`;
    seg.title = `${g}: ${got}/${all}`;
    bar.append(seg);
  }
  document.getElementById('gradeCounts').textContent = grades.map((g) => {
    const all = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t, i) => t.grade === g && earned.has(i)).length;
    return `${gradeLetter(g)} ${got}/${all}`;
  }).join(' · ');
  const btn = document.getElementById('spoilerBtn');
  btn.textContent = spoilerOn ? 'Spoiler shield: ON' : 'Spoiler shield: off';
  btn.setAttribute('aria-pressed', String(spoilerOn));
}

function renderRoadmapView() {
  const wrap = document.getElementById('roadmapWrap');
  wrap.replaceChildren();
  const head = document.createElement('h2');
  head.className = 'sectionhead';
  head.textContent = 'Roadmap to the platinum — three stages, one playthrough, no online trophies';
  wrap.append(head);
  for (const stage of doc.roadmap) {
    const card = document.createElement('div');
    card.className = 'stagecard';
    const h2 = document.createElement('h2');
    h2.textContent = `Stage ${stage.stage}: ${stage.title} `;
    const hrs = document.createElement('span');
    hrs.className = 'hrs';
    hrs.textContent = stage.hours + ' hours';
    h2.append(hrs);
    const p = document.createElement('p');
    p.textContent = stage.text;
    const src = document.createElement('p');
    src.className = 'tmeta';
    src.textContent = 'Sources: ' + citeList(stage.src);
    const list = document.createElement('div');
    list.className = 'stagelist';
    const inStage = trophies.map((t, i) => ({ t, i })).filter(({ t }) => t.stage === stage.stage);
    const done = inStage.filter(({ i }) => earned.has(i)).length;
    list.innerHTML = `<b>${done}/${inStage.length} trophies in this stage earned.</b> ` +
      inStage.map(({ t }) => masked(t) ? 'Hidden trophy' : t.name).join(' · ');
    card.append(h2, p, list, src);
    wrap.append(card);
  }
  const cmp = document.getElementById('compareWrap');
  cmp.replaceChildren();
  const h2 = document.createElement('h2');
  h2.className = 'sectionhead';
  h2.textContent = 'Trophy target vs 100% checklist — the trophy is usually the smaller number';
  cmp.append(h2);
  const rows = [
    ['Stunts', '250', '300'], ['Unique races won', '20', '30'], ['Challenges', '50', '70'],
    ['WAiNK locations', '100', '100'], ['Shooting range golds', 'All 42', '42'],
    ['Collectible card sets', '3', '15'], ['Meditation spots', '18', '15'],
    ['Bank vaults', '5', '8'],
  ];
  const table = document.createElement('table');
  table.className = 'cmp';
  table.innerHTML = '<thead><tr><th>Item</th><th>Trophy needs</th><th>100% checklist asks</th></tr></thead>';
  const tbody = document.createElement('tbody');
  for (const [item, a, b] of rows) {
    const tr = document.createElement('tr');
    for (const cell of [item, a, b]) {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.append(td);
    }
    tbody.append(tr);
  }
  table.append(tbody);
  const note = document.createElement('p');
  note.className = 'tmeta';
  note.textContent = 'Checklist figures: Press-Start list via eGamers.io [5]; meditation 18 vs 15 is a genuine disagreement — see Sources & disputes.';
  cmp.append(table, note);
}

function renderMissablesView() {
  const wrap = document.getElementById('missWrap');
  wrap.replaceChildren();
  const head = document.createElement('h2');
  head.className = 'sectionhead';
  head.textContent = 'Missables & watch list — one trophy can be missed, eight things deserve care';
  wrap.append(head);
  const card = document.createElement('div');
  card.className = 'misscard';
  card.innerHTML = '<h2>Possibly missable: Positive Mental Attitude</h2>';
  const p = document.createElement('p');
  p.textContent = "The only trophy any guide flags as possibly missable. The Chapter 1 balcony meditation at Jason's house disappears when Chapter 1 ends, and whether the trophy needs it is still unconfirmed — PowerPyx's author did it and then earned the trophy. Safe play: do it the morning after Down to Earth. Sources: [2] [4] [5].";
  card.append(p);
  wrap.append(card);

  const watch = document.createElement('div');
  watch.className = 'misscard';
  watch.innerHTML = '<h2>Watch list — not missable, but easy to put off until it hurts</h2>';
  const ul = document.createElement('ul');
  const items = [
    ['Road to Rehabilitation (Andy)', 'Lucia-only chain. Start it in Chapter 3 when Andy calls; it stays available after the story.'],
    ['Spin On This! (Tyrone)', 'Jason-only chain. Destroy the Kitty Litter labs after Chapter 3, “Here, Kitty Kitty”.'],
    ['Fair Game (Bret)', 'Jason-only chain, and which animal unlocks it is still unconfirmed. Start after “Coffee Break”.'],
    ['This Was No Boat Accident (Kenton)', 'Kenton goes quiet after Chapter 1 and returns in Chapters 2–3. Not missable — just don\'t panic.'],
    ['Strangers & Freaks', 'TechWiser warns the chains behind five hidden trophies have story-progress windows (one source); PowerPyx says every quest giver returns after the story. Start chains when they unlock.'],
    ['Bad Luck, I Guess', 'No proven method. Only lead: the Payday Loans store in Little Cuba. Leave it for last.'],
    ['The Truth Is Out There', 'UFO spawn is slightly random, solo only, after 2AM. If the blinking car is not there, drive away and come back.'],
    ['Everything else', 'No mission replay, so keep a manual save at the start and end of every chapter. Cheats disable trophies and saving — leave them off.'],
  ];
  for (const [name, text] of items) {
    const li = document.createElement('li');
    li.innerHTML = '<b></b> ' + text;
    li.querySelector('b').textContent = name + ' —';
    ul.append(li);
  }
  watch.append(ul);
  wrap.append(watch);

  const unc = document.createElement('div');
  unc.className = 'misscard';
  unc.innerHTML = '<h2>Still unconfirmed — 6 trophies</h2>';
  const ul2 = document.createElement('ul');
  for (const t of trophies.filter((x) => x.note.includes('UNCONFIRMED'))) {
    const li = document.createElement('li');
    li.innerHTML = '<b></b> ' + t.note;
    li.querySelector('b').textContent = t.name + ' —';
    ul2.append(li);
  }
  unc.append(ul2);
  wrap.append(unc);

  const warn = document.createElement('div');
  warn.className = 'misscard';
  warn.innerHTML = '<h2>Things that look missable but are not</h2>';
  const ul3 = document.createElement('ul');
  for (const text of [
    'Optional missions with black icons and pink letters disappear after a while — they do not matter for trophies.',
    'Some fences become permanently unavailable; new ones unlock as you go, and no trophy needs the lost ones.',
    'A few magazine collectibles sit in story buildings that later lock — they also spawn elsewhere, and no trophy needs all of them.',
    'Hourglass quests are time-sensitive and fail — they are not relevant for trophies.',
    'The Irredeemable criminal profile is permanent and makes cops more aggressive. It does not block any trophy, but avoid it.',
  ]) {
    const li = document.createElement('li');
    li.textContent = text;
    ul3.append(li);
  }
  warn.append(ul3);
  wrap.append(warn);
}

function renderSourcesView() {
  const wrap = document.getElementById('srcWrap');
  wrap.replaceChildren();
  const head = document.createElement('h2');
  head.className = 'sectionhead';
  head.textContent = 'Sources — every step in this guide names where it came from';
  wrap.append(head);
  for (const s of doc.sources) {
    const card = document.createElement('div');
    card.className = 'srccard';
    const h2 = document.createElement('h2');
    h2.textContent = `[${s.id}] ${s.name} — ${s.title || s.via}`;
    const p = document.createElement('p');
    p.textContent = s.note + (s.read ? ` Read ${s.read}.` : '');
    card.append(h2, p);
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      card.append(a);
    }
    wrap.append(card);
  }
  const dw = document.getElementById('disputeWrap');
  dw.replaceChildren();
  const h2 = document.createElement('h2');
  h2.className = 'sectionhead';
  h2.textContent = 'Where the sources disagree — both versions, our call';
  dw.append(h2);
  for (const d of doc.disputes) {
    const card = document.createElement('div');
    card.className = 'disp';
    const h = document.createElement('h2');
    h.textContent = d.topic;
    const vs = document.createElement('div');
    vs.className = 'vs';
    for (const side of [d.a, d.b]) {
      const div = document.createElement('div');
      div.textContent = side.claim + ' ';
      const cite = document.createElement('span');
      cite.className = 'cite';
      cite.textContent = side.src.map((n) => `[${n}]`).join(' ');
      div.append(cite);
      vs.append(div);
    }
    const call = document.createElement('div');
    call.className = 'call';
    call.innerHTML = '<b>Our call: </b>';
    call.append(document.createTextNode(d.call));
    card.append(h, vs, call);
    dw.append(card);
  }
}

function setView(v) {
  currentView = v;
  for (const btn of document.querySelectorAll('.tabs button')) {
    const active = btn.dataset.view === v;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  }
  for (const section of document.querySelectorAll('.view')) section.classList.remove('active');
  document.getElementById('view-' + v).classList.add('active');
  if (v === 'roadmap') renderRoadmapView();
  if (v === 'missables') renderMissablesView();
  if (v === 'sources') renderSourcesView();
}

function exportProgress() {
  const data = { app: 'fifty-five', game: 'Grand Theft Auto VI', earned: [...earned], counts };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fifty-five-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  try {
    const data = JSON.parse(await file.text());
    const list = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(list)) throw new Error('no earned list');
    earned = new Set(list.filter((i) => Number.isInteger(i) && i >= 0 && i < trophies.length));
    if (data.counts && typeof data.counts === 'object') {
      counts = {};
      for (const [k, v] of Object.entries(data.counts)) {
        const i = Number(k);
        if (Number.isInteger(i) && i >= 0 && i < trophies.length && Number.isFinite(v)) counts[i] = v;
      }
    }
    persist();
    renderAll();
  } catch {
    document.getElementById('savedNote').textContent = 'Import failed — not a FIFTY-FIVE progress file';
  }
}

function flipSpoiler() {
  spoilerOn = !spoilerOn;
  persist();
  renderAll();
}

function renderAll() {
  renderProgress();
  renderFilterChips();
  renderTrophyList();
  renderTrophyDetail();
  renderNextUp();
}

document.getElementById('spoilerBtn').addEventListener('click', flipSpoiler);
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (e) => {
  if (e.target.files[0]) importProgress(e.target.files[0]);
  e.target.value = '';
});
document.getElementById('searchBox').addEventListener('input', (e) => {
  searchText = e.target.value;
  renderTrophyList();
});
document.getElementById('sortSel').addEventListener('change', (e) => {
  sortMode = e.target.value;
  renderTrophyList();
});
for (const btn of document.querySelectorAll('.tabs button')) btn.addEventListener('click', () => setView(btn.dataset.view));

document.getElementById('footMeta').textContent =
  `Guide data checked 20 Nov 2026 · ${trophies.length} trophies · ${doc.sources.length} sources · ` +
  `${trophies.filter((t) => t.hidden).length} hidden on PSN · 0 online trophies · FIFTY-FIVE v1`;

renderProofStrip();
renderAll();
setView(currentView);
