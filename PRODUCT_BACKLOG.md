# Product backlog

Last reviewed: 2026-11-05

This is the consolidated product backlog for `slimverlof.nl`. The repository's
`backlog/` intake folder contains no story files, and there are no open GitHub
issues at the time of review. The items below are therefore the remaining
product work identified from the current application and its documented scope.

## Priorities

Priority uses `P0` (highest) through `P3` (later). Each item is intentionally
written as an implementation-ready story with acceptance criteria.

### P0 — Make school-holiday data current and maintainable

**Story:** As a parent, I want the school-holiday overview to show the current
and upcoming school years, so that I can plan reliably beyond 2025–2026.

**Acceptance criteria**

- [ ] The displayed school year is derived from the current date rather than hardcoded.
- [ ] Users can switch between the current and next school year.
- [ ] The Noord, Midden, and Zuid dates are represented as structured dates, not display-only strings.
- [ ] The source and advisory-status disclaimer remain visible.
- [ ] Tests cover year rollover and all three regions.

### P0 — Share a complete planning

**Story:** As a user, I want to share my selected calculation, so that the
recipient sees the same dates, settings, and result.

**Acceptance criteria**

- [ ] The URL encodes the active mode, date range, available/target days, workdays, and ratio settings.
- [ ] Opening a shared URL restores those settings before rendering the result.
- [ ] Copy-link and WhatsApp sharing use the stateful URL.
- [ ] Invalid or incomplete URL parameters fall back safely to defaults.
- [ ] Tests cover round-tripping each calculator mode.

### P1 — Improve holiday and leave-day correctness

**Story:** As a Dutch employee, I want calculations to distinguish public
holidays from days my employer actually grants off, so that the result reflects
my employment policy.

**Acceptance criteria**

- [ ] Holiday metadata distinguishes national holidays, optional holidays, and ordinary weekends.
- [ ] Users can configure which holidays count as non-working days.
- [ ] Bevrijdingsdag can be toggled according to the employer's policy instead of always being treated identically.
- [ ] The result explains which days are free automatically and which require leave.
- [ ] Existing calculation behavior remains covered by regression tests.

### P1 — Add a clear result summary and export

**Story:** As a user, I want to save or export a selected recommendation, so
that I can use it in my calendar or discuss it with my employer.

**Acceptance criteria**

- [ ] A result can be downloaded as an `.ics` calendar event or events.
- [ ] The export includes the selected date range, leave days, holidays, and a descriptive title.
- [ ] The result summary has a print-friendly layout.
- [ ] Export and print actions work for both the standard result and a ratio result.
- [ ] Tests cover event dates, titles, and timezone-safe date handling.

### P1 — Support multiple leave policies

**Story:** As a part-time or irregular-hours worker, I want to model my actual
working pattern, so that recommendations match my contract.

**Acceptance criteria**

- [ ] Users can save named work schedules (for example, 4-day week or shift pattern).
- [ ] The calculator supports recurring schedules beyond a simple Monday–Sunday toggle.
- [ ] Each recommendation shows the schedule used for its cost calculation.
- [ ] The schedule is included in shared URLs.
- [ ] Tests cover non-contiguous and rotating work patterns.

### P2 — Add accessible, mobile-friendly interaction

**Story:** As a keyboard, screen-reader, or mobile user, I want every control
and result to be understandable and usable.

**Acceptance criteria**

- [ ] Icon-only controls have accessible names and expose their expanded/active state.
- [ ] Mode changes and calculation results are announced appropriately.
- [ ] All interactive controls are reachable and usable with the keyboard.
- [ ] Calendar days expose their date and status textually.
- [ ] Automated accessibility checks run in CI, and the primary flows are verified at mobile widths.

### P2 — Add progressive web app support

**Story:** As a frequent planner, I want to use slimverlof.nl offline or from my
home screen, so that it remains useful while travelling.

**Acceptance criteria**

- [ ] The app has a web manifest with name, icons, theme colors, and standalone display settings.
- [ ] A service worker caches the application shell and static holiday data.
- [ ] The calculator remains usable without a network connection after the first load.
- [ ] A cache-versioning strategy prevents stale deployments from persisting indefinitely.
- [ ] Installability and offline behavior are tested in a supported browser.

### P3 — Add lightweight product analytics and feedback

**Story:** As the product owner, I want privacy-conscious insight into which
planning modes are useful, so that future improvements reflect real usage.

**Acceptance criteria**

- [ ] Analytics is opt-in or demonstrably privacy-preserving and documented.
- [ ] It measures mode usage, successful calculations, and export/share actions without recording personal dates or URLs.
- [ ] A feedback link is available from the app.
- [ ] Tracking is disabled in local development and test environments.
- [ ] The privacy notice explains the collected data and retention.

## Completed or explicitly excluded from this backlog

- Deployment and CI reliability issues from the historical GitHub issue queue are closed and are not product backlog items.
- Dark/light/system themes, WhatsApp/link sharing, custom workdays, holiday calculations, school-holiday display, ratio ranking, and coverage-gated CI are already present in the current application.
