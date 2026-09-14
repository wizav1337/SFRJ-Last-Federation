import { t } from "./i18n.js";

/**
 * Slice A does not run the full campaign lock. Early-loss still fires
 * if war_risk breaks and the player has already used purge + JNA threat.
 */
export function evaluateEndings(state) {
  if (state.federal.war_risk >= 85) {
    return {
      id: "E5",
      title: t("end.E5.title"),
      loss: true,
      flavor: t("end.E5.flavor", { date: state.federal.clock }),
    };
  }
  return null;
}

export function actOneBrief(state) {
  const flags = Object.entries(state.flags)
    .filter(([, v]) => v)
    .map(([k]) => k);
  return {
    title: t("idle.act1.title"),
    body: t("idle.act1.body"),
    flags,
    legitimacy: state.federal.legitimacy,
    skj_unity: state.federal.skj_unity,
    war_risk: state.federal.war_risk,
  };
}

export function actTwoBrief(state) {
  const flags = Object.entries(state.flags)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const si = state.units.SI;
  const hr = state.units.HR;
  return {
    title: t("idle.act2.title"),
    body: t("idle.act2.body", {
      clock: state.federal.clock,
      si: t("gov." + si.government_type),
      hr: t("gov." + hr.government_type),
      chair: state.flags.presidency_rotation_jovic
        ? t("idle.act2.jovic")
        : t("idle.act2.messy"),
    }),
    flags,
    legitimacy: state.federal.legitimacy,
    skj_unity: state.federal.skj_unity,
    war_risk: state.federal.war_risk,
  };
}

export function idleBrief(state) {
  if ((state.federal.clock || "") >= "1991-05-15" || state.ended) return actFiveBrief(state);
  if ((state.federal.clock || "") >= "1990-12-23") return actFourBrief(state);
  if ((state.federal.clock || "") >= "1990-10-01") return actThreeBrief(state);
  if ((state.federal.clock || "") >= "1990-05-01") return actTwoBrief(state);
  return actOneBrief(state);
}

/** Mid-campaign slice, not a final ending. Call when Act III is done. */
export function evaluateSlice(state) {
  const loss = evaluateEndings(state);
  if (loss) return loss;

  const si = state.units.SI.secession_readiness;
  const hr = state.units.HR.secession_readiness;
  const serbianMachine =
    !!state.flags.serbia_new_constitution &&
    (state.flags.presidency_rotation_jovic || state.flags.sps_serbia) &&
    (state.flags.jna_sides_with_serbia ||
      state.federal.jna_obedience_to_civilian < 45 ||
      state.flags.player_used_jna_threat) &&
    (si >= 48 || hr >= 48);

  const peacefulSplit =
    !!state.flags.slovenia_plebiscite_yes &&
    state.federal.war_risk < 40 &&
    !state.flags.player_used_jna_threat;

  if (peacefulSplit) {
    return {
      id: "S4",
      title: t("slice.S4.title"),
      slice: true,
      flavor: t("slice.S4.flavor"),
    };
  }

  if (state.flags.confederal_talks_open && state.federal.war_risk < 55) {
    return {
      id: "S3",
      title: t("slice.S3.title"),
      slice: true,
      flavor: t("slice.S3.flavor"),
    };
  }
  if (serbianMachine) {
    return {
      id: "S2",
      title: t("slice.S2.title"),
      slice: true,
      flavor: t("slice.S2.flavor"),
    };
  }
  return {
    id: "S1",
    title: t("slice.S1.title"),
    slice: true,
    flavor: t("slice.S1.flavor"),
  };
}

export function actThreeBrief(state) {
  const slice = evaluateSlice(state);
  const flags = Object.entries(state.flags)
    .filter(([, v]) => v)
    .map(([k]) => k);
  return {
    title: t("idle.act3.title", { slice: slice.title }),
    body: slice.flavor,
    flags,
    legitimacy: state.federal.legitimacy,
    skj_unity: state.federal.skj_unity,
    war_risk: state.federal.war_risk,
  };
}

export function actFourBrief(state) {
  const slice = evaluateSlice(state);
  const flags = Object.entries(state.flags)
    .filter(([, v]) => v)
    .map(([k]) => k);
  return {
    title: t("idle.act4.title", { slice: slice.title }),
    body: slice.flavor,
    flags,
    legitimacy: state.federal.legitimacy,
    skj_unity: state.federal.skj_unity,
    war_risk: state.federal.war_risk,
  };
}

function successorGov(unit) {
  return (
    unit.government_type === "nationalist" ||
    unit.government_type === "reform_skj" ||
    unit.government_type === "skj_monopoly"
  );
}

