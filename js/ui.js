import {
  DESKS,
  STAT_BARS,
  UNIT_IDS,
  presidencyTally,
} from "./state.js";
import { t, formatDateHr, plannedLabel, legalLabelHr, statusLabel, typeLabel } from "./i18n.js";
import { currentEvent, requiresMet, documentFor } from "./events.js";
import {
  workshopAgencies,
  directivesFor,
  chairName,
  seatHolder,
  needsPresidencyVote,
} from "./agencies.js";
import { paintMap, refreshTip } from "./map.js";
import { idleBrief } from "./endings.js";
import { controlBand, obeysBelgrade } from "./control.js";
import { reformsFor, REFORM_FAMILIES, reformCap } from "./reforms.js";
import {
  listDesks,
  deskRuntime,
  actionsForDesk,
  deskCap,
  deskStatusLabel,
} from "./desks.js";
import {
  listDialogues,
  currentDialogueNode,
  dialogueDone,
} from "./dialogue.js";

const EMBLEM = `
<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
  <circle cx="14" cy="14" r="13" fill="none" stroke="#c4a35a" stroke-width="1.4"/>
  <path d="M14 5 L16.2 11.2 L23 11.4 L17.6 15.4 L19.6 22 L14 18.4 L8.4 22 L10.4 15.4 L5 11.4 L11.8 11.2 Z" fill="#c4a35a"/>
</svg>`;

function $(id) {
  return document.getElementById(id);
}

function showScreen(id) {
  for (const el of document.querySelectorAll(".screen")) el.classList.add("hidden");
  $(id).classList.remove("hidden");
}

export function showTitle(game) {
  showScreen("screen-title");
  $("btn-continue").disabled = !game.hasSave;
}

export function showEncyclopedia(game) {
  showScreen("screen-encyclopedia");
  const units = game.catalogs.units.units
    .map((u) => `<li><strong>${u.id}</strong> — ${u.name} (${u.capital}), ${typeLabel(u.type)}</li>`)
    .join("");
  const parties = game.catalogs.parties.parties
    .map((p) => `<li><strong>${p.name}</strong>${p.full ? " — " + p.full : ""} · ${p.unit} · ${p.leader}</li>`)
    .join("");
  const agencies = game.catalogs.agencies.agencies
    .map((a) => `<li><strong>${a.name}</strong> — ${a.competence}</li>`)
    .join("");
  const endings = ["E1", "E2", "E3", "E4", "E5"]
    .map((id) => `<li><strong>${id}</strong> — ${t("end." + id + ".title")}: ${t("end." + id + ".flavor", { date: "…" })}</li>`)
    .join("");
  const timeline = `
    <li><strong>sij 1990.</strong> — 14. kongres SKJ, odricanje vodeće uloge</li>
    <li><strong>velj–ožu 1990.</strong> — višestranački zakoni; stand-by / dinar</li>
    <li><strong>tra–svi 1990.</strong> — izbori SI/HR; rotacija Jović</li>
    <li><strong>srp–ruj 1990.</strong> — srpski referendum/ustav; balvani; suverenost</li>
    <li><strong>lis–pro 1990.</strong> — carine; izbori MK/BA/RS–ME; plebiscit SI</li>
    <li><strong>sij–ožu 1991.</strong> — SIV vs kabineti; razoružanje; Pakrac; 9. ožujak</li>
    <li><strong>tra–svi 1991.</strong> — konfederalni nacrt; rotacija Mesić; kraj odsječka A</li>`;
  $("ency-body").innerHTML = `
    <p class="kicker" style="color:#8a7340">${t("ency.kicker")}</p>
    <h1>SFRJ 1990</h1>
    <p>${t("ency.p1")}</p>
    <p>${t("ency.p2")}</p>
    <p>${t("ency.p3")}</p>
    <h2>${t("ency.timeline")}</h2>
    <ul class="ency-timeline">${timeline}</ul>
    <h2>${t("ency.endings")}</h2>
    <ul>${endings}</ul>
    <p class="const-note">${t("e3.rule")}</p>
    <h2>${t("ency.units")}</h2>
    <ul>${units}</ul>
    <h2>${t("ency.parties")}</h2>
    <div class="ency-grid"><ul>${parties}</ul></div>
    <h2>${t("ency.organs")}</h2>
    <ul>${agencies}</ul>
    <h2>${t("ency.desks")}</h2>
    <ul>${(game.catalogs.desks || []).map((d) => `<li><strong>${d.name_hr || d.name}</strong> — ${d.briefing}</li>`).join("")}</ul>
    <h2>${t("ency.dialogue")}</h2>
    <p>${t("ency.dialogueBody")}</p>
    <ul>${(game.catalogs.dialogues || []).map((d) => `<li><strong>${d.speaker}</strong> — ${d.title}</li>`).join("")}</ul>
    <div class="modal-actions">
      <button class="btn primary" id="ency-back">${t("ency.back")}</button>
    </div>
  `;
  $("ency-back").onclick = () => showTitle(game);
}

