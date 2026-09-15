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
  "gligorov", "bucin", "izetbegovic", "bulatovic",
  "mesic_late", "jovic_late", "loncar", "buzadzic", "bajramovic", "kostic",
].map((id) => readJSON(`data/dialogue/${id}.json`));

const acts = ["act1", "act2", "act3", "act4", "act5"].map((a) => readJSON(`data/events/${a}.json`));
const flat = flattenActs(acts);

const state = createNewState(catalogs);
assert(state.save_schema === 11, "save_schema 11");
assert(state.attention_spent_desks === 0 && state.attention_spent_reforms === 0, "spend counters");

initDesks(state, catalogs);
grantAttentionActions(state);
const cap = attentionCap(state);
assert(cap === 3 || cap === 4, "attention cap");
assert(state.attention_left === cap, "attention granted");

const desks = listDesks(catalogs);
assert(desks.length >= 17, "at least 17 desks (provinces)");
assert(desks.some((d) => d.id === "justice"), "justice desk present");
assert(desks.some((d) => d.id === "skj"), "skj desk present");
assert(desks.some((d) => d.id === "assembly"), "assembly desk present");
assert(desks.some((d) => d.id === "fer"), "fer desk present");
assert(desks.some((d) => d.id === "fond"), "fond desk present");
assert(state.desks.fond?.posture === "open_south", "fond default posture");
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
const fondActs = actionsForDesk(state, catalogs, "fond");
assert(fondActs.some((a) => a.id === "open_south"), "fond open_south");
assert(fondActs.some((a) => a.id === "freeze_fund"), "fond freeze");
const jnaDeep = actionsForDesk(state, catalogs, "jna");
assert(jnaDeep.some((a) => a.id === "quiet_redistribute"), "jna quiet_redistribute");
assert(!(jnaDeep.find((a) => a.id === "quiet_redistribute")?.effects?.flags_add || []).includes("player_used_jna_threat"), "quiet JNA must not set threat");
assert(actionsForDesk(state, catalogs, "siv").some((a) => a.id === "bind_fond"), "siv bind_fond");
assert(actionsForDesk(state, catalogs, "presidency").some((a) => a.id === "south_balance"), "presidency south_balance");
assert(desks.some((d) => d.id === "ssrn"), "ssrn desk present");
assert(state.desks.ssrn?.posture === "mass_front_open", "ssrn default posture");
const ssrnActs = actionsForDesk(state, catalogs, "ssrn");
assert(ssrnActs.some((a) => a.id === "mass_front_open"), "ssrn mass_front_open");
assert(ssrnActs.some((a) => a.id === "open_civic_forum"), "ssrn civic");
assert(ssrnActs.some((a) => a.id === "party_capture"), "ssrn party_capture");
assert(ssrnActs.some((a) => a.id === "paralyze"), "ssrn paralyze");
assert(ssrnActs.some((a) => a.id === "bind_siv"), "ssrn bind_siv");
const sspDeep = actionsForDesk(state, catalogs, "ssp");
assert(sspDeep.some((a) => a.id === "isolation"), "ssp isolation");
assert(sspDeep.some((a) => a.id === "nam_bridge"), "ssp nam_bridge");
const finDeep = actionsForDesk(state, catalogs, "finance");
assert(finDeep.some((a) => a.id === "target_channels"), "finance target_channels");
assert(finDeep.some((a) => a.id === "soft_corridor"), "finance soft_corridor");

assert(desks.some((d) => d.id === "ssip"), "ssip desk present");
assert(state.desks.ssip?.posture === "ec_dialogue", "ssip default posture");
const ssipActs = actionsForDesk(state, catalogs, "ssip");
assert(ssipActs.some((a) => a.id === "ec_dialogue"), "ssip ec_dialogue");
assert(ssipActs.some((a) => a.id === "nonaligned_hold"), "ssip nonaligned_hold");
assert(ssipActs.some((a) => a.id === "bilateral_quiet"), "ssip bilateral_quiet");
assert(ssipActs.some((a) => a.id === "paralyze"), "ssip paralyze");
assert(ssipActs.some((a) => a.id === "bind_siv"), "ssip bind_siv");
const toDeep = actionsForDesk(state, catalogs, "to");
assert(toDeep.some((a) => a.id === "shared_reserve_pool"), "to shared_reserve_pool");
assert(toDeep.some((a) => a.id === "liaison_nby"), "to liaison_nby");
const nbyDeep = actionsForDesk(state, catalogs, "nby");
assert(nbyDeep.some((a) => a.id === "imf_align"), "nby imf_align");
assert(nbyDeep.some((a) => a.id === "diplomatic_fx"), "nby diplomatic_fx");

