# AUDIT — Vertical Slice A (siječanj 1990. – 15. svibnja 1991.)

E3, jedna rečenica: **E3 zahtijeva otvorenu konfederalnu povelju i Predsjedništvo koje se još može sastati; sjedenje Mesića drži stolac ispunjenim, blokada je zastoj i isključuje E3.**

Ista rečenica stoji u `js/endings.js`, u ustavnoj napomeni događaja `mesic_rotation`, i u `data/i18n/hr.json` kao `e3.rule`.

---

## Što je bilo krivo, i što je popravljeno

### Najgora povijesna greška
Travanjska kartica `confederal_draft` (3. travnja 1991.) nosila je natpis **Izetbegović–Gligorov**. Taj imenovani papir povijesno je **lipanj 1991.**, izvan ovog odsječka. Kartica je preimenovana u raniju ponudu Kučan/Marković. Izetbegović–Gligorov spominje se samo da se kaže da **nije** na stolu.

### Vremenska crta
| Problem | Popravak |
|---|---|
| Bosanski izbori datirani samo 18. studenoga | Datum spisa **1990-12-02**; lokacija **18. studenoga / 2. prosinca 1990.** Nema jedne pobjedničke kartice BiH — aritmetika SDA / SDS BiH / HDZ BiH / SK BiH. |
| Srpski ustav tretiran kao da pada u srpnju | Referendum 1.–2. srpnja sada postavlja `serbia_constitution_first` (red godine), ne usvajanje. Novi događaj **28. rujna 1990.** (`serbia_constitution`) postavlja `serbia_new_constitution`. Briefing izričito: izbori u Srbiji **nisu** bili u proljeće 1990. |
| Slovenski plebiscit 23. prosinca čitao se kao da je već proglašenje | Briefing: savjetodavni; proglašenje **nije** 23. prosinca; `slovenia_plebiscite_yes` je uvod. |
| Makedonija samo „prvi krug“ | Lokacija: 11. / 25. studenoga 1990. |
| Srbija/Crna Gora samo 9. prosinca | Lokacija: 9. / 23. prosinca 1990. |
| 14. kongres SKJ | Ostaje 20.–22. siječnja 1990., Sava centar. Nije dirano. |
| Rotacija Drnovšek → Jović | 15. svibnja 1990. Nije dirano osim jezika (stolac nije Milošević). |
| Balvan-revolucija | 17. kolovoza, Knin. Nije dirano. |
| Naredba o neregularnim formacijama | 9. siječnja 1991. Nije dirano. |
| Sat nakon čina V | Ostaje 15. svibnja 1991. Nema čina VI. |

Datumi unutar činova i među činovima sada idu redom (uključujući novi rujanski ustav **poslije** tekstova suverenosti 27. rujna).

### Nositelji ureda
| Problem | Popravak |
|---|---|
| Marković zvuči kao „predsjednik Jugoslavije“ | Briefinzi čina I i V: predsjednik **SIV-a**, cijeli odsječak. |
| Kučan = zapovjednik JNA | Ustavna napomena izbora u Sloveniji: predsjednik republike **ne** zapovijeda JNA. |
| Tuđman/HDZ kao vlada prije izbora | `hdz_government` zahtijeva `hdz_croatia`. Ako SKH–SDP pobijedi, pali se `skh_cabinet` (zahtijeva `croatia_election_held`). Ako izbor nikad nije pao, nijedan kabinetski spis ne pali. |
| Mesić automatski predsjedatelj 15. svibnja | Briefing: **dužan** je uzeti stolac; povijesno blokiran; sjedi tek kasnije. Izbor je sjediti ili blokirati. `chairName` više ne sjeda Mesića iz kalendara — samo zastavica `mesic_seated`. Ako HDZ nije pobijedio, `croatian_chair_skh` (hrvatski član, ne Mesić). |
| SPS = savezno Predsjedništvo | Rotacija je Jović, ne Milošević. SPS ostaje put Srbije. |

