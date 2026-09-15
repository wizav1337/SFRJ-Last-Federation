import { UNIT_IDS, clamp, monthIndex } from "./state.js";
import { recomputeFederalControl } from "./control.js";
import { applyDeskMonthlyPosture } from "./desks.js";

function unit(state, id) {
  return state.units[id];
}

export function recomputeWarRisk(state) {
  const u = state.units;
  const secession = (u.HR.secession_readiness + u.SI.secession_readiness) / 2;
  const tension = (u.BA.interethnic_tension + u.HR.interethnic_tension + u.XK.interethnic_tension) / 3;
  const jnaInv = 100 - state.federal.jna_obedience_to_civilian;
  let w = secession * 0.35 + tension * 0.30 + jnaInv * 0.20;
  if (state.flags.krajina_log_revolution) w += 12;
  if (state.flags.player_used_emergency) w += 8;
  if (state.flags.player_used_jna_threat) w += 6;
  if (state.flags.to_inventory_ordered) w += 3;
  if (state.flags.pakrac_standoff) w += 7;
  if (state.flags.belgrade_march_tanks) w += 4;
  if (state.flags.customs_war_active) w += 3;
  if (state.flags.jna_mobilization_alert) w += 3;
  if (state.flags.jna_garrison_posture) w -= 1;
  if (state.flags.ssup_hard_line) w += 2;
  if (state.flags.presidency_mediation_active) w -= 1;
  if (state.flags.to_inventory_push) w += 2;
  if (state.flags.to_coordinate_posture) w -= 1;
  if (state.flags.to_republic_hold) w += 1;
  if (state.flags.nby_fragment_risk) w += 1;
  if (state.flags.dialogue_tudman_hard) w += 2;
  if (state.flags.dialogue_kadijevic_winter) w -= 1;
  if (state.flags.sdb_civilian_leash) w -= 1;
  if (state.flags.sdb_leash_tight) w -= 1;
  if (state.flags.agriculture_food_security || state.flags.agriculture_quiet_paper) w -= 1;
  if (state.flags.agriculture_harden_quota) w += 1;
  if (state.flags.ssup_observe_line) w -= 0.5;
  if (state.flags.dialogue_kucan_charter) w -= 1;
  if (state.flags.confederal_stack_memo) w -= 0.5;
  if (state.flags.confederal_talks_open && state.federal.war_risk < 60) w -= 2;
  if (state.flags.markovic_mandate_strong) w -= 1;
  if (state.flags.skj_soft_federation) w -= 0.5;
  if (state.flags.skj_hard_unity) w += 1.5;
  if (state.flags.confederal_skj_memo) w -= 0.5;
  if (state.flags.dialogue_bogicevic_mediate) w -= 0.5;
  if (state.flags.dialogue_bogicevic_bloc) w += 1;
  if (state.flags.assembly_stalled || state.flags.assembly_paralysis_risk) w += 0.5;
  if (state.flags.assembly_open || state.flags.assembly_quorum_ok) w -= 0.3;
  if (state.flags.fer_customs_hard) w += 0.5;
  if (state.flags.fer_trade_open || state.flags.fer_customs_eased) w -= 0.3;
  if (state.flags.dialogue_bucin_bloc || state.flags.me_serbia_bloc) w += 0.5;
  if (state.flags.dialogue_bucin_soft || state.flags.dialogue_bucin_quorum) w -= 0.4;
  if (state.flags.dialogue_gligorov_conf || state.flags.dialogue_izetbegovic_mediate) w -= 0.4;
  if (state.flags.fond_freeze) w += 0.4;
  if (state.flags.fond_open_south || state.flags.fond_target_mk_me) w -= 0.25;
  if (state.flags.fond_politicized) w += 0.2;
  if (state.flags.ssrn_paralyzed || state.flags.ssrn_party_capture) w += 0.25;
  if (state.flags.ssrn_civic_forum || state.flags.ssrn_siv_bind) w -= 0.2;
  if (state.flags.ssp_isolation) w += 0.2;
  if (state.flags.ssp_nam_bridge) w -= 0.15;
  if (state.flags.finance_target) w += 0.15;
  if (state.flags.finance_soft_corridor) w -= 0.15;
  if (state.flags.dialogue_mesic_late_duty || state.flags.dialogue_jovic_late_quorum) w -= 0.2;
  if (state.flags.jna_quiet_redistribute) w -= 0.3;
  if (state.flags.presidency_south_balance || state.flags.confederal_fond_memo) w -= 0.3;
  if (state.flags.dialogue_bulatovic_bloc) w += 0.4;
  if (state.flags.dialogue_bulatovic_soft || state.flags.dialogue_bulatovic_fond) w -= 0.3;
  state.federal.war_risk = clamp(w);
}

