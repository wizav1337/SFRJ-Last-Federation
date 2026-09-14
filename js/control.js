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
  if (state.flags.ssup_soft_line) n += 1;
  if ((state.desks?.presidency?.loyalty || 0) >= 60) n += 1;
  if ((state.desks?.siv?.loyalty || 0) < 35) n -= 1;
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
