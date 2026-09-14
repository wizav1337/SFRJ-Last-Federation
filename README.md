# SFRJ 1990: Last Federation

Counterfactual political simulation of Yugoslavia, January 1990 – 15 May 1991. You sit on the federal command layer — Predsjedništvo SFRJ, SIV, remnants of SKJ, JNA, secretariats — while six republics and two provinces enter the first multi-party year.

This is a peace-time prototype. June 1991 and war are not in the build. Real 1991–95 deaths are not a score.

Croatian (ijekavica) is the default UI language.

## Run

Browsers will not `fetch` JSON from `file://`. Serve this folder:

```powershell
cd path\to\SFRJ-Last-Federation
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

Desktop-first, 1280×720 minimum.

## What is in the shell

- Title / new game / continue (`localStorage` key `sfrj1990.v1`, schema ≥ 2) / encyclopedia (timeline + E1–E5 + desks/dialogue)
- Map of eight 1990 SFRJ units (republics and provinces). Toggle **Raskol** vs **Savezna kontrola**
- Unit inspector with control band, heat/tension, and trade readout
- Agency strip + **Reforme** desk (2 actions per month, 3 if SIV authority ≥ 60), including trade corridors and IMF review
- **Šalteri** (department desks): JNA, SIV, Predsjedništvo, SSUP, SSP, Financije, **TO**, **NBJ** — loyalty / capacity / agenda + 2–4 actions each (1–2 desk actions per month). Posture chips on the agency strip; posture feeds monthly drift, federal control, **election night weights**, and endings
- **Razgovori**: branching chats with Marković (+ jesenski krug), Kadijević (+ zimski krug), Drnovšek, Jović, Mesić, **Kučan** (nakon SI izbora), **Tuđman** (nakon HDZ-a). Flags + desk stats, not an LLM
- Acts I–V with historically grounded cards plus desk-linked cards (JNA, SIV, NBJ, TO, SSUP, Financije/carine, SSP/plebiscit, Predsjedništvo, Pakrac/TO). Vertical Slice A ends 15 May 1991 and locks endings E1–E5
- Monthly drift briefing with cause–effect deltas (includes desk posture drivers for all eight desks)
- Presidency vote (5 of 8) on decrees and emergency language
- Election night: weighted roll; the player does not cast the popular vote — desks/dialogue bias gravity
- Ending dossier: path notes, near-misses for other endings, summary stats

Map borders from Wikimedia Commons *Yugoslavia, administrative divisions* (CC BY 4.0, User:Milenioscuro). Regenerate with `python _geo/build_map.py`.

## Layout

```
index.html          shell
css/                tokens + layout
js/                 boot, events, map, reforms, desks, dialogue, elections, endings, simulation
data/events/        Acts I–V
data/desks.json     department desk stats + actions (8 desks)
data/dialogue/      branching institutional chats (9 trees)
data/i18n/hr.json   Croatian UI chrome
data/               units, parties, agencies, documents
assets/map.svg      playable map
AUDIT.md            historical/logic audit of Slice A
```

## Department desks & dialogue

Open **Šalteri** on the agency strip (or click a posture chip). Each desk shows loyalty, capacity, agenda tension, and posture. Actions spend desk action points (and sometimes budget) and set flags such as `jna_mobilization_alert`, `siv_austerity_stance`, `to_inventory_push`, `nby_tight_dinar`, `presidency_mediation_active`. Those flags are read by:

- `js/simulation.js` — `applyDeskMonthlyPosture` inside monthly drift
- `js/control.js` — federal control modifiers
- `js/elections.js` — `deskDialogueElectionBias` on election / plebiscite gravity
- `js/endings.js` — path notes toward E1–E5

Open **Razgovori** for short branching conversations. Choices call the same effect pipeline as event cards (`desk_set` / `desk_add` / `flags_add`). Mid/late Slice A follow-ups unlock after the first talk; Kučan/Tuđman require election flags.

**Balance:** 1 desk action/month (2 if SIV authority ≥ 55) shared across eight desks — same attention economy as reforms, not a spam loop. Soft-block if already in posture.

Default UI language remains Croatian (ijekavica). IDs and flags stay English.

## Pass history

- **Pass 1** (`expand/departments-dialogue`): six desks + five interlocutors + monthly posture coupling
- **Pass 2** (`expand/pass2-desks-depth`): TO + NBJ desks, deeper/late dialogue, Kučan/Tuđman, election coupling, gated events acts 2–5, strip chips, save_schema 2
