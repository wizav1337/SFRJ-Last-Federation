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
  if (state.flags.confederal_talks_open && state.federal.war_risk < 60) w -= 2;
  if (state.flags.markovic_mandate_strong) w -= 1;
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
  if (state.desks?.siv?.posture === "austerity") drivers.push("SIV u štednji");
  if (state.desks?.siv?.posture === "stimulus") drivers.push("SIV u poticaju");
  if (state.desks?.presidency?.posture === "mediate") drivers.push("Predsjedništvo medira");
  if (state.desks?.presidency?.posture === "hardline") drivers.push("Predsjedništvo na tvrdoj liniji");
  if (state.flags.ssup_hard_line) drivers.push("SSUP na tvrdoj liniji");
  if (state.flags.ssp_ec_track) drivers.push("SSP na kolosijeku EEZ");

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

  // Department posture (desks.js) — JNA/SIV/Predsjedništvo/SSUP/SSP/Finance
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
