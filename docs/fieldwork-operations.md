# Fieldwork operations refactor

Branch: `codex/fieldwork-operations-model` · baseline: `812c927`.

## Architecture and product changes

Fieldwork remains the existing internal DCLogic prototype. Its shell, purple/neutral styling, preview, responsive navigation, project tabs, comments, draft handling and reporting patterns are retained. It has no client accounts or client approval screens.

`Fieldwork.dc.html` is the view and a small DCLogic entry class. `fieldwork-ui.js` is the hand-authored controller; `fieldwork-domain.js` holds pure model helpers, sector templates, permission checks and immutable transactions. `support.js` remains byte-for-byte unchanged. No application framework or runtime dependency was introduced. Playwright and Prettier are development-only dependencies.

All editable business records live in one versioned store, persisted under `fieldwork.operations.v3` in browser local storage. Forms use temporary drafts; successful transactions replace the canonical record. Schedule, My Work, project preview/detail, portfolio, Locations and weekly suggestions derive from this store. Activity is stored per project and survives navigation and reload. Private notes are visible only to their author in simulated roles.

## Data model

```text
Store
  projects[]
    id, code, name, client, sector, service
    phase: scoping | design | pre-construction | construction | commissioning | handover
    state: Active | Closed | Archived
    location: {country, region, city, siteName, siteAddress}
    leadId, team[{personId, role}]
    hold?: {reason, ownerId, since, expectedResume, impact}
    workPackages[{id, projectId, code, name, scope, leadId, contributorIds,
                  startDate, targetFinish, budget, progress}]
    milestones[{id, projectId, title, phase, workPackageId?, ownerId, reviewerId?,
                dueDate, actualCompletionDate?, status, reviewRequired, deliverable,
                attachments, required, source, blockedReason, externalDependency?,
                submittedAt, reviewHistory[], createdAt, updatedAt, archivedAt?}]
    commercial: {contractValue, approvedBudget, approvedVariations,
                 committedCost, forecastFinalCost, health}
    schedule: {health, plannedCompletion, forecastCompletion}
    brief, contact, programme, budgetBand, targetOpening, requirements, attachments
    activity[]
  enquiries[{id, code, status, location, client, sector, service, brief,
             budgetBand, programme, targetOpening, ownerId, contact, requirements,
             attachments, externalDependency?, projectId?}]
  weeklyReports[], drafts[], settings
```

People have stable IDs, internal roles, base city and supported cities. A project has a single stored lead and structured team assignments. Work packages and milestones never copy editable city, client or sector fields. Package IDs are project-scoped (`PR-061 / WP-01`) and never increase the project count.

Review history belongs to a milestone. Each submission/decision snapshots the deliverable, attachments, actor, timestamp and comment. External dependencies have an external actor category and outcome; they do not create system users.

## Old logic removed

- Single editable `project.ms`, next-milestone overrides, parallel created-project state and index-to-phase inference.
- Synthetic completed milestone dates, generated timeline history and schedule group truncation.
- Service-first template selection and Closed in the lifecycle rail.
- PR work-package records, work-package enquiry requests and parent-project selection in intake.
- Tier-wide contributor milestone mutations and “Viewer / Reviewer” naming.
- Toast-only enquiry triage, repeated seed-enquiry conversion and page-local activity.
- Fixed “today” and fixed schedule week labels; fake file downloads that returned placeholder text.

`fieldwork-seed.js` contains the original legacy records solely as migration input. `migrateProjects` consumes the old `ms` once and retains the one documented date; other template dates and completions remain unset. The old representation never enters the canonical store or a view. The detailed hospital fixture explicitly seeds demo outcomes relative to its creation date; rendering never invents dates or completions.

## Workflows

- Enquiries: internal intake → New / Under review / Needs information / Ready to scope → one-time conversion. Declined and Converted records remain available. Location, brief, contact, sector requirements, budget, programme and actual attachment contents carry over.
- Setup: conversion assigns a Project Lead, starts at Scoping, applies the sector template plus service modifier, and asks the lead to review the plan, team, packages, programme and commercial information.
- Milestones: create/edit explicit phases and dates, assign an internal owner and optional reviewer/package, choose required/optional, reorder without changing phase, and archive optional custom milestones with audit history.
- Review: owner starts/resumes, saves a link/reference or file, and submits. Only the assigned reviewer can approve or request changes. Changes must be resumed and resubmitted. Direct completion is allowed only when no internal review is required. External dependencies must be confirmed before completion/approval.
- External outcomes: Project Lead / Operations records confirmation or revision from client, authority, vendor, landlord or equipment supplier. Confirmation does not pretend the external actor logged in or completed internal review.
- Work packages: created only within projects; lead/contributors, scope, dates, optional budget and manual/derived progress. Package leads may update delivery progress, not redefine responsibility or commercial scope.
- Schedule: all incomplete dated milestones from active projects, including same-day outcomes, overdue and blocked work. City/project/phase/owner/status/sector filters. Calendar-week grouping uses the current local date.
- My Work: assigned outcomes, assigned reviews, blockers, due-this-week and recent completions. Contributor navigation omits intake/company operations.
- Portfolio/Locations: actual project counts, operational metrics, city grouping/filtering, schedule/commercial health, city detail, enquiries, open milestones, sector mix and team coverage.
- Lifecycle: explicit Project Lead control, optional progression suggestion after required phase milestones complete, full hold metadata, and closing only after required work is complete in Handover.
- Company: role-aware settings, structured team coverage, milestone templates, weekly report suggestions derived from project activity/completions/reviews, and contextual searches into the independent Knowledge Hub.