export function showMain() {
  showScreen("screen-main");
}

function meter(label, value, opts = {}) {
  const warn = opts.warn ? " warn" : "";
  const hidden = opts.hidden ? " hidden-risk" : "";
  const shown = opts.hidden ? "—" : String(value);
  return `
    <div class="meter${warn}${hidden}">
      <div class="lbl">${label}</div>
      <div class="val">${shown}</div>
      <div class="bar"><i style="width:${opts.hidden ? 0 : value}%"></i></div>
    </div>`;
}

export function renderTopbar(game) {
  const s = game.state;
  const f = s.federal;
  const warHidden = f.war_risk < 40;
  const seats = UNIT_IDS.map(
    (id) => `<span class="seat ${s.presidency[id] ? "on" : "off"}" title="${id}"></span>`
  ).join("");
  $("topbar").innerHTML = `
    <div class="brand">${EMBLEM}<div class="brand-name"><span>SFRJ 1990</span>${t("brand.sub")}</div></div>
    <div class="clock">${formatDateHr(f.clock)}</div>
    <div class="desks">
      ${DESKS.map(
        (d) =>
          `<button class="desk ${s.desk === d.id ? "active" : ""} ${d.readonly ? "readonly" : ""}" data-desk="${d.id}">${t("desk." + d.id)}</button>`
      ).join("")}
    </div>
    ${meter(t("meter.legitimacy"), f.legitimacy)}
    ${meter(t("meter.siv"), f.siv_authority)}
    ${meter(warHidden ? t("meter.war") : t("meter.incident"), f.war_risk, { hidden: warHidden, warn: !warHidden })}
    ${meter(t("meter.budget"), f.federal_budget)}
    ${meter(t("meter.reform"), f.reform_momentum)}
    <div class="meter">
      <div class="lbl">${t("meter.presidency", { n: presidencyTally(s) })}</div>
      <div class="seats">${seats}</div>
    </div>
    <div class="map-mode" role="group" aria-label="${t("map.mode")}">
      <button type="button" class="desk ${s.mapMode !== "control" ? "active" : ""}" data-mapmode="raskol">${t("map.mode.raskol")}</button>
      <button type="button" class="desk ${s.mapMode === "control" ? "active" : ""}" data-mapmode="control">${t("map.mode.control")}</button>
    </div>
  `;
  $("topbar").querySelectorAll("[data-desk]").forEach((btn) => {
    btn.addEventListener("click", () => {
      game.state.desk = btn.getAttribute("data-desk");
      renderAll(game);
    });
  });
  $("topbar").querySelectorAll("[data-mapmode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      game.state.mapMode = btn.getAttribute("data-mapmode");
      renderAll(game);
    });
  });
  const legend = document.querySelector(".map-legend");
  if (legend) {
    if (s.mapMode === "control") {
      legend.innerHTML = `${t("legend.control.listen")}<div class="legend-scale legend-control" aria-hidden="true"></div>${t("legend.control.out")}`;
    } else {
      legend.innerHTML = `${t("legend.trust")}<div class="legend-scale" aria-hidden="true"></div>${t("legend.secession")}`;
    }
  }
}

