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

- Title / new game / continue (`localStorage` key `sfrj1990.v1`) / encyclopedia
- Map of eight 1990 SFRJ units (republics and provinces). Toggle **Raskol** vs **Savezna kontrola**
- Unit inspector, agency strip, **Reforme** desk (2 actions per month, 3 if SIV authority ≥ 60)
- Acts I–V (`data/events/act1.json`–`act5.json`). Vertical Slice A ends 15 May 1991 and locks endings E1–E5
- Presidency vote (5 of 8) on decrees and emergency language
- Election night: weighted roll; the player does not cast the popular vote

Map borders from Wikimedia Commons *Yugoslavia, administrative divisions* (CC BY 4.0, User:Milenioscuro). Regenerate with `python _geo/build_map.py`.

## Layout

```
index.html          shell
css/                tokens + layout
js/                 boot, events, map, reforms, elections, endings
data/events/        Acts I–V
data/i18n/hr.json   Croatian UI chrome
data/               units, parties, agencies, documents
assets/map.svg      playable map
AUDIT.md            historical/logic audit of Slice A
```
