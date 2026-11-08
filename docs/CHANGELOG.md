# Changelog

Notable changes to the web application are recorded here by version. How
releases are cut is in [RELEASING.md](RELEASING.md). 0.1.2 was never released;
its changes ship in the first tagged release.

## Unreleased

### Added

- Satellite receiver page with connection, receiver controls, packet history,
  tracking, and range results.
- UI kit gallery at `/design` with interactive component examples.
- `/nodes`, the list of registered nodes for signed-in people, with filters
  kept in the URL, and `/nodes/:id`, where the people on a node see its
  details and edit it. Sign-in says why when a members-only page sent you.
- Nodes on your account are backed up: `/account` and `/nodes/:id` copy readings,
  connections, faults and settings saved by `/connect` to the server.

### Changed

- The site deploys when a GitHub Release is published, not on every merge to
  `main` (#21), and the footer shows which release it is.
- Satellite controls use shared UI kit components, and the contribution rules
  require shared UI contracts for interface work.
- Coverage calculations are hidden while a numeric input is empty.
- `/connect` calls what it connects nodes, as the rest of the site does, and
  labels Meshtastic's `!a1b2c3d4` the mesh ID. Saved nodes carry over.
- Adding nodes to your account registers them, and `/account` lists them with
  the ID the server gave them. `/connect` keeps each node's hardware ID and
  sends it with the type its name implies.
- About and Privacy say node positions are shown to within about a kilometre.

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
