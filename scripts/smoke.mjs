/**
 * Headless smoke — boots catalogs + new state, asserts desks / dialogue / attention invariants.
 * No browser. Run: node scripts/smoke.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJSON = (rel) => JSON.parse(readFileSync(join(root, rel), "utf8"));

// Minimal localStorage stub for modules that touch it at import/runtime
globalThis.localStorage = {
  _d: {},
  getItem(k) { return this._d[k] ?? null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; },
};

const stateUrl = pathToFileURL(join(root, "js/state.js")).href;
const desksUrl = pathToFileURL(join(root, "js/desks.js")).href;
const dialogueUrl = pathToFileURL(join(root, "js/dialogue.js")).href;
const eventsUrl = pathToFileURL(join(root, "js/events.js")).href;
const agenciesUrl = pathToFileURL(join(root, "js/agencies.js")).href;

const { createNewState, emptyFlags } = await import(stateUrl);
const {
  initDesks,
  grantAttentionActions,
  spendAttention,
  attentionBreakdown,
  attentionCap,
  deskConflictWarnings,
  actionsForDesk,
  applyDeskAction,
  confederalStackDepth,
  listDesks,
} = await import(desksUrl);
const { listDialogues, isDialogueAvailable, availableEntries, startDialogue, chooseDialogue } = await import(dialogueUrl);
const { requiresMet, flattenActs } = await import(eventsUrl);
const { deskVoteModifiers } = await import(agenciesUrl);

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT: " + msg);
}

const desksFile = readJSON("data/desks.json");
const catalogs = {
  units: readJSON("data/units.json"),
  parties: readJSON("data/parties.json"),
  agencies: readJSON("data/agencies.json"),
  desks: desksFile.desks || desksFile,
  documents: readJSON("data/documents.json"),
};
catalogs.dialogues = [
  "drnovsek", "jovic", "kadijevic", "kadijevic_late", "kucan",
  "markovic", "markovic_late", "mesic", "tudman",
  "bogicevic", "tupurkovski", "racan",
  "gligorov", "bucin", "izetbegovic",
].map((id) => readJSON(`data/dialogue/${id}.json`));

const acts = ["act1", "act2", "act3", "act4", "act5"].map((a) => readJSON(`data/events/${a}.json`));
const flat = flattenActs(acts);

const state = createNewState(catalogs);
assert(state.save_schema === 6, "save_schema 6");
assert(state.attention_spent_desks === 0 && state.attention_spent_reforms === 0, "spend counters");

initDesks(state, catalogs);
grantAttentionActions(state);
const cap = attentionCap(state);
assert(cap === 3 || cap === 4, "attention cap");
assert(state.attention_left === cap, "attention granted");

const desks = listDesks(catalogs);
assert(desks.length >= 12, "at least 12 desks (assembly+fer)");
assert(desks.some((d) => d.id === "justice"), "justice desk present");
assert(desks.some((d) => d.id === "skj"), "skj desk present");
assert(desks.some((d) => d.id === "assembly"), "assembly desk present");
assert(desks.some((d) => d.id === "fer"), "fer desk present");
assert(state.desks.justice?.posture === "constitutional", "justice default posture");
assert(state.desks.skj?.posture === "soft_federal", "skj default posture");
assert(state.desks.assembly?.posture === "session_open", "assembly default posture");
assert(state.desks.fer?.posture === "trade_open", "fer default posture");
const skjActs = actionsForDesk(state, catalogs, "skj");
assert(skjActs.some((a) => a.id === "soft_federal_line"), "skj soft action");
assert(skjActs.some((a) => a.id === "dissolve_quietly"), "skj dissolve action");
const asmActs = actionsForDesk(state, catalogs, "assembly");
assert(asmActs.some((a) => a.id === "open_floor"), "assembly open_floor");
assert(asmActs.some((a) => a.id === "stall_floor"), "assembly stall");
const ferActs = actionsForDesk(state, catalogs, "fer");
assert(ferActs.some((a) => a.id === "open_trade"), "fer open_trade");
assert(ferActs.some((a) => a.id === "hold_imf"), "fer hold_imf");

// Spend desk then reform buckets
assert(spendAttention(state, 1, "desk"), "spend desk");
assert(spendAttention(state, 1, "reform"), "spend reform");
const br = attentionBreakdown(state);
assert(br.desks === 1 && br.reforms === 1 && br.left === cap - 2, "breakdown desks/reforms");

// Conflict warnings: hardline + confederal
state.flags.confederal_talks_open = true;
state.flags.presidency_hardline = true;
state.flags.ssup_hard_line = true;
const warns = deskConflictWarnings(state);
assert(warns.length >= 1, "conflict warnings fire");
assert(confederalStackDepth(state) >= 1, "confederal stack counts talks");

// Desk action soft-lock tax path
state.attention_left = 3;
state.attention_spent_desks = 0;
const actsJna = actionsForDesk(state, catalogs, "jna");
const alert = actsJna.find((a) => a.id === "raise_alert");
assert(alert, "jna raise_alert exists");
assert(alert.conflict_warn, "conflict warn on hardline action");

// Dialogue: Drnovšek available at start; has multi-visit entries
const drn = catalogs.dialogues.find((d) => d.id === "drnovsek");
assert(drn && (drn.entries || []).length >= 4, "drnovsek multi-visit entries");
assert(isDialogueAvailable(drn, state), "drnovsek available day one");
const started = startDialogue(state, drn);
assert(started.ok, "start drnovsek");
const node = drn.nodes[state.activeDialogue.node];
const choice = node.choices[0];
const picked = chooseDialogue(state, catalogs, choice.id);
assert(picked.ok, "drnovsek choice");

// Vote modifiers
const mod = deskVoteModifiers(state);
assert(typeof mod.net === "number", "vote modifiers");

// Event requires flags_any still works
const gate = requiresMet(state, { flags_any: ["confederal_talks_open", "never_set_flag"] });
assert(gate.ok, "flags_any ok");
const gate2 = requiresMet(state, { flags_any: ["never_a", "never_b"] });
assert(!gate2.ok, "flags_any fail");

// Flat catalog includes Pass 4 cards
const ids = new Set(flat.map((e) => e.id));
for (const id of [
  "desk_justice_open",
  "presidency_drnovsek_spring",
  "desk_ssp_nonaligned_open",
  "confederal_conflict_warn",
  "desk_justice_may_leash",
  "desk_fer_trade_may",
  "desk_skj_after_congress",
  "desk_skj_election_season",
  "desk_ssp_ec_track",
  "republic_voice_bih",
  "republic_voice_mk",
  "desk_skj_spring91",
  "confederal_skj_memo",
  "desk_attention_may",
  "desk_assembly_open",
  "desk_fer_open",
  "desk_assembly_after_votes",
  "desk_fer_customs_autumn",
  "republic_voice_me",
  "republic_voice_gligorov",
  "desk_assembly_spring91",
  "mediation_izetbegovic_gate",
]) {
  assert(ids.has(id), "event " + id);
}

// Pass 5–6 dialogues present
for (const id of ["bogicevic", "tupurkovski", "racan", "gligorov", "bucin", "izetbegovic"]) {
  assert(catalogs.dialogues.some((d) => d.id === id), "dialogue " + id);
}
const glig = catalogs.dialogues.find((d) => d.id === "gligorov");
assert(glig && /Izetbegović–Gligorov|I–G/i.test(JSON.stringify(glig)), "gligorov mentions I-G exclusion");
assert(!(glig.nodes.start.choices || []).some((c) => /prihvati.*I–G nacrt|potpiši I–G/i.test(c.label || "")), "no accept I-G choice");

const jovic = catalogs.dialogues.find((d) => d.id === "jovic");
assert(jovic && (jovic.entries || []).some((e) => e.id === "revisit_skj"), "jovic SKJ revisit");

// Invariants: no I-G on April card; Slice A end
const april = flat.find((e) => e.id === "confederal_draft");
assert(april && /Izetbegović–Gligorov|Izetbegovic|I–G|I-G/i.test(april.briefing || ""), "april card mentions I-G only as exclusion");
assert(!(april.choices || []).some((c) => /Izetbegović–Gligorov/i.test(c.label || "")), "no I-G choice on April card");
const skjMemo = flat.find((e) => e.id === "confederal_skj_memo");
assert(skjMemo && /Izetbegović–Gligorov|I–G/i.test((skjMemo.briefing || "") + (skjMemo.constitutional_note || "")), "SKJ memo excludes I-G");

// Slice A end date invariant
assert(!ids.has("june_war") && !flat.some((e) => (e.date || "") > "1991-05-15" && e.id !== "slice_close"), "no post-15 May cards");

console.log("smoke OK", {
  desks: desks.length,
  events: flat.length,
  dialogues: catalogs.dialogues.length,
  attention: br,
  conflict: warns[0]?.textKey,
  schema: state.save_schema,
  pass6: ["assembly", "fer", "gligorov", "bucin", "izetbegovic"],
});