### Zastavice i lokoti
| Problem | Popravak |
|---|---|
| HDZ-legalitet bez izbora | `hdz_government` zahtijeva `hdz_croatia`. |
| „DEMOS već vlada“ prije izbora | Briefing travnja: DEMOS još ne vlada. Izbori `ack_demos` i dalje zahtijevaju `demos_slovenia`. |
| `to_inventory_ordered` | Već isključivo: `to_inventory_followup` (`flags`) naspram `barracks_quiet` (`flags_not`). Ostaje. Nikad oboje. |
| `player_used_jna_threat` na govoru | Nije se postavljalo govorom. Ostaje samo na: koridor JNA, pritisak JNA (slijed nepoštovanja i kabinet HDZ), premještaj JNA u radionici, i `jna_on_the_chair` koji **zahtijeva** već postavljenu zastavicu. |
| Konfederalni potpisi broje Sloveniju ako je „otišla“ | `applyEffects`: ako `slovenia_left_institutions` ili `independence_slovenia_declared` i nema `slovenia_invited_back`, oduzima se jedan potpis. Odsječak A ne piše secesiju kao dovršenu, pa se to u igri ne pali osim ako kasniji spis postavi zastavicu. Potpisi u travnju dodaju `slovenia_invited_back` jer je poziv za stol. |
| E3 „nema zastoja“ i sjedenje Mesića u istom dahu | Jedna rečenica gore. Sjedenje ≠ zastoj. Blokada isključuje E3. |

### Uzročnost
| Problem | Popravak |
|---|---|
| SKJ nakon siječnja još „zapovijeda svim Saborima“ | Kasniji izbori govore o **ostacima / republikanskim savezima**. `starve_siv` više nije `legal: party`. |
| Odricanje vodeće uloge, a kasnije monopol | `allow_list` i dalje zahtijeva `skj_renounced_monopoly`; `allow_anyway` je rupa, ne obnova monopola. |
| HDZ pobijedi, federacija „disciplinira hrvatski CK“ | Briefing kabineta HDZ: CK više nije vlada. Ako SKH drži Sabor, drugi spis. |
| Kosovo kao netaknuta autonomija 1974. | Briefing: rez 1989. već je pao; sjedala postoje, nisu slobodni glumci. |
| VO/XK kao slobodni glasovi | `syncSerbianBloc`: VO i XK prate RS osim zastavice `provinces_vote_independently` (nijedan izbor u ovom odsječku je ne postavlja — namjerno). |

### Ton
Nema borbe, nema Desetodnevnog rata, nema lipanjskih proglašenja kao dovršenog rata, nema izmišljenih zločina. Lipanj je spomenut samo kao spis koji ovdje ne postoji.

---

## Što je ostavljeno namjerno

- **Nema čina VI.** Odsječak A i dalje staje 15. svibnja 1991.
- **Plebiscit ostaje uvod**, ne secesija. Slovenija u travnju 1991. još sjedi u institucijama.
- **Izetbegović–Gligorov nije premješten u lipanj** — lipnja nema. Samo je skinut s travanjske kartice.
- **`provinces_vote_independently` nema igračev izbor** u ovom odsječku. Default je srpska mašina. Zastavica postoji da kasniji spis može slomiti blok bez novog sustava.
- **`player_used_jna_threat` na premještaju JNA u radionici** ostaje: to je sila, ne govor.
- **Tihi preraspored JNA** u `barracks_quiet` **ne** postavlja tu zastavicu: nije prijetnja, nije govor.
- **ID-ovi, ključevi, imena datoteka, zastavice** ostaju engleski.
- **Titograd** ostaje Titograd.
- **Stranačke kratice** (HDZ, SDS, SDA, DEMOS, SPS, SKJ) ostaju; puno hrvatsko ime stoji uz prvo pojavljivanje.
- **Engleski `data/i18n/en.json`** je proširen (Pass 4) za chrome / šaltere / dijalog, ali zadani jezik pri paljenju ostaje hrvatski.

---

## Jezik
Zadani UI je hrvatski (ijekavica): Predsjedništvo SFRJ, Savezno izvršno vijeće / SIV, Skupština SFRJ, Vijeće republika i pokrajina, Sabor, SR/SAP oblici. Chrome u `data/i18n/hr.json`. Tekst događaja u JSON-u činova.


---

## Dodatak — proširenje `expand/slice-a-upgrade`

Nova mirnodopska kartica / logika (sve prije lipnja 1991.; nema čina VI):

| Spis | Datum | Napomena |
|---|---|---|
| `multiparty_laws_wave` | 1990-02-20 | Republikanski višestranački zakoni; blagoslov može postaviti `skj_renounced_monopoly`. |
| `imf_standby` | 1990-03-01 | Marković = predsjednik **SIV-a**; stand-by / dinar. |
| `customs_war` | 1990-10-22 | Međurepubličke carine nakon suverenosti; nije fronta. |
| `ec_troika_note` | 1990-12-20 | Nota EZ-a prije plebiscita; nije priznanje. |
| `pakrac_incident` | 1991-03-02 | Pakrac: stanica, barikade, JNA; briefing kaže da nitko nije poginuo (savezno izvješće). |
| `belgrade_march91` | 1991-03-09 | Devetomartovski protest; tenkovi u gradu; nije lipanjski rat. |