assert(desks.some((d) => d.id === "const_court"), "const_court desk present");
assert(state.desks.const_court?.posture === "docket_open", "const_court default posture");
const courtActs = actionsForDesk(state, catalogs, "const_court");
assert(courtActs.some((a) => a.id === "open_docket"), "const_court open_docket");
assert(courtActs.some((a) => a.id === "stall_docket"), "const_court stall");
assert(courtActs.some((a) => a.id === "yield_republics"), "const_court yield");
assert(courtActs.some((a) => a.id === "bind_justice"), "const_court bind_justice");
assert(courtActs.some((a) => a.id === "annul_hard"), "const_court annul_hard");
const justiceDeep = actionsForDesk(state, catalogs, "justice");
assert(justiceDeep.some((a) => a.id === "refer_to_court"), "justice refer_to_court");
assert(justiceDeep.some((a) => a.id === "couple_court_bind"), "justice couple_court_bind");
const ssupDeep = actionsForDesk(state, catalogs, "ssup");
assert(ssupDeep.some((a) => a.id === "docket_watch"), "ssup docket_watch");
assert(ssupDeep.some((a) => a.id === "court_liaison"), "ssup court_liaison");

assert(desks.some((d) => d.id === "provinces"), "provinces desk present");
assert(state.desks.provinces?.posture === "bloc_aligned", "provinces default posture");
const provActs = actionsForDesk(state, catalogs, "provinces");
assert(provActs.some((a) => a.id === "align_bloc"), "provinces align_bloc");
assert(provActs.some((a) => a.id === "observe_seats"), "provinces observe_seats");
assert(provActs.some((a) => a.id === "independent_votes"), "provinces independent_votes");
assert(provActs.some((a) => a.id === "mediate_seats"), "provinces mediate_seats");
assert(actionsForDesk(state, catalogs, "presidency").some((a) => a.id === "quorum_with_provinces"), "presidency quorum_with_provinces");
assert(actionsForDesk(state, catalogs, "presidency").some((a) => a.id === "seat_province_voice"), "presidency seat_province_voice");
assert(actionsForDesk(state, catalogs, "ssup").some((a) => a.id === "province_dossier"), "ssup province_dossier");
// Apply independent_votes and assert flag
state.attention_left = 4;
const indepAct = provActs.find((a) => a.id === "independent_votes");
assert(indepAct, "independent_votes action object");
const indepRes = applyDeskAction(state, catalogs, "provinces", "independent_votes");
assert(indepRes.ok, "apply independent_votes");
assert(state.flags.provinces_vote_independently, "flag provinces_vote_independently after action");
assert(state.desks.provinces?.posture === "vote_independent", "posture vote_independent after action");
// Reset attention counters so later spend tests stay deterministic
state.attention_left = cap;
state.attention_spent_desks = 0;
state.attention_spent_reforms = 0;

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
  "desk_fond_open",
  "desk_jna_quiet_order",
  "desk_siv_fond_bind",
  "desk_fond_autumn",
  "republic_voice_bulatovic",
  "desk_presidency_south",
  "desk_fond_spring91",
  "confederal_fond_memo",
  "desk_ssrn_open",
  "desk_finance_target",
  "desk_ssp_isolation",
  "desk_ssrn_civic",
  "desk_ssrn_party",
  "desk_ssrn_before_pleb",
  "desk_ssrn_spring91",
  "confederal_ssrn_memo",
  "desk_ssip_open",
  "desk_to_nby_couple",
  "desk_ssip_siv_bind",
  "desk_ssip_embassy",
  "desk_ssip_nam_autumn",
  "desk_ssip_before_pleb",
  "desk_ssip_spring91",
  "confederal_ssip_memo",
  "desk_const_court_open",
  "desk_justice_refer_court",
  "desk_ssup_docket_watch",
  "desk_const_court_autumn",
  "desk_justice_court_bind",
  "desk_const_court_before_pleb",
  "desk_const_court_spring91",
  "confederal_const_court_memo",
  "desk_provinces_open",
  "desk_provinces_spring",
  "desk_provinces_autumn",
  "desk_ssup_province_dossier",
  "desk_provinces_before_pleb",
  "desk_presidency_province_quorum",
  "desk_provinces_spring91",
  "confederal_provinces_memo",
]) {
  assert(ids.has(id), "event " + id);
}

