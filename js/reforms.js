import { clamp } from "./state.js";
import { t } from "./i18n.js";
import { applyEffects, requiresMet, spawnNoncomplianceFollowup } from "./events.js";
import { needsPresidencyVote } from "./agencies.js";
import { recomputeFederalControl } from "./control.js";
import { attentionCap, grantAttentionActions, spendAttention, syncAttentionDisplays } from "./desks.js";

export const REFORM_FAMILIES = ["skj", "siv", "pret", "force"];

export function reformCap(state) {
  // Pass 3: shared attention with desks (display uses attention_left).
  if (state.attention_left != null) return Math.max(state.attention_left, 0);
  return attentionCap(state);
}

export function grantReformActions(state) {
  grantAttentionActions(state);
}

export function expireReformActions(state) {
  state.reform_actions = 0;
  state.desk_actions = 0;
  state.attention_left = 0;
}

function dir(partial) {
  return {
    needs_votes: needsPresidencyVote(partial.legal) ? 5 : 0,
    noncompliance_chance: 0.22,
    legitimacy_cost: 0,
    effects: {},
    blocked: false,
    block_reason: "",
    family: "siv",
    ...partial,
  };
}

function govIsLeague(u) {
  return u && (u.government_type === "skj_monopoly" || u.government_type === "reform_skj");
}

function partyNameForGov(state, unitId) {
  const u = state.units[unitId];
  if (!u) return unitId;
  if (unitId === "HR" && state.flags.hdz_croatia) return "HDZ";
  if (unitId === "SI" && state.flags.demos_slovenia) return "DEMOS";
  if (unitId === "RS" && state.flags.sps_serbia) return "SPS";
  return t("gov." + (u.government_type || "skj_monopoly"));
}

