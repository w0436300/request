# Fieldwork implementation audit

Baseline: `812c927`, read in full before implementation. Branch: `codex/fieldwork-operations-model`.

## Preserve

- DCLogic (`support.js` is generated), scoped template bindings and existing neutral/purple enterprise styling.
- Projects filtering, sorting, pagination, client grouping and responsive preview (docked above 1560px; overlay below).
- Drawer navigation below 1240px, horizontal tables, responsive brief and team layouts.
- Delivery / Project Brief / Activity tabs, team assignment, tags, draft edits, unsaved-navigation confirmation, comments/private notes, weekly reports and settings.
- Independent Knowledge Hub and password gate. Pages copies `Fieldwork.dc.html` to `app.html` only on main deployment.

## Findings

- `project.ms` holds a single date/title. `buildMilestonePlan` invents completed dates in 14-day intervals; array position infers phase. Schedule uses the same single value and truncates groups.
- Work packages are PR records in the projects array; creation routes to the enquiry wizard and inflates counts.
- Service templates override richer sector templates. Lifecycle lacks Pre-construction and treats Closed as a phase.
- Global tiers permit all contributor milestone edits without ownership/reviewer checks. Only four simulated employees exist, including no designer/design lead. Client contact incorrectly appears among assignment roles.
- Seed edits, files and activity are reconstructed on project open; most changes persist only for newly created projects. Enquiry triage buttons show toasts rather than changing state; seed conversions can be repeated.
- Site is free text, demo date is fixed, schedule dates and activity are fabricated, and uploaded files discard their contents.

## Implementation plan

Introduce a pure domain module for migration, explicit sector templates, role/assignment checks and immutable transactions. Keep one canonical store for projects, enquiries, milestones, work packages, people and activity, persisted locally for this prototype. DCLogic retains existing UI interactions with editable drafts only; derived portfolio, Schedule, My Work and city views read the store. Migration retains known legacy dates without inventing historical completions. New templates are undated until planned.

Implement model → core flows → cross-project views → health/responsibilities → standards, knowledge links and reports. Keep current deployment names; copy the new domain asset alongside the existing HTML/runtime. Validate domain transitions and controller interactions, then browser workflows and responsive layouts.