export function renderInspector(game) {
  const id = game.state.selectedUnit;
  const u = game.state.units[id];
  const parties = game.state.parties
    .filter((p) => p.unit === id)
    .sort((a, b) => b.support - a.support)
    .slice(0, 3);
  const stats = STAT_BARS.map((st) => {
    const v = u[st.key];
    return `
      <div class="stat-row">
        <span class="name">${t("stat." + st.key)}</span>
        <span class="num">${v}</span>
        <div class="stat-bar ${st.kind || ""}"><i style="width:${v}%"></i></div>
      </div>`;
  }).join("");
  const partyHtml = parties.length
    ? parties
        .map(
          (p) => `
        <div class="party ${p.in_government ? "in-gov" : ""}">
          <span class="name">${p.name}</span>
          <span>${p.support}</span>
          <span class="full">${p.full} · ${p.leader}</span>
        </div>`
        )
        .join("")
    : `<p class="full">${t("insp.noParties")}</p>`;

  $("inspector").innerHTML = `
    <div class="insp-head">
      <div class="insp-kicker">${typeLabel(u.type)} · ${u.id}</div>
      <h2>${u.name}</h2>
      <div class="insp-meta">${u.name_local} · ${t("insp.capital", { c: u.capital })}</div>
      <div class="gov-tag">${t("gov." + u.government_type)}</div>
      <p class="ctrl-line"><span class="ctrl-pip ${controlBand(u.federal_control)}">${t("insp.control", { n: u.federal_control ?? 0, band: t("ctrl." + controlBand(u.federal_control)) })}</span></p>
      <p class="insp-heat">${t("insp.heatline", { heat: u.nationalist_heat, tension: u.interethnic_tension, trade: game.state.federal.inter_republic_trade })}</p>
    </div>
    <div class="insp-body">
      ${stats}
      <div class="insp-section">
        <h3>${t("insp.parties")}</h3>
        ${partyHtml}
      </div>
      <div class="insp-section">
        <h3>${t("insp.quarter")}</h3>
        <p class="planned">${plannedLabel(u.planned_move)}</p>
      </div>
      <div class="insp-section">
        <h3>${t("insp.force")}</h3>
        <div class="force-icons">
          <div class="force"><b>JNA</b> ${t("insp.jna", { n: u.jna_presence })}</div>
          <div class="force ${obeysBelgrade(u) ? "obey" : "deaf"}"><b>${obeysBelgrade(u) ? t("insp.obey") : t("insp.deaf")}</b></div>
          <div class="force"><b>TO</b> ${t("insp.to", { n: u.to_control })}</div>
        </div>
      </div>
    </div>
  `;
}

export function renderAgencies(game) {
  const list = workshopAgencies(game.state);
  const left = game.state.reform_actions ?? 0;
  const cap = reformCap(game.state);
  const dLeft = game.state.desk_actions ?? 0;
  const dCap = deskCap(game.state);
  $("agency-strip").innerHTML =
    `<button class="agency reform-btn" data-reform="1">
        <div class="aid">${t("reform.kicker")}</div>
        <div class="aname">${t("reform.btn")}</div>
        <div class="status-pip active">${t("reform.left", { n: left, cap })}</div>
      </button>` +
    `<button class="agency desk-hub-btn" data-desks="1">
        <div class="aid">${t("desk.hubAid")}</div>
        <div class="aname">${t("desk.hub")}</div>
        <div class="status-pip active">${t("desk.left", { n: dLeft, cap: dCap })}</div>
      </button>` +
    `<button class="agency chat-hub-btn" data-chat="1">
        <div class="aid">${t("dialogue.hubAid")}</div>
        <div class="aname">${t("dialogue.hub")}</div>
        <div class="status-pip active">${t("dialogue.hubPip")}</div>
      </button>` +
    list
      .map(
        (a) => `
      <button class="agency" data-agency="${a.id}">
        <div class="aid">${a.desk}</div>
        <div class="aname">${a.name}</div>
        <div class="status-pip ${a.status}">${statusLabel(a.status)}</div>
      </button>`
      )
      .join("");
  $("agency-strip").querySelector("[data-reform]")?.addEventListener("click", () => showReformDesk(game));
  $("agency-strip").querySelector("[data-desks]")?.addEventListener("click", () => showDeskHub(game));
  $("agency-strip").querySelector("[data-chat]")?.addEventListener("click", () => showDialogueHub(game));
  $("agency-strip").querySelectorAll("[data-agency]").forEach((btn) => {
    btn.addEventListener("click", () => openAgency(game, btn.getAttribute("data-agency")));
  });
  game.openDialoguePanel = () => showDialoguePanel(game);
}

function openAgency(game, id) {
  showWorkshop(game, id);
}

