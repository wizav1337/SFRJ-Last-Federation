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
| VO/XK kao slobodni glasovi | `syncSerbianBloc`: VO i XK prate RS osim zastavice `provinces_vote_independently` (Pass 11: šalter/dijalog/reforme mogu je postaviti; default i dalje blok). |

### Ton
Nema borbe, nema Desetodnevnog rata, nema lipanjskih proglašenja kao dovršenog rata, nema izmišljenih zločina. Lipanj je spomenut samo kao spis koji ovdje ne postoji.

---

## Što je ostavljeno namjerno

- **Nema čina VI.** Odsječak A i dalje staje 15. svibnja 1991.
- **Plebiscit ostaje uvod**, ne secesija. Slovenija u travnju 1991. još sjedi u institucijama.
- **Izetbegović–Gligorov nije premješten u lipanj** — lipnja nema. Samo je skinut s travanjske kartice.
- **`provinces_vote_independently`**: default i dalje srpska mašina; Pass 11 daje igračev izbor (šalter `provinces`, dijalog, reforme) bez lomljenja postojeće reforme `pret_provinces`.
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

## Dodatak — Pass 8 `expand/pass8-ssrn-depth`

Šalter **Socijalistički savez radnog naroda / SSRN** (`ssrn`, agencija `ssrn`); produbljeni SSP i Financije; kasni razgovori Mesić/Jović; Marković revisit SSRN; kartice čina I–V; `save_schema` 8; smoke proširen.

### Nova / proširena kartica

| Spis | Datum | Napomena |
|---|---|---|
| `desk_ssrn_open` | 1990-02-18 | SSRN: masovni front / forum / zarobljavanje |
| `desk_finance_target` | 1990-04-25 | Financije: ciljani kanali / meki koridor |
| `desk_ssp_isolation` | 1990-05-18 | SSP: izolacija / most Nesvrstanih; Jović ≠ Milošević |
| `desk_ssrn_civic` | 1990-08-22 | SSRN ljeti; I–G samo isključenje |
| `desk_ssrn_party` | 1990-10-08 | SSRN–SIV veza; Marković = SIV |
| `desk_ssrn_before_pleb` | 1990-12-16 | SSRN pred plebiscitom; bez auto-sjedenja Mesića |
| `desk_ssrn_spring91` | 1991-02-22 | SSRN proljeće 1991.; bez čina VI |
| `confederal_ssrn_memo` | 1991-04-20 | SSRN + konfederalni stol; I–G **nije** dostupan |

### Razgovori

- `mesic_late.json` — Act IV–V jezik dužnosti stolca **bez** auto-sjedenja
- `jovic_late.json` — predsjedatelj nakon 15. V 1990.; srpski blok vs kvorum; Jović ≠ Milošević
- `markovic.json` — `revisit_ssrn` (SSRN/SIV zastavice)

### Šalteri

- **ssrn**: `mass_front_open` → `ssrn_mass_front`; `civic_forum` → `ssrn_civic_forum`; `party_capture` → `ssrn_party_capture`; `paralyzed` → `ssrn_paralyzed`; `bind_siv` → `ssrn_siv_bind`
- **ssp** `isolation` → `ssp_isolation`; `nam_bridge` → `ssp_nam_bridge`
- **finance** `target_channels` → `finance_target`; `soft_corridor` → `finance_soft_corridor`

### Pravila koja nisu dirana

- E3: otvorena povelja (≥4) + Predsjedništvo koje se može sastati; sjedenje Mesića ≠ blokada; blokada isključuje E3
- Nema čina VI; nema lipanjskog rata; Izetbegović–Gligorov **nije** prihvatljiv papir (samo isključenje)
- Marković = predsjednik **SIV-a**; Jović ≠ Milošević; Titograd ostaje Titograd
- `player_used_jna_threat` samo na namjernim tvrdim granama
- ID-ovi i zastavice engleski; UI hrvatski (ijekavica)


## Dodatak — Pass 9 `expand/pass9-ssip-loncar`