// Pass 5–6 dialogues present
for (const id of ["bogicevic", "tupurkovski", "racan", "gligorov", "bucin", "izetbegovic", "bulatovic", "mesic_late", "jovic_late", "loncar", "buzadzic", "bajramovic", "kostic"]) {
  assert(catalogs.dialogues.some((d) => d.id === id), "dialogue " + id);
}
const mesicLate = catalogs.dialogues.find((d) => d.id === "mesic_late");
assert(mesicLate && /dužnost|stolac|15\. svibnja/i.test(JSON.stringify(mesicLate)), "mesic_late chair duty language");
assert(!(JSON.stringify(mesicLate).includes("mesic_seated") && /flags_add[^\]]*mesic_seated/.test(JSON.stringify(mesicLate))), "mesic_late no auto-seat");
const jovicLate = catalogs.dialogues.find((d) => d.id === "jovic_late");
assert(jovicLate && /nije Milošević|≠ Milošević|ne Milošević/i.test(JSON.stringify(jovicLate)), "jovic_late not Milošević");
const glig = catalogs.dialogues.find((d) => d.id === "gligorov");
assert(glig && /Izetbegović–Gligorov|I–G/i.test(JSON.stringify(glig)), "gligorov mentions I-G exclusion");
assert(!(glig.nodes.start.choices || []).some((c) => /prihvati.*I–G nacrt|potpiši I–G/i.test(c.label || "")), "no accept I-G choice");

const jovic = catalogs.dialogues.find((d) => d.id === "jovic");
assert(jovic && (jovic.entries || []).some((e) => e.id === "revisit_skj"), "jovic SKJ revisit");
const markovic = catalogs.dialogues.find((d) => d.id === "markovic");
assert(markovic && (markovic.entries || []).some((e) => e.id === "revisit_fond"), "markovic fond revisit");
assert(markovic && (markovic.entries || []).some((e) => e.id === "revisit_ssrn"), "markovic ssrn revisit");
assert(markovic && (markovic.entries || []).some((e) => e.id === "revisit_ssip"), "markovic ssip revisit");
assert(markovic && (markovic.entries || []).some((e) => e.id === "revisit_const_court"), "markovic const_court revisit");
assert(markovic && (markovic.entries || []).some((e) => e.id === "revisit_provinces"), "markovic provinces revisit");
const loncar = catalogs.dialogues.find((d) => d.id === "loncar");
assert(loncar && /Lončar|SSIP|EEZ/i.test(JSON.stringify(loncar)), "loncar SSIP language");
assert(!(loncar.nodes.start.choices || []).some((c) => /priznaj seces|priznanje neovisnosti/i.test(c.label || "")), "loncar no secession recognition");
const buzadzic = catalogs.dialogues.find((d) => d.id === "buzadzic");
assert(buzadzic && /Buzadžić|Ustavni sud|docket/i.test(JSON.stringify(buzadzic)), "buzadzic court language");
assert(!(buzadzic.nodes.start.choices || []).some((c) => /ratn|ratnih suđen/i.test(c.label || "")), "buzadzic no war trials as choice");
const bajramovic = catalogs.dialogues.find((d) => d.id === "bajramovic");
assert(bajramovic && /Bajramović|Kosovo|sjedalo/i.test(JSON.stringify(bajramovic)), "bajramovic language");
const kostic = catalogs.dialogues.find((d) => d.id === "kostic");
assert(kostic && /Kostić|Vojvodina|sjedalo/i.test(JSON.stringify(kostic)), "kostic language");
const bul = catalogs.dialogues.find((d) => d.id === "bulatovic");
assert(bul && /Titograd/i.test(JSON.stringify(bul)), "bulatovic Titograd");
assert(!/Podgorica/i.test(JSON.stringify(bul)), "bulatovic not Podgorica");

