import { clamp } from "./state.js";
import { t } from "./i18n.js";

/** Weighted roll from GAME_SPEC §6.3. Player does not cast the popular vote. */
export function skjSuccessorChance(unit, mediaControl) {
  const media = mediaControl ?? 100 - (unit.media_pluralism || 0);
  return clamp(
    unit.skj_hold * 0.5 +
      unit.living_standard * 0.2 +
      media * 0.2 -
      unit.nationalist_heat * 0.3
  );
}

function mediaControl(unit) {
  return 100 - (unit.media_pluralism || 0);
}

function setCabinet(state, unitId, winnerIds) {
  for (const p of state.parties) {
    if (p.unit === unitId) p.in_government = winnerIds.includes(p.id);
  }
}

function bump(state, id, n) {
  const p = state.parties.find((x) => x.id === id);
  if (p) p.support = clamp(p.support + n);
}

function gravityP(unit, spec, state) {
  let p = skjSuccessorChance(unit, mediaControl(unit));
  if (spec.gravity === "opposition") p = clamp(p - 8);
  if (spec.gravity === "successor") p = clamp(p + 12);
  if (spec.gravity === "split") p = clamp(p + 4);
  if (unit.id === "RS" && state.flags.serbia_new_constitution) p = clamp(p + 8);
  if (unit.id === "ME" && state.flags.serbia_new_constitution) p = clamp(p + 4);
  if (state.flags.markovic_dinar_program && (unit.id === "MK" || unit.id === "BA")) {
    p = clamp(p - 3);
  }
  const ctrl = unit.federal_control ?? 40;
  p = clamp(p + (ctrl - 50) * 0.12);
  if (state.flags.markovic_mandate_strong) {
    p = clamp(p + 4);
    if (spec.gravity === "opposition") p = clamp(p + 6);
  }
  if (state.flags.federal_observers_si && unit.id === "SI") p = clamp(p + 5);
  return p;
}

function reportShell(unit, spec, races, extra = {}) {
  return {
    unit: spec.unit || unit.id,
    name: extra.name || unit.name,
    media: mediaControl(unit),
    skj_hold: unit.skj_hold,
    living_standard: unit.living_standard,
    nationalist_heat: unit.nationalist_heat,
    government_type: extra.government_type || unit.government_type,
    blurb: extra.blurb,
    races,
  };
}

function runMacedonia(state, spec) {
  const unit = state.units.MK;
  const p = gravityP(unit, spec, state);
  const roll = Math.random() * 100;
  const skmAhead = roll < p;
  if (skmAhead) {
    setCabinet(state, "MK", ["skm"]);
    bump(state, "skm", 6);
    bump(state, "vmro", 4);
    unit.government_type = "coalition";
    unit.planned_move = "bargain_equal_republic_status";
  } else {
    setCabinet(state, "MK", ["vmro"]);
    bump(state, "vmro", 10);
    bump(state, "skm", -6);
    unit.government_type = "nationalist";
    unit.planned_move = "national_party_in_skopje";
  }
  unit.election_held = true;
  const races = [
    {
      id: "mk_assembly",
      title: "SR Makedonija — skupština",
      p: Math.round(p),
      roll: Math.round(roll),
      winner: skmAhead ? t("election.mk.win.skm") : t("election.mk.win.vmro"),
      note: skmAhead
        ? t("election.mk.skm")
        : t("election.mk.vmro"),
    },
  ];
  return reportShell(unit, spec, races);
}

