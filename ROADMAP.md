# Roadmap

This roadmap focuses on practical improvements that keep Taskmaster Pro lightweight while making it more resilient, accessible, and portfolio-ready.

## Stage 1 — Hardening and Polish

- Validate and normalize all task input before storage.
- Keep rendering XSS-safe by using text APIs instead of HTML injection.
- Gracefully recover from malformed `localStorage` data.
- Add modal labels, validation feedback, skip link, and visible focus states.
- Document usage, security posture, and verification steps.

## Stage 2 — Dependency Modernization

- Upgrade or replace older CDN libraries:
  - jQuery 3.4.1
  - jQuery UI 1.12.1
  - Bootstrap 4.3.1
  - Moment.js 2.24.0
- Consider replacing Moment.js with native `Intl`/date helpers or a smaller maintained library.
- Vendor static assets or add Subresource Integrity hashes for CDN resources.
- Revisit the Content Security Policy after dependency changes.

## Stage 3 — Accessibility and UX

- Add keyboard controls for moving tasks between columns.
- Add visible empty-state messaging per column.
- Improve drag-and-drop announcements for assistive technologies.
- Add optional confirmation/undo for single-task deletion.
- Improve mobile editing ergonomics for inline due-date changes.

## Stage 4 — Data Portability

- Add export/import for JSON backups.
- Add a storage version field and migration path.
- Add duplicate/corrupt backup recovery guidance.
- Consider optional browser `IndexedDB` storage if task data grows.

## Stage 5 — Testing and Quality Gates

- Add a minimal test runner for task normalization and storage parsing helpers.
- Add Playwright smoke tests for add/edit/move/delete flows.
- Add HTML/CSS linting.
- Add a CI workflow that runs syntax checks, diff whitespace checks, and smoke tests.

## Stage 6 — Product Enhancements

- Add priorities, tags, or swimlanes.
- Add task search/filtering.
- Add recurring due dates.
- Add theme support with persisted user preference.
- Add optional board statistics, such as tasks completed this week.