// Invariants: no I-G on April card; Slice A end
const april = flat.find((e) => e.id === "confederal_draft");
assert(april && /Izetbegović–Gligorov|Izetbegovic|I–G|I-G/i.test(april.briefing || ""), "april card mentions I-G only as exclusion");
assert(!(april.choices || []).some((c) => /Izetbegović–Gligorov/i.test(c.label || "")), "no I-G choice on April card");
const skjMemo = flat.find((e) => e.id === "confederal_skj_memo");
assert(skjMemo && /Izetbegović–Gligorov|I–G/i.test((skjMemo.briefing || "") + (skjMemo.constitutional_note || "")), "SKJ memo excludes I-G");
const fondMemo = flat.find((e) => e.id === "confederal_fond_memo");
assert(fondMemo && /Izetbegović–Gligorov|I–G/i.test((fondMemo.briefing || "") + (fondMemo.constitutional_note || "")), "fond memo excludes I-G");
assert(!(fondMemo.choices || []).some((c) => /prihvati.*I–G|potpiši I–G/i.test(c.label || "")), "no accept I-G on fond memo");
const ssrnMemo = flat.find((e) => e.id === "confederal_ssrn_memo");
assert(ssrnMemo && /Izetbegović–Gligorov|I–G/i.test((ssrnMemo.briefing || "") + (ssrnMemo.constitutional_note || "")), "ssrn memo excludes I-G");
assert(!(ssrnMemo.choices || []).some((c) => /prihvati.*I–G|potpiši I–G/i.test(c.label || "")), "no accept I-G on ssrn memo");
const ssipMemo = flat.find((e) => e.id === "confederal_ssip_memo");
assert(ssipMemo && /Izetbegović–Gligorov|I–G/i.test((ssipMemo.briefing || "") + (ssipMemo.constitutional_note || "")), "ssip memo excludes I-G");
assert(!(ssipMemo.choices || []).some((c) => /prihvati.*I–G|potpiši I–G/i.test(c.label || "")), "no accept I-G on ssip memo");
const courtMemo = flat.find((e) => e.id === "confederal_const_court_memo");
assert(courtMemo && /Izetbegović–Gligorov|I–G/i.test((courtMemo.briefing || "") + (courtMemo.constitutional_note || "")), "court memo excludes I-G");
assert(!(courtMemo.choices || []).some((c) => /prihvati.*I–G|potpiši I–G/i.test(c.label || "")), "no accept I-G on court memo");
const provMemo = flat.find((e) => e.id === "confederal_provinces_memo");
assert(provMemo && /Izetbegović–Gligorov|I–G/i.test((provMemo.briefing || "") + (provMemo.constitutional_note || "")), "provinces memo excludes I-G");
assert(!(provMemo.choices || []).some((c) => /prihvati.*I–G|potpiši I–G/i.test(c.label || "")), "no accept I-G on provinces memo");

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
  pass7: ["fond", "bulatovic", "quiet_redistribute", "bind_fond", "south_balance"],
  pass8: ["ssrn", "mesic_late", "jovic_late", "isolation", "soft_corridor"],
  pass9: ["ssip", "loncar", "revisit_ssip", "shared_reserve_pool", "imf_align"],
  pass10: ["const_court", "buzadzic", "revisit_const_court", "refer_to_court", "docket_watch"],
  pass11: ["provinces", "bajramovic", "kostic", "revisit_provinces", "independent_votes", "province_dossier"],
});
