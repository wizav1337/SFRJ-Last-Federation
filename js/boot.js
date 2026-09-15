import { createNewState, saveState, loadSave, hasSave, monthIndex, emptyFlags } from "./state.js";
import { flattenActs, seedQueue, ensureQueue, resolveChoice, currentEvent, spawnNoncomplianceFollowup } from "./events.js";
import { tick, maybeAdvanceMonth } from "./simulation.js";
import { evaluateEndings, evaluateSlice, evaluateCampaignEnd } from "./endings.js";
import { loadMap, bindMap } from "./map.js";
import { runElection } from "./elections.js";
import { applyDirective, needsPresidencyVote } from "./agencies.js";
import { grantReformActions, expireReformActions, applyReform } from "./reforms.js";
import { recomputeFederalControl } from "./control.js";
import { initDesks, grantDeskActions, grantAttentionActions, applyDeskAction } from "./desks.js";
import { startDialogue, chooseDialogue, abortDialogue } from "./dialogue.js";
import { setI18n, t } from "./i18n.js";
import {
  showTitle,
  showEncyclopedia,
  showMain,
  renderAll,
  openModal,
  showPresidencyVote,
  showElectionNight,
  showDirectiveResult,
} from "./ui.js";

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} (${res.status})`);
  return res.json();
}

function bootError(err) {
  const el = document.getElementById("screen-boot");
  el.classList.remove("hidden");
  document.getElementById("screen-title").classList.add("hidden");
  el.innerHTML = `
    <div class="boot-error">
      <p class="kicker">${t("boot.errorTitle")}</p>
      <h1 style="font-family:Libre Baskerville,Georgia,serif">${t("boot.errorTitle")}</h1>
      <p>${err.message}</p>
      <p>${t("boot.errorLead")}</p>
      <p><code>cd sfrj1990<br/>python -m http.server 8080</code></p>
      <p>${t("boot.thenVisit")} <code>http://localhost:8080</code></p>
    </div>`;
}

function attachTitle(game) {
  document.getElementById("btn-new").onclick = () => startNew(game);
  document.getElementById("btn-continue").onclick = () => {
    if (!game.hasSave) return;
    continueSave(game);
  };
  document.getElementById("btn-ency").onclick = () => showEncyclopedia(game);
}

function enterMain(game) {
  ensureQueue(game.state, game.catalogEvents);
  showMain();
  if (game.state.ended) {
    renderAll(game);
    showEndCard(evaluateCampaignEnd(game.state));
    return;
  }
  const ev = currentEvent(game.state, game.catalogEvents);
  if (ev && ev.date > game.state.federal.clock) {
    const prev = game.state.federal.clock;
    game.state.federal.clock = ev.date;
    maybeAdvanceMonth(game.state, prev);
  }
  if (ev && ev.desk && ev.desk !== "REPUBLIKE") game.state.desk = ev.desk;
  grantReformActions(game.state);
  initDesks(game.state, game.catalogs);
  grantDeskActions(game.state);
  renderAll(game);
}

function startNew(game) {
  game.state = createNewState(game.catalogs);
  seedQueue(game.state, game.catalogEvents);
  game.state.federal.turn = monthIndex(game.state.federal.clock);
  initDesks(game.state, game.catalogs);
  recomputeFederalControl(game.state);
  grantReformActions(game.state);
  grantDeskActions(game.state);
  saveState(game.state);
  game.hasSave = true;
  enterMain(game);
}

function continueSave(game) {
  const saved = loadSave();
  if (!saved) {
    startNew(game);
    return;
  }
  game.state = saved;
  game.state.flags = { ...emptyFlags(), ...(game.state.flags || {}) };
  if (!Array.isArray(game.state.log)) game.state.log = [];
  if (game.state.charter_signatures == null) game.state.charter_signatures = 0;
  if (!game.state.mapMode) game.state.mapMode = "raskol";
  if (game.state.reform_actions == null) game.state.reform_actions = 0;
  if (!game.state.reform_month) game.state.reform_month = "";
  if (!game.state.reformFamily) game.state.reformFamily = "skj";
  if (!game.state.desks) game.state.desks = {};
  if (game.state.desk_actions == null) game.state.desk_actions = 0;
  if (!game.state.desk_month) game.state.desk_month = "";
  if (!Array.isArray(game.state.dialogue_done)) game.state.dialogue_done = [];
  if (!game.state.dialogue_visits || typeof game.state.dialogue_visits !== "object") {
    game.state.dialogue_visits = {};
  }
  if (game.state.activeDialogue === undefined) game.state.activeDialogue = null;
  if (game.state.attention_left == null) game.state.attention_left = game.state.reform_actions || 0;
  if (!game.state.attention_month) game.state.attention_month = game.state.reform_month || "";
  if (game.state.attention_spent_desks == null) game.state.attention_spent_desks = 0;
  if (game.state.attention_spent_reforms == null) game.state.attention_spent_reforms = 0;
  if (game.state.save_schema == null || game.state.save_schema < 8) {
    game.state.save_schema = 8; // Pass 8: SSRN + deepen SSP/Finance + late Mesić/Jović
  }
  for (const u of Object.values(game.state.units || {})) {
    if (u.jna_threatened == null) u.jna_threatened = false;
  }
  initDesks(game.state, game.catalogs);
  recomputeFederalControl(game.state);
  grantReformActions(game.state);
  grantDeskActions(game.state);
  enterMain(game);
}

function afterWorldTick(game, previousClock, opts = {}) {
  tick(game.state, "choice");
  let months = 0;
  const next = currentEvent(game.state, game.catalogEvents);
  if (opts.advanceClock) {
    if (next && !next.spawn_only) game.state.federal.clock = next.date;
    months = maybeAdvanceMonth(game.state, previousClock);
    if (next && next.desk && next.desk !== "REPUBLIKE") game.state.desk = next.desk;
  }
  const ending = evaluateEndings(game.state);
  grantReformActions(game.state);
  grantDeskActions(game.state);
  saveState(game.state);
  renderAll(game);
  return { months, ending, next };
}

function showSlice(slice) {
  openModal(`
    <div class="modal dark">
      <p class="kicker">${t("slice.kicker", { id: slice.id })}</p>
      <h2>${slice.title}</h2>
      <p>${slice.flavor}</p>
      <div class="modal-actions"><button class="btn primary" id="modal-close">${t("ui.close")}</button></div>
    </div>`);
}

function showEndCard(end) {
  const reasons = (end.reasons || []).map((r) => `<li>${r}</li>`).join("");
  const flags = (end.flags || []).join(", ") || "none";
  const path = (end.path || []).map((r) => `<li>${r}</li>`).join("");
  const near = (end.near || [])
    .map((n) => `<li><strong>${n.id} ${n.title}</strong> — ${(n.need || []).join("; ")}</li>`)
    .join("");
  const st = end.stats || {};
  const stats = st.legitimacy != null
    ? `<p class="end-stats">${t("end.stats", {
        leg: st.legitimacy,
        war: st.war_risk,
        siv: st.siv,
        ref: st.reform,
        trade: st.trade,
        charter: st.charter,
      })}</p>`
    : "";
  openModal(`
    <div class="modal wide dark" data-lock="true">
      <p class="kicker">${t("end.kicker", { id: end.id, date: end.date })}</p>
      <h2>${end.title}</h2>
      <p>${end.flavor}</p>
      ${stats}
      <p><strong>${t("end.what")}</strong></p>
      <ul>${reasons}</ul>
      ${path ? `<p><strong>${t("end.path")}</strong></p><ul class="path-list">${path}</ul>` : ""}
      ${near ? `<p><strong>${t("end.near")}</strong></p><ul class="near-list">${near}</ul>` : ""}
      <p class="const-note">${t("end.flags", { flags })}</p>
      <div class="modal-actions"><button class="btn primary" id="modal-close">${t("end.close")}</button></div>
    </div>`);
}

function showAftermath(game, { months, ending, election, next }) {
  if (ending) {
    game.state.ended = true;
    saveState(game.state);
    showEndCard({
      ...ending,
      date: game.state.federal.clock,
      flags: Object.entries(game.state.flags).filter(([, v]) => v).map(([k]) => k),
      reasons: ending.reasons || [`war_risk ${game.state.federal.war_risk}`],
    });
    return;
  }
  if (election) {
    showElectionNight(election);
    return;
  }
  if (!next && ((game.state.federal.clock || "") >= "1991-05-15" || game.state.ended)) {
    const end = evaluateCampaignEnd(game.state);
    game.state.ended = true;
    saveState(game.state);
    showEndCard(end);
    return;
  }
  if (!next && (game.state.federal.clock || "") >= "1990-10-01") {
    showSlice(evaluateSlice(game.state));
    return;
  }
  if (months > 0) {
    const rep = game.state.lastMonthlyReport;
    const lines = (rep?.lines || [])
      .map((l) => `<li class="drift-${l.tone || "neutral"}">${l.text}</li>`)
      .join("");
    const drivers = (rep?.drivers || []).map((d) => `<li>${d}</li>`).join("");
    openModal(`
      <div class="modal wide">
        <p class="kicker">${t("drift.kicker")}</p>
        <h2>${game.state.federal.clock.slice(0, 7)}</h2>
        <p>${t("drift.body")}</p>
        ${lines ? `<p><strong>${t("drift.deltas")}</strong></p><ul class="drift-list">${lines}</ul>` : ""}
        ${drivers ? `<p><strong>${t("drift.drivers")}</strong></p><ul class="drift-drivers">${drivers}</ul>` : ""}
        <div class="modal-actions"><button class="btn primary" id="modal-close">${t("drift.continue")}</button></div>
      </div>`);
  }
}

function commitChoice(game, event, choice, vote = {}) {
  applyDeskVoteAftermath(game.state, vote);
  if (!event.spawn_only) expireReformActions(game.state);
  const previousClock = game.state.federal.clock;
  if (vote.usedEmergency || choice.legal === "emergency") {
    const fx = choice.effects ? { ...choice.effects } : {};
    const flags = Array.isArray(fx.flags_add) ? fx.flags_add.slice() : [];
    if (!flags.includes("player_used_emergency")) flags.push("player_used_emergency");
    fx.flags_add = flags;
    if (vote.usedEmergency && choice.legal !== "emergency") {
      fx["federal.legitimacy"] = (fx["federal.legitimacy"] || 0) - 10;
      fx["federal.presidency_cohesion"] = (fx["federal.presidency_cohesion"] || 0) - 6;
    }
    choice = { ...choice, effects: fx };
  }
  const result = resolveChoice(game.state, event, choice, game.catalogEvents);
  if (!result.ok) {
    openModal(`
      <div class="modal">
        <h2>${t("vote.unavailable")}</h2>
        <p>${result.reason}</p>
        <div class="modal-actions"><button class="btn primary" id="modal-close">${t("ui.close")}</button></div>
      </div>`);
    return;
  }
  let election = null;
  if (event.election) election = runElection(game.state, event.election);
  const aftermath = afterWorldTick(game, previousClock, { advanceClock: true });
  if (result.noncompliance && !aftermath.ending) {
    const u = game.state.units[result.noncompliance];
    openModal(`
      <div class="modal dark">
        <p class="kicker">${t("dir.ncKicker")}</p>
        <h2>${u ? u.name : t("dir.ncTitle")}</h2>
        <p>${t("dir.ncModal")}</p>
        <div class="modal-actions"><button class="btn primary" id="modal-close">${t("dir.openFile")}</button></div>
      </div>`);
    return;
  }
  showAftermath(game, { ...aftermath, election });
}


function applyDeskVoteAftermath(state, vote = {}) {
  const mod = vote.deskMod;
  if (!mod) return;
  const f = state.federal;
  const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));
  if (mod.net > 0) {
    f.presidency_cohesion = clamp(f.presidency_cohesion + Math.min(2, mod.softFor));
  } else if (mod.net < 0) {
    f.presidency_cohesion = clamp(f.presidency_cohesion - Math.min(2, mod.softAgainst));
  }
  if (vote.usedEmergency && mod.emergencyPenalty) {
    f.legitimacy = clamp(f.legitimacy - 2 * mod.emergencyPenalty);
    f.war_risk = clamp(f.war_risk + mod.emergencyPenalty);
  }
  if (state.flags.confederal_talks_open && mod.softAgainst >= 2) {
    state.flags.desk_conflict_soft_lock = true;
  }
}

function onChoice(game, event, choice) {
  if (needsPresidencyVote(choice.legal)) {
    showPresidencyVote(game, {
      legal: choice.legal,
      title: event.title,
      onPass: (vote) => commitChoice(game, event, choice, vote),
      onWithdraw: () => renderAll(game),
    });
    return;
  }
  commitChoice(game, event, choice, {});
}

function commitDirective(game, directive, vote = {}) {
  applyDeskVoteAftermath(game.state, vote);
  const previousClock = game.state.federal.clock;
  const result = applyDirective(game.state, directive, {
    usedEmergency: !!vote.usedEmergency,
    unitId: game.state.selectedUnit,
  });
  if (result.noncompliance && (game.state.federal.clock || "") >= "1990-07-01") {
    spawnNoncomplianceFollowup(game.state, {
      unitId: result.unitId,
      source: `${directive.action} ${directive.target}`,
    });
  }
  afterWorldTick(game, previousClock, { advanceClock: false });
  showDirectiveResult(result);
}

function commitReform(game, reform, vote = {}) {
  applyDeskVoteAftermath(game.state, vote);
  const previousClock = game.state.federal.clock;
  const result = applyReform(game.state, reform, { usedEmergency: !!vote.usedEmergency });
  if (!result.ok) {
    openModal(`
      <div class="modal">
        <h2>${t("vote.unavailable")}</h2>
        <p>${result.reason}</p>
        <div class="modal-actions"><button class="btn primary" id="modal-close">${t("ui.close")}</button></div>
      </div>`);
    return;
  }
  afterWorldTick(game, previousClock, { advanceClock: false });
  showDirectiveResult(result);
}

function onReform(game, reform) {
  if (reform.blocked) return;
  if (needsPresidencyVote(reform.legal)) {
    showPresidencyVote(game, {
      legal: reform.legal,
      title: reform.label,
      onPass: (vote) => commitReform(game, reform, vote),
      onWithdraw: () => renderAll(game),
    });
    return;
  }
  commitReform(game, reform, {});
}

function onDirective(game, directive) {
  if (directive.blocked) return;
  if (needsPresidencyVote(directive.legal)) {
    showPresidencyVote(game, {
      legal: directive.legal,
      title: `${directive.action} · ${directive.target}`,
      onPass: (vote) => commitDirective(game, directive, vote),
      onWithdraw: () => renderAll(game),
    });
    return;
  }
  commitDirective(game, directive, {});
}


function onDeskAction(game, deskId, actionId) {
  const previousClock = game.state.federal.clock;
  const result = applyDeskAction(game.state, game.catalogs, deskId, actionId);
  if (!result.ok) {
    openModal(`
      <div class="modal">
        <h2>${t("vote.unavailable")}</h2>
        <p>${result.reason}</p>
        <div class="modal-actions"><button class="btn primary" id="modal-close">${t("ui.close")}</button></div>
      </div>`);
    return;
  }
  afterWorldTick(game, previousClock, { advanceClock: false });
  showDirectiveResult({ line: result.line, noncompliance: false });
}

function onDialogueStart(game, dialogueId) {
  const def = (game.catalogs.dialogues || []).find((d) => d.id === dialogueId);
  const result = startDialogue(game.state, def);
  if (!result.ok) {
    openModal(`
      <div class="modal">
        <h2>${t("dialogue.locked")}</h2>
        <p>${result.reason || ""}</p>
        <div class="modal-actions"><button class="btn primary" id="modal-close">${t("ui.close")}</button></div>
      </div>`);
    return;
  }
  saveState(game.state);
  // UI module opens the panel via render callback
  if (typeof game.openDialoguePanel === "function") game.openDialoguePanel();
}

function onDialogueChoice(game, choiceId) {
  const previousClock = game.state.federal.clock;
  const result = chooseDialogue(game.state, game.catalogs, choiceId);
  if (!result.ok) {
    openModal(`
      <div class="modal">
        <h2>${t("dialogue.none")}</h2>
        <p>${result.reason || ""}</p>
        <div class="modal-actions"><button class="btn primary" id="modal-close">${t("ui.close")}</button></div>
      </div>`);
    return;
  }
  if (result.done) {
    afterWorldTick(game, previousClock, { advanceClock: false });
    showDirectiveResult({ line: result.line || t("dialogue.closed", { name: "" }), noncompliance: false });
    return;
  }
  saveState(game.state);
  if (typeof game.openDialoguePanel === "function") game.openDialoguePanel();
}

function fillChrome() {

  document.documentElement.lang = "hr";
  document.title = t("html.title");
  const bootK = document.querySelector("#screen-boot .kicker");
  const bootSub = document.querySelector("#screen-boot .subtitle");
  if (bootK) bootK.textContent = t("boot.kicker");
  if (bootSub) bootSub.textContent = t("boot.sub");
  const tk = document.querySelector("#screen-title .kicker");
  const ts = document.querySelector("#screen-title .subtitle");
  const tp = document.querySelector("#screen-title .pitch");
  const td = document.querySelector("#screen-title .disclaimer");
  if (tk) tk.textContent = t("title.kicker");
  if (ts) ts.textContent = t("title.sub");
  if (tp) tp.textContent = t("title.pitch");
  if (td) td.textContent = t("title.disclaimer");
  const bn = document.getElementById("btn-new");
  const bc = document.getElementById("btn-continue");
  const be = document.getElementById("btn-ency");
  if (bn) bn.textContent = t("title.new");
  if (bc) bc.textContent = t("title.continue");
  if (be) be.textContent = t("title.ency");
  const legend = document.querySelector(".map-legend");
  if (legend) {
    legend.innerHTML = `${t("legend.trust")}<div class="legend-scale" aria-hidden="true"></div>${t("legend.secession")}`;
  }
  const strip = document.getElementById("agency-strip");
  if (strip) strip.setAttribute("aria-label", t("ency.organs"));
}

async function boot() {
  try {
    const [hr, en] = await Promise.all([
      loadJSON("data/i18n/hr.json"),
      loadJSON("data/i18n/en.json").catch(() => ({})),
    ]);
    setI18n(hr, en);
    fillChrome();

    const [units, parties, agencies, act1, act2, act3, act4, act5, documents, desks, dMarkovic, dKadijevic, dJovic, dMesic, dDrnovsek, dKucan, dTudman, dMarkovicLate, dKadijevicLate, dBogicevic, dTupurkovski, dRacan, dGligorov, dBucin, dIzetbegovic, dBulatovic, dMesicLate, dJovicLate, dLoncar, dBuzadzic, dBajramovic, dKostic, dGracanin, dGacic, dMirjanic, dSanto] = await Promise.all([
      loadJSON("data/units.json"),
      loadJSON("data/parties.json"),
      loadJSON("data/agencies.json"),
      loadJSON("data/events/act1.json"),
      loadJSON("data/events/act2.json"),
      loadJSON("data/events/act3.json"),
      loadJSON("data/events/act4.json"),
      loadJSON("data/events/act5.json"),
      loadJSON("data/documents.json"),
      loadJSON("data/desks.json"),
      loadJSON("data/dialogue/markovic.json"),
      loadJSON("data/dialogue/kadijevic.json"),
      loadJSON("data/dialogue/jovic.json"),
      loadJSON("data/dialogue/mesic.json"),
      loadJSON("data/dialogue/drnovsek.json"),
      loadJSON("data/dialogue/kucan.json"),
      loadJSON("data/dialogue/tudman.json"),
      loadJSON("data/dialogue/markovic_late.json"),
      loadJSON("data/dialogue/kadijevic_late.json"),
      loadJSON("data/dialogue/bogicevic.json"),
      loadJSON("data/dialogue/tupurkovski.json"),
      loadJSON("data/dialogue/racan.json"),
      loadJSON("data/dialogue/gligorov.json"),
      loadJSON("data/dialogue/bucin.json"),
      loadJSON("data/dialogue/izetbegovic.json"),
      loadJSON("data/dialogue/bulatovic.json"),
      loadJSON("data/dialogue/mesic_late.json"),
      loadJSON("data/dialogue/jovic_late.json"),
      loadJSON("data/dialogue/loncar.json"),
      loadJSON("data/dialogue/buzadzic.json"),
      loadJSON("data/dialogue/bajramovic.json"),
      loadJSON("data/dialogue/kostic.json"),
      loadJSON("data/dialogue/gracanin.json"),
      loadJSON("data/dialogue/gacic.json"),
      loadJSON("data/dialogue/mirjanic.json"),
      loadJSON("data/dialogue/santo.json"),
    ]);

    const catalogs = {
      units,
      parties,
      agencies,
      documents,
      desks: desks.desks || desks,
      dialogues: [dMarkovic, dKadijevic, dJovic, dMesic, dDrnovsek, dKucan, dTudman, dMarkovicLate, dKadijevicLate, dBogicevic, dTupurkovski, dRacan, dGligorov, dBucin, dIzetbegovic, dBulatovic, dMesicLate, dJovicLate, dLoncar, dBuzadzic, dBajramovic, dKostic, dGracanin, dGacic, dMirjanic, dSanto],
    };
    const catalogEvents = flattenActs([act1, act2, act3, act4, act5]);

    const game = {
      catalogs,
      catalogEvents,
      state: null,
      hasSave: hasSave(),
      onChoice(event, choice) {
        onChoice(game, event, choice);
      },
      onDirective(directive) {
        onDirective(game, directive);
      },
      onReform(reform) {
        onReform(game, reform);
      },
      onDeskAction(deskId, actionId) {
        onDeskAction(game, deskId, actionId);
      },
      onDialogueStart(dialogueId) {
        onDialogueStart(game, dialogueId);
      },
      onDialogueChoice(choiceId) {
        onDialogueChoice(game, choiceId);
      },
    };

    await loadMap(document.getElementById("map-stage"));
    bindMap(
      (id) => {
        if (!game.state) return;
        game.state.selectedUnit = id;
        renderAll(game);
      },
      () => game.state
    );

    document.getElementById("screen-boot").classList.add("hidden");
    attachTitle(game);
    showTitle(game);
  } catch (err) {
    console.error(err);
    bootError(err);
  }
}

boot();
