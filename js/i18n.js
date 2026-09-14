let table = {};
let fallback = {};

export function setI18n(hr, en) {
  table = hr || {};
  fallback = en || {};
}

export function t(key, vars) {
  let s = table[key];
  if (s == null) s = fallback[key];
  if (s == null) s = key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = String(s).split(`{${k}}`).join(v);
    }
  }
  return s;
}

export function formatDateHr(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const month = t(`month.${m}`);
  return `${d}. ${month} ${y}.`;
}

export function plannedLabel(id) {
  if (!id) return "";
  const key = `planned.${id}`;
  const s = t(key);
  return s === key ? String(id).replace(/_/g, " ") : s;
}

export function legalLabelHr(legal) {
  const key = `legal.${legal || "political"}`;
  const s = t(key);
  return s === key ? String(legal || "").replace(/_/g, " ") : s;
}

export function statusLabel(status) {
  const key = `status.${status}`;
  const s = t(key);
  return s === key ? String(status || "").replace(/_/g, " ") : s;
}

export function typeLabel(type) {
  const key = `type.${type}`;
  const s = t(key);
  return s === key ? type : s;
}
