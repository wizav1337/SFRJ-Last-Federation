/**
 * Branching institutional dialogue — not an LLM.
 * Choices call applyDeskEffects → flags / federal / desks, which feed
 * control.js, simulation.js, elections.js, and endings.js the same way event cards do.
 *
 * Pass 3: multi-visit state — interlocutors can be revisited when entry rules
 * unlock new nodes after flags/time. dialogue_visits tracks per-entry completion.
 */
import { applyDeskEffects, syncDeskFlagsFromPosture } from "./desks.js";
import { requiresMet } from "./events.js";
import { recomputeFederalControl } from "./control.js";
import { t } from "./i18n.js";

export function listDialogues(catalog, state) {
  const list = catalog?.dialogues || [];
  return list.filter((d) => {
    if (isDialogueAvailable(d, state)) return true;
    // Keep finished trees visible in the hub (Pass 3 multi-visit UX)
    if (dialogueDone(state, d.id) && officeHolderOk(d, state)) return true;
    return false;
  });
}

function officeHolderOk(def, state) {
  const clock = clockOf(state);
  if (def.id === "mesic" && !state.flags.hdz_croatia) return false;
  if (def.id === "tudman" && !state.flags.hdz_croatia) return false;
  if (def.id === "kucan" && !state.flags.slovenia_election_held) return false;
  if (def.id === "drnovsek" && (state.flags.presidency_rotation_jovic || clock >= "1990-05-15")) return false;
  if (def.id === "markovic_late" && !state.flags.talked_markovic) return false;
  if (def.id === "kadijevic_late" && !state.flags.talked_kadijevic) return false;
  if (def.id === "racan" && (!state.flags.croatia_election_held || state.flags.hdz_croatia)) return false;
  if (def.id === "bogicevic" && !(state.units?.BA?.election_held || state.flags.sda_sds_hdz_bosnia || (state.federal.clock || "") >= "1990-12-03")) return false;
  if (def.id === "tupurkovski" && !(state.units?.MK?.election_held || (state.federal.clock || "") >= "1990-12-01")) return false;
  if (def.id === "gligorov" && !(state.units?.MK?.election_held || clock >= "1991-01-27")) return false;
  if (def.id === "bucin" && clock < "1990-11-01") return false;
  if (def.id === "izetbegovic" && !(state.flags.sda_sds_hdz_bosnia || state.flags.republic_voice_bih_seen || state.flags.talked_bogicevic || state.units?.BA?.election_held)) return false;
  return true;
}

function clockOf(state) {
  return state.federal.clock || "";
}

function visitsFor(state, dialogueId) {
  if (!state.dialogue_visits) state.dialogue_visits = {};
  if (!state.dialogue_visits[dialogueId]) state.dialogue_visits[dialogueId] = {};
  return state.dialogue_visits[dialogueId];
}

/** Normalize entry list. Default: single one-shot start. */
export function dialogueEntries(def) {
  if (Array.isArray(def.entries) && def.entries.length) return def.entries;
  return [{ id: "start", node: "start", once: true }];
}

export function entryKey(entry) {
  return entry.id || entry.node || "start";
}

export function isEntryAvailable(def, entry, state) {
  if (!entry || !def?.nodes?.[entry.node]) return false;
  const clock = clockOf(state);
  if (entry.available_until && clock >= entry.available_until) return false;
  if (def.available_until && clock >= def.available_until) return false;
  // Entry available_from wins; otherwise start inherits def.available_from
  const from = entry.available_from || (entry.node === "start" && !entry.ignore_def_from ? def.available_from : null);
  if (from && clock < from) return false;
  if (entry.unlock) {
    const gate = requiresMet(state, entry.unlock);
    if (!gate.ok) return false;
  }
  if (entry.require_done && !dialogueDone(state, def.id)) return false;
  if (entry.require_not_done && dialogueDone(state, def.id)) return false;
  const visits = visitsFor(state, def.id);
  const key = entryKey(entry);
  if (entry.once !== false && visits[key]) return false;
  return true;
}

export function availableEntries(def, state) {
  return dialogueEntries(def).filter((e) => isEntryAvailable(def, e, state));
}

export function pickEntry(def, state) {
  const avail = availableEntries(def, state);
  if (!avail.length) return null;
  // Prefer highest priority, then later entries (revisits over first talk)
  const ranked = [...avail].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return ranked[0];
}

