# Product backlog

Last reviewed: 2026-11-07

This backlog contains only open product work for `slimverlof.nl`. Items are
ordered by implementation dependency: build the calculation contract first,
then features that consume that contract, and finally packaging/offline work.

## Delivery constraints

- The site remains a static Vite application.
- All behavior runs in the browser and uses the existing static build output.
- Do not add a database, server-side session, user account, application API, or
  telemetry storage.
- Do not add permanent user data storage. Shared state belongs in the URL;
  exported state belongs in a browser download.
- Preserve the existing Dutch UI, accessibility behavior, responsive layout,
  and current test conventions.

## Ordered backlog

### 1. P0 — Make holiday policy explicit and correct

**Status:** Ready to build

**Depends on:** None

**Goal:** Make the calculator distinguish a statutory holiday date from the
user's employment policy, so the result never implies that every Dutch holiday
is automatically a day off.

**Likely touch points:** `src/utils/holidays.js`, `src/utils/calculator.js`,
`src/App.jsx`, calendar/result components, and their existing unit/component
tests.

**Implementation contract**

- Represent every holiday with a stable identifier, Dutch label, date, and
  policy category. At minimum support `national`, `optional`, and
  `employer-dependent`.
- Keep `Bevrijdingsdag` employer-dependent by default; do not treat it as an
  automatic day off unless the user selects that policy.
- Add a browser-only control for the holiday policy. It must be part of React
  state and have a deterministic default; no persistence is allowed.
- Pass the selected policy into every calculator mode, including max-free,
  find-range, and best-ratio calculations.
- Keep weekends and user-selected workdays separate from holidays. A holiday
  may make a selected workday free, but must not change the user's workday
  schedule.
- Expose enough metadata for the result and calendar to explain whether each
  day is free because of a weekend, selected holiday policy, or required leave.

**Acceptance criteria**

- [ ] Holiday metadata has stable IDs and explicit policy categories.
- [ ] The default policy does not grant employer-dependent holidays
      automatically.
- [ ] Users can enable/disable optional and employer-dependent holidays in the
      current calculation.
- [ ] All three calculator modes use the same policy-aware holiday resolver.
- [ ] Result summaries and calendar labels explain the reason for each holiday
      status.
- [ ] Existing defaults and calculations remain unchanged except where the new
      policy intentionally changes holiday treatment.
- [ ] Unit tests cover at least one year with Bevrijdingsdag, a movable holiday,
      a weekend holiday, and a multi-year date range.
- [ ] Component tests cover changing the policy and recalculating the result.
- [ ] `npm run lint:ci`, `npm run test:unit`, and `npm run build` pass.

**Done when:** The calculator's returned day model is policy-aware and all
visible results consistently use it.

### 2. P0 — Share a complete planning through a URL

**Status:** Ready to build

**Depends on:** Backlog item 1

**Goal:** Let a recipient open a link and see the same planner inputs and
calculation without a backend or stored session.

**Likely touch points:** `src/App.jsx`, `src/components/ShareButton.jsx`, a new
URL-state utility under `src/utils/`, and app/share tests.

**Implementation contract**

- Define one versioned query-string schema, for example `v=1`, for all inputs
  that affect a result: mode, start/end dates, vacation days, target length,
  workdays, ratio limits, multiple-block setting, and holiday policy.
- Serialize dates as `YYYY-MM-DD`, workdays as sorted numeric values, booleans
  as `0`/`1`, and enums from an allow-list. Keep URLs readable; do not encode
  React internals or result objects.
- Parse and validate the URL before the first meaningful render. Clamp numeric
  values to the existing input limits and reject invalid dates, modes, enum
  values, and empty workday sets by falling back to defaults.
- Generate the canonical URL from current state whenever the user copies or
  shares. Do not rely on unrelated query parameters in the browser URL.
- Keep the current copy-link and WhatsApp actions, but make both use the
  canonical stateful URL. The share control must remain usable when the page
  has no valid result yet.
- Do not use localStorage, cookies, a database, or an API for restoration.

**Acceptance criteria**

- [ ] A canonical URL schema and validation rules are documented in code.
- [ ] Opening a valid URL restores state before calculations are displayed.
- [ ] Copy-link and WhatsApp include the full canonical planner state.
- [ ] Invalid, incomplete, unsupported-version, and conflicting parameters
      safely fall back to defaults without throwing.
