// FIFTY-FIVE — a GTA VI trophy guide entry (Node 22, standard library only).
// The guide itself is the static app/ folder beside this file: plain HTML, CSS and
// JavaScript plus app/data/trophies.json, with no build step and no network at
// runtime. This program hands the entry in: it copies app/ and screenshots/ into
// the output directory and writes dossier.json, the summary the judge reads
// (screenshots, first-load files and bytes, and the source), using the vendored
// make.fun library. Leave vendor/makefun-frontend.ts untouched: the scorer
// requires dossier.json to be byte for byte what its own copy writes.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// and preview the guide with `node serve.ts`, then http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Gate check before anything is copied: every trophy in the guide data must
// carry a non-empty "guide" string. A missing guide is a silent failure that
// only shows up in the judge's gate, so refuse to build instead of shipping it.
const guideData = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const guideList = guideData.trophies;
if (!Array.isArray(guideList) || guideList.length !== 55) {
  throw new Error(`expected 55 trophies, found ${Array.isArray(guideList) ? guideList.length : 'none'}`);
}
const missingGuide = guideList.filter((t) => typeof t.guide !== 'string' || t.guide.trim() === '');
if (missingGuide.length > 0) {
  throw new Error(`trophies without a guide: ${missingGuide.map((t) => t.id).join(', ')}`);
}
console.log(`guide gate passed: ${guideList.length}/55 trophies with a non-empty guide`);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Caps from the scorer's own reference: text_max_bytes shapes the bytes, while
// the other limits refuse an entry the scorer would refuse (at most 4
// screenshots, each under 256 KiB; at most 993 files and directories in app/ and
// 48 MiB of app files, beside the output folder's own 1000-entry cap).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