export function showWorkshop(game, focusId) {
  const state = game.state;
  const id = focusId || workshopAgencies(state)[0]?.id;
  const a = state.agencies.find((x) => x.id === id);
  if (!a) return;
  const unit = state.units[state.selectedUnit];
  const dirs = directivesFor(a, state);
  const switcher = workshopAgencies(state)
    .map(
      (x) =>
        `<button type="button" class="desk ${x.id === a.id ? "active" : ""}" data-switch="${x.id}">${x.id}</button>`
    )
    .join("");
  const actions = dirs
    .map((d) => {
      const vote = needsPresidencyVote(d.legal)
        ? t("workshop.vote", { n: d.needs_votes })
        : "";
      const nc = t("workshop.nc", { pct: (d.noncompliance_chance * 100) | 0, id: unit.id });
      return `
        <button class="choice ${d.legal} ${d.blocked ? "blocked" : ""}" data-dir="${d.action}" ${d.blocked ? "disabled" : ""}>
          <span class="legal">${t("workshop." + d.action)} · ${legalLabelHr(d.legal)}${vote} · ${t("workshop.leg", { n: d.legitimacy_cost })}</span>
          <span class="label">${d.blocked ? d.block_reason : d.label}</span>
          <span class="legal">${nc}</span>
        </button>`;
    })
    .join("");
  openModal(`
    <div class="modal wide">
      <p class="kicker" style="color:#8a7340">${t("workshop.kicker", { kind: t("kind." + a.kind), desk: a.desk })}</p>
      <h2>${a.name}</h2>
      <p>${a.competence}</p>
      <p><strong>${t("workshop.status")}:</strong> ${statusLabel(a.status)} ·
         <strong>${t("workshop.ncTarget")}:</strong> ${unit.name} (${t("workshop.selected")})</p>
      <div class="desks" style="margin:10px 0 14px">${switcher}</div>
      <div class="event-choices" style="padding:0;grid-template-columns:1fr 1fr">${actions}</div>
      <p style="color:#5c5c5c;font-size:12px;margin-top:12px">${t("workshop.note")}</p>
      <div class="modal-actions"><button class="btn" id="modal-close">${t("workshop.close")}</button></div>
    </div>
  `);
  document.querySelectorAll("[data-switch]").forEach((btn) => {
    btn.addEventListener("click", () => showWorkshop(game, btn.getAttribute("data-switch")));
  });
  document.querySelectorAll("[data-dir]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = dirs.find((x) => x.action === btn.getAttribute("data-dir"));
      if (!d || d.blocked) return;
      game.onDirective(d);
    });
  });
}

export function showReformDesk(game, family) {
  const state = game.state;
  const fam = family || state.reformFamily || "skj";
  state.reformFamily = fam;
  const unit = state.units[state.selectedUnit];
  const dirs = reformsFor(state, fam);
  const switcher = REFORM_FAMILIES.map(
    (id) =>
      `<button type="button" class="desk ${id === fam ? "active" : ""}" data-rfam="${id}">${t("reform.fam." + id)}</button>`
  ).join("");
  const actions = dirs
    .map((d) => {
      const vote = needsPresidencyVote(d.legal) ? t("workshop.vote", { n: d.needs_votes }) : "";
      return `
        <button class="choice ${d.legal} ${d.blocked ? "blocked" : ""}" data-reform-id="${d.id}" ${d.blocked ? "disabled" : ""}>
          <span class="legal">${legalLabelHr(d.legal)}${vote} · ${t("workshop.leg", { n: d.legitimacy_cost })}</span>
          <span class="label">${d.blocked ? d.block_reason : d.label}</span>
        </button>`;
    })
    .join("");
  openModal(`
    <div class="modal wide">
      <p class="kicker" style="color:#8a7340">${t("reform.kicker")} · ${t("reform.left", { n: state.reform_actions || 0, cap: reformCap(state) })}</p>
      <h2>${t("reform.title")}</h2>
      <p>${t("reform.note", { name: unit?.name || "" })}</p>
      <div class="desks" style="margin:10px 0 14px">${switcher}</div>
      <div class="event-choices" style="padding:0;grid-template-columns:1fr 1fr">${actions}</div>
      <div class="modal-actions"><button class="btn" id="modal-close">${t("workshop.close")}</button></div>
    </div>
  `);
  document.querySelectorAll("[data-rfam]").forEach((btn) => {
    btn.addEventListener("click", () => showReformDesk(game, btn.getAttribute("data-rfam")));
  });
  document.querySelectorAll("[data-reform-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = dirs.find((x) => x.id === btn.getAttribute("data-reform-id"));
      if (!d || d.blocked) return;
      game.onReform(d);
    });
  });
}

