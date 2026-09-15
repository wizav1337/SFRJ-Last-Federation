/**
 * Department / agency desks — player actions that mutate posture and feed
 * simulation.js (monthlyDrift), control.js (federal_control), elections.js
 * (gravity weights), and endings.js via flags.
 *
 * Coupling map (keep in sync with comments in simulation.js / control.js):
 * - JNA posture garrison|alert|political → war_risk, jna_cohesion, obedience
 * - SIV posture austerity|stimulus|technocrat → inflation, trade, reform_momentum
 * - Predsjedništvo mediate|hardline → cohesion, secession drift, E3 path
 * - SSUP soft|hard → interethnic_tension HR/BA
 * - SSP ec_track → international_standing / ec_troika_watching
 * - Finance open|freeze → transfers, trust, budget
 * - TO coordinate|inventory|republic_hold → to_control SI/HR, inventory flags
 * - NBJ tight|loose|fragment → inflation, hard_currency, dinar program
 * - SKJ soft_federal|hard_unity|cede_siv|dissolved → skj_unity, SIV boost, monopoly never restored
 *
 * Action economy (Pass 3–4): shared monthly attention with reforms.
 * attentionCap = 3 (4 if SIV ≥ 60). Desk + reform both burn attention_left.
 * Pass 4: attention_spent_desks / attention_spent_reforms breakdown in UI;
 * soft-lock / conflict warnings when hardline desks clash with open confederal talks;
 * justice desk posture feeds legitimacy + presidency vote bias.
 * Pass 5: SKJ remnant caucus desk + republic-voice coupling.
 * Pass 6: Skupština (assembly) + FER desks; ME/Gligorov voices feed stack.
 * Pass 7: Fond za nerazvijene + deepen JNA/SIV/Presidency; Bulatović voice.
 * Pass 8: SSRN desk + deepen SSP/Finance; late Mesić/Jović; Marković SSRN revisit.
 * Pass 9: SSIP (Lončar) desk + deepen TO/NBY; Lončar dialogue; Marković SSIP revisit.
 * Soft-block if already in posture with flag.
 */
import { clamp, pathAdd } from "./state.js";
import { applyEffects, requiresMet } from "./events.js";
import { recomputeFederalControl } from "./control.js";
import { t } from "./i18n.js";

const POSTURE_FLAG_MAP = {
  jna: { garrison: "jna_garrison_posture", alert: "jna_mobilization_alert", political: "jna_political_weight" },
  siv: { austerity: "siv_austerity_stance", stimulus: "siv_stimulus_stance" },
  presidency: { mediate: "presidency_mediation_active", hardline: "presidency_hardline" },
  ssup: { soft: "ssup_soft_line", hard: "ssup_hard_line" },
  ssp: { ec_track: "ssp_ec_track", isolation: "ssp_isolation" },
  finance: { open: "finance_transfers_open", freeze: "finance_transfer_freeze", target: "finance_target" },
  to: { coordinate: "to_coordinate_posture", inventory: "to_inventory_push", republic_hold: "to_republic_hold" },
  nby: { tight: "nby_tight_dinar", loose: "nby_loose_credit", fragment: "nby_fragment_risk" },
  justice: { constitutional: "justice_constitutional_line", arbitrate: "justice_arbitrate_line", hard: "justice_hard_line" },
  skj: { soft_federal: "skj_soft_federation", hard_unity: "skj_hard_unity", cede_siv: "skj_cedes_to_siv", dissolved: "skj_dissolved" },
  assembly: { session_open: "assembly_open", stalled: "assembly_stalled", rubber_stamp: "assembly_rubber_stamp" },
  fer: { trade_open: "fer_trade_open", imf_line: "fer_imf_line", customs_hard: "fer_customs_hard" },
  fond: { open_south: "fond_open_south", freeze: "fond_freeze", target_mk_me: "fond_target_mk_me", politicized: "fond_politicized" },
  ssrn: { mass_front_open: "ssrn_mass_front", party_capture: "ssrn_party_capture", civic_forum: "ssrn_civic_forum", paralyzed: "ssrn_paralyzed" },
  ssip: { ec_dialogue: "ssip_ec_channel", nonaligned_hold: "ssip_nonaligned_hold", bilateral_quiet: "ssip_bilateral_quiet", paralyzed: "ssip_paralyzed" },
};

export function initDesks(state, catalog) {
  if (!catalog?.desks) return;
  if (!state.desks) state.desks = {};
  for (const def of catalog.desks) {
    const cur = state.desks[def.id] || {};
    state.desks[def.id] = {
      id: def.id,
      loyalty: cur.loyalty ?? def.stats.loyalty,
      capacity: cur.capacity ?? def.stats.capacity,
      agenda_tension: cur.agenda_tension ?? def.stats.agenda_tension,
      posture: cur.posture || def.posture_default || "default",
    };
  }
  if (state.desk_actions == null) state.desk_actions = 0;
  if (!state.desk_month) state.desk_month = "";
  if (!Array.isArray(state.dialogue_done)) state.dialogue_done = [];
  if (!state.dialogue_visits) state.dialogue_visits = {};
  if (state.attention_left == null) state.attention_left = 0;
  if (!state.attention_month) state.attention_month = "";
  // Save migration: Pass 3 schema (shared attention + multi-visit dialogue)
  if (state.save_schema == null || state.save_schema < 8) state.save_schema = 8;
  syncDeskFlagsFromPosture(state);
}

export function deskDef(catalog, id) {
  return catalog?.desks?.find((d) => d.id === id) || null;
}

export function deskRuntime(state, id) {
  return state.desks?.[id] || null;
}

