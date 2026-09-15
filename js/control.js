import { UNIT_IDS, clamp } from "./state.js";

/** JNA presence is not control. These conditions force a unit outside. */
export function isOutsideControl(state, id) {
  const u = state.units[id];
  if (!u) return false;
  if ((u.secession_readiness || 0) >= 70) return true;
  if (u.government_type === "nationalist" && (u.federal_trust || 0) < 30) return true;
  if (id === "SI" && state.flags.slovenia_plebiscite_yes && state.flags.slovenia_federal_reply_failed) {
    return true;
  }
  if (
    id === "HR" &&
    state.flags.hdz_croatia &&
    state.flags.sovereignty_texts_filed &&
    (u.federal_trust || 0) < 35
  ) {
    return true;
  }
  if (u.jna_threatened) return true;
  if (id === "HR" && state.flags.pakrac_standoff && (u.interethnic_tension || 0) >= 70) return true;
  if (id === "HR" && state.flags.ssup_hard_line && (u.interethnic_tension || 0) >= 75) return true;
  return false;
}

function rawControl(state, id) {
  const u = state.units[id];
  const f = state.federal;
  let n =
    (u.federal_trust || 0) * 0.55 +
    (100 - (u.secession_readiness || 0)) * 0.35 +
    ((f.siv_authority || 50) - 50) * 0.08;
  if (u.government_type === "skj_monopoly" || u.government_type === "reform_skj") n += 6;
  if (u.government_type === "nationalist") n -= 8;
  if (u.government_type === "coalition") n -= 3;
  if (state.flags.competence_shifted) n -= 6;
  if (state.flags.markovic_mandate_strong) n += 3;
  if (state.flags.markovic_starved) n -= 2;
  if (state.flags.customs_war_active) n -= 4;
  if (state.flags.imf_standby_active && state.flags.markovic_dinar_program) n += 2;
  if (state.flags.ec_troika_watching) n += 1;
  // Desk / dialogue posture coupling (see js/desks.js header)
  if (state.flags.jna_garrison_posture) n += 2;
  if (state.flags.jna_mobilization_alert) n -= 2;
  if (state.flags.siv_stimulus_stance || state.flags.markovic_mandate_strong) n += 1;
  if (state.flags.siv_austerity_stance) n -= 1;
  if (state.flags.presidency_mediation_active) n += 2;
  if (state.flags.presidency_hardline) n -= 2;
  if (state.flags.finance_transfer_freeze) n -= 2;
  if (state.flags.finance_transfers_open) n += 1;
  if (state.flags.ssup_hard_line) n -= 2;
  if (state.flags.justice_constitutional_line || state.flags.justice_arbitrate_line) n += 1;
  if (state.flags.justice_hard_line) n -= 1;
  if (state.flags.ssup_soft_line) n += 1;
  if (state.flags.to_inventory_push) n -= 2;
  if (state.flags.to_coordinate_posture) n += 1;
  if (state.flags.to_republic_hold) n -= 1;
  if (state.flags.nby_tight_dinar) n += 1;
  if (state.flags.nby_fragment_risk) n -= 2;
  if (state.flags.dialogue_kucan_conf && id === "SI") n += 3;
  if (state.flags.dialogue_tudman_mediate && id === "HR") n += 2;
  if (state.flags.dialogue_tudman_hard && id === "HR") n -= 4;
  if ((state.desks?.presidency?.loyalty || 0) >= 60) n += 1;
  if ((state.desks?.siv?.loyalty || 0) < 35) n -= 1;
  if ((state.desks?.nby?.loyalty || 0) >= 60 && state.flags.nby_tight_dinar) n += 1;
  if ((state.desks?.to?.agenda_tension || 0) >= 65) n -= 1;
  if (state.flags.skj_soft_federation) n += 1;
  if (state.flags.skj_hard_unity) n -= 2;
  if (state.flags.skj_cedes_to_siv) n += 1;
  if (state.flags.skj_dissolved) n -= 0.5;
  if (state.flags.dialogue_bogicevic_mediate && id === "BA") n += 2;
  if (state.flags.dialogue_tupurkovski_conf && id === "MK") n += 2;
  if (state.flags.talked_racan && id === "HR") n += 2;
  if (state.flags.fond_open_south || state.flags.siv_fond_bind) {
    if (id === "MK" || id === "ME" || id === "BA" || id === "XK") n += 2;
  }
  if (state.flags.fond_freeze && (id === "MK" || id === "ME" || id === "BA" || id === "XK")) n -= 2;
  if (state.flags.fond_target_mk_me && (id === "MK" || id === "ME")) n += 2;
  if (state.flags.fond_politicized && (id === "SI" || id === "HR")) n -= 1;
  if (state.flags.jna_quiet_redistribute) n += 0.5;
  if (state.flags.presidency_south_balance && (id === "MK" || id === "ME" || id === "BA")) n += 1;
  if (state.flags.dialogue_bulatovic_soft && id === "ME") n += 2;
  if (state.flags.dialogue_bulatovic_bloc && id === "ME") n += 1;
  if (state.flags.ssrn_civic_forum || state.flags.ssrn_siv_bind) n += 1;
  if (state.flags.ssrn_paralyzed) n -= 1;
  if (state.flags.ssrn_party_capture && (id === "SI" || id === "HR")) n -= 1;
  if (state.flags.finance_soft_corridor) n += 0.5;
  if (state.flags.finance_target && (id === "SI" || id === "HR")) n -= 1;
  if (state.flags.ssp_nam_bridge) n += 0.5;
  if (state.flags.ssp_isolation) n -= 0.5;
  if (state.flags.dialogue_jovic_late_quorum) n += 0.5;
  if (state.flags.dialogue_mesic_late_duty && id === "HR") n += 1;
  if (state.flags.const_court_docket_open || state.flags.const_court_bind_justice) n += 1;
  if (state.flags.const_court_stalled || state.flags.const_court_yields) n -= 1;
  if (state.flags.justice_refer_court) n += 0.5;
  if (state.flags.ssup_docket_watch) n += 0.5;
  if (state.flags.provinces_vote_independently || state.flags.provinces_mediate) n += 1;
  if (state.flags.provinces_bloc_tight) n -= 0.5;
  if (state.flags.presidency_province_quorum) n += 0.5;
  if (state.flags.ssup_province_dossier) n += 0.5;
  return n;
}

