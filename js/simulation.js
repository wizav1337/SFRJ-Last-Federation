import { UNIT_IDS, clamp, monthIndex } from "./state.js";
import { recomputeFederalControl } from "./control.js";

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
  state.federal.war_risk = clamp(w);
}

export function monthlyDrift(state, scale = 1) {
  const f = state.federal;
  const inflAdd = ((100 - f.federal_budget) * 0.04 + (100 - f.hard_currency) * 0.03) * scale;
  f.inflation = clamp(f.inflation + inflAdd);

  for (const id of UNIT_IDS) {
    const u = unit(state, id);
    u.living_standard = clamp(u.living_standard - f.inflation * 0.02 * scale);
    u.nationalist_heat = clamp(
      u.nationalist_heat +
        (100 - u.yugoslav_identity) * 0.03 * scale +
        (100 - u.living_standard) * 0.02 * scale
    );
  }

  if (state.flags.skj_split) {
    for (const id of ["SI", "HR"]) {
      const u = unit(state, id);
      u.secession_readiness = clamp(u.secession_readiness + u.nationalist_heat * 0.04 * scale);
    }
  }

  const ba = unit(state, "BA");
  ba.secession_readiness = clamp(ba.secession_readiness + ba.interethnic_tension * 0.03 * scale);

  const secessionAvg = UNIT_IDS.reduce((a, id) => a + unit(state, id).secession_readiness, 0) / UNIT_IDS.length;
  f.jna_cohesion = clamp(
    f.jna_cohesion - secessionAvg * 0.02 * scale - (state.flags.player_used_jna_threat ? 2 * scale : 0)
  );

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
    unit(state, "XK").minority_fear = clamp(unit(state, "XK").minority_fear + 4 * s);
  }
  if (state.flags.markovic_dinar_program) {
    for (const id of UNIT_IDS) {
      unit(state, id).living_standard = clamp(unit(state, id).living_standard + 1 * s);
    }
    unit(state, "SI").federal_trust = clamp(unit(state, "SI").federal_trust + 1 * s);
    unit(state, "HR").federal_trust = clamp(unit(state, "HR").federal_trust + 1 * s);
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
  monthlyDrift(state, scale);
  contagion(state, scale);
  recomputeFederalControl(state);
}

export function maybeAdvanceMonth(state, previousClock) {
  const before = monthIndex(previousClock);
  const after = monthIndex(state.federal.clock);
  let months = 0;
  if (after > before) {
    months = after - before;
    for (let i = 0; i < months; i++) tick(state, "month");
    state.federal.turn = after;
  }
  return months;
}
