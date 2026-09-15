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

- Title / new game / continue (`localStorage` key `sfrj1990.v1`, schema ≥ 7) / encyclopedia (timeline + E1–E5 + desks/dialogue + attention + E3 path)
- Map of eight 1990 SFRJ units (republics and provinces). Toggle **Raskol** vs **Savezna kontrola**
- Unit inspector with control band, heat/tension, and trade readout
- Agency strip + **Reforme** desk (shared attention with desks), including trade corridors and IMF review
- **Šalteri** (department desks): JNA, SIV, Predsjedništvo, SSUP (SDB leash), SSP, Financije, TO, NBJ, Pravosuđe, **Ostatak SKJ**, Skupština, FER, **Fond** — loyalty / capacity / agenda + actions. Posture chips (overflow-safe) on the agency strip; posture feeds monthly drift, federal control, election weights, Presidency votes, and endings
- **Razgovori**: multi-visit branching chats — Drnovšek revisits through 15 May 1990; Kučan/Jović/Marković/Mesić/Tuđman/Kadijević; Pass 5–7 add Bogićević, Tupurkovski, Račan, Gligorov, Bućin, Izetbegović (mediation), Bulatović + Marković Fond revisit. Flags + desk stats, not an LLM
- **Shared attention UX**: reforms and desks burn the same monthly pool (3; 4 if SIV ≥ 60); UI shows spent on desks vs reforms vs remaining
- **Soft-lock / conflict**: hardline desks + open confederal talks warn on the strip and tax hardline desk actions (+1 attention)
- **Presidency vote × desks**: mediation / quorum / justice vs hardline JNA/SSUP adjust effective tally and cohesion
- **Live near-miss pressure**: strip chips for E5/E3/E2/SDB/CONFLICT (not only on the end card)
- Acts I–V with historically grounded cards plus desk/dialogue-gated cards (SSP/justice/SKJ Act I–II, BiH/MK voices, SKJ memo, attention May, …). Vertical Slice A ends 15 May 1991 and locks endings E1–E5
- Monthly drift briefing with cause–effect deltas (includes desk posture drivers for all ten desks, SKJ + republic voices)
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
data/desks.json     department desk stats + actions (13 desks)
data/dialogue/      branching institutional chats (multi-visit entries)
data/i18n/hr.json   Croatian UI chrome
data/i18n/en.json   English chrome (Pass 4–5)
scripts/smoke.mjs   headless node smoke (desks/dialogue/attention)
data/               units, parties, agencies, documents
assets/map.svg      playable map
AUDIT.md            historical/logic audit of Slice A
```

## Department desks & dialogue

Open **Šalteri** on the agency strip (or click a posture chip). Each desk shows loyalty, capacity, agenda tension, and posture. Actions spend shared attention (and sometimes budget) and set flags such as `jna_mobilization_alert`, `siv_austerity_stance`, `to_inventory_push`, `nby_tight_dinar`, `presidency_mediation_active`, `justice_constitutional_line`, `skj_soft_federation` / `skj_dissolved`. Those flags are read by:

- `js/simulation.js` — `applyDeskMonthlyPosture` inside monthly drift
- `js/control.js` — federal control modifiers
- `js/elections.js` — `deskDialogueElectionBias` on election / plebiscite gravity
- `js/agencies.js` — `deskVoteModifiers` on Presidency votes
- `js/endings.js` — path notes + live near-miss / conflict chips toward E1–E5

Open **Razgovori** for branching conversations. Pass 3–4: the same interlocutor can be **revisited** when `entries` unlock new nodes after flags/time (`dialogue_visits` in the save). Drnovšek has Act I multi-visit nodes through 15 May 1990. Choices still call the event effect pipeline (`desk_set` / `desk_add` / `flags_add` / `charter_signatures_add`).

**Balance:** shared monthly **attention** pool for reforms + desks (3 base, 4 if SIV ≥ 60). UI breaks down spend (desks vs reforms). Soft-block if already in posture. Soft-lock: hardline desk actions while `confederal_talks_open` cost +1 attention and raise conflict chips. Confederal stack (Kučan/Jović/Mesić/mediation/quorum/memo/justice arbitrate) quietly supports the E3 path.

**Smoke:** `node scripts/smoke.mjs` boots state and asserts desks / dialogue / attention / Pass 4–5 event ids (no browser).

Default UI language remains Croatian (ijekavica). IDs and flags stay English. `data/i18n/en.json` has expanded chrome.

## Pass history

- **Pass 1** (`expand/departments-dialogue`): six desks + five interlocutors + monthly posture coupling
- **Pass 2** (`expand/pass2-desks-depth`): TO + NBJ desks, deeper/late dialogue, Kučan/Tuđman, election coupling, gated events acts 2–5, strip chips, save_schema 2
- **Pass 3** (`expand/pass3-depth`): multi-visit dialogue, shared attention, SSUP/SDB leash depth, stronger E3 stack + live near-miss UI, gated Act II–V events, encyclopedia/chip polish, save_schema 3
- **Pass 4** (`expand/pass4-systems`): attention spend UX, conflict soft-lock, Justice desk, Act I / late Act V cards, Drnovšek revisits, Presidency vote × desk posture, encyclopedia + en.json + CSS polish, headless smoke, save_schema 4
- **Pass 5** (`expand/pass5-skj-voices`): SKJ remnant desk, Bogićević/Tupurkovski/Račan dialogues, Jović SKJ revisit, gated Act I–V cards (SKJ / SSP EC / BiH–MK voices / memo / attention), monthly drivers + path notes, save_schema 5
- **Pass 6** (`expand/pass6-assembly-fer`): Skupština + FER desks, Gligorov/Bućin/Izetbegović (mediation-only) dialogues, gated Act I–V cards, monthly/FER coupling, save_schema 6
- **Pass 7** (`expand/pass7-fond-core`): Fond za nerazvijene desk, deepen JNA/SIV/Presidency, Bulatović + Marković Fond revisit, gated Act I–V cards, save_schema 7
