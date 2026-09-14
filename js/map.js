import { UNIT_IDS } from "./state.js";
import { t } from "./i18n.js";
import { controlFill, controlBand } from "./control.js";

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rgb(r, g, b) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/** Deep gold (federal trust) → grey → rust (secession). Never flag fills. */
export function unitFill(unit) {
  const trust = (unit.federal_trust ?? 0) / 100;
  const secession = (unit.secession_readiness ?? 0) / 100;
  const t = Math.max(0, Math.min(1, 0.5 + (secession - trust) * 0.5));
  const gold = [196, 163, 90];
  const grey = [122, 117, 108];
  const rust = [162, 75, 46];
  if (t < 0.5) {
    const u = t / 0.5;
    return rgb(lerp(gold[0], grey[0], u), lerp(gold[1], grey[1], u), lerp(gold[2], grey[2], u));
  }
  const u = (t - 0.5) / 0.5;
  return rgb(lerp(grey[0], rust[0], u), lerp(grey[1], rust[1], u), lerp(grey[2], rust[2], u));
}

export async function loadMap(stage) {
  const res = await fetch("assets/map.svg");
  if (!res.ok) throw new Error("assets/map.svg missing");
  stage.innerHTML = await res.text();
  const svg = stage.querySelector("svg");
  if (svg) {
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }
  return svg;
}

export function paintMap(state, selectedId) {
  const svg = document.querySelector("#map-stage svg");
  if (!svg) return;
  for (const id of UNIT_IDS) {
    const el = svg.querySelector(`#unit-${id}`);
    if (!el) continue;
    const u = state.units[id];
    el.style.fill = state.mapMode === "control" ? controlFill(u) : unitFill(u);
    el.style.stroke = selectedId === id ? "#e0c07a" : "#2a241c";
    el.style.strokeWidth = selectedId === id ? "3.6" : "1.2";
    el.style.cursor = "pointer";
    el.setAttribute("aria-label", u.name);
    const labels = svg.querySelectorAll(`text[data-label="${id}"]`);
    if (labels[0]) labels[0].textContent = u.name;
    if (labels[1]) labels[1].textContent = u.capital;
  }
  const neighbors = [
    ["AUSTRIA", "map.AT"],
    ["ITALY", "map.IT"],
    ["HUNGARY", "map.HU"],
    ["ROMANIA", "map.RO"],
    ["BULGARIA", "map.BG"],
    ["GREECE", "map.GR"],
    ["ALBANIA", "map.AL"],
    ["ADRIATIC SEA", "map.adriatic"],
  ];
  for (const text of svg.querySelectorAll("text")) {
    const raw = (text.textContent || "").trim();
    const hit = neighbors.find(([en]) => en === raw);
    if (hit) text.textContent = t(hit[1]);
  }
}

export function bindMap(onSelect, getState) {
  const svg = document.querySelector("#map-stage svg");
  const tip = document.getElementById("map-tip");
  if (!svg) return;

  svg.querySelectorAll(".unit-hit").forEach((el) => {
    const id = el.getAttribute("data-unit");
    el.addEventListener("click", () => onSelect(id));
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        onSelect(id);
      }
    });
    el.addEventListener("mousemove", (ev) => {
      const wrap = document.getElementById("map-wrap");
      const r = wrap.getBoundingClientRect();
      tip.style.display = "block";
      tip.style.left = `${ev.clientX - r.left + 12}px`;
      tip.style.top = `${ev.clientY - r.top + 12}px`;
      tip.dataset.unit = id;
      const u = getState?.()?.units?.[id];
      const name = u?.name || el.getAttribute("aria-label") || id;
      const stats = u
        ? (getState?.()?.mapMode === "control"
          ? t("map.tip.control", { n: u.federal_control, band: t("ctrl." + controlBand(u.federal_control)) })
          : t("map.tip", { trust: u.federal_trust, secession: u.secession_readiness }))
        : t("map.inspect");
      tip.innerHTML = `<strong>${name}</strong><span>${stats}</span>`;
    });
    el.addEventListener("mouseleave", () => {
      tip.style.display = "none";
    });
  });
}

export function refreshTip(state) {
  const tip = document.getElementById("map-tip");
  if (!tip || tip.style.display === "none") return;
  const id = tip.dataset.unit;
  if (!id || !state.units[id]) return;
  const u = state.units[id];
  tip.innerHTML =
    `<strong>${u.name}</strong>` +
    `<span>${state.mapMode === "control"
      ? t("map.tip.control", { n: u.federal_control, band: t("ctrl." + controlBand(u.federal_control)) })
      : t("map.tip", { trust: u.federal_trust, secession: u.secession_readiness })}</span>`;
}