function snapshotMetrics(state) {
  const f = state.federal;
  const avg = (key) =>
    UNIT_IDS.reduce((a, id) => a + (unit(state, id)[key] || 0), 0) / UNIT_IDS.length;
  return {
    inflation: f.inflation,
    war_risk: f.war_risk,
    siv_authority: f.siv_authority,
    reform_momentum: f.reform_momentum,
    jna_cohesion: f.jna_cohesion,
    legitimacy: f.legitimacy,
    inter_republic_trade: f.inter_republic_trade,
    avg_heat: avg("nationalist_heat"),
    avg_secession: avg("secession_readiness"),
    avg_control: avg("federal_control"),
    avg_living: avg("living_standard"),
  };
}

/** Cause-effect lines for the monthly briefing. */
export function buildMonthlyReport(state, before, months) {
  const after = snapshotMetrics(state);
  const delta = (k) => Math.round((after[k] ?? 0) - (before[k] ?? 0));
  const lines = [];
  const push = (key, label, invert = false) => {
    const d = delta(key);
    if (d === 0) return;
    const sign = d > 0 ? "+" : "";
    const tone = invert ? (d > 0 ? "bad" : "good") : d > 0 ? "good" : "bad";
    lines.push({ key, label, delta: d, text: `${label} ${sign}${d}`, tone });
  };
  push("inflation", "Inflacija", true);
  push("avg_living", "Životni standard (prosjek)");
  push("avg_heat", "Nacionalistička vrućina (prosjek)", true);
  push("avg_secession", "Spremnost na otcjepljenje (prosjek)", true);
  push("avg_control", "Savezna kontrola (prosjek)");
  push("siv_authority", "Autoritet SIV-a");
  push("reform_momentum", "Reformski zamah");
  push("jna_cohesion", "Kohezija JNA");
  push("legitimacy", "Legitimnost");
  push("inter_republic_trade", "Međurepublička trgovina");
  push("war_risk", "Ratni rizik", true);

  const drivers = [];
  if (state.flags.markovic_dinar_program) drivers.push("dinarski program Markovića još drži knjigu");
  if (state.flags.markovic_starved) drivers.push("SIV je izgladnjen u odboru");
  if (state.flags.customs_war_active) drivers.push("carinski rat guši trgovinu");
  if (state.flags.skj_split) drivers.push("ostaci SKJ-a više ne vežu Sabore");
  if (state.flags.krajina_log_revolution) drivers.push("balvani još stoje kao politička činjenica");
  if (state.flags.pakrac_standoff) drivers.push("Pakrac ostaje napeta točka bez fronte");
  if (state.flags.belgrade_march_tanks) drivers.push("ožujak u Beogradu: tenkovi su već bili na ulici");
  if (state.flags.confederal_talks_open) drivers.push("konfederalni stol još je otvoren");
  if (state.flags.imf_standby_active) drivers.push("stand-by s MMF-om pritišće proračun");
  if ((state.federal.imf_pressure || 0) >= 60) drivers.push("pritisak MMF-a je visok");
  if (state.desks?.jna?.posture === "alert") drivers.push("JNA u pripravnosti (šalter vojske)");
  if (state.desks?.jna?.posture === "garrison") drivers.push("JNA u garnizonskoj postavi");
  if (state.desks?.jna?.posture === "political") drivers.push("JNA kao politička težina");
  if (state.desks?.siv?.posture === "austerity") drivers.push("SIV u štednji");
  if (state.desks?.siv?.posture === "stimulus") drivers.push("SIV u poticaju");
  if (state.desks?.siv?.posture === "technocrat") drivers.push("SIV tehnokratski (knjige)");
  if (state.desks?.presidency?.posture === "mediate") drivers.push("Predsjedništvo medira");
  if (state.desks?.presidency?.posture === "hardline") drivers.push("Predsjedništvo na tvrdoj liniji");
  if (state.flags.ssup_hard_line) drivers.push("SSUP na tvrdoj liniji");
  if (state.flags.ssup_soft_line) drivers.push("SSUP na mekoj liniji");
  if (state.flags.ssp_ec_track) drivers.push("SSP na kolosijeku EEZ");
  if (state.desks?.finance?.posture === "freeze") drivers.push("Financije: transferi smrznuti");
  if (state.desks?.finance?.posture === "open") drivers.push("Financije: transferi otvoreni");
  if (state.desks?.to?.posture === "inventory") drivers.push("TO: savezna inventura zaliha");
  if (state.desks?.to?.posture === "coordinate") drivers.push("TO koordinirana s JNA");
  if (state.desks?.to?.posture === "republic_hold") drivers.push("TO u republikanskom držaju");
  if (state.desks?.nby?.posture === "tight") drivers.push("NBJ: tvrdi dinar / rezerve");
  if (state.desks?.nby?.posture === "loose") drivers.push("NBJ: labaviji kredit");
  if (state.desks?.nby?.posture === "fragment") drivers.push("NBJ upozorava na fragment platnog prometa");
  if (state.flags.dialogue_kucan_conf) drivers.push("razgovor s Kučanom: konfederalni stol");
  if (state.flags.dialogue_tudman_mediate) drivers.push("razgovor s Tuđmanom: medijacija");
  if (state.flags.dialogue_tudman_hard) drivers.push("razgovor s Tuđmanom: tvrda upozorenja");
  if (state.flags.talked_markovic_late) drivers.push("jesenski krug s Markovićem");
  if (state.flags.talked_kadijevic_late) drivers.push("zimski krug s Kadijevićem");
  if (state.flags.sdb_civilian_leash) drivers.push("SDB na uzetu Predsjedništva");
  if (state.flags.sdb_leash_tight) drivers.push("SDB: zategnuti civilni nadzor");
  if (state.flags.sdb_files_shared) drivers.push("dosjei SDB dijeljeni Predsjedništvu");
  if (state.flags.labor_social_peace || state.desks?.labor?.posture === "social_peace") drivers.push("Rad: socijalni mir");
  if (state.flags.labor_strike_cool || state.desks?.labor?.posture === "strike_cool") drivers.push("Rad: hlađenje štrajkova");
  if (state.flags.labor_reform_support || state.desks?.labor?.posture === "reform_support") drivers.push("Rad: potpora reformi");
  if (state.flags.labor_harden_line || state.desks?.labor?.posture === "harden_line") drivers.push("Rad: tvrđi radni držaj");
  if (state.flags.confederal_labor_memo) drivers.push("memorandum Rada uz konfederalni stol");
  if (state.flags.agriculture_food_security || state.desks?.agriculture?.posture === "food_security") drivers.push("Poljoprivreda: prehrambena sigurnost");
  if (state.flags.agriculture_procurement_soft || state.desks?.agriculture?.posture === "procurement_soft") drivers.push("Poljoprivreda: meka nabava");
  if (state.flags.agriculture_farm_relief || state.desks?.agriculture?.posture === "farm_relief") drivers.push("Poljoprivreda: olakšice farmama");
  if (state.flags.agriculture_reform_support || state.desks?.agriculture?.posture === "reform_support") drivers.push("Poljoprivreda: potpora reformi");
  if (state.flags.agriculture_harden_quota || state.desks?.agriculture?.posture === "harden_quota") drivers.push("Poljoprivreda: tvrđe kvote");
  if (state.flags.confederal_agriculture_memo) drivers.push("memorandum Poljoprivrede uz konfederalni stol");
  if (state.flags.ssup_observe_line) drivers.push("SSUP u promatračkoj postavi");
  if (state.flags.confederal_stack_memo) drivers.push("memorandum konfederalnog stoga");
  if (state.flags.dialogue_kucan_charter) drivers.push("Kučan: potpis na konfederalnoj traci");
  if (state.flags.dialogue_kucan_revisit) drivers.push("ponovni razgovor s Kučanom");
  if (state.desks?.skj?.posture === "soft_federal" || state.flags.skj_soft_federation) drivers.push("SKJ: meka savezna linija");
  if (state.desks?.skj?.posture === "hard_unity" || state.flags.skj_hard_unity) drivers.push("SKJ: tvrda retorika jedinstva");
  if (state.desks?.skj?.posture === "cede_siv" || state.flags.skj_cedes_to_siv) drivers.push("SKJ predao težinu SIV-u");
  if (state.desks?.skj?.posture === "dissolved" || state.flags.skj_dissolved) drivers.push("SKJ tiho raspušten (bez monopola)");
  if (state.flags.republic_voice_bih_seen || state.flags.talked_bogicevic) drivers.push("glas BiH u Predsjedništvu");
  if (state.flags.republic_voice_mk_seen || state.flags.talked_tupurkovski) drivers.push("glas Makedonije u Predsjedništvu");
  if (state.flags.talked_racan) drivers.push("razgovor s Račanom (SKH–SDP)");
  if (state.flags.confederal_skj_memo) drivers.push("memorandum SKJ uz otvoreni konfederalni stol");
  if (state.flags.dialogue_jovic_skj) drivers.push("Jović čita zastavice SKJ");
  if (state.desks?.assembly?.posture === "session_open" || state.flags.assembly_open) drivers.push("Skupština: otvoreni rad");
  if (state.desks?.assembly?.posture === "stalled" || state.flags.assembly_stalled) drivers.push("Skupština u zastoju");
  if (state.desks?.assembly?.posture === "rubber_stamp" || state.flags.assembly_rubber_stamp) drivers.push("Skupština pečatira akte");
  if (state.desks?.fer?.posture === "trade_open" || state.flags.fer_trade_open) drivers.push("FER: otvorena trgovina");
  if (state.desks?.fer?.posture === "imf_line" || state.flags.fer_imf_line) drivers.push("FER: linija MMF uz SIV");
  if (state.desks?.fer?.posture === "customs_hard" || state.flags.fer_customs_hard) drivers.push("FER: tvrde carine");
  if (state.flags.talked_gligorov || state.flags.republic_voice_gligorov_seen) drivers.push("glas Gligorova (Skopje)");
  if (state.flags.talked_bucin || state.flags.republic_voice_me_seen) drivers.push("glas Crne Gore (Titograd)");
  if (state.flags.talked_izetbegovic) drivers.push("medijacija s Izetbegovićem (bez I–G)");
  if (state.desks?.fond?.posture === "open_south" || state.flags.fond_open_south) drivers.push("Fond: otvoren jug");
  if (state.desks?.fond?.posture === "freeze" || state.flags.fond_freeze) drivers.push("Fond smrznut");
  if (state.desks?.fond?.posture === "target_mk_me" || state.flags.fond_target_mk_me) drivers.push("Fond: cilj MK–ME");
  if (state.desks?.fond?.posture === "politicized" || state.flags.fond_politicized) drivers.push("Fond politiziran");
  if (state.flags.siv_fond_bind) drivers.push("SIV vezan uz Fond");
  if (state.flags.jna_quiet_redistribute) drivers.push("JNA: tiha preraspodjela (bez prijetnje)");
  if (state.flags.presidency_south_balance) drivers.push("Predsjedništvo: južna ravnoteža");
  if (state.flags.talked_bulatovic || state.flags.republic_voice_bulatovic_seen) drivers.push("glas Bulatovića (Titograd)");
  if (state.flags.confederal_fond_memo) drivers.push("memorandum Fond uz konfederalni stol");
  if (state.flags.dialogue_markovic_fond) drivers.push("Marković o Fondu/MMF");
  if (state.desks?.ssrn?.posture === "mass_front_open" || state.flags.ssrn_mass_front) drivers.push("SSRN: otvoreni masovni front");
  if (state.desks?.ssrn?.posture === "civic_forum" || state.flags.ssrn_civic_forum) drivers.push("SSRN: građanski forum");
  if (state.desks?.ssrn?.posture === "party_capture" || state.flags.ssrn_party_capture) drivers.push("SSRN: stranačko zarobljavanje");
  if (state.desks?.ssrn?.posture === "paralyzed" || state.flags.ssrn_paralyzed) drivers.push("SSRN paraliziran");
  if (state.flags.ssrn_siv_bind) drivers.push("SSRN vezan uz SIV");
  if (state.flags.ssp_isolation || state.desks?.ssp?.posture === "isolation") drivers.push("SSP: izolacija");
  if (state.flags.ssp_nam_bridge) drivers.push("SSP: most Nesvrstanih");
  if (state.flags.finance_target || state.desks?.finance?.posture === "target") drivers.push("Financije: ciljani kanali");
  if (state.flags.finance_soft_corridor) drivers.push("Financije: meki koridor");
  if (state.flags.confederal_ssrn_memo) drivers.push("memorandum SSRN uz konfederalni stol");
  if (state.flags.talked_mesic_late) drivers.push("kasni Mesić: dužnost stolca");
  if (state.flags.talked_jovic_late) drivers.push("kasni Jović: kvorum vs blok");
  if (state.flags.dialogue_markovic_ssrn) drivers.push("Marković o SSRN");
  if (state.desks?.ssip?.posture === "ec_dialogue" || state.flags.ssip_ec_channel) drivers.push("SSIP: EEZ dijalog");
  if (state.desks?.ssip?.posture === "nonaligned_hold" || state.flags.ssip_nonaligned_hold) drivers.push("SSIP: ostatak Nesvrstanih");
  if (state.desks?.ssip?.posture === "bilateral_quiet" || state.flags.ssip_bilateral_quiet) drivers.push("SSIP: tihi bilaterali");
  if (state.desks?.ssip?.posture === "paralyzed" || state.flags.ssip_paralyzed) drivers.push("SSIP paraliziran");
  if (state.flags.ssip_siv_bind) drivers.push("SSIP vezan uz SIV");
  if (state.flags.ssip_fer_couple) drivers.push("SSIP vezan uz FER/MMF");
  if (state.flags.to_shared_reserve) drivers.push("TO: zajednički rezervni fond");
  if (state.flags.to_nby_liaison) drivers.push("TO–NBJ veza");
  if (state.flags.nby_imf_align) drivers.push("NBJ: usklađivanje s MMF");
  if (state.flags.nby_diplomatic_fx) drivers.push("NBJ: diplomatski FX");
  if (state.flags.confederal_ssip_memo) drivers.push("memorandum SSIP uz konfederalni stol");
  if (state.flags.talked_loncar) drivers.push("glas Lončara (SSIP)");
  if (state.flags.dialogue_markovic_ssip) drivers.push("Marković o SSIP");
  if (state.desks?.const_court?.posture === "docket_open" || state.flags.const_court_docket_open) drivers.push("Ustavni sud: docket otvoren");
  if (state.desks?.const_court?.posture === "bind_justice" || state.flags.const_court_bind_justice) drivers.push("Ustavni sud vezan uz pravosuđe");
  if (state.desks?.const_court?.posture === "stall" || state.flags.const_court_stalled) drivers.push("Ustavni sud u zastoju");
  if (state.desks?.const_court?.posture === "yield_republics" || state.flags.const_court_yields) drivers.push("Ustavni sud ustupa republikama");
  if (state.flags.justice_refer_court) drivers.push("Pravosuđe upućuje sudu");
  if (state.flags.ssup_docket_watch) drivers.push("SSUP nadzor docketa");
  if (state.flags.confederal_const_court_memo) drivers.push("memorandum Ustavnog suda uz konfederalni stol");
  if (state.flags.talked_buzadzic) drivers.push("glas Buzadžića (Ustavni sud)");
  if (state.flags.dialogue_markovic_const_court) drivers.push("Marković o Ustavnom sudu");
  if (state.desks?.provinces?.posture === "bloc_aligned" || state.flags.provinces_bloc_tight) drivers.push("Pokrajinska sjedala: blok usklađen");
  if (state.desks?.provinces?.posture === "observe" || state.flags.provinces_observe) drivers.push("Pokrajinska sjedala: promatranje");
  if (state.desks?.provinces?.posture === "vote_independent" || state.flags.provinces_vote_independently) drivers.push("Pokrajinska sjedala: neovisni glasovi");
  if (state.desks?.provinces?.posture === "mediate_seats" || state.flags.provinces_mediate) drivers.push("Pokrajinska sjedala: medijacija");
  if (state.flags.ssup_province_dossier) drivers.push("SSUP dosje pokrajinskih sjedala");
  if (state.flags.presidency_province_quorum) drivers.push("Predsjedništvo: kvorum s pokrajinama");
  if (state.flags.confederal_provinces_memo) drivers.push("memorandum pokrajinskih sjedala uz konfederalni stol");
  if (state.flags.talked_bajramovic) drivers.push("glas Bajramovića (Kosovo sjedalo)");
  if (state.flags.talked_kostic) drivers.push("glas Kostića (Vojvodina sjedalo)");
  if (state.flags.dialogue_markovic_provinces) drivers.push("Marković o pokrajinskim sjedalima");
  if (state.desks?.ssno?.posture === "doctrine_federal" || state.flags.ssno_doctrine_federal) drivers.push("SSNO: savezna doktrina");
  if (state.desks?.ssno?.posture === "inventory_audit" || state.flags.ssno_inventory_audit) drivers.push("SSNO: inventurni kanal");
  if (state.desks?.ssno?.posture === "to_coordinate" || state.flags.ssno_to_coordinate) drivers.push("SSNO: koordinacija s TO");
  if (state.desks?.ssno?.posture === "chair_counsel" || state.flags.ssno_chair_counsel) drivers.push("SSNO: savjet Predsjedništvu");
  if (state.flags.jna_ssno_doctrine_bind) drivers.push("JNA vezana uz doktrinu SSNO");
  if (state.flags.to_ssno_liaison) drivers.push("TO–SSNO veza");
  if (state.flags.confederal_ssno_memo) drivers.push("memorandum SSNO uz konfederalni stol");
  if (state.flags.dialogue_kadijevic_ssno) drivers.push("Kadijević o SSNO");
  if (state.flags.dialogue_markovic_ssno) drivers.push("Marković o SSNO");



  return {
    months: months || 1,
    clock: state.federal.clock,
    lines,
    drivers,
    before,
    after,
  };
}

