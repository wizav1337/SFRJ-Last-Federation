export const UNIT_IDS = ["SI", "HR", "BA", "RS", "ME", "MK", "VO", "XK"];
export const SAVE_KEY = "sfrj1990.v1";

export const DESKS = [
  { id: "PRET", label: "Predsjedništvo" },
  { id: "SIV", label: "SIV" },
  { id: "SKJ", label: "SKJ" },
  { id: "REPUBLIKE", label: "Republike", readonly: true },
];

export const STAT_BARS = [
  { key: "living_standard", label: "Životni standard" },
  { key: "nationalist_heat", label: "Nacionalistička vrućina", kind: "heat" },
  { key: "yugoslav_identity", label: "Jugoslavenski identitet" },
  { key: "skj_hold", label: "Udio SK" },
  { key: "federal_trust", label: "Savezno povjerenje", kind: "trust" },
  { key: "secession_readiness", label: "Spremnost na otcjepljenje", kind: "secession" },
  { key: "jna_presence", label: "Nazočnost JNA" },
  { key: "interethnic_tension", label: "Međunacionalna napetost", kind: "heat" },
];

export const GOV_LABELS = {
  skj_monopoly: "Monopol SK",
  reform_skj: "Reformirani SK",
  nationalist: "Nacionalistička vlada",
  coalition: "Koalicija",
  deadlock: "Blokada",
};

export const CORE_FLAGS = [
  "skj_split",
  "skj_renounced_monopoly",
  "slovenia_walkout",
  "demos_slovenia",
  "hdz_croatia",
  "sps_serbia",
  "sda_sds_hdz_bosnia",
  "krajina_log_revolution",
  "serbia_constitution_first",
  "serbia_new_constitution",
  "croatia_election_held",
  "slovenia_election_held",
  "croatian_chair_seated",
  "slovenia_invited_back",
  "slovenia_left_institutions",
  "provinces_vote_independently",
  "kosovo_boycott",
  "markovic_dinar_program",
  "to_inventory_ordered",
  "to_disarmed_slovenia",
  "to_disarmed_croatia",
  "jna_sides_with_serbia",
  "presidency_deadlock",
  "confederal_talks_open",
  "independence_slovenia_declared",
  "independence_croatia_declared",
  "ec_recognition_track",
  "player_used_emergency",
  "player_used_purge",
  "player_used_jna_threat",
  "presidency_rotation_jovic",
  "slovenia_plebiscite_yes",
  "mesic_seated",
  "slice_filed_federation",
  "slice_filed_rump",
  "slice_filed_confederal",
  "slice_filed_separation",
  "skj_confederated",
  "skj_federal_successor",
  "markovic_mandate_strong",
  "markovic_starved",
  "markovic_list_founded",
  "competence_shifted",
  "federal_election_law",
  "slovenia_federal_reply_failed",
  "sovereignty_texts_filed",
  "federal_observers_si",
  "multiparty_wave",
  "imf_standby_active",
  "customs_war_active",
  "customs_war_resolved",
  "pakrac_standoff",
  "pakrac_defused",
  "belgrade_march_tanks",
  "belgrade_march_concession",
  "arsj_campaign_live",
  "ec_troika_watching",
    "croatia_act_in_court",
  "jna_garrison_posture",
  "jna_mobilization_alert",
  "jna_political_weight",
  "jna_civilian_chain",
  "siv_austerity_stance",
  "siv_stimulus_stance",
  "siv_cabinet_pressure",
  "presidency_mediation_active",
  "presidency_hardline",
  "presidency_quorum_guard",
  "ssup_soft_line",
  "ssup_hard_line",
  "sdb_civilian_leash",
  "ssp_ec_track",
  "ssp_quiet_demarche",
  "finance_transfers_open",
  "finance_transfer_freeze",
  "finance_imf_aligned",
  "talked_markovic",
  "talked_kadijevic",
  "talked_jovic",
  "talked_mesic",
  "talked_drnovsek",
  "dialogue_markovic_teeth",
  "dialogue_markovic_starve",
  "dialogue_kadijevic_civilian",
  "dialogue_kadijevic_alert",
  "dialogue_kadijevic_serbia",
  "dialogue_jovic_bind",
  "dialogue_jovic_serbia",
  "dialogue_jovic_defer",
  "dialogue_mesic_seat",
  "dialogue_mesic_block",
  "dialogue_mesic_confederal",
  "dialogue_drnovsek_invite",
  "dialogue_drnovsek_pressure",
  "desk_event_jna_seen",
  "desk_event_siv_seen",
  "desk_event_ssup_seen",
  "desk_event_pret_seen",
];

const BOOLEAN_FEDERAL = new Set(["skj_leading_role"]);

export function clamp(n, lo = 0, hi = 100) {
  const x = Number(n);
  if (Number.isNaN(x)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(x)));
}