export function renderEvent(game) {
  const ev = currentEvent(game.state, game.catalogEvents);
  const panel = $("event-panel");
  if (!ev) {
    const brief = idleBrief(game.state);
    panel.innerHTML = `
      <div class="event-copy">
        <div class="event-flags"><span class="badge">${t("event.dispatchClosed")}</span></div>
        <h2>${brief.title}</h2>
        <p class="briefing">${brief.body}</p>
        <p class="const-note">${t("meter.legitimacy")} ${brief.legitimacy} · SKJ ${brief.skj_unity} · ${t("meter.war")} ${brief.war_risk < 40 ? "—" : brief.war_risk}.</p>
      </div>
      <div class="event-choices idle-event">
        <p>${t("event.saveHint")}</p>
      </div>`;
    return;
  }

  const docs = (ev.documents || [])
    .map((id) => {
      const d = documentFor(game.catalogs, id);
      return `<button type="button" data-doc="${id}">${d ? d.title.split("—")[0].trim() : id}</button>`;
    })
    .join("");

  const choices = (ev.choices || [])
    .map((c) => {
      const gate = requiresMet(game.state, c.requires);
      const locked = !!c.locked || !gate.ok;
      const why = c.lock_reason || gate.reason || "";
      const legal = legalLabelHr(c.legal);
      return `
        <button class="choice ${c.legal || ""} ${locked ? "blocked" : ""}" data-choice="${c.id}" ${locked ? "disabled" : ""} title="${locked ? why : ""}">
          <span class="legal">${legal}${locked ? " · " + t("event.locked") : ""}</span>
          <span class="label">${c.label}${locked && why ? " — " + why : ""}</span>
        </button>`;
    })
    .join("");

  panel.innerHTML = `
    <div class="event-copy">
      <div class="event-flags">
        <span class="badge desk">${t("desk." + ev.desk)}</span>
        <span class="badge">${t("priority." + ev.priority)}</span>
        <span class="badge">${ev.location || ""}</span>
      </div>
      <h2>${ev.title}</h2>
      <p class="briefing">${ev.briefing}</p>
      ${ev.constitutional_note ? `<p class="const-note">${ev.constitutional_note}</p>` : ""}
      ${docs ? `<div class="doc-links">${docs}</div>` : ""}
    </div>
    <div class="event-choices">${choices}</div>
  `;

  panel.querySelectorAll("[data-choice]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = ev.choices.find((c) => c.id === btn.getAttribute("data-choice"));
      game.onChoice(ev, choice);
    });
  });
  panel.querySelectorAll("[data-doc]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = documentFor(game.catalogs, btn.getAttribute("data-doc"));
      if (!d) return;
      openModal(`
        <div class="modal">
          <p class="kicker" style="color:#8a7340">${t("doc.kicker", { kind: t("kind." + d.kind) })}</p>
          <h2>${d.title}</h2>
          <p>${d.text}</p>
          <div class="modal-actions"><button class="btn primary" id="modal-close">${t("ui.close")}</button></div>
        </div>`);
    });
  });
}