function runBosnia(state, spec) {
  const unit = state.units.BA;
  const p = gravityP(unit, spec, state);
  const roll = Math.random() * 100;
  let skShare = clamp(p * 0.42 - 4);
  if (roll < p * 0.35) skShare = clamp(skShare + 8);
  let rest = 100 - skShare;
  let sda = Math.round(rest * 0.38);
  let sds = Math.round(rest * 0.34);
  if (state.flags.hdz_croatia) {
    sda -= 2;
    sds -= 1;
  }
  if (state.flags.krajina_log_revolution) sds += 5;
  sda = clamp(sda);
  sds = clamp(sds);
  let hdz = clamp(rest - sda - sds);
  const sumNat = sda + sds + hdz;
  if (sumNat + skShare !== 100) skShare = clamp(100 - sda - sds - hdz);

  const threeAhead = sda > skShare && sds > skShare && hdz >= skShare - 2;
  if (threeAhead) {
    setCabinet(state, "BA", ["sda", "sds_ba", "hdz_ba"]);
    bump(state, "sda", 10);
    bump(state, "sds_ba", 8);
    bump(state, "hdz_ba", 6);
    bump(state, "skbih", -10);
    unit.government_type = "coalition";
    state.flags.sda_sds_hdz_bosnia = true;
    unit.planned_move = "three_nation_coalition";
  } else {
    setCabinet(state, "BA", ["skbih"]);
    bump(state, "skbih", 8);
    unit.government_type = "reform_skj";
    unit.planned_move = "sk_holds_a_three_nation_republic";
  }
  unit.election_held = true;
  const races = [
    { id: "sda", title: "SDA", p: sda, roll: Math.round(roll), winner: `${sda} / 100`, note: t("election.ba.sda") },
    { id: "sds", title: "SDS BiH", p: sds, roll: Math.round(roll), winner: `${sds} / 100`, note: t("election.ba.sds") },
    { id: "hdzba", title: "HDZ BiH", p: hdz, roll: Math.round(roll), winner: `${hdz} / 100`, note: t("election.ba.hdz") },
    { id: "skbih", title: "SK BiH–SDP", p: skShare, roll: Math.round(roll), winner: `${skShare} / 100`, note: threeAhead ? t("election.ba.skOut") : t("election.ba.skIn") },
  ];
  return reportShell(unit, spec, races, {
    blurb: t("election.ba.blurb"),
  });
}

function runSuccessor(state, spec, unitId, partyId, labels) {
  const unit = state.units[unitId];
  const p = gravityP(unit, spec, state);
  const roll = Math.random() * 100;
  const hold = roll < p;
  if (hold) {
    setCabinet(state, unitId, [partyId]);
    bump(state, partyId, 8);
    unit.government_type = unitId === "RS" ? "nationalist" : "reform_skj";
  } else if (unitId === "RS") {
    setCabinet(state, "RS", ["spo"]);
    bump(state, "spo", 10);
    bump(state, "sps", -8);
    unit.government_type = "nationalist";
  } else {
    setCabinet(state, "ME", []);
    unit.government_type = "coalition";
  }
  if (unitId === "RS" && hold) state.flags.sps_serbia = true;
  unit.election_held = true;
  unit.planned_move = hold ? labels.holdMove : labels.lossMove;
  return {
    id: unitId,
    title: labels.title,
    p: Math.round(p),
    roll: Math.round(roll),
    winner: hold ? labels.hold : labels.loss,
    note: hold ? labels.holdNote : labels.lossNote,
  };
}

function runSerbiaMontenegro(state, spec) {
  const rs = runSuccessor(state, spec, "RS", "sps", {
    title: "SR Srbija — skupština",
    hold: "SPS / put SKS",
    loss: "Oporba predvođena SPO-om",
    holdMove: "sps_holds_serbia",
    lossMove: "opposition_serbia_unfinished",
    holdNote: t("election.rs.hold"),
    lossNote: t("election.rs.loss"),
  });
  const me = runSuccessor(state, spec, "ME", "skcg", {
    title: "SR Crna Gora — skupština",
    hold: "SK CG",
    loss: "Oporbene liste",
    holdMove: "sk_holds_titograd",
    lossMove: "titograd_splits_from_belgrade",
    holdNote: t("election.me.hold"),
    lossNote: t("election.me.loss"),
  });
  const unit = state.units.RS;
  return reportShell(unit, spec, [rs, me], {
    name: "SR Srbija i SR Crna Gora",
    government_type: state.units.RS.government_type,
    blurb: t("election.rsme.blurb"),
  });
}