/** Shared monthly attention — reforms and desks compete for the same scarce pool. */
export function attentionCap(state) {
  return (state.federal.siv_authority || 0) >= 60 ? 4 : 3;
}

export function deskCap(state) {
  // Display: remaining shared attention (same as reform left after Pass 3).
  if (state.attention_left != null) return Math.max(state.attention_left, 0);
  return attentionCap(state);
}

export function syncAttentionDisplays(state) {
  const left = Math.max(0, state.attention_left ?? 0);
  state.desk_actions = left;
  state.reform_actions = left;
}

export function grantAttentionActions(state) {
  const month = (state.federal.clock || "").slice(0, 7);
  if (state.attention_month === month && state.attention_left != null) {
    syncAttentionDisplays(state);
    return;
  }
  state.attention_month = month;
  state.desk_month = month;
  state.reform_month = month;
  state.attention_left = attentionCap(state);
  state.attention_spent_desks = 0;
  state.attention_spent_reforms = 0;
  syncAttentionDisplays(state);
}

/** @deprecated Pass 3 — prefer grantAttentionActions; kept as alias. */
export function grantDeskActions(state) {
  grantAttentionActions(state);
}

export function spendAttention(state, n = 1, bucket = "desk") {
  const cost = Math.max(1, n || 1);
  if ((state.attention_left ?? 0) < cost) return false;
  state.attention_left -= cost;
  if (bucket === "reform") {
    state.attention_spent_reforms = (state.attention_spent_reforms || 0) + cost;
  } else {
    state.attention_spent_desks = (state.attention_spent_desks || 0) + cost;
  }
  syncAttentionDisplays(state);
  return true;
}

/** UI helper: spent this month on desks vs reforms vs remaining. */
export function attentionBreakdown(state) {
  const cap = attentionCap(state);
  const left = Math.max(0, state.attention_left ?? 0);
  const desks = Math.max(0, state.attention_spent_desks || 0);
  const reforms = Math.max(0, state.attention_spent_reforms || 0);
  return { cap, left, desks, reforms, spent: desks + reforms };
}

/**
 * Soft-lock / conflict: hardline desk postures vs open confederal talks.
 * Returns warning objects for UI; does not hard-block (soft-lock = warn + cost friction).
 */
export function deskConflictWarnings(state) {
  if (!state?.flags?.confederal_talks_open) return [];
  const hard = [];
  if (state.flags.presidency_hardline || state.desks?.presidency?.posture === "hardline") hard.push("presidency");
  if (state.flags.jna_mobilization_alert || state.flags.jna_political_weight) hard.push("jna");
  if (state.flags.ssup_hard_line || state.desks?.ssup?.posture === "hard") hard.push("ssup");
  if (state.flags.justice_hard_line || state.desks?.justice?.posture === "hard") hard.push("justice");
  if (state.flags.to_inventory_push || state.desks?.to?.posture === "inventory") hard.push("to");
  if (state.flags.skj_hard_unity || state.desks?.skj?.posture === "hard_unity") hard.push("skj");
  if (!hard.length && !state.flags.desk_conflict_soft_lock && !state.flags.desk_conflict_hard_conf) return [];
  const out = [];
  if (hard.length || state.flags.desk_conflict_hard_conf) {
    out.push({
      id: "CONFLICT",
      severity: state.flags.desk_conflict_hard_conf ? "critical" : "warn",
      textKey: "conflict.hardConf",
      desks: hard,
    });
  } else if (state.flags.desk_conflict_soft_lock) {
    out.push({
      id: "CONFLICT",
      severity: "warn",
      textKey: "conflict.softLock",
      desks: hard,
    });
  }
  return out;
}

export function isHardlineConflictAction(deskId, action) {
  const posture = action?.effects?.desk_set?.[deskId]?.posture;
  if (!posture) return false;
  const hard = {
    jna: ["alert", "political"],
    presidency: ["hardline"],
    ssup: ["hard"],
    justice: ["hard"],
    to: ["inventory"],
    nby: ["fragment"],
    skj: ["hard_unity"],
  };
  return (hard[deskId] || []).includes(posture);
}

export function listDesks(catalog) {
  return catalog?.desks || [];
}

function applyDeskMutations(state, effects) {
  if (!effects || !state.desks) return;
  if (effects.desk_set) {
    for (const [id, patch] of Object.entries(effects.desk_set)) {
      if (!state.desks[id]) state.desks[id] = { id, loyalty: 50, capacity: 50, agenda_tension: 40, posture: "default" };
      Object.assign(state.desks[id], patch);
    }
  }
  if (effects.desk_add) {
    for (const [id, patch] of Object.entries(effects.desk_add)) {
      if (!state.desks[id]) state.desks[id] = { id, loyalty: 50, capacity: 50, agenda_tension: 40, posture: "default" };
      const d = state.desks[id];
      for (const [k, v] of Object.entries(patch)) {
        if (typeof d[k] === "number") d[k] = clamp(d[k] + Number(v));
        else d[k] = v;
      }
    }
  }
}

/** Prefer applyEffects (now understands desk_set / desk_add). Kept for dialogue.js. */
export function applyDeskEffects(state, effects) {
  applyDeskMutations(state, {
    desk_set: effects?.desk_set,
    desk_add: effects?.desk_add,
  });
  if (!effects) return [];
  const copy = { ...effects };
  delete copy.desk_set;
  delete copy.desk_add;
  return applyEffects(state, copy);
}