export function showDeskHub(game, focusId) {
  const catalog = game.catalogs;
  const desks = listDesks(catalog);
  const id = focusId || desks[0]?.id || "jna";
  const def = desks.find((d) => d.id === id);
  const rt = deskRuntime(game.state, id);
  if (!def || !rt) return;
  const switcher = desks
    .map(
      (d) =>
        `<button type="button" class="desk ${d.id === id ? "active" : ""}" data-desk-switch="${d.id}">${d.name}</button>`
    )
    .join("");
  const actions = actionsForDesk(game.state, catalog, id)
    .map((a) => {
      const costBits = [];
      if (a.reformCost) costBits.push(t("desk.costReform", { n: a.reformCost }));
      if (a.budgetCost) costBits.push(t("desk.costBudget", { n: a.budgetCost }));
      return `
        <button class="choice political ${a.blocked ? "blocked" : ""}" data-desk-act="${a.id}" ${a.blocked ? "disabled" : ""}>
          <span class="legal">${costBits.join(" · ") || t("desk.costFree")}${a.blocked ? " · " + t("event.locked") : ""}</span>
          <span class="label">${a.blocked ? a.block_reason : a.label}</span>
        </button>`;
    })
    .join("");
  openModal(`
    <div class="modal wide desk-modal">
      <p class="kicker" style="color:#8a7340">${t("desk.kicker")} · ${t("desk.left", { n: game.state.desk_actions || 0, cap: deskCap(game.state) })}</p>
      <h2>${def.name_hr || def.name}</h2>
      <p>${def.briefing}</p>
      <div class="desk-stats">
        <div class="desk-stat"><span>${t("desk.stat.loyalty")}</span><b>${rt.loyalty}</b><div class="stat-bar"><i style="width:${rt.loyalty}%"></i></div></div>
        <div class="desk-stat"><span>${t("desk.stat.capacity")}</span><b>${rt.capacity}</b><div class="stat-bar"><i style="width:${rt.capacity}%"></i></div></div>
        <div class="desk-stat"><span>${t("desk.stat.agenda")}</span><b>${rt.agenda_tension}</b><div class="stat-bar heat"><i style="width:${rt.agenda_tension}%"></i></div></div>
        <div class="desk-stat posture"><span>${t("desk.stat.posture")}</span><b>${deskStatusLabel(rt.posture)}</b></div>
      </div>
      <div class="desks" style="margin:10px 0 14px">${switcher}</div>
      <div class="event-choices" style="padding:0;grid-template-columns:1fr 1fr">${actions}</div>
      <p class="const-note">${t("desk.coupling")}</p>
      <div class="modal-actions"><button class="btn" id="modal-close">${t("workshop.close")}</button></div>
    </div>
  `);
  document.querySelectorAll("[data-desk-switch]").forEach((btn) => {
    btn.addEventListener("click", () => showDeskHub(game, btn.getAttribute("data-desk-switch")));
  });
  document.querySelectorAll("[data-desk-act]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.getAttribute("data-desk-act");
      game.onDeskAction(id, act);
    });
  });
}

export function showDialogueHub(game) {
  const list = listDialogues(game.catalogs, game.state);
  const rows = list
    .map((d) => {
      const done = dialogueDone(game.state, d.id);
      return `
        <button class="choice political ${done ? "done-chat" : ""}" data-dlg="${d.id}">
          <span class="legal">${d.desk || "—"} · ${done ? t("dialogue.done") : t("dialogue.open")}</span>
          <span class="label">${d.speaker} — ${d.title}</span>
        </button>`;
    })
    .join("");
  openModal(`
    <div class="modal wide">
      <p class="kicker" style="color:#8a7340">${t("dialogue.kicker")}</p>
      <h2>${t("dialogue.title")}</h2>
      <p>${t("dialogue.intro")}</p>
      <div class="event-choices" style="padding:0;grid-template-columns:1fr">${rows || `<p>${t("dialogue.empty")}</p>`}</div>
      <div class="modal-actions"><button class="btn" id="modal-close">${t("workshop.close")}</button></div>
    </div>
  `);
  document.querySelectorAll("[data-dlg]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeModal();
      game.onDialogueStart(btn.getAttribute("data-dlg"));
    });
  });
}

export function showDialoguePanel(game) {
  const cur = currentDialogueNode(game.catalogs, game.state);
  if (!cur) {
    showDialogueHub(game);
    return;
  }
  const { def, node } = cur;
  const choices = (node.choices || [])
    .map(
      (c) => `
      <button class="choice political" data-dlg-choice="${c.id}">
        <span class="legal">${t("dialogue.reply")}</span>
        <span class="label">${c.label}</span>
      </button>`
    )
    .join("");
  openModal(`
    <div class="modal wide dark dialogue-modal" data-lock="true">
      <p class="kicker">${def.title}</p>
      <h2>${def.speaker}</h2>
      <p class="briefing dialogue-text">${node.text}</p>
      <div class="event-choices" style="padding:0;grid-template-columns:1fr">${choices}</div>
      <div class="modal-actions"><button class="btn" id="dlg-abort">${t("dialogue.abort")}</button></div>
    </div>
  `);
  document.querySelectorAll("[data-dlg-choice]").forEach((btn) => {
    btn.addEventListener("click", () => {
      game.onDialogueChoice(btn.getAttribute("data-dlg-choice"));
    });
  });
  const abort = $("dlg-abort");
  if (abort) {
    abort.onclick = () => {
      game.state.activeDialogue = null;
      closeModal();
      renderAll(game);
    };
  }
}