## Files and deployment

| File | Responsibility |
| --- | --- |
| `Fieldwork.dc.html` | Existing DC template, operational sections, dialogs and responsive styles |
| `fieldwork-domain.js` | Model, migration, templates, derived views, permissions and transactions |
| `fieldwork-ui.js` | DC controller, editor drafts, navigation, uploads and persistence |
| `fieldwork-seed.js` | Read-only legacy fixture input |
| `knowledge-hub/fieldwork-context.js` | Contextual query entry and clearly labelled sample reference metadata |
| `knowledge-hub/index.html`, `Meridian-KB-prototype.html` | Load the contextual entry bridge |
| `.github/workflows/deploy-pages.yml` | Copy new authored scripts; same `main` trigger, gate and `app.html` route |
| `knowledge-hub/.github/workflows/deploy-pages.yml` | Include bridge in standalone Hub artifact |
| `scripts/serve.cjs` | Loopback-only development preview |
| `tests/*.cjs`, `package.json`, `package-lock.json` | Reproducible domain/controller/browser validation |
| `.gitignore`, `docs/*`, `README.md` | Exclude generated test files; audit and handoff documentation |

The deployment still copies `Fieldwork.dc.html` to `app.html`. Password/hash injection and the Knowledge Hub workspace remain intact. Development-only unlocking is served in memory by the loopback server, never written into deployed HTML/auth files. Nothing has been pushed, merged or deployed by this refactor.

## Deliberate simplifications

- Single-browser prototype persistence, not a multi-user backend or production authentication/authorization service. Role simulation is retained.
- No tasks, task percentages, Gantt/CPM, ERP, procurement engine, client/vendor portal or daily diary.
- File contents are locally retained with a 2 MB per-file limit; larger deliverables use links. Storage failures are visible and leave current-tab data available.
- Work-package phase/health derives from its explicit milestones; progress can be manual or completed-milestone ratio. No independent lifecycle phase state is copied to the package.
- Templates are initially undated. New projects must be planned by employees; no invented baseline programme.
- Company roster/city support is structured seed data. Weekly reports are narrative updates with suggestions, not capacity optimization. Reminder settings persist but do not send notifications.
- Knowledge Hub references are clearly labelled demo records. Controlled company documents must replace those examples before operational use; no medical or construction specification is asserted by the placeholders.

## Validation

Run `npm ci`, then `npm test`. Run `npm run dev` and, in another terminal, `npm run test:browser` (installed Google Chrome required; Playwright uses its Chrome channel).

- Domain/controller suite covers migration, explicit phases, service modifiers, conversion and duplicate prevention, ownership/reviewer checks, revision cycles, external dependencies, date synchronization, city/package inheritance, permissions, hold/close rules, custom milestones, private notes, unsaved navigation and template bindings.
- Browser suite uses real clicks/forms/uploads: enquiry → conversion → team → four packages → milestone; designer/reviewer revision loop; external confirmation; date and city filtering; brief/private notes; reload persistence; role-aware navigation; company pages and Knowledge Hub context.
- Viewports: 1680, 1366, 1024, 768 and 390 px. Portfolio, preview, detail, milestone dialog and Schedule are checked; tables scroll horizontally without document overflow.
- Browser run records zero console/page errors. Screenshots and JSON results are generated under ignored `test-results/`.

Optional next work: shared persistence with server-enforced authorization, controlled-document connections, larger-file storage, editable company roster/city coverage, and stricter project setup completeness rules.

## UI refinement and commercial visibility

The follow-up refinement keeps search, city and phase visible on Projects. Secondary filters expand on demand, combine with AND, show removable applied chips, and share one reset. Grouping and sorting are separate from filtering. Schedule uses the same disclosure pattern.

Commercial reads are separate from writes. Operations Manager, Finance and Director can read commercial information. Project Leads can read it only for projects they lead. Design Lead, Designer, Construction Lead and Specialist do not receive commercial fields in the rendered view models or DOM. This includes portfolio health/filtering, preview, programme figures, budget/contract brief fields, package budgets and commercial activity. An enquiry's budget follows its assigned request owner before conversion, and project ownership after conversion. Director remains read-only.

These are prototype view and transaction permissions, not production data security: the shared demo still ships its seed and local storage to the browser and exposes role simulation. A real deployment with confidential data requires authenticated server-side authorization and filtered API responses; do not load live financial records into this demo.

Delivery Standards now has a single sector/service template browser plus Lifecycle and Responsibilities tabs. Weekly reports uses a compact editor, optional project-activity import with deduplication, unsaved-change protection, and a team submission list with on-demand report reading. Team reports are limited to Operations/Director and the assigned Project Lead's delivery team; other employees see their own report. Empty explanatory panels, duplicate role/phase descriptions, the placeholder support email and unused legacy view styles have been removed. Blank optional brief fields are shown only while editing.

`npm run test:ui` adds browser checks for all nine role simulations, related/unrelated Project Lead visibility, filters, template scope, report submission/update/persistence, and all main pages at 1680, 1366, 1024, 768 and 390 px.
