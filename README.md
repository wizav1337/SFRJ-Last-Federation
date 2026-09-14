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

- Title / new game / continue (`localStorage` key `sfrj1990.v1`, schema ≥ 3) / encyclopedia (timeline + E1–E5 + desks/dialogue + attention + E3 path)
- Map of eight 1990 SFRJ units (republics and provinces). Toggle **Raskol** vs **Savezna kontrola**
- Unit inspector with control band, heat/tension, and trade readout
- Agency strip + **Reforme** desk (2 actions per month, 3 if SIV authority ≥ 60), including trade corridors and IMF review
- **Šalteri** (department desks): JNA, SIV, Predsjedništvo, SSUP (deepened SDB leash), SSP, Financije, TO, NBJ — loyalty / capacity / agenda + actions. Posture chips (overflow-safe) on the agency strip; posture feeds monthly drift, federal control, election weights, and endings
- **Razgovori**: multi-visit branching chats — revisit Kučan/Jović/Marković/Mesić/Tuđman/Kadijević when flags/time unlock new nodes; plus late trees and election-gated Kučan/Tuđman. Flags + desk stats, not an LLM
- **Shared attention**: reforms and desks burn the same monthly pool (3; 4 if SIV authority ≥ 60) — spending on a garrison or SDB leash directly cuts reform bandwidth
- **Live near-miss pressure**: strip chips when desk failure modes almost lock E5/E3/E2 (not only on the end card)
- Acts I–V with historically grounded cards plus desk/dialogue-gated cards (SSUP election watch, SDB sovereignty/leash, confederal stack memo, presidency before plebiscite, …). Vertical Slice A ends 15 May 1991 and locks endings E1–E5
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
data/dialogue/      branching institutional chats (multi-visit entries)
data/i18n/hr.json   Croatian UI chrome
data/i18n/en.json   English chrome fallback (partial)
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

Open **Razgovori** for branching conversations. Pass 3: the same interlocutor can be **revisited** when `entries` unlock new nodes after flags/time (`dialogue_visits` in the save). Choices still call the event effect pipeline (`desk_set` / `desk_add` / `flags_add` / `charter_signatures_add`).

**Balance:** shared monthly **attention** pool for reforms + desks (3 base, 4 if SIV ≥ 60). Soft-block if already in posture. Confederal stack (Kučan/Jović/Mesić/mediation/quorum/memo) quietly supports the E3 path; live near-miss chips warn when desks almost lock an ending.

Default UI language remains Croatian (ijekavica). IDs and flags stay English. `data/i18n/en.json` has partial chrome.

## Pass history

- **Pass 1** (`expand/departments-dialogue`): six desks + five interlocutors + monthly posture coupling
- **Pass 2** (`expand/pass2-desks-depth`): TO + NBJ desks, deeper/late dialogue, Kučan/Tuđman, election coupling, gated events acts 2–5, strip chips, save_schema 2
- **Pass 3** (`expand/pass3-depth`): multi-visit dialogue, shared attention, SSUP/SDB leash depth, stronger E3 stack + live near-miss UI, gated Act II–V events, encyclopedia/chip polish, save_schema 3