function runPlebiscite(state, spec) {
  const unit = state.units.SI;
  const unusualNo =
    unit.federal_trust >= 55 && unit.secession_readiness <= 35;
  let p = unusualNo
    ? 32
    : clamp(58 + unit.secession_readiness * 0.35 - unit.federal_trust * 0.22);
  if (state.flags.demos_slovenia) p = clamp(p + 6);
  if (state.flags.player_used_jna_threat) p = clamp(p + 8);
  const roll = Math.random() * 100;
  const yes = roll < p;
  if (yes) {
    state.flags.slovenia_plebiscite_yes = true;
    unit.secession_readiness = clamp(unit.secession_readiness + 8);
    state.units.HR.secession_readiness = clamp(state.units.HR.secession_readiness + 7);
    unit.planned_move = "independence_mandate_from_plebiscite";
    state.units.HR.planned_move = "watch_ljubljana_then_follow";
  } else {
    unit.planned_move = "plebiscite_failed_stay_and_bargain";
  }
  const races = [
    {
      id: "plebiscite",
      title: "Plebiscit o neovisnosti · 23. prosinca 1990.",
      p: Math.round(p),
      roll: Math.round(roll),
      winner: yes ? "DA" : "NE",
      note: yes ? t("election.pleb.yes") : t("election.pleb.no"),
    },
  ];
  return reportShell(unit, spec, races, {
    blurb: t("election.pleb.blurb"),
  });
}

function runLegacy(state, spec) {
  const unit = state.units[spec.unit];
  const media = mediaControl(unit);
  const races = [];
  const assemblyP = gravityP(unit, spec, state);
  const assemblyRoll = Math.random() * 100;
  const skjAssembly = assemblyRoll < assemblyP;

  if (spec.unit === "SI") {
    if (skjAssembly) {
      setCabinet(state, "SI", ["zks_sdp"]);
      bump(state, "zks_sdp", 8);
      bump(state, "demos", -6);
      unit.government_type = "reform_skj";
    } else {
      setCabinet(state, "SI", ["demos"]);
      bump(state, "demos", 10);
      bump(state, "zks_sdp", -8);
      unit.government_type = "coalition";
      state.flags.demos_slovenia = true;
    }
    state.flags.slovenia_election_held = true;
    races.push({
      id: "assembly",
      title: "Skupština",
      p: Math.round(assemblyP),
      roll: Math.round(assemblyRoll),
      winner: skjAssembly ? "ZKS–SDP" : "DEMOS",
      note: skjAssembly ? t("election.si.skj") : t("election.si.demos"),
    });
    let presP = clamp(skjSuccessorChance(unit, media) + 36);
    const presRoll = Math.random() * 100;
    const kucan = presRoll < presP;
    races.push({
      id: "presidency",
      title: "Predsjedništvo republike",
      p: Math.round(presP),
      roll: Math.round(presRoll),
      winner: kucan ? "Milan Kučan (ZKS–SDP)" : t("election.si.challenger"),
      note: kucan ? t("election.si.kucan") : t("election.si.kucanLoss"),
    });
  } else if (spec.unit === "HR") {
    if (skjAssembly) {
      setCabinet(state, "HR", ["skh_sdp"]);
      bump(state, "skh_sdp", 8);
      bump(state, "hdz", -6);
      unit.government_type = "reform_skj";
    } else {
      setCabinet(state, "HR", ["hdz"]);
      bump(state, "hdz", 12);
      bump(state, "skh_sdp", -8);
      unit.government_type = "nationalist";
      state.flags.hdz_croatia = true;
    }
    state.flags.croatia_election_held = true;
    races.push({
      id: "assembly",
      title: t("election.hr.sabor"),
      p: Math.round(assemblyP),
      roll: Math.round(assemblyRoll),
      winner: skjAssembly ? "SKH–SDP" : "HDZ",
      note: skjAssembly ? t("election.hr.skh") : t("election.hr.hdz"),
    });
  }

  unit.election_held = true;
  const report = reportShell(unit, spec, races);
  state.lastElection = report;
  return report;
}

/**
 * spec.kind: undefined | "three_nation" | "plebiscite" | "combined"
 * spec.unit or spec.units. Player cannot vote.
 */
export function runElection(state, spec) {
  let report;
  if (spec.kind === "plebiscite") report = runPlebiscite(state, spec);
  else if (spec.kind === "three_nation") report = runBosnia(state, spec);
  else if (spec.kind === "combined" || (spec.units && spec.units.length > 1)) {
    report = runSerbiaMontenegro(state, spec);
  } else if (spec.unit === "MK") report = runMacedonia(state, spec);
  else report = runLegacy(state, spec);
  state.lastElection = report;
  return report;
}
