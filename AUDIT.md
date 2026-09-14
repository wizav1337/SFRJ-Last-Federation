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
- **Engleski `data/i18n/en.json`** ostaje kao prazan fallback. Zadani jezik pri paljenju je hrvatski.

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