E3 pravilo **nije** dirano: otvorena povelja + Predsjedništvo koje se može sastati; sjedenje Mesića ≠ blokada.

Simulacija: mjesečni drift sada uključuje trgovinu, MMF, carine, Pakrac/ožujak kao pokretače; mjesečni briefing pokazuje delte. Završni spis dodaje put, near-miss i brojke. Izetbegović–Gligorov i dalje **nije** na travanjskoj kartici.


---

## Dodatak — Pass 1 `expand/departments-dialogue`

Šalteri institucija (JNA, SIV, Predsjedništvo, SSUP, SSP, Financije) i razgranati razgovori (Marković, Kadijević, Drnovšek, Jović, Mesić). Sve mirnodopski; nema čina VI; nema rata kao mehanike pobjede.

Nova kartica:

| Spis | Datum | Napomena |
|---|---|---|
| `desk_jna_readiness` | 1990-02-25 | Postava JNA; SSNO memo; nema fronte |
| `desk_siv_stance` | 1990-03-12 | Marković = predsjednik **SIV-a**; štednja/poticaj/knjige |
| `desk_ssup_after_logs` | 1990-08-25 | Nakon balvana; meka/tvrda linija SSUP |
| `desk_presidency_corridor` | 1991-01-18 | Medijacija/kvorum; E3 pravilo ponovljeno |

E3 pravilo **nije** dirano. `player_used_jna_threat` na razgovoru s Kadijevićem (opcija nagibanja Beogradu) ostaje namjerno — to je politička prijetnja, ne govor na mitingu.


---

## Dodatak — Pass 2 `expand/pass2-desks-depth`

Šalteri **TO** (Teritorijalna obrana) i **NBJ** (Narodna banka Jugoslavije); dublji / kasni razgovori; Kučan i Tuđman samo uz izborne zastavice; izborna gravitacija čita šaltere i dijalog; nove kartice činova 2–5; čipovi postave na traci agencija; `save_schema` 2.

### Nova / proširena kartica

| Spis | Datum | Napomena |
|---|---|---|
| `desk_nby_dinar_watch` | 1990-03-08 | NBJ tvrdi/labavi dinar; Marković = predsjednik **SIV-a** |
| `desk_to_after_inventory` | 1990-05-30 | TO koordinacija / inventura / republikanski držaj |
| `desk_to_after_logs` | 1990-08-20 | Zahtijeva `krajina_log_revolution`; meka/tvrda uz TO |
| `desk_finance_customs` | 1990-10-25 | Zahtijeva `customs_war_active`; transferi / MMF |
| `desk_ssp_before_pleb` | 1990-12-18 | SSP prije plebiscita; nota ≠ priznanje |
| `desk_nby_hard_currency` | 1991-02-12 | Rezerve pred svibanj; nema raspada banke kao rata |
| `desk_to_pakrac` | 1991-03-05 | Zahtijeva `pakrac_standoff`; meka linija može `pakrac_defused` |

### Razgovori

- Produbljeni: Marković (NBJ krak), Kadijević (TO / SSUP), Jović (konfederalni), Mesić (kasni), Drnovšek (promatrači)
- Novi: `markovic_late` (od 1990-09-01), `kadijevic_late` (od 1991-01-01), `kucan` (nakon SI izbora), `tudman` (nakon HDZ-a)
- `player_used_jna_threat` na tvrdim granama s Kadijevićem / Tuđmanom ostaje namjerno — politička prijetnja, ne govor na mitingu

### Pravila koja nisu dirana

- E3: otvorena povelja + Predsjedništvo koje se može sastati; sjedenje Mesića ≠ blokada
- Nema čina VI; nema lipanjskog rata; Izetbegović–Gligorov nije na travanjskoj kartici
- ID-ovi i zastavice engleski; UI hrvatski
- `to_inventory_ordered` i dalje razdvaja `to_inventory_followup` / `barracks_quiet`

### Ekonomija pažnje

1–2 akcije šaltera mjesečno za osam šaltera; soft-block iste postave; reforme ostaju odvojeni bazen (2–3). Nema trivialnog spama.

---

## Dodatak — Pass 3 `expand/pass3-depth`