export function isDialogueAvailable(def, state) {
  if (!def) return false;
  const clock = clockOf(state);
  if (def.available_until && clock >= def.available_until) return false;
  // Historical office holders
  if (def.id === "mesic" && !state.flags.hdz_croatia) return false;
  if (def.id === "tudman" && !state.flags.hdz_croatia) return false;
  if (def.id === "kucan" && !state.flags.slovenia_election_held) return false;
  if (def.id === "drnovsek" && (state.flags.presidency_rotation_jovic || clock >= "1990-05-15")) {
    return false;
  }
  if (def.id === "markovic_late" && !state.flags.talked_markovic) return false;
  if (def.id === "kadijevic_late" && !state.flags.talked_kadijevic) return false;
  if (def.id === "racan" && (!state.flags.croatia_election_held || state.flags.hdz_croatia)) return false;
  if (def.id === "bogicevic" && !(state.units?.BA?.election_held || state.flags.sda_sds_hdz_bosnia || (state.federal.clock || "") >= "1990-12-03")) return false;
  if (def.id === "tupurkovski" && !(state.units?.MK?.election_held || (state.federal.clock || "") >= "1990-12-01")) return false;
  if (def.id === "gligorov" && !(state.units?.MK?.election_held || clock >= "1991-01-27")) return false;
  if (def.id === "bucin" && clock < "1990-11-01") return false;
  if (def.id === "izetbegovic" && !(state.flags.sda_sds_hdz_bosnia || state.flags.republic_voice_bih_seen || state.flags.talked_bogicevic || state.units?.BA?.election_held)) return false;
  return availableEntries(def, state).length > 0;
}

export function dialogueDone(state, id) {
  return (state.dialogue_done || []).includes(id);
}

export function dialogueVisitCount(state, id) {
  const v = state.dialogue_visits?.[id] || {};
  return Object.keys(v).length;
}

export function dialogueHubStatus(def, state) {
  const entries = availableEntries(def, state);
  if (!dialogueDone(state, def.id) && entries.length) return "open";
  if (entries.some((e) => (e.priority || 0) > 0 || e.node !== "start")) return "revisit";
  if (entries.length) return "revisit";
  if (dialogueDone(state, def.id)) return "done";
  return "locked";
}

export function startDialogue(state, def) {
  if (!def || !isDialogueAvailable(def, state)) {
    return { ok: false, reason: t("dialogue.locked") };
  }
  const entry = pickEntry(def, state);
  if (!entry) return { ok: false, reason: t("dialogue.locked") };
  const from = entry.available_from || (entry.node === "start" ? def.available_from : null);
  if (from && clockOf(state) < from) {
    return { ok: false, reason: t("dialogue.locked") };
  }
  state.activeDialogue = {
    id: def.id,
    node: entry.node,
    entryId: entryKey(entry),
    speaker: def.speaker,
    title: def.title,
  };
  return { ok: true, session: state.activeDialogue, entry };
}

export function currentDialogueNode(catalog, state) {
  const session = state.activeDialogue;
  if (!session) return null;
  const def = (catalog.dialogues || []).find((d) => d.id === session.id);
  if (!def) return null;
  const node = def.nodes?.[session.node];
  if (!node) return null;
  return { def, node, session };
}

export function chooseDialogue(state, catalog, choiceId) {
  const cur = currentDialogueNode(catalog, state);
  if (!cur) return { ok: false, reason: t("dialogue.none") };
  const choice = (cur.node.choices || []).find((c) => c.id === choiceId);
  if (!choice) return { ok: false, reason: t("dialogue.missing") };

  applyDeskEffects(state, choice.effects || {});
  syncDeskFlagsFromPosture(state);
  recomputeFederalControl(state);

  state.log.push({
    date: state.federal.clock,
    kind: "dialogue",
    dialogue: cur.def.id,
    choice: choiceId,
    label: choice.label,
    entry: cur.session.entryId || "start",
  });

  if (choice.next) {
    state.activeDialogue = {
      ...state.activeDialogue,
      node: choice.next,
    };
    return { ok: true, done: false, session: state.activeDialogue };
  }

  // Mark entry visit + dialogue_done
  const visits = visitsFor(state, cur.def.id);
  const ek = cur.session.entryId || "start";
  visits[ek] = true;
  if (!state.dialogue_done) state.dialogue_done = [];
  if (!state.dialogue_done.includes(cur.def.id)) state.dialogue_done.push(cur.def.id);
  state.activeDialogue = null;
  return { ok: true, done: true, line: t("dialogue.closed", { name: cur.def.speaker }) };
}

export function abortDialogue(state) {
  state.activeDialogue = null;
}