Šalter **Savezni sekretarijat za inostrane poslove / SSIP** (`ssip`, agencija `ssip`); produbljeni TO i NBJ; glas Lončara; Marković revisit SSIP; kartice čina I–V; `save_schema` 9; smoke proširen.

### Nova / proširena kartica

| Spis | Datum | Napomena |
|---|---|---|
| `desk_ssip_open` | 1990-03-05 | SSIP: EEZ dijalog / Nesvrstani / tihi bilaterali |
| `desk_to_nby_couple` | 1990-04-28 | TO–NBJ papirni koridor; inventura ekskluzivnost nepromijenjena |
| `desk_ssip_siv_bind` | 1990-05-22 | SSIP–SIV veza; Marković = SIV |
| `desk_ssip_embassy` | 1990-08-28 | Embassies memo; I–G samo isključenje |
| `desk_ssip_nam_autumn` | 1990-10-15 | Ostatak Nesvrstanih / FER couple |
| `desk_ssip_before_pleb` | 1990-12-18 | Pred plebiscitom; bez auto-sjedenja Mesića |
| `desk_ssip_spring91` | 1991-03-05 | Proljeće 1991.; bez čina VI |
| `confederal_ssip_memo` | 1991-04-24 | SSIP + konfederalni stol; I–G **nije** dostupan |

### Razgovori

- `loncar.json` — Budimir Lončar; EEZ / NAM / bilaterali; revisit SIV veza
- `markovic.json` — `revisit_ssip` (SSIP/SIV zastavice)

### Šalteri

- **ssip**: `ec_dialogue` → `ssip_ec_channel`; `nonaligned_hold` → `ssip_nonaligned_hold`; `bilateral_quiet` → `ssip_bilateral_quiet`; `paralyzed` → `ssip_paralyzed`; `bind_siv` → `ssip_siv_bind`; `couple_fer` → `ssip_fer_couple`
- **to** `shared_reserve_pool` → `to_shared_reserve`; `liaison_nby` → `to_nby_liaison`
- **nby** `imf_align` → `nby_imf_align`; `diplomatic_fx` → `nby_diplomatic_fx`

### Pravila koja nisu dirana

- E3: otvorena povelja (≥4) + Predsjedništvo koje se može sastati; sjedenje Mesića ≠ blokada; blokada isključuje E3
- Nema čina VI; nema lipanjskog rata; Izetbegović–Gligorov **nije** prihvatljiv papir (samo isključenje)
- Marković = predsjednik **SIV-a**; Jović ≠ Milošević; Titograd ostaje Titograd
- Nema priznanja secesije; `to_inventory_ordered` ekskluzivnost nepromijenjena
- ID-ovi i zastavice engleski; UI hrvatski (ijekavica)

## Dodatak — Pass 10 `expand/pass10-const-court`

Šalter **Ustavni sud Jugoslavije** (`const_court`, agencija `const_court`); produbljeni pravosuđe i SSUP; glas Buzadžića (v. d. predsjednika); Marković revisit suda; kartice čina I–V; `save_schema` 10; smoke proširen.

### Nova / proširena kartica

| Spis | Datum | Napomena |
|---|---|---|
| `desk_const_court_open` | 1990-03-12 | Ustavni sud: docket / bind / zastoj |
| `desk_justice_refer_court` | 1990-05-18 | Pravosuđe upućuje spis sudu |
| `desk_ssup_docket_watch` | 1990-06-22 | SSUP tihi nadzor docketa |
| `desk_const_court_autumn` | 1990-09-14 | Jesen: docket / zastoj / ustupanje |
| `desk_justice_court_bind` | 1990-10-22 | Bind kanal pravosuđe×sud |
| `desk_const_court_before_pleb` | 1990-12-12 | Pred plebiscitom; bez auto-sjedenja Mesića |
| `desk_const_court_spring91` | 1991-03-12 | Proljeće 1991.; bez čina VI |
| `confederal_const_court_memo` | 1991-04-26 | Sud + konfederalni stol; I–G **nije** dostupan |