Višestruki posjeti razgovorima; zajednička pažnja reforme↔šalteri; produbljeni SSUP/SDB uze; jači konfederalni stog za E3; upozorenja blizu ishoda na traci; nove kartice činova 2–5; `save_schema` 3; djelomični `en.json`.

### Nova / proširena kartica

| Spis | Datum | Napomena |
|---|---|---|
| `desk_ssup_election_season` | 1990-04-18 | SSUP pred SI izborima; meka/promatrač/tvrdo; nije fronta |
| `desk_presidency_after_votes` | 1990-05-20 | Medijacija/kvorum/konfederalni jezik nakon listića |
| `desk_sdb_sovereignty_watch` | 1990-09-28 | SDB nakon suverenosti/balvana; dosjei / Knin / tvrdo |
| `confederal_stack_memo` | 1990-10-12 | Zahtijeva Kučan/Jović/stol; **nije** Izetbegović–Gligorov |
| `desk_ssup_before_pleb` | 1990-12-15 | SSUP pred savjetodavnim plebiscitom |
| `desk_presidency_before_pleb` | 1990-12-18 | Potpis/kvorum pred plebiscitom; E3 pravilo ponovljeno |
| `desk_sdb_leash_may` | 1991-04-22 | Uze SDB pred svibanjskom rotacijom |

### Razgovori (multi-visit)

- `entries` + `dialogue_visits`: Kučan (charter / proljeće), Jović (stog), Marković (jesen), Mesić (pred svibanj), Tuđman (zima), Kadijević (lanac)
- `charter_signatures_add` gradi potpise uz postojeći `charter_signatures` / `_min`
- `player_used_jna_threat` na tvrdoj grani Tuđmana ostaje namjerno

### SSUP / SDB

Nove akcije: promatračka postava, zategnuti uze, dijeljenje dosjea, tihi nadzor Knina. Mjesečni drift i ratni rizik čitaju `sdb_civilian_leash` / `sdb_leash_tight` / `ssup_observe_line`.

### Ekonomija pažnje

Zajednički mjesečni bazen: **3** (4 ako SIV ≥ 60). Reforme i šalteri troše isti `attention_left`. Nema odvojenog spama.

### Pravila koja nisu dirana

- E3: otvorena povelja (≥4) + Predsjedništvo koje se može sastati; sjedenje Mesića ≠ blokada
- Nema čina VI; nema lipanjskog rata; Izetbegović–Gligorov nije na travanjskoj kartici
- Marković = predsjednik **SIV-a**
- ID-ovi i zastavice engleski; UI hrvatski


---

## Dodatak — Pass 4 `expand/pass4-systems`

Pažnja (UI raspodjela šalteri vs reforme); soft-lock sukoba tvrdih šaltera s otvorenim konfederalnim stolom; šalter **Pravosuđe**; dublji glas Predsjedništva × postava; Drnovšek multi-visit; kartice čina I i kasnog V; `save_schema` 4; `scripts/smoke.mjs`.

### Nova / proširena kartica

| Spis | Datum | Napomena |
|---|---|---|
| `desk_ssp_nonaligned_open` | 1990-02-08 | SSP nesvrstani / tihi zapad / izolacija; Marković = SIV |
| `desk_justice_open` | 1990-02-28 | Ustavni kanal / arbitraža / tvrdo; Ustavni sud postoji |
| `presidency_drnovsek_spring` | 1990-03-20 | Drnovšek još drži čekić; medijacija/kvorum/tvrdo |
| `desk_justice_after_votes` | 1990-05-22 | `flags_any` SI/HR izbori; pravosuđe nakon listića |
| `desk_justice_may_leash` | 1991-04-28 | Pravosuđe pred svibanjskom rotacijom; E3 pravilo ponovljeno |
| `confederal_conflict_warn` | 1991-05-02 | Soft-lock: tvrdi šalteri + otvoreni stol; nije bitka |
| `desk_fer_trade_may` | 1991-05-06 | FER/trgovina/MMF pred 15. V; nema raspada banke |

### Razgovori

- Drnovšek: `after_congress`, `spring_corridor`, `eve_rotation` (do 15. V 1990.)
- `player_used_jna_threat` nije diran na ovim granama

### Soft-lock / sukob

Tvrda postava (Predsjedništvo / JNA / SSUP / pravosuđe / inventura TO) uz `confederal_talks_open` → upozorenje na traci; tvrda akcija šaltera može koštati **+1** pažnju. Nije hard-block. E3 pravilo **nije** dirano.

### Glas Predsjedništva

