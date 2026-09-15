import { UNIT_IDS, clamp, presidencyTally, pathAdd } from "./state.js";
import { t, legalLabelHr } from "./i18n.js";
import { recomputeFederalControl, markJnaThreat } from "./control.js";

export const WORKSHOP_IDS = [
  "presidency",
  "siv",
  "skj",
  "ssno",
  "ssup",
  "nby",
  "jna",
  "to",
];

export const PRESIDENCY_MEMBERS = {
  SI: { name: "Janez Drnovšek", chair_until: "1990-05-15" },
  HR: { name: "Stipe Šuvar", name_hdz: "Stipe Mesić" },
  BA: { name: "Bogić Bogićević" },
  RS: { name: "Borisav Jović", chair_from: "1990-05-15" },
  ME: { name: "Nenad Bućin" },
  MK: { name: "Vasil Tupurkovski" },
  VO: { name: "Jugoslav Kostić" },
  XK: { name: "Sejdo Bajramović" },
};

export function seatHolder(state, id) {
  const mem = PRESIDENCY_MEMBERS[id];
  if (!mem) return id;
  if (id === "HR" && (state.flags.hdz_croatia || (state.federal.clock || "") >= "1991-01-01")) {
    return mem.name_hdz || "Stipe Mesić";
  }
  return mem.name;
}

export function workshopAgencies(state) {
  return WORKSHOP_IDS.map((id) => state.agencies.find((a) => a.id === id)).filter(Boolean);
}

export function setAgencyStatus(state, id, status) {
  const ag = state.agencies.find((a) => a.id === id);
  if (ag) ag.status = status;
}

export function syncAgenciesFromFlags(state) {
  if (state.flags.skj_split || state.flags.slovenia_walkout) {
    setAgencyStatus(state, "skj", "weakened");
  }
  if (state.flags.skj_renounced_monopoly) {
    setAgencyStatus(state, "skj", "weakened");
  }
  if (state.flags.presidency_deadlock) {
    setAgencyStatus(state, "presidency", "weakened");
  }
  if (state.flags.to_disarmed_slovenia || state.flags.to_disarmed_croatia) {
    setAgencyStatus(state, "to", "weakened");
  }
  if (state.flags.jna_sides_with_serbia) {
    setAgencyStatus(state, "jna", "captured_by_republic");
  }
  if (state.flags.assembly_stalled || state.flags.assembly_paralysis_risk) {
    setAgencyStatus(state, "assembly", "weakened");
  }
  if (state.flags.fer_customs_hard && state.flags.customs_war_active) {
    setAgencyStatus(state, "fer", "weakened");
  }
  if (state.flags.fond_freeze || state.flags.fond_politicized) {
    setAgencyStatus(state, "federal_fund", "weakened");
  }
  if (state.flags.ssrn_paralyzed || state.flags.ssrn_party_capture) {
    setAgencyStatus(state, "ssrn", "weakened");
  }
  if (state.flags.ssrn_civic_forum || state.flags.ssrn_siv_bind) {
    setAgencyStatus(state, "ssrn", "active");
  }
  if (state.flags.ssp_isolation) {
    setAgencyStatus(state, "ssp", "weakened");
  }
}

export function legalLabel(legal) {
  return String(legal || "political").replace(/_/g, " ");
}

export function needsPresidencyVote(legal) {
  return legal === "presidency_decree" || legal === "emergency";
}

/**
 * Pass 4: presidency vote interactions with desk posture.
 * Soft bias for UI + cohesion effects — does not rewrite historical seat roster.
 */