### Razgovori

- `buzadzic.json` — Milovan Buzadžić (v. d. predsjednika); docket / bind / zastoj; revisit justice
- `markovic.json` — `revisit_const_court` (sud/pravosuđe zastavice)

### Šalteri

- **const_court**: `docket_open` → `const_court_docket_open`; `stall` → `const_court_stalled`; `yield_republics` → `const_court_yields`; `bind_justice` → `const_court_bind_justice`; `soft_legit_memo` → `const_court_soft_memo`; `annul_hard` → `const_court_annul_hard`
- **justice** `refer_to_court` → `justice_refer_court`; `couple_court_bind` → `justice_court_bind`
- **ssup** `docket_watch` → `ssup_docket_watch`; `court_liaison` → `ssup_court_liaison`

### Pravila koja nisu dirana

- E3: otvorena povelja (≥4) + Predsjedništvo koje se može sastati; sjedenje Mesića ≠ blokada; blokada isključuje E3
- Nema čina VI; nema lipanjskog rata; Izetbegović–Gligorov **nije** prihvatljiv papir (samo isključenje)
- Marković = predsjednik **SIV-a**; Jović ≠ Milošević; Titograd ostaje Titograd
- Nema ratnih suđenja; mirovni papir samo
- ID-ovi i zastavice engleski; UI hrvatski (ijekavica)

## Dodatak — Pass 11 `expand/pass11-provinces`

Šalter **Pokrajinska sjedala** (`provinces`, agencija `provinces`); produbljeni Predsjedništvo i SSUP; glasovi Bajramovića (Kosovo) i Kostića (Vojvodina); Marković revisit sjedala; kartice čina I–V; `save_schema` 11; smoke proširen. Zastavica `provinces_vote_independently` sada ima desk/dijalog/event putove uz postojeću reformu.

### Nova / proširena kartica

| Spis | Datum | Napomena |
|---|---|---|
| `desk_provinces_open` | 1990-02-27 | Otvaranje šaltera: blok / promatranje / neovisni glasovi |
| `desk_provinces_spring` | 1990-05-10 | Proljetna aritmetika sjedala |
| `desk_provinces_autumn` | 1990-09-18 | Suverenistički pritisak na sjedala |
| `desk_ssup_province_dossier` | 1990-10-10 | SSUP mirni dosje pokrajinskih sjedala |
| `desk_provinces_before_pleb` | 1990-12-11 | Pred savjetodavnim plebiscitom |
| `desk_presidency_province_quorum` | 1990-12-17 | Predsjedništvo: kvorum s VO/XK |
| `desk_provinces_spring91` | 1991-03-20 | Proljeće 1991. papirni put; bez čina VI |
| `confederal_provinces_memo` | 1991-04-25 | Memo sjedala uz konfederalni stol; I–G **nije** dostupan |

### Razgovori

- `bajramovic.json` — Sejdo Bajramović (Kosovo sjedalo); neovisni / blok / medijacija
- `kostic.json` — Jugoslav Kostić (Vojvodina); neovisni / promatranje / blok
- `markovic.json` — `revisit_provinces` (SIV × sjedala)

### Šalteri

- **provinces**: `bloc_aligned` → `provinces_bloc_tight`; `observe` → `provinces_observe`; `vote_independent` → `provinces_vote_independently`; `mediate_seats` → `provinces_mediate`
- **presidency** `quorum_with_provinces` → `presidency_province_quorum`; `seat_province_voice` → `presidency_province_voice`
- **ssup** `province_dossier` → `ssup_province_dossier`
- Soft-lock: `align_bloc` / `bloc_aligned` sukobljava se s `confederal_talks_open`

### Pravila koja nisu dirana