export function openModal(html) {

  const root = $("modal-root");
  root.innerHTML = html;
  root.classList.add("open");
  const locked = !!root.querySelector("[data-lock]");
  const close = () => {
    root.classList.remove("open");
    root.innerHTML = "";
  };
  const btn = $("modal-close");
  if (btn) btn.onclick = close;
  root.onclick = (e) => {
    if (e.target === root && !locked) close();
  };
  return { close, root };
}

export function closeModal() {
  const root = $("modal-root");
  root.classList.remove("open");
  root.innerHTML = "";
}

export function showPresidencyVote(game, { legal, title, onPass, onWithdraw }) {
  const s = game.state;
  const tally = presidencyTally(s);
  const emergencyPath = legal === "emergency";
  const haveFive = tally >= 5;
  const chair = chairName(s);
  const seats = UNIT_IDS.map((id) => {
    const on = s.presidency[id];
    return `
      <div class="vote-seat ${on ? "for" : "against"}">
        <b>${id}</b>
        <span>${seatHolder(s, id)}</span>
        <em>${on ? t("vote.for") : t("vote.against")}</em>
      </div>`;
  }).join("");
  openModal(`
    <div class="modal wide dark" data-lock="true">
      <p class="kicker">${t("vote.kicker", { chair })}</p>
      <h2>${title}</h2>
      <p>${t("vote.body", { legal: legalLabelHr(legal) })}</p>
      <div class="vote-grid">${seats}</div>
      <p><strong>${haveFive ? t("vote.tallyYes", { n: tally }) : t("vote.tallyNo", { n: tally })}</strong>
         ${emergencyPath ? t("vote.alreadyEmergency") : ""}</p>
      <div class="modal-actions">
        <button class="btn primary" id="vote-pass" ${haveFive || emergencyPath ? "" : "disabled"}>
          ${emergencyPath ? t("vote.passEmergency") : t("vote.pass")}
        </button>
        <button class="btn" id="vote-emergency">${t("vote.override")}</button>
        <button class="btn" id="vote-withdraw">${t("vote.withdraw")}</button>
      </div>
    </div>
  `);
  $("vote-pass").onclick = () => {
    closeModal();
    onPass({ usedEmergency: false });
  };
  $("vote-emergency").onclick = () => {
    closeModal();
    onPass({ usedEmergency: true });
  };
  $("vote-withdraw").onclick = () => {
    closeModal();
    onWithdraw?.();
  };
}

export function showElectionNight(report) {
  const races = (report.races || [])
    .map(
      (r) => `
      <div class="election-race">
        <div class="insp-kicker">${r.title} · SKJ-successor chance ${r.p} · roll ${r.roll}</div>
        <h3>${r.winner}</h3>
        <p>${r.note}</p>
      </div>`
    )
    .join("");
  openModal(`
    <div class="modal wide dark" data-lock="true">
      <p class="kicker">${t("election.kicker", { name: report.name })}</p>
      <h2>${t("election.h2")}</h2>
      <p>${report.blurb || t("election.formula", { hold: report.skj_hold, ls: report.living_standard, media: report.media, heat: report.nationalist_heat })}</p>
      ${races}
      <p>${t("election.gov", { gov: t("gov." + report.government_type) })}</p>
      <div class="modal-actions"><button class="btn primary" id="modal-close">${t("election.file")}</button></div>
    </div>
  `);
}

export function showDirectiveResult({ line, noncompliance }) {
  openModal(`
    <div class="modal ${noncompliance ? "dark" : ""}">
      <p class="kicker">${noncompliance ? t("dir.ncKicker") : t("dir.okKicker")}</p>
      <h2>${noncompliance ? t("dir.ncTitle") : t("dir.okTitle")}</h2>
      <p>${line}</p>
      <div class="modal-actions"><button class="btn primary" id="modal-close">${t("ui.close")}</button></div>
    </div>
  `);
}

export function renderAll(game) {
  renderTopbar(game);
  renderInspector(game);
  renderAgencies(game);
  renderEvent(game);
  paintMap(game.state, game.state.selectedUnit);
  refreshTip(game.state);
}

export { showScreen };
