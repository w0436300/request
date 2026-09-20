const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../fieldwork-domain.js");
require("../fieldwork-seed.js");
const now = "2026-09-17T16:00:00.000Z";
const fresh = () =>
  D.createDemoStore(
    global.FieldworkSeed.projects,
    global.FieldworkSeed.enquiries,
    now,
  );
const paws = (db) => db.projects.find((p) => p.id === "061");
const apply = (db, actor, a) => D.apply(db, actor, a, now);

test("migration imports known dates only, removes PR work packages and keeps explicit phases", () => {
  const projects = D.migrateProjects(global.FieldworkSeed.projects, now),
    p = projects.find((p) => p.id === "016");
  assert.equal(projects.length, 6);
  assert(!projects.some((p) => p.id === "030"));
  assert.equal(p.workPackages[0].code, "PR-016 / WP-01");
  assert(
    p.milestones.some(
      (m) =>
        m.workPackageId === p.workPackages[0].id && m.dueDate === "2026-09-18",
    ),
  );
  assert(
    projects.every((p) => !("ms" in p) && !("site" in p) && !("gates" in p)),
  );
  assert(
    projects
      .filter((p) => p.state !== "Completed")
      .flatMap((p) => p.milestones)
      .every((m) => D.PHASE_KEYS.includes(m.phase) && !m.actualCompletionDate),
  );
  assert(!D.PHASE_KEYS.includes("closed"));
  assert(D.PHASE_KEYS.includes("pre-construction"));
  const closed = projects.find((p) => p.state === "Completed");
  assert(closed);
  assert(
    closed.milestones.every(
      (m) => m.status === "Complete" && !!m.actualCompletionDate,
    ),
  );
});
test("sector template precedes service modifier and starts without synthetic dates", () => {
  const p = D.makeProject(
    { sector: "Pet hospital", service: "Design & build" },
    now,
  );
  assert(
    p.milestones.some(
      (m) => m.title === "Shielding design approved" && m.phase === "design",
    ),
  );
  assert(p.milestones.every((m) => !m.dueDate && m.status === "Not started"));
  const design = D.templateFor("Pet hospital", "Design only");
  assert(design.some((m) => m.title === "Shielding design approved"));
  assert(
    !design.some((m) => ["construction", "commissioning"].includes(m.phase)),
  );
});
test("Flows A/B: enquiry conversion preserves the intake and cannot duplicate a project", () => {
  let db = fresh();
  const file = {
    name: "brief.txt",
    dataUrl: "data:text/plain;base64,YnJpZWY=",
  };
  db = apply(db, "sophia", {
    type: "enquiry.create",
    data: {
      name: "Pet Hospital Expansion",
      client: "Paws & Care",
      sector: "Pet hospital",
      service: "Design & build",
      brief: "MRI expansion",
      location: D.location({
        city: "Harbin",
        region: "Heilongjiang",
        siteName: "Site TBD",
      }),
      ownerId: "sophia",
      contact: { name: "Client A", phone: "123", email: "" },
      budgetBand: "¥12M",
      programme: "6 months",
      targetOpening: "2027-04-01",
      attachments: [file],
      requirements: { MRI: "Yes" },
    },
  });
  const qid = db.enquiries[0].id;
  for (const status of ["Under review", "Ready to scope"])
    db = apply(db, "sophia", { type: "enquiry.update", id: qid, status });
  db = apply(db, "sophia", {
    type: "enquiry.convert",
    id: qid,
    leadId: "claire",
  });
  const q = db.enquiries.find((q) => q.id === qid),
    p = db.projects.find((p) => p.id === q.projectId);
  assert.equal(q.status, "Converted");
  assert.equal(p.phase, "scoping");
  assert.equal(p.location.city, "Harbin");
  assert.equal(p.attachments[0].dataUrl, file.dataUrl);
  assert.equal(p.budgetBand, "¥12M");
  assert.equal(p.brief, "MRI expansion");
  assert.equal(p.setupConfirmed, false);
  assert.equal(p.milestones[0].dueDate, "");
  assert.throws(
    () =>
      apply(db, "sophia", {
        type: "enquiry.convert",
        id: qid,
        leadId: "claire",
      }),
    /already converted/,
  );
  db = apply(db, "claire", {
    type: "workPackage.save",
    projectId: p.id,
    data: {
      name: "MRI / CT Suite",
      scope: "Equipment rooms",
      leadId: "claire",
      contributorIds: [],
      startDate: "2026-10-01",
      targetFinish: "2026-11-01",
      budget: "",
      progress: null,
    },
  });
  assert.equal(db.projects.length, 8);
  assert.equal(db.projects[0].workPackages[0].projectId, p.id);
  assert(!("location" in db.projects[0].workPackages[0]));
});
test("Flows C/D: internal review enforces owner, reviewer, revision loop and immutable review history", () => {
  let db = fresh(),
    p = paws(db),
    m = p.milestones.find((m) => m.status === "Ready for review");
  const id = m.id;
  assert.throws(
    () =>
      apply(db, "amy", {
        type: "milestone.action",
        projectId: p.id,
        id,
        action: "approve",
      }),
    /assigned reviewer/,
  );
  assert.throws(
    () =>
      apply(db, "claire", {
        type: "milestone.action",
        projectId: p.id,
        id,
        action: "approve",
      }),
    /assigned reviewer/,
  );
  db = apply(db, "li", {
    type: "milestone.action",
    projectId: p.id,
    id,
    action: "changes",
    note: "Update equipment clearances.",
  });
  assert.equal(
    paws(db).milestones.find((m) => m.id === id).status,
    "Changes requested",
  );
  db = apply(db, "amy", {
    type: "milestone.action",
    projectId: p.id,
    id,
    action: "start",
  });
  db = apply(db, "amy", {
    type: "milestone.action",
    projectId: p.id,
    id,
    action: "deliverable",
    deliverable: "Drawing Package V05",
  });
  db = apply(db, "amy", {
    type: "milestone.action",
    projectId: p.id,
    id,
    action: "submit",
  });
  assert(D.myWork(db, "li").review.some((r) => r.milestone.id === id));
  db = apply(db, "li", {
    type: "milestone.action",
    projectId: p.id,
    id,
    action: "approve",
    note: "Approved coordinated issue.",
  });
  m = paws(db).milestones.find((m) => m.id === id);
  assert.equal(m.status, "Complete");
  assert.equal(m.actualCompletionDate, "2026-09-17");
  assert.deepEqual(
    m.reviewHistory.map((h) => h.action),
    ["Submitted", "Changes requested", "Submitted", "Approved"],
  );
  assert.equal(m.reviewHistory[0].deliverable, "Drawing Package V04");
  assert(!D.scheduleRows(db, "sophia").some((r) => r.milestone.id === id));
  assert(
    D.myWork(db, "amy", "2026-09-17").completed.some(
      (r) => r.milestone.id === id,
    ),
  );
  assert.equal(paws(db).phase, "design");
});
test("Flow E: external decisions are employee-recorded and do not masquerade as internal review", () => {
  let db = fresh(),
    p = paws(db),
    m = p.milestones.find((m) => m.title === "Concept approval");
  assert.throws(
    () =>
      apply(db, "claire", {
        type: "milestone.action",
        projectId: p.id,
        id: m.id,
        action: "complete",
      }),
    /external confirmation/,
  );
  assert.throws(
    () =>
      apply(db, "amy", {
        type: "dependency.record",
        projectId: p.id,
        id: m.id,
        status: "Confirmed",
        note: "Client called",
      }),
    /Project Lead/,
  );
  db = apply(db, "claire", {
    type: "dependency.record",
    projectId: p.id,
    id: m.id,
    status: "Confirmed",
    note: "Client confirmed externally by WeChat.",
  });
  db = apply(db, "claire", {
    type: "milestone.action",
    projectId: p.id,
    id: m.id,
    action: "complete",
  });
  m = paws(db).milestones.find((x) => x.id === m.id);
  assert.equal(m.status, "Complete");
  assert.equal(m.externalDependency.recordedBy, "claire");
  assert.equal(m.reviewHistory.length, 0);
});
test("Flow F: Schedule uses all dates, handles same-day milestones, filters and due-date changes", () => {
  let db = fresh(),
    p = paws(db),
    rows = D.scheduleRows(db, "sophia", { city: "Harbin" }, "2026-09-17");
  assert(rows.length > 4);
  assert(rows.every((r) => r.project.location.city === "Harbin"));
  assert(rows.filter((r) => r.milestone.dueDate === "2026-09-21").length >= 2);
  const m = p.milestones.find((m) => m.title === "Shielding design approved");
  db = apply(db, "claire", {
    type: "milestone.save",
    projectId: p.id,
    id: m.id,
    data: { dueDate: "2026-10-05" },
  });
  const changed = D.scheduleRows(
    db,
    "sophia",
    { owner: "mei" },
    "2026-09-17",
  ).find((r) => r.milestone.id === m.id);
  assert.equal(changed.milestone.dueDate, "2026-10-05");
  assert.equal(changed.bucket, "later");
  assert.equal(paws(db).milestones.filter((x) => x.id === m.id).length, 1);
  assert(
    paws(db).activity.some((e) => e.text.includes("2026-09-15 → 2026-10-05")),
  );
});
test("Flows G/H: location counts, package inheritance and optional packages", () => {
  const db = fresh(),
    harbin = D.cities(db, "2026-09-17").find((c) => c.city === "Harbin");
  assert.equal(harbin.projects.length, 2);
  assert.equal(harbin.enquiries.length, 3);
  assert.equal(harbin.atRisk.length, 1);
  assert(harbin.team.some((p) => p.id === "daniel"));
  assert.equal(paws(db).workPackages.length, 4);
  assert.equal(db.projects.length, 7);
  assert(db.projects.some((p) => !p.workPackages.length));
  const rows = D.scheduleRows(db, "sophia", { city: "Harbin" }, "2026-09-17");
  assert(rows.some((r) => r.workPackage?.name === "MRI / CT Suite"));
});
test("Flow I: role + assignment protects lifecycle, commercial, team and milestone ownership", () => {
  const db = fresh(),
    p = paws(db),
    m = p.milestones.find((m) => m.ownerId === "mei");
  assert.throws(
    () =>
      apply(db, "amy", {
        type: "project.phase",
        projectId: p.id,
        phase: "construction",
      }),
    /assigned Project Lead/,
  );
  assert.throws(
    () =>
      apply(db, "amy", {
        type: "project.save",
        projectId: p.id,
        data: { commercial: p.commercial },
      }),
    /Finance/,
  );
  assert.throws(
    () =>
      apply(db, "amy", {
        type: "milestone.action",
        projectId: p.id,
        id: m.id,
        action: "block",
        note: "Issue",
      }),
    /internal owner/,
  );
  assert.throws(
    () =>
      apply(db, "jordan", {
        type: "comment.add",
        projectId: p.id,
        text: "Note",
      }),
    /cannot comment/,
  );
  assert.throws(
    () =>
      apply(db, "grace", {
        type: "project.save",
        projectId: p.id,
        data: { brief: "Changed" },
      }),
    /Finance can edit commercial/,
  );
  const changed = apply(db, "grace", {
    type: "project.save",
    projectId: p.id,
    data: { commercial: { ...p.commercial, health: "At risk" } },
  });
  assert.equal(paws(changed).commercial.health, "At risk");
  const other = db.projects.find((p) => p.leadId === "sophia");
  assert.throws(
    () =>
      apply(db, "claire", {
        type: "project.phase",
        projectId: other.id,
        phase: "design",
      }),
    /assigned Project Lead/,
  );
});
test("hold metadata, explicit phase changes and close are separate from lifecycle progression", () => {
  let db = fresh(),
    p = paws(db);
  db = apply(db, "claire", {
    type: "project.hold",
    projectId: p.id,
    hold: {
      reason: "Site access",
      ownerId: "claire",
      expectedResume: "2026-10-01",
      impact: "Programme +8 days",
    },
  });
  assert.equal(paws(db).phase, "design");
  assert.equal(paws(db).hold.since, "2026-09-17");
  db = apply(db, "claire", {
    type: "project.hold",
    projectId: p.id,
    hold: null,
  });
  assert.equal(paws(db).hold, null);
  assert.throws(
    () => apply(db, "claire", { type: "project.close", projectId: p.id }),
    /Handover/,
  );
  p = D.clone(paws(db));
  p.milestones
    .filter((m) => m.phase === "design" && m.required)
    .forEach((m) => (m.status = "Complete"));
  assert.equal(D.progression(p), "pre-construction");
  assert.equal(p.phase, "design");
});
test("custom milestone, required validation, reassignment protection, reordering and archive", () => {
  let db = fresh(),
    p = paws(db);
  const originalPhase = p.phase;
  db = apply(db, "claire", {
    type: "milestone.save",
    projectId: p.id,
    data: {
      title: "Independent inspection",
      phase: "commissioning",
      ownerId: "daniel",
      required: false,
      dueDate: "2026-11-01",
    },
  });
  const m = paws(db).milestones.at(-1);
  db = apply(db, "claire", {
    type: "milestone.move",
    projectId: p.id,
    id: m.id,
    direction: -1,
  });
  assert.equal(
    paws(db).milestones.find((x) => x.id === m.id).phase,
    "commissioning",
  );
  assert.equal(paws(db).phase, originalPhase);
  assert.throws(
    () =>
      apply(db, "claire", {
        type: "milestone.save",
        projectId: p.id,
        id: m.id,
        data: { dueDate: "2026-02-31" },
      }),
    /valid due date/,
  );
  assert.throws(
    () =>
      apply(db, "claire", {
        type: "project.save",
        projectId: p.id,
        data: { team: paws(db).team.filter((t) => t.personId !== "daniel") },
      }),
    /Reassign/,
  );
  db = apply(db, "claire", {
    type: "milestone.archive",
    projectId: p.id,
    id: m.id,
  });
  assert(!D.activeMilestones(paws(db)).some((x) => x.id === m.id));
  assert(paws(db).activity.some((e) => e.type === "milestone.archived"));
});