export function deskVoteModifiers(state) {
  const notes = [];
  let softFor = 0;
  let softAgainst = 0;
  let emergencyPenalty = 0;
  const d = state.desks || {};
  const f = state.flags || {};

  if (f.presidency_mediation_active || d.presidency?.posture === "mediate") {
    softFor += 1;
    notes.push("vote.mod.mediate");
  }
  if (f.presidency_quorum_guard) {
    softFor += 1;
    notes.push("vote.mod.quorum");
  }
  if (f.justice_constitutional_line || d.justice?.posture === "constitutional") {
    softFor += 1;
    notes.push("vote.mod.justiceConst");
  }
  if (f.justice_arbitrate_line || d.justice?.posture === "arbitrate") {
    softFor += 1;
    notes.push("vote.mod.justiceArb");
  }
  if (f.presidency_hardline || d.presidency?.posture === "hardline") {
    softAgainst += 1;
    emergencyPenalty += 1;
    notes.push("vote.mod.hardline");
  }
  if (f.jna_mobilization_alert || f.jna_political_weight || d.jna?.posture === "alert" || d.jna?.posture === "political") {
    softAgainst += 1;
    emergencyPenalty += 1;
    notes.push("vote.mod.jna");
  }
  if (f.ssup_hard_line || d.ssup?.posture === "hard") {
    softAgainst += 1;
    notes.push("vote.mod.ssup");
  }
  if (f.justice_hard_line || d.justice?.posture === "hard") {
    softAgainst += 1;
    notes.push("vote.mod.justiceHard");
  }
  if (f.confederal_talks_open && softAgainst >= 2) {
    notes.push("vote.mod.conflict");
  }
  if (f.ssrn_civic_forum || f.ssrn_siv_bind) {
    softFor += 1;
    notes.push("vote.mod.ssrnForum");
  }
  if (f.ssrn_paralyzed || f.ssrn_party_capture) {
    softAgainst += 1;
    notes.push("vote.mod.ssrnWeak");
  }
  if (f.dialogue_jovic_late_quorum || f.dialogue_mesic_late_duty) {
    softFor += 1;
    notes.push("vote.mod.lateChair");
  }

  return {
    softFor,
    softAgainst,
    net: softFor - softAgainst,
    emergencyPenalty,
    notes,
  };
}


function dir(partial) {
  return {
    needs_votes: needsPresidencyVote(partial.legal) ? 5 : 0,
    noncompliance_chance: 0.25,
    effects: {},
    blocked: false,
    ...partial,
  };
}

/** Playable directives for one organ. Schema GAME_SPEC §5.5. */
export function directivesFor(agency, state) {
  const id = agency.id;
  const st = agency.status;
  const list = [];
  const dissolved = st === "dissolved";
  const proposed = st === "proposed";

  if (dissolved || proposed) {
    list.push(dir({
      action: "form",
      target: id,
      legal: agency.kind === "constitutional" ? "assembly_statute" : agency.dissolve_legal === "party" ? "party" : "assembly_statute",
      label: proposed ? t("workshop.form.proposed") : t("workshop.form.dissolved"),
      legitimacy_cost: 3,
      noncompliance_chance: 0.12,
      effects: {
        agencies: { [id]: { status: "active" } },
        "federal.siv_authority": 2,
        "federal.legitimacy": -3,
      },
    }));
    return list;
  }

  list.push(dir({
    action: "defund",
    target: id,
    legal: agency.desk === "SIV" ? "assembly_statute" : agency.desk === "PRET" ? "presidency_decree" : "party",
    label: t("workshop.defund.label"),
    legitimacy_cost: 4,
    noncompliance_chance: 0.22,
    effects: {
      agencies: { [id]: { status: st === "active" ? "weakened" : st } },
      "federal.federal_budget": 3,
      "federal.siv_authority": -3,
      "federal.legitimacy": -4,
    },
  }));

  const reassignLegal =
    id === "jna" || id === "to" || id === "presidency"
      ? "presidency_decree"
      : agency.desk === "SKJ"
        ? "party"
        : "assembly_statute";
  list.push(dir({
    action: "reassign",
    target: id,
    legal: reassignLegal,
    label:
      id === "to"
        ? t("workshop.reassign.to")
        : id === "jna"
          ? t("workshop.reassign.jna")
          : id === "skj"
            ? t("workshop.reassign.skj")
            : t("workshop.reassign.default"),
    legitimacy_cost: 5,
    noncompliance_chance: id === "to" || id === "jna" ? 0.42 : 0.28,
    effects: {
      "federal.legitimacy": -5,
      "federal.siv_authority": id === "siv" || agency.kind === "secretariat" ? 3 : 0,
      "federal.jna_obedience_to_civilian": id === "jna" ? 4 : 0,
      ...(id === "to"
        ? { "federal.war_risk": 5, flags_add: ["to_inventory_ordered"] }
        : {}),
      ...(id === "jna" ? { flags_add: ["player_used_jna_threat"] } : {}),
    },
  }));

  if (id === "presidency") {
    list.push(dir({
      action: "dissolve",
      target: id,
      legal: "extra_constitutional",
      label: t("workshop.dissolve.presidency"),
      legitimacy_cost: 25,
      blocked: true,
      block_reason: t("workshop.dissolve.block"),
      noncompliance_chance: 0.8,
      effects: {},
    }));
    return list;
  }

  const dissolveLegal = agency.dissolve_legal || "assembly_statute";
  list.push(dir({
    action: "dissolve",
    target: id,
    legal: dissolveLegal,
    label:
      dissolveLegal === "extra_constitutional"
        ? t("workshop.dissolve.extra")
        : dissolveLegal === "emergency"
          ? t("workshop.dissolve.emergency")
          : dissolveLegal === "party"
            ? t("workshop.dissolve.party")
            : t("workshop.dissolve.statute"),
    legitimacy_cost: dissolveLegal === "extra_constitutional" ? 18 : dissolveLegal === "emergency" ? 12 : 8,
    noncompliance_chance: id === "to" || id === "jna" ? 0.5 : 0.32,
    effects: {
      agencies: { [id]: { status: "dissolved" } },
      "federal.legitimacy": dissolveLegal === "extra_constitutional" ? -18 : -8,
      "federal.assembly_function": id === "assembly" ? -20 : -2,
      "federal.skj_unity": id === "skj" ? -15 : 0,
      "federal.war_risk": id === "jna" || id === "to" ? 10 : 0,
      ...(id === "jna" ? { flags_add: ["player_used_jna_threat"] } : {}),
      ...(id === "skj" ? { flags_add: ["skj_split"] } : {}),
      ...(dissolveLegal === "emergency" ? { flags_add: ["player_used_emergency"] } : {}),
    },
  }));

  return list;
}

