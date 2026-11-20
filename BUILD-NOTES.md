# BUILD-NOTES — FIFTY-FIVE (round 4, fresh build)

## What was built
An offline static web guide + tracker for the 55 PlayStation 5 trophies in
Grand Theft Auto VI, in `app/` (index.html, style.css, app.js,
data/trophies.json). Four views: Tracker (filters by kind/grade, search, three
sort orders, per-trophy counters, detail pane with cited guide steps, next-up
list, progress by kind, localStorage + export/import), Roadmap (three stages),
Missables & watch list (1 missable + 5 watch cards), Sources & disputes
(7 sources, 5 disputes shown with both sides). Spoiler shield masks the 28
hidden trophies until earned. `?demo=1` seeds 10 earned + 6/18 meditations
for screenshots. `main.ts` copies app/ + screenshots/ and writes
dossier.json, and refuses to build unless all 55 trophies carry a non-empty
`guide` string (the gate that failed round 3).

## Data
`app/data/trophies.json`: 55 trophies, names/descriptions/grades copied exactly
from the starter kit's official list. Grades: 1 platinum, 2 gold, 6 silver,
46 bronze. Kinds: story 12, side 7, collectible 5, activity 8, crime 10,
misc 11, platinum 1, completion 1. Hidden: 28. Missable: 1 (Positive Mental
Attitude, id 28). Unconfirmed: 6 (ids 44, 45, 47, 49, 50, 51 — no source had
verified their unlock method at launch). 210 cited guide steps. Every trophy
has both a `guide` text field and a `steps` array.

## Sources read (20 Nov 2026, launch week; game released 19 Nov 2026)
1. PowerPyx — GTA 6 Trophy Guide & Roadmap (200h, 4/10, missable meditation in Ch. 1, 70/80 challenges, 200/277 vehicles, 100/255 animals, 250/397 stunts)
2. Push Square — GTA 6 Trophy Guide & Roadmap, WIP 18 Nov 2026 (300h+ estimate, 18 card sets)
3. KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap (200h, 100% checklist figures)
4. eGamers.io — GTA 6 Trophy List (28 hidden: 27 bronze + 1 gold; 5 hidden unsolved)
5. GTABase — Achievements & Trophies List (28 hidden, 3-step roadmap)
6. GTABase — 100% Completion Guide (meditation 10 locations / 18 total; Griffin 18 + Rodgers Ranch 24 shooting golds)
7. GTADB — Shooting Ranges: 12 Challenges, 42 Gold Medals (2 ranges, $5 waiver pass)

Guide text and steps are written in my own words from these sources, with
`[n]` citations. No Rockstar artwork, logos or game screenshots anywhere.

## Verification run (20 Nov 2026)
- `node -e` data check: 55 trophies, guide non-empty 55/55, grades 1/2/6/46,
  kinds exact, hidden 28, missable [28], unconfirmed [44,45,47,49,50,51],
  210 steps, 7 sources, 5 disputes, ids 1–55.
- `MAKEFUN_OUTPUT_DIR=out node main.ts` (twice, out + out2): dossier
  553,094 bytes (< 1.5 MiB), byte-identical via `cmp`. trophies.json 46,556
  bytes (< 2 MiB).
- Headless Chromium (Playwright, 1280×800): tracker with `?demo=1&trophy=28`
  shows 55 checkboxes, 10 checked, progress 10/55, meditation guide open with
  missable callout; roadmap renders; missables shows 6 cards; sources shows 7
  sources + 5 disputes; `?spoiler=on` masks hidden names (30 "Hidden trophy"
  occurrences). Zero console errors, zero failed requests.
- Screenshots (JPEG, 1280×800): 1-tracker.jpg 92,424 B; 2-roadmap.jpg
  82,886 B; 3-missables.jpg 96,829 B; 4-spoiler.jpg 80,255 B — all < 256 KiB.
