import { pathAdd, pathGet, UNIT_IDS } from "./state.js";
import { syncAgenciesFromFlags } from "./agencies.js";
import { t } from "./i18n.js";
import { recomputeFederalControl, markJnaThreat } from "./control.js";

export function flattenActs(actFiles) {
  const events = [];
  for (const file of actFiles) {
    if (!file || !Array.isArray(file.events)) continue;
    for (const ev of file.events) events.push({ ...ev });
  }
  events.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    const po = { mandatory: 0, regional: 1, crisis: 2 };
    return (po[a.priority] ?? 9) - (po[b.priority] ?? 9);
  });
  return events;
}

export const FOLLOWUP_ID = "federal_act_ignored";

export function seedQueue(state, catalogEvents) {
  state.queue = catalogEvents.filter((e) => !e.spawn_only).map((e) => e.id);
  state.resolved = [];
  state.spawned = [];
}

export function ensureQueue(state, catalogEvents) {
  const order = catalogEvents.filter((e) => !e.spawn_only).map((e) => e.id);
  for (const e of catalogEvents) {
    if (e.spawn_only) continue;
    if (!state.resolved.includes(e.id) && !state.queue.includes(e.id)) {
      state.queue.push(e.id);
    }
  }
  state.queue.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export function requiresMet(state, requires) {
  if (!requires) return { ok: true };
  for (const [path, need] of Object.entries(requires)) {
    if (path === "flags" && Array.isArray(need)) {
      const missing = need.filter((f) => !state.flags[f]);
      if (missing.length) return { ok: false, reason: t("req.flags", { flags: missing.join(", ") }) };
      continue;
    }
    if (path === "flags_not" && Array.isArray(need)) {
      const present = need.filter((f) => state.flags[f]);
      if (present.length) return { ok: false, reason: t("req.flagsNot", { flags: present.join(", ") }) };
      continue;
    }
    const cur = pathGet(state, path);
    if (typeof need === "boolean") {
      if (!!cur !== need) return { ok: false, reason: t("req.path", { path }) };
    } else if (typeof cur === "number") {
      if (cur < Number(need)) return { ok: false, reason: t("req.gte", { path, n: need }) };
    } else if (cur !== need) {
      return { ok: false, reason: t("req.path", { path }) };
    }
  }
  return { ok: true };
}

export function currentEvent(state, catalogEvents) {
  while (state.queue.length) {
    const id = state.queue[0];
    const ev = catalogEvents.find((e) => e.id === id);
    if (!ev) {
      state.queue.shift();
      continue;
    }
    if (ev.spawn_only) {
      return decorateFollowup(state, ev);
    }
    if (!requiresMet(state, ev.requires).ok) {
      state.queue.shift();
      if (!state.resolved.includes(ev.id)) state.resolved.push(ev.id);
      continue;
    }
    return decorateEvent(state, ev);
  }
  return null;
}

function decorateFollowup(state, ev) {
  const nc = state.noncompliance;
  const unit = nc && state.units[nc.unit];
  if (!unit) return { ...ev, date: state.federal.clock };
  return {
    ...ev,
    date: state.federal.clock || ev.date,
    location: unit.name,
    briefing: t("followup.briefing", {
      name: unit.name,
      source: nc.source ? ` (${nc.source})` : "",
    }),
  };
}

export function spawnNoncomplianceFollowup(state, { unitId, source }) {
  const u = state.units[unitId];
  if (!u) return false;
  state.noncompliance = {
    unit: unitId,
    source: source || t("followup.act"),
    date: state.federal.clock,
  };
  state.queue = state.queue.filter((id) => id !== FOLLOWUP_ID);
  state.resolved = state.resolved.filter((id) => id !== FOLLOWUP_ID);
  state.queue.unshift(FOLLOWUP_ID);
  return true;
}

function applyAgencyBlock(state, block) {
  if (!block) return;
  for (const [id, patch] of Object.entries(block)) {
    const ag = state.agencies.find((a) => a.id === id);
    if (!ag) continue;
    Object.assign(ag, patch);
  }
}

function applyPartyBlock(state, block) {
  if (!block) return;
  for (const [id, patch] of Object.entries(block)) {
    const p = state.parties.find((x) => x.id === id);
    if (!p) continue;
    for (const [k, v] of Object.entries(patch)) {
      if (k === "support" && typeof v === "number") p.support = Math.max(0, Math.min(100, Math.round(p.support + v)));
      else p[k] = v;
    }
  }
}

function applyPresidencyBlock(state, block) {
  if (!block) return;
  for (const [id, v] of Object.entries(block)) {
    if (!UNIT_IDS.includes(id)) continue;
    if (state.flags.provinces_vote_independently && (id === "VO" || id === "XK")) continue;
    state.presidency[id] = !!v;
  }
  syncSerbianBloc(state);
}

/** By 1990 VO and XK vote with the Serbian machine unless a later flag says otherwise. */
export function syncSerbianBloc(state) {
  if (!state.presidency) return;
  if (state.flags.provinces_vote_independently) return;
  state.presidency.VO = !!state.presidency.RS;
  state.presidency.XK = !!state.presidency.RS;
}

export function applyEffects(state, effects) {
  if (!effects) return [];
  const applied = [];
  for (const [key, value] of Object.entries(effects)) {
    if (key === "flags_add") {
      for (const f of value) {
        state.flags[f] = true;
        applied.push(`flag +${f}`);
      }
      continue;
    }
    if (key === "flags_remove") {
      for (const f of value) {
        state.flags[f] = false;
        applied.push(`flag −${f}`);
      }
      continue;
    }
    if (key === "agencies") {
      applyAgencyBlock(state, value);
      applied.push("agencies updated");
      continue;
    }
    if (key === "parties") {
      applyPartyBlock(state, value);
      applied.push("parties updated");
      continue;
    }
    if (key === "presidency") {
      applyPresidencyBlock(state, value);
      applied.push("presidency seats");
      continue;
    }
    if (key === "spawn_event") {
      const ids = Array.isArray(value) ? value : [value];
      for (const id of ids) {
        if (!state.queue.includes(id) && !state.resolved.includes(id)) {
          state.queue.push(id);
          state.spawned.push(id);
          applied.push(`spawn ${id}`);
        }
      }
      continue;
    }
    if (key.startsWith("NC.")) {
      const u = state.noncompliance?.unit;
      if (u) pathAdd(state, `${u}.${key.slice(3)}`, value);
      applied.push(`${key} ${value > 0 ? "+" : ""}${value}`);
      continue;
    }
    if (key === "charter_signatures") {
      let n = Math.max(0, Math.min(8, Math.round(Number(value))));
      const inviting =
        (Array.isArray(effects.flags_add) && effects.flags_add.includes("slovenia_invited_back")) ||
        !!state.flags.slovenia_invited_back;
      const gone =
        (state.flags.slovenia_left_institutions || state.flags.independence_slovenia_declared) &&
        !inviting;
      if (gone && n > 0) n -= 1;
      state.charter_signatures = n;
      applied.push(`charter_signatures=${state.charter_signatures}`);
      continue;
    }
    if (key === "charter_signatures_min") {
      state.charter_signatures = Math.max(state.charter_signatures || 0, Math.round(Number(value)));
      applied.push(`charter_signatures≥${state.charter_signatures}`);
      continue;
    }
    pathAdd(state, key, value);
    applied.push(`${key} ${value > 0 ? "+" : ""}${value}`);
  }
  syncAgenciesFromFlags(state);
  recomputeFederalControl(state);
  return applied;
}

const ACT3_AGENDAS = {
  serbia_referendum: {
    constitution_first: {
      RS: "constitution_first_then_elections",
      VO: "absorb_serbian_constitution",
      ME: "follow_belgrade_constitution",
      XK: "boycott_and_parallel_institutions",
    },
    elections_first: {
      RS: "elections_then_constitution",
      VO: "wait_on_belgrade_ballot",
      XK: "boycott_and_parallel_institutions",
    },
    forbid_referendum: {
      RS: "defy_federal_ban_write_constitution",
      XK: "watch_belgrade_defy_federation",
    },
  },
  kosovo_reaction: {
    _all: {
      XK: "boycott_and_parallel_institutions",
      RS: "recentralize_kosovo",
    },
  },
  log_revolution: {
    _all: {
      HR: "knin_roadblocks",
      BA: "watch_krajina_spread",
    },
  },
  sovereignty_texts: {
    _all: {
      SI: "sovereignty_text_in_assembly",
      HR: "sabor_sovereignty_language",
    },
  },
  serbia_constitution: {
    _all: {
      RS: "constitution_first_then_elections",
      VO: "absorb_serbian_constitution",
      XK: "boycott_and_parallel_institutions",
    },
  },
  skh_cabinet: {
    _all: { HR: "sabor_sovereignty_language" },
  },
  assembly_paralysis: {
    _all: {
      SI: "bypass_federal_assembly",
      HR: "bypass_federal_assembly",
      RS: "hold_the_chamber",
    },
  },
  macedonia_election: {
    _all: { MK: "bargain_equal_republic_status" },
  },
  bosnia_election: {
    _all: { BA: "three_nation_coalition" },
  },
  serbia_montenegro_election: {
    _all: {
      RS: "sps_holds_serbia",
      ME: "sk_holds_titograd",
      VO: "absorb_serbian_election",
    },
  },
  slovenia_plebiscite: {
    _all: { SI: "independence_mandate_from_plebiscite", HR: "watch_ljubljana_then_follow" },
  },
  markovic_reform_forces: {
    _all: {},
  },
  governments_vs_siv: {
    _all: {
      SI: "govern_beside_siv",
      HR: "govern_beside_siv",
    },
  },
  disarm_paramilitaries: {
    _all: {
      SI: "refuse_or_file_the_disarm_order",
      HR: "refuse_or_file_the_disarm_order",
    },
  },
  confederal_draft: {
    _all: {
      SI: "confederal_exit_clause",
      BA: "confederal_veto_structure",
    },
  },
  mesic_rotation: {
    seat_mesic: { HR: "mesic_holds_the_gavel" },
    block_mesic: { HR: "blocked_chair_is_a_republic" },
    bargain_mesic: { HR: "mesic_holds_the_gavel" },
    jna_on_the_chair: { HR: "blocked_chair_is_a_republic" },
  },
  croatian_chair_skh: {
    seat_croat: { HR: "mesic_holds_the_gavel" },
    block_croat: { HR: "blocked_chair_is_a_republic" },
    bargain_croat: { HR: "mesic_holds_the_gavel" },
  },
  slice_close: {
    _all: {},
  },
};

export function applyPlannedMoves(state, event, choice) {
  const table = ACT3_AGENDAS[event.id];
  if (!table) return;
  const moves = { ...(table._all || {}), ...(table[choice.id] || {}) };
  for (const [id, move] of Object.entries(moves)) {
    if (state.units[id]) state.units[id].planned_move = move;
  }
}

export function resolveChoice(state, event, choice, catalogEvents) {
  if (choice.locked) return { ok: false, reason: choice.lock_reason || t("event.locked") };
  const gate = requiresMet(state, choice.requires);
  if (!gate.ok) return { ok: false, reason: gate.reason };

  applyPlannedMoves(state, event, choice);
  const applied = applyEffects(state, choice.effects);
  stampSpineFlags(state, event, choice);
  if (!event.spawn_only) state.federal.clock = event.date;
  state.log.push({
    date: state.federal.clock,
    eventId: event.id,
    choiceId: choice.id,
    label: choice.label,
    legal: choice.legal,
  });
  if (!event.spawn_only) state.resolved.push(event.id);
  state.queue = state.queue.filter((id) => id !== event.id);

  let noncompliance = null;
  const ncUnits = choice.noncompliance_units
    || (choice.noncompliance_unit ? [choice.noncompliance_unit] : []);
  if (choice.noncompliance_chance && ncUnits.length) {
    for (const unitId of ncUnits) {
      if (Math.random() >= choice.noncompliance_chance) continue;
      const u = state.units[unitId];
      if (!u) continue;
      pathAdd(state, `${unitId}.secession_readiness`, 6);
      pathAdd(state, `${unitId}.federal_trust`, -5);
      applied.push(`non-compliance ${unitId}`);
      if (!noncompliance) {
        spawnNoncomplianceFollowup(state, { unitId, source: event.title });
        noncompliance = unitId;
      }
    }
  }

  if (event.spawn_only) state.noncompliance = null;

  return {
    ok: true,
    applied,
    noncompliance,
    next: currentEvent(state, catalogEvents),
  };
}

export function documentFor(catalogs, id) {
  return (catalogs.documents?.documents || []).find((d) => d.id === id) || null;
}

function stampSpineFlags(state, event, choice) {
  if (event.id === "sovereignty_texts") state.flags.sovereignty_texts_filed = true;
  if (event.id === "slovenia_plebiscite" && (choice.id === "ignore_plebiscite" || choice.id === "decree_void")) {
    state.flags.slovenia_federal_reply_failed = true;
  }
  const added = choice.effects?.flags_add || [];
  if (added.includes("player_used_jna_threat")) {
    const units = choice.noncompliance_units || (choice.noncompliance_unit ? [choice.noncompliance_unit] : []);
    const ids = units.length ? units : [state.selectedUnit].filter(Boolean);
    for (const id of ids) markJnaThreat(state, id);
  }
  recomputeFederalControl(state);
}

function lockChoice(c, reason) {
  return { ...c, locked: true, lock_reason: reason };
}

function extraChoicesFor(state, ev) {
  const extras = [];
  const push = (c) => extras.push(c);

  if (ev.id === "skj_congress_opens") {
    push({
      id: "buy_corridor",
      label: t("extra.congress.money"),
      legal: "siv",
      effects: {
        "federal.federal_budget": -6,
        "federal.hard_currency": -3,
        "federal.skj_unity": 4,
        "SI.federal_trust": 3,
      },
    });
  }
  if (ev.id === "renounce_leading_role") {
    push({
      id: "monopoly_decree",
      label: t("extra.renounce.decree"),
      legal: "extra_constitutional",
      effects: {
        "federal.legitimacy": -10,
        "federal.skj_unity": -6,
        "SI.secession_readiness": 8,
        "HR.nationalist_heat": 6,
        flags_add: ["player_used_emergency"],
      },
    });
    push({
      id: "write_league_statutes",
      label: t("extra.renounce.leagues"),
      legal: "party",
      effects: {
        flags_add: ["skj_confederated"],
        "federal.skj_unity": -8,
        "SI.federal_trust": 6,
        "HR.federal_trust": 3,
        "RS.elite_cohesion": -4,
      },
    });
  }
  if (ev.id === "markovic_mandate") {
    push({
      id: "leave_republics_books",
      label: t("extra.markovic.leave"),
      legal: "political",
      effects: {
        "federal.siv_authority": -6,
        "SI.federal_trust": 4,
        "HR.federal_trust": 3,
        "RS.elite_cohesion": 2,
      },
    });
  }
  if (ev.id === "to_inventory") {
    push({
      id: "buy_inventory",
      label: t("extra.to.money"),
      legal: "siv",
      effects: {
        "federal.federal_budget": -7,
        "federal.hard_currency": -3,
        "SI.federal_trust": 3,
        "HR.federal_trust": 2,
        "federal.jna_cohesion": 2,
      },
    });
  }
  if (ev.id === "presidency_rotation") {
    push({
      id: "leave_gavel_republics",
      label: t("extra.rotation.leave"),
      legal: "political",
      effects: {
        "federal.presidency_cohesion": -6,
        "federal.legitimacy": -3,
        "RS.elite_cohesion": 4,
        flags_add: ["presidency_rotation_jovic"],
      },
    });
  }
  if (ev.id === "skh_cabinet") {
    push({
      id: "buy_skh",
      label: t("extra.skh.money"),
      legal: "siv",
      effects: {
        "federal.federal_budget": -5,
        "HR.federal_trust": 5,
        "HR.skj_hold": 3,
      },
    });
  }
  if (ev.id === "to_inventory_followup") {
    push({
      id: "buy_keys",
      label: t("extra.tofollow.money"),
      legal: "siv",
      effects: {
        "federal.hard_currency": -4,
        "federal.federal_budget": -4,
        "SI.federal_trust": 4,
        "SI.to_control": -4,
      },
    });
  }
  if (ev.id === "barracks_quiet") {
    push({
      id: "seize_quiet",
      label: t("extra.barracks.extra"),
      legal: "extra_constitutional",
      effects: {
        "federal.legitimacy": -8,
        "SI.federal_trust": -8,
        "HR.federal_trust": -6,
        "federal.war_risk": 5,
        flags_add: ["player_used_emergency"],
      },
    });
  }
  if (ev.id === "serbia_referendum") {
    push({
      id: "fund_civic_rs",
      label: t("extra.serbia.money"),
      legal: "siv",
      effects: {
        "federal.federal_budget": -6,
        "RS.media_pluralism": 5,
        "RS.skj_hold": -3,
        "federal.legitimacy": -2,
      },
    });
  }
  if (ev.id === "serbia_constitution") {
    push({
      id: "void_by_decree",
      label: t("extra.srconst.extra"),
      legal: "extra_constitutional",
      noncompliance_chance: 0.6,
      noncompliance_unit: "RS",
      effects: {
        "federal.legitimacy": -10,
        "RS.federal_trust": -10,
        "RS.nationalist_heat": 8,
        flags_add: ["serbia_new_constitution", "player_used_emergency"],
      },
    });
  }
  if (ev.id === "croatian_chair_skh") {
    push({
      id: "buy_chair",
      label: t("extra.chair.money"),
      legal: "siv",
      effects: {
        "federal.federal_budget": -5,
        "federal.hard_currency": -3,
        "HR.federal_trust": 4,
        flags_add: ["croatian_chair_seated"],
      },
    });
  }
  if (ev.id === "slovenia_election") {
    push({
      id: "federal_observers",
      label: t("extra.si.observers"),
      legal: "siv",
      requires: { "SI.federal_control": 55 },
      lock_reason: t("extra.si.observers.lock"),
      effects: {
        "SI.federal_trust": 4,
        "SI.skj_hold": 3,
        "federal.siv_authority": 2,
        flags_add: ["federal_observers_si"],
      },
    });
    push({
      id: "league_not_skj",
      label: t("extra.si.league"),
      legal: "party",
      requires: { flags: ["skj_confederated"] },
      lock_reason: t("extra.si.league.lock"),
      effects: {
        "SI.skj_hold": 4,
        "SI.federal_trust": 5,
        "federal.skj_unity": -3,
      },
    });
  }
  if (ev.id === "croatia_election") {
    push({
      id: "skh_is_league",
      label: t("extra.hr.league"),
      legal: "party",
      requires: { flags: ["skj_confederated"] },
      lock_reason: t("extra.hr.league.lock"),
      effects: {
        "HR.skj_hold": 4,
        "HR.federal_trust": 3,
        "federal.skj_unity": -2,
      },
    });
  }
  if (ev.id === "hdz_government") {
    push({
      id: "court_high_control",
      label: t("extra.hr.court"),
      legal: "constitutional",
      requires: { "HR.federal_control": 55 },
      lock_reason: t("extra.hr.court.lock"),
      effects: {
        "federal.assembly_function": 4,
        "HR.federal_trust": -3,
        "federal.legitimacy": 4,
        flags_add: ["croatia_act_in_court"],
      },
    });
  }
  if (ev.id === "markovic_reform_forces") {
    push({
      id: "federal_list_live",
      label: t("extra.arsj.live"),
      legal: "party",
      requires: { flags: ["markovic_mandate_strong"] },
      lock_reason: t("extra.arsj.live.lock"),
      effects: {
        "federal.reform_momentum": 10,
        "federal.siv_authority": 4,
        parties: { arsj: { support: 14 } },
        flags_add: ["markovic_list_founded"],
      },
    });
  }
  if (ev.id === "confederal_draft") {
    push({
      id: "sign_now",
      label: t("extra.charter.signnow"),
      legal: "political",
      requires: { flags: ["confederal_talks_open"] },
      lock_reason: t("extra.charter.signnow.lock"),
      effects: {
        charter_signatures_min: 4,
        flags_add: ["confederal_talks_open", "slovenia_invited_back"],
        "SI.federal_trust": 5,
        "HR.federal_trust": 4,
      },
    });
  }
  return extras;
}

export function decorateEvent(state, ev) {
  if (!ev) return ev;
  const extras = extraChoicesFor(state, ev);
  let choices = [...(ev.choices || []), ...extras].map((c) => ({ ...c }));

  const remnant = !!state.flags.skj_confederated || !!state.flags.skj_renounced_monopoly;
  if (remnant) {
    choices = choices.map((c) => {
      if (ev.id === "skj_congress_opens" && c.id === "script_majority") {
        return lockChoice(c, t("deco.lock.stacked"));
      }
      if (ev.id === "renounce_leading_role" && (c.id === "keep_role" || c.id === "monopoly_decree")) {
        return lockChoice(c, t("deco.lock.keep"));
      }
      if (c.id === "clip_wings" && ev.id === "markovic_mandate") {
        return { ...c, label: t("extra.markovic.clip.remnant") };
      }
      return c;
    });
  }

  if (state.flags.markovic_starved && ev.id === "markovic_reform_forces") {
    choices = choices.map((c) => {
      if (["allow_list", "allow_anyway", "dinar_is_the_list", "federal_list_live"].includes(c.id)) {
        return lockChoice(c, t("deco.lock.starved"));
      }
      return c;
    });
    if (!choices.some((c) => c.id === "file_starved")) {
      choices.push({
        id: "file_starved",
        label: t("extra.arsj.fileStarved"),
        legal: "siv",
        effects: {
          "federal.siv_authority": -4,
          "federal.reform_momentum": -4,
        },
      });
    }
  }

  let briefing = ev.briefing || "";
  if (state.flags.skj_confederated && (ev.desk === "SKJ" || ev.id === "slovenia_election" || ev.id === "croatia_election")) {
    briefing = `${t("deco.skj.remnant")} ${briefing}`;
  }
  if (state.flags.markovic_mandate_strong && ev.id === "markovic_reform_forces") {
    briefing = `${t("deco.markovic.strong")} ${briefing}`;
  }
  if (state.flags.markovic_starved && ev.id === "markovic_reform_forces") {
    briefing = `${t("deco.markovic.starved")} ${briefing}`;
  }
  if (state.flags.confederal_talks_open && ev.id === "confederal_draft") {
    briefing = `${t("deco.charter.open", { n: state.charter_signatures || 1 })} ${briefing}`;
  }
  if (state.flags.provinces_vote_independently && (ev.id === "mesic_rotation" || ev.id === "croatian_chair_skh")) {
    briefing = `${t("deco.provinces.free")} ${briefing}`;
  }

  return { ...ev, briefing, choices };
}