export function recomputeFederalControl(state) {
  if (!state?.units) return;
  for (const id of UNIT_IDS) {
    const u = state.units[id];
    if (!u) continue;
    let n = rawControl(state, id);
    if (isOutsideControl(state, id)) n = Math.min(n, 22);
    u.federal_control = clamp(n);
  }
}

/** sluša ≥ 55, sporna 25–54, izvan < 25. */
export function controlBand(n) {
  const v = Number(n) || 0;
  if (v >= 55) return "listen";
  if (v >= 25) return "contested";
  return "outside";
}

export function controlFill(unit) {
  const n = (unit.federal_control ?? 0) / 100;
  const teal = [46, 110, 112];
  const gold = [196, 163, 90];
  const grey = [122, 117, 108];
  const rust = [162, 75, 46];
  const lerp = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
  const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  if (n >= 0.55) {
    const t = Math.min(1, (n - 0.55) / 0.45);
    return rgb(lerp(gold, teal, t));
  }
  if (n >= 0.25) {
    const t = (n - 0.25) / 0.3;
    return rgb(lerp(grey, gold, t));
  }
  const t = n / 0.25;
  return rgb(lerp(rust, grey, t));
}

export function markJnaThreat(state, unitId) {
  const u = state.units[unitId];
  if (u) u.jna_threatened = true;
  state.flags.player_used_jna_threat = true;
}

export function obeysBelgrade(unit) {
  return controlBand(unit?.federal_control) === "listen";
}