function applyLocalEffects(state, effects) {
  if (!effects) return;
  for (const [key, value] of Object.entries(effects)) {
    if (key === "flags_add") {
      for (const f of value) state.flags[f] = true;
      continue;
    }
    if (key === "flags_remove") {
      for (const f of value) state.flags[f] = false;
      continue;
    }
    if (key === "agencies") {
      for (const [id, patch] of Object.entries(value)) {
        const ag = state.agencies.find((a) => a.id === id);
        if (ag) Object.assign(ag, patch);
      }
      continue;
    }
    pathAdd(state, key, value);
  }
  syncAgenciesFromFlags(state);
}

export function applyDirective(state, directive, opts = {}) {
  const unitId = opts.unitId || state.selectedUnit || "SI";
  const effects = { ...(directive.effects || {}) };
  if (opts.usedEmergency || directive.legal === "emergency") {
    const extra = Array.isArray(effects.flags_add) ? effects.flags_add.slice() : [];
    if (!extra.includes("player_used_emergency")) extra.push("player_used_emergency");
    effects.flags_add = extra;
    if (opts.usedEmergency && directive.legal !== "emergency") {
      effects["federal.legitimacy"] = (effects["federal.legitimacy"] || 0) - 10;
      effects["federal.presidency_cohesion"] = (effects["federal.presidency_cohesion"] || 0) - 6;
    }
  }

  applyLocalEffects(state, effects);

  let noncompliance = false;
  let line = t("dir.okLine", {
    action: t("workshop." + directive.action),
    target: directive.target,
    legal: legalLabelHr(directive.legal),
  });
  const targetUnit = state.units[unitId];
  const autoNc = targetUnit && (targetUnit.federal_control ?? 100) < 25;
  if (autoNc || Math.random() < (directive.noncompliance_chance || 0)) {
    noncompliance = true;
    const u = targetUnit;
    if (u) {
      u.secession_readiness = clamp(u.secession_readiness + 6);
      u.federal_trust = clamp(u.federal_trust - 5);
      line = t("dir.ncLine", { name: u.name });
    }
  }
  if (directive.action === "reassign" && directive.target === "jna") {
    markJnaThreat(state, unitId);
  }
  recomputeFederalControl(state);

  state.log.push({
    date: state.federal.clock,
    kind: "directive",
    action: directive.action,
    target: directive.target,
    legal: directive.legal,
    unit: unitId,
    noncompliance,
    label: line,
  });

  return { noncompliance, line, unitId };
}

export function chairName(state) {
  const clock = state.federal.clock || "";
  if (state.flags.mesic_seated) return "Stjepan Mesić";
  if (state.flags.croatian_chair_seated) return t("chair.croat");
  if (state.flags.presidency_deadlock && clock >= "1991-05-15") {
    return t("chair.blocked");
  }
  if (state.flags.presidency_rotation_jovic || clock >= "1990-05-15") {
    return "Borisav Jović";
  }
  return "Janez Drnovšek";
}

export function voteWouldPass(state, legal, usedEmergency) {
  if (usedEmergency) return true;
  if (legal === "emergency") return true;
  return presidencyTally(state) >= 5;
}

export { UNIT_IDS };
