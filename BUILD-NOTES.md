# BUILD NOTES — FIFTY-FIVE (gta6-trophy-guide-01, round 2)

Built fresh in this session, 20 November 2026, from the bounty brief plus web research.
No earlier build was read or copied.

## What was built

Offline static web guide + tracker for the 55 PlayStation 5 trophies in Grand Theft
Auto VI (game released 19 November 2026; guides are launch-week, so six trophies
are honestly labelled UNCONFIRMED):

- `app/data/trophies.json` — all 55 trophies: official name, description, grade
  (1 platinum, 2 gold, 6 silver, 46 bronze), 28 hidden, kind
  (story 12, side 7, collectible 5, activity 8, crime 10, misc 11, platinum 1,
  completion 1), roadmap stage, per-trophy counters where the trophy counts
  something (e.g. 18 meditations, 42 shooting-range golds), and 218 guide steps,
  each citing one of 7 sources by number. Also 5 disputes shown both sides and
  a 4-item watch list.
- `app/index.html` — header with per-grade progress, spoiler toggle, Export/Import;
  proof strip (55/55 names, 218 cited steps, 7 sources); 4 tabs: Tracker, Roadmap,
  Missables & watch list, Sources & disputes; footer noting no Rockstar artwork
  or logos are used.
- `app/style.css` — own design: warm paper ledger, dark ink header, coral accent.
  No images, no web fonts, no network.
- `app/app.js` — loads the JSON, renders the list (kind filter incl. story /
  missable / collectibles / activities, search, 3 sorts), detail pane (quoted
  official description, grade/kind/stage tags, missable and unconfirmed callouts,
  per-trophy counter with −/+, cited steps, sources box, mark-earned button),
  next-up list, progress by kind, localStorage progress, export/import JSON
  round-trip, spoiler shield, URL params `?view=`, `?trophy=`, `?spoiler=on`,
  `?demo=1` (seeds 10 earned + 6/18 meditations only when nothing is saved).
- `main.ts` — rewritten in my own words; verifies the trophy data before copying
  (55 trophies, every guide non-empty, grade split 1/2/6/46), then copies app/ +
  screenshots/ and writes dossier.json via the vendored library.
- `screenshots/` — 4 fresh 1280×800 JPEG captures of the running app via headless
  Chromium: tracker with a guide open, roadmap, missables/watch list, spoiler
  shield on.
- `.gitignore`, `README.md`, `.makefun/owner.json` — all written by hand in this
  session. `serve.ts`, `vendor/` and `LICENSE` are the starter kit, untouched.

## Sources read (20 November 2026)

1. Push Square — GTA 6: Trophy Guide & Roadmap (WIP), 18 Nov 2026
2. KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap – All 55 Trophies
3. eGamers.io — GTA 6 Trophy List: All 55 Trophies And Achievements, 18 Nov 2026
4. GTADB — GTA VI Shooting Ranges: 12 Challenges, 42 Gold Medals
5. Game-Checklists — GTA 6 Checklist, Maps & 100% Completion Guide
6. Sixshore — GTA 6 Trophy and Achievement List: All 55, Missables and Roadmap
7. DamnModz — GTA 6 Trophy Guide: Quick Info

PowerPyx, GTABase, TechWiser, Beebom/CULTR and Press-Start figures are cited
through these sources where the guides report them (e.g. the ~200-hour platinum
estimate, the 18-vs-15 meditation count). Guide steps are paraphrased in my own
words; nothing was copied from the source guides.

## Verification run

- `MAKEFUN_OUTPUT_DIR=out node main.ts` — pre-flight check passes (55 trophies,
  218 cited steps, grade split 1/2/6/46); dossier under 1.5 MiB.
- `node serve.ts` + headless Chromium — all 4 views render; 55 checkboxes;
  `?demo=1` gives 10 checked; spoiler shield hides hidden names; sources view
  shows all 7 sources + 5 disputes; roadmap shows all 3 stages; missables view
  shows the watch cards; zero console errors from the app (inline data-URI
  favicon, so no 404).
- Screenshots: 4 × 1280×800 JPEG, each under 256 KiB.
