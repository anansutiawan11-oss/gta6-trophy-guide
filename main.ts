// FIFTY-FIVE — the make.fun hand-in for gta6-trophy-guide-01 (Node 22, stdlib only).
// The guide itself is app/: plain static files (index.html, style.css, app.js plus
// data/trophies.json), opened in a browser with no build step and no network at runtime.
// This program copies app/ and screenshots/ next to this file into the output folder
// and writes output/dossier.json — the summary the judge reads — using the vendored
// make.fun library. vendor/makefun-frontend.ts stays untouched: the scorer needs
// dossier.json byte-for-byte identical to what its own copy produces.
//
// Run locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Pre-flight: refuse to hand in a guide whose trophy data is incomplete, so a
// broken data file fails here instead of shipping a dossier with holes in it.
const guide = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const names = new Set();
for (const t of guide.trophies) {
  if (!t.name || names.has(t.name)) throw new Error(`bad trophy entry: ${JSON.stringify(t.name)}`);
  names.add(t.name);
  if (!Array.isArray(t.steps) || t.steps.length === 0) throw new Error(`trophy without a guide: ${t.name}`);
}
if (guide.trophies.length !== 55) throw new Error(`expected 55 trophies, found ${guide.trophies.length}`);
console.log(`pre-flight ok: ${guide.trophies.length} trophies, ${guide.trophies.reduce((n, t) => n + t.steps.length, 0)} cited steps`);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's caps (reference/gate.json): text_max_bytes shapes the dossier bytes;
// the rest refuse an entry the scorer would refuse (over 4 screenshots or one over
// 256 KiB; over 993 files and directories in app/, or over 48 MiB of app files).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