function nearMisses(state, wonId) {
  const f = state.federal;
  const misses = [];
  const si = state.units.SI;
  const hr = state.units.HR;
  const secessionAvg = (si.secession_readiness + hr.secession_readiness) / 2;
  const republics = ["SI", "HR", "BA", "RS", "ME", "MK"];
  const multi = republics.filter((id) => {
    const u = state.units[id];
    return u.election_held && u.government_type !== "skj_monopoly";
  });

  if (wonId !== "E4") {
    const need = [];
    if (multi.length < 4) need.push(t("near.multi", { n: multi.length }));
    if (!(state.flags.slovenia_plebiscite_yes || state.flags.confederal_talks_open)) {
      need.push(t("near.track"));
    }
    if (f.war_risk >= 40) need.push(t("near.war", { n: f.war_risk }));
    if (state.flags.player_used_jna_threat) need.push(t("near.jnaThreat"));
    if (need.length) misses.push({ id: "E4", title: t("end.E4.title"), need });
  }
  if (wonId !== "E3") {
    const need = [];
    if (!state.flags.confederal_talks_open) need.push(t("near.talks"));
    if ((state.charter_signatures || 0) < 4) need.push(t("near.charter", { n: state.charter_signatures || 0 }));
    if (f.war_risk >= 50) need.push(t("near.war", { n: f.war_risk }));
    if (state.flags.presidency_deadlock) need.push(t("near.deadlock"));
    if (need.length) misses.push({ id: "E3", title: t("end.E3.title"), need });
  }
  if (wonId !== "E1") {
    const need = [];
    if (f.legitimacy < 45) need.push(t("near.legit", { n: f.legitimacy }));
    if (secessionAvg >= 50) need.push(t("near.secession", { n: Math.round(secessionAvg) }));
    if (!(state.flags.skj_renounced_monopoly && f.reform_momentum >= 50)) need.push(t("near.reform"));
    if (f.jna_obedience_to_civilian < 40) need.push(t("near.civilian", { n: f.jna_obedience_to_civilian }));
    if (need.length) misses.push({ id: "E1", title: t("end.E1.title"), need });
  }
  return misses.slice(0, 3);
}

function pathNotes(state) {
  const notes = [];
  if (state.flags.imf_standby_active) notes.push(t("path.imf"));
  if (state.flags.multiparty_wave) notes.push(t("path.multiparty"));
  if (state.flags.customs_war_active) notes.push(t("path.customs"));
  if (state.flags.customs_war_resolved) notes.push(t("path.customsOk"));
  if (state.flags.pakrac_defused) notes.push(t("path.pakracOk"));
  else if (state.flags.pakrac_standoff) notes.push(t("path.pakrac"));
  if (state.flags.belgrade_march_concession) notes.push(t("path.marchOk"));
  else if (state.flags.belgrade_march_tanks) notes.push(t("path.march"));
  if (state.flags.ec_troika_watching) notes.push(t("path.ec"));
  if (state.flags.markovic_mandate_strong) notes.push(t("path.markovic"));
  if (state.flags.mesic_seated) notes.push(t("path.mesic"));
  if (state.flags.presidency_deadlock) notes.push(t("path.block"));
  return notes;
}

/**
 * Vertical Slice A lock. Call only when the 15 May 1991 file closes.
 * Does not start June 1991.
 */
