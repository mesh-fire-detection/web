# Changelog

Notable changes to the web application are recorded here by version.

## 0.1.2 — Unreleased

### Added

- Satellite receiver page with connection, receiver controls, packet history,
  tracking, and range results.
- UI kit gallery at `/design` with interactive component examples.

### Changed

- Satellite controls use shared UI kit components, and the contribution rules
  require shared UI contracts for interface work.
- Coverage calculations are hidden while a numeric input is empty.

### Fixed

- Keyboard focus remains visible on fields with validation errors.
- Scrollable tables in blog articles have an accessible label.

## 0.1.1

### Added

- Metric and imperial unit preferences for distances and lengths.
- A dual-vendor parts catalogue for bill-of-materials cost estimates.
- Real page shells for known routes, plus sitemap and robots generation.

### Changed

- Internal navigation uses native links, with header navigation derived from the
  shared route configuration.
- Updated Base node cost and parts documentation.

### Fixed

- Improved keyboard focus handling in the navigation drawer.
- Corrected the bill-of-materials table footer and interactive pointer cursors.
- Ignored transient MapLibre source errors.