export function actionsForDesk(state, catalog, deskId) {
  const def = deskDef(catalog, deskId);
  if (!def) return [];
  const none = (state.attention_left != null ? state.attention_left : state.desk_actions || 0) <= 0;
  const budget = state.federal.federal_budget || 0;
  return (def.actions || []).map((raw) => {
    const cost = raw.cost || {};
    const reformCost = cost.reform || 0;
    const budgetCost = cost.budget || 0;
    let blocked = false;
    let block_reason = "";
    if (none && reformCost > 0) {
      blocked = true;
      block_reason = t("desk.none");
    }
    if (!blocked && budgetCost > 0 && budget < budgetCost) {
      blocked = true;
      block_reason = t("desk.noBudget", { n: budgetCost });
    }
    if (!blocked && raw.requires) {
      const gate = requiresMet(state, raw.requires);
      if (!gate.ok) {
        blocked = true;
        block_reason = gate.reason || t("desk.locked");
      }
    }
    const setPosture = raw.effects?.desk_set?.[deskId]?.posture;
    if (!blocked && setPosture && state.desks?.[deskId]?.posture === setPosture) {
      const flag = POSTURE_FLAG_MAP[deskId]?.[setPosture];
      if (!flag || state.flags[flag]) {
        blocked = true;
        block_reason = t("desk.samePosture");
      }
    }
    let conflict_warn = "";
    if (
      !blocked &&
      state.flags.confederal_talks_open &&
      isHardlineConflictAction(deskId, raw)
    ) {
      conflict_warn = t("conflict.actionWarn");
    }
    return {
      ...raw,
      deskId,
      blocked,
      block_reason,
      conflict_warn,
      reformCost,
      budgetCost,
      needs_votes: 0,
      legal: "political",
    };
  });
}

export function applyDeskAction(state, catalog, deskId, actionId) {
  const actions = actionsForDesk(state, catalog, deskId);
  const action = actions.find((a) => a.id === actionId);
  if (!action) return { ok: false, reason: t("desk.missing") };
  if (action.blocked) return { ok: false, reason: action.block_reason || t("desk.locked") };

  if (action.reformCost > 0) {
    const left = state.attention_left != null ? state.attention_left : state.desk_actions || 0;
    if (left < action.reformCost) {
      return { ok: false, reason: t("desk.none") };
    }
    if (state.attention_left != null) {
      // Soft-lock friction: hardline action while confederal talks open costs +1 attention if available
      let cost = action.reformCost;
      let conflictTax = false;
      if (
        state.flags.confederal_talks_open &&
        isHardlineConflictAction(deskId, action) &&
        (state.attention_left ?? 0) >= cost + 1
      ) {
        cost += 1;
        conflictTax = true;
      }
      if (!spendAttention(state, cost, "desk")) {
        return { ok: false, reason: t("desk.none") };
      }
      if (conflictTax) {
        state.flags.desk_conflict_soft_lock = true;
      }
    } else {
      state.desk_actions -= action.reformCost;
    }
  }
  if (action.budgetCost > 0) {
    pathAdd(state, "federal.federal_budget", -action.budgetCost);
  }

  applyDeskEffects(state, action.effects || {});
  syncDeskFlagsFromPosture(state);
  recomputeFederalControl(state);

  const line = t("desk.okLine", {
    desk: deskDef(catalog, deskId)?.name_hr || deskId,
    action: action.label,
  });
  state.log.push({
    date: state.federal.clock,
    kind: "desk",
    desk: deskId,
    action: actionId,
    label: line,
  });
  return { ok: true, line, action };
}

/**
 * Monthly posture — called from simulation.monthlyDrift.
 * Modest numbers; event cards and dialogue remain the big levers.
 */
