/**
 * Branching institutional dialogue — not an LLM.
 * Choices call applyDeskEffects → flags / federal / desks, which feed
 * control.js, simulation.js, elections.js, and endings.js the same way event cards do.
 *
 * Pass 2: mid/late Slice A trees (markovic_late, kadijevic_late) + Kučan / Tuđman
 * when election flags allow. Choices must set flags that weight outcomes.
 */
import { applyDeskEffects, syncDeskFlagsFromPosture } from "./desks.js";
import { requiresMet } from "./events.js";
import { recomputeFederalControl } from "./control.js";
import { t } from "./i18n.js";

export function listDialogues(catalog, state) {
  const list = catalog?.dialogues || [];
  return list.filter((d) => isDialogueAvailable(d, state));
}

export function isDialogueAvailable(def, state) {
  if (!def) return false;
  const clock = state.federal.clock || "";
  if (def.available_until && clock >= def.available_until) return false;
  if (def.available_from && clock < def.available_from) return false;
  if (def.unlock) {
    const gate = requiresMet(state, def.unlock);
    if (!gate.ok) return false;
  }
  // Historical office holders
  if (def.id === "mesic" && !state.flags.hdz_croatia) return false;
  if (def.id === "tudman" && !state.flags.hdz_croatia) return false;
  if (def.id === "kucan" && !state.flags.slovenia_election_held) return false;
  if (def.id === "drnovsek" && (state.flags.presidency_rotation_jovic || clock >= "1990-05-15")) {
    return false;
  }
  if (def.id === "jovic" && clock < "1990-05-01" && !state.flags.presidency_rotation_jovic) {
    // Available as Serbian member early; highlight after May
  }
  // Late trees require prior talk (also in unlock JSON; belt-and-suspenders)
  if (def.id === "markovic_late" && !state.flags.talked_markovic) return false;
  if (def.id === "kadijevic_late" && !state.flags.talked_kadijevic) return false;
  return true;
}

export function dialogueDone(state, id) {
  return (state.dialogue_done || []).includes(id);
}

export function startDialogue(state, def) {
  if (!def || !isDialogueAvailable(def, state)) {
    return { ok: false, reason: t("dialogue.locked") };
  }
  state.activeDialogue = {
    id: def.id,
    node: "start",
    speaker: def.speaker,
    title: def.title,
  };
  return { ok: true, session: state.activeDialogue };
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
  });

  if (choice.next) {
    state.activeDialogue = {
      ...state.activeDialogue,
      node: choice.next,
    };
    return { ok: true, done: false, session: state.activeDialogue };
  }

  if (!state.dialogue_done) state.dialogue_done = [];
  if (!state.dialogue_done.includes(cur.def.id)) state.dialogue_done.push(cur.def.id);
  state.activeDialogue = null;
  return { ok: true, done: true, line: t("dialogue.closed", { name: cur.def.speaker }) };
}

export function abortDialogue(state) {
  state.activeDialogue = null;
}