export function evaluateCampaignEnd(state) {
  const f = state.federal;
  const flags = Object.entries(state.flags)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const date = f.clock || "1991-05-15";
  const pres = state.agencies.find((a) => a.id === "presidency");
  const hot = ["SI", "HR", "BA", "XK"].filter(
    (id) => (state.units[id]?.interethnic_tension || 0) >= 90
  );

  if (
    f.war_risk >= 85 ||
    (pres && pres.status === "dissolved") ||
    (hot.length >= 2 && state.flags.krajina_log_revolution)
  ) {
    const end = {
      id: "E5",
      title: t("end.E5.title"),
      loss: true,
      ending: true,
      date,
      flags,
      reasons: f.war_risk >= 85
        ? [t("reason.war", { n: f.war_risk })]
        : pres && pres.status === "dissolved"
          ? [t("reason.dissolved")]
          : [t("reason.knin")],
      flavor: t("end.E5.flavor", { date }),
      path: pathNotes(state),
    };
    end.near = nearMisses(state, "E5");
    return end;
  }

  const si = state.units.SI;
  const hr = state.units.HR;
  const secessionAvg = (si.secession_readiness + hr.secession_readiness) / 2;
  const e1Hits = [];
  if (f.legitimacy >= 45) e1Hits.push(t("reason.legit", { n: f.legitimacy }));
  if (secessionAvg < 50) e1Hits.push(t("reason.secession", { n: Math.round(secessionAvg) }));
  if (state.flags.skj_renounced_monopoly && f.reform_momentum >= 50) {
    e1Hits.push(t("reason.reform"));
  }
  if (!state.flags.independence_slovenia_declared && !state.flags.independence_croatia_declared) {
    e1Hits.push(t("reason.noJune"));
  }
  if (f.jna_obedience_to_civilian >= 40) {
    e1Hits.push(t("reason.civilian", { n: f.jna_obedience_to_civilian }));
  }
  const e1 = e1Hits.length >= 3;

  const republics = ["SI", "HR", "BA", "RS", "ME", "MK"];
  const multi = republics.filter((id) => {
    const u = state.units[id];
    return u.election_held && u.government_type !== "skj_monopoly";
  });
  const e4 =
    multi.length >= 4 &&
    (state.flags.slovenia_plebiscite_yes || state.flags.confederal_talks_open) &&
    f.war_risk < 40 &&
    !state.flags.player_used_jna_threat;

  // E3: otvorena povelja + Predsjedništvo koje se još može sastati.
  // Sjedenje Mesića drži stolac ispunjenim; blokada je zastoj i isključuje E3.
  const e3 =
    !!state.flags.confederal_talks_open &&
    (state.charter_signatures || 0) >= 4 &&
    f.war_risk < 50 &&
    !state.flags.presidency_deadlock;

  const e2 =
    successorGov(state.units.RS) &&
    successorGov(state.units.ME) &&
    (si.secession_readiness >= 50 || state.flags.slovenia_plebiscite_yes) &&
    (hr.secession_readiness >= 50 || state.flags.hdz_croatia) &&
    f.jna_cohesion >= 40 &&
    (state.flags.sps_serbia ||
      state.flags.serbia_new_constitution ||
      state.flags.slice_filed_rump);

  let end;
  if (e4) {
    end = {
      id: "E4",
      title: t("end.E4.title"),
      ending: true,
      date,
      flags,
      reasons: [
        t("reason.multi", { n: multi.length }),
        t("reason.warLow", { n: f.war_risk }),
        t("reason.noJna"),
        state.flags.slovenia_plebiscite_yes ? t("reason.pleb") : t("reason.talks"),
      ],
      flavor: t("end.E4.flavor"),
    };
  } else if (e3) {
    end = {
      id: "E3",
      title: t("end.E3.title"),
      ending: true,
      date,
      flags,
      reasons: [
        t("e3.rule"),
        t("reason.charter", { n: state.charter_signatures }),
        t("reason.warMid", { n: f.war_risk }),
      ],
      flavor: t("end.E3.flavor"),
    };
  } else if (e1 && !e2) {
    end = {
      id: "E1",
      title: t("end.E1.title"),
      ending: true,
      date,
      flags,
      reasons: e1Hits,
      flavor: t("end.E1.flavor"),
    };
  } else if (e2) {
    end = {
      id: "E2",
      title: t("end.E2.title"),
      ending: true,
      date,
      flags,
      reasons: [
        t("reason.successor"),
        t("reason.sihr"),
        t("reason.jna", { n: f.jna_cohesion }),
      ],
      flavor: t("end.E2.flavor"),
    };
  } else if (e1) {
    end = {
      id: "E1",
      title: t("end.E1.title"),
      ending: true,
      date,
      flags,
      reasons: e1Hits,
      flavor: t("end.E1.flavor"),
    };
  } else {
    end = {
      id: "E2",
      title: t("end.E2.title"),
      ending: true,
      date,
      flags,
      reasons: [t("reason.default")],
      flavor: t("end.E2.flavor"),
    };
  }
  end.path = pathNotes(state);
  end.near = nearMisses(state, end.id);
  end.stats = {
    legitimacy: f.legitimacy,
    war_risk: f.war_risk,
    siv: f.siv_authority,
    reform: f.reform_momentum,
    trade: f.inter_republic_trade,
    charter: state.charter_signatures || 0,
  };
  return end;
}

export function actFiveBrief(state) {
  const end = evaluateCampaignEnd(state);
  return {
    title: `${t("idle.act5.prefix")}${end.id} ${end.title}`,
    body: `${end.flavor} ${t("idle.act5.date", { date: end.date, flags: (end.flags || []).join(", ") || t("idle.none") })}${t("idle.act5.suffix")}`,
    flags: end.flags,
    legitimacy: state.federal.legitimacy,
    skj_unity: state.federal.skj_unity,
    war_risk: state.federal.war_risk,
  };
}