export function defaultFederal() {
  return {
    legitimacy: 62,
    presidency_cohesion: 48,
    siv_authority: 56,
    skj_unity: 38,
    skj_leading_role: true,
    federal_budget: 44,
    hard_currency: 36,
    inflation: 68,
    reform_momentum: 40,
    imf_pressure: 52,
    jna_cohesion: 74,
    jna_obedience_to_civilian: 58,
    sdb_control: 54,
    assembly_function: 50,
    inter_republic_trade: 57,
    international_standing: 49,
    war_risk: 14,
    clock: "1990-01-20",
    turn: 0,
  };
}

export function defaultPresidency() {
  return {
    SI: true,
    HR: true,
    BA: true,
    RS: true,
    ME: true,
    MK: true,
    VO: true,
    XK: true,
  };
}

export function emptyFlags() {
  const flags = {};
  for (const id of CORE_FLAGS) flags[id] = false;
  return flags;
}

export function createNewState(catalogs) {
  const units = {};
  for (const u of catalogs.units.units) {
    units[u.id] = {
      id: u.id,
      name: u.name,
      name_local: u.name_local,
      type: u.type,
      capital: u.capital,
      color: u.color,
      ...u.stats,
      government_type: u.government_type,
      election_held: u.election_held,
      planned_move: u.planned_move,
      federal_control: u.stats.federal_trust ?? 40,
      jna_threatened: false,
    };
  }

  const parties = catalogs.parties.parties.map((p) => ({ ...p, ideology: [...p.ideology] }));
  const agencies = catalogs.agencies.agencies.map((a) => ({ ...a }));

  return {
    federal: defaultFederal(),
    presidency: defaultPresidency(),
    units,
    parties,
    agencies,
    flags: emptyFlags(),
    log: [],
    queue: [],
    resolved: [],
    spawned: [],
    desk: "SKJ",
    selectedUnit: "SI",
    charter_signatures: 0,
    ended: false,
    mapMode: "raskol",
    reform_actions: 0,
    reform_month: "",
    reformFamily: "skj",
    lastMonthlyReport: null,
    pressureLog: [],
    desks: {},
    desk_actions: 0,
    desk_month: "",
    dialogue_done: [],
    activeDialogue: null,
  };
}

export function saveState(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function pathGet(state, path) {
  if (path === "flags" || path.startsWith("flags.")) {
    const flag = path.split(".")[1];
    return flag ? !!state.flags[flag] : state.flags;
  }
  const parts = path.split(".");
  if (parts[0] === "federal") return state.federal[parts[1]];
  if (parts[0] === "presidency") return state.presidency[parts[1]];
  if (UNIT_IDS.includes(parts[0])) return state.units[parts[0]][parts[1]];
  if (parts[0] === "desks" && parts[1] && state.desks?.[parts[1]]) {
    return parts[2] ? state.desks[parts[1]][parts[2]] : state.desks[parts[1]];
  }
  if (Object.prototype.hasOwnProperty.call(state.federal, parts[0]) && parts.length === 1) {
    return state.federal[parts[0]];
  }
  return undefined;
}

export function pathSet(state, path, value) {
  const parts = path.split(".");
  if (parts[0] === "federal") {
    const key = parts[1];
    if (BOOLEAN_FEDERAL.has(key)) state.federal[key] = !!value && value !== 0;
    else state.federal[key] = clamp(value);
    return;
  }
  if (parts[0] === "presidency") {
    state.presidency[parts[1]] = !!value;
    return;
  }
  if (UNIT_IDS.includes(parts[0])) {
    const key = parts[1];
    const cur = state.units[parts[0]][key];
    if (typeof cur === "boolean") state.units[parts[0]][key] = !!value && value !== 0;
    else if (typeof cur === "string") state.units[parts[0]][key] = String(value);
    else state.units[parts[0]][key] = clamp(value);
    return;
  }
  if (Object.prototype.hasOwnProperty.call(state.federal, parts[0]) && parts.length === 1) {
    pathSet(state, `federal.${parts[0]}`, value);
  }
}

export function pathAdd(state, path, delta) {
  const cur = pathGet(state, path);
  if (typeof cur === "boolean") {
    pathSet(state, path, delta);
    return;
  }
  if (typeof cur === "number") pathSet(state, path, cur + Number(delta));
  else pathSet(state, path, delta);
}

export function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${d} ${months[m - 1]} ${y}`;
}

export function monthIndex(iso) {
  const [y, m] = iso.split("-").map(Number);
  return (y - 1990) * 12 + (m - 1);
}

export function humanize(id) {
  return String(id || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function presidencyTally(state) {
  return UNIT_IDS.reduce((n, id) => n + (state.presidency[id] ? 1 : 0), 0);
}
