# BUILD-NOTES — FIFTY-FIVE, GTA VI Trophy Guide & Tracker (round 3, fresh build)

## What was built
An offline static web guide + tracker for all 55 PS5 trophies in Grand Theft Auto VI,
in `app/`: `index.html` (4 tabs: Tracker / Roadmap / Missables & watch list / Sources
& disputes), `style.css` (warm paper ledger, dark ink header, coral accent, no images,
no web fonts, no network), `app.js` (loads `data/trophies.json`; filters by kind,
search, 3 sort orders; detail pane with quoted official description, grade/kind/stage
tags, missable + unconfirmed callouts, per-trophy counters with -/+, cited steps,
sources box, mark-earned button; next-up list; progress by kind; localStorage;
export/import JSON round-trip; spoiler shield for hidden story trophies; URL params
`?view=`, `?trophy=`, `?spoiler=on`, `?demo=1`), and `data/trophies.json`
(55 trophies with official names/descriptions/grades, 28 hidden, 228 cited guide
steps, 7 sources, 5 disputes, 6 trophies honestly labelled UNCONFIRMED, 3-stage
roadmap). `main.ts` hands the entry in via the vendored make.fun library.
4 fresh screenshots in `screenshots/` (1280x800 JPEG).

## Sources read (20 Nov 2026, launch week)
- PowerPyx, GTA 6 Trophy Guide & Roadmap — https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/
- Push Square, GTA 6 Trophy Guide and Roadmap (WIP) — https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap
- KeenGamer, GTA 6 Trophy Guide & Platinum Roadmap, All 55 Trophies — https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/
- eGamers.io, GTA 6 Trophy List: All 55 Trophies and Achievements — https://egamers.io/gta-6-trophy-list-all-55-trophies-and-achievements-plus-the-hardest-ones/
- GTASpotter, GTA VI trophies and achievements: the full official list — https://gtaspotter.com/en/guides/gta-6-trophies-and-achievements/
- GameTrek, GTA 6 Trophy Guide: All 55 Achievements and Platinum Roadmap — https://gmtreks.com/gta6/page/01M7Q14ZF65PPK5FFXSY3CJNKQ
- Exophase / PSNProfiles trophy list (55 trophies, grade split, hidden flags)

## Verification run
- `node -e` check on trophies.json: 55 trophies; grades 1 platinum / 2 gold / 6 silver /
  46 bronze; 28 hidden (27 bronze + 1 gold); kinds story 12, side 7, collectible 5,
  activity 8, crime 10, misc 11, platinum 1, completion 1; 228 cited steps; 0 empty
  guides; 6 unconfirmed; 1 missable; 7 sources; 5 disputes; file 43,100 bytes.
- `MAKEFUN_OUTPUT_DIR=out node main.ts`: dossier 519,594 bytes (< 1.5 MiB).
- `node serve.ts` + headless Chromium (Playwright): all 4 views render; 55 checkboxes;
  `?demo=1` gives 10 checked and a 6/18 meditation counter; spoiler ON hides hidden
  story names (verified "Gone Fishing" absent — a dispute text leak was found and
  fixed); sources view shows all 7 sources + 5 disputes; roadmap shows 3 stages;
  missables shows 6 watch cards; zero console errors from the app.
- Screenshots: 4x 1280x800 JPEG, 93,883 / 105,136 / 88,817 / 74,475 bytes (all < 256 KiB).
- No Rockstar logo, artwork or game screenshots anywhere in the entry.