`deskVoteModifiers`: medijacija / kvorum / ustavno-arbitražno pravosuđe vs tvrda JNA/SSUP/pravosuđe. Učinak na prikazani zbroj i koheziju / legitimnost pri izvanrednom.

### Pravila koja nisu dirana

- E3: otvorena povelja (≥4) + Predsjedništvo koje se može sastati; sjedenje Mesića ≠ blokada
- Nema čina VI; nema lipanjskog rata; Izetbegović–Gligorov nije na travanjskoj kartici
- Marković = predsjednik **SIV-a**; Drnovšek predsjedatelj do 15. V 1990.; Jović nije Milošević
- ID-ovi i zastavice engleski; UI hrvatski


---

## Dodatak — Pass 5 `expand/pass5-skj-voices`

Šalter **Ostatak SKJ / savezni CK**; glasovi republika (Bogićević, Tupurkovski) i Račan (ako HDZ nije pobijedio); Jović revisit koji čita zastavice SKJ; kartice čina I–V; `save_schema` 5; smoke proširen.

### Nova / proširena kartica

| Spis | Datum | Napomena |
|---|---|---|
| `desk_skj_after_congress` | 1990-02-05 | Ostatak SKJ nakon Kongresa; meka/tvrda/SIV/raspuštanje; **nema** restauracije monopola |
| `desk_skj_election_season` | 1990-04-10 | SKJ pred proljetnim listićima |
| `desk_ssp_ec_track` | 1990-08-28 | SSP kolosijek EEZ — nota, **ne** priznanje |
| `republic_voice_bih` | 1990-12-10 | Glas BiH; medijacija/kvorum/blok; **nije** Izetbegović–Gligorov |
| `republic_voice_mk` | 1990-12-12 | Glas Makedonije; konfederalni/EEZ; **nije** I–G papir |
| `desk_skj_spring91` | 1991-02-20 | SKJ u proljeće 1991.; bez čina VI |
| `confederal_skj_memo` | 1991-03-18 | SKJ meka + otvoreni stol; **nije** Izetbegović–Gligorov |
| `desk_attention_may` | 1991-05-08 | Pažnja pred 15. V; soft-lock rizik |

### Razgovori

- `bogicevic.json` — BiH stolac; medijacija / kvorum / blok
- `tupurkovski.json` — MK stolac; konfederalni / EEZ promatrači (**nikad** I–G papir)
- `racan.json` — samo ako `croatia_election_held` i **nije** `hdz_croatia`
- Jović: `revisit_skj` (čita `skj_soft_federation` / tvrdo / SIV / raspuštanje)

### Šalter SKJ

Akcije: `soft_federal_line` → `skj_soft_federation`; `hard_unity_rhetoric` → `skj_hard_unity`; `cede_to_siv` → `skj_cedes_to_siv` (pojačava SIV); `dissolve_quietly` → `skj_dissolved` + `skj_renounced_monopoly` (**ne** vraća monopol / `skj_leading_role`).

### Pravila koja nisu dirana

- E3: otvorena povelja (≥4) + Predsjedništvo koje se može sastati; sjedenje Mesića ≠ blokada; blokada isključuje E3
- Nema čina VI; nema lipanjskog rata; Izetbegović–Gligorov **nije** na travanjskoj kartici niti na SKJ memorandumu
- Marković = predsjednik **SIV-a**; Jović ≠ Milošević
- ID-ovi i zastavice engleski; UI hrvatski (ijekavica)

---

## Dodatak — Pass 6 `expand/pass6-assembly-fer`

Šalteri **Skupština SFRJ** (`assembly`) i **FER** (vanjski ekonomski odnosi); glasovi Gligorova (MK), Bućina (ME / Titograd) i gated medijacija Izetbegovića (bez I–G nacrta); kartice čina I–V; `save_schema` 6; smoke proširen.

### Nova / proširena kartica

| Spis | Datum | Napomena |
|---|---|---|
| `desk_assembly_open` | 1990-03-01 | Otvoreni rad / zastoj / pečatiranje; `assembly_*` |
| `desk_fer_open` | 1990-03-18 | FER trgovina / MMF / tvrde carine; Marković = SIV |
| `desk_assembly_after_votes` | 1990-05-28 | Skupština nakon proljetnih listića |
| `desk_fer_customs_autumn` | 1990-10-05 | FER / carine u jesen |
| `republic_voice_me` | 1990-12-18 | Glas Crne Gore (Titograd); meka / blok / kvorum |
| `republic_voice_gligorov` | 1991-01-28 | Gligorov; **odbija** I–G okvir; konfederalni / EEZ |
| `desk_assembly_spring91` | 1991-02-25 | Skupština u proljeće 1991.; bez čina VI |
| `mediation_izetbegovic_gate` | 1991-04-12 | Samo medijacija; I–G nacrt **nije** dostupan |
| `desk_fer_trade_may` | 1991-05-06 | Ažurirano da čita šalter FER |