export function monthlyDrift(state, scale = 1) {
  const f = state.federal;
  const inflAdd = ((100 - f.federal_budget) * 0.04 + (100 - f.hard_currency) * 0.03) * scale;
  f.inflation = clamp(f.inflation + inflAdd);

  // Trade / IMF feedback loop
  if (state.flags.customs_war_active) {
    f.inter_republic_trade = clamp(f.inter_republic_trade - 4 * scale);
    f.hard_currency = clamp(f.hard_currency - 1.5 * scale);
    f.siv_authority = clamp(f.siv_authority - 1 * scale);
  } else if (state.flags.markovic_dinar_program) {
    f.inter_republic_trade = clamp(f.inter_republic_trade + 1.2 * scale);
    f.inflation = clamp(f.inflation - 1.5 * scale);
  }

  if (state.flags.imf_standby_active) {
    f.imf_pressure = clamp(f.imf_pressure + 1 * scale);
    f.federal_budget = clamp(f.federal_budget - 0.8 * scale);
    f.hard_currency = clamp(f.hard_currency + 1.2 * scale);
    f.reform_momentum = clamp(f.reform_momentum + 0.6 * scale);
  }

  if (state.flags.multiparty_wave) {
    for (const id of UNIT_IDS) {
      const u = unit(state, id);
      u.media_pluralism = clamp((u.media_pluralism || 20) + 1.5 * scale);
      u.opposition_org = clamp((u.opposition_org || 20) + 1.2 * scale);
    }
  }

  for (const id of UNIT_IDS) {
    const u = unit(state, id);
    const tradeHit = (100 - (f.inter_republic_trade || 50)) * 0.015 * scale;
    u.living_standard = clamp(u.living_standard - f.inflation * 0.02 * scale - tradeHit);
    u.nationalist_heat = clamp(
      u.nationalist_heat +
        (100 - u.yugoslav_identity) * 0.03 * scale +
        (100 - u.living_standard) * 0.02 * scale
    );
    // Control erosion when heat rises and trust falls
    if ((u.federal_trust || 0) < 35 && (u.nationalist_heat || 0) > 55) {
      u.secession_readiness = clamp(u.secession_readiness + 1.5 * scale);
    }
  }

  if (state.flags.skj_split) {
    for (const id of ["SI", "HR"]) {
      const u = unit(state, id);
      u.secession_readiness = clamp(u.secession_readiness + u.nationalist_heat * 0.04 * scale);
    }
  }

  const ba = unit(state, "BA");
  ba.secession_readiness = clamp(ba.secession_readiness + ba.interethnic_tension * 0.03 * scale);

  if (state.flags.pakrac_standoff) {
    unit(state, "HR").interethnic_tension = clamp(unit(state, "HR").interethnic_tension + 3 * scale);
    unit(state, "BA").interethnic_tension = clamp(unit(state, "BA").interethnic_tension + 1.5 * scale);
  }

  const secessionAvg = UNIT_IDS.reduce((a, id) => a + unit(state, id).secession_readiness, 0) / UNIT_IDS.length;
  f.jna_cohesion = clamp(
    f.jna_cohesion - secessionAvg * 0.02 * scale - (state.flags.player_used_jna_threat ? 2 * scale : 0)
  );

  // Department posture (desks.js) — JNA/SIV/Predsjedništvo/SSUP/SSP/Finance/TO/NBJ
  applyDeskMonthlyPosture(state, scale);

  // Agency soft decay: weakened organs sap authority
  const weakened = (state.agencies || []).filter((a) => a.status === "weakened").length;
  if (weakened) {
    f.siv_authority = clamp(f.siv_authority - 0.4 * weakened * scale);
    f.assembly_function = clamp(f.assembly_function - 0.3 * weakened * scale);
  }

  recomputeWarRisk(state);
}