/** Playable reforms for the current desk family. Target = selected unit. */
export function reformsFor(state, family) {
  const unitId = state.selectedUnit || "SI";
  const u = state.units[unitId];
  const none = (state.attention_left != null ? state.attention_left : state.reform_actions || 0) <= 0;
  const noneReason = t("attention.none") !== "attention.none" ? t("attention.none") : t("reform.none");
  const list = [];

  const gateNone = (r) => {
    if (none) {
      r.blocked = true;
      r.block_reason = noneReason;
    }
    return r;
  };

  if (family === "skj") {
    list.push(gateNone(dir({
      id: "skj_confederate",
      family: "skj",
      action: "reform",
      target: "skj",
      legal: "party",
      label: t("reform.skj.confederate"),
      legitimacy_cost: 2,
      noncompliance_chance: 0.12,
      blocked: !!state.flags.skj_confederated,
      block_reason: t("reform.skj.confederate.done"),
      planned: { SI: "push_confederal_party_then_elections", HR: "multi_party_law_and_sovereignty_language" },
      effects: {
        flags_add: ["skj_confederated", "skj_split"],
        "federal.skj_unity": -18,
        "federal.legitimacy": 3,
        "SI.federal_trust": 8,
        "HR.federal_trust": 4,
        "RS.elite_cohesion": -8,
      },
    })));
    list.push(gateNone(dir({
      id: "skj_renounce",
      family: "skj",
      action: "reform",
      target: "skj",
      legal: "party",
      label: t("reform.skj.renounce"),
      legitimacy_cost: 2,
      noncompliance_chance: 0.08,
      blocked: !!state.flags.skj_renounced_monopoly,
      block_reason: t("reform.skj.renounce.done"),
      effects: {
        flags_add: ["skj_renounced_monopoly"],
        "federal.skj_leading_role": 0,
        "federal.legitimacy": 5,
        "federal.reform_momentum": 6,
        "SI.federal_trust": 5,
        "HR.opposition_org": 4,
      },
    })));
    list.push(gateNone(dir({
      id: "skj_successor",
      family: "skj",
      action: "reform",
      target: "skj",
      legal: "party",
      label: t("reform.skj.successor"),
      legitimacy_cost: 3,
      noncompliance_chance: 0.18,
      blocked: !!state.flags.skj_federal_successor,
      block_reason: t("reform.skj.successor.done"),
      effects: {
        flags_add: ["skj_federal_successor"],
        "federal.skj_unity": -6,
        "federal.reform_momentum": 4,
        parties: { skj: { support: -4 }, arsj: { support: 3 } },
      },
    })));
    const purgeOk = govIsLeague(u);
    list.push(gateNone(dir({
      id: "skj_purge_cc",
      family: "skj",
      action: "reform",
      target: unitId,
      legal: "extra_constitutional",
      label: t("reform.skj.purge", { name: u?.name || unitId }),
      legitimacy_cost: 10,
      noncompliance_chance: 0.48,
      ncUnit: unitId,
      blocked: !purgeOk,
      block_reason: t("reform.skj.purge.blocked", {
        name: u?.name || unitId,
        party: partyNameForGov(state, unitId),
      }),
      planned: { [unitId]: "watch_belgrade_defy_federation" },
      effects: {
        flags_add: ["player_used_purge"],
        "federal.legitimacy": -12,
        "federal.skj_unity": -10,
        [`${unitId}.elite_cohesion`]: -12,
        [`${unitId}.secession_readiness`]: 8,
        [`${unitId}.federal_trust`]: -10,
      },
    })));
    list.push(gateNone(dir({
      id: "skj_fund_srsj",
      family: "skj",
      action: "reform",
      target: "arsj",
      legal: "siv",
      label: t("reform.skj.srsj"),
      legitimacy_cost: 4,
      noncompliance_chance: 0.15,
      blocked: !!state.flags.markovic_starved,
      block_reason: t("reform.skj.srsj.starved"),
      effects: {
        flags_add: ["markovic_list_founded", "arsj_campaign_live"],
        "federal.federal_budget": -5,
        "federal.reform_momentum": 5,
        parties: { arsj: { support: 10 } },
      },
    })));
  }

  if (family === "siv") {
    list.push(gateNone(dir({
      id: "siv_replace_secretary",
      family: "siv",
      action: "reform",
      target: "siv",
      legal: "assembly_statute",
      label: t("reform.siv.replace"),
      legitimacy_cost: 3,
      noncompliance_chance: 0.16,
      effects: {
        "federal.siv_authority": 4,
        "federal.legitimacy": -2,
        "federal.assembly_function": -2,
      },
    })));
    list.push(gateNone(dir({
      id: "siv_defund_secretariat",
      family: "siv",
      action: "reform",
      target: "finance",
      legal: "assembly_statute",
      label: t("reform.siv.defund"),
      legitimacy_cost: 4,
      noncompliance_chance: 0.2,
      effects: {
        agencies: { finance: { status: "weakened" } },
        "federal.federal_budget": 4,
        "federal.siv_authority": -5,
        "federal.legitimacy": -3,
      },
    })));
    list.push(gateNone(dir({
      id: "siv_mandate_markovic",
      family: "siv",
      action: "reform",
      target: "siv",
      legal: "assembly_statute",
      label: t("reform.siv.mandate"),
      legitimacy_cost: 3,
      noncompliance_chance: 0.22,
      blocked: !!state.flags.markovic_mandate_strong,
      block_reason: t("reform.siv.mandate.done"),
      effects: {
        flags_add: ["markovic_mandate_strong", "markovic_dinar_program"],
        flags_remove: ["markovic_starved"],
        "federal.siv_authority": 8,
        "federal.reform_momentum": 8,
        "federal.hard_currency": 3,
        "SI.federal_trust": 3,
        "MK.federal_trust": 3,
      },
    })));
    list.push(gateNone(dir({
      id: "siv_starve_markovic",
      family: "siv",
      action: "reform",
      target: "siv",
      legal: "political",
      label: t("reform.siv.starve"),
      legitimacy_cost: 1,
      noncompliance_chance: 0.1,
      blocked: !!state.flags.markovic_starved,
      block_reason: t("reform.siv.starve.done"),
      effects: {
        flags_add: ["markovic_starved"],
        flags_remove: ["markovic_mandate_strong"],
        "federal.siv_authority": -8,
        "federal.reform_momentum": -8,
        "RS.skj_hold": 3,
      },
    })));
    list.push(gateNone(dir({
      id: "siv_shift_competence",
      family: "siv",
      action: "reform",
      target: "siv",
      legal: "political",
      label: t("reform.siv.shift"),
      legitimacy_cost: 4,
      noncompliance_chance: 0.14,
      planned: { SI: "govern_beside_siv", HR: "govern_beside_siv" },
      effects: {
        flags_add: ["competence_shifted"],
        "federal.siv_authority": -8,
        "SI.federal_trust": 6,
        "HR.federal_trust": 5,
        "MK.federal_trust": 3,
        "RS.elite_cohesion": -4,
      },
    })));
  }

    list.push(gateNone(dir({
      id: "siv_trade_corridor",
      family: "siv",
      action: "reform",
      target: "finance",
      legal: "siv",
      label: t("reform.siv.corridor"),
      legitimacy_cost: 3,
      noncompliance_chance: 0.2,
      blocked: false,
      block_reason: "",
      effects: {
        flags_add: ["customs_war_resolved"],
        flags_remove: ["customs_war_active"],
        "federal.inter_republic_trade": 8,
        "federal.siv_authority": 3,
        "federal.hard_currency": 2,
        "SI.federal_trust": 2,
        "HR.federal_trust": 2,
        "MK.federal_trust": 2,
      },
    })));
    list.push(gateNone(dir({
      id: "siv_imf_review",
      family: "siv",
      action: "reform",
      target: "siv",
      legal: "siv",
      label: t("reform.siv.imf"),
      legitimacy_cost: 2,
      noncompliance_chance: 0.12,
      blocked: !state.flags.imf_standby_active,
      block_reason: t("reform.siv.imf.blocked"),
      effects: {
        "federal.imf_pressure": -4,
        "federal.hard_currency": 3,
        "federal.reform_momentum": 3,
        "federal.international_standing": 3,
        "federal.federal_budget": -2,
      },
    })));

  if (family === "pret") {
    list.push(gateNone(dir({
      id: "pret_confederal_talks",
      family: "pret",
      action: "reform",
      target: "presidency",
      legal: "political",
      label: t("reform.pret.talks"),
      legitimacy_cost: 2,
      noncompliance_chance: 0.12,
      blocked: !!state.flags.confederal_talks_open,
      block_reason: t("reform.pret.talks.done"),
      planned: { SI: "confederal_exit_clause", HR: "confederal_residual_sovereignty" },
      effects: {
        flags_add: ["confederal_talks_open"],
        charter_signatures_min: 1,
        "federal.presidency_cohesion": 3,
        "SI.federal_trust": 4,
        "HR.federal_trust": 3,
        "RS.elite_cohesion": -5,
      },
    })));
    list.push(gateNone(dir({
      id: "pret_emergency",
      family: "pret",
      action: "reform",
      target: "presidency",
      legal: "emergency",
      label: t("reform.pret.emergency"),
      legitimacy_cost: 10,
      noncompliance_chance: 0.28,
      effects: {
        flags_add: ["player_used_emergency"],
        "federal.legitimacy": -10,
        "federal.presidency_cohesion": -6,
        "federal.siv_authority": 3,
        "federal.war_risk": 5,
      },
    })));
    list.push(gateNone(dir({
      id: "pret_provinces",
      family: "pret",
      action: "reform",
      target: "presidency",
      legal: "presidency_decree",
      label: t("reform.pret.provinces"),
      legitimacy_cost: 6,
      noncompliance_chance: 0.4,
      ncUnit: "RS",
      blocked: !!state.flags.provinces_vote_independently,
      block_reason: t("reform.pret.provinces.done"),
      planned: { VO: "wait_on_belgrade_ballot", XK: "parallel_institutions_seek_federal_ear" },
      effects: {
        flags_add: ["provinces_vote_independently"],
        "federal.presidency_cohesion": -4,
        "RS.elite_cohesion": -10,
        "RS.nationalist_heat": 8,
        "VO.federal_trust": 6,
        "XK.federal_trust": 6,
      },
    })));
    const assemblyWeak = (state.federal.assembly_function || 0) < 32;
    list.push(gateNone(dir({
      id: "pret_election_law",
      family: "pret",
      action: "reform",
      target: "assembly",
      legal: "assembly_statute",
      label: t("reform.pret.election"),
      legitimacy_cost: 5,
      noncompliance_chance: 0.36,
      blocked: !!state.flags.federal_election_law || assemblyWeak,
      block_reason: state.flags.federal_election_law
        ? t("reform.pret.election.done")
        : t("reform.pret.election.blocked"),
      effects: {
        flags_add: ["federal_election_law"],
        "federal.assembly_function": 4,
        "federal.legitimacy": 3,
        "federal.reform_momentum": 4,
        "SI.federal_trust": 2,
        "HR.federal_trust": 2,
      },
    })));
  }

    list.push(gateNone(dir({
      id: "pret_broadcast",
      family: "pret",
      action: "reform",
      target: "presidency",
      legal: "political",
      label: t("reform.pret.broadcast"),
      legitimacy_cost: 2,
      noncompliance_chance: 0.15,
      effects: {
        "federal.legitimacy": 3,
        "federal.presidency_cohesion": 2,
        "SI.yugoslav_identity": 2,
        "HR.yugoslav_identity": 2,
        "BA.yugoslav_identity": 2,
        "MK.yugoslav_identity": 2,
        "RS.nationalist_heat": -2,
      },
    })));

  if (family === "force") {
    list.push(gateNone(dir({
      id: "force_inventory_unit",
      family: "force",
      action: "reform",
      target: unitId,
      legal: "presidency_decree",
      label: t("reform.force.inventory", { name: u?.name || unitId }),
      legitimacy_cost: 5,
      noncompliance_chance: 0.45,
      ncUnit: unitId,
      planned: { [unitId]: "refuse_or_file_the_disarm_order" },
      effects: {
        [`${unitId}.to_control`]: -10,
        [`${unitId}.federal_trust`]: -6,
        "federal.jna_cohesion": 3,
        "federal.war_risk": 3,
      },
    })));
    list.push(gateNone(dir({
      id: "force_disarm_unit",
      family: "force",
      action: "reform",
      target: unitId,
      legal: "presidency_decree",
      label: t("reform.force.disarm", { name: u?.name || unitId }),
      legitimacy_cost: 6,
      noncompliance_chance: 0.5,
      ncUnit: unitId,
      planned: { [unitId]: "refuse_or_file_the_disarm_order" },
      effects: {
        [`${unitId}.to_control`]: -8,
        [`${unitId}.federal_trust`]: -7,
        [`${unitId}.secession_readiness`]: 4,
        "federal.war_risk": 4,
      },
    })));
    list.push(gateNone(dir({
      id: "force_jna_weight",
      family: "force",
      action: "reform",
      target: unitId,
      legal: "presidency_decree",
      label: t("reform.force.jna", { name: u?.name || unitId }),
      legitimacy_cost: 4,
      noncompliance_chance: 0.3,
      ncUnit: unitId,
      effects: {
        [`${unitId}.jna_presence`]: 8,
        [`${unitId}.federal_trust`]: -3,
        "federal.jna_cohesion": 2,
      },
    })));
  }

  return list;
}

