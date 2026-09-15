import { t } from "./i18n.js";
import { confederalStackDepth, deskConflictWarnings } from "./desks.js";

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
    const stack = confederalStackDepth(state);
    if (stack < 3) need.push(t("near.stack", { n: stack }));
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
  if (state.flags.jna_mobilization_alert) notes.push(t("path.deskJnaAlert"));
  else if (state.flags.jna_garrison_posture) notes.push(t("path.deskJnaGarrison"));
  if (state.flags.siv_stimulus_stance || state.flags.dialogue_markovic_teeth) notes.push(t("path.deskSivStimulus"));
  if (state.flags.presidency_mediation_active) notes.push(t("path.deskMediation"));
  if (state.flags.presidency_hardline) notes.push(t("path.deskHardline"));
  if (state.flags.talked_kadijevic) notes.push(t("path.talkKadijevic"));
  if (state.flags.talked_markovic) notes.push(t("path.talkMarkovic"));
  if (state.flags.to_inventory_push) notes.push(t("path.deskToInventory"));
  else if (state.flags.to_coordinate_posture) notes.push(t("path.deskToCoord"));
  else if (state.flags.to_republic_hold) notes.push(t("path.deskToRep"));
  if (state.flags.nby_tight_dinar) notes.push(t("path.deskNbyTight"));
  else if (state.flags.nby_fragment_risk) notes.push(t("path.deskNbyFrag"));
  if (state.flags.talked_kucan) notes.push(t("path.talkKucan"));
  if (state.flags.talked_tudman) notes.push(t("path.talkTudman"));
  if (state.flags.talked_markovic_late) notes.push(t("path.talkMarkovicLate"));
  if (state.flags.talked_kadijevic_late) notes.push(t("path.talkKadijevicLate"));
  if (state.flags.dialogue_kucan_conf) notes.push(t("path.kucanConf"));
  if (state.flags.dialogue_tudman_hard) notes.push(t("path.tudmanHard"));
  if (state.flags.sdb_civilian_leash) notes.push(t("path.sdbLeash"));
  if (state.flags.sdb_leash_tight) notes.push(t("path.sdbTight"));
  if (state.flags.sdb_files_shared) notes.push(t("path.sdbFiles"));
  if (state.flags.ssup_observe_line) notes.push(t("path.ssupObserve"));
  if (state.flags.dialogue_kucan_charter) notes.push(t("path.kucanCharter"));
  if (state.flags.confederal_stack_memo) notes.push(t("path.confStack"));
  if (state.flags.skj_soft_federation) notes.push(t("path.skjSoft"));
  else if (state.flags.skj_hard_unity) notes.push(t("path.skjHard"));
  else if (state.flags.skj_cedes_to_siv) notes.push(t("path.skjCede"));
  else if (state.flags.skj_dissolved) notes.push(t("path.skjDissolved"));
  if (state.flags.confederal_skj_memo) notes.push(t("path.skjMemo"));
  if (state.flags.talked_bogicevic) notes.push(t("path.talkBogicevic"));
  if (state.flags.talked_tupurkovski) notes.push(t("path.talkTupurkovski"));
  if (state.flags.talked_racan) notes.push(t("path.talkRacan"));
  if (state.flags.dialogue_jovic_skj) notes.push(t("path.jovicSkj"));
  if (state.flags.republic_voice_bih_seen) notes.push(t("path.voiceBih"));
  if (state.flags.republic_voice_mk_seen) notes.push(t("path.voiceMk"));
  if (state.flags.republic_voice_me_seen) notes.push(t("path.voiceMe"));
  if (state.flags.republic_voice_gligorov_seen || state.flags.talked_gligorov) notes.push(t("path.talkGligorov"));
  if (state.flags.talked_bucin) notes.push(t("path.talkBucin"));
  if (state.flags.talked_izetbegovic) notes.push(t("path.talkIzetbegovic"));
  if (state.flags.assembly_open) notes.push(t("path.assemblyOpen"));
  else if (state.flags.assembly_stalled) notes.push(t("path.assemblyStalled"));
  else if (state.flags.assembly_rubber_stamp) notes.push(t("path.assemblyRubber"));
  if (state.flags.fer_trade_open) notes.push(t("path.ferTrade"));
  else if (state.flags.fer_imf_line) notes.push(t("path.ferImf"));
  else if (state.flags.fer_customs_hard) notes.push(t("path.ferCustoms"));
  if (state.flags.fond_open_south) notes.push(t("path.fondOpen"));
  else if (state.flags.fond_freeze) notes.push(t("path.fondFreeze"));
  else if (state.flags.fond_target_mk_me) notes.push(t("path.fondTarget"));
  else if (state.flags.fond_politicized) notes.push(t("path.fondPoliticized"));
  if (state.flags.siv_fond_bind) notes.push(t("path.sivFond"));
  if (state.flags.jna_quiet_redistribute) notes.push(t("path.jnaQuiet"));
  if (state.flags.presidency_south_balance) notes.push(t("path.southBalance"));
  if (state.flags.confederal_fond_memo) notes.push(t("path.fondMemo"));
  if (state.flags.talked_bulatovic || state.flags.republic_voice_bulatovic_seen) notes.push(t("path.talkBulatovic"));
  if (state.flags.dialogue_markovic_fond) notes.push(t("path.markovicFond"));
  if (state.flags.ssrn_civic_forum) notes.push(t("path.ssrnCivic"));
  else if (state.flags.ssrn_mass_front) notes.push(t("path.ssrnMass"));
  else if (state.flags.ssrn_party_capture) notes.push(t("path.ssrnParty"));
  else if (state.flags.ssrn_paralyzed) notes.push(t("path.ssrnParalyzed"));
  if (state.flags.ssrn_siv_bind) notes.push(t("path.ssrnSiv"));
  if (state.flags.ssp_isolation) notes.push(t("path.sspIsolation"));
  else if (state.flags.ssp_nam_bridge) notes.push(t("path.sspNam"));
  if (state.flags.finance_target) notes.push(t("path.financeTarget"));
  else if (state.flags.finance_soft_corridor) notes.push(t("path.financeSoft"));
  if (state.flags.confederal_ssrn_memo) notes.push(t("path.ssrnMemo"));
  if (state.flags.talked_mesic_late) notes.push(t("path.talkMesicLate"));
  if (state.flags.talked_jovic_late) notes.push(t("path.talkJovicLate"));
  if (state.flags.dialogue_markovic_ssrn) notes.push(t("path.markovicSsrn"));
  if (state.flags.ssip_ec_channel) notes.push(t("path.ssipEc"));
  else if (state.flags.ssip_nonaligned_hold) notes.push(t("path.ssipNam"));
  else if (state.flags.ssip_bilateral_quiet) notes.push(t("path.ssipBilat"));
  else if (state.flags.ssip_paralyzed) notes.push(t("path.ssipParalyzed"));
  if (state.flags.ssip_siv_bind) notes.push(t("path.ssipSiv"));
  if (state.flags.to_shared_reserve) notes.push(t("path.toReserve"));
  if (state.flags.to_nby_liaison) notes.push(t("path.toNby"));
  if (state.flags.nby_imf_align) notes.push(t("path.nbyImf"));
  if (state.flags.confederal_ssip_memo) notes.push(t("path.ssipMemo"));
  if (state.flags.talked_loncar) notes.push(t("path.loncar"));
  if (state.flags.dialogue_markovic_ssip) notes.push(t("path.markovicSsip"));
  if (state.flags.const_court_docket_open) notes.push(t("path.constCourtDocket"));
  else if (state.flags.const_court_bind_justice) notes.push(t("path.constCourtBind"));
  else if (state.flags.const_court_stalled) notes.push(t("path.constCourtStall"));
  else if (state.flags.const_court_yields) notes.push(t("path.constCourtYield"));
  if (state.flags.justice_refer_court) notes.push(t("path.justiceRefer"));
  if (state.flags.ssup_docket_watch) notes.push(t("path.ssupDocket"));
  if (state.flags.confederal_const_court_memo) notes.push(t("path.constCourtMemo"));
  if (state.flags.talked_buzadzic) notes.push(t("path.buzadzic"));
  if (state.flags.dialogue_markovic_const_court) notes.push(t("path.markovicCourt"));
  if (state.flags.provinces_vote_independently) notes.push(t("path.provincesIndep"));
  else if (state.flags.provinces_mediate) notes.push(t("path.provincesMediate"));
  else if (state.flags.provinces_bloc_tight) notes.push(t("path.provincesBloc"));
  else if (state.flags.provinces_observe) notes.push(t("path.provincesObserve"));
  if (state.flags.ssup_province_dossier) notes.push(t("path.ssupProvinceDossier"));
  if (state.flags.presidency_province_quorum) notes.push(t("path.presidencyProvinceQuorum"));
  if (state.flags.confederal_provinces_memo) notes.push(t("path.provincesMemo"));
  if (state.flags.talked_bajramovic) notes.push(t("path.bajramovic"));
  if (state.flags.talked_kostic) notes.push(t("path.kostic"));
  if (state.flags.dialogue_markovic_provinces) notes.push(t("path.markovicProvinces"));
  if (state.flags.ssno_doctrine_federal) notes.push(t("path.ssnoDoctrine"));
  else if (state.flags.ssno_chair_counsel) notes.push(t("path.ssnoCounsel"));
  else if (state.flags.ssno_to_coordinate) notes.push(t("path.ssnoTo"));
  else if (state.flags.ssno_inventory_audit) notes.push(t("path.ssnoInventory"));
  if (state.flags.jna_ssno_doctrine_bind) notes.push(t("path.jnaSsnoBind"));
  if (state.flags.to_ssno_liaison) notes.push(t("path.toSsnoLiaison"));
  if (state.flags.confederal_ssno_memo) notes.push(t("path.ssnoMemo"));
  if (state.flags.dialogue_kadijevic_ssno) notes.push(t("path.kadijevicSsno"));
  if (state.flags.dialogue_markovic_ssno) notes.push(t("path.markovicSsno"));
  if (state.flags.labor_social_peace) notes.push(t("path.laborPeace"));
  else if (state.flags.labor_strike_cool) notes.push(t("path.laborCool"));
  else if (state.flags.labor_reform_support) notes.push(t("path.laborReform"));
  else if (state.flags.labor_wage_corridor) notes.push(t("path.laborWage"));
  if (state.flags.confederal_labor_memo) notes.push(t("path.laborMemo"));
  if (state.flags.talked_gacic || state.flags.dialogue_gacic) notes.push(t("path.gacic"));
  if (state.flags.dialogue_markovic_labor) notes.push(t("path.markovicLabor"));
  if (state.flags.agriculture_food_security) notes.push(t("path.agriFood"));
  else if (state.flags.agriculture_procurement_soft) notes.push(t("path.agriProcurement"));
  else if (state.flags.agriculture_farm_relief) notes.push(t("path.agriRelief"));
  else if (state.flags.agriculture_reform_support) notes.push(t("path.agriReform"));
  if (state.flags.confederal_agriculture_memo) notes.push(t("path.agriMemo"));
  if (state.flags.talked_mirjanic || state.flags.dialogue_mirjanic) notes.push(t("path.mirjanic"));
  if (state.flags.dialogue_markovic_agriculture) notes.push(t("path.markovicAgriculture"));
  if (state.flags.industry_grid_stable) notes.push(t("path.industryGrid"));
  else if (state.flags.industry_plant_soft) notes.push(t("path.industryPlant"));
  else if (state.flags.industry_output_support) notes.push(t("path.industryOutput"));
  else if (state.flags.industry_reform_support) notes.push(t("path.industryReform"));
  if (state.flags.confederal_industry_memo) notes.push(t("path.industryMemo"));
  if (state.flags.talked_santo || state.flags.dialogue_santo) notes.push(t("path.santo"));
  if (state.flags.dialogue_markovic_industry) notes.push(t("path.markovicIndustry"));
  const stack = confederalStackDepth(state);
  if (stack >= 3) notes.push(t("path.stackDepth", { n: stack }));
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
        t("reason.stack", { n: confederalStackDepth(state) }),
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