function bumpParty(state, id, delta) {
  const p = state.parties.find((x) => x.id === id);
  if (p) p.support = clamp(p.support + delta);
}

export function contagion(state, scale = 1) {
  const s = scale;
  if (state.flags.demos_slovenia) {
    unit(state, "HR").nationalist_heat = clamp(unit(state, "HR").nationalist_heat + 4 * s);
    unit(state, "SI").secession_readiness = clamp(unit(state, "SI").secession_readiness + 3 * s);
  }
  if (state.flags.hdz_croatia) {
    bumpParty(state, "sds_hr", 3 * s);
    bumpParty(state, "sds_ba", 2 * s);
  }
  if (state.flags.sps_serbia) {
    unit(state, "ME").skj_hold = clamp(unit(state, "ME").skj_hold + 3 * s);
    unit(state, "XK").minority_fear = clamp((unit(state, "XK").minority_fear || 40) + 4 * s);
  }
  if (state.flags.markovic_dinar_program) {
    for (const id of UNIT_IDS) {
      unit(state, id).living_standard = clamp(unit(state, id).living_standard + 1 * s);
    }
    unit(state, "SI").federal_trust = clamp(unit(state, "SI").federal_trust + 1 * s);
    unit(state, "HR").federal_trust = clamp(unit(state, "HR").federal_trust + 1 * s);
  }
  if (state.flags.arsj_campaign_live) {
    bumpParty(state, "arsj", 2 * s);
    unit(state, "MK").federal_trust = clamp(unit(state, "MK").federal_trust + 1 * s);
    unit(state, "BA").federal_trust = clamp(unit(state, "BA").federal_trust + 0.8 * s);
  }
  if (state.flags.jna_move_this_tick) {
    for (const id of UNIT_IDS) {
      unit(state, id).federal_trust = clamp(unit(state, id).federal_trust - 4 * s);
    }
    state.flags.jna_move_this_tick = false;
  }
  recomputeWarRisk(state);
}

export function tick(state, kind = "choice") {
  const scale = kind === "month" ? 1 : 0.25;
  const before = kind === "month" ? snapshotMetrics(state) : null;
  monthlyDrift(state, scale);
  contagion(state, scale);
  recomputeFederalControl(state);
  if (before) {
    state.lastMonthlyReport = buildMonthlyReport(state, before, 1);
  }
  return before;
}

export function maybeAdvanceMonth(state, previousClock) {
  const before = monthIndex(previousClock);
  const after = monthIndex(state.federal.clock);
  let months = 0;
  if (after > before) {
    months = after - before;
    const snap = snapshotMetrics(state);
    for (let i = 0; i < months; i++) tick(state, "month");
    state.federal.turn = after;
    // Aggregate report across jumped months
    state.lastMonthlyReport = buildMonthlyReport(state, snap, months);
  }
  return months;
}

export { snapshotMetrics };
