const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const D = require("../fieldwork-domain.js");
require("../fieldwork-seed.js");
const makeUI = require("../fieldwork-ui.js");
global.localStorage = { getItem: () => null, setItem: () => {} };
class Base {
  setState(update) {
    Object.assign(
      this.state,
      typeof update === "function" ? update(this.state) : update,
    );
  }
  forceUpdate() {}
}
const UI = makeUI(Base);
const ui = () => {
  const u = new UI();
  u.showToast = (message) => u.setState({ toastMsg: message });
  return u;
};

test("commercial reads follow role plus project assignment across every view", () => {
  for (const person of D.PEOPLE) {
    const u = ui();
    u.state.actingAs = person.n;
    const p = u.projectById("061");
    u.openProject(p.id);
    const canRead = ["sophia", "claire", "grace", "jordan"].includes(person.id);
    assert.equal(D.canViewCommercial(p, person.id), canRead, person.n);
    const v = u.renderVals();
    assert.equal(v.showCommercial, canRead);
    assert.equal(
      v.healthValues.some((x) => x.label === "Contract value"),
      canRead,
    );
    assert.equal(
      v.briefSections.some((x) => x.rows.some((r) => r.key === "budget")),
      canRead,
    );
    u.state.peekId = p.id;
    assert.equal(
      u.renderVals().peek.scope.some((x) => x.label === "Commercial"),
      canRead,
    );
    u.showDialog("package", p.id, p.workPackages[0].id);
    assert.equal(
      u.renderDialog().opsFields.some((x) => x.key === "budget"),
      canRead,
    );
    if (!canRead) assert.equal(u.state.editor.budget, undefined);
    u.closeDialog();
    u.showDialog("health", p.id);
    assert.equal(u.state.dialog?.kind === "health", canRead);
    if (person.id === "jordan")
      assert(u.renderDialog().opsFields.every((f) => f.disabled));
  }
  const u = ui();
  const other = u.state.db.projects.find((p) => p.leadId === "sophia");
  assert.equal(D.canViewCommercial(other, "claire"), false);
  u.openProject(other.id);
  assert.equal(u.renderVals().showCommercial, false);
  const q = u.state.db.enquiries.find((q) => q.ownerId !== "claire");
  u.showDialog("enquiry", null, q.id);
  assert(!u.renderDialog().opsDescription.includes("Budget:"));
});

test("commercial activity and risk do not leak into delivery-only read models", () => {
  const u = ui();
  const p = u.projectById("061");
  p.activity.unshift({
    id: "secret",
    actorId: "claire",
    type: "commercial.changed",
    text: "Forecast over ¥9M",
    at: new Date().toISOString(),
  });
  assert(!D.visibleActivity(p, "amy").some((e) => e.id === "secret"));
  assert(D.visibleActivity(p, "jordan").some((e) => e.id === "secret"));
  u.switchRole("Amy Liu");
  u.openProject(p.id);
  assert(
    !u
      .renderVals()
      .timelineDisplay.some((g) => g.items.some((e) => e.body.includes("¥9M"))),
  );
  assert(u.renderVals().projectRows.every((p) => p.commercialHealth === ""));
  assert.equal(u.renderVals().showCommercialColumn, false);
});

test("filters reset together and template browsing applies the real service scope", () => {
  const u = ui();
  u.state.cityFilter = "Harbin";
  u.state.phaseTab = "design";
  u.state.scheduleHealthFilter = "Delayed";
  assert(u.renderVals().projectRows.every((p) => p.city === "Harbin"));
  assert.equal(u.renderVals().filterChips.length, 3);
  u.renderVals().clearFilters();
  assert.equal(u.state.cityFilter, "all");
  assert.equal(u.state.phaseTab, "all");
  u.state.standardsSector = "Cinema";
  u.state.standardsService = "Design only";
  assert(
    !u.renderVals().standardPhases.some((g) => g.label === "Construction"),
  );
  assert.equal(
    u.renderVals().standardMilestoneCount,
    D.templateFor("Cinema", "Design only").length,
  );
});