/**
 * Live near-miss / desk-failure pressure for UI (Pass 3).
 * Shown when failure modes almost lock an ending — not only on the end card.
 */
export function livePressureWarnings(state) {
  if (!state || state.ended) return [];
  const f = state.federal;
  const warnings = [];
  const clock = f.clock || "";

  // E5 almost: war_risk climbing + hard desks
  if (f.war_risk >= 70 && f.war_risk < 85) {
    warnings.push({
      id: "E5",
      severity: "critical",
      text: t("pressure.e5", { n: f.war_risk }),
    });
  } else if (f.war_risk >= 55 && (state.flags.jna_mobilization_alert || state.flags.ssup_hard_line || state.flags.presidency_hardline)) {
    warnings.push({
      id: "E5",
      severity: "warn",
      text: t("pressure.e5desk", { n: f.war_risk }),
    });
  }

  // E3 almost locked out by deadlock / hardline
  if (state.flags.confederal_talks_open && state.flags.presidency_deadlock) {
    warnings.push({
      id: "E3",
      severity: "critical",
      text: t("pressure.e3deadlock"),
    });
  } else if (
    state.flags.confederal_talks_open &&
    (state.charter_signatures || 0) >= 2 &&
    (state.charter_signatures || 0) < 4 &&
    clock >= "1991-01-01"
  ) {
    warnings.push({
      id: "E3",
      severity: "info",
      text: t("pressure.e3charter", { n: state.charter_signatures || 0 }),
    });
  } else if (
    confederalStackDepth(state) >= 3 &&
    state.flags.confederal_talks_open &&
    !state.flags.presidency_deadlock &&
    f.war_risk < 50 &&
    (state.charter_signatures || 0) < 4 &&
    clock >= "1990-10-01"
  ) {
    warnings.push({
      id: "E3",
      severity: "info",
      text: t("pressure.e3near", { n: confederalStackDepth(state), c: state.charter_signatures || 0 }),
    });
  }

  // E2 gravity: Serbian machine + JNA political
  if (
    (state.flags.jna_sides_with_serbia || state.flags.jna_political_weight || state.flags.dialogue_kadijevic_serbia) &&
    (state.units.SI?.secession_readiness || 0) >= 45 &&
    clock >= "1990-09-01"
  ) {
    warnings.push({
      id: "E2",
      severity: "warn",
      text: t("pressure.e2"),
    });
  }

  // SDB leash failure mode
  if (state.flags.ssup_hard_line && !state.flags.sdb_civilian_leash && state.flags.krajina_log_revolution) {
    warnings.push({
      id: "SDB",
      severity: "warn",
      text: t("pressure.sdb"),
    });
  }

  // Pass 4: hardline desks vs open confederal talks
  for (const w of deskConflictWarnings(state)) {
    const desks = (w.desks || []).join("/");
    warnings.push({
      id: w.id,
      severity: w.severity,
      text: t(w.textKey, { desks: desks || "—" }),
    });
  }

  return warnings.slice(0, 4);
}