### Razgovori

- `gligorov.json` — MK; konfederalni / EEZ / **odbijanje** Izetbegović–Gligorov okvira
- `bucin.json` — ME stolac; Titograd ostaje Titograd; meka federacija / srpski blok / kvorum
- `izetbegovic.json` — gated medijacija only; I–G papir van Slice A

### Šalteri

- **assembly**: `session_open` → `assembly_open`; `stalled` → `assembly_stalled` + `assembly_paralysis_risk`; `rubber_stamp` → `assembly_rubber_stamp`; akcija `guard_quorum` → `assembly_quorum_ok`
- **fer**: `trade_open` / `imf_line` / `customs_hard` (+ `resolve_customs`); dira `customs_war_*`, `imf_standby_active`, trade / hard_currency / imf_pressure / international_standing

### Pravila koja nisu dirana

- E3: otvorena povelja (≥4) + Predsjedništvo koje se može sastati; sjedenje Mesića ≠ blokada; blokada isključuje E3
- Nema čina VI; nema lipanjskog rata; Izetbegović–Gligorov **nije** na travanjskoj kartici niti kao dostupan papir u novim memoima
- Marković = predsjednik **SIV-a**; Jović ≠ Milošević; Kučan ≠ zapovjednik JNA
- `player_used_jna_threat` samo na namjernim tvrdim granama; `to_inventory_ordered` ekskluzivnost nepromijenjena
- ID-ovi i zastavice engleski; UI hrvatski (ijekavica)



---

## Dodatak — Pass 7 `expand/pass7-fond-core`

Šalter **Federalni fond za nerazvijene** (`fond`, agencija `federal_fund`); produbljeni JNA/SIV/Predsjedništvo; glas Bulatovića (CG / Titograd); Marković revisit Fonda/MMF; kartice čina I–V; `save_schema` 7; smoke proširen.

### Nova / proširena kartica

| Spis | Datum | Napomena |
|---|---|---|
| `desk_fond_open` | 1990-03-08 | Fond: otvoren jug / smrzavanje / cilj MK–ME |
| `desk_jna_quiet_order` | 1990-04-22 | Tiha preraspodjela; **ne** pali `player_used_jna_threat` |
| `desk_siv_fond_bind` | 1990-05-12 | SIV veže knjige uz Fond; Marković = SIV |
| `desk_fond_autumn` | 1990-09-20 | Fond jesen; I–G samo isključenje |
| `republic_voice_bulatovic` | 1990-12-28 | Glas Titograda; Titograd ostaje Titograd |
| `desk_presidency_south` | 1991-02-08 | Južna ravnoteža Predsjedništva |
| `desk_fond_spring91` | 1991-03-08 | Fond u proljeće 1991.; bez čina VI |
| `confederal_fond_memo` | 1991-04-18 | Fond + konfederalni stol; I–G **nije** dostupan |

### Razgovori

- `bulatovic.json` — CG; Titograd; meka / blok / Fond
- `markovic.json` — `revisit_fond` (SIV/Fond/MMF zastavice)

### Šalteri

- **fond**: `open_south` → `fond_open_south`; `freeze` → `fond_freeze`; `target_mk_me` → `fond_target_mk_me`; `politicized` → `fond_politicized`
- **jna** `quiet_redistribute` → `jna_quiet_redistribute` (**bez** `player_used_jna_threat`)
- **siv** `bind_fond` → `siv_fond_bind`
- **presidency** `south_balance` → `presidency_south_balance`

### Pravila koja nisu dirana

- E3: otvorena povelja (≥4) + Predsjedništvo koje se može sastati; sjedenje Mesića ≠ blokada; blokada isključuje E3
- Nema čina VI; nema lipanjskog rata; Izetbegović–Gligorov **nije** prihvatljiv papir (samo isključenje)
- Marković = predsjednik **SIV-a**; Jović ≠ Milošević; Titograd ostaje Titograd
- `player_used_jna_threat` samo na namjernim tvrdim granama; tiha JNA preraspodjela **ne** pali tu zastavicu
- ID-ovi i zastavice engleski; UI hrvatski (ijekavica)