export function applyDeskMonthlyPosture(state, scale = 1) {
  if (!state.desks) return;
  const f = state.federal;
  const s = scale;
  const jna = state.desks.jna;
  const siv = state.desks.siv;
  const pret = state.desks.presidency;
  const ssup = state.desks.ssup;
  const ssp = state.desks.ssp;
  const fin = state.desks.finance;
  const to = state.desks.to;
  const nby = state.desks.nby;

  if (jna) {
    if (jna.posture === "alert") {
      f.war_risk = clamp(f.war_risk + 1.2 * s);
      f.jna_cohesion = clamp(f.jna_cohesion + 0.6 * s);
      jna.agenda_tension = clamp(jna.agenda_tension + 1 * s);
    } else if (jna.posture === "garrison") {
      f.war_risk = clamp(f.war_risk - 0.4 * s);
      f.jna_obedience_to_civilian = clamp(f.jna_obedience_to_civilian + 0.4 * s);
    } else if (jna.posture === "political") {
      f.jna_obedience_to_civilian = clamp(f.jna_obedience_to_civilian - 0.8 * s);
      f.legitimacy = clamp(f.legitimacy - 0.3 * s);
      jna.agenda_tension = clamp(jna.agenda_tension + 1.5 * s);
    }
    if (jna.agenda_tension >= 60) {
      f.jna_obedience_to_civilian = clamp(f.jna_obedience_to_civilian - 0.5 * s);
    }
  }

  if (siv) {
    if (siv.posture === "austerity") {
      f.inflation = clamp(f.inflation - 0.8 * s);
      f.federal_budget = clamp(f.federal_budget + 0.4 * s);
      for (const id of ["SI", "HR", "BA", "RS"]) {
        const u = state.units[id];
        if (u) u.living_standard = clamp(u.living_standard - 0.4 * s);
      }
    } else if (siv.posture === "stimulus") {
      f.inter_republic_trade = clamp(f.inter_republic_trade + 0.8 * s);
      f.siv_authority = clamp(f.siv_authority + 0.3 * s);
      f.hard_currency = clamp(f.hard_currency - 0.3 * s);
    } else if (siv.posture === "technocrat") {
      f.reform_momentum = clamp(f.reform_momentum + 0.5 * s);
    }
    if (siv.loyalty < 35) {
      f.siv_authority = clamp(f.siv_authority - 0.6 * s);
    }
  }

  if (pret) {
    if (pret.posture === "mediate") {
      f.presidency_cohesion = clamp(f.presidency_cohesion + 0.5 * s);
      f.war_risk = clamp(f.war_risk - 0.3 * s);
    } else if (pret.posture === "hardline") {
      f.presidency_cohesion = clamp(f.presidency_cohesion - 0.5 * s);
      if (state.units.SI) state.units.SI.secession_readiness = clamp(state.units.SI.secession_readiness + 0.4 * s);
      if (state.units.HR) state.units.HR.secession_readiness = clamp(state.units.HR.secession_readiness + 0.4 * s);
    }
    if (pret.agenda_tension >= 70 && pret.loyalty < 40) {
      f.presidency_cohesion = clamp(f.presidency_cohesion - 0.8 * s);
    }
  }

  if (ssup) {
    if (ssup.posture === "hard") {
      if (state.units.HR) state.units.HR.interethnic_tension = clamp(state.units.HR.interethnic_tension + 0.8 * s);
      if (state.units.BA) state.units.BA.interethnic_tension = clamp(state.units.BA.interethnic_tension + 0.4 * s);
      f.war_risk = clamp(f.war_risk + 0.3 * s);
    } else if (ssup.posture === "soft") {
      if (state.units.HR) state.units.HR.interethnic_tension = clamp(state.units.HR.interethnic_tension - 0.3 * s);
    } else if (ssup.posture === "observe") {
      f.sdb_control = clamp(f.sdb_control + 0.3 * s);
      if (state.units.HR) state.units.HR.interethnic_tension = clamp(state.units.HR.interethnic_tension - 0.15 * s);
    }
    if (state.flags.sdb_civilian_leash) {
      f.presidency_cohesion = clamp(f.presidency_cohesion + 0.2 * s);
      f.sdb_control = clamp(f.sdb_control + 0.2 * s);
    }
    if (state.flags.sdb_leash_tight) {
      f.sdb_control = clamp(f.sdb_control + 0.4 * s);
      f.legitimacy = clamp(f.legitimacy + 0.15 * s);
      ssup.agenda_tension = clamp(ssup.agenda_tension + 0.4 * s);
    }
    if (state.flags.ssup_hard_line && state.flags.sdb_files_shared) {
      f.war_risk = clamp(f.war_risk + 0.2 * s);
    }
  }

  if (ssp) {
    if (ssp.posture === "ec_track") {
      f.international_standing = clamp(f.international_standing + 0.4 * s);
    } else if (ssp.posture === "isolation") {
      f.international_standing = clamp(f.international_standing - 0.45 * s);
      f.legitimacy = clamp(f.legitimacy - 0.1 * s);
      ssp.agenda_tension = clamp(ssp.agenda_tension + 0.3 * s);
    } else if (ssp.posture === "nonaligned") {
      f.international_standing = clamp(f.international_standing + 0.15 * s);
      if (state.flags.ssp_nam_bridge) f.legitimacy = clamp(f.legitimacy + 0.15 * s);
    }
  }

  if (fin) {
    if (fin.posture === "freeze") {
      f.federal_budget = clamp(f.federal_budget + 0.3 * s);
      if (state.units.SI) state.units.SI.federal_trust = clamp(state.units.SI.federal_trust - 0.4 * s);
      if (state.units.HR) state.units.HR.federal_trust = clamp(state.units.HR.federal_trust - 0.4 * s);
    } else if (fin.posture === "open") {
      f.inter_republic_trade = clamp(f.inter_republic_trade + 0.3 * s);
      if (state.flags.finance_soft_corridor) {
        f.siv_authority = clamp(f.siv_authority + 0.15 * s);
        f.reform_momentum = clamp(f.reform_momentum + 0.1 * s);
      }
    } else if (fin.posture === "target") {
      f.federal_budget = clamp(f.federal_budget + 0.35 * s);
      f.siv_authority = clamp(f.siv_authority + 0.1 * s);
      fin.agenda_tension = clamp(fin.agenda_tension + 0.35 * s);
      if (state.units.SI) state.units.SI.federal_trust = clamp(state.units.SI.federal_trust - 0.25 * s);
      if (state.units.HR) state.units.HR.federal_trust = clamp(state.units.HR.federal_trust - 0.25 * s);
    }
  }

  if (to) {
    if (to.posture === "inventory") {
      f.war_risk = clamp(f.war_risk + 0.4 * s);
      if (state.units.SI) {
        state.units.SI.to_control = clamp((state.units.SI.to_control || 50) - 0.5 * s);
        state.units.SI.federal_trust = clamp(state.units.SI.federal_trust - 0.3 * s);
      }
      if (state.units.HR) {
        state.units.HR.to_control = clamp((state.units.HR.to_control || 50) - 0.5 * s);
        state.units.HR.federal_trust = clamp(state.units.HR.federal_trust - 0.3 * s);
      }
      to.agenda_tension = clamp(to.agenda_tension + 0.8 * s);
    } else if (to.posture === "coordinate") {
      f.jna_obedience_to_civilian = clamp(f.jna_obedience_to_civilian + 0.3 * s);
      f.war_risk = clamp(f.war_risk - 0.2 * s);
    } else if (to.posture === "republic_hold") {
      if (state.units.SI) state.units.SI.to_control = clamp((state.units.SI.to_control || 50) + 0.6 * s);
      if (state.units.HR) state.units.HR.to_control = clamp((state.units.HR.to_control || 50) + 0.6 * s);
      f.jna_cohesion = clamp(f.jna_cohesion - 0.3 * s);
    }
  }

  if (nby) {
    if (nby.posture === "tight") {
      f.inflation = clamp(f.inflation - 0.6 * s);
      f.hard_currency = clamp(f.hard_currency + 0.4 * s);
      f.reform_momentum = clamp(f.reform_momentum + 0.3 * s);
    } else if (nby.posture === "loose") {
      f.inflation = clamp(f.inflation + 0.7 * s);
      f.inter_republic_trade = clamp(f.inter_republic_trade + 0.3 * s);
    } else if (nby.posture === "fragment") {
      f.inter_republic_trade = clamp(f.inter_republic_trade - 0.6 * s);
      f.legitimacy = clamp(f.legitimacy - 0.3 * s);
      nby.agenda_tension = clamp(nby.agenda_tension + 1 * s);
    }
    if (nby.loyalty < 35) {
      f.hard_currency = clamp(f.hard_currency - 0.4 * s);
    }
  }


  const skj = state.desks.skj;
  if (skj) {
    if (skj.posture === "soft_federal") {
      f.skj_unity = clamp(f.skj_unity + 0.4 * s);
      f.legitimacy = clamp(f.legitimacy + 0.15 * s);
      if (state.flags.confederal_talks_open) {
        f.presidency_cohesion = clamp(f.presidency_cohesion + 0.2 * s);
        f.war_risk = clamp(f.war_risk - 0.15 * s);
      }
    } else if (skj.posture === "hard_unity") {
      f.skj_unity = clamp(f.skj_unity + 0.2 * s);
      if (state.units.SI) state.units.SI.secession_readiness = clamp(state.units.SI.secession_readiness + 0.35 * s);
      if (state.units.HR) state.units.HR.secession_readiness = clamp(state.units.HR.secession_readiness + 0.3 * s);
      if (state.flags.confederal_talks_open) {
        f.war_risk = clamp(f.war_risk + 0.3 * s);
        f.presidency_cohesion = clamp(f.presidency_cohesion - 0.25 * s);
      }
      skj.agenda_tension = clamp(skj.agenda_tension + 0.6 * s);
    } else if (skj.posture === "cede_siv") {
      f.siv_authority = clamp(f.siv_authority + 0.45 * s);
      f.skj_unity = clamp(f.skj_unity - 0.35 * s);
      f.reform_momentum = clamp(f.reform_momentum + 0.25 * s);
    } else if (skj.posture === "dissolved") {
      f.skj_unity = clamp(f.skj_unity - 0.8 * s);
      f.reform_momentum = clamp(f.reform_momentum + 0.2 * s);
      f.skj_leading_role = false;
      // Never restore monopoly — reinforce renunciation flag
      state.flags.skj_renounced_monopoly = true;
      state.flags.skj_dissolved = true;
    }
    if (skj.loyalty < 30 && skj.posture !== "dissolved") {
      f.skj_unity = clamp(f.skj_unity - 0.4 * s);
    }
  }

  const assembly = state.desks.assembly;
  if (assembly) {
    if (assembly.posture === "session_open") {
      f.assembly_function = clamp(f.assembly_function + 0.45 * s);
      f.legitimacy = clamp(f.legitimacy + 0.2 * s);
      f.siv_authority = clamp(f.siv_authority + 0.15 * s);
      f.reform_momentum = clamp(f.reform_momentum + 0.15 * s);
    } else if (assembly.posture === "stalled") {
      f.assembly_function = clamp(f.assembly_function - 0.7 * s);
      f.legitimacy = clamp(f.legitimacy - 0.25 * s);
      f.siv_authority = clamp(f.siv_authority - 0.3 * s);
      f.reform_momentum = clamp(f.reform_momentum - 0.2 * s);
      assembly.agenda_tension = clamp(assembly.agenda_tension + 0.5 * s);
    } else if (assembly.posture === "rubber_stamp") {
      f.assembly_function = clamp(f.assembly_function - 0.2 * s);
      f.siv_authority = clamp(f.siv_authority + 0.35 * s);
      f.reform_momentum = clamp(f.reform_momentum + 0.25 * s);
      f.legitimacy = clamp(f.legitimacy - 0.1 * s);
    }
  }

  const fer = state.desks.fer;
  if (fer) {
    if (fer.posture === "trade_open") {
      f.inter_republic_trade = clamp(f.inter_republic_trade + 0.45 * s);
      f.hard_currency = clamp(f.hard_currency + 0.2 * s);
      f.international_standing = clamp(f.international_standing + 0.15 * s);
      if (state.flags.customs_war_active) {
        // open trade eases customs pressure quietly
        f.inter_republic_trade = clamp(f.inter_republic_trade + 0.2 * s);
      }
    } else if (fer.posture === "imf_line") {
      f.imf_pressure = clamp(f.imf_pressure - 0.35 * s);
      f.hard_currency = clamp(f.hard_currency + 0.35 * s);
      f.international_standing = clamp(f.international_standing + 0.25 * s);
      f.reform_momentum = clamp(f.reform_momentum + 0.2 * s);
      f.siv_authority = clamp(f.siv_authority + 0.15 * s);
    } else if (fer.posture === "customs_hard") {
      f.inter_republic_trade = clamp(f.inter_republic_trade - 0.55 * s);
      f.imf_pressure = clamp(f.imf_pressure + 0.25 * s);
      f.federal_budget = clamp(f.federal_budget + 0.2 * s);
      fer.agenda_tension = clamp(fer.agenda_tension + 0.5 * s);
      if (state.units.SI) state.units.SI.federal_trust = clamp(state.units.SI.federal_trust - 0.25 * s);
      if (state.units.HR) state.units.HR.federal_trust = clamp(state.units.HR.federal_trust - 0.25 * s);
    }
  }


  const fond = state.desks.fond;
  if (fond) {
    if (fond.posture === "open_south") {
      f.inter_republic_trade = clamp(f.inter_republic_trade + 0.25 * s);
      f.federal_budget = clamp(f.federal_budget - 0.25 * s);
      if (state.units.MK) {
        state.units.MK.living_standard = clamp(state.units.MK.living_standard + 0.35 * s);
        state.units.MK.federal_trust = clamp(state.units.MK.federal_trust + 0.2 * s);
      }
      if (state.units.ME) {
        state.units.ME.living_standard = clamp(state.units.ME.living_standard + 0.3 * s);
        state.units.ME.federal_trust = clamp(state.units.ME.federal_trust + 0.2 * s);
      }
      if (state.units.BA) state.units.BA.living_standard = clamp(state.units.BA.living_standard + 0.2 * s);
      if (state.units.XK) state.units.XK.living_standard = clamp(state.units.XK.living_standard + 0.2 * s);
    } else if (fond.posture === "freeze") {
      f.federal_budget = clamp(f.federal_budget + 0.35 * s);
      f.siv_authority = clamp(f.siv_authority + 0.1 * s);
      fond.agenda_tension = clamp(fond.agenda_tension + 0.45 * s);
      if (state.units.MK) state.units.MK.federal_trust = clamp(state.units.MK.federal_trust - 0.35 * s);
      if (state.units.ME) state.units.ME.federal_trust = clamp(state.units.ME.federal_trust - 0.3 * s);
      if (state.units.BA) state.units.BA.federal_trust = clamp(state.units.BA.federal_trust - 0.25 * s);
      if (state.units.XK) state.units.XK.federal_trust = clamp(state.units.XK.federal_trust - 0.25 * s);
    } else if (fond.posture === "target_mk_me") {
      if (state.units.MK) {
        state.units.MK.living_standard = clamp(state.units.MK.living_standard + 0.4 * s);
        state.units.MK.federal_trust = clamp(state.units.MK.federal_trust + 0.3 * s);
      }
      if (state.units.ME) {
        state.units.ME.living_standard = clamp(state.units.ME.living_standard + 0.4 * s);
        state.units.ME.federal_trust = clamp(state.units.ME.federal_trust + 0.3 * s);
      }
      if (state.units.BA) state.units.BA.federal_trust = clamp(state.units.BA.federal_trust - 0.2 * s);
      if (state.units.XK) state.units.XK.federal_trust = clamp(state.units.XK.federal_trust - 0.2 * s);
      f.federal_budget = clamp(f.federal_budget - 0.15 * s);
    } else if (fond.posture === "politicized") {
      f.legitimacy = clamp(f.legitimacy + 0.2 * s);
      f.presidency_cohesion = clamp(f.presidency_cohesion + 0.25 * s);
      fond.agenda_tension = clamp(fond.agenda_tension + 0.4 * s);
      if (state.units.SI) state.units.SI.federal_trust = clamp(state.units.SI.federal_trust - 0.15 * s);
      if (state.units.HR) state.units.HR.federal_trust = clamp(state.units.HR.federal_trust - 0.15 * s);
      if (state.units.MK) state.units.MK.federal_trust = clamp(state.units.MK.federal_trust + 0.15 * s);
      if (state.units.ME) state.units.ME.federal_trust = clamp(state.units.ME.federal_trust + 0.15 * s);
    }
  }

  const ssrn = state.desks.ssrn;
  if (ssrn) {
    if (ssrn.posture === "mass_front_open") {
      f.legitimacy = clamp(f.legitimacy + 0.2 * s);
      f.skj_unity = clamp(f.skj_unity + 0.1 * s);
    } else if (ssrn.posture === "civic_forum") {
      f.legitimacy = clamp(f.legitimacy + 0.35 * s);
      f.reform_momentum = clamp(f.reform_momentum + 0.2 * s);
      if (state.units.SI) state.units.SI.federal_trust = clamp(state.units.SI.federal_trust + 0.15 * s);
      if (state.units.HR) state.units.HR.federal_trust = clamp(state.units.HR.federal_trust + 0.15 * s);
    } else if (ssrn.posture === "party_capture") {
      f.legitimacy = clamp(f.legitimacy - 0.25 * s);
      f.skj_unity = clamp(f.skj_unity + 0.2 * s);
      ssrn.agenda_tension = clamp(ssrn.agenda_tension + 0.4 * s);
      if (state.units.SI) state.units.SI.federal_trust = clamp(state.units.SI.federal_trust - 0.15 * s);
      if (state.units.HR) state.units.HR.federal_trust = clamp(state.units.HR.federal_trust - 0.15 * s);
    } else if (ssrn.posture === "paralyzed") {
      f.legitimacy = clamp(f.legitimacy - 0.35 * s);
      f.assembly_function = clamp(f.assembly_function - 0.2 * s);
      ssrn.capacity = clamp(ssrn.capacity - 0.2 * s);
    }
    if (state.flags.ssrn_siv_bind) {
      f.siv_authority = clamp(f.siv_authority + 0.2 * s);
      f.reform_momentum = clamp(f.reform_momentum + 0.1 * s);
    }
  }


  const ssip = state.desks.ssip;
  if (ssip) {
    if (ssip.posture === "ec_dialogue") {
      f.international_standing = clamp(f.international_standing + 0.35 * s);
      f.legitimacy = clamp(f.legitimacy + 0.15 * s);
      f.reform_momentum = clamp(f.reform_momentum + 0.15 * s);
      if (state.units.SI) state.units.SI.federal_trust = clamp(state.units.SI.federal_trust + 0.1 * s);
      if (state.units.HR) state.units.HR.federal_trust = clamp(state.units.HR.federal_trust + 0.1 * s);
    } else if (ssip.posture === "nonaligned_hold") {
      f.international_standing = clamp(f.international_standing + 0.2 * s);
      f.legitimacy = clamp(f.legitimacy + 0.1 * s);
    } else if (ssip.posture === "bilateral_quiet") {
      f.international_standing = clamp(f.international_standing + 0.25 * s);
      f.inter_republic_trade = clamp(f.inter_republic_trade + 0.1 * s);
    } else if (ssip.posture === "paralyzed") {
      f.international_standing = clamp(f.international_standing - 0.35 * s);
      f.legitimacy = clamp(f.legitimacy - 0.2 * s);
      ssip.capacity = clamp(ssip.capacity - 0.2 * s);
    }
    if (state.flags.ssip_siv_bind) {
      f.siv_authority = clamp(f.siv_authority + 0.2 * s);
      f.reform_momentum = clamp(f.reform_momentum + 0.1 * s);
    }
    if (state.flags.ssip_fer_couple) {
      f.reform_momentum = clamp(f.reform_momentum + 0.1 * s);
      f.international_standing = clamp(f.international_standing + 0.1 * s);
    }
  }


  if (state.flags.to_shared_reserve) {
    f.jna_obedience_to_civilian = clamp(f.jna_obedience_to_civilian + 0.1 * s);
    f.war_risk = clamp(f.war_risk - 0.05 * s);
  }
  if (state.flags.to_nby_liaison) {
    f.hard_currency = clamp(f.hard_currency + 0.05 * s);
  }
  if (state.flags.nby_imf_align) {
    f.inflation = clamp(f.inflation - 0.15 * s);
    f.reform_momentum = clamp(f.reform_momentum + 0.1 * s);
  }
  if (state.flags.nby_diplomatic_fx) {
    f.international_standing = clamp(f.international_standing + 0.1 * s);
  }
  const justice = state.desks.justice;
  if (justice) {
    if (justice.posture === "constitutional") {
      f.legitimacy = clamp(f.legitimacy + 0.3 * s);
      f.assembly_function = clamp(f.assembly_function + 0.2 * s);
    } else if (justice.posture === "arbitrate") {
      f.presidency_cohesion = clamp(f.presidency_cohesion + 0.35 * s);
      f.war_risk = clamp(f.war_risk - 0.2 * s);
    } else if (justice.posture === "hard") {
      f.legitimacy = clamp(f.legitimacy - 0.25 * s);
      if (state.units.SI) state.units.SI.secession_readiness = clamp(state.units.SI.secession_readiness + 0.3 * s);
      if (state.units.HR) state.units.HR.secession_readiness = clamp(state.units.HR.secession_readiness + 0.3 * s);
      if (state.flags.confederal_talks_open) {
        f.war_risk = clamp(f.war_risk + 0.35 * s);
        f.presidency_cohesion = clamp(f.presidency_cohesion - 0.3 * s);
      }
    }
  }

  // Pass 4: soft-lock drift — hard desks + open confederal talks raise war_risk quietly
  if (state.flags.confederal_talks_open) {
    const hardCount =
      (state.flags.presidency_hardline ? 1 : 0) +
      (state.flags.jna_mobilization_alert || state.flags.jna_political_weight ? 1 : 0) +
      (state.flags.ssup_hard_line ? 1 : 0) +
      (state.flags.justice_hard_line ? 1 : 0);
    if (hardCount >= 2) {
      f.war_risk = clamp(f.war_risk + 0.35 * s * hardCount);
      f.presidency_cohesion = clamp(f.presidency_cohesion - 0.2 * s);
    }
  }

  // Pass 3: confederal stack — Kučan/Jović/Mesić/mediation quietly supports E3 path
  const confStack = confederalStackDepth(state);
  if (confStack >= 2 && state.flags.confederal_talks_open) {
    f.war_risk = clamp(f.war_risk - 0.25 * s * Math.min(confStack, 4));
    f.presidency_cohesion = clamp(f.presidency_cohesion + 0.2 * s);
  }
  if (confStack >= 3 && state.flags.presidency_quorum_guard && !state.flags.presidency_deadlock) {
    f.legitimacy = clamp(f.legitimacy + 0.15 * s);
  }

  syncDeskFlagsFromPosture(state);
}