- [ ] Round-trip tests cover max-free, find-range, best-ratio, school-holiday
      mode, custom workdays, ratio settings, and holiday policy.
- [ ] Tests confirm that the generated URL is deterministic and omits no
      calculation input.
- [ ] Existing keyboard, focus, clipboard, and share-menu behavior remains
      intact.
- [ ] `npm run lint:ci`, `npm run test:unit`, and `npm run build` pass.

**Done when:** Copying a link, opening it in a fresh browser context, and
comparing the controls and result produces the same planning state.

### 3. P1 — Download and print a complete result

**Status:** Ready to build

**Depends on:** Backlog items 1 and 2

**Goal:** Allow users to take a calculation out of the static site as a useful
calendar file or printable summary, without uploading anything.

**Likely touch points:** shared result/day model from item 1, `src/App.jsx`, a
new export utility/component, print CSS in `src/App.css`, and export tests.

**Implementation contract**

- Build exports from the same normalized result model rendered on screen; do
  not recalculate with a second holiday implementation.
- Generate a standards-compliant `.ics` download in the browser. Use stable
  all-day events, escaped text, `DTSTART;VALUE=DATE`, exclusive `DTEND`, and a
  deterministic UID derived from the plan rather than a server ID.
- Include the selected planning range, leave days, automatically free days,
  holidays, policy choice, and a descriptive Dutch title in the result view or
  export metadata.
- Support both standard results and best-ratio/multiple-block results. Export
  one all-day event per recommended leave block or a clearly documented summary
  event when a block has no leave days.
- Add a print action using print media styles. Printing must hide controls and
  decorative navigation while retaining the title, inputs, legend, result,
  holiday explanation, and dates.
- Trigger downloads with browser APIs only. Revoke temporary object URLs and
  never send result data to a server.

**Acceptance criteria**

- [ ] `.ics` output parses as valid iCalendar and uses exclusive end dates.
- [ ] Exported dates remain correct across month/year boundaries and local
      timezone settings.
- [ ] Export includes leave days, holidays, policy choice, and descriptive
      titles for standard and ratio results.
- [ ] Zero-leave and no-result states have a safe, user-facing explanation and
      do not create malformed files.
- [ ] Print layout contains the complete result and hides interactive controls.
- [ ] Unit tests cover escaping, multi-day ranges, adjacent events, year
      boundaries, and ratio blocks.
- [ ] Component/browser tests cover download and print controls.
- [ ] `npm run lint:ci`, `npm run test:unit`, `npm run test:browser`, and
      `npm run build` pass.

**Done when:** A user can download a correct calendar file or print a complete
result entirely offline from the loaded page.

### 4. P2 — Add static progressive web app support

**Status:** Ready to build

**Depends on:** Backlog items 1–3

**Goal:** Make the finished planner installable and usable offline after its
static assets have been loaded once.

**Likely touch points:** `index.html`, `public/`, Vite configuration, a new
service-worker entry point, and browser tests.

**Implementation contract**

- Add a web manifest with the Dutch site name, short name, description, theme
  colors, icons, `start_url`, `scope`, and standalone display mode.
- Add installable icons in the existing public asset pipeline; do not fetch
  icons from a third-party host.
- Cache the application shell, JavaScript/CSS chunks, fonts/assets used by the
  app, and static holiday data with a versioned cache name.
- Use a cache-first strategy for immutable hashed assets and a safe update
  strategy for the HTML shell. Old caches must be removed during activation.
- Register the service worker only in production builds. Development and test
  runs must not become dependent on a service worker.
- Preserve normal browser behavior when the service worker is unsupported or
  an asset cannot be cached.

**Acceptance criteria**

- [ ] Manifest and icons are present in the production build and pass a
      manifest/installability check.
- [ ] A first online visit followed by offline reload can open the planner and
      run all calculator modes using bundled holiday data.
- [ ] URL-shared plans continue to restore offline.
- [ ] Cache names include a build version and obsolete caches are deleted.
- [ ] A new deployment can update the shell without leaving users permanently
      on stale application code.
- [ ] Service-worker registration is absent from development/test behavior.
- [ ] Browser tests cover registration, offline app-shell loading, and cache
      cleanup in a supported environment.
- [ ] `npm run lint:ci`, `npm run test:unit`, `npm run test:browser`, and
      `npm run build` pass.

**Done when:** The production static site is installable and a previously
loaded planner remains functional offline without any server-side state.