- E3: otvorena povelja (≥4) + Predsjedništvo koje se može sastati; sjedenje Mesića ≠ blokada; blokada isključuje E3
- Nema čina VI; nema lipanjskog rata; Izetbegović–Gligorov **nije** prihvatljiv papir (samo isključenje)
- Marković = predsjednik **SIV-a**; Jović ≠ Milošević; Titograd ostaje Titograd
- `syncSerbianBloc` i dalje poštuje `provinces_vote_independently`; reforma `pret_provinces` netaknuta
- ID-ovi i zastavice engleski; UI hrvatski (ijekavica)

## Dodatak — Pass 12 `expand/pass12-ssno`

Šalter **Savezni sekretarijat za narodnu obranu / SSNO** (`ssno`, agencija `ssno`); produbljeni JNA i TO; Kadijević revisit SSNO + kasni izbor; Marković revisit SSNO; kartice čina I–V; `save_schema` 12; smoke proširen. Ministarski sloj (doktrina / inventura / veza TO / savjet Predsjedništvu) — **nije** zamjena za šalter JNA (snaga) ni TO.

### Nova / proširena kartica

| Spis | Datum | Napomena |
|---|---|---|
| `desk_ssno_open` | 1990-02-22 | Otvaranje šaltera: doktrina / savjet / inventura |
| `desk_ssno_spring` | 1990-05-08 | Proljetna postava SSNO |
| `desk_ssno_autumn` | 1990-09-15 | Jesen: pritisak na ministarski sloj |
| `desk_jna_ssno_bind` | 1990-10-01 | JNA ↔ SSNO doktrina (tihi papir; bez `player_used_jna_threat`) |
| `desk_ssno_before_pleb` | 1990-12-08 | Pred savjetodavnim plebiscitom |
| `desk_to_ssno_liaison` | 1990-12-14 | TO ↔ SSNO ministarski kanal |
| `desk_ssno_spring91` | 1991-03-15 | Proljeće 1991. papirni put; bez čina VI |
| `confederal_ssno_memo` | 1991-04-27 | Memo SSNO uz konfederalni stol; I–G **nije** dostupan |

### Razgovori

- `kadijevic.json` — `revisit_ssno` (ministarski sloj)
- `kadijevic_late.json` — izbor `ssno_late`
- `markovic.json` — `revisit_ssno` (SIV × SSNO)

### Šalteri

- **ssno**: `doctrine_federal` → `ssno_doctrine_federal`; `inventory_audit` → `ssno_inventory_audit`; `to_coordinate` → `ssno_to_coordinate`; `chair_counsel` → `ssno_chair_counsel`
- **jna** `bind_ssno_doctrine` → `jna_ssno_doctrine_bind`; `accept_ssno_inventory` → `jna_ssno_inventory_channel`
- **to** `liaison_ssno` → `to_ssno_liaison`; `shared_ssno_paper` → `to_ssno_shared_paper`
- Soft-lock: `inventory_audit` sukobljava se s `confederal_talks_open`
- Tihi SSNO/JNA papir **ne** postavlja `player_used_jna_threat`

### Pravila koja nisu dirana

- E3: otvorena povelja (≥4) + Predsjedništvo koje se može sastati; sjedenje Mesića ≠ blokada; blokada isključuje E3
- Nema čina VI; nema lipanjskog rata; Izetbegović–Gligorov **nije** prihvatljiv papir (samo isključenje)
- Marković = predsjednik **SIV-a**; Jović ≠ Milošević; Titograd ostaje Titograd
- ID-ovi i zastavice engleski; UI hrvatski (ijekavica)

## Dodatak — Pass 13 `expand/pass13-sdb`

Šalter **Služba državne sigurnosti / SDB** (`sdb`, agencija `sdb`); produbljeni SSUP i SIV; glas Gračanina (SSUP kanal); Marković revisit SDB; kartice čina I–V; `save_schema` 13; smoke proširen. Servisni sloj (civilni uze / promatranje / dosjei / Knin / zategnuti uze) — **nije** zamjena za šalter SSUP (unutarnji poslovi).

### Nova / proširena kartica