/** Count outcome-relevant confederal stack flags (E3 path strength). */
export function confederalStackDepth(state) {
  const f = state.flags || {};
  let n = 0;
  if (f.confederal_talks_open) n += 1;
  if (f.dialogue_kucan_conf) n += 1;
  if (f.dialogue_jovic_conf) n += 1;
  if (f.dialogue_mesic_confederal) n += 1;
  if (f.presidency_mediation_active) n += 1;
  if (f.slovenia_invited_back) n += 1;
  if (f.presidency_quorum_guard) n += 1;
  if (f.dialogue_kucan_charter) n += 1;
  if (f.confederal_stack_memo) n += 1;
  if (f.justice_arbitrate_line || f.justice_rule_memo) n += 1;
  if (f.skj_soft_federation) n += 1;
  if (f.confederal_skj_memo) n += 1;
  if (f.dialogue_bogicevic_mediate || f.dialogue_tupurkovski_conf) n += 1;
  if (f.dialogue_gligorov_conf || f.dialogue_bucin_soft || f.dialogue_bucin_quorum) n += 1;
  if (f.dialogue_izetbegovic_mediate) n += 1;
  if (f.assembly_quorum_ok || f.assembly_open) n += 1;
  if (f.confederal_fond_memo || f.presidency_south_balance) n += 1;
  if (f.dialogue_bulatovic_soft || f.dialogue_bulatovic_fond) n += 1;
  if (f.confederal_ssrn_memo || f.ssrn_civic_forum) n += 1;
  if (f.confederal_ssip_memo || f.ssip_ec_channel) n += 1;
  if (f.dialogue_mesic_late_duty || f.dialogue_mesic_late_conf) n += 1;
  if (f.dialogue_jovic_late_quorum) n += 1;
  return n;
}

