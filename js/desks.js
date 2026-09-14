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
 *
 * Action economy (Pass 3): shared monthly attention with reforms.
 * attentionCap = 3 (4 if SIV ≥ 60). Desk + reform both burn attention_left.
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
  ssp: { ec_track: "ssp_ec_track" },
  finance: { open: "finance_transfers_open", freeze: "finance_transfer_freeze" },
  to: { coordinate: "to_coordinate_posture", inventory: "to_inventory_push", republic_hold: "to_republic_hold" },
  nby: { tight: "nby_tight_dinar", loose: "nby_loose_credit", fragment: "nby_fragment_risk" },
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
  if (state.save_schema == null || state.save_schema < 3) state.save_schema = 3;
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
  syncAttentionDisplays(state);
}

/** @deprecated Pass 3 — prefer grantAttentionActions; kept as alias. */
export function grantDeskActions(state) {
  grantAttentionActions(state);
}

export function spendAttention(state, n = 1) {
  const cost = Math.max(1, n || 1);
  if ((state.attention_left ?? 0) < cost) return false;
  state.attention_left -= cost;
  syncAttentionDisplays(state);
  return true;
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
    return {
      ...raw,
      deskId,
      blocked,
      block_reason,
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
      if (!spendAttention(state, action.reformCost)) {
        return { ok: false, reason: t("desk.none") };
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

  if (ssp?.posture === "ec_track") {
    f.international_standing = clamp(f.international_standing + 0.4 * s);
  }

  if (fin) {
    if (fin.posture === "freeze") {
      f.federal_budget = clamp(f.federal_budget + 0.3 * s);
      if (state.units.SI) state.units.SI.federal_trust = clamp(state.units.SI.federal_trust - 0.4 * s);
      if (state.units.HR) state.units.HR.federal_trust = clamp(state.units.HR.federal_trust - 0.4 * s);
    } else if (fin.posture === "open") {
      f.inter_republic_trade = clamp(f.inter_republic_trade + 0.3 * s);
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
}

/** Compact strip chips for UI — id + short posture label + tone. */
export function deskStatusChips(state, catalog) {
  const desks = listDesks(catalog);
  return desks.map((d) => {
    const rt = deskRuntime(state, d.id);
    const posture = rt?.posture || d.posture_default || "default";
    let tone = "neutral";
    if (["alert", "hard", "hardline", "inventory", "fragment", "political", "freeze"].includes(posture)) tone = "warn";
    if (["garrison", "mediate", "soft", "coordinate", "tight", "open", "technocrat", "observe"].includes(posture)) tone = "good";
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
