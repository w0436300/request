/* Hand-authored DCLogic controller. All business writes go through FieldworkDomain. */
(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("./fieldwork-domain.js"));
  else root.FieldworkUI = factory(root.FieldworkDomain);
})(typeof globalThis === "object" ? globalThis : this, function (D) {
  "use strict";
  const STORAGE_KEY = "fieldwork.operations.v3";
  const HOLD = {
    label: "On hold",
    color: "#B04A4A",
    tint: "#F7ECEC",
    desc: "The delivery phase is retained while the project is paused.",
  };
  const TIER = {
    owner: "Owner / Manager",
    contributor: "Contributor",
    viewer: "Viewer / Oversight",
  };
  const initials = (n) =>
    String(n || "")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  const color = (id) => D.person(id)?.c || "#667085";
  const dateLabel = (iso) =>
    iso
      ? D.date(iso)?.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) || "Not set"
      : "Not set";
  const shortDate = (iso) =>
    iso
      ? D.date(iso)?.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }) || "Not set"
      : "Not set";
  const due = (iso) =>
    !iso
      ? "No date set"
      : D.days(iso) < 0
        ? "Overdue · " + shortDate(iso)
        : D.days(iso) === 0
          ? "Due today"
          : "Due " + shortDate(iso);
  const stamp = (iso) =>
    new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  const tone = (label) =>
    ["Delayed", "Forecast over", "Blocked"].includes(label)
      ? "#B04A4A"
      : ["At risk", "Changes requested"].includes(label)
        ? "#8F6318"
        : label === "Complete"
          ? "#2F6B4F"
          : "#5367D4";
  const money = (value) =>
    value === "" || value == null
      ? "Not set"
      : "¥" + Number(value).toLocaleString("en-US");
  const safeUrl = (value) => {
    try {
      const u = new URL(value);
      return ["https:", "http:"].includes(u.protocol) ? u.href : "";
    } catch {
      return "";
    }
  };
  const textOptions = (values) =>
    values.map((value) => ({ value, label: value }));
  const personOptions = (people) =>
    people.map((p) => ({ value: p.id, label: p.n + " · " + p.role }));
  const phaseOptions = D.PHASE_KEYS.map((value) => ({
    value,
    label: D.PHASES[value].label,
  }));
  const BRIEF_FIELDS = [
    { key: "brief", label: "Brief", type: "area", section: 1 },
    {
      key: "service",
      label: "Service scope",
      type: "select",
      options: textOptions(D.SERVICES),
      section: 1,
    },
    { key: "deliverables", label: "Deliverables", section: 1 },
    { key: "exclusions", label: "Not included", section: 1 },
    { key: "client", label: "Client organisation", section: 2 },
    { key: "country", label: "Country", section: 2 },
    { key: "region", label: "Province / region", section: 2 },
    { key: "city", label: "City", section: 2 },
    { key: "siteName", label: "Site name / site TBD", section: 2 },
    { key: "siteAddress", label: "Site address", section: 2 },
    { key: "contactName", label: "Client contact (external)", section: 2 },
    { key: "contactEmail", label: "Email", section: 2 },
    { key: "contactPhone", label: "Phone / WeChat", section: 2 },
    {
      key: "buildingType",
      label: "Sector",
      type: "select",
      options: textOptions(D.SECTORS),
      section: 2,
    },
    { key: "programme", label: "Programme", section: 3 },
    {
      key: "targetOpening",
      label: "Target opening",
      type: "date",
      section: 3,
    },
    { key: "budget", label: "Budget band", section: 3 },
    { key: "fee", label: "Contract basis", section: 3 },
    { key: "assumptions", label: "Assumptions", section: 3 },
  ];
  const wizardBlank = () => ({
    newName: "",
    newBrief: "",
    newService: "Design & build",
    newClient: "",
    newClientPick: "",
    newCountry: "China",
    newRegion: "",
    newCity: "",
    newSite: "",
    newAddress: "",
    newPhone: "",
    newEmail: "",
    newContactName: "",
    newBuilding: "Cinema",
    newProgramme: "",
    newBudget: "",
    newArea: "",
    newOpening: "",
    newRequestOwner: "sophia",
    newTags: [],
    newFiles: [],
    newTagPick: "",
    newRequirements: {},
  });
  function initialStore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (
        saved?.version === D.VERSION &&
        Array.isArray(saved.projects) &&
        Array.isArray(saved.enquiries)
      ) {
        const next = D.ensureDemoWeeklyReports(saved);
        if (next !== saved) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {}
        }
        return next;
      }
    } catch {}
    const seed =
      typeof FieldworkSeed !== "undefined"
        ? FieldworkSeed
        : { projects: [], enquiries: [] };
    return D.createDemoStore(seed.projects, seed.enquiries);
  }
  const blankState = () => ({
    db: initialStore(),
    page: "portfolio",
    navOpen: false,
    actingAs: "Claire Wang",
    peekId: "",
    peekTab: "brief",
    detailId: "061",
    detailTab: "delivery",
    phaseTab: "all",
    search: "",
    serviceFilter: "all",
    sectorFilter: "all",
    leadFilter: "all",
    clientFilter: "all",
    dueFilter: "all",
    cityFilter: "all",
    scheduleHealthFilter: "all",
    commercialHealthFilter: "all",
    showProjectFilters: false,
    showScheduleFilters: false,
    intakeSearch: "",
    intakeStatusFilter: "active",
    intakeMenuId: "",
    standardsTab: "templates",
    standardsSector: "Pet hospital",
    standardsService: "Design & build",
    standardsExpandedItem: "",
    weeklySuggestionsOpen: false,
    weeklyPerson: "",
    weeklyDirty: false,
    holdOnly: false,
    metric: "all",
    listGroup: "flat",
    sortKey: "milestone",
    sortDir: "asc",
    listPage: 1,
    listPageSize: 8,
    scheduleBucket: "all",
    scheduleSearch: "",
    schedulePage: 1,
    schedulePageSize: 10,
    scheduleFilters: {
      city: "all",
      project: "all",
      phase: "all",
      owner: "all",
      status: "all",
      sector: "all",
    },
    selectedCity: "",
    fields: {},
    savedFields: {},
    members: [],
    savedMembers: [],
    tags: [],
    savedTags: [],
    files: [],
    savedFiles: [],
    draftPhase: "",
    savedPhase: "",
    phaseNote: "",
    editingBrief: false,
    detailDirty: false,
    showPhaseMenu: false,
    showManageTags: false,
    showAssignForm: false,
    showAccountMenu: false,
    showAlerts: false,
    showPeekPhaseMenu: false,
    assignPerson: "",
    assignSearch: "",
    assignRoleSelect: "Specialist",
    tagPickSelect: "",
    newTag: "",
    timelineFilter: "all",
    timelineLimit: 8,
    commentDraft: "",
    commentOnlyMe: false,
    showQuickComment: false,
    quickCommentCode: "",
    quickCommentName: "",
    quickCommentDraft: "",
    quickCommentOnlyMe: false,
    showDeleteConfirm: false,
    pendingDelete: null,
    showUnsavedConfirm: false,
    pendingNavigation: null,
    dialog: null,
    editor: null,
    editorDirty: false,
    dialogError: "",
    milestoneFocus: "",
    wizardStep: 1,
    submitted: false,
    draftId: "",
    wizardDirty: false,
    newReqCode: "",
    newReqName: "",
    ...wizardBlank(),
    teamTab: "mine",
    weeklyWeekKey: D.weekStart(),
    weeklySource: "",
    weeklyDone: "",
    weeklyPlan: "",
    weeklyIssues: "",
    toastMsg: "",
    storageWarning: "",
    uploading: false,
  });
  return (Base) =>
    class FieldworkController extends Base {
      state = blankState();
      componentDidMount() {
        this.beforeUnload = (e) => {
          if (this.isDirty()) {
            e.preventDefault();
            e.returnValue = "";
          }
        };
        window.addEventListener("beforeunload", this.beforeUnload);
        this.dayTimer = setInterval(() => {
          if (this.lastDay !== D.today()) {
            this.lastDay = D.today();
            this.forceUpdate();
          }
        }, 60000);
        this.lastDay = D.today();
      }
      componentWillUnmount() {
        window.removeEventListener("beforeunload", this.beforeUnload);
        clearInterval(this.dayTimer);
        clearTimeout(this.toastTimer);
      }
      actor() {
        return D.person(this.state.actingAs).id;
      }
      allProjects() {
        return this.state.db.projects;
      }
      projectById(id) {
        return this.allProjects().find((p) => p.id === id) || null;
      }
      currentProject() {
        return this.projectById(this.state.detailId);
      }
      isDirty() {
        return (
          this.state.detailDirty ||
          this.state.editorDirty ||
          this.state.wizardDirty ||
          this.state.weeklyDirty
        );
      }
      commit(db, patch = {}) {
        let storageWarning = "";
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        } catch {
          storageWarning =
            "Browser storage is unavailable or full. Changes remain in this tab; download large files and use references.";
        }
        this.setState({ db, storageWarning, ...patch });
      }
      act(action, patch = {}) {
        try {
          const db = D.apply(this.state.db, this.actor(), action);
          this.commit(db, { dialogError: "", ...patch });
          return db;
        } catch (e) {
          this.setState({ dialogError: e.message });
          this.showToast(e.message);
          return null;
        }
      }
      showToast(msg) {
        this.setState({ toastMsg: msg });
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(
          () => this.setState({ toastMsg: "" }),
          4200,
        );
      }
      guard(fn) {
        if (this.state.uploading) {
          this.showToast("Wait for the attachment to finish loading.");
          return;
        }
        if (this.isDirty()) {
          this.setState({ showUnsavedConfirm: true, pendingNavigation: fn });
          return;
        }
        fn();
      }
      closeUnsavedConfirm() {
        this.setState({ showUnsavedConfirm: false, pendingNavigation: null });
      }
      discardAndNavigate() {
        const fn = this.state.pendingNavigation;
        this.cancelDetailChanges();
        this.setState({
          editorDirty: false,
          wizardDirty: false,
          weeklyDirty: false,
          showUnsavedConfirm: false,
          pendingNavigation: null,
        });
        if (fn) fn();
      }
      saveAndNavigate() {
        const fn = this.state.pendingNavigation;
        let ok = true;
        if (this.state.editorDirty) ok = this.saveEditor();
        else if (this.state.wizardDirty) this.saveDraft();
        else if (this.state.detailDirty) ok = this.saveDetailChanges();
        else if (this.state.weeklyDirty) ok = this.submitWeeklyReport();
        if (ok) {
          this.closeUnsavedConfirm();
          if (fn) fn();
        }
      }
      navigateTo(page) {
        const u = D.person(this.actor());
        if (["new", "intake"].includes(page) && !D.canIntake(u.id)) {
          this.showToast(
            "Enquiries are maintained by Operations and Project Leads.",
          );
          return;
        }
        if (
          ["settings", "locations", "people"].includes(page) &&
          !["owner", "viewer"].includes(u.tier)
        ) {
          this.showToast("Company operations are available to management.");
          return;
        }
        if (page === "settings" && u.role !== "Operations manager") {
          this.showToast("Settings are maintained by Operations.");
          return;
        }
        const patch = {
          page,
          navOpen: false,
          peekId: "",
          showAccountMenu: false,
          showAlerts: false,
          intakeMenuId: "",
          dialog: null,
          editor: null,
          editorDirty: false,
          dialogError: "",
          detailDirty: false,
        };
        if (page === "new")
          Object.assign(patch, wizardBlank(), {
            wizardStep: 1,
            submitted: false,
            draftId: "",
            wizardDirty: false,
          });
        if (page === "team")
          Object.assign(patch, this.weeklyDraftFor(this.state.weeklyWeekKey));
        this.setState(patch);
      }
      go(page) {
        this.guard(() => this.navigateTo(page));
      }
      switchRole(name) {
        this.guard(() => {
          const p = D.person(name);
          this.setState({
            actingAs: name,
            commercialHealthFilter: "all",
            weeklySource: "",
            weeklyDone: "",
            weeklyPlan: "",
            weeklyIssues: "",
            weeklyDirty: false,
            weeklyPerson: "",
            teamTab: "mine",
            page: p.tier === "contributor" ? "mywork" : "portfolio",
            peekId: "",
            dialog: null,
            editor: null,
            editorDirty: false,
            detailDirty: false,
            wizardDirty: false,
            showAccountMenu: false,
            showAssignForm: false,
            showPhaseMenu: false,
            showManageTags: false,
            showPeekPhaseMenu: false,
            commentDraft: "",
            commentOnlyMe: false,
          });
          this.showToast("Viewing as " + name + " · " + p.role);
        });
      }
      projectFields(p) {
        return {
          brief: p.brief,
          service: p.service,
          deliverables: p.deliverables || "",
          exclusions: p.exclusions || "",
          client: p.client,
          ...p.location,
          contactName: p.contact.name,
          contactEmail: p.contact.email,
          contactPhone: p.contact.phone,
          buildingType: p.sector,
          programme: p.programme,
          targetOpening: p.targetOpening,
          ...(D.canViewCommercial(p, this.actor())
            ? { budget: p.budgetBand, fee: p.contractBasis }
            : {}),
          assumptions: p.assumptions || "",
        };
      }
      loadProjectState(p, tab = "delivery") {
        const fields = this.projectFields(p),
          members = p.team.map((t) => ({
            n: D.name(t.personId),
            i: initials(D.name(t.personId)),
            c: color(t.personId),
            role: t.role,
          }));
        return {
          page: "detail",
          detailId: p.id,
          detailTab: tab,
          fields,
          savedFields: D.clone(fields),
          members,
          savedMembers: D.clone(members),
          tags: [...p.tags],
          savedTags: [...p.tags],
          files: D.clone(p.attachments),
          savedFiles: D.clone(p.attachments),
          draftPhase: p.phase,
          savedPhase: p.phase,
          phaseNote: "",
          detailDirty: false,
          editingBrief: false,
          dialog: null,
          editor: null,
          editorDirty: false,
          showPhaseMenu: false,
          showManageTags: false,
          showAssignForm: false,
          navOpen: false,
          showAlerts: false,
          timelineLimit: 8,
          commentDraft: "",
          commentOnlyMe: false,
        };
      }
      openProject(id, tab = "delivery") {
        this.guard(() => {
          const p = this.projectById(id);
          if (!p || !D.canView(p, this.actor())) {
            this.showToast("This project is not assigned to you.");
            return;
          }
          this.setState(this.loadProjectState(p, tab));
        });
      }
      goDetailTab(tab) {
        this.guard(() => this.setState({ detailTab: tab }));
      }
      computeDirty(s) {
        return (
          s.draftPhase !== s.savedPhase ||
          ["fields", "members", "tags", "files"].some(
            (k) =>
              JSON.stringify(s[k]) !==
              JSON.stringify(s["saved" + k[0].toUpperCase() + k.slice(1)]),
          )
        );
      }
      patch(data) {
        const p = this.currentProject();
        if (!p || !D.canManage(p, this.actor()) || !D.isActive(p)) {
          this.showToast(
            "Only the assigned Project Lead or Operations can edit this project.",
          );
          return;
        }
        this.setState((s) => ({
          ...data,
          detailDirty: this.computeDirty({ ...s, ...data }),
        }));
      }
      cancelDetailChanges() {
        const p = this.currentProject();
        if (p)
          this.setState({
            ...this.loadProjectState(p, this.state.detailTab),
            page: this.state.page,
          });
      }
      saveDetailChanges() {
        if (this.state.uploading) {
          this.showToast("Wait for the attachment to finish loading.");
          return false;
        }
        const s = this.state,
          p = this.currentProject();
        if (!s.detailDirty) return true;
        if (!p) return false;
        const f = s.fields;
        const data = {
          brief: f.brief,
          service: f.service,
          deliverables: f.deliverables,
          exclusions: f.exclusions,
          client: f.client,
          location: D.location({
            country: f.country,
            region: f.region,
            city: f.city,
            siteName: f.siteName,
            siteAddress: f.siteAddress,
          }),
          contact: {
            name: f.contactName,
            email: f.contactEmail,
            phone: f.contactPhone,
          },
          sector: f.buildingType,
          programme: f.programme,
          targetOpening: f.targetOpening,
          budgetBand: f.budget,
          contractBasis: f.fee,
          assumptions: f.assumptions,
          team: s.members.map((m) => ({
            personId: D.person(m.n)?.id,
            role: m.role,
          })),
          tags: s.tags,
          attachments: s.files,
        };
        try {
          let db = D.apply(s.db, this.actor(), {
            type: "project.save",
            projectId: p.id,
            data,
          });
          if (s.draftPhase !== p.phase)
            db = D.apply(db, this.actor(), {
              type: "project.phase",
              projectId: p.id,
              phase: s.draftPhase,
              note: s.phaseNote,
            });
          this.commit(
            db,
            this.loadProjectState(
              db.projects.find((x) => x.id === p.id),
              s.detailTab,
            ),
          );
          this.showToast("Project saved.");
          return true;
        } catch (e) {
          this.showToast(e.message);
          return false;
        }
      }
      setPhaseDirect(id, phase) {
        this.guard(() => {
          if (
            this.act(
              { type: "project.phase", projectId: id, phase },
              { showPeekPhaseMenu: false },
            )
          )
            this.showToast("Phase updated.");
        });
      }
      openDialog(kind, projectId, id) {
        this.guard(() => this.showDialog(kind, projectId, id));
      }
      showDialog(kind, projectId, id) {
        const p = this.projectById(projectId),
          m = p?.milestones.find((m) => m.id === id),
          w = p?.workPackages.find((w) => w.id === id);
        const actor = this.actor();
        if (p && !D.canView(p, actor)) return;
        if (kind === "health" && !D.canViewCommercial(p, actor)) return;
        if (kind === "enquiry") {
          const q = this.state.db.enquiries.find((q) => q.id === id);
          if (
            !q ||
            !(
              D.canIntake(actor) ||
              ["Finance", "Director"].includes(D.person(actor).role)
            )
          )
            return;
        }
        let editor = null;
        if (kind === "milestone")
          editor = m
            ? {
                ...D.clone(m),
                dependencyActor: m.externalDependency?.actor || "",
                dependencyNote: m.externalDependency?.note || "",
                actionNote: "",
              }
            : {
                title: "",
                phase: p.phase,
                ownerId: p.leadId,
                reviewerId: "",
                dueDate: "",
                workPackageId: "",
                reviewRequired: false,
                required: false,
                deliverable: "",
                dependencyActor: "",
                dependencyNote: "",
                attachments: [],
                actionNote: "",
              };
        if (kind === "package")
          editor = w
            ? D.clone(w)
            : {
                name: "",
                scope: "",
                leadId: p.leadId,
                contributorIds: [],
                startDate: "",
                targetFinish: "",
                budget: "",
                progress: "",
              };
        if (kind === "package" && !D.canViewCommercial(p, actor))
          delete editor.budget;
        if (kind === "health")
          editor = {
            ...D.clone(p.commercial),
            scheduleHealth: p.schedule.health,
            plannedCompletion: p.schedule.plannedCompletion,
            forecastCompletion: p.schedule.forecastCompletion,
          };
        if (kind === "hold")
          editor = p.hold
            ? D.clone(p.hold)
            : {
                reason: "",
                ownerId: p.leadId,
                expectedResume: "",
                impact: "",
              };
        if (kind === "enquiry") {
          const q = this.state.db.enquiries.find((q) => q.id === id);
          editor = {
            status: q.status,
            waiting: !!q.externalDependency,
            externalNote: q.externalDependency?.note || "",
            declinedReason: q.declinedReason || "",
            declinedNote: q.declinedNote || "",
            leadId:
              D.person(this.actor()).role === "Project lead"
                ? this.actor()
                : "claire",
          };
        }
        this.setState({
          dialog: { kind, projectId, id },
          editor,
          editorDirty: false,
          dialogError: "",
          showPhaseMenu: false,
          showPeekPhaseMenu: false,
        });
      }
      closeDialog() {
        this.guard(() =>
          this.setState({
            dialog: null,
            editor: null,
            editorDirty: false,
            dialogError: "",
          }),
        );
      }
      editValue(key, value) {
        this.setState((s) => ({
          editor: { ...s.editor, [key]: value },
          editorDirty: true,
          dialogError: "",
        }));
      }
      saveEditor() {
        const s = this.state,
          d = s.dialog,
          e = s.editor;
        if (!d || !e) return true;
        const p = this.projectById(d.projectId);
        let action;
        if (d.kind === "milestone") {
          if (!D.canManage(p, this.actor())) return this.saveDeliverable();
          action = {
            type: "milestone.save",
            projectId: p.id,
            id: d.id,
            data: {
              title: e.title,
              phase: e.phase,
              workPackageId: e.workPackageId || null,
              ownerId: e.ownerId,
              reviewerId: e.reviewerId || null,
              dueDate: e.dueDate,
              reviewRequired: !!e.reviewRequired,
              required: !!e.required,
              deliverable: e.deliverable || "",
              externalDependency: e.dependencyActor
                ? { actor: e.dependencyActor, note: e.dependencyNote }
                : null,
            },
          };
        } else if (d.kind === "package") {
          const progress =
            e.progress === "" || e.progress === null
              ? null
              : Number(e.progress);
          action = {
            type: "workPackage.save",
            projectId: p.id,
            id: d.id,
            data: D.canManage(p, this.actor())
              ? {
                  name: e.name,
                  scope: e.scope,
                  leadId: e.leadId,
                  contributorIds: e.contributorIds,
                  startDate: e.startDate,
                  targetFinish: e.targetFinish,
                  budget: e.budget,
                  progress,
                }
              : {
                  scope: e.scope,
                  startDate: e.startDate,
                  targetFinish: e.targetFinish,
                  progress,
                },
          };
        } else if (d.kind === "health") {
          const commercial = {};
          for (const k of [
            "contractValue",
            "approvedBudget",
            "approvedVariations",
            "committedCost",
            "forecastFinalCost",
            "health",
          ])
            commercial[k] = e[k];
          const data = { commercial };
          if (D.canManage(p, this.actor()))
            data.schedule = {
              health: e.scheduleHealth,
              plannedCompletion: e.plannedCompletion,
              forecastCompletion: e.forecastCompletion,
            };
          action = {
            type: "project.save",
            projectId: p.id,
            data,
            summary: "Updated project health and commercial forecast.",
          };
        } else if (d.kind === "hold")
          action = {
            type: "project.hold",
            projectId: p.id,
            hold: {
              reason: e.reason,
              ownerId: e.ownerId,
              expectedResume: e.expectedResume,
              impact: e.impact,
            },
          };
        else if (d.kind === "enquiry")
          action = {
            type: "enquiry.update",
            id: d.id,
            status: e.status,
            waiting: e.waiting,
            note: e.externalNote,
            declinedReason: e.declinedReason,
            declinedNote: e.declinedNote,
          };
        if (!action) return true;
        const db = this.act(action, { editorDirty: false });
        if (!db) return false;
        if (d.kind === "enquiry") {
          this.showDialog("enquiry", null, d.id);
          this.showToast(
            e.status === "Ready to scope"
              ? "Ready to scope · Assign a Project Lead and convert."
              : e.status === "Declined"
                ? "Enquiry declined."
                : "Qualification saved.",
          );
          return true;
        }
        this.setState({ dialog: null, editor: null });
        this.showToast("Saved.");
        return true;
      }
      saveDeliverable() {
        const { dialog: d, editor: e } = this.state;
        const db = this.act(
          {
            type: "milestone.action",
            projectId: d.projectId,
            id: d.id,
            action: "deliverable",
            deliverable: e.deliverable,
            attachments: e.attachments,
          },
          { editorDirty: false },
        );
        if (db) {
          this.showDialog("milestone", d.projectId, d.id);
          this.showToast("Deliverable saved.");
          return true;
        }
        return false;
      }
      milestoneAction(action) {
        const { dialog: d, editor: e } = this.state;
        // Save edited deliverables atomically before an owner submits.
        try {
          let db = this.state.db;
          const p = this.projectById(d.projectId),
            m = p.milestones.find((x) => x.id === d.id);
          if (this.state.editorDirty) {
            const planKeys = [
              "title",
              "phase",
              "ownerId",
              "reviewerId",
              "dueDate",
              "workPackageId",
              "reviewRequired",
              "required",
            ];
            if (
              planKeys.some((k) => (e[k] || "") !== (m[k] || "")) ||
              e.dependencyActor !== (m.externalDependency?.actor || "") ||
              e.dependencyNote !== (m.externalDependency?.note || "")
            )
              throw new Error(
                "Save plan changes before changing milestone status.",
              );
            if (
              e.deliverable !== m.deliverable ||
              JSON.stringify(e.attachments) !== JSON.stringify(m.attachments)
            )
              db = D.apply(db, this.actor(), {
                type: "milestone.action",
                projectId: p.id,
                id: m.id,
                action: "deliverable",
                deliverable: e.deliverable,
                attachments: e.attachments,
              });
          }
          db = D.apply(db, this.actor(), {
            type: "milestone.action",
            projectId: d.projectId,
            id: d.id,
            action,
            note: e.actionNote,
          });
          this.commit(db, { editorDirty: false });
          this.showDialog("milestone", d.projectId, d.id);
          this.showToast("Milestone updated.");
        } catch (err) {
          this.setState({ dialogError: err.message });
          this.showToast(err.message);
        }
      }
      dependencyResult(status) {
        const { dialog: d, editor: e } = this.state;
        if (
          this.act(
            {
              type: "dependency.record",
              projectId: d.projectId,
              id: d.id,
              status,
              note: e.actionNote,
            },
            { editorDirty: false },
          )
        )
          this.showDialog("milestone", d.projectId, d.id);
      }
      convertEnquiry() {
        const { dialog: d, editor: e } = this.state;
        if (e.status !== "Ready to scope") {
          this.showToast("Qualify this enquiry as Ready to scope first.");
          return;
        }
        const current = this.state.db.enquiries.find((q) => q.id === d.id);
        if (
          this.state.editorDirty ||
          current?.status !== "Ready to scope"
        ) {
          if (
            !this.act(
              {
                type: "enquiry.update",
                id: d.id,
                status: e.status,
                waiting: e.waiting,
                note: e.externalNote,
              },
              { editorDirty: false },
            )
          )
            return;
        }
        const db = this.act(
          { type: "enquiry.convert", id: d.id, leadId: e.leadId },
          { editorDirty: false },
        );
        if (db) {
          const q = db.enquiries.find((q) => q.id === d.id);
          this.setState(
            this.loadProjectState(
              db.projects.find((p) => p.id === q.projectId),
            ),
          );
          this.showToast("Converted " + q.code + " · Review project setup.");
        }
      }
      askDelete(data) {
        this.setState({
          showDeleteConfirm: true,
          deleteConfirmTitle: data.title,
          deleteConfirmBody: data.body,
          deleteConfirmAction: data.action || "Delete",
          pendingDelete: data.pending,
        });
      }
      closeDeleteConfirm() {
        this.setState({ showDeleteConfirm: false, pendingDelete: null });
      }
      confirmDelete() {
        const a = this.state.pendingDelete;
        if (!a) return;
        if (a.kind === "member")
          this.patch({
            members: this.state.members.filter((m) => m.n !== a.name),
          });
        if (a.kind === "file")
          this.patch({
            files: this.state.files.filter((_, i) => i !== a.index),
          });
        if (a.kind === "comment")
          this.act({
            type: "comment.delete",
            projectId: a.projectId,
            id: a.id,
          });
        if (a.kind === "draft")
          this.commit({
            ...this.state.db,
            drafts: this.state.db.drafts.filter((d) => d.id !== a.id),
          });
        if (a.kind === "milestone") {
          if (
            this.act({
              type: "milestone.archive",
              projectId: a.projectId,
              id: a.id,
            })
          )
            this.setState({
              dialog: { kind: "milestones", projectId: a.projectId },
              editor: null,
              editorDirty: false,
            });
        }
        this.closeDeleteConfirm();
      }
      postComment(quick = false) {
        const s = this.state,
          p = quick
            ? this.allProjects().find((p) => p.code === s.quickCommentCode)
            : this.currentProject();
        if (!p) return;
        if (
          this.act({
            type: "comment.add",
            projectId: p.id,
            text: quick ? s.quickCommentDraft : s.commentDraft,
            private: quick ? s.quickCommentOnlyMe : s.commentOnlyMe,
          })
        )
          this.setState({
            commentDraft: "",
            commentOnlyMe: false,
            showQuickComment: false,
            quickCommentDraft: "",
            quickCommentOnlyMe: false,
          });
      }
      async readFiles(fileList) {
        const files = Array.from(fileList || []);
        if (files.some((f) => f.size > 2 * 1024 * 1024))
          throw new Error(
            "Use a deliverable link for files larger than 2 MB in this local prototype.",
          );
        return Promise.all(
          files.map(
            (file) =>
              new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () =>
                  resolve({
                    id: D.uid("file"),
                    name: file.name,
                    mime: file.type,
                    dataUrl: reader.result,
                    meta:
                      Math.max(1, Math.ceil(file.size / 1024)) +
                      " KB · uploaded by " +
                      D.name(this.actor()),
                    uploadedAt: new Date().toISOString(),
                  });
                reader.onerror = () =>
                  reject(new Error("Unable to read " + file.name));
                reader.readAsDataURL(file);
              }),
          ),
        );
      }
      async uploadFiles(event, target) {
        const selected = Array.from(event.target.files || []);
        event.target.value = "";
        if (!selected.length) return;
        const actor = this.actor(),
          detailId = this.state.detailId,
          dialogId = this.state.dialog?.id,
          dialogKind = this.state.dialog?.kind;
        this.setState({ uploading: true });
        try {
          const files = await this.readFiles(selected);
          if (
            actor !== this.actor() ||
            (target === "project" && detailId !== this.state.detailId) ||
            (target === "milestone" &&
              (dialogId !== this.state.dialog?.id ||
                dialogKind !== this.state.dialog?.kind))
          )
            throw new Error(
              "Upload cancelled because the active assignment changed.",
            );
          if (target === "new")
            this.setState((s) => ({
              newFiles: [...s.newFiles, ...files],
              wizardDirty: true,
            }));
          if (target === "project")
            this.patch({ files: [...this.state.files, ...files] });
          if (target === "milestone")
            this.editValue("attachments", [
              ...this.state.editor.attachments,
              ...files,
            ]);
        } catch (e) {
          this.showToast(e.message);
        } finally {
          this.setState({ uploading: false });
        }
      }
      download(file) {
        if (!file.dataUrl) {
          this.showToast("This imported record has no file content.");
          return;
        }
        const a = document.createElement("a");
        a.href = file.dataUrl;
        a.download = file.name;
        a.click();
      }
      wizardSet(key, value) {
        this.setState({ [key]: value, wizardDirty: true });
      }
      saveDraft() {
        const s = this.state,
          id = s.draftId || D.uid("draft"),
          values = {};
        Object.keys(wizardBlank()).forEach((k) => (values[k] = D.clone(s[k])));
        const draft = {
          id,
          name: s.newName || "Untitled enquiry",
          step: s.wizardStep,
          updated: stamp(new Date()),
          values,
        };
        this.commit(
          {
            ...s.db,
            drafts: [draft, ...s.db.drafts.filter((d) => d.id !== id)],
          },
          { draftId: id, wizardDirty: false },
        );
        this.showToast("Enquiry draft saved.");
      }
      wizardNext() {
        if (this.state.uploading) {
          this.showToast("Wait for the attachment to finish loading.");
          return;
        }
        const s = this.state;
        if (s.wizardStep === 1) {
          if (!s.newName.trim() || !s.newBrief.trim()) {
            this.showToast("Add an opportunity name and brief.");
            return;
          }
          this.setState({ wizardStep: 2 });
          return;
        }
        if (s.wizardStep === 2) {
          if (!s.newClient.trim() || !s.newCity.trim()) {
            this.showToast("Add the client and city; site may remain TBD.");
            return;
          }
          this.setState({ wizardStep: 3 });
          return;
        }
        const data = {
          name: s.newName.trim(),
          brief: s.newBrief.trim(),
          service: s.newService,
          client: s.newClient.trim(),
          sector: s.newBuilding,
          location: D.location({
            country: s.newCountry,
            region: s.newRegion,
            city: s.newCity,
            siteName: s.newSite || "Site TBD",
            siteAddress: s.newAddress,
          }),
          contact: {
            name: s.newContactName,
            phone: s.newPhone,
            email: s.newEmail,
          },
          programme: s.newProgramme,
          targetOpening: s.newOpening,
          budgetBand: s.newBudget,
          area: s.newArea,
          ownerId: D.person(s.newRequestOwner)?.id || s.newRequestOwner,
          attachments: s.newFiles,
          tags: s.newTags,
          requirements: s.newRequirements,
        };
        const db = this.act({ type: "enquiry.create", data });
        if (db) {
          const q = db.enquiries[0];
          this.commit(
            { ...db, drafts: db.drafts.filter((d) => d.id !== s.draftId) },
            {
              submitted: true,
              wizardDirty: false,
              newReqCode: q.code,
              newReqName: q.name,
              draftId: "",
            },
          );
        }
      }
      weeklyDraftFor(week, actor = this.actor()) {
        const r = this.state.db.weeklyReports.find(
          (r) => r.personId === actor && r.weekKey === week,
        );
        return {
          weeklySource: r?.sources || "",
          weeklyDone: r?.done || "",
          weeklyPlan: r?.plan || "",
          weeklyIssues: r?.issues || "",
        };
      }
      setWeeklyWeekKey(key) {
        if (!key || key > D.weekStart() || key === this.state.weeklyWeekKey)
          return;
        this.guard(() =>
          this.setState({
            weeklyWeekKey: key,
            weeklyPerson: "",
            weeklyDirty: false,
            ...this.weeklyDraftFor(key),
          }),
        );
      }
      shiftWeeklyWeek(delta) {
        this.setWeeklyWeekKey(D.addDays(this.state.weeklyWeekKey, delta * 7));
      }
      setWeeklyWeek(ev) {
        const raw = ev?.target?.value || "";
        if (!raw || !D.validDate(raw)) {
          if (ev?.target) ev.target.value = this.state.weeklyWeekKey;
          return;
        }
        const key = D.weekStart(raw);
        if (key > D.weekStart() || key === this.state.weeklyWeekKey) {
          if (ev?.target) ev.target.value = this.state.weeklyWeekKey;
          return;
        }
        this.setWeeklyWeekKey(key);
      }
      openWeeklyWeekPicker(ev) {
        ev?.preventDefault?.();
        const root = ev?.currentTarget || ev?.target;
        const input =
          root?.querySelector?.("input[type=date]") ||
          document.getElementById("weekly-week-date");
        if (!input) return;
        if (typeof input.showPicker === "function") {
          try {
            input.showPicker();
          } catch (_) {
            input.focus();
            input.click();
          }
        } else {
          input.focus();
          input.click();
        }
      }
      weeklySuggestions(week, actor = this.actor()) {
        const end = D.addDays(week, 6),
          all = D.allMilestones(this.state.db, actor),
          mine = all.filter((r) => r.milestone.ownerId === actor),
          reviewed = all.filter((r) =>
            r.milestone.reviewHistory.some(
              (h) =>
                h.actorId === actor &&
                ["Approved", "Changes requested"].includes(h.action) &&
                D.today(h.at) >= week &&
                D.today(h.at) <= end,
            ),
          );
        const worked = this.allProjects().filter(
          (p) =>
            D.canView(p, actor) &&
            p.activity.some(
              (e) =>
                e.actorId === actor &&
                D.today(e.at) >= week &&
                D.today(e.at) <= end,
            ),
        );
        return {
          sources: [
            ...new Set(
              [
                ...worked,
                ...mine
                  .filter((r) => r.milestone.status === "In progress")
                  .map((r) => r.project),
                ...reviewed.map((r) => r.project),
              ].map((p) => p.code + " " + p.name),
            ),
          ].join("\n"),
          done: [
            ...mine
              .filter(
                (r) =>
                  r.milestone.status === "Complete" &&
                  r.milestone.actualCompletionDate >= week &&
                  r.milestone.actualCompletionDate <= end,
              )
              .map((r) => "Completed · " + r.milestone.title),
            ...reviewed.map((r) => "Reviewed · " + r.milestone.title),
          ].join("\n"),
          plan: mine
            .filter(
              (r) =>
                r.milestone.status !== "Complete" &&
                r.milestone.dueDate > end &&
                r.milestone.dueDate <= D.addDays(end, 7),
            )
            .map(
              (r) => r.milestone.title + " · " + shortDate(r.milestone.dueDate),
            )
            .join("\n"),
        };
      }
      submitWeeklyReport() {
        const s = this.state;
        if (s.weeklyWeekKey !== D.weekStart()) return false;
        if (
          ![s.weeklySource, s.weeklyDone, s.weeklyPlan, s.weeklyIssues].some(
            (x) => x.trim(),
          )
        ) {
          this.showToast("Add a summary, issue or next-week focus.");
          return false;
        }
        const r = {
          personId: this.actor(),
          weekKey: s.weeklyWeekKey,
          sources: s.weeklySource,
          done: s.weeklyDone,
          plan: s.weeklyPlan,
          issues: s.weeklyIssues,
          submittedAt: D.today(),
        };
        this.commit({
          ...s.db,
          weeklyReports: [
            r,
            ...s.db.weeklyReports.filter(
              (x) => !(x.personId === r.personId && x.weekKey === r.weekKey),
            ),
          ],
        });
        this.setState({ weeklyDirty: false });
        this.showToast("Weekly report saved.");
        return true;
      }
      formField(key, label, type = "text", options, readonly = false) {
        const e = this.state.editor || {};
        return {
          key,
          label,
          value: e[key] ?? "",
          text: type === "text",
          number: type === "number",
          date: type === "date",
          area: type === "area",
          select: type === "select",
          checkbox: type === "checkbox",
          checked: !!e[key],
          options: options || [],
          disabled: readonly,
          set: (event) =>
            this.editValue(
              key,
              type === "checkbox" ? event.target.checked : event.target.value,
            ),
        };
      }
      knowledgeLinks(p, m) {
        if (!p) return [];
        const medical = ["Pet hospital", "Medical imaging"].includes(p.sector),
          titles = medical
            ? [
                "MRI Planning Checklist",
                "Radiation Shielding Standard",
                "Structural Loading Guide",
                "Previous MRI Projects",
              ]
            : p.sector === "Cinema"
              ? [
                  "Cinema Acoustic Design Standard",
                  "Projection / AV Coordination Checklist",
                  "Previous Cinema Projects",
                ]
              : [
                  "Commercial Delivery Checklist",
                  p.sector + " Design Standards",
                ];
        const relevant = m
          ? /shield/i.test(m.title)
            ? titles.filter((t) => /Shield|MRI/.test(t))
            : titles.slice(0, 2)
          : titles;
        return relevant.map((title) => ({
          title,
          meta: p.sector + " · " + p.location.city,
          href:
            "./knowledge-hub/?q=" +
            encodeURIComponent(title) +
            "&sector=" +
            encodeURIComponent(p.sector) +
            "&city=" +
            encodeURIComponent(p.location.city),
        }));
      }
      milestoneRow(p, m) {
        const wp = p.workPackages.find((w) => w.id === m.workPackageId),
          complete = m.status === "Complete";
        return {
          id: m.id,
          label: m.title,
          title: m.title,
          project: p.name,
          code: p.code,
          city: p.location.city,
          workPackage: wp?.name || "—",
          phaseLabel: D.PHASES[m.phase].label,
          phaseColor: D.PHASES[m.phase].color,
          owner: D.name(m.ownerId),
          reviewer: m.reviewerId ? D.name(m.reviewerId) : "No review required",
          status: m.status,
          statusColor: tone(m.status),
          date: complete
            ? "Completed " + shortDate(m.actualCompletionDate)
            : shortDate(m.dueDate),
          due: shortDate(m.dueDate),
          dateColor:
            m.dueDate && D.days(m.dueDate) < 0 && !complete
              ? "#B04A4A"
              : "var(--ink2)",
          note:
            D.name(m.ownerId) +
            " · " +
            D.PHASES[m.phase].label +
            (m.externalDependency
              ? " · " +
                m.externalDependency.actor +
                ": " +
                m.externalDependency.status
              : "") +
            (m.blockedReason ? " · " + m.blockedReason : ""),
          mark: complete ? "✓" : m.status === "In progress" ? "●" : "○",
          dotBg: complete ? "#5367D4" : "var(--surface)",
          dotColor: complete ? "#fff" : tone(m.status),
          dotBorder: complete ? "#5367D4" : "var(--lineS)",
          textColor: "var(--ink)",
          open: () => this.openDialog("milestone", p.id, m.id),
          openProject: (ev) => {
            ev?.stopPropagation();
            this.setState({ peekId: p.id, peekTab: "brief" });
          },
        };
      }
      renderDialog() {
        const s = this.state,
          d = s.dialog,
          e = s.editor || {},
          p = d ? this.projectById(d.projectId) : null,
          actor = this.actor();
        if (!d) return { showOpsDialog: false };
        const manager = p && D.canManage(p, actor) && D.isActive(p),
          m = p?.milestones.find((x) => x.id === d.id),
          w = p?.workPackages.find((x) => x.id === d.id);
        let title = "",
          subtitle = p ? p.code + " · " + p.name + " · " + p.location.city : "",
          badge = "",
          badgeColor = "",
          fields = [],
          fieldsLabel = "",
          descriptionLabel = "",
          actions = [],
          rows = [],
          detailRows = [],
          description = "",
          history = [],
          attachments = [],
          dependency = "",
          standards = [];
        const field = (...args) => this.formField(...args),
          team = p
            ? personOptions(
                D.PEOPLE.filter(
                  (u) =>
                    p.team.some((t) => t.personId === u.id) &&
                    u.tier !== "viewer",
                ),
              )
            : [];
        const button = (label, run, primary = false) => ({
          label,
          run,
          primary,
          cls: primary ? "fw-button primary" : "fw-button",
        });
        if (d.kind === "milestones") {
          title = "Manage milestones";
          description = "";
          rows = D.activeMilestones(p).map((m) => ({
            ...this.milestoneRow(p, m),
            canMove: manager,
            up: () =>
              this.act({
                type: "milestone.move",
                projectId: p.id,
                id: m.id,
                direction: -1,
              }),
            down: () =>
              this.act({
                type: "milestone.move",
                projectId: p.id,
                id: m.id,
                direction: 1,
              }),
          }));
          if (manager)
            actions.push(
              button(
                "+ Add milestone",
                () => this.showDialog("milestone", p.id, null),
                true,
              ),
            );
        }
        if (d.kind === "milestone") {
          title = m ? m.title : "Add milestone";
          const editable = manager && m?.status !== "Complete",
            owner = m && D.canOwn(p, m, actor) && D.isActive(p),
            reviewer = m && D.canReview(p, m, actor) && D.isActive(p),
            working =
              owner && !["Complete", "Ready for review"].includes(m.status);
          fields = [
            field("title", "Milestone title", "text", null, !editable),
            field("phase", "Phase", "select", phaseOptions, !editable),
            field(
              "workPackageId",
              "Work package (optional)",
              "select",
              [
                { value: "", label: "Project-level milestone" },
                ...p.workPackages.map((w) => ({
                  value: w.id,
                  label: w.code + " · " + w.name,
                })),
              ],
              !editable,
            ),
            field("ownerId", "Internal owner", "select", team, !editable),
            field("dueDate", "Due date (optional)", "date", null, !editable),
            field(
              "reviewRequired",
              "Review required",
              "checkbox",
              null,
              !editable,
            ),
          ];
          if (e.reviewRequired)
            fields.push(
              field(
                "reviewerId",
                "Internal reviewer",
                "select",
                [
                  { value: "", label: "Select reviewer" },
                  ...team.filter((u) => u.value !== e.ownerId),
                ],
                !editable,
              ),
            );
          fields.push(
            field(
              "required",
              "Required milestone",
              "checkbox",
              null,
              !editable,
            ),
            field(
              "deliverable",
              "Deliverable link or document reference",
              "text",
              null,
              !(
                working ||
                (editable && (!m || m.status !== "Ready for review"))
              ),
            ),
            field(
              "dependencyActor",
              "External dependency (optional)",
              "select",
              [{ value: "", label: "None" }, ...textOptions(D.EXTERNAL_ACTORS)],
              !editable,
            ),
            field(
              "dependencyNote",
              "Dependency context",
              "text",
              null,
              !editable,
            ),
          );
          description = m ? m.status + (m.required ? " · Required" : "") : "";
          if (m) {
            fields.push(
              field(
                "actionNote",
                "Update / review comment / external outcome",
                "area",
                null,
                !(
                  working ||
                  (reviewer && m.status === "Ready for review") ||
                  (manager && m.externalDependency && m.status !== "Complete")
                ),
              ),
            );
            if (working) {
              actions.push(
                button("Save deliverable", () => this.saveDeliverable()),
              );
              if (
                ["Not started", "Changes requested", "Blocked"].includes(
                  m.status,
                )
              )
                actions.push(
                  button(
                    "Start / resume",
                    () => this.milestoneAction("start"),
                    true,
                  ),
                );
              if (m.status === "In progress")
                actions.push(
                  button(
                    m.reviewRequired ? "Submit for review" : "Mark complete",
                    () =>
                      this.milestoneAction(
                        m.reviewRequired ? "submit" : "complete",
                      ),
                    true,
                  ),
                );
              if (m.status !== "Blocked")
                actions.push(
                  button("Flag blocked", () => this.milestoneAction("block")),
                );
            }
            if (reviewer && m.status === "Ready for review") {
              actions.push(
                button("Request changes", () =>
                  this.milestoneAction("changes"),
                ),
                button("Approve", () => this.milestoneAction("approve"), true),
              );
            }
            if (m.externalDependency) {
              dependency =
                m.externalDependency.actor +
                " · " +
                m.externalDependency.status +
                " · " +
                (m.externalDependency.note || "");
              if (m.externalDependency.recordedBy)
                dependency +=
                  " · Recorded by " +
                  D.name(m.externalDependency.recordedBy) +
                  " " +
                  stamp(m.externalDependency.recordedAt);
              if (manager && m.status !== "Complete")
                actions.push(
                  button("Record external confirmation", () =>
                    this.dependencyResult("Confirmed"),
                  ),
                  button("Record external revision", () =>
                    this.dependencyResult("Rejected / revision required"),
                  ),
                  button("Waiting externally", () =>
                    this.dependencyResult("Waiting externally"),
                  ),
                );
            }
            history = m.reviewHistory.map((h) => ({
              label: h.action + " · " + D.name(h.actorId) + " · " + stamp(h.at),
              text:
                (h.comment || "") +
                (h.deliverable ? " · " + h.deliverable : ""),
            }));
            attachments = (e.attachments || []).map((f) => ({
              ...f,
              download: () => this.download(f),
            }));
            if (
              manager &&
              m.source === "custom" &&
              !m.required &&
              !["Ready for review", "Complete"].includes(m.status)
            )
              actions.push(
                button("Archive milestone", () =>
                  this.askDelete({
                    title: "Archive this milestone?",
                    body: "The milestone will leave active views. Its activity remains available.",
                    action: "Archive",
                    pending: { kind: "milestone", projectId: p.id, id: m.id },
                  }),
                ),
              );
          }
          if (editable)
            actions.push(
              button(
                m ? "Save milestone plan" : "Create milestone",
                () => this.saveEditor(),
                !m,
              ),
            );
          actions.unshift(button("Open project", () => this.openProject(p.id)));
          standards = this.knowledgeLinks(p, m);
          return {
            showOpsDialog: true,
            opsTitle: title,
            opsSubtitle: subtitle,
            opsDescription: description,
            opsFields: fields,
            opsActions: actions,
            opsRows: rows,
            opsRowsEmpty: false,
            opsHistory: history,
            opsAttachments: attachments,
            opsCanUpload: !!working,
            opsDependency: dependency,
            opsStandards: standards,
            opsError: s.dialogError,
            opsClose: () => this.closeDialog(),
            opsUpload: (ev) => this.uploadFiles(ev, "milestone"),
          };
        }
        if (d.kind === "package") {
          title = w ? "Work package · " + w.code : "Add work package";
          description = "";
          const edit = manager;
          const deliveryEdit =
            D.isActive(p) && (manager || w?.leadId === actor);
          fields = [
            field("name", "Scope name", "text", null, !edit),
            field("scope", "Scope / description", "area", null, !deliveryEdit),
            field("leadId", "Work package lead", "select", team, !edit),
            field("startDate", "Start date", "date", null, !deliveryEdit),
            field("targetFinish", "Target finish", "date", null, !deliveryEdit),
            ...(D.canViewCommercial(p, actor)
              ? [field("budget", "Optional budget", "text", null, !edit)]
              : []),
            field(
              "progress",
              "Progress % (blank = milestone completion)",
              "number",
              null,
              !deliveryEdit,
            ),
          ];
          const available = p.team
            .filter(
              (t) =>
                t.personId !== e.leadId &&
                D.person(t.personId)?.tier !== "viewer",
            )
            .map((t) => ({
              name: D.name(t.personId),
              checked: (e.contributorIds || []).includes(t.personId),
              disabled: !edit,
              toggle: () => {
                if (edit)
                  this.editValue(
                    "contributorIds",
                    e.contributorIds.includes(t.personId)
                      ? e.contributorIds.filter((x) => x !== t.personId)
                      : [...e.contributorIds, t.personId],
                  );
              },
            }));
          rows = w
            ? D.activeMilestones(p)
                .filter((m) => m.workPackageId === w.id)
                .map((m) => this.milestoneRow(p, m))
            : [];
          if (deliveryEdit)
            actions.push(
              button("Save work package", () => this.saveEditor(), true),
            );
          return {
            showOpsDialog: true,
            opsTitle: title,
            opsSubtitle: subtitle,
            opsDescription: description,
            opsFields: fields,
            opsActions: actions,
            opsRows: rows,
            opsRowsEmpty: !!w && !rows.length,
            opsContributors: available,
            opsHasContributors: true,
            opsError: s.dialogError,
            opsClose: () => this.closeDialog(),
          };
        }
        if (d.kind === "health") {
          title = "Project health";
          if (!D.canViewCommercial(p, actor)) return { showOpsDialog: false };
          description = "CNY";
          fields = [
            ...[
              "contractValue",
              "approvedBudget",
              "approvedVariations",
              "committedCost",
              "forecastFinalCost",
            ].map((k, i) =>
              field(
                k,
                [
                  "Contract value",
                  "Approved budget",
                  "Approved variations",
                  "Committed cost (optional)",
                  "Forecast final cost",
                ][i],
                "number",
              ),
            ),
            field(
              "health",
              "Commercial health",
              "select",
              textOptions(["On budget", "At risk", "Forecast over"]),
            ),
            field(
              "scheduleHealth",
              "Schedule health",
              "select",
              textOptions(["On track", "At risk", "Delayed"]),
              !manager,
            ),
            field(
              "plannedCompletion",
              "Planned completion",
              "date",
              null,
              !manager,
            ),
            field(
              "forecastCompletion",
              "Forecast completion",
              "date",
              null,
              !manager,
            ),
          ];
          if (!D.canCommercial(p, actor))
            fields = fields.map((f) => ({ ...f, disabled: true }));
          if (D.canCommercial(p, actor))
            actions.push(button("Save health", () => this.saveEditor(), true));
        }
        if (d.kind === "hold") {
          title = "Put project on hold";
          description =
            "Current phase remains " + D.PHASES[p.phase].label + ".";
          fields = [
            field("reason", "Reason", "area"),
            field("ownerId", "Internal hold owner", "select", team),
            field("expectedResume", "Expected resume (optional)", "date"),
            field("impact", "Programme impact", "area"),
          ];
          if (manager)
            actions.push(button("Save hold", () => this.saveEditor(), true));
        }
        if (d.kind === "enquiry") {
          const q = s.db.enquiries.find((q) => q.id === d.id);
          const ready =
            (e.status || q.status) === "Ready to scope" &&
            q.status !== "Converted";
          title = q.code + " · " + q.name;
          subtitle =
            q.client +
            " · " +
            q.location.city +
            " · " +
            q.sector +
            " · " +
            q.service;
          badge = q.status;
          badgeColor =
            {
              New: "var(--muted)",
              "Under review": "#B08A3E",
              "Needs information": "#B08A3E",
              "Ready to scope": "var(--accent-ink)",
              Converted: "var(--accent-ink)",
              Declined: "var(--warn)",
            }[q.status] || "var(--muted)";
          descriptionLabel = "Brief";
          description = q.brief;
          const contactLine = [q.contact.name, q.contact.phone, q.contact.email]
            .filter(Boolean)
            .join(" · ");
          detailRows = [
            {
              label: "Site",
              value:
                q.location.siteName +
                (q.location.siteAddress ? " · " + q.location.siteAddress : ""),
            },
            ...(D.canViewEnquiryCommercial(q, actor, s.db)
              ? [{ label: "Budget", value: q.budgetBand || "Not set", mono: true }]
              : []),
            {
              label: "Area",
              value: q.area ? q.area + " m²" : "Not set",
              mono: true,
            },
            { label: "Programme", value: q.programme || "Not set" },
            { label: "Target opening", value: dateLabel(q.targetOpening) },
            { label: "Contact", value: contactLine || "Not provided" },
            { label: "Request owner", value: D.name(q.ownerId) },
            ...(Object.keys(q.requirements || {}).length
              ? [
                  {
                    label: "Sector requirements",
                    value: Object.entries(q.requirements)
                      .map(([k, v]) => k + ": " + v)
                      .join(" · "),
                  },
                ]
              : []),
          ].map((r) => ({
            mono: false,
            ...r,
            monoClass: r.mono ? "mono" : "",
          }));
          attachments = (q.attachments || []).map((f) => ({
            ...f,
            download: () => this.download(f),
          }));
          if (q.status === "Converted") {
            dependency = "Converted to " + this.projectById(q.projectId)?.code;
            actions.push(
              button(
                "Open project",
                () => {
                  this.setState({ dialog: null, editorDirty: false });
                  this.openProject(q.projectId);
                },
                true,
              ),
            );
          } else {
            if (q.status === "Declined")
              dependency =
                "Declined · " +
                q.declinedReason +
                (q.declinedNote ? " · " + q.declinedNote : "");
            else if (D.canIntake(actor))
              dependency =
                "Qualify to Ready to scope, then convert to create a project in Scoping.";
            const declined = (e.status || q.status) === "Declined";
            fieldsLabel = "Qualification";
            fields = [
              field(
                "status",
                "Qualification status",
                "select",
                textOptions(D.ENQUIRY_STATES.filter((x) => x !== "Converted")),
              ),
              field("waiting", "Waiting on client externally", "checkbox"),
              field("externalNote", "External dependency note", "text"),
            ];
            if (declined)
              fields.push(
                field(
                  "declinedReason",
                  "Reason the client did not continue",
                  "select",
                  [
                    { value: "", label: "Choose a reason" },
                    ...textOptions(D.DECLINE_REASONS),
                  ],
                ),
                field("declinedNote", "Note (optional)", "text"),
              );
            actions.push(button("Save qualification", () => this.saveEditor()));
            if (ready) {
              fields.push(
                field(
                  "leadId",
                  "Project Lead",
                  "select",
                  personOptions(
                    D.PEOPLE.filter((p) =>
                      ["Project lead", "Operations manager"].includes(p.role),
                    ),
                  ),
                ),
              );
              actions.push(
                button("Convert to project", () => this.convertEnquiry(), true),
              );
            }
          }
        }
        if (d.kind === "enquiry" && !D.canIntake(actor)) {
          fields = fields.map((f) => ({ ...f, disabled: true }));
          actions = actions.filter((a) => a.label === "Open project");
        }
        return {
          showOpsDialog: true,
          opsTitle: title,
          opsSubtitle: subtitle,
          opsBadge: badge,
          opsHasBadge: !!badge,
          opsBadgeColor: badgeColor,
          opsDescription: description,
          opsDescriptionLabel: descriptionLabel,
          opsFields: fields,
          opsFieldsLabel: fieldsLabel,
          opsActions: actions,
          opsDetailRows: detailRows,
          opsHasDetailRows: !!detailRows.length,
          opsHasInfoCard: !!description || !!detailRows.length,
          opsRows: rows,
          opsRowsEmpty: d.kind === "milestones" && !rows.length,
          opsHistory: history,
          opsAttachments: attachments,
          opsDependency: dependency,
          opsStandards: standards,
          opsError: s.dialogError,
          opsClose: () => this.closeDialog(),
        };
      }
      renderVals() {
        const s = this.state,
          actor = this.actor(),
          user = D.person(actor),
          owner = user.tier === "owner",
          viewer = user.tier === "viewer",
          contributor = user.tier === "contributor";
        const projects = this.allProjects().filter((p) => D.canView(p, actor)),
          live = projects.filter(D.isActive),
          p = this.currentProject();
        const manager = !!p && D.canManage(p, actor) && D.isActive(p),
          commercial = !!p && D.canCommercial(p, actor) && D.isActive(p),
          seeCommercial = !!p && D.canViewCommercial(p, actor),
          commercialColumn = projects.some((p) =>
            D.canViewCommercial(p, actor),
          );
        const next = (p) => D.nextMilestone(p),
          chip = (p) => (p.hold ? HOLD : D.PHASES[p.phase]),
          allms = D.allMilestones(s.db, actor),
          openms = allms.filter(
            (r) => D.isActive(r.project) && r.milestone.status !== "Complete",
          );
        const cityOptions = [...new Set(projects.map((p) => p.location.city))]
            .filter(Boolean)
            .sort(),
          clients = [
            ...new Set([
              ...projects.map((p) => p.client),
              ...s.db.enquiries.map((q) => q.client),
            ]),
          ].sort(),
          leads = [...new Set(projects.map((p) => D.name(p.leadId)))].sort(),
          tags = [...new Set(projects.flatMap((p) => p.tags))].sort();
        const matchesDue = (p) =>
          D.incomplete(p).some(
            (m) =>
              m.dueDate &&
              (s.dueFilter === "overdue"
                ? D.days(m.dueDate) < 0
                : s.dueFilter === "week"
                  ? m.dueDate >= D.today() &&
                    m.dueDate <= D.addDays(D.weekStart(), 6)
                  : D.days(m.dueDate) >= 0 && D.days(m.dueDate) <= 30),
          );
        const q = s.search.trim().toLowerCase();
        const filtered = projects.filter(
          (p) =>
            (s.phaseTab === "closed"
              ? !D.isActive(p) &&
                (s.metric !== "completed" || p.state === "Completed")
              : D.isActive(p) &&
                (s.phaseTab === "all" || p.phase === s.phaseTab)) &&
            (s.metric !== "risk" ||
              D.scheduleHealth(p) !== "On track" ||
              (D.canViewCommercial(p, actor) &&
                D.commercialHealth(p) !== "On budget")) &&
            (s.serviceFilter === "all" || p.service === s.serviceFilter) &&
            (s.sectorFilter === "all" || p.sector === s.sectorFilter) &&
            (s.leadFilter === "all" || D.name(p.leadId) === s.leadFilter) &&
            (s.clientFilter === "all" || p.client === s.clientFilter) &&
            (s.cityFilter === "all" || p.location.city === s.cityFilter) &&
            (s.scheduleHealthFilter === "all" ||
              D.scheduleHealth(p) === s.scheduleHealthFilter) &&
            (!commercialColumn ||
              s.commercialHealthFilter === "all" ||
              (D.canViewCommercial(p, actor) &&
                D.commercialHealth(p) === s.commercialHealthFilter)) &&
            (s.dueFilter === "all" || matchesDue(p)) &&
            (!s.holdOnly || p.hold) &&
            (!q ||
              [p.name, p.client, p.code, p.sector, p.location.city]
                .join(" ")
                .toLowerCase()
                .includes(q)),
        );
        const sorted = filtered.sort((a, b) => {
          const av =
              s.sortKey === "phase"
                ? D.PHASE_KEYS.indexOf(a.phase)
                : D.days(next(a)?.dueDate),
            bv =
              s.sortKey === "phase"
                ? D.PHASE_KEYS.indexOf(b.phase)
                : D.days(next(b)?.dueDate);
          return (
            (av - bv || a.code.localeCompare(b.code)) *
            (s.sortDir === "asc" ? 1 : -1)
          );
        });
        const pageSize = Number(s.listPageSize),
          pages = Math.max(1, Math.ceil(sorted.length / pageSize)),
          page = Math.min(s.listPage, pages);
        const row = (p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          client: p.client,
          city: p.location.city,
          sector: p.sector,
          service: p.service,
          phaseLabel:
            D.PHASES[p.phase].label +
            (p.hold ? " · On hold" : "") +
            (!D.isActive(p) ? " · " + p.state : ""),
          lead: D.name(p.leadId),
          leadInitials: initials(D.name(p.leadId)),
          leadColor: color(p.leadId),
          scheduleHealth: D.scheduleHealth(p),
          commercialHealth: D.canViewCommercial(p, actor)
            ? D.commercialHealth(p)
            : "",
          scheduleColor: tone(D.scheduleHealth(p)),
          commercialColor: D.canViewCommercial(p, actor)
            ? tone(D.commercialHealth(p))
            : "",
          milestoneLabel: next(p)?.title || "No open milestones",
          milestoneDate: shortDate(next(p)?.dueDate),
          riskLabel: D.scheduleHealth(p),
          riskColor: tone(D.scheduleHealth(p)),
          rowClass: s.peekId === p.id ? "is-selected" : "",
          peek: () => this.setState({ peekId: p.id, peekTab: "brief" }),
          open: () => this.openProject(p.id),
        });
        const projectRows = sorted
            .slice((page - 1) * pageSize, page * pageSize)
            .map(row),
          grouped = s.listGroup !== "flat";
        const groups = new Map();
        sorted.forEach((p) => {
          const key =
            s.listGroup === "city" ? p.location.city || "City TBD" : p.client;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(p);
        });
        const clientGroups = [...groups]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([client, ps]) => {
            const dates = ps
              .flatMap((p) => D.incomplete(p))
              .filter((m) => m.dueDate)
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
            return {
              client,
              count: ps.length + " projects",
              nextDue: shortDate(dates[0]?.dueDate),
              nextColor:
                dates[0] && D.days(dates[0].dueDate) < 0
                  ? "#B04A4A"
                  : "var(--ink2)",
              projects: ps.map(row),
            };
          });
        const filterKeys = [
          "clientFilter",
          "sectorFilter",
          "serviceFilter",
          "leadFilter",
          "dueFilter",
          "cityFilter",
          "scheduleHealthFilter",
          ...(commercialColumn ? ["commercialHealthFilter"] : []),
          "phaseTab",
        ];
        const filterChips = filterKeys
          .filter((k) => s[k] !== "all")
          .map((k) => ({
            label:
              {
                clientFilter: "Client",
                sectorFilter: "Sector",
                serviceFilter: "Service",
                leadFilter: "Lead",
                dueFilter: "Due",
                cityFilter: "City",
                scheduleHealthFilter: "Schedule",
                commercialHealthFilter: "Commercial",
                phaseTab: "Phase",
              }[k] +
              ": " +
              (k === "phaseTab"
                ? D.PHASES[s[k]]?.label || "Completed / Archived"
                : k === "dueFilter"
                  ? {
                      overdue: "Overdue",
                      week: "This week",
                      month: "Next 30 days",
                    }[s[k]]
                  : s[k]),
            clear: () => this.setState({ [k]: "all", listPage: 1 }),
          }));
        if (s.holdOnly)
          filterChips.push({
            label: "On hold",
            clear: () => this.setState({ holdOnly: false }),
          });
        const resetFilters = () =>
          this.setState({
            ...Object.fromEntries(filterKeys.map((k) => [k, "all"])),
            holdOnly: false,
            search: "",
            phaseTab: "all",
            metric: "all",
            listPage: 1,
          });
        const stats = [
          ["all", "Active projects", live.length],
          [
            "risk",
            "At risk",
            live.filter(
              (p) =>
                D.scheduleHealth(p) !== "On track" ||
                (D.canViewCommercial(p, actor) &&
                  D.commercialHealth(p) !== "On budget"),
            ).length,
          ],
          ["hold", "On hold", live.filter((p) => p.hold).length],
          [
            "completed",
            "Completed",
            projects.filter((p) => p.state === "Completed").length,
          ],
        ];
        const phaseBoxes = stats.map(([key, label, count]) => ({
          label,
          count,
          onClass:
            key === "hold" ? (s.holdOnly ? "is-on" : "") : s.metric === key ? "is-on" : "",
          pressed: key === "hold" ? s.holdOnly : s.metric === key,
          select: () =>
            this.setState({
              metric: key === "hold" ? "all" : key,
              phaseTab: key === "completed" ? "closed" : "all",
              holdOnly: key === "hold" ? !s.holdOnly : false,
              listPage: 1,
            }),
        }));
        const attentionRows = [];
        openms.forEach(({ project: p, milestone: m }) => {
          if (m.dueDate && D.days(m.dueDate) < 0) {
            attentionRows.push({
              code: p.code,
              project: p.name,
              issue: m.title,
              type: "Overdue",
              typeColor: "var(--warn)",
              owner: D.name(m.ownerId),
              due: shortDate(m.dueDate),
              dueColor: "var(--warn)",
              sortDate: m.dueDate,
              open: () => this.openDialog("milestone", p.id, m.id),
            });
          } else if (m.status === "Blocked") {
            attentionRows.push({
              code: p.code,
              project: p.name,
              issue: m.blockedReason || m.title,
              type: "Blocked",
              typeColor: "#B08A3E",
              owner: D.name(m.ownerId),
              due: m.dueDate ? shortDate(m.dueDate) : "—",
              dueColor: "var(--ink2)",
              sortDate: m.dueDate || "9999-99-99",
              open: () => this.openDialog("milestone", p.id, m.id),
            });
          } else if (m.externalDependency) {
            attentionRows.push({
              code: p.code,
              project: p.name,
              issue:
                "Waiting on " +
                m.externalDependency.actor +
                (m.externalDependency.note
                  ? " · " + m.externalDependency.note
                  : ""),
              type: "Dependency",
              typeColor: "var(--accent-ink)",
              owner: D.name(m.ownerId),
              due: m.dueDate ? shortDate(m.dueDate) : "—",
              dueColor: "var(--ink2)",
              sortDate: m.dueDate || "9999-99-99",
              open: () => this.openDialog("milestone", p.id, m.id),
            });
          } else if (m.status === "Ready for review") {
            attentionRows.push({
              code: p.code,
              project: p.name,
              issue: m.title,
              type: "Review",
              typeColor: "var(--cobalt)",
              owner: m.reviewerId ? D.name(m.reviewerId) : D.name(m.ownerId),
              due: m.dueDate ? shortDate(m.dueDate) : "—",
              dueColor: "var(--ink2)",
              sortDate: m.dueDate || "9999-99-99",
              open: () => this.openDialog("milestone", p.id, m.id),
            });
          }
        });
        live.forEach((p) => {
          if (p.hold) {
            attentionRows.push({
              code: p.code,
              project: p.name,
              issue: p.hold.reason,
              type: "On hold",
              typeColor: "var(--muted)",
              owner: D.name(p.hold.ownerId),
              due: p.hold.expectedResume ? shortDate(p.hold.expectedResume) : "—",
              dueColor: "var(--ink2)",
              sortDate: p.hold.expectedResume || "9999-99-99",
              open: () => this.openProject(p.id),
            });
          }
          if (D.canViewCommercial(p, actor) && D.commercialHealth(p) !== "On budget") {
            attentionRows.push({
              code: p.code,
              project: p.name,
              issue: D.commercialHealth(p) + " — review budget",
              type: "Budget",
              typeColor: "var(--warn)",
              owner: D.name(p.leadId),
              due: "—",
              dueColor: "var(--ink2)",
              sortDate: "9999-99-99",
              open: () => this.openProject(p.id),
            });
          }
        });
        attentionRows.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
        const peekP = projects.find((p) => p.id === s.peekId),
          peekChip = peekP ? chip(peekP) : D.PHASES.scoping;
        const visibleActivity = (p) => D.visibleActivity(p, actor);
        const rail = (phase, held) =>
          D.PHASE_KEYS.map((key, i) => {
            const cur = D.PHASE_KEYS.indexOf(phase);
            return {
              label: D.PHASES[key].label,
              mark: i < cur ? "✓" : i + 1,
              cls:
                i < cur
                  ? "is-done"
                  : i === cur
                    ? held
                      ? "is-paused"
                      : "is-current"
                    : "is-todo",
              barColor:
                i < cur
                  ? "#B7C1F2"
                  : i === cur
                    ? held
                      ? "#B04A4A"
                      : "#5367D4"
                    : "var(--line)",
              textColor: i === cur ? "var(--accent-ink)" : "var(--muted)",
              nameWeight: i === cur ? "700" : "600",
              when:
                i === cur
                  ? held
                    ? "Paused"
                    : "Current"
                  : i < cur
                    ? "Previous phase"
                    : "—",
            };
          });
        const peek = peekP
          ? {
              ...row(peekP),
              phaseTint: peekChip.tint,
              phaseColor: peekChip.color,
              phaseLabel:
                D.PHASES[peekP.phase].label + (peekP.hold ? " · On hold" : ""),
              milestoneDue: due(next(peekP)?.dueDate),
              milestoneColor:
                next(peekP)?.dueDate && D.days(next(peekP).dueDate) < 0
                  ? "#B04A4A"
                  : "var(--muted)",
              activityCount: visibleActivity(peekP).length,
              people: peekP.team.map((t) => ({
                name: D.name(t.personId),
                role: t.role,
                initials: initials(D.name(t.personId)),
                color: color(t.personId),
              })),
              scope: [
                { label: "City", value: peekP.location.city },
                { label: "Site", value: peekP.location.siteName },
                { label: "Sector", value: peekP.sector },
                { label: "Service", value: peekP.service },
                { label: "Programme", value: peekP.programme || "Not set" },
                { label: "Schedule", value: D.scheduleHealth(peekP) },
                ...(D.canViewCommercial(peekP, actor)
                  ? [
                      {
                        label: "Commercial",
                        value: D.commercialHealth(peekP),
                      },
                    ]
                  : []),
              ],
              activity: visibleActivity(peekP)
                .slice(0, 4)
                .map((e) => ({
                  initials: initials(D.name(e.actorId)),
                  color: color(e.actorId),
                  text: e.text,
                  when: stamp(e.at),
                })),
              open: () => this.openProject(peekP.id),
              openActivity: () => this.openProject(peekP.id, "activity"),
              addCollaborator: () =>
                this.guard(() => {
                  if (!D.canManage(peekP, actor)) return;
                  this.setState({
                    ...this.loadProjectState(peekP),
                    showAssignForm: true,
                  });
                }),
            }
          : null;
        const schedule = D.scheduleRows(s.db, actor, s.scheduleFilters);
        const intakeQuery = s.intakeSearch.trim().toLowerCase();
        const intakeFiltered = s.db.enquiries.filter((q) => {
          if (s.intakeStatusFilter === "active") {
            if (["Converted", "Declined"].includes(q.status)) return false;
          } else if (
            s.intakeStatusFilter !== "all" &&
            q.status !== s.intakeStatusFilter
          )
            return false;
          if (!intakeQuery) return true;
          return [q.name, q.code, q.client, q.location?.city]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(intakeQuery));
        });
        const scheduleGroups = [
          ["overdue", "Overdue", "Before " + shortDate(D.today())],
          [
            "week",
            "This week",
            shortDate(D.weekStart()) +
              " – " +
              shortDate(D.addDays(D.weekStart(), 6)),
          ],
          [
            "next",
            "Next week",
            shortDate(D.addDays(D.weekStart(), 7)) +
              " – " +
              shortDate(D.addDays(D.weekStart(), 13)),
          ],
          [
            "later",
            "Later",
            "After " + shortDate(D.addDays(D.weekStart(), 13)),
          ],
        ].map(([key, title, range]) => {
          const items = schedule
            .filter((r) => r.bucket === key)
            .map((r) => this.milestoneRow(r.project, r.milestone));
          return {
            title,
            range,
            items,
            hasItems: !!items.length,
            isEmpty: !items.length,
            count: items.length + " milestones",
          };
        });
        const scheduleBucketMeta = [
          ["all", "All", "All upcoming milestones"],
          ["overdue", "Overdue", "Past due"],
          ["week", "This week", "Due by Sunday"],
          ["next", "Next week", "The following 7 days"],
          ["later", "Later", "Beyond next week"],
        ];
        const scheduleSearch = s.scheduleSearch.trim().toLowerCase();
        const scheduleVisible = schedule.filter((r) => {
          if (s.scheduleBucket !== "all" && r.bucket !== s.scheduleBucket)
            return false;
          if (!scheduleSearch) return true;
          const wp = r.workPackage?.name || "";
          return [
            r.milestone.title,
            r.project.code,
            r.project.name,
            r.project.location.city,
            D.name(r.milestone.ownerId),
            wp,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(scheduleSearch),
          );
        });
        const schedulePages = Math.max(
          1,
          Math.ceil(scheduleVisible.length / Number(s.schedulePageSize)),
        );
        const schedulePage = Math.min(s.schedulePage, schedulePages);
        const schedulePageStart = scheduleVisible.length
          ? (schedulePage - 1) * Number(s.schedulePageSize) + 1
          : 0;
        const scheduleRows = scheduleVisible
          .slice(
            (schedulePage - 1) * Number(s.schedulePageSize),
            schedulePage * Number(s.schedulePageSize),
          )
          .map((r) => ({
            ...this.milestoneRow(r.project, r.milestone),
            bucketLabel:
              r.bucket === "overdue"
                ? "Overdue"
                : r.bucket === "week"
                  ? "This week"
                  : r.bucket === "next"
                    ? "Next week"
                    : "Later",
            bucketClass: "schedule-due-" + r.bucket,
          }));
        const scheduleTabs = scheduleBucketMeta.map(([key, label, hint]) => ({
          label,
          hint,
          count:
            key === "all"
              ? schedule.length
              : schedule.filter((r) => r.bucket === key).length,
          pressed: s.scheduleBucket === key,
          select: () => this.setState({ scheduleBucket: key, schedulePage: 1 }),
        }));
        const my = D.myWork(s.db, actor),
          myWorkGroups = [
            ["assigned", "Assigned to me"],
            ["review", "Needs my review"],
            ["blocked", "Blocked"],
            ["week", "Due this week"],
            ["completed", "Recently completed"],
          ].map(([key, title]) => ({
            title,
            items: my[key].map((r) =>
              this.milestoneRow(r.project, r.milestone),
            ),
            empty: !my[key].length,
            count: my[key].length,
          }));
        const locationRows = D.cities(s.db, D.today(), actor).map((c) => {
          const sectors = [
            ...new Set(
              [...c.projects, ...c.enquiries]
                .map((item) => item.sector)
                .filter(Boolean),
            ),
          ];
          if (!sectors.length) sectors.push("Other commercial");
          const activeItems = c.projects.map((p) => ({
              name: p.name,
              meta: p.code + " · " + D.PHASES[p.phase].label,
              open: () => this.setState({ peekId: p.id, peekTab: "brief" }),
            }));
          const pipelineItems = c.enquiries.map((q) => ({
              name: q.name,
              meta: q.code + " · " + q.status,
              open: () => this.openDialog("enquiry", null, q.id),
            }));
          return {
            city: c.city,
            totalCount: c.projects.length + c.enquiries.length,
            activeCount: c.projects.length,
            pipelineCount: c.enquiries.length,
            sectorTags: sectors.slice(0, 2).map((label) => ({ label })),
            sectorTitle: sectors.join(", "),
            hasMoreSectors: sectors.length > 2,
            moreSectorCount: "+" + (sectors.length - 2),
            activeItems,
            pipelineItems,
            hasActiveItems: !!activeItems.length,
            hasPipelineItems: !!pipelineItems.length,
            noActiveItems: !activeItems.length,
            noPipelineItems: !pipelineItems.length,
            noItems: !activeItems.length && !pipelineItems.length,
          };
        });
        const nav = (key, label, badge) => ({
          label,
          current: s.page === key ? "page" : "false",
          color: s.page === key ? "var(--accent-ink)" : "var(--ink2)",
          bg: s.page === key ? "var(--accent-tint)" : "transparent",
          badge: badge || "",
          badgeBg: "var(--paper2)",
          badgeColor: "var(--muted)",
          go: (e) => {
            e?.preventDefault();
            this.go(key);
          },
        });
        const labels = {
          portfolio: "Projects",
          intake: "Enquiries",
          schedule: "Schedule",
          mywork: "My Work",
          locations: "Locations",
          people: "Team",
          team: "Weekly reports",
          standards: "Delivery Standards",
          settings: "Settings",
          support: "Support",
          new: "New enquiry",
          detail: p?.code || "Project",
        };
        const detailChip = p ? chip(p) : D.PHASES.scoping,
          draftChip = D.PHASES[s.draftPhase] || detailChip,
          hold = p?.hold || {};
        const required = D.progression(
          p || { milestones: [], phase: "scoping" },
        );
        const milestonePlan = p
          ? [
              ...D.activeMilestones(p)
                .filter((m) => m.status === "Complete")
                .sort((a, b) =>
                  (b.actualCompletionDate || "").localeCompare(
                    a.actualCompletionDate || "",
                  ),
                )
                .slice(0, 2),
              ...D.incomplete(p)
                .sort((a, b) =>
                  (a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
                )
                .slice(0, 5),
            ].map((m) => this.milestoneRow(p, m))
          : [];
        const workPackages = p
          ? p.workPackages.map((w) => {
              const summary = D.packageSummary(p, w);
              return {
                code: w.code,
                name: w.name,
                lead: D.name(w.leadId),
                phase: D.PHASES[summary.phase].label,
                progress: summary.progress + "%",
                next: summary.next?.title || "No open milestone",
                health: summary.health,
                healthColor: tone(summary.health),
                contributors:
                  w.contributorIds.map(D.name).join(", ") || "No contributors",
                open: () => this.openDialog("package", p.id, w.id),
              };
            })
          : [];
        const briefSections = [
          { no: "01", title: "Brief and scope", section: 1 },
          { no: "02", title: "Client and site", section: 2 },
          {
            no: "03",
            title: seeCommercial ? "Programme & commercial" : "Programme",
            section: 3,
          },
        ]
          .map((sec) => ({
            ...sec,
            rows: BRIEF_FIELDS.filter(
              (f) =>
                f.section === sec.section &&
                (seeCommercial || !["budget", "fee"].includes(f.key)) &&
                (s.editingBrief ||
                  s.fields[f.key] ||
                  [
                    "brief",
                    "service",
                    "client",
                    "city",
                    "buildingType",
                  ].includes(f.key)),
            ).map((f, i) => {
              const value = s.fields[f.key] || "",
                editing = manager && s.editingBrief;
              return {
                ...f,
                value,
                display:
                  f.type === "date"
                    ? dateLabel(value)
                    : value || "Not provided",
                valueColor: value ? "var(--ink)" : "var(--muted)",
                valueFont:
                  f.type === "date" ? "'IBM Plex Mono',monospace" : "inherit",
                viewing: !editing,
                editingText:
                  editing && !["area", "date", "select"].includes(f.type),
                editingArea: editing && f.type === "area",
                editingDate: editing && f.type === "date",
                editingSelect: editing && f.type === "select",
                borderTop: i ? "1px solid var(--line)" : "none",
                set: (ev) =>
                  this.patch({
                    fields: { ...this.state.fields, [f.key]: ev.target.value },
                  }),
              };
            }),
          }))
          .filter((sec) => sec.rows.length);
        const activity = p ? visibleActivity(p) : [],
          displayActivity = activity.filter((e) =>
            s.timelineFilter === "comments"
              ? e.type === "comment"
              : s.timelineFilter === "changes"
                ? e.type !== "comment"
                : true,
          );
        const timelineDisplay = [
          ...displayActivity.slice(0, s.timelineLimit).reduce((map, e) => {
            const date = dateLabel(D.today(e.at));
            if (!map.has(date)) map.set(date, []);
            map.get(date).push({
              id: e.id,
              isChange: e.type !== "comment",
              isComment: e.type === "comment",
              segs: [
                { t: D.name(e.actorId), b: true, plain: false },
                { t: " · " + e.text, b: false, plain: true },
              ],
              when: stamp(e.at),
              tm: stamp(e.at),
              i: initials(D.name(e.actorId)),
              n: D.name(e.actorId),
              c: color(e.actorId),
              onlyMe: !!e.private,
              body: e.text,
              canDelete:
                e.type === "comment" && e.private && e.actorId === actor,
              remove: () =>
                this.askDelete({
                  title: "Delete private note?",
                  body: "Only this note will be removed.",
                  pending: { kind: "comment", id: e.id, projectId: p.id },
                }),
            });
            return map;
          }, new Map()),
        ].map(([date, items]) => ({ date, items }));
        const canReviewReports = [
          "Operations manager",
          "Director",
          "Project lead",
        ].includes(user.role);
        const reportingPeople = canReviewReports
          ? D.PEOPLE.filter(
              (u) =>
                user.role !== "Project lead" ||
                u.id === actor ||
                (u.tier === "contributor" &&
                  projects.some(
                    (p) =>
                      p.leadId === actor &&
                      p.team.some((t) => t.personId === u.id),
                  )),
            )
          : [user];
        const week = s.weeklyWeekKey,
          current = week === D.weekStart(),
          reports = s.db.weeklyReports.filter(
            (r) =>
              r.weekKey === week &&
              reportingPeople.some((u) => u.id === r.personId),
          ),
          report = reports.find((r) => r.personId === actor),
          suggestions = this.weeklySuggestions(week);
        const selectedReport = reports.find(
          (r) => r.personId === s.weeklyPerson,
        );
        const weekText =
          shortDate(week) + " – " + dateLabel(D.addDays(week, 6));
        const assignees = D.PEOPLE.filter(
          (u) =>
            !s.members.some((m) => m.n === u.n) &&
            (!s.assignSearch ||
              u.n.toLowerCase().includes(s.assignSearch.toLowerCase())),
        );
        const phaseMenu = D.PHASE_KEYS.map((key) => ({
          label: D.PHASES[key].label,
          color: D.PHASES[key].color,
          bg: s.draftPhase === key ? D.PHASES[key].tint : "transparent",
          pick: () => this.patch({ draftPhase: key, showPhaseMenu: false }),
        }));
        const healthValues = p
          ? [
              ...(seeCommercial
                ? [
                    {
                      label: "Contract value",
                      value: money(p.commercial.contractValue),
                    },
                    {
                      label: "Approved budget",
                      value: money(p.commercial.approvedBudget),
                    },
                    {
                      label: "Approved variations",
                      value: money(p.commercial.approvedVariations),
                    },
                    {
                      label: "Committed cost",
                      value: money(p.commercial.committedCost),
                    },
                    {
                      label: "Forecast final cost",
                      value: money(p.commercial.forecastFinalCost),
                    },
                  ]
                : []),
              { label: "Site area", value: p.area ? p.area + " m²" : "Not set" },
              ...(seeCommercial
                ? [
                    {
                      label: "Target budget",
                      value: p.budgetBand || "Not set",
                    },
                  ]
                : []),
              {
                label: "Planned completion",
                value: dateLabel(p.schedule.plannedCompletion),
              },
              {
                label: "Forecast completion",
                value: dateLabel(p.schedule.forecastCompletion),
              },
              {
                label: "Schedule variance",
                value:
                  p.schedule.plannedCompletion && p.schedule.forecastCompletion
                    ? (D.days(
                        p.schedule.forecastCompletion,
                        p.schedule.plannedCompletion,
                      ) > 0
                        ? "+"
                        : "") +
                      D.days(
                        p.schedule.forecastCompletion,
                        p.schedule.plannedCompletion,
                      ) +
                      " days"
                    : "Not set",
              },
            ]
          : [];
        const bindings = {};
        filterKeys.forEach((k) => {
          bindings[k] = s[k];
          bindings["set" + k[0].toUpperCase() + k.slice(1)] = (ev) =>
            this.setState({ [k]: ev.target.value, listPage: 1 });
          bindings[k + "OnClass"] = s[k] !== "all" ? "is-on" : "";
        });
        for (const k of Object.keys(wizardBlank())) {
          bindings[k] = s[k];
          bindings["set" + k[0].toUpperCase() + k.slice(1)] = (ev) =>
            this.wizardSet(k, ev.target.value);
        }
        const reqFields = ["Pet hospital", "Medical imaging"].includes(
          s.newBuilding,
        )
          ? [
              "MRI involved?",
              "CT involved?",
              "DR involved?",
              "Equipment list available?",
              "Structural reinforcement expected?",
              "Shielding assessment required?",
            ]
          : s.newBuilding === "Cinema"
            ? [
                "Auditorium count",
                "Seat capacity",
                "Clear height",
                "Acoustic scope",
                "Projection / AV requirements",
                "Existing building / new build",
              ]
            : [];
        const wizardLocation = [
          ["newCountry", "Country"],
          ["newRegion", "Province / region"],
          ["newCity", "City *"],
          ["newSite", "Site name / site TBD"],
          ["newAddress", "Site address"],
          ["newContactName", "Client contact name"],
        ].map(([key, label]) => ({
          label,
          value: s[key],
          set: (ev) => this.wizardSet(key, ev.target.value),
        }));
        return {
          ...bindings,
          opsClose: () => this.closeDialog(),
          opsTitle: "",
          opsSubtitle: "",
          opsBadge: "",
          opsHasBadge: false,
          opsBadgeColor: "",
          opsDescription: "",
          opsDescriptionLabel: "",
          opsDependency: "",
          opsError: "",
          opsFields: [],
          opsFieldsLabel: "",
          opsDetailRows: [],
          opsHasDetailRows: false,
          opsHasInfoCard: false,
          opsHasContributors: false,
          opsContributors: [],
          opsCanUpload: false,
          opsUpload: (ev) => this.uploadFiles(ev, "milestone"),
          opsAttachments: [],
          opsRows: [],
          opsRowsEmpty: false,
          opsHistory: [],
          opsStandards: [],
          opsActions: [],
          ...this.renderDialog(),
          todayLabel: dateLabel(D.today()),
          pageLabel: labels[s.page],
          storageWarning: s.storageWarning,
          uploading: s.uploading,
          navOpen: s.navOpen,
          navClass: s.navOpen ? "is-open" : "",
          toggleNav: (ev) => {
            ev?.stopPropagation();
            this.setState({ navOpen: !s.navOpen });
          },
          closeNav: () => this.setState({ navOpen: false }),
          canCreateProject: D.canIntake(actor),
          canManageIntake: D.canIntake(actor),
          canEditSettings: user.role === "Operations manager",
          canChangePhase:
            s.page === "portfolio"
              ? !!peekP && D.canManage(peekP, actor) && D.isActive(peekP)
              : manager,
          canAssignTeam: manager,
          canComment: !!p && D.canComment(p, actor),
          isViewerOnly: viewer,
          actingAs: user.n,
          actingRole: user.role,
          actingTier: TIER[user.tier],
          actingInitials: initials(user.n),
          actingColor: user.c,
          actAsOptions: D.PEOPLE.map((u) => ({
            name: u.n,
            role: u.role,
            tier: TIER[u.tier],
            initials: initials(u.n),
            color: u.c,
            bg: u.id === actor ? "var(--accent-tint)" : "transparent",
            weight: u.id === actor ? "700" : "600",
            pick: (ev) => {
              ev?.stopPropagation();
              this.switchRole(u.n);
            },
          })),
          workspaceNav: [
            ...(contributor
              ? [
                  nav(
                    "mywork",
                    "My Work",
                    String(my.assigned.length + my.review.length),
                  ),
                ]
              : []),
            nav("portfolio", "Projects"),
            ...(D.canIntake(actor)
              ? [
                  nav(
                    "intake",
                    "Enquiries",
                    String(
                      s.db.enquiries.filter(
                        (q) => !["Converted", "Declined"].includes(q.status),
                      ).length,
                    ),
                  ),
                ]
              : []),
            nav("schedule", "Schedule"),
          ],
          studioNav: [
            ...(!contributor
              ? [nav("people", "Team"), nav("locations", "Locations")]
              : []),
            nav("standards", "Delivery Standards"),
          ],
          footerNav: [
            nav("team", "Weekly reports"),
            nav("support", "Support"),
            ...(user.role === "Operations manager"
              ? [nav("settings", "Settings")]
              : []),
          ],
          isPortfolio: s.page === "portfolio",
          isIntake: s.page === "intake",
          isSchedule: s.page === "schedule",
          isMyWork: s.page === "mywork",
          isLocations: s.page === "locations",
          isPeople: s.page === "people",
          isTeam: s.page === "team",
          isStandards: s.page === "standards",
          isSupport: s.page === "support",
          isSettings: s.page === "settings",
          isNew: s.page === "new",
          isDetail: s.page === "detail",
          goPortfolio: () => this.go("portfolio"),
          goIntake: () => this.go("intake"),
          goSchedule: () => this.go("schedule"),
          goNew: () => this.go("new"),
          goSettings: () => this.go("settings"),
          goSupport: () => this.go("support"),
          showAccountMenu: s.showAccountMenu,
          accountBg: s.showAccountMenu ? "var(--paper2)" : "transparent",
          toggleAccountMenu: (ev) => {
            ev.stopPropagation();
            this.setState({ showAccountMenu: !s.showAccountMenu });
          },
          stopBubble: (ev) => ev.stopPropagation(),
          closePopovers: () =>
            this.setState({
              showAccountMenu: false,
              showAlerts: false,
              showPhaseMenu: false,
              showPeekPhaseMenu: false,
              showManageTags: false,
              intakeMenuId: "",
            }),
          handleAppKeydown: (ev) => {
            if (ev.key !== "Escape") return;
            if (s.showUnsavedConfirm) this.closeUnsavedConfirm();
            else if (s.showDeleteConfirm) this.closeDeleteConfirm();
            else if (s.dialog) this.closeDialog();
            else if (s.showAssignForm) this.setState({ showAssignForm: false });
            else if (s.intakeMenuId)
              this.setState({ intakeMenuId: "" });
            else
              this.setState({
                navOpen: false,
                peekId: "",
                showAccountMenu: false,
                showPhaseMenu: false,
                showPeekPhaseMenu: false,
                showManageTags: false,
              });
          },
          showAlerts: s.showAlerts,
          hasAlerts: !!attentionRows.length,
          alerts: attentionRows.slice(0, 8).map((r) => ({
            title: r.project + " · " + r.code,
            meta: r.type + " · " + r.issue,
            metaColor: r.typeColor,
            open: r.open,
          })),
          toggleAlerts: (ev) => {
            ev.stopPropagation();
            this.setState({ showAlerts: !s.showAlerts });
          },
          showProjectFilters: s.showProjectFilters,
          toggleProjectFilters: () =>
            this.setState({ showProjectFilters: !s.showProjectFilters }),
          moreFiltersLabel:
            "Filters" +
            (filterChips.length ? " (" + filterChips.length + ")" : ""),
          sortValue: s.sortKey + ":" + s.sortDir,
          setProjectSort: (ev) => {
            const [sortKey, sortDir] = ev.target.value.split(":");
            this.setState({ sortKey, sortDir, listPage: 1 });
          },
          listTitle: contributor ? "Assigned projects" : "Projects",
          listCount: sorted.length,
          listEmptyHint: "No projects match these filters.",
          phaseBoxes,
          projectRows,
          hasProjectRows: !!projectRows.length,
          projectsEmpty: !sorted.length,
          isListFlat: !grouped,
          isListByClient: grouped,
          clientGroups,
          hasClientGroups: !!clientGroups.length,
          listGroupFlatPressed: !grouped,
          listGroupClientPressed: s.listGroup === "client",
          listGroupFlatBg: !grouped ? "var(--surface)" : "transparent",
          listGroupFlatColor: !grouped ? "var(--ink)" : "var(--muted)",
          listGroupClientBg:
            s.listGroup === "client" ? "var(--surface)" : "transparent",
          listGroupClientColor:
            s.listGroup === "client" ? "var(--ink)" : "var(--muted)",
          listGroupCityBg:
            s.listGroup === "city" ? "var(--surface)" : "transparent",
          listGroupCityPressed: s.listGroup === "city",
          groupFlat: () => this.setState({ listGroup: "flat" }),
          groupByClient: () => this.setState({ listGroup: "client" }),
          groupByCity: () => this.setState({ listGroup: "city" }),
          search: s.search,
          setSearch: (ev) =>
            this.setState({ search: ev.target.value, listPage: 1 }),
          serviceOptions: D.SERVICES,
          sectorOptions: D.SECTORS,
          leadOptions: leads,
          clientOptions: clients,
          cityOptions,
          phaseOptions,
          phaseTab: s.phaseTab,
          setPhaseTab: (ev) =>
            this.setState({
              phaseTab: ev.target.value,
              listPage: 1,
              metric: "all",
            }),
          holdOnly: s.holdOnly,
          setHoldOnly: (ev) =>
            this.setState({ holdOnly: ev.target.checked, listPage: 1 }),
          hasActiveFilters:
            !!filterChips.length ||
            !!q ||
            s.phaseTab !== "all" ||
            s.metric !== "all",
          hasFilterChips: !!filterChips.length,
          filterChips,
          clearFilters: resetFilters,
          clearAllFilters: resetFilters,
          sortKey: s.sortKey,
          sortDir: s.sortDir,
          setSortKey: (ev) =>
            this.setState({ sortKey: ev.target.value, listPage: 1 }),
          toggleSortDir: () =>
            this.setState({ sortDir: s.sortDir === "asc" ? "desc" : "asc" }),
          sortDirectionLabel:
            s.sortDir === "asc" ? "Ascending ↑" : "Descending ↓",
          showPagination: !grouped && sorted.length > pageSize,
          pageStart: sorted.length ? (page - 1) * pageSize + 1 : 0,
          pageEnd: Math.min(page * pageSize, sorted.length),
          pageSize: String(pageSize),
          setPageSize: (ev) =>
            this.setState({
              listPageSize: Number(ev.target.value),
              listPage: 1,
            }),
          pageOptions: Array.from({ length: pages }, (_, i) => ({
            number: i + 1,
            isPage: true,
            isEllipsis: false,
            isCurrent: page === i + 1,
            bg: page === i + 1 ? "var(--cta)" : "var(--surface)",
            color: page === i + 1 ? "#fff" : "var(--ink2)",
            border: "var(--lineS)",
            select: () => this.setState({ listPage: i + 1 }),
          })),
          previousPage: () =>
            this.setState({ listPage: Math.max(1, page - 1) }),
          nextPage: () =>
            this.setState({ listPage: Math.min(pages, page + 1) }),
          previousOpacity: page === 1 ? ".4" : "1",
          nextOpacity: page === pages ? ".4" : "1",
          showPeek:
            ["portfolio", "locations", "schedule"].includes(s.page) &&
            !!peek,
          peek,
          peekRail: peekP ? rail(peekP.phase, peekP.hold) : [],
          peekPhaseMenu: peekP
            ? D.PHASE_KEYS.map((key) => ({
                label: D.PHASES[key].label,
                color: D.PHASES[key].color,
                bg: peekP.phase === key ? D.PHASES[key].tint : "transparent",
                pick: () => this.setPhaseDirect(peekP.id, key),
              }))
            : [],
          showPeekPhaseMenu: s.showPeekPhaseMenu,
          togglePeekPhaseMenu: (ev) => {
            ev.stopPropagation();
            if (peekP && D.canManage(peekP, actor))
              this.setState({ showPeekPhaseMenu: !s.showPeekPhaseMenu });
          },
          peekHoldBg: peekP?.hold ? HOLD.tint : "transparent",
          peekHoldLabel: peekP?.hold ? "Resume project" : "Put on hold",
          peekToggleHold: () => {
            if (peekP?.hold)
              this.act(
                { type: "project.hold", projectId: peekP.id, hold: null },
                { showPeekPhaseMenu: false },
              );
            else if (peekP) this.openDialog("hold", peekP.id);
          },
          peekAddCollabDisplay:
            peekP && D.canManage(peekP, actor) && D.isActive(peekP)
              ? "inline-flex"
              : "none",
          closePeek: () =>
            this.setState({ peekId: "", showPeekPhaseMenu: false }),
          isPeekBrief: s.peekTab === "brief",
          isPeekActivity: s.peekTab === "activity",
          peekTabBrief: () => this.setState({ peekTab: "brief" }),
          peekTabActivity: () => this.setState({ peekTab: "activity" }),
          peekTabBriefColor:
            s.peekTab === "brief" ? "var(--ink)" : "var(--muted)",
          peekTabBriefBorder:
            s.peekTab === "brief" ? "var(--accent)" : "transparent",
          peekTabBriefWeight: "600",
          peekTabActivityColor:
            s.peekTab === "activity" ? "var(--ink)" : "var(--muted)",
          peekTabActivityBorder:
            s.peekTab === "activity" ? "var(--accent)" : "transparent",
          peekTabActivityWeight: "600",
          intakeSearch: s.intakeSearch,
          setIntakeSearch: (ev) =>
            this.setState({
              intakeSearch: ev.target.value,
              intakeMenuId: "",
            }),
          intakeStatusFilter: s.intakeStatusFilter,
          intakeStatusFilterOnClass:
            s.intakeStatusFilter !== "active" ? "is-on" : "",
          intakeStatusOptions: D.ENQUIRY_STATES,
          setIntakeStatusFilter: (ev) =>
            this.setState({
              intakeStatusFilter: ev.target.value,
              intakeMenuId: "",
            }),
          clearIntakeFilters: () =>
            this.setState({
              intakeSearch: "",
              intakeStatusFilter: "active",
              intakeMenuId: "",
            }),
          intakeFilterChips: [
            ...(s.intakeSearch.trim()
              ? [
                  {
                    label: "Search: " + s.intakeSearch.trim(),
                    clear: () =>
                      this.setState({ intakeSearch: "", intakeMenuId: "" }),
                  },
                ]
              : []),
            ...(s.intakeStatusFilter !== "active"
              ? [
                  {
                    label:
                      "Status: " +
                      (s.intakeStatusFilter === "all"
                        ? "All"
                        : s.intakeStatusFilter),
                    clear: () =>
                      this.setState({
                        intakeStatusFilter: "active",
                        intakeMenuId: "",
                      }),
                  },
                ]
              : []),
          ],
          hasIntakeFilters:
            !!s.intakeSearch.trim() || s.intakeStatusFilter !== "active",
          intakeCount: intakeFiltered.length,
          intakeRows: intakeFiltered.map((q) => {
            const canOpen =
              D.canIntake(actor) ||
              ["Finance", "Director"].includes(user.role);
            const converted = q.status === "Converted" && q.projectId;
            const openEnquiry = (ev) => {
              ev?.stopPropagation?.();
              this.setState({ intakeMenuId: "" });
              if (!canOpen) return;
              this.openDialog("enquiry", null, q.id);
            };
            const openProject = (ev) => {
              ev?.stopPropagation?.();
              this.setState({ intakeMenuId: "" });
              if (!canOpen || !converted) return;
              this.openProject(q.projectId);
            };
            const menuActions = [];
            if (canOpen) {
              if (converted) {
                menuActions.push({
                  label: "View project",
                  run: openProject,
                });
              } else {
                menuActions.push({
                  label: D.canIntake(actor)
                    ? "Review enquiry"
                    : "View enquiry",
                  run: openEnquiry,
                });
                if (q.status === "Ready to scope" && D.canIntake(actor))
                  menuActions.push({
                    label: "Convert to project",
                    run: openEnquiry,
                  });
              }
            }
            const primary = converted ? openProject : openEnquiry;
            const seeBudget = D.canViewEnquiryCommercial(q, actor, s.db);
            return {
              ...q,
              city: q.location.city,
              area: q.area ? q.area + " m²" : "—",
              budgetLabel: seeBudget ? q.budgetBand || "—" : "—",
              received: shortDate(D.today(q.createdAt)),
              triageLabel: q.status,
              waitMeta: q.externalDependency
                ? "Waiting on client"
                : q.status === "Declined"
                  ? q.declinedReason
                  : "",
              canAct: canOpen && !!menuActions.length,
              cannotAct: !canOpen || !menuActions.length,
              cta: menuActions[0]?.label || "",
              menuActions,
              menuOpen: s.intakeMenuId === q.id,
              menuLabel: "More actions for " + q.code,
              toggleMenu: (ev) => {
                ev?.stopPropagation?.();
                this.setState({
                  intakeMenuId: s.intakeMenuId === q.id ? "" : q.id,
                });
              },
              action: primary,
            };
          }),
          intakeEmpty: !s.db.enquiries.length,
          intakeNoMatches: !!s.db.enquiries.length && !intakeFiltered.length,
          intakeHasRows: !!intakeFiltered.length,
          scheduleGroups,
          scheduleTabs,
          scheduleRows,
          scheduleEmpty: !scheduleVisible.length,
          scheduleCount: schedule.length,
          scheduleVisibleCount: scheduleVisible.length,
          scheduleSearch: s.scheduleSearch,
          setScheduleSearch: (ev) =>
            this.setState({ scheduleSearch: ev.target.value, schedulePage: 1 }),
          schedulePageStart,
          schedulePageEnd: Math.min(
            scheduleVisible.length,
            schedulePage * Number(s.schedulePageSize),
          ),
          schedulePageSize: s.schedulePageSize,
          scheduleShowPagination: scheduleVisible.length > 0,
          schedulePreviousDisabled: schedulePage <= 1,
          scheduleNextDisabled: schedulePage >= schedulePages,
          schedulePrevious: () =>
            this.setState({ schedulePage: Math.max(1, schedulePage - 1) }),
          scheduleNext: () =>
            this.setState({
              schedulePage: Math.min(schedulePages, schedulePage + 1),
            }),
          setSchedulePageSize: (ev) =>
            this.setState({
              schedulePageSize: Number(ev.target.value),
              schedulePage: 1,
            }),
          showScheduleFilters: s.showScheduleFilters,
          toggleScheduleFilters: () =>
            this.setState({ showScheduleFilters: !s.showScheduleFilters }),
          scheduleFilterCount: Object.values(s.scheduleFilters).filter(
            (v) => v !== "all",
          ).length,
          scheduleFilterChips: Object.entries(s.scheduleFilters)
            .filter(([, v]) => v !== "all")
            .map(([key, value]) => ({
              label:
                key[0].toUpperCase() +
                key.slice(1) +
                ": " +
                (key === "project"
                  ? this.projectById(value)?.code
                  : key === "owner"
                    ? D.name(value)
                    : key === "phase"
                      ? D.PHASES[value].label
                      : value),
              clear: () =>
                this.setState({
                  scheduleFilters: { ...s.scheduleFilters, [key]: "all" },
                }),
            })),
          scheduleFilters: Object.entries({
            city: textOptions(cityOptions),
            project: projects.map((p) => ({
              value: p.id,
              label: p.code + " · " + p.name,
            })),
            phase: phaseOptions,
            owner: personOptions(D.PEOPLE),
            status: textOptions(D.STATUSES.filter((x) => x !== "Complete")),
            sector: textOptions(D.SECTORS),
          }).map(([key, options]) => ({
            label: key[0].toUpperCase() + key.slice(1),
            primary: ["city", "project"].includes(key),
            advanced: !["city", "project"].includes(key),
            value: s.scheduleFilters[key],
            options,
              set: (ev) =>
                this.setState({
                  scheduleFilters: {
                    ...s.scheduleFilters,
                    [key]: ev.target.value,
                  },
                  schedulePage: 1,
                }),
          })),
          resetSchedule: () =>
            this.setState({
              scheduleFilters: {
                city: "all",
                project: "all",
                phase: "all",
                owner: "all",
                status: "all",
                sector: "all",
              },
              schedulePage: 1,
            }),
          myWorkEmpty: myWorkGroups.every((g) => g.empty),
          myWorkGroups: myWorkGroups.filter((g) => !g.empty),
          locationRows,
          locationsEmpty: !locationRows.length,
          peopleRows: D.PEOPLE.map((u) => ({
            name: u.n,
            role: u.role,
            tier: TIER[u.tier],
            base: u.baseCity,
            supports: u.supportedCities.join(", "),
            projects: live.filter(
              (p) =>
                D.canView(p, u.id) && p.team.some((t) => t.personId === u.id),
            ).length,
            assignments: openms.filter((r) => r.milestone.ownerId === u.id)
              .length,
            reviews: openms.filter(
              (r) =>
                r.milestone.reviewerId === u.id &&
                r.milestone.status === "Ready for review",
            ).length,
          })),
          detailCode: p?.code || "—",
          detailName: p?.name || "Project",
          detailClient: p?.client || "—",
          detailService: p?.service || "—",
          detailCity: p?.location.city || "City TBD",
          detailSector: p?.sector || "",
          detailPhaseLabel: p
            ? D.PHASES[p.phase].label +
              (p.hold ? " · On hold" : "") +
              (!D.isActive(p) ? " · " + p.state : "")
            : "",
          detailPhaseTint: detailChip.tint,
          detailPhaseColor: detailChip.color,
          detailOwnerName: p ? D.name(p.leadId) : "Unassigned",
          detailUpdatedTime: p ? stamp(p.updatedAt) : "—",
          isTabDelivery: s.detailTab === "delivery",
          isTabBrief: s.detailTab === "brief",
          isTabActivity: s.detailTab === "activity",
          tabDelivery: () => this.goDetailTab("delivery"),
          tabBrief: () => this.goDetailTab("brief"),
          tabActivity: () => this.goDetailTab("activity"),
          tabDeliveryColor:
            s.detailTab === "delivery" ? "var(--accent-ink)" : "var(--muted)",
          tabDeliveryBorder:
            s.detailTab === "delivery" ? "var(--accent)" : "transparent",
          tabBriefColor:
            s.detailTab === "brief" ? "var(--accent-ink)" : "var(--muted)",
          tabBriefBorder:
            s.detailTab === "brief" ? "var(--accent)" : "transparent",
          tabActivityColor:
            s.detailTab === "activity" ? "var(--accent-ink)" : "var(--muted)",
          tabActivityBorder:
            s.detailTab === "activity" ? "var(--accent)" : "transparent",
          activityBadge: activity.length,
          draftPhaseLabel: draftChip.label,
          draftPhaseColor: draftChip.color,
          draftPhaseTint: draftChip.tint,
          draftPhaseDesc: draftChip.desc,
          lifecycleSteps: p ? rail(s.draftPhase || p.phase, p.hold) : [],
          showPhaseMenu: s.showPhaseMenu,
          togglePhaseMenu: (ev) => {
            ev.stopPropagation();
            if (manager) this.setState({ showPhaseMenu: !s.showPhaseMenu });
          },
          showPhaseReadonly: !manager,
          phaseMenu,
          holdBg: p?.hold ? HOLD.tint : "transparent",
          holdActionLabel: p?.hold ? "Resume project" : "Put on hold",
          toggleHold: () =>
            this.guard(() => {
              if (!manager) return;
              if (p.hold)
                this.act(
                  { type: "project.hold", projectId: p.id, hold: null },
                  { showPhaseMenu: false },
                );
              else this.showDialog("hold", p.id);
            }),
          showHoldMeta: !!p?.hold,
          holdMetaReason: hold.reason,
          holdMetaSince: shortDate(hold.since),
          holdMetaResume: shortDate(hold.expectedResume),
          holdMetaOwner: D.name(hold.ownerId),
          holdMetaImpact: hold.impact,
          showPhaseNote: s.draftPhase !== s.savedPhase,
          phaseNoteLabel: "Phase change note",
          phaseNoteHint: "(optional)",
          phaseNote: s.phaseNote,
          setPhaseNote: (ev) => this.setState({ phaseNote: ev.target.value }),
          showProgression: manager && !!required,
          progressionText: required
            ? "All required " +
              D.PHASES[p.phase].label +
              " milestones are complete. Move to " +
              D.PHASES[required].label +
              "?"
            : "",
          acceptProgression: () => {
            if (manager && required) this.patch({ draftPhase: required });
          },
          canCloseProject: manager && p.phase === "handover",
          closeProject: () =>
            this.guard(() => {
              if (this.act({ type: "project.close", projectId: p.id }))
                this.showToast("Project marked complete.");
            }),
          milestonePlan,
          milestonePlanHint: p
            ? D.activeMilestones(p).length + " milestones"
            : "",
          milestonesEmpty: !milestonePlan.length,
          manageMilestones: () => {
            if (p) this.openDialog("milestones", p.id);
          },
          canManageMilestones: manager,
          canManageOwnerMilestones: manager,
          detailScheduleHealth: p ? D.scheduleHealth(p) : "",
          healthSectionTitle: seeCommercial
            ? "Programme & commercial"
            : "Programme",
          showCommercial: seeCommercial,
          showCommercialColumn: commercialColumn,
          detailCommercialHealth: seeCommercial ? D.commercialHealth(p) : "",
          detailScheduleColor: p ? tone(D.scheduleHealth(p)) : "",
          detailCommercialColor: seeCommercial
            ? tone(D.commercialHealth(p))
            : "",
          healthValues,
          canEditHealth: commercial,
          editHealth: () => {
            if (commercial) this.openDialog("health", p.id);
          },
          setupPending: manager && !p.setupConfirmed,
          canConfirmSetup: manager,
          confirmSetup: () =>
            this.guard(() => {
              if (manager)
                this.act({
                  type: "project.save",
                  projectId: p.id,
                  data: { setupConfirmed: true },
                  summary: "Project Lead reviewed and confirmed project setup.",
                });
            }),
          workPackages,
          hasWorkPackages: !!workPackages.length,
          workPackagesEmpty: !workPackages.length,
          createWorkPackage: () => {
            if (manager) this.openDialog("package", p.id);
          },
          canCreateWorkPackage: manager,
          relevantStandards: this.knowledgeLinks(p),
          briefSections,
          editingBrief: s.editingBrief,
          viewingBrief: !s.editingBrief,
          showEditBriefBtn:
            s.detailTab === "brief" && !s.editingBrief && manager,
          startEditBrief: () => {
            if (manager)
              this.setState({ editingBrief: true, detailTab: "brief" });
          },
          detailTagChips: s.tags.map((name) => ({
            name,
            remove: () =>
              this.patch({ tags: s.tags.filter((t) => t !== name) }),
          })),
          canManageTags: manager,
          showManageTags: manager && s.showManageTags,
          toggleManageTags: (ev) => {
            ev.stopPropagation();
            if (manager) this.setState({ showManageTags: !s.showManageTags });
          },
          closeManageTags: (ev) => {
            ev?.stopPropagation();
            this.setState({ showManageTags: false });
          },
          tagPickSelect: s.tagPickSelect,
          setTagPickSelect: (ev) =>
            this.setState({ tagPickSelect: ev.target.value }),
          showTagOther: s.tagPickSelect === "Other",
          availableTagOptions: tags.filter((t) => !s.tags.includes(t)),
          newTag: s.newTag,
          setNewTag: (ev) => this.setState({ newTag: ev.target.value }),
          addTagOpacity: "1",
          addTag: () => {
            const tag =
              s.tagPickSelect === "Other" ? s.newTag.trim() : s.tagPickSelect;
            if (tag && !s.tags.includes(tag))
              this.patch({
                tags: [...s.tags, tag],
                showManageTags: false,
                tagPickSelect: "",
                newTag: "",
              });
          },
          memberList: s.members.map((m, i) => ({
            ...m,
            rowBorder:
              i === s.members.length - 1 ? "none" : "1px solid var(--line)",
            rowPaddingBottom: "11px",
            removeDisplay: manager ? "inline-flex" : "none",
            removeOpacity: "1",
            remove: () => {
              if (manager)
                this.askDelete({
                  title: "Remove collaborator?",
                  body: "Reassign their milestone and work package responsibilities before saving.",
                  action: "Remove",
                  pending: { kind: "member", name: m.n },
                });
            },
          })),
          membersEmpty: !s.members.length,
          showAssignForm: s.showAssignForm,
          toggleAssignForm: () => {
            if (manager)
              this.setState({
                showAssignForm: true,
                assignPerson: "",
                assignSearch: "",
              });
          },
          closeAssignForm: () => this.setState({ showAssignForm: false }),
          assignSearch: s.assignSearch,
          setAssignSearch: (ev) =>
            this.setState({ assignSearch: ev.target.value }),
          assignRoleSelect: s.assignRoleSelect,
          setAssignRoleSelect: (ev) =>
            this.setState({ assignRoleSelect: ev.target.value }),
          assignPeople: assignees.map((u) => ({
            n: u.n,
            i: initials(u.n),
            c: u.c,
            selected: s.assignPerson === u.n,
            bg: s.assignPerson === u.n ? "var(--accent-tint)" : "transparent",
            pick: () =>
              this.setState({ assignPerson: u.n, assignRoleSelect: u.role }),
          })),
          assignPeopleEmpty: !assignees.length,
          assignBtnBg: "var(--cta)",
          assignBtnOpacity: s.assignPerson ? "1" : ".65",
          collabRoleOptions: D.ROLES,
          assignMember: () => {
            if (!manager || !s.assignPerson) return;
            const selected = D.person(s.assignPerson),
              members = s.members.map((m) =>
                s.assignRoleSelect === "Project lead" &&
                m.role === "Project lead"
                  ? { ...m, role: "Specialist" }
                  : m,
              );
            this.patch({
              members: [
                ...members,
                {
                  n: selected.n,
                  i: initials(selected.n),
                  c: selected.c,
                  role: s.assignRoleSelect,
                },
              ],
              showAssignForm: false,
            });
          },
          files: s.files.map((f, index) => ({
            ...f,
            ext: f.name.split(".").pop().toUpperCase().slice(0, 3),
            borderBottom:
              index === s.files.length - 1 ? "none" : "1px solid var(--line)",
            canDelete: manager && s.editingBrief,
            download: () => this.download(f),
            remove: () => {
              if (manager)
                this.askDelete({
                  title: "Remove attachment?",
                  body: f.name + " will be removed when the project is saved.",
                  pending: { kind: "file", index },
                });
            },
          })),
          filesEmpty: !s.files.length,
          openFilePicker: () => {
            if (manager)
              document.getElementById("project-file-upload")?.click();
          },
          addFiles: (ev) => {
            if (manager) this.uploadFiles(ev, "project");
          },
          timelineDisplay,
          entriesCount: displayActivity.length,
          timelineEmpty: !displayActivity.length,
          hasOlderTimeline: displayActivity.length > s.timelineLimit,
          loadOlderTimeline: () =>
            this.setState({ timelineLimit: s.timelineLimit + 8 }),
          setTfAll: () =>
            this.setState({ timelineFilter: "all", timelineLimit: 8 }),
          setTfComments: () =>
            this.setState({ timelineFilter: "comments", timelineLimit: 8 }),
          setTfChanges: () =>
            this.setState({ timelineFilter: "changes", timelineLimit: 8 }),
          pAllColor:
            s.timelineFilter === "all" ? "var(--accent-ink)" : "var(--muted)",
          pAllBorder:
            s.timelineFilter === "all" ? "var(--accent)" : "transparent",
          pAllWeight: "600",
          pCColor:
            s.timelineFilter === "comments"
              ? "var(--accent-ink)"
              : "var(--muted)",
          pCBorder:
            s.timelineFilter === "comments" ? "var(--accent)" : "transparent",
          pCWeight: "600",
          pChColor:
            s.timelineFilter === "changes"
              ? "var(--accent-ink)"
              : "var(--muted)",
          pChBorder:
            s.timelineFilter === "changes" ? "var(--accent)" : "transparent",
          pChWeight: "600",
          commentDraft: s.commentDraft,
          setCommentDraft: (ev) =>
            this.setState({ commentDraft: ev.target.value }),
          commentOnlyMe: s.commentOnlyMe,
          setCommentOnlyMe: (ev) =>
            this.setState({ commentOnlyMe: ev.target.checked }),
          focusCommentInput: () =>
            document.getElementById("project-comment-input")?.focus(),
          postComment: () => this.postComment(),
          showQuickComment: s.showQuickComment,
          quickCommentCode: s.quickCommentCode,
          quickCommentName: s.quickCommentName,
          quickCommentDraft: s.quickCommentDraft,
          setQuickCommentDraft: (ev) =>
            this.setState({ quickCommentDraft: ev.target.value }),
          quickCommentOnlyMe: s.quickCommentOnlyMe,
          setQuickCommentOnlyMe: (ev) =>
            this.setState({ quickCommentOnlyMe: ev.target.checked }),
          closeQuickComment: () => this.setState({ showQuickComment: false }),
          postQuickComment: () => this.postComment(true),
          weeklyWeekLabel: weekText,
          weeklyWeekValue: week,
          weeklyWeekMax: D.addDays(D.weekStart(), 6),
          weeklyIsCurrent: current,
          weeklyNextDisabled: current,
          weeklyPrev: () => this.shiftWeeklyWeek(-1),
          weeklyNext: () => this.shiftWeeklyWeek(1),
          setWeeklyWeek: (ev) => this.setWeeklyWeek(ev),
          openWeeklyWeekPicker: (ev) => this.openWeeklyWeekPicker(ev),
          teamTabMine: () => this.setState({ teamTab: "mine" }),
          teamTabAll: () => {
            if (canReviewReports)
              this.guard(() => this.setState({ teamTab: "all" }));
          },
          teamTabMineSelected: s.teamTab === "mine",
          teamTabAllSelected: s.teamTab === "all",
          teamTabMineColor:
            s.teamTab === "mine" ? "var(--accent-ink)" : "var(--muted)",
          teamTabMineBorder:
            s.teamTab === "mine" ? "var(--accent)" : "transparent",
          teamTabAllColor:
            s.teamTab === "all" ? "var(--accent-ink)" : "var(--muted)",
          teamTabAllBorder:
            s.teamTab === "all" ? "var(--accent)" : "transparent",
          isTeamMine: s.teamTab === "mine",
          isTeamAll: s.teamTab === "all" && canReviewReports,
          canReviewReports,
          weeklyDirty: s.weeklyDirty,
          weeklyStatus: s.weeklyDirty
            ? "Unsaved changes"
            : report
              ? "Submitted " + dateLabel(report.submittedAt)
              : "Not submitted",
          weeklySuggestionsOpen: s.weeklySuggestionsOpen,
          toggleWeeklySuggestions: () =>
            this.setState({
              weeklySuggestionsOpen: !s.weeklySuggestionsOpen,
            }),
          weeklySuggestionGroups: [
            ["Projects", suggestions.sources],
            ["Completed & reviewed", suggestions.done],
            ["Due next week", suggestions.plan],
          ]
            .filter(([, text]) => text)
            .map(([label, text]) => ({ label, text })),
          hasWeeklySuggestions: !!(
            suggestions.sources ||
            suggestions.done ||
            suggestions.plan
          ),
          weeklySuggestionsEmpty: !(
            suggestions.sources ||
            suggestions.done ||
            suggestions.plan
          ),
          selectedReport: selectedReport
            ? {
                name: D.name(selectedReport.personId),
                role: D.PEOPLE.find((u) => u.id === selectedReport.personId)
                  ?.role,
                initials: initials(D.name(selectedReport.personId)),
                color: color(selectedReport.personId),
                sources: selectedReport.sources,
                done: selectedReport.done,
                issues: selectedReport.issues,
                plan: selectedReport.plan,
                submitted: dateLabel(selectedReport.submittedAt),
              }
            : null,
          hasSelectedReport: !!selectedReport,
          selectedMissing: (() => {
            if (selectedReport || !s.weeklyPerson) return null;
            const person = reportingPeople.find((u) => u.id === s.weeklyPerson);
            return person
              ? {
                  name: person.n,
                  role: person.role,
                  initials: initials(person.n),
                  color: person.c,
                }
              : null;
          })(),
          hasSelectedMissing: !!(
            s.weeklyPerson &&
            !selectedReport &&
            reportingPeople.some((u) => u.id === s.weeklyPerson)
          ),
          showReportPlaceholder: !s.weeklyPerson,
          closeReport: () => this.setState({ weeklyPerson: "" }),
          weeklyMineReadonly: !current,
          weeklyMineEditable: current,
          weeklyMineHasReport: !!report,
          weeklyMineMissing: !report,
          weeklyMineName: user.n,
          weeklyMineInitials: initials(user.n),
          weeklyMineColor: user.c,
          weeklyMineSources: report?.sources || "",
          weeklyMineDone: report?.done || "",
          weeklyMinePlan: report?.plan || "",
          weeklyMineIssues: report?.issues || "",
          weeklyMineSubmitted: dateLabel(report?.submittedAt),
          weeklySource: s.weeklySource,
          weeklyDone: s.weeklyDone,
          weeklyPlan: s.weeklyPlan,
          weeklyIssues: s.weeklyIssues,
          setWeeklySource: (ev) =>
            this.setState({
              weeklySource: ev.target.value,
              weeklyDirty: true,
            }),
          setWeeklyDone: (ev) =>
            this.setState({ weeklyDone: ev.target.value, weeklyDirty: true }),
          setWeeklyPlan: (ev) =>
            this.setState({ weeklyPlan: ev.target.value, weeklyDirty: true }),
          setWeeklyIssues: (ev) =>
            this.setState({
              weeklyIssues: ev.target.value,
              weeklyDirty: true,
            }),
          submitWeeklyReport: () => this.submitWeeklyReport(),
          weeklySubmitLabel: report ? "Update report" : "Submit report",
          weeklySuggestionText:
            [suggestions.sources, suggestions.done, suggestions.plan]
              .filter(Boolean)
              .join("\n") || "No recorded work for this week yet.",
          useWeeklySuggestions: () => {
            const merge = (a, b) =>
              [
                ...new Set(
                  [a, b]
                    .join("\n")
                    .split("\n")
                    .map((x) => x.trim())
                    .filter(Boolean),
                ),
              ].join("\n");
            this.setState({
              weeklyDirty: true,
              weeklySuggestionsOpen: false,
              weeklySource: merge(s.weeklySource, suggestions.sources),
              weeklyDone: merge(s.weeklyDone, suggestions.done),
              weeklyPlan: merge(s.weeklyPlan, suggestions.plan),
            });
          },
          weeklyAllCount: reports.length + " / " + reportingPeople.length,
          weeklySubmittedCount: String(reports.length),
          weeklyMissingCount: String(
            Math.max(0, reportingPeople.length - reports.length),
          ),
          weeklyIssuesCount: String(
            reports.filter((r) => !!(r.issues && String(r.issues).trim()))
              .length,
          ),
          weeklyAllRows: reportingPeople
            .map((u) => {
              const r = reports.find((rep) => rep.personId === u.id);
              const hasReport = !!r;
              const hasIssues = !!(r?.issues && String(r.issues).trim());
              const issueLine = hasIssues
                ? String(r.issues).split("\n")[0]
                : "";
              const preview = hasIssues
                ? issueLine
                : r?.done?.split("\n")[0] || "No report submitted";
              const selected = s.weeklyPerson === u.id;
              return {
                name: u.n,
                open: () => this.setState({ weeklyPerson: u.id }),
                summary: preview,
                previewClass: hasIssues ? "has-issues" : "",
                selected,
                initials: initials(u.n),
                color: u.c,
                role: u.role,
                isYou: u.id === actor,
                hasReport,
                hasIssues,
                sources: r?.sources || "No report submitted yet.",
                done: r
                  ? r.done + (r.issues ? "\nIssues: " + r.issues : "")
                  : "—",
                plan: r?.plan || "—",
                submitted: dateLabel(r?.submittedAt),
                badgeLabel: !hasReport
                  ? "Missing"
                  : hasIssues
                    ? "Issues"
                    : "Submitted",
                badgeClass: !hasReport
                  ? "is-pending"
                  : hasIssues
                    ? "is-issues"
                    : "is-done",
                rowClass: [
                  selected ? "is-selected" : "",
                  hasReport ? "" : "is-missing",
                  hasIssues ? "has-issues" : "",
                ]
                  .filter(Boolean)
                  .join(" "),
                actionLabel: hasReport
                  ? "Read " + u.n + " report"
                  : u.n + " — no report yet",
              };
            })
            .sort((a, b) => {
              const rank = (row) =>
                row.hasIssues ? 0 : row.hasReport ? 1 : 2;
              return rank(a) - rank(b) || a.name.localeCompare(b.name);
            }),
          standardsTabs: [
            ["templates", "Milestone templates"],
            ["lifecycle", "Lifecycle"],
            ["roles", "Responsibilities"],
          ].map(([key, label]) => ({
            label,
            selected: s.standardsTab === key,
            cls: s.standardsTab === key ? "is-active" : "",
            select: () => this.setState({ standardsTab: key }),
          })),
          standardsIsTemplates: s.standardsTab === "templates",
          standardsIsLifecycle: s.standardsTab === "lifecycle",
          standardsIsRoles: s.standardsTab === "roles",
          standardsSector: s.standardsSector,
          standardsService: s.standardsService,
          setStandardsService: (ev) =>
            this.setState({ standardsService: ev.target.value }),
          sectorNavItems: D.SECTORS.map((sector) => ({
            name: sector,
            active: sector === s.standardsSector,
            activeClass: sector === s.standardsSector ? "is-active" : "",
            meta:
              D.templateFor(sector, s.standardsService).length +
              " milestones",
            select: () => this.setState({ standardsSector: sector }),
          })),
          standardMilestoneCount: D.templateFor(
            s.standardsSector,
            s.standardsService,
          ).length,
          standardPhases: D.PHASE_KEYS.map((key) => {
            const items = D.templateFor(s.standardsSector, s.standardsService)
              .filter((m) => m.phase === key)
              .map((m) => {
                const itemKey = key + "|" + m.title;
                const expanded = s.standardsExpandedItem === itemKey;
                return {
                  title: m.title,
                  ownerRole: m.ownerRole,
                  acceptanceCriteria: m.acceptanceCriteria,
                  expanded,
                  toggle: () =>
                    this.setState({
                      standardsExpandedItem: expanded ? "" : itemKey,
                    }),
                };
              });
            return { label: D.PHASES[key].label, count: items.length, items };
          }).filter((g) => g.items.length),
          lifecycleRows: D.PHASE_KEYS.map((key, i) => ({
            ...D.PHASES[key],
            step: i + 1,
          })),
          authorityRows: [
            {
              label: "Operations Manager",
              desc: "Manage enquiries, portfolio, city operations and company settings.",
            },
            {
              label: "Project Lead",
              desc: "Own the project plan, team, programme, work packages and commercial information.",
            },
            {
              label: "Design Lead",
              desc: "Coordinate design delivery and review assigned milestones.",
            },
            {
              label: "Designer / Specialist",
              desc: "Deliver owned milestones, submit for review and flag blockers.",
            },
            {
              label: "Construction Lead",
              desc: "Lead site work packages, inspections and construction milestones.",
            },
            {
              label: "Finance",
              desc: "Maintain commercial information; view delivery progress.",
            },
            {
              label: "Director",
              desc: "View portfolio, project delivery and commercial information.",
            },
          ],
          faqs: [
            {
              q: "Who uses Fieldwork?",
              a: "Internal employees coordinate commercial design and construction. Clients, authorities and suppliers communicate externally; staff record the outcome here.",
            },
            {
              q: "How do phase, package and milestone differ?",
              a: "Phase describes the project lifecycle. An optional work package is a delivery scope. A milestone is an independent critical outcome with an explicit phase, owner, status and optional review.",
            },
            {
              q: "How do reviews work?",
              a: "The owner references a deliverable and submits it. Only the assigned internal reviewer can approve or request changes. Milestones without review are completed by their owner.",
            },
            {
              q: "Where does Schedule get its dates?",
              a: "Every incomplete dated milestone on an active project appears in Schedule. Dates, owners and city are read from the same project data used by My Work and Locations.",
            },
            {
              q: "How is data saved?",
              a: "This prototype stores changes in this browser. Uploaded file contents up to 2 MB each can be kept locally; use external links for large files. It is not a multi-user backend.",
            },
          ],
          reminderLead: s.db.settings.reminderLead,
          setReminderLead: (ev) => {
            if (user.role === "Operations manager")
              this.commit({
                ...s.db,
                settings: { ...s.db.settings, reminderLead: ev.target.value },
              });
          },
          reviewWindow: s.db.settings.reviewWindow,
          setReviewWindow: (ev) => {
            if (user.role === "Operations manager")
              this.commit({
                ...s.db,
                settings: { ...s.db.settings, reviewWindow: ev.target.value },
              });
          },
          notificationToggles: [
            ["milestone", "Milestone reminders"],
            ["phase", "Phase changes"],
            ["digest", "Monday digest"],
          ].map(([key, label]) => {
            const on = s.db.settings.notifications[key];
            return {
              label,
              on,
              trackBg: on ? "var(--accent)" : "var(--lineS)",
              knobLeft: on ? "21px" : "3px",
              toggle: () => {
                if (user.role === "Operations manager")
                  this.commit({
                    ...s.db,
                    settings: {
                      ...s.db.settings,
                      notifications: {
                        ...s.db.settings.notifications,
                        [key]: !on,
                      },
                    },
                  });
              },
            };
          }),
          isSubmitted: s.submitted,
          isWizardActive: !s.submitted,
          newReqCode: s.newReqCode,
          newReqName: s.newReqName,
          isStep1: s.wizardStep === 1,
          isStep2: s.wizardStep === 2,
          isStep3: s.wizardStep === 3,
          showBack: s.wizardStep > 1,
          nextLabel: s.wizardStep === 3 ? "Log enquiry" : "Continue",
          step1Color: s.wizardStep === 1 ? "var(--ink)" : "var(--muted)",
          step1Border: s.wizardStep === 1 ? "var(--ink)" : "transparent",
          step2Color: s.wizardStep === 2 ? "var(--ink)" : "var(--muted)",
          step2Border: s.wizardStep === 2 ? "var(--ink)" : "transparent",
          step3Color: s.wizardStep === 3 ? "var(--ink)" : "var(--muted)",
          step3Border: s.wizardStep === 3 ? "var(--ink)" : "transparent",
          newClientIsNew: s.newClientPick === "__new__",
          clientAccountOptions: clients,
          setNewClientPick: (ev) => {
            this.setState({
              newClientPick: ev.target.value,
              newClient: ev.target.value === "__new__" ? "" : ev.target.value,
              wizardDirty: true,
            });
          },
          wizardLocationFields: wizardLocation,
          newSectorFields: reqFields.map((label) => ({
            label,
            value: s.newRequirements[label] || "",
            set: (ev) =>
              this.wizardSet("newRequirements", {
                ...this.state.newRequirements,
                [label]: ev.target.value,
              }),
          })),
          hasSectorFields: !!reqFields.length,
          newIntakeHint:
            "Internal intake · customer requests received by email, phone, WeChat or meetings.",
          peopleOptions: D.PEOPLE.filter((u) =>
            ["Operations manager", "Project lead"].includes(u.role),
          ).map((u) => u.n),
          newRequestOwner: D.name(s.newRequestOwner),
          setNewRequestOwner: (ev) =>
            this.wizardSet(
              "newRequestOwner",
              D.person(ev.target.value)?.id || "",
            ),
          availableNewTags: tags.filter((t) => !s.newTags.includes(t)),
          hasNewTags: !!s.newTags.length,
          newTagChips: s.newTags.map((name) => ({
            name,
            remove: () =>
              this.wizardSet(
                "newTags",
                s.newTags.filter((t) => t !== name),
              ),
          })),
          addNewTag: () => {
            if (s.newTagPick && !s.newTags.includes(s.newTagPick))
              this.wizardSet("newTags", [...s.newTags, s.newTagPick]);
          },
          hasNewFiles: !!s.newFiles.length,
          newFilesLabel: s.newFiles.map((f) => f.name).join(" · "),
          openNewFilePicker: () =>
            document.getElementById("new-project-file-upload")?.click(),
          addNewFiles: (ev) => this.uploadFiles(ev, "new"),
          wizardBack: () =>
            this.setState({ wizardStep: Math.max(1, s.wizardStep - 1) }),
          wizardNext: () => this.wizardNext(),
          saveDraft: () => this.saveDraft(),
          hasDrafts: !!s.db.drafts.length,
          draftCount: s.db.drafts.length,
          drafts: s.db.drafts.map((d) => ({
            ...d,
            continue: () =>
              this.guard(() =>
                this.setState({
                  ...d.values,
                  wizardStep: d.step,
                  draftId: d.id,
                  submitted: false,
                  wizardDirty: false,
                }),
              ),
            remove: () =>
              this.askDelete({
                title: "Delete enquiry draft?",
                body: d.name,
                pending: { kind: "draft", id: d.id },
              }),
          })),
          hasDetailDirty: s.detailDirty && s.page === "detail",
          cancelDetailChanges: () => this.cancelDetailChanges(),
          saveDetailChanges: () => this.saveDetailChanges(),
          showUnsavedConfirm: s.showUnsavedConfirm,
          closeUnsavedConfirm: () => this.closeUnsavedConfirm(),
          discardAndNavigate: () => this.discardAndNavigate(),
          saveAndNavigate: () => this.saveAndNavigate(),
          showDeleteConfirm: s.showDeleteConfirm,
          deleteConfirmTitle: s.deleteConfirmTitle,
          deleteConfirmBody: s.deleteConfirmBody,
          deleteConfirmAction: s.deleteConfirmAction,
          closeDeleteConfirm: () => this.closeDeleteConfirm(),
          confirmDelete: () => this.confirmDelete(),
          toastMsg: s.toastMsg,
          hasToast: !!s.toastMsg,
          safeDeliverableLink:
            s.dialog?.kind === "milestone"
              ? safeUrl(s.editor?.deliverable)
              : "",
          opsDirty: s.editorDirty,
        };
      }
    };
});