export function deskStatusLabel(posture) {
  return t("desk.posture." + (posture || "default"));
}

export function deskChipShort(posture) {
  const key = "desk.chip." + (posture || "default");
  const label = t(key);
  return label === key ? deskStatusLabel(posture) : label;
}

export function syncDeskFlagsFromPosture(state) {
  if (!state.desks) return;
  const j = state.desks.jna;
  if (j) {
    state.flags.jna_garrison_posture = j.posture === "garrison";
    state.flags.jna_mobilization_alert = j.posture === "alert";
    state.flags.jna_political_weight = j.posture === "political";
  }
  const s = state.desks.siv;
  if (s) {
    state.flags.siv_austerity_stance = s.posture === "austerity";
    state.flags.siv_stimulus_stance = s.posture === "stimulus";
  }
  const to = state.desks.to;
  if (to) {
    state.flags.to_coordinate_posture = to.posture === "coordinate";
    state.flags.to_inventory_push = to.posture === "inventory";
    state.flags.to_republic_hold = to.posture === "republic_hold";
  }
  const nby = state.desks.nby;
  if (nby) {
    state.flags.nby_tight_dinar = nby.posture === "tight";
    state.flags.nby_loose_credit = nby.posture === "loose";
    state.flags.nby_fragment_risk = nby.posture === "fragment";
  }
  const ssup = state.desks.ssup;
  if (ssup) {
    state.flags.ssup_soft_line = ssup.posture === "soft";
    state.flags.ssup_hard_line = ssup.posture === "hard";
    state.flags.ssup_observe_line = ssup.posture === "observe";
  }
  const justice = state.desks.justice;
  if (justice) {
    state.flags.justice_constitutional_line = justice.posture === "constitutional";
    state.flags.justice_arbitrate_line = justice.posture === "arbitrate";
    state.flags.justice_hard_line = justice.posture === "hard";
  }
  const skjD = state.desks.skj;
  if (skjD) {
    state.flags.skj_soft_federation = skjD.posture === "soft_federal";
    state.flags.skj_hard_unity = skjD.posture === "hard_unity";
    state.flags.skj_cedes_to_siv = skjD.posture === "cede_siv";
    state.flags.skj_dissolved = skjD.posture === "dissolved";
    if (skjD.posture === "dissolved") {
      state.flags.skj_renounced_monopoly = true;
      state.federal.skj_leading_role = false;
    }
  }
  const asm = state.desks.assembly;
  if (asm) {
    state.flags.assembly_open = asm.posture === "session_open";
    state.flags.assembly_stalled = asm.posture === "stalled";
    state.flags.assembly_rubber_stamp = asm.posture === "rubber_stamp";
    if (asm.posture === "session_open") state.flags.assembly_quorum_ok = true;
    if (asm.posture === "stalled") state.flags.assembly_paralysis_risk = true;
  }
  const ferD = state.desks.fer;
  if (ferD) {
    state.flags.fer_trade_open = ferD.posture === "trade_open";
    state.flags.fer_imf_line = ferD.posture === "imf_line";
    state.flags.fer_customs_hard = ferD.posture === "customs_hard";
  }
  const fondD = state.desks.fond;
  if (fondD) {
    state.flags.fond_open_south = fondD.posture === "open_south";
    state.flags.fond_freeze = fondD.posture === "freeze";
    state.flags.fond_target_mk_me = fondD.posture === "target_mk_me";
    state.flags.fond_politicized = fondD.posture === "politicized";
  }
  const sspD = state.desks.ssp;
  if (sspD) {
    state.flags.ssp_ec_track = sspD.posture === "ec_track";
    state.flags.ssp_isolation = sspD.posture === "isolation";
  }
  const finD = state.desks.finance;
  if (finD) {
    state.flags.finance_transfers_open = finD.posture === "open";
    state.flags.finance_transfer_freeze = finD.posture === "freeze";
    state.flags.finance_target = finD.posture === "target";
  }
  const ssrnD = state.desks.ssrn;
  if (ssrnD) {
    state.flags.ssrn_mass_front = ssrnD.posture === "mass_front_open";
    state.flags.ssrn_party_capture = ssrnD.posture === "party_capture";
    state.flags.ssrn_civic_forum = ssrnD.posture === "civic_forum";
    state.flags.ssrn_paralyzed = ssrnD.posture === "paralyzed";
  }
}

/** Compact strip chips for UI — id + short posture label + tone. */
export function deskStatusChips(state, catalog) {
  const desks = listDesks(catalog);
  return desks.map((d) => {
    const rt = deskRuntime(state, d.id);
    const posture = rt?.posture || d.posture_default || "default";
    let tone = "neutral";
    if (["alert", "hard", "hardline", "inventory", "fragment", "political", "freeze", "hard_unity", "stalled", "customs_hard", "rubber_stamp", "politicized", "party_capture", "paralyzed", "isolation"].includes(posture)) tone = "warn";
    if (["garrison", "mediate", "soft", "coordinate", "tight", "open", "technocrat", "observe", "constitutional", "arbitrate", "soft_federal", "cede_siv", "trade_open", "imf_line", "session_open", "open_south", "target_mk_me", "mass_front_open", "civic_forum", "nonaligned", "ec_track"].includes(posture)) tone = "good";
    return {
      id: d.id,
      name: d.name,
      posture,
      label: deskChipShort(posture),
      tone,
      loyalty: rt?.loyalty ?? d.stats?.loyalty ?? 50,
    };
  });
}