test("weekly editing guards navigation, imports without duplicates and saves to the right employee/week", () => {
  const u = ui();
  u.switchRole("Amy Liu");
  u.navigateTo("team");
  u.renderVals().setWeeklyDone({
    target: { value: "Drawing coordination complete" },
  });
  u.go("standards");
  assert(u.state.showUnsavedConfirm);
  u.saveAndNavigate();
  assert.equal(u.state.page, "standards");
  assert(!u.state.weeklyDirty);
  assert.equal(u.state.db.weeklyReports[0].personId, "amy");
  u.navigateTo("team");
  u.renderVals().useWeeklySuggestions();
  const once = u.state.weeklySource;
  u.renderVals().useWeeklySuggestions();
  assert.equal(u.state.weeklySource, once);
  assert.equal(u.renderVals().canReviewReports, false);
  u.submitWeeklyReport();
  const currentWeek = u.state.weeklyWeekKey;
  u.setWeeklyWeek({ target: { value: D.addDays(currentWeek, -10) } });
  assert.equal(u.state.weeklyWeekKey, D.weekStart(D.addDays(currentWeek, -10)));
  assert.equal(u.renderVals().weeklyWeekValue, u.state.weeklyWeekKey);
  u.setWeeklyWeek({ target: { value: D.addDays(D.weekStart(), 1) } });
  assert.equal(u.state.weeklyWeekKey, D.weekStart());
  const fakeInput = {
    showPickerCalls: 0,
    showPicker() {
      this.showPickerCalls += 1;
    },
    focusCalls: 0,
    focus() {
      this.focusCalls += 1;
    },
    clickCalls: 0,
    click() {
      this.clickCalls += 1;
    },
  };
  u.renderVals().openWeeklyWeekPicker({
    currentTarget: {
      querySelector(sel) {
        return sel === "input[type=date]" ? fakeInput : null;
      },
    },
    preventDefault() {},
  });
  assert.equal(fakeInput.showPickerCalls, 1);
  u.switchRole("Sophia Chen");
  u.navigateTo("team");
  assert(u.renderVals().canReviewReports);
  u.renderVals()
    .weeklyAllRows.find((r) => r.name === "Amy Liu")
    .open();
  assert.equal(
    u.renderVals().selectedReport.done,
    "Drawing coordination complete",
  );
});
test("all page and editor views render for every simulated role including empty stores", () => {
  for (const user of D.PEOPLE) {
    const u = ui();
    u.state.actingAs = user.n;
    for (const page of [
      "portfolio",
      "intake",
      "schedule",
      "mywork",
      "locations",
      "people",
      "team",
      "standards",
      "settings",
      "support",
      "new",
      "detail",
    ]) {
      u.state.page = page;
      assert.doesNotThrow(() => u.renderVals(), user.n + " / " + page);
    }
    const p = u.projectById("061");
    u.setState(u.loadProjectState(p));
    for (const [kind, id] of [
      ["milestones", null],
      ["milestone", p.milestones[0].id],
      ["milestone", null],
      ["package", p.workPackages[0].id],
      ["health", null],
      ["hold", null],
      ["enquiry", u.state.db.enquiries[0].id],
    ]) {
      u.showDialog(kind, kind === "enquiry" ? null : p.id, id);
      assert.doesNotThrow(() => u.renderVals());
    }
  }
  const u = ui();
  u.state.db.projects = [];
  u.state.db.enquiries = [];
  assert.doesNotThrow(() => u.renderVals());
  assert.equal(u.renderVals().projectRows.length, 0);
});
test("project edits and private comments persist across navigation and role switching", () => {
  const u = ui();
  u.openProject("061");
  u.patch({
    fields: {
      ...u.state.fields,
      siteName: "New site",
      city: "Harbin",
      brief: "Updated scope",
    },
  });
  assert(u.state.detailDirty);
  assert(u.saveDetailChanges());
  u.navigateTo("portfolio");
  u.openProject("061");
  assert.equal(u.state.fields.brief, "Updated scope");
  assert.equal(u.state.fields.siteName, "New site");
  u.state.commentDraft = "Private test";
  u.state.commentOnlyMe = true;
  u.postComment();
  assert(
    u
      .renderVals()
      .timelineDisplay.some((g) =>
        g.items.some((e) => e.body === "Private test"),
      ),
  );
  u.switchRole("Li Wei");
  u.openProject("061");
  assert(
    !u
      .renderVals()
      .timelineDisplay.some((g) =>
        g.items.some((e) => e.body === "Private test"),
      ),
  );
});
test("unsaved project and modal edits guard navigation and save-and-leave failures stay open", () => {
  const u = ui();
  u.openProject("061");
  u.patch({ fields: { ...u.state.fields, city: "" } });
  u.go("schedule");
  assert(u.state.showUnsavedConfirm);
  u.saveAndNavigate();
  assert.equal(u.state.page, "detail");
  assert(u.state.showUnsavedConfirm);
  u.discardAndNavigate();
  assert.equal(u.state.page, "schedule");
  u.openDialog("milestone", "061", null);
  u.editValue("title", "Unsaved");
  u.closeDialog();
  assert(u.state.showUnsavedConfirm);
  u.discardAndNavigate();
  assert.equal(u.state.dialog, null);
});
test("workflow buttons mutate canonical state and Schedule immediately reflects updates", () => {
  const u = ui();
  u.openProject("061");
  const m = u
    .currentProject()
    .milestones.find((m) => m.title === "Shielding design approved");
  u.showDialog("milestone", "061", m.id);
  u.editValue("dueDate", "2026-12-01");
  assert(u.saveEditor());
  u.navigateTo("schedule");
  const row = u
    .renderVals()
    .scheduleGroups.flatMap((g) => g.items)
    .find((r) => r.id === m.id);
  assert.equal(row.due, "1 Dec");
  u.showDialog("enquiry", null, u.state.db.enquiries[0].id);
  u.editValue("status", "Under review");
  assert(u.saveEditor());
  assert.equal(u.state.db.enquiries[0].status, "Under review");
  assert.equal(u.state.dialog?.kind, "enquiry");
});
test("enquiry qualification converts into a project and lands on project setup", () => {
  const u = ui();
  u.switchRole("Sophia Chen");
  u.navigateTo("intake");
  const ready = u.state.db.enquiries.find((q) => q.code === "RQ-112");
  assert.equal(ready.status, "Ready to scope");
  const row = u.renderVals().intakeRows.find((q) => q.code === "RQ-112");
  assert.equal(row.cta, "Review enquiry");
  assert.deepEqual(
    row.menuActions.map((a) => a.label),
    ["Review enquiry", "Convert to project"],
  );
  u.showDialog("enquiry", null, ready.id);
  assert(
    u.renderDialog().opsActions.some((a) => a.label === "Convert to project"),
  );
  u.editValue("leadId", "claire");
  u.convertEnquiry();
  assert.equal(u.state.page, "detail");
  const converted = u.state.db.enquiries.find((q) => q.id === ready.id);
  assert.equal(converted.status, "Converted");
  assert.equal(u.state.detailId, converted.projectId);
  assert(u.renderVals().setupPending);
  u.navigateTo("intake");
  assert.equal(
    u.renderVals().intakeRows.find((q) => q.code === "RQ-112"),
    undefined,
  );
  u.setState({ intakeStatusFilter: "Converted" });
  const view = u.renderVals().intakeRows.find((q) => q.code === "RQ-112");
  assert.equal(view.cta, "View project");
  assert.deepEqual(
    view.menuActions.map((a) => a.label),
    ["View project"],
  );
});
test("enquiry list filters hide declined by default and support status search", () => {
  const u = ui();
  u.switchRole("Sophia Chen");
  u.navigateTo("intake");
  const vals = u.renderVals();
  assert.equal(vals.intakeStatusFilter, "active");
  assert(!vals.intakeRows.some((q) => q.status === "Declined"));
  assert(!vals.intakeRows.some((q) => q.status === "Converted"));
  u.setState({ intakeStatusFilter: "Declined" });
  const declined = u.renderVals().intakeRows;
  assert(declined.length);
  assert(declined.every((q) => q.status === "Declined"));
  u.setState({ intakeStatusFilter: "all", intakeSearch: "zzzz-no-match" });
  const empty = u.renderVals();
  assert.equal(empty.intakeHasRows, false);
  assert.equal(empty.intakeNoMatches, true);
  assert.equal(empty.hasIntakeFilters, true);
});
test("existing template top-level bindings are supplied by the DC controller", () => {
  const html = fs.readFileSync(require.resolve("../Fieldwork.dc.html"), "utf8");
  const u = ui(),
    values = u.renderVals();
  const refs = [...html.matchAll(/\{\{\s*([A-Za-z_]\w*)\s*\}\}/g)].map(
    (m) => m[1],
  );
  const locals = [...html.matchAll(/\bas="([^"]+)"/g)].map((m) => m[1]);
  const missing = [...new Set(refs)].filter(
    (key) =>
      !(key in values) &&
      !locals.includes(key) &&
      !["true", "false"].includes(key),
  );
  assert.deepEqual(missing, []);
});
