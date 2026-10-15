# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.9] - 2026-10-15

### Fixed
- **Host Settings Modernization (DSH 0.2.0+):** Replaced dead `settings.register` branch in `lib/index.js` with DSH 0.2.0+ standard `settings.configure({ auto: false }, ctx.fiber)` and `settings.describe().find((row) => row.ns === name)` for live configuration lookup (#29).
- **Volatile Reference Unwrapping:** Added `plainConfig` and `resolveConfig` helpers to reliably unwrap `VolatileRef` boxes, functions, and nested structures mutated by the DSH loader (#29).
- **Reactive Settings Events:** Subscribed to `settings/document-updated` alongside `loader/volatile-update` and `internal/update` with clean lifecycle disposal via `sctx.effect` (#29).

### Added
- **Design Contract:** Added ADR-007 to `docs/design/DESIGN.md`.
- **Unit Tests:** Added regression tests in `test/session-search.test.mjs` and `test/identity.test.mjs` verifying `plainConfig`, `settings.configure`, `settings.describe`, and elimination of `settings.register`.

## [0.1.8] - 2026-10-09

### Fixed
- **Settings Service Namespace (DSH Desktop Crash-Fix):** Scoped settings registration in `lib/index.js` uses short namespace `dsh-session-search` matching `/^[a-z][a-z0-9-]*$/` regex and is guarded with `try / catch` to eliminate startup `TypeError` on DSH Desktop (#26).
- **Modern Settings Runtime (`configForms`):** Client settings card migrated from deprecated `ctx.settingsScope` to modern `ctx.configForms` service with live snapshot subscription and graceful fallback (#21, #23).
- **Save Validation & Feedback:** Client now detects unavailable settings scope and presents clear error diagnostics instead of falsely displaying success when scope is unavailable (#23).
- **Style Ownership Attribute:** Updated `data-dsh-plugin` attribute on injected `<style>` tag to short plugin ID `dsh-session-search` (#25).
- **Volatile Config Updates:** Subscribed to `loader/volatile-update` events in host runtime for immediate configuration synchronization without process restart (#22).

### Added
- **Documentation:** Added `CHANGELOG.md` to repository root and npm package files allowlist (#24).
- **Design Contract:** Added ADR-006 to `docs/design/DESIGN.md`.

## [0.1.7] - 2026-09-27

### Fixed
- **Cordis Service Injection:** Declared explicit `exports.inject = ['slots', 'locale', 'configForms']` in `lib/client.js` to ensure dependency resolution precedes module execution and prevents cascading pending states in `dsh-client-ui-conversation` (#19).

## [0.1.6] - 2026-09-26

### Added
- **Settings Surface:** Native settings card in DSH Web UI (`lib/client.js`) for `maxResults`, `snippetLength`, and `timeoutMs` (#16).
- **Host Settings Synchronization:** Dynamic live settings reading in `lib/index.js` (#16).

### Changed
- **Package Allowlist:** Excluded test suite from npm package distribution (#15).
- **Updater Policy:** Declared clear DSH CLI updater policy in UI and docs (#17).

## [0.1.5] - 2026-09-24

### Fixed
- **Lifecycle & Disposer:** Wrapped tool registration in `ctx.effect` (#11).
- **Query Validation:** Enforced strict non-empty query validation (#12).
- **Result Enrichment:** Added date formatting to search results and snippet length controls (#13).

## [0.1.4] - 2026-09-17

### Added
- Initial public release of `@goodandready/dsh-session-search` with core SQLite FTS5 integration.