export function applyReform(state, reform, opts = {}) {
  if (reform.blocked) return { ok: false, reason: reform.block_reason };
  const attnLeft = state.attention_left != null ? state.attention_left : state.reform_actions || 0;
  if (attnLeft <= 0) return { ok: false, reason: t("reform.none") };

  const gate = requiresMet(state, reform.requires);
  if (!gate.ok) return { ok: false, reason: gate.reason };

  const effects = { ...(reform.effects || {}) };
  if (opts.usedEmergency || reform.legal === "emergency") {
    const extra = Array.isArray(effects.flags_add) ? effects.flags_add.slice() : [];
    if (!extra.includes("player_used_emergency")) extra.push("player_used_emergency");
    effects.flags_add = extra;
    if (opts.usedEmergency && reform.legal !== "emergency") {
      effects["federal.legitimacy"] = (effects["federal.legitimacy"] || 0) - 10;
      effects["federal.presidency_cohesion"] = (effects["federal.presidency_cohesion"] || 0) - 6;
    }
  }

  if (state.attention_left != null) {
    if (!spendAttention(state, 1, "reform")) return { ok: false, reason: t("reform.none") };
  } else {
    state.reform_actions = Math.max(0, (state.reform_actions || 0) - 1);
  }
  applyEffects(state, effects);

  if (reform.planned) {
    for (const [id, move] of Object.entries(reform.planned)) {
      if (state.units[id]) state.units[id].planned_move = move;
    }
  }

  const unitId = reform.ncUnit || state.selectedUnit || "SI";
  const u = state.units[unitId];
  const autoNc = u && (u.federal_control ?? 100) < 25;
  let noncompliance = false;
  let line = t("reform.okLine", { label: reform.label });
  if (autoNc || Math.random() < (reform.noncompliance_chance || 0)) {
    noncompliance = true;
    if (u) {
      u.secession_readiness = clamp(u.secession_readiness + 6);
      u.federal_trust = clamp(u.federal_trust - 5);
      line = t("dir.ncLine", { name: u.name });
      if ((state.federal.clock || "") >= "1990-07-01") {
        spawnNoncomplianceFollowup(state, { unitId, source: reform.label });
      }
    }
  }

  state.log.push({
    date: state.federal.clock,
    kind: "reform",
    action: reform.id,
    target: reform.target,
    legal: reform.legal,
    unit: unitId,
    noncompliance,
    label: line,
  });

  recomputeFederalControl(state);
  return { ok: true, noncompliance, line, unitId };
}

export function monthKey(iso) {
  return (iso || "").slice(0, 7);
}