| Spis | Datum | Napomena |
|---|---|---|
| `desk_sdb_open` | 1990-02-20 | Otvaranje šaltera: uze / promatranje / dosjei |
| `desk_sdb_spring` | 1990-05-05 | Proljetna postava SDB |
| `desk_sdb_autumn` | 1990-09-12 | Jesen: pritisak na servis |
| `desk_ssup_sdb_bind` | 1990-10-05 | SSUP ↔ SDB kanal |
| `desk_sdb_before_pleb` | 1990-12-10 | Pred savjetodavnim plebiscitom |
| `desk_siv_sdb_leash` | 1990-12-16 | SIV civilni nadzor nad SDB |
| `desk_sdb_spring91` | 1991-03-18 | Proljeće 1991. papirni put; bez čina VI |
| `confederal_sdb_memo` | 1991-04-28 | Memo SDB uz konfederalni stol; I–G **nije** dostupan |

### Razgovori

- `gracanin.json` — Petar Gračanin (SSUP kanal prema SDB); uze / promatranje / zategni; revisit dosjei/Knin
- `markovic.json` — `revisit_sdb` (SIV × SDB)

### Šalteri

- **sdb**: `civilian_leash` → `sdb_civilian_leash`; `observe_line` → `sdb_observe_line`; `dossier_share` → `sdb_dossier_channel` / `sdb_files_shared`; `knin_watch` → `sdb_knin_watch`; `tight_leash` → `sdb_leash_tight`
- **ssup** `liaison_sdb` → `ssup_sdb_liaison`; `accept_sdb_channel` → `ssup_sdb_channel`
- **siv** `bind_sdb` → `sdb_siv_bind`
- Soft-lock: `tight_leash` / `knin_watch` sukobljava se s `confederal_talks_open`
- Tihi SDB papir **ne** postavlja `player_used_jna_threat`
- Postojeće SSUP akcije `sdb_leash` / `sdb_leash_tight` / `sdb_share_files` ostaju

### Pravila koja nisu dirana

- E3: otvorena povelja (≥4) + Predsjedništvo koje se može sastati; sjedenje Mesića ≠ blokada; blokada isključuje E3
- Nema čina VI; nema lipanjskog rata; Izetbegović–Gligorov **nije** prihvatljiv papir (samo isključenje)
- Marković = predsjednik **SIV-a**; Jović ≠ Milošević; Titograd ostaje Titograd
- Nema priznanja secesije; ID-ovi i zastavice engleski; UI hrvatski (ijekavica)

## Dodatak — Pass 14 `expand/pass14-labor`

Šalter **Savezni sekretarijat za rad** (`labor`, agencija `labor`); produbljeni Financije, SIV i SSRN; glas Gačića (savezni sekretar za rad); Marković revisit Rada; kartice čina I–V; `save_schema` 14; smoke proširen. Mirnodopski sloj (socijalni mir / štrajkovi / potpora reformi / plaćni koridor / tvrđi držaj) — **nije** zamjena za Financije ni SSRN. (SSI nije postojao kao samostalni savezni sekretarijat 1990.)

### Nova / proširena kartica

| Spis | Datum | Napomena |
|---|---|---|
| `desk_labor_open` | 1990-02-18 | Otvaranje šaltera: mir / štrajk / reforma |
| `desk_labor_spring` | 1990-05-06 | Proljetna postava Rada |
| `desk_labor_autumn` | 1990-09-14 | Jesen: pritisak na radni šalter |
| `desk_finance_labor_bind` | 1990-10-08 | Financije ↔ Rad kanal |
| `desk_labor_before_pleb` | 1990-12-09 | Pred savjetodavnim plebiscitom |
| `desk_ssrn_labor_liaison` | 1990-12-17 | SSRN ↔ Rad masovni front |
| `desk_labor_spring91` | 1991-03-16 | Proljeće 1991. papirni put; bez čina VI |
| `confederal_labor_memo` | 1991-04-26 | Memo Rada uz konfederalni stol; I–G **nije** dostupan |

