# Changelog

Notable changes to the web application are recorded here by version. How
releases are cut is in [RELEASING.md](RELEASING.md).

## Unreleased

## 0.3.0 — 2026-11-09

Needs backend 0.3.0 for roles, connections and the Connection path. Released
after it.

### Added

- Node roles on `/nodes`: the Type column and filter become Role, and a node
  can have several, such as Gateway and Sensor (#27). Old `?type=` links
  still work.
- On a node's page: its roles, and **Connects via**, with each connection's
  network and when it was last used (#27).
- **Connection path** on a node's page: each route its readings took to Mesh
  Fire Detection in the last 7 days, in its own card, newest first and three
  at a time (#30).
- **Nearby nodes** on a node's page, laid out as on Connect a Node, each
  linking to its page (#30).
- `RouteTrail` in the UI kit, with an example on `/design`, and a Wi-Fi
  icon (#30).

### Changed

- Every section of a node's page sits in its own tile, as on Connect a Node
  (#30).
- The header shows Map, Connect and About, with Nodes after Map for members.
  Build is left to the Build a Node button, and Connect is marked as opening
  in a new tab (#31).

## 0.2.1 — 2026-11-08

### Changed

- The header shows Map, Build and About; Coverage and Open Problems are
  linked from the footer instead (#12).
- Signed-in people see Nodes in the header (#13).

## 0.2.0 — 2026-11-08

The first tagged release. 0.1.2 was never released, and until now every merge
to `main` deployed, so most of this was already live.

### Added

- Satellite receiver page with connection, receiver controls, packet history,
  tracking, and range results.
- UI kit gallery at `/design` with interactive component examples.
- `/nodes`, the list of registered nodes for signed-in people, with filters
  kept in the URL, and `/nodes/:id`, where the people on a node see its
  details and edit it. Sign-in says why when a members-only page sent you.
- Nodes on your account are backed up: `/account` and `/nodes/:id` copy readings,
  connections, faults and settings saved by `/connect` to the server.
- `/account` shows when you joined, lets you add or remove Google, lists where
  you are signed in with a way to end any session or all of them, and lets you
  delete your account after saying what happens to your nodes.

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
