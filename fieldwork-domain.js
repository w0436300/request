/* Fieldwork domain. No UI/runtime dependencies; also loaded by Node's test runner. */
(function (root, factory) {
  const domain = factory();
  if (typeof module === "object" && module.exports) module.exports = domain;
  else root.FieldworkDomain = domain;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";
  const VERSION = 3;
  const PHASES = {
    scoping: {
      label: "Scoping",
      color: "#8F6318",
      tint: "#F6F0E4",
      desc: "Confirm the brief, site requirements, budget and delivery scope.",
      exit: "Brief agreed and project lead appointed.",
    },
    design: {
      label: "Design",
      color: "#3B6B96",
      tint: "#EAF1F8",
      desc: "Develop and coordinate the design, specialist requirements and drawings.",
      exit: "Required design outcomes complete; Project Lead confirms readiness.",
    },
    "pre-construction": {
      label: "Pre-construction",
      color: "#3B6B96",
      tint: "#EAF1F8",
      desc: "Resolve authority, equipment, procurement and construction readiness.",
      exit: "Site, equipment and authority requirements cleared.",
    },
    construction: {
      label: "Construction",
      color: "#5367D4",
      tint: "#EEF0FF",
      desc: "Deliver coordinated works on site through the in-house team.",
      exit: "Required works and inspections complete.",
    },
    commissioning: {
      label: "Commissioning & Acceptance",
      color: "#6E5688",
      tint: "#F1ECF5",
      desc: "Test systems, inspect compliance and record external acceptance internally.",
      exit: "Testing and acceptance recorded by responsible employees.",
    },
    handover: {
      label: "Handover",
      color: "#374151",
      tint: "#F5F6F4",
      desc: "Resolve outstanding items and issue as-builts and handover records.",
      exit: "Required milestones complete. Project Lead may close the project.",
    },
  };
  const PHASE_KEYS = Object.keys(PHASES);
  const STATUSES = [
    "Not started",
    "In progress",
    "Ready for review",
    "Changes requested",
    "Complete",
    "Blocked",
  ];
  const ENQUIRY_STATES = [
    "New",
    "Under review",
    "Needs information",
    "Ready to scope",
    "Converted",
    "Declined",
  ];
  const EXTERNAL_ACTORS = [
    "Client",
    "Authority",
    "Vendor",
    "Landlord",
    "Equipment supplier",
  ];
  const SECTORS = [
    "Cinema",
    "Pet hospital",
    "Medical imaging",
    "Health screening centre",
    "Hotel",
    "Chain restaurant",
    "Other commercial",
  ];
  const SERVICES = [
    "Design & build",
    "Design only",
    "Site assessment",
    "Construction only",
  ];
  const PEOPLE = [
    {
      id: "claire",
      n: "Claire Wang",
      role: "Project lead",
      tier: "owner",
      discipline: "Commercial interiors",
      baseCity: "Shenyang",
      supportedCities: ["Shenyang", "Dalian"],
      c: "#111827",
    },
    {
      id: "sophia",
      n: "Sophia Chen",
      role: "Operations manager",
      tier: "owner",
      discipline: "Programme & cost",
      baseCity: "Shenyang",
      supportedCities: ["Shenyang", "Dalian", "Changchun", "Harbin"],
      c: "#2F6B4F",
    },
    {
      id: "daniel",
      n: "Daniel Wu",
      role: "Construction lead",
      tier: "contributor",
      discipline: "Site delivery",
      baseCity: "Shenyang",
      supportedCities: ["Shenyang", "Dalian", "Changchun", "Harbin"],
      c: "#8F3209",
    },
    {
      id: "li",
      n: "Li Wei",
      role: "Design lead",
      tier: "contributor",
      discipline: "Design coordination",
      baseCity: "Harbin",
      supportedCities: ["Harbin", "Changchun"],
      c: "#5367D4",
    },
    {
      id: "amy",
      n: "Amy Liu",
      role: "Designer",
      tier: "contributor",
      discipline: "Interiors",
      baseCity: "Harbin",
      supportedCities: ["Harbin", "Dalian"],
      c: "#3B6B96",
    },
    {
      id: "ben",
      n: "Ben Zhao",
      role: "Designer",
      tier: "contributor",
      discipline: "Equipment layouts",
      baseCity: "Dalian",
      supportedCities: ["Dalian", "Harbin"],
      c: "#687B83",
    },
    {
      id: "mei",
      n: "Mei Lin",
      role: "Specialist",
      tier: "contributor",
      discipline: "MRI / CT & shielding",
      baseCity: "Harbin",
      supportedCities: ["Harbin", "Changchun", "Shenyang"],
      c: "#6E5688",
    },
    {
      id: "grace",
      n: "Grace Sun",
      role: "Finance",
      tier: "viewer",
      discipline: "Commercial control",
      baseCity: "Shenyang",
      supportedCities: ["Shenyang", "Dalian", "Changchun", "Harbin"],
      c: "#65765F",
    },
    {
      id: "jordan",
      n: "Jordan Park",
      role: "Director",
      tier: "viewer",
      discipline: "Executive oversight",
      baseCity: "Shenyang",
      supportedCities: ["Shenyang", "Dalian", "Changchun", "Harbin"],
      c: "#6E5688",
    },
  ];
  const ROLES = [...new Set(PEOPLE.map((p) => p.role))];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const today = (now = new Date()) => {
    const d = new Date(now);
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  };
  const date = (iso) =>
    /^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? new Date(iso + "T12:00:00") : null;
  const validDate = (iso) =>
    !iso || !!(date(iso) && !isNaN(date(iso)) && today(date(iso)) === iso);
  const addDays = (iso, n) => {
    const d = date(iso);
    d.setDate(d.getDate() + n);
    return today(d);
  };
  const days = (iso, baseline = today()) =>
    iso
      ? Math.round((date(iso) - date(baseline)) / 86400000)
      : Number.MAX_SAFE_INTEGER;
  const weekStart = (iso = today()) => {
    const d = date(iso);
    return addDays(iso, -((d.getDay() + 6) % 7));
  };
  const uid = (prefix) =>
    prefix +
    "-" +
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2));
  const person = (id) => PEOPLE.find((p) => p.id === id || p.n === id) || null;
  const name = (id) => person(id)?.n || "Unassigned";
  const sectorOf = (value) =>
    ({
      "Health checkup": "Health screening centre",
      "Mid hotel": "Hotel",
      "Chain dining": "Chain restaurant",
    })[value] ||
    value ||
    "Other commercial";
  const phaseOf = (value) =>
    ({
      scheduled: "design",
      delivery: "construction",
      review: "commissioning",
      closed: "handover",
    })[value] ||
    value ||
    "scoping";
  const serviceOf = (value) =>
    SERVICES.includes(value) ? value : "Design & build";
  const regionOf = (city) =>
    ({
      Shenyang: "Liaoning",
      Dalian: "Liaoning",
      Changchun: "Jilin",
      Harbin: "Heilongjiang",
      Beijing: "Beijing",
      Qingdao: "Shandong",
    })[city] || "";
  function location(input = {}) {
    return {
      country: input.country || "China",
      region: input.region || input.province || regionOf(input.city),
      city: (input.city || "").trim(),
      siteName: (input.siteName || "Site TBD").trim(),
      siteAddress: (input.siteAddress || "").trim(),
    };
  }
  function migrateLocation(p) {
    if (p.location) return location(p.location);
    const text = p.site || "";
    const city =
      ["Shenyang", "Dalian", "Changchun", "Harbin", "Beijing", "Qingdao"].find(
        (c) => text.includes(c),
      ) || "";
    return location({
      city,
      siteName:
        text
          .replace(new RegExp(",?\\s*" + city + "\\s*"), "")
          .replace(" commercial plot", "")
          .trim() || "Site TBD",
      siteAddress: text,
    });
  }
  // Every template row declares its phase. Order is presentation only.
  const rows = (phase, titles) =>
    titles.map((title) => ({ title, phase, required: true }));
  const cinema = [
    ...rows("scoping", ["Site feasibility confirmed", "Scope confirmed"]),
    ...rows("design", [
      "Auditorium layout approved",
      "Acoustic strategy approved",
      "Projection / AV requirements frozen",
      "Construction drawings issued",
    ]),
    ...rows("pre-construction", [
      "Authority requirements cleared",
      "Procurement / equipment package confirmed",
      "Site mobilisation approved",
    ]),
    ...rows("construction", [
      "Site mobilisation",
      "Acoustic works complete",
      "AV installation complete",
      "Fit-out substantially complete",
    ]),
    ...rows("commissioning", [
      "Projection calibration",
      "Acoustic testing",
      "Client inspection",
    ]),
    ...rows("handover", ["Defects resolved", "Handover pack issued"]),
  ];
  const medical = [
    ...rows("scoping", ["Brief confirmed", "Equipment list confirmed"]),
    ...rows("design", [
      "MRI / CT requirements frozen",
      "Structural requirements approved",
      "Shielding design approved",
      "MEP coordination complete",
      "Construction drawings issued",
    ]),
    ...rows("pre-construction", [
      "Authority approval",
      "Equipment installation requirements confirmed",
      "Construction readiness confirmed",
    ]),
    ...rows("construction", [
      "Structural works complete",
      "Shielding installation complete",
      "Equipment room ready",
      "Fit-out substantially complete",
    ]),
    ...rows("commissioning", [
      "Equipment installation",
      "Compliance inspection",
      "Systems testing",
      "Client acceptance",
    ]),
    ...rows("handover", ["Handover documentation issued"]),
  ];
  const general = [
    ...rows("scoping", ["Site feasibility confirmed", "Brief confirmed"]),
    ...rows("design", [
      "Space planning approved",
      "MEP coordination complete",
      "Construction drawings issued",
    ]),
    ...rows("pre-construction", [
      "Authority requirements cleared",
      "Construction readiness confirmed",
    ]),
    ...rows("construction", [
      "Site mobilisation",
      "Fit-out substantially complete",
    ]),
    ...rows("commissioning", ["Systems testing", "Client acceptance"]),
    ...rows("handover", ["Defects resolved", "Handover pack issued"]),
  ];
  const TEMPLATES = {
    Cinema: cinema,
    "Pet hospital": medical,
    "Medical imaging": medical,
    "Health screening centre": [
      ...general.slice(0, 2),
      ...rows("design", [
        "Patient flow approved",
        "Diagnostic equipment requirements frozen",
      ]),
      ...general.slice(2),
    ],
    Hotel: [
      ...general.slice(0, 2),
      ...rows("design", [
        "Guest room prototype approved",
        "FF&E requirements frozen",
      ]),
      ...general.slice(2),
    ],
    "Chain restaurant": [
      ...general.slice(0, 2),
      ...rows("design", [
        "Kitchen extract strategy approved",
        "Brand prototype approved",
      ]),
      ...general.slice(2),
    ],
    "Other commercial": general,
  };
  function templateFor(sector, service) {
    const base = clone(TEMPLATES[sectorOf(sector)] || general);
    if (service === "Site assessment")
      return base.filter((m) => m.phase === "scoping");
    if (service === "Design only")
      return [
        ...base.filter((m) => ["scoping", "design"].includes(m.phase)),
        {
          title: "Design documentation handed over",
          phase: "handover",
          required: true,
        },
      ];
    if (service === "Construction only")
      return base.filter((m) => m.phase !== "design");
    return base;
  }
  function makeMilestone(p, data, now = new Date().toISOString()) {
    return {
      id: uid("ms"),
      projectId: p.id,
      title: "",
      phase: p.phase,
      workPackageId: null,
      ownerId: p.leadId,
      reviewerId: null,
      dueDate: "",
      actualCompletionDate: null,
      status: "Not started",
      reviewRequired: false,
      deliverable: "",
      attachments: [],
      required: false,
      source: "custom",
      blockedReason: "",
      externalDependency: null,
      reviewHistory: [],
      submittedAt: null,
      createdAt: now,
      updatedAt: now,
      ...clone(data),
    };
  }
  function applyTemplate(p, now) {
    return templateFor(p.sector, p.service).map((row) =>
      makeMilestone(p, { ...row, source: "template:" + p.sector }, now),
    );
  }
  const legacyTitles = {
    "Site survey report": ["Site feasibility confirmed", "scoping"],
    "Concept pack": ["Space planning approved", "design"],
    "Design package": ["Construction drawings issued", "design"],
    "Permit package": ["Authority approval", "pre-construction"],
    "Shielding completion": ["Shielding installation complete", "construction"],
    "Equipment install": ["Equipment installation", "commissioning"],
    "Acoustic commissioning": ["Acoustic testing", "commissioning"],
    "Practical completion": ["Fit-out substantially complete", "construction"],
    "Client sign-off": ["Client acceptance", "commissioning"],
    "Handover pack": ["Handover pack issued", "handover"],
  };
  function migrateProjects(legacy, now = new Date().toISOString()) {
    const result = legacy
      .filter((p) => p.kind !== "Work package")
      .map((old) => {
        const leadId = person(old.lead)?.id || "claire";
        const p = {
          id: old.id,
          code: old.code,
          name: old.name,
          client: old.client,
          sector: sectorOf(old.sector),
          service: serviceOf(old.service),
          phase: phaseOf(old.ph),
          state: old.ph === "closed" ? "Closed" : "Active",
          leadId,
          location: migrateLocation(old),
          team: (old.mem || [old.lead])
            .map((n) => ({
              personId: person(n)?.id,
              role: n === old.lead ? "Project lead" : person(n)?.role,
            }))
            .filter((x) => x.personId),
          brief:
            old.brief ||
            "Deliver " +
              old.service +
              " for " +
              old.client +
              ". Coordinate site constraints, specialist requirements and internal delivery.",
          programme: old.programme || "",
          budgetBand: old.budget || "",
          area: "",
          contractBasis: old.fee || "",
          targetOpening: "",
          contact: {
            name: "",
            phone: old.contactPhone || "",
            email: old.contactEmail || "",
          },
          attachments: [],
          tags: old.tags || [],
          requirements: {},
          workPackages: [],
          milestones: [],
          activity: [],
          commercial: {
            contractValue: "",
            approvedBudget: "",
            approvedVariations: 0,
            committedCost: "",
            forecastFinalCost: "",
            health: "On budget",
          },
          schedule: {
            health: "On track",
            plannedCompletion: "",
            forecastCompletion: "",
          },
          hold: old.hold
            ? {
                reason: old.holdReason || "Programme under review",
                ownerId: leadId,
                since: today(now),
                expectedResume: "",
                impact: "Programme impact to be confirmed",
              }
            : null,
          createdAt: now,
          updatedAt: now,
          setupConfirmed: true,
        };
        p.milestones = applyTemplate(p, now);
        if (old.ms?.label) {
          const [title, phase] = legacyTitles[old.ms.label] || [
            old.ms.label,
            p.phase,
          ];
          let m = p.milestones.find((x) => x.title === title);
          if (!m) {
            m = makeMilestone(
              p,
              { title, phase, source: "legacy", required: true },
              now,
            );
            p.milestones.push(m);
          }
          m.dueDate = validDate(old.ms.iso) ? old.ms.iso : "";
          m.status = "In progress";
        }
        p.activity.push({
          id: uid("activity"),
          projectId: p.id,
          type: "migration",
          actorId: "sophia",
          at: now,
          text: "Imported existing project and known milestone date. Undocumented milestone dates and completions remain unset.",
        });
        return p;
      });
    legacy
      .filter((p) => p.kind === "Work package")
      .forEach((old) => {
        const p = result.find((p) => p.id === old.parentId);
        if (!p) return;
        const id = uid("wp"),
          leadId = person(old.lead)?.id || p.leadId;
        p.workPackages.push({
          id,
          projectId: p.id,
          code:
            p.code +
            " / WP-" +
            String(p.workPackages.length + 1).padStart(2, "0"),
          name: old.name,
          scope: "Imported from " + old.code,
          leadId,
          contributorIds: (old.mem || [])
            .map((n) => person(n)?.id)
            .filter(Boolean),
          startDate: "",
          targetFinish: "",
          budget: old.budget || "",
          progress: null,
          createdAt: now,
          updatedAt: now,
        });
        if (old.ms) {
          const [title, phase] = legacyTitles[old.ms.label] || [
            old.ms.label,
            phaseOf(old.ph),
          ];
          p.milestones.push(
            makeMilestone(
              p,
              {
                title,
                phase,
                workPackageId: id,
                ownerId: leadId,
                dueDate: old.ms.iso || "",
                source: "legacy",
                required: true,
                status: "In progress",
              },
              now,
            ),
          );
        }
      });
    return result;
  }
  function migrateEnquiries(legacy) {
    const sectors = [
      "Cinema",
      "Pet hospital",
      "Medical imaging",
      "Hotel",
      "Health screening centre",
      "Chain restaurant",
      "Cinema",
      "Chain restaurant",
    ];
    const cities = [
      "Dalian",
      "Harbin",
      "Harbin",
      "Shenyang",
      "Dalian",
      "Changchun",
      "Shenyang",
      "Harbin",
    ];
    return legacy.map((q, i) => ({
      id: q.code,
      code: q.code,
      name: q.name,
      client: q.client,
      service: serviceOf(q.service),
      sector: sectorOf(q.sector || sectors[i % 8]),
      status:
        {
          "Reading brief": "Under review",
          "Awaiting client": "Needs information",
          Approved: "Ready to scope",
          Lost: "Declined",
        }[q.state] ||
        q.state ||
        "New",
      location: q.location
        ? location(q.location)
        : location({ city: cities[i % 8] }),
      brief: q.brief || q.need || "",
      budgetBand: q.budget || "",
      area: q.area || "",
      programme: q.programme || "",
      targetOpening: "",
      ownerId: person(q.owner)?.id || "sophia",
      contact: { name: "", phone: q.phone || "", email: q.email || "" },
      attachments: [],
      requirements: {},
      tags: [],
      externalDependency:
        q.state === "Awaiting client"
          ? {
              actor: "Client",
              status: "Waiting externally",
              note: "Information requested externally",
            }
          : null,
      projectId: null,
      createdAt: new Date().toISOString(),
    }));
  }
  function makeProject(data, now) {
    const p = {
      id: uid("project"),
      code: "",
      name: "",
      client: "",
      location: location(),
      sector: "Other commercial",
      service: "Design & build",
      phase: "scoping",
      state: "Active",
      leadId: "claire",
      team: [],
      workPackages: [],
      milestones: [],
      activity: [],
      brief: "",
      budgetBand: "",
      area: "",
      contractBasis: "To be agreed",
      programme: "",
      targetOpening: "",
      contact: { name: "", phone: "", email: "" },
      attachments: [],
      requirements: {},
      tags: [],
      commercial: {
        contractValue: "",
        approvedBudget: "",
        approvedVariations: 0,
        committedCost: "",
        forecastFinalCost: "",
        health: "On budget",
      },
      schedule: {
        health: "On track",
        plannedCompletion: "",
        forecastCompletion: "",
      },
      hold: null,
      setupConfirmed: false,
      createdAt: now,
      updatedAt: now,
      ...clone(data),
    };
    if (!p.team.some((t) => t.personId === p.leadId))
      p.team.push({ personId: p.leadId, role: "Project lead" });
    p.milestones = applyTemplate(p, now);
    return p;
  }
  const activeMilestones = (p) => p.milestones.filter((m) => !m.archivedAt);
  const incomplete = (p) =>
    activeMilestones(p).filter((m) => m.status !== "Complete");
  const nextMilestone = (p) =>
    incomplete(p)
      .filter((m) => m.dueDate)
      .sort(
        (a, b) =>
          a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title),
      )[0] ||
    incomplete(p)[0] ||
    null;
  const isActive = (p) => p.state === "Active";
  function canView(p, actor) {
    const u = person(actor);
    return (
      !!u &&
      (u.tier !== "contributor" ||
        p.leadId === u.id ||
        p.team.some((t) => t.personId === u.id) ||
        p.workPackages.some(
          (w) => w.leadId === u.id || w.contributorIds.includes(u.id),
        ) ||
        activeMilestones(p).some(
          (m) => m.ownerId === u.id || m.reviewerId === u.id,
        ))
    );
  }
  const canManage = (p, actor) =>
    !!person(actor) &&
    (person(actor).role === "Operations manager" ||
      p.leadId === person(actor).id);
  const canIntake = (actor) =>
    ["Operations manager", "Project lead"].includes(person(actor)?.role);
  const canCommercial = (p, actor) =>
    canManage(p, actor) || person(actor)?.role === "Finance";
  const canViewCommercial = (p, actor) =>
    !!p &&
    (["Operations manager", "Finance", "Director"].includes(
      person(actor)?.role,
    ) ||
      (person(actor)?.role === "Project lead" &&
        p.leadId === person(actor).id));
  const canViewEnquiryCommercial = (q, actor, db) =>
    ["Operations manager", "Finance", "Director"].includes(
      person(actor)?.role,
    ) ||
    (person(actor)?.role === "Project lead" &&
      (q.projectId
        ? canViewCommercial(
            db.projects.find((p) => p.id === q.projectId),
            actor,
          )
        : q.ownerId === person(actor).id));
  const visibleActivity = (p, actor) =>
    p.activity.filter(
      (e) =>
        (!e.private || e.actorId === person(actor)?.id) &&
        (!(
          e.commercial ||
          e.type.startsWith("commercial.") ||
          (e.type !== "comment" &&
            /commercial|budget|contract|forecast cost/i.test(e.text))
        ) ||
          canViewCommercial(p, actor)),
    );
  const canOwn = (p, m, actor) =>
    canView(p, actor) &&
    person(actor)?.id === m.ownerId &&
    person(actor)?.tier !== "viewer";
  const canReview = (p, m, actor) =>
    canView(p, actor) &&
    m.reviewRequired &&
    m.reviewerId === person(actor)?.id &&
    m.ownerId !== m.reviewerId &&
    person(actor)?.tier !== "viewer";
  const canComment = (p, actor) =>
    canView(p, actor) && person(actor)?.tier !== "viewer";
  function scheduleHealth(p, baseline = today()) {
    if (
      p.schedule.health === "Delayed" ||
      (p.schedule.forecastCompletion &&
        p.schedule.plannedCompletion &&
        p.schedule.forecastCompletion > p.schedule.plannedCompletion) ||
      incomplete(p).some((m) => m.dueDate && m.dueDate < baseline)
    )
      return "Delayed";
    if (
      p.hold ||
      p.schedule.health === "At risk" ||
      incomplete(p).some((m) => m.status === "Blocked")
    )
      return "At risk";
    return "On track";
  }
  function commercialHealth(p) {
    const c = p.commercial;
    return c.approvedBudget !== "" &&
      c.forecastFinalCost !== "" &&
      Number(c.forecastFinalCost) >
        Number(c.approvedBudget) + Number(c.approvedVariations || 0)
      ? "Forecast over"
      : c.health;
  }
  function progression(p) {
    const required = activeMilestones(p).filter(
      (m) => m.phase === p.phase && m.required,
    );
    const next = PHASE_KEYS[PHASE_KEYS.indexOf(p.phase) + 1];
    return required.length &&
      required.every((m) => m.status === "Complete") &&
      next
      ? next
      : null;
  }
  function allMilestones(db, actor) {
    return db.projects
      .filter((p) => canView(p, actor))
      .flatMap((project) =>
        activeMilestones(project).map((milestone) => ({
          project,
          milestone,
          workPackage:
            project.workPackages.find(
              (w) => w.id === milestone.workPackageId,
            ) || null,
        })),
      );
  }
  function scheduleRows(db, actor, filters = {}, baseline = today()) {
    const start = weekStart(baseline),
      end = addDays(start, 6),
      nextEnd = addDays(start, 13);
    return allMilestones(db, actor)
      .filter(
        ({ project: p, milestone: m }) =>
          isActive(p) &&
          m.status !== "Complete" &&
          m.dueDate &&
          (!filters.city ||
            filters.city === "all" ||
            p.location.city === filters.city) &&
          (!filters.project ||
            filters.project === "all" ||
            p.id === filters.project) &&
          (!filters.phase ||
            filters.phase === "all" ||
            m.phase === filters.phase) &&
          (!filters.owner ||
            filters.owner === "all" ||
            m.ownerId === filters.owner) &&
          (!filters.status ||
            filters.status === "all" ||
            m.status === filters.status) &&
          (!filters.sector ||
            filters.sector === "all" ||
            p.sector === filters.sector),
      )
      .sort(
        (a, b) =>
          a.milestone.dueDate.localeCompare(b.milestone.dueDate) ||
          a.milestone.id.localeCompare(b.milestone.id),
      )
      .map((row) => ({
        ...row,
        bucket:
          row.milestone.dueDate < baseline
            ? "overdue"
            : row.milestone.dueDate <= end
              ? "week"
              : row.milestone.dueDate <= nextEnd
                ? "next"
                : "later",
      }));
  }
  function myWork(db, actor, baseline = today()) {
    const id = person(actor)?.id,
      all = allMilestones(db, actor).filter((r) => isActive(r.project));
    const assigned = all.filter(
      (r) => r.milestone.ownerId === id && r.milestone.status !== "Complete",
    );
    return {
      assigned,
      review: all.filter(
        (r) =>
          r.milestone.reviewerId === id &&
          r.milestone.status === "Ready for review",
      ),
      blocked: assigned.filter((r) => r.milestone.status === "Blocked"),
      week: assigned.filter(
        (r) =>
          r.milestone.dueDate >= baseline &&
          r.milestone.dueDate <= addDays(weekStart(baseline), 6),
      ),
      completed: all.filter(
        (r) =>
          r.milestone.ownerId === id &&
          r.milestone.status === "Complete" &&
          days(r.milestone.actualCompletionDate, baseline) >= -14,
      ),
    };
  }
  function cities(db, baseline = today(), actor = "sophia") {
    return [
      ...new Set([
        ...db.projects.map((p) => p.location.city),
        ...db.enquiries.map((q) => q.location.city),
      ]),
    ]
      .filter(Boolean)
      .sort()
      .map((city) => {
        const projects = db.projects.filter(
          (p) => p.location.city === city && isActive(p),
        );
        const enquiries = db.enquiries.filter(
          (q) =>
            q.location.city === city &&
            !["Converted", "Declined"].includes(q.status),
        );
        const atRisk = projects.filter(
          (p) =>
            scheduleHealth(p, baseline) !== "On track" ||
            (canViewCommercial(p, actor) &&
              commercialHealth(p) !== "On budget"),
        );
        const upcoming = projects
          .flatMap((project) =>
            incomplete(project)
              .filter((m) => m.dueDate)
              .map((milestone) => ({ project, milestone })),
          )
          .sort((a, b) =>
            a.milestone.dueDate.localeCompare(b.milestone.dueDate),
          );
        const team = PEOPLE.filter(
          (u) =>
            u.baseCity === city ||
            u.supportedCities.includes(city) ||
            projects.some((p) => p.team.some((t) => t.personId === u.id)),
        );
        return {
          city,
          projects,
          enquiries,
          atRisk,
          upcoming,
          team,
          leads: [...new Set(projects.map((p) => p.leadId))],
          sectors: [...new Set(projects.map((p) => p.sector))].map(
            (sector) => ({
              sector,
              count: projects.filter((p) => p.sector === sector).length,
            }),
          ),
        };
      });
  }
  function packageSummary(p, w, baseline = today()) {
    const ms = activeMilestones(p).filter((m) => m.workPackageId === w.id),
      open = ms
        .filter((m) => m.status !== "Complete")
        .sort((a, b) =>
          (a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
        );
    return {
      progress:
        w.progress === null
          ? ms.length
            ? Math.round(
                (ms.filter((m) => m.status === "Complete").length / ms.length) *
                  100,
              )
            : 0
          : Number(w.progress),
      phase: open[0]?.phase || p.phase,
      next: open[0] || null,
      health: open.some((m) => m.dueDate && m.dueDate < baseline)
        ? "Delayed"
        : open.some((m) => m.status === "Blocked")
          ? "At risk"
          : "On track",
      milestones: ms,
    };
  }
  function createDemoStore(
    legacy,
    enquirySeed,
    now = new Date().toISOString(),
  ) {
    const projects = migrateProjects(legacy, now),
      enquiries = migrateEnquiries(enquirySeed),
      base = today(now);
    const paws = projects.find((p) => p.id === "061");
    if (paws) {
      paws.name = "Paws & Care Veterinary Hospital";
      paws.service = "Design & build";
      paws.phase = "design";
      paws.leadId = "claire";
      paws.team = ["claire", "li", "amy", "ben", "daniel", "mei"].map((id) => ({
        personId: id,
        role: id === "claire" ? "Project lead" : person(id).role,
      }));
      paws.location = location({
        city: "Harbin",
        siteName: "Paws & Care Hospital",
        siteAddress: "12 Beilin Road",
      });
      paws.milestones = applyTemplate(paws, now);
      paws.milestones.forEach((m) => {
        m.ownerId =
          m.phase === "design"
            ? "amy"
            : m.phase === "construction"
              ? "daniel"
              : "claire";
      });
      const packages = [
        ["MRI / CT Suite", "mei", ["amy", "ben"], 62],
        ["Radiation Shielding", "daniel", ["mei"], 75],
        ["MEP Coordination", "li", ["ben"], 40],
        ["Interior Fit-out", "daniel", ["amy"], null],
      ];
      paws.workPackages = packages.map(
        ([name, leadId, contributorIds, progress], i) => ({
          id: "paws-wp-" + (i + 1),
          projectId: paws.id,
          code: paws.code + " / WP-0" + (i + 1),
          name,
          scope: "Coordinated " + name.toLowerCase() + " scope",
          leadId,
          contributorIds,
          startDate: addDays(base, -20),
          targetFinish: addDays(base, 45),
          budget: "",
          progress,
          createdAt: now,
          updatedAt: now,
        }),
      );
      const set = (title, data) =>
        Object.assign(
          paws.milestones.find((m) => m.title === title),
          data,
        );
      set("Brief confirmed", {
        status: "Complete",
        actualCompletionDate: addDays(base, -19),
        dueDate: addDays(base, -19),
      });
      set("Equipment list confirmed", {
        status: "Complete",
        actualCompletionDate: addDays(base, -12),
        dueDate: addDays(base, -12),
      });
      set("MRI / CT requirements frozen", {
        workPackageId: "paws-wp-1",
        ownerId: "ben",
        status: "Blocked",
        blockedReason: "Waiting for vendor equipment dimensions",
        dueDate: addDays(base, 3),
        externalDependency: {
          actor: "Equipment supplier",
          status: "Waiting externally",
          note: "Vendor dimensions requested",
        },
      });
      set("Shielding design approved", {
        workPackageId: "paws-wp-2",
        ownerId: "mei",
        reviewerId: "li",
        reviewRequired: true,
        status: "In progress",
        dueDate: addDays(base, -2),
      });
      set("MEP coordination complete", {
        workPackageId: "paws-wp-3",
        ownerId: "ben",
        reviewerId: "li",
        reviewRequired: true,
        status: "In progress",
        dueDate: addDays(base, 4),
      });
      set("Construction drawings issued", {
        title: "Construction Drawing Package",
        workPackageId: "paws-wp-1",
        ownerId: "amy",
        reviewerId: "li",
        reviewRequired: true,
        status: "Ready for review",
        dueDate: addDays(base, 9),
        deliverable: "Drawing Package V04",
        submittedAt: now,
        reviewHistory: [
          {
            action: "Submitted",
            actorId: "amy",
            at: now,
            comment: "Coordination issue ready for internal review.",
            deliverable: "Drawing Package V04",
            attachments: [],
          },
        ],
      });
      set("Authority approval", {
        status: "In progress",
        dueDate: addDays(base, 14),
        externalDependency: {
          actor: "Authority",
          status: "Waiting externally",
          note: "Authority submission lodged",
        },
      });
      set("Equipment room ready", {
        workPackageId: "paws-wp-1",
        dueDate: addDays(base, 41),
        ownerId: "daniel",
      });
      set("Systems testing", { dueDate: addDays(base, 55), ownerId: "mei" });
      paws.milestones.push(
        makeMilestone(
          paws,
          {
            title: "Concept approval",
            phase: "design",
            ownerId: "claire",
            required: true,
            source: "custom",
            status: "In progress",
            dueDate: addDays(base, 4),
            externalDependency: {
              actor: "Client",
              status: "Waiting externally",
              note: "Client meeting outcome to be recorded internally",
            },
          },
          now,
        ),
      );
      paws.commercial = {
        contractValue: 12000000,
        approvedBudget: 12000000,
        approvedVariations: 600000,
        committedCost: 7200000,
        forecastFinalCost: 12400000,
        health: "On budget",
      };
      paws.schedule = {
        health: "At risk",
        plannedCompletion: addDays(base, 64),
        forecastCompletion: addDays(base, 72),
      };
      paws.activity.unshift({
        id: uid("activity"),
        projectId: paws.id,
        type: "milestone.submitted",
        actorId: "amy",
        at: now,
        text: "Submitted Construction Drawing Package · Drawing Package V04",
        milestoneId: paws.milestones.find(
          (m) => m.title === "Construction Drawing Package",
        ).id,
      });
    }
    const additions = [
      [
        "081",
        "Harbin MRI / CT diagnostics rooms",
        "Medical imaging",
        "Harbin",
        "Lakeside Medical",
      ],
      [
        "082",
        "Harbin Riverside Hotel",
        "Hotel",
        "Harbin",
        "Northern Lights Hotel",
      ],
      [
        "083",
        "Harbin Ember Grill opening",
        "Chain restaurant",
        "Harbin",
        "Ember Grill Group",
      ],
      [
        "084",
        "Qingdao commercial concept study",
        "Other commercial",
        "Qingdao",
        "East Coast Commercial",
      ],
    ];
    additions.forEach(([id, title, sector, city, client]) => {
      const p = makeProject(
        {
          id,
          code: "PR-" + id,
          name: title,
          sector,
          client,
          location: location({ city, siteName: title }),
          leadId: "sophia",
          service: id === "084" ? "Design only" : "Design & build",
          setupConfirmed: true,
        },
        now,
      );
      p.milestones[0].dueDate = addDays(base, 5);
      projects.push(p);
    });
    enquiries.push({
      id: "rq-harbin",
      code: "RQ-119",
      name: "Harbin veterinary day clinic",
      client: "Paws & Care Vet",
      sector: "Pet hospital",
      service: "Design & build",
      status: "Under review",
      location: location({
        city: "Harbin",
        siteName: "Day clinic annex",
        siteAddress: "Beilin Road extension",
      }),
      brief:
        "Assess a small veterinary day-clinic expansion adjacent to the main hospital.",
      ownerId: "sophia",
      contact: {
        name: "Clinic manager",
        phone: "+86 451 0000 119",
        email: "clinic@pawscare.example",
      },
      budgetBand: "¥1–3M",
      area: "180",
      programme: "6 months",
      targetOpening: addDays(base, 180),
      attachments: [],
      requirements: { MRI: "No", "Day surgery": "Yes" },
      tags: ["Pet hospital"],
      externalDependency: null,
      projectId: null,
      createdAt: now,
    });
    const ready = enquiries.find((q) => q.code === "RQ-112");
    if (ready) {
      ready.status = "Ready to scope";
      ready.brief =
        "Re-commission optics and acoustic tuning for the Modern Era auditorium package.";
      ready.programme = "4 months";
      ready.budgetBand = "¥2.4M";
      ready.area = "860";
      ready.targetOpening = addDays(base, 120);
      ready.contact = {
        name: "Facilities lead",
        phone: "+86 431 0000 112",
        email: "ops@modernera.example",
      };
      ready.location = location({
        city: "Changchun",
        siteName: "Modern Era Mall",
        siteAddress: "Phase 1 optics suite",
      });
    }
    return {
      version: VERSION,
      seededAt: now,
      projects,
      enquiries,
      weeklyReports: demoWeeklyReports(base),
      drafts: [],
      settings: {
        reminderLead: "3",
        reviewWindow: "5",
        notifications: { milestone: true, phase: true, digest: false },
      },
    };
  }
  function demoWeeklyReports(baseline = today()) {
    const thisWeek = weekStart(baseline),
      lastWeek = addDays(thisWeek, -7),
      priorWeek = addDays(thisWeek, -14);
    const report = (personId, weekKey, sources, done, plan, issues, submittedAt) => ({
      personId,
      weekKey,
      sources,
      done,
      plan,
      issues: issues || "",
      submittedAt: submittedAt || weekKey,
    });
    return [
      report(
        "amy",
        thisWeek,
        "PR-061 Paws & Care Veterinary Hospital",
        "Issued revised MRI suite plans for shielding coordination.\nWalked MEP clash set with Li Wei.",
        "Issue IFC package for MRI / CT suite.\nConfirm vendor equipment dimensions.",
        "Still waiting on vendor equipment dimensions for the MRI suite.",
        baseline,
      ),
      report(
        "claire",
        thisWeek,
        "PR-061 Paws & Care Veterinary Hospital\nPR-016 Yuanhong Cinema full design & build",
        "Reviewed Amy's MRI suite revisions.\nAligned cinema acoustic commissioning sequence with Daniel.",
        "Approve MRI IFC package.\nConfirm Yuanhong acoustic hold points.",
        "",
        baseline,
      ),
      report(
        "daniel",
        thisWeek,
        "PR-061 Paws & Care Veterinary Hospital\nPR-016 Yuanhong Cinema full design & build",
        "Radiation shielding framing started on site.\nYuanhong acoustic baffle install progressing on L4.",
        "Complete shielding mock-up review.\nRaise cinema commissioning punchlist draft.",
        "Site access window on Friday may slip if crane booking is delayed.",
        baseline,
      ),
      report(
        "li",
        thisWeek,
        "PR-061 Paws & Care Veterinary Hospital",
        "Updated MEP coordination model against revised MRI layouts.",
        "Issue clash report v3 to Amy and Mei.",
        "",
        baseline,
      ),
      report(
        "mei",
        thisWeek,
        "PR-061 Paws & Care Veterinary Hospital",
        "Shielding density check against vendor sketch.\nFlagged two penetrations needing redesign.",
        "Re-check shielding once vendor dimensions land.",
        "Cannot close density check without final equipment dimensions.",
        baseline,
      ),
      report(
        "ben",
        lastWeek,
        "PR-061 Paws & Care Veterinary Hospital",
        "Prepared interior finish boards for client review.\nSupported Amy on MRI suite RCPs.",
        "Issue finish schedule for treatment rooms.",
        "",
        addDays(lastWeek, 4),
      ),
      report(
        "amy",
        lastWeek,
        "PR-061 Paws & Care Veterinary Hospital",
        "Completed design package for treatment corridor.\nSubmitted MRI suite drawings for internal review.",
        "Address review comments and update shielding interfaces.",
        "Need clearer vendor lead times before locking room sizes.",
        addDays(lastWeek, 4),
      ),
      report(
        "daniel",
        lastWeek,
        "PR-016 Yuanhong Cinema full design & build\nPR-071 Northern Lights hotel lobby & rooms",
        "Cinema L3 slab penetrations closed.\nHotel lobby ceiling grid set out.",
        "Start acoustic baffle install at Yuanhong.\nConfirm hotel FF&E delivery dates.",
        "",
        addDays(lastWeek, 5),
      ),
      report(
        "sophia",
        lastWeek,
        "PR-068 Dalian cinema site assessment\nPR-061 Paws & Care Veterinary Hospital",
        "Closed Dalian site survey comments with client.\nChecked Paws & Care programme risk against shielding delay.",
        "Convert Harbin day-clinic enquiry if qualification clears.\nRe-baseline MRI suite dates after vendor reply.",
        "",
        addDays(lastWeek, 3),
      ),
      report(
        "claire",
        priorWeek,
        "PR-061 Paws & Care Veterinary Hospital\nPR-029 Modern Era auditorium package",
        "Kick-off MRI suite design with Amy and Mei.\nClient sign-off chase on Modern Era auditorium.",
        "Lock Paws & Care work-package owners.\nClose Modern Era comments.",
        "",
        addDays(priorWeek, 4),
      ),
      report(
        "li",
        priorWeek,
        "PR-061 Paws & Care Veterinary Hospital",
        "Issued first MEP coordination set for MRI suite.",
        "Resolve duct routing above shielding zone.",
        "",
        addDays(priorWeek, 5),
      ),
    ];
  }
  function ensureDemoWeeklyReports(db, baseline = today()) {
    if (!db) return db;
    const existing = Array.isArray(db.weeklyReports) ? db.weeklyReports : [];
    const demos = demoWeeklyReports(baseline);
    const have = new Set(existing.map((r) => r.personId + "|" + r.weekKey));
    const missing = demos.filter(
      (r) => !have.has(r.personId + "|" + r.weekKey),
    );
    if (!missing.length && Array.isArray(db.weeklyReports)) return db;
    return {
      ...db,
      weeklyReports: [...missing, ...existing],
    };
  }
  function assert(ok, message) {
    if (!ok) throw new Error(message);
  }
  function record(p, actor, type, text, now, extra = {}) {
    p.updatedAt = now;
    p.activity.unshift({
      id: uid("activity"),
      projectId: p.id,
      actorId: person(actor)?.id || actor,
      type,
      text,
      at: now,
      ...extra,
    });
  }
  function validTeam(p, id) {
    return p.team.some((t) => t.personId === id) && !!person(id);
  }
  function validateMilestone(p, m) {
    assert(m.title.trim(), "Enter a milestone title.");
    assert(PHASE_KEYS.includes(m.phase), "Choose a delivery phase.");
    assert(validDate(m.dueDate), "Enter a valid due date.");
    assert(
      validTeam(p, m.ownerId) && person(m.ownerId).tier !== "viewer",
      "Choose an internal delivery owner from the project team.",
    );
    assert(
      !m.workPackageId || p.workPackages.some((w) => w.id === m.workPackageId),
      "Work package must belong to this project.",
    );
    assert(
      !m.reviewRequired ||
        (validTeam(p, m.reviewerId) &&
          m.reviewerId !== m.ownerId &&
          person(m.reviewerId).tier !== "viewer"),
      "Choose a different internal reviewer from the project team.",
    );
    assert(
      !m.externalDependency ||
        EXTERNAL_ACTORS.includes(m.externalDependency.actor),
      "Choose an external dependency type.",
    );
  }
  function apply(db, actor, action, now = new Date().toISOString()) {
    assert(person(actor), "Unknown employee.");
    const next = clone(db),
      a = action;
    if (a.type === "enquiry.create") {
      assert(
        canIntake(actor),
        "Only Operations or a Project Lead can log enquiries.",
      );
      const data = clone(a.data);
      assert(
        data.name?.trim() &&
          data.brief?.trim() &&
          data.client?.trim() &&
          data.location?.city?.trim(),
        "Name, client, city and brief are required.",
      );
      assert(person(data.ownerId), "Choose an internal request owner.");
      assert(
        validDate(data.targetOpening),
        "Enter a valid target opening date.",
      );
      const seq =
        Math.max(
          118,
          ...next.enquiries.map((q) => Number(q.code.replace("RQ-", "")) || 0),
        ) + 1;
      next.enquiries.unshift({
        ...data,
        id: uid("enquiry"),
        code: "RQ-" + seq,
        location: location(data.location),
        status: "New",
        projectId: null,
        createdAt: now,
      });
      return next;
    }
    if (a.type === "enquiry.update" || a.type === "enquiry.convert") {
      assert(
        canIntake(actor),
        "Only Operations or a Project Lead can qualify enquiries.",
      );
      const q = next.enquiries.find((q) => q.id === a.id);
      assert(q, "Enquiry not found.");
      assert(
        q.status !== "Converted" && !q.projectId,
        "This enquiry is already converted.",
      );
      if (a.type === "enquiry.update") {
        assert(
          ENQUIRY_STATES.includes(a.status) && a.status !== "Converted",
          "Choose a qualification status.",
        );
        q.status = a.status;
        q.externalDependency = a.waiting
          ? {
              actor: "Client",
              status: "Waiting externally",
              note: a.note || "Waiting on client",
            }
          : null;
        q.updatedAt = now;
        return next;
      }
      assert(
        q.status === "Ready to scope",
        "Qualify this enquiry as Ready to scope first.",
      );
      const lead = person(a.leadId);
      assert(
        lead && ["Project lead", "Operations manager"].includes(lead.role),
        "Assign an internal Project Lead.",
      );
      const code =
        "PR-" +
        String(
          Math.max(
            199,
            ...next.projects.map((p) => Number(p.code.replace("PR-", "")) || 0),
          ) + 1,
        ).padStart(3, "0");
      const p = makeProject(
        {
          code,
          name: q.name,
          client: q.client,
          sector: q.sector,
          service: q.service,
          location: clone(q.location),
          leadId: lead.id,
          brief: q.brief,
          programme: q.programme,
          budgetBand: q.budgetBand,
          area: q.area,
          targetOpening: q.targetOpening,
          attachments: clone(q.attachments || []),
          requirements: clone(q.requirements || {}),
          contact: clone(q.contact),
          tags: clone(q.tags || []),
          enquiryId: q.id,
        },
        now,
      );
      p.schedule.plannedCompletion = q.targetOpening || "";
      record(
        p,
        actor,
        "enquiry.converted",
        "Converted " +
          q.code +
          ". Review project setup: milestone plan, team, work packages, programme and commercial. External conversations are recorded by employees.",
        now,
      );
      q.status = "Converted";
      q.projectId = p.id;
      q.updatedAt = now;
      next.projects.unshift(p);
      return next;
    }
    const p = next.projects.find((p) => p.id === a.projectId);
    assert(
      p && canView(p, actor),
      "Project is not available to this employee.",
    );
    if (a.type === "comment.add") {
      assert(canComment(p, actor), "This role cannot comment.");
      assert(a.text?.trim(), "Enter a comment.");
      record(p, actor, "comment", a.text.trim(), now, { private: !!a.private });
      return next;
    }
    if (a.type === "comment.delete") {
      const e = p.activity.find((e) => e.id === a.id);
      assert(
        e?.type === "comment" && e.private && e.actorId === person(actor).id,
        "Only the author can delete their private note.",
      );
      p.activity = p.activity.filter((e) => e.id !== a.id);
      return next;
    }
    assert(isActive(p), "Closed or archived projects are read-only.");
    if (a.type === "project.save") {
      const data = clone(a.data);
      assert(
        canCommercial(p, actor),
        "Only the Project Lead, Operations or Finance can edit commercial data.",
      );
      if (!canManage(p, actor))
        assert(
          Object.keys(data).every((k) => k === "commercial"),
          "Finance can edit commercial information only.",
        );
      const allowed = [
        "name",
        "brief",
        "client",
        "sector",
        "service",
        "location",
        "contact",
        "programme",
        "budgetBand",
        "area",
        "contractBasis",
        "targetOpening",
        "attachments",
        "requirements",
        "tags",
        "team",
        "schedule",
        "commercial",
        "setupConfirmed",
        "deliverables",
        "exclusions",
        "assumptions",
      ];
      assert(
        Object.keys(data).every((k) => allowed.includes(k)),
        "Unsupported project field.",
      );
      if (data.team) {
        assert(
          data.team.every((t) => person(t.personId) && ROLES.includes(t.role)),
          "Assign internal employees only.",
        );
        assert(
          new Set(data.team.map((t) => t.personId)).size === data.team.length,
          "Each employee can appear only once.",
        );
        const leads = data.team.filter((t) => t.role === "Project lead");
        assert(leads.length === 1, "Keep exactly one Project Lead.");
        assert(
          ["Project lead", "Operations manager"].includes(
            person(leads[0].personId).role,
          ),
          "Choose an eligible Project Lead.",
        );
        const assigned = new Set(data.team.map((t) => t.personId));
        assert(
          activeMilestones(p).every(
            (m) =>
              assigned.has(m.ownerId) &&
              (!m.reviewRequired || assigned.has(m.reviewerId)),
          ) &&
            p.workPackages.every(
              (w) =>
                assigned.has(w.leadId) &&
                w.contributorIds.every((id) => assigned.has(id)),
            ),
          "Reassign owned milestones, reviews and work packages before removing this team member.",
        );
        p.leadId = leads[0].personId;
      }
      if (data.location)
        assert(data.location.city?.trim(), "City is required.");
      if (data.schedule) {
        assert(
          ["On track", "At risk", "Delayed"].includes(data.schedule.health),
          "Choose schedule health.",
        );
        assert(
          validDate(data.schedule.plannedCompletion) &&
            validDate(data.schedule.forecastCompletion),
          "Enter valid programme dates.",
        );
      }
      if (data.commercial) {
        assert(
          ["On budget", "At risk", "Forecast over"].includes(
            data.commercial.health,
          ),
          "Choose commercial health.",
        );
        for (const k of [
          "contractValue",
          "approvedBudget",
          "approvedVariations",
          "committedCost",
          "forecastFinalCost",
        ])
          assert(
            data.commercial[k] === "" ||
              (Number.isFinite(Number(data.commercial[k])) &&
                Number(data.commercial[k]) >= 0),
            "Commercial amounts must be positive numbers or blank.",
          );
      }
      const oldCommercial = commercialHealth(p),
        oldTeam = JSON.stringify(p.team);
      const commercialChanged = [
        "commercial",
        "budgetBand",
        "contractBasis",
      ].some(
        (k) =>
          Object.hasOwn(data, k) &&
          JSON.stringify(data[k]) !== JSON.stringify(p[k]),
      );
      Object.assign(p, data);
      record(
        p,
        actor,
        "project.updated",
        a.summary || "Updated project brief, programme and responsibilities.",
        now,
        {
          commercial: commercialChanged,
        },
      );
      if (oldTeam !== JSON.stringify(p.team))
        record(
          p,
          actor,
          "team.updated",
          "Updated project team and lead assignment.",
          now,
        );
      if (oldCommercial !== commercialHealth(p))
        record(
          p,
          actor,
          "commercial.changed",
          "Commercial health: " + oldCommercial + " → " + commercialHealth(p),
          now,
        );
      return next;
    }
    if (a.type === "project.phase") {
      assert(
        canManage(p, actor),
        "Only the assigned Project Lead or Operations can change phase.",
      );
      assert(PHASE_KEYS.includes(a.phase), "Invalid phase.");
      if (p.phase !== a.phase) {
        record(
          p,
          actor,
          "phase.changed",
          "Phase: " +
            PHASES[p.phase].label +
            " → " +
            PHASES[a.phase].label +
            (a.note ? " · " + a.note : ""),
          now,
        );
        p.phase = a.phase;
      }
      return next;
    }
    if (a.type === "project.hold") {
      assert(
        canManage(p, actor),
        "Only the assigned Project Lead or Operations can hold or resume.",
      );
      if (a.hold) {
        assert(
          a.hold.reason?.trim() &&
            validTeam(p, a.hold.ownerId) &&
            a.hold.impact?.trim(),
          "Record hold reason, internal owner and programme impact.",
        );
        assert(
          validDate(a.hold.expectedResume),
          "Enter a valid expected resume date.",
        );
        p.hold = { ...clone(a.hold), since: p.hold?.since || today(now) };
      } else p.hold = null;
      record(
        p,
        actor,
        p.hold ? "project.held" : "project.resumed",
        p.hold
          ? "Project on hold: " + p.hold.reason + " · " + p.hold.impact
          : "Project resumed in " + PHASES[p.phase].label,
        now,
      );
      return next;
    }
    if (a.type === "project.close") {
      assert(
        canManage(p, actor),
        "Only the assigned Project Lead or Operations can close.",
      );
      assert(
        p.phase === "handover" &&
          !p.hold &&
          activeMilestones(p)
            .filter((m) => m.required)
            .every((m) => m.status === "Complete"),
        "Complete all required milestones in Handover and resume the project before closing.",
      );
      p.state = a.archive ? "Archived" : "Closed";
      record(
        p,
        actor,
        "project.closed",
        "Project " + p.state.toLowerCase() + " after handover.",
        now,
      );
      return next;
    }
    if (a.type === "workPackage.save") {
      const old = p.workPackages.find((w) => w.id === a.id),
        data = clone(a.data);
      assert(!a.id || old, "Work package not found.");
      assert(
        Object.keys(data).every((key) =>
          [
            "name",
            "scope",
            "leadId",
            "contributorIds",
            "startDate",
            "targetFinish",
            "budget",
            "progress",
          ].includes(key),
        ),
        "Unsupported work package field.",
      );
      assert(
        canManage(p, actor) ||
          (old &&
            old.leadId === person(actor).id &&
            Object.keys(data).every((k) =>
              ["progress", "startDate", "targetFinish", "scope"].includes(k),
            )),
        "Only Project Lead / Operations can define work packages; a package lead may update delivery progress.",
      );
      const w = old
        ? { ...old, ...data }
        : {
            id: uid("wp"),
            projectId: p.id,
            code:
              p.code +
              " / WP-" +
              String(p.workPackages.length + 1).padStart(2, "0"),
            scope: "",
            contributorIds: [],
            startDate: "",
            targetFinish: "",
            budget: "",
            progress: null,
            createdAt: now,
            ...data,
          };
      assert(
        w.name?.trim() &&
          !PHASE_KEYS.some(
            (k) =>
              PHASES[k].label.toLowerCase() === w.name.trim().toLowerCase(),
          ),
        "Use a meaningful scope name, not a lifecycle phase.",
      );
      assert(
        validTeam(p, w.leadId) &&
          person(w.leadId).tier !== "viewer" &&
          w.contributorIds.every((id) => validTeam(p, id)),
        "Assign the package lead and contributors from the project team.",
      );
      assert(
        validDate(w.startDate) &&
          validDate(w.targetFinish) &&
          (!w.startDate || !w.targetFinish || w.startDate <= w.targetFinish),
        "Check package start and target finish.",
      );
      assert(
        w.progress === null ||
          (Number.isFinite(Number(w.progress)) &&
            Number(w.progress) >= 0 &&
            Number(w.progress) <= 100),
        "Progress must be 0–100 or automatic.",
      );
      w.updatedAt = now;
      if (old)
        p.workPackages = p.workPackages.map((x) => (x.id === old.id ? w : x));
      else p.workPackages.push(w);
      record(
        p,
        actor,
        old ? "workPackage.updated" : "workPackage.created",
        (old ? "Updated " : "Added ") + w.code + " · " + w.name,
        now,
      );
      return next;
    }
    const m = activeMilestones(p).find((m) => m.id === a.id);
    if (a.type === "milestone.save") {
      assert(!a.id || m, "Milestone not found.");
      assert(
        canManage(p, actor),
        "Only the Project Lead or Operations can edit the milestone plan.",
      );
      const allowed = [
        "title",
        "phase",
        "workPackageId",
        "ownerId",
        "reviewerId",
        "dueDate",
        "reviewRequired",
        "deliverable",
        "required",
        "externalDependency",
      ];
      assert(
        Object.keys(a.data).every((k) => allowed.includes(k)),
        "Unsupported milestone field.",
      );
      const updated = m
        ? { ...m, ...clone(a.data) }
        : makeMilestone(p, a.data, now);
      updated.title = updated.title.trim();
      if (!updated.reviewRequired) updated.reviewerId = null;
      // Plan edits cannot bypass or retroactively rewrite a review decision.
      if (m) {
        assert(
          m.status !== "Complete",
          "Completed milestones retain their approved plan.",
        );
        if (m.status === "Ready for review")
          assert(
            updated.ownerId === m.ownerId &&
              updated.reviewerId === m.reviewerId &&
              updated.reviewRequired === m.reviewRequired &&
              updated.deliverable === m.deliverable,
            "Request changes before changing a submitted review assignment or deliverable.",
          );
      }
      if (updated.externalDependency)
        updated.externalDependency = {
          actor: updated.externalDependency.actor,
          status:
            m?.externalDependency?.actor === updated.externalDependency.actor
              ? m.externalDependency.status
              : "Waiting externally",
          note: updated.externalDependency.note || "",
        };
      validateMilestone(p, updated);
      updated.updatedAt = now;
      if (m) {
        p.milestones = p.milestones.map((x) => (x.id === m.id ? updated : x));
        record(p, actor, "milestone.updated", "Updated " + updated.title, now, {
          milestoneId: updated.id,
        });
        for (const [field, label] of [
          ["dueDate", "Due date"],
          ["ownerId", "Owner"],
          ["reviewerId", "Reviewer"],
        ])
          if (m[field] !== updated[field])
            record(
              p,
              actor,
              "milestone." + field,
              updated.title +
                " · " +
                label +
                ": " +
                (field.endsWith("Id") ? name(m[field]) : m[field] || "Unset") +
                " → " +
                (field.endsWith("Id")
                  ? name(updated[field])
                  : updated[field] || "Unset"),
              now,
              { milestoneId: m.id },
            );
      } else {
        p.milestones.push(updated);
        record(p, actor, "milestone.created", "Created " + updated.title, now, {
          milestoneId: updated.id,
        });
      }
      return next;
    }
    assert(m, "Milestone not found.");
    if (a.type === "milestone.archive") {
      assert(
        canManage(p, actor) &&
          m.source === "custom" &&
          !m.required &&
          m.status !== "Ready for review",
        "Only optional custom milestones outside review can be archived.",
      );
      m.archivedAt = now;
      record(p, actor, "milestone.archived", "Archived " + m.title, now, {
        milestoneId: m.id,
      });
      return next;
    }
    if (a.type === "milestone.move") {
      assert(
        canManage(p, actor),
        "Only the Project Lead or Operations can reorder milestones.",
      );
      const i = p.milestones.findIndex((x) => x.id === m.id),
        j = i + (a.direction < 0 ? -1 : 1);
      if (j >= 0 && j < p.milestones.length) {
        [p.milestones[i], p.milestones[j]] = [p.milestones[j], p.milestones[i]];
        record(
          p,
          actor,
          "milestone.reordered",
          "Reordered " + m.title + "; its phase and dates are unchanged.",
          now,
        );
      }
      return next;
    }
    if (a.type === "dependency.record") {
      assert(
        canManage(p, actor),
        "Project Lead or Operations records external decisions.",
      );
      assert(m.externalDependency, "No external dependency on this milestone.");
      assert(
        m.status !== "Complete",
        "Completed outcomes cannot be rewritten.",
      );
      assert(
        [
          "Waiting externally",
          "Confirmed",
          "Rejected / revision required",
        ].includes(a.status),
        "Invalid external result.",
      );
      assert(a.note?.trim(), "Record the external outcome or reference.");
      m.externalDependency = {
        ...m.externalDependency,
        status: a.status,
        note: a.note,
        recordedBy: person(actor).id,
        recordedAt: now,
      };
      m.updatedAt = now;
      record(
        p,
        actor,
        "dependency.recorded",
        m.title +
          " · " +
          m.externalDependency.actor +
          ": " +
          a.status +
          " · " +
          a.note,
        now,
        { milestoneId: m.id },
      );
      return next;
    }
    assert(a.type === "milestone.action", "Unknown operation.");
    const verb = a.action;
    if (["approve", "changes"].includes(verb))
      assert(
        canReview(p, m, actor),
        "Only this milestone’s assigned reviewer can review it.",
      );
    else
      assert(
        canOwn(p, m, actor),
        "Only this milestone’s internal owner can update delivery.",
      );
    if (verb === "deliverable") {
      assert(
        !["Complete", "Ready for review"].includes(m.status),
        "Resume work before changing a submitted deliverable.",
      );
      m.deliverable = (a.deliverable || "").trim();
      if (a.attachments) m.attachments = clone(a.attachments);
      record(
        p,
        actor,
        "milestone.deliverable",
        "Updated deliverable for " + m.title,
        now,
        { milestoneId: m.id },
      );
    } else if (verb === "start") {
      assert(
        ["Not started", "Changes requested", "Blocked"].includes(m.status),
        "This milestone cannot be resumed.",
      );
      m.status = "In progress";
      m.blockedReason = "";
      record(
        p,
        actor,
        "milestone.started",
        "Started / resumed " + m.title,
        now,
        { milestoneId: m.id },
      );
    } else if (verb === "block") {
      assert(
        ["Not started", "In progress", "Changes requested"].includes(
          m.status,
        ) && a.note?.trim(),
        "Add a blocker reason while work is open.",
      );
      m.status = "Blocked";
      m.blockedReason = a.note.trim();
      record(
        p,
        actor,
        "milestone.blocked",
        "Blocked " + m.title + " · " + m.blockedReason,
        now,
        { milestoneId: m.id },
      );
    } else if (verb === "submit" || verb === "complete") {
      assert(
        m.status === "In progress",
        "Start / resume work before submitting or completing.",
      );
      assert(
        !m.externalDependency || m.externalDependency.status === "Confirmed",
        "Record the external confirmation first.",
      );
      if (verb === "submit") {
        assert(
          m.reviewRequired && m.reviewerId,
          "This milestone does not require review.",
        );
        assert(
          m.deliverable || m.attachments.length,
          "Attach or reference a deliverable before submitting.",
        );
        m.status = "Ready for review";
        m.submittedAt = now;
        m.reviewHistory.push({
          action: "Submitted",
          actorId: person(actor).id,
          at: now,
          comment: a.note || "",
          deliverable: m.deliverable,
          attachments: clone(m.attachments),
        });
      } else {
        assert(
          !m.reviewRequired,
          "The assigned reviewer must approve this milestone.",
        );
        m.status = "Complete";
        m.actualCompletionDate = today(now);
      }
      record(
        p,
        actor,
        verb === "submit" ? "milestone.submitted" : "milestone.completed",
        (verb === "submit" ? "Submitted " : "Completed ") +
          m.title +
          (m.deliverable ? " · " + m.deliverable : ""),
        now,
        { milestoneId: m.id },
      );
    } else if (verb === "approve" || verb === "changes") {
      assert(
        m.status === "Ready for review",
        "The milestone must be Ready for review.",
      );
      assert(
        verb !== "changes" || a.note?.trim(),
        "Explain the requested changes.",
      );
      assert(
        verb !== "approve" ||
          !m.externalDependency ||
          m.externalDependency.status === "Confirmed",
        "External dependency is not confirmed.",
      );
      m.status = verb === "approve" ? "Complete" : "Changes requested";
      m.actualCompletionDate = verb === "approve" ? today(now) : null;
      m.reviewComment = a.note || "";
      m.reviewHistory.push({
        action: verb === "approve" ? "Approved" : "Changes requested",
        actorId: person(actor).id,
        at: now,
        comment: a.note || "",
        deliverable: m.deliverable,
        attachments: clone(m.attachments),
      });
      record(
        p,
        actor,
        verb === "approve" ? "review.approved" : "review.changes",
        (verb === "approve" ? "Approved " : "Requested changes: ") +
          m.title +
          (a.note ? " · " + a.note : ""),
        now,
        { milestoneId: m.id },
      );
    } else throw new Error("Unknown milestone action.");
    m.updatedAt = now;
    return next;
  }
  return {
    VERSION,
    PHASES,
    PHASE_KEYS,
    STATUSES,
    ENQUIRY_STATES,
    EXTERNAL_ACTORS,
    SECTORS,
    SERVICES,
    PEOPLE,
    ROLES,
    TEMPLATES,
    clone,
    today,
    date,
    validDate,
    addDays,
    days,
    weekStart,
    uid,
    person,
    name,
    location,
    regionOf,
    sectorOf,
    serviceOf,
    phaseOf,
    templateFor,
    makeMilestone,
    makeProject,
    migrateProjects,
    migrateEnquiries,
    createDemoStore,
    demoWeeklyReports,
    ensureDemoWeeklyReports,
    activeMilestones,
    incomplete,
    nextMilestone,
    isActive,
    canView,
    canManage,
    canIntake,
    canCommercial,
    canViewCommercial,
    canViewEnquiryCommercial,
    visibleActivity,
    canOwn,
    canReview,
    canComment,
    scheduleHealth,
    commercialHealth,
    progression,
    allMilestones,
    scheduleRows,
    myWork,
    cities,
    packageSummary,
    apply,
  };
});