### Razgovori

- `gacic.json` — Radiša Gačić (savezni sekretar za rad); mir / štrajk / tvrđi držaj; revisit plaće/reforma/SSRN
- `markovic.json` — `revisit_labor` (SIV × Rad)

### Šalteri

- **labor**: `social_peace` → `labor_social_peace`; `strike_cool` → `labor_strike_cool`; `reform_support` → `labor_reform_support`; `wage_corridor` → `labor_wage_corridor`; `harden_line` → `labor_harden_line`
- **finance** `liaison_labor` → `finance_labor_liaison`; `accept_labor_corridor` → `finance_labor_corridor`
- **siv** `bind_labor` → `labor_siv_bind`
- **ssrn** `liaison_labor` → `ssrn_labor_liaison`; `accept_labor_channel` → `ssrn_labor_channel`
- Soft-lock: `harden_line` sukobljava se s `confederal_talks_open`
- Tihi radni papir **ne** postavlja `player_used_jna_threat`

### Pravila koja nisu dirana

- E3: otvorena povelja (≥4) + Predsjedništvo koje se može sastati; sjedenje Mesića ≠ blokada; blokada isključuje E3
- Nema čina VI; nema lipanjskog rata; Izetbegović–Gligorov **nije** prihvatljiv papir (samo isključenje)
- Marković = predsjednik **SIV-a**; Jović ≠ Milošević; Titograd ostaje Titograd
- Nema priznanja secesije; ID-ovi i zastavice engleski; UI hrvatski (ijekavica)



## Dodatak — Pass 17 `expand/pass17-trade`

Šalter **Savezni sekretarijat za unutarnju trgovinu** (`trade`, agencija `trade`); produbljeni Financije, SIV i FER; glas Mustafe Nazmija (Službeni list 20/1989); Marković revisit Trgovine; kartice čina I–V; `save_schema` 17; smoke proširen. Mirnodopski sloj (smirenje tržišta / meke police / cjenovni koridor / potpora reformi / tvrđe kontrole) — **nije** zamjena za FER, Financije, Industriju ni Poljoprivredu.

### Nova / proširena kartica

| Spis | Datum | Napomena |
|---|---|---|
| `desk_trade_open` | 1990-02-28 | Otvaranje šaltera |
| `desk_trade_spring` | 1990-05-16 | Proljetna postava |
| `desk_trade_autumn` | 1990-09-24 | Jesen: pritisak |
| `desk_finance_trade_bind` | 1990-10-18 | Financije ↔ Trgovina |
| `desk_trade_before_pleb` | 1990-12-16 | Pred plebiscitom |
| `desk_fer_trade_liaison` | 1990-12-27 | FER ↔ Trgovina šav |
| `desk_trade_spring91` | 1991-03-26 | Proljeće 1991.; bez čina VI |
| `confederal_trade_memo` | 1991-05-05 | Memo uz konfederalni stol; I–G **nije** dostupan |

### Razgovori

- `nazmi.json` — Mustafa Nazmi (savezni sekretar za unutarnju trgovinu)
- `markovic.json` — `revisit_trade` (SIV × Trgovina)

### Šalteri

- **trade**: `market_calm` → `trade_market_calm`; `shelf_soft` → `trade_shelf_soft`; `price_corridor` → `trade_price_corridor`; `reform_support` → `trade_reform_support`; `harden_controls` → `trade_harden_controls`
- **finance** `liaison_trade` / `accept_trade_corridor`
- **siv** `bind_trade` → `trade_siv_bind`
- **fer** `liaison_domestic_trade` / `accept_trade_desk` (ne sudara se s `fer_trade_open`)
- Soft-lock: `harden_controls` sukobljava se s `confederal_talks_open`
- Tihi trgovački papir **ne** postavlja `player_used_jna_threat`
- `federal.internal_market` default 50

### Preostali 1990 SIV sekretarijati bez šaltera

- promet i veze; razvoj; prava i uprava
