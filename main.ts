// FIFTY-FIVE — GTA VI Trophy Guide & Tracker, make.fun entry gta6-trophy-guide-01.
//
// What this program does: it takes the static guide in app/ (index.html, style.css,
// app.js and app/data/trophies.json — plain files, no build step, nothing fetched
// over the network at runtime) plus the screenshots/ captures, copies both into
// the output directory, and writes dossier.json there with the vendored make.fun
// library. The dossier is the summary the judge reads: the screenshots, the
// files and bytes of the first load, and the source tree.
//
// Run it locally with:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// and preview the guide itself with:
//   node serve.ts   (then open http://localhost:8080)
//
// vendor/makefun-frontend.ts is left untouched on purpose: the scorer checks
// that dossier.json is byte for byte what its own copy of that library writes.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Pre-flight check: the guide is only worth handing in if its data is whole.
// Refuse to build when the trophy list is short, a trophy has no guide steps,
// or the grade split is not 1 platinum / 2 gold / 6 silver / 46 bronze.
const data = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const trophies = data.trophies;
if (trophies.length !== 55) throw new Error(`expected 55 trophies, found ${trophies.length}`);
for (const t of trophies) {
  if (!t.name || !t.guide || t.guide.length === 0) throw new Error(`trophy ${t.id} has no guide`);
}
const grades = {};
for (const t of trophies) grades[t.grade] = (grades[t.grade] ?? 0) + 1;
if (grades.platinum !== 1 || grades.gold !== 2 || grades.silver !== 6 || grades.bronze !== 46) {
  throw new Error(`unexpected grade split: ${JSON.stringify(grades)}`);
}
console.log(`pre-flight ok: 55 trophies, ${trophies.reduce((n, t) => n + t.guide.length, 0)} cited guide steps`);

// Copy the guide and its screenshots into the output directory.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Write the dossier under the scorer's caps: at most 4 screenshots of at most
// 256 KiB each, at most 993 entries and 48 MiB inside app/. text_max_bytes is
// the only cap that shapes the dossier's bytes; the rest refuse an entry the
// scorer would refuse anyway, so a failure here means the entry is too big.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
