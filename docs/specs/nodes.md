# Nodes

Status: implemented at `/nodes` and `/nodes/:id`. Tracks web#5; the decisions
behind it are backend#11, backend#15 and backend `docs/plans/nodes.md`.

## Who sees it

Signed-in people only. Signed out, both routes send the person to sign in,
which says **That page is for members. Sign in to see it.**, and bring them
back afterwards with their filters intact. The anonymous view of the network
is the map, which stays open.

Every signed-in person sees every registered node. Disabled nodes appear only
for the people on them and admins, because the API leaves them out for anyone
else. A person sees **Yours** on their own. Only the people on a node and
admins see who else is on it, in **Owners** on the node page, by display name;
nobody else sees names or counts, and no email or account ID appears.

## Positions

The pages show the position the API gives and take none from anywhere else.
That is the centre of a cell about 1 km across, marked **about**, unless the
node is yours or its people chose to show it exactly. The node page says so
under the facts.

## The list, `/nodes`

- Columns: node (name, ID and position), type, status, battery, last heard.
  Every column sorts; status puts offline first, and last heard pressed twice
  puts the quietest first, never-heard nodes before all others.
- Filters: **Show** (all or yours), **Type**, **Status**, and a search over ID
  and name. Filters and sort live in the URL (`mine=1`, `type`, `status`, `q`,
  `sort`, `dir=desc`), so a view survives a reload and can be shared. Changes
  replace the history entry rather than adding one.
- **View these nodes on the map** links to `/map?nodes=<id>,<id>` with the rows
  the filters left, skipping any without a position. `/map` does not read this
  parameter yet, so for now the link opens the whole map.
- Empty states: nothing registered, none of yours (both point at `/connect`),
  and no matches (offers **Clear filters**).

## One node, `/nodes/:id`

- **Use**: **Live in the field** (heard, not offline), **Quiet** (heard before,
  now offline) or **Not in use** (never heard, or disabled), with **Yours** and
  **Disabled** marks. It says so if this browser has connected the node before.
- **View on map** links to `/map?nodes=<id>` when the node has a position.
  **Open in Connect**, for the people on the node, opens `/connect` as it is.
- Identity, none of it typed in: mesh ID, type, hardware, firmware, build, last
  heard and network status.
- `/connect`'s own components filled from the server (`serverNode.ts`): battery
  and charging, sensor grid, statistics for the selected metric, the sensor
  guide, other telemetry and, for the node's people, sensor status and the
  firmware update guide. They read the last 7 days, or a shorter range if that
  would be cut off. Signal and nearest nodes stay on `/connect`: the API has no
  per-node neighbours yet. Live connections never appear here.
- **Deployment record**: recorded position, elevation, antenna height and
  deployment date. These are typed in to keep track of a node while deploying
  it, and the page says they are not a GPS reading. What the node reports of
  itself is shown apart, in **Details**.
- **More details**, closed until asked for, as on `/connect`: other telemetry
  from the server, then the short name, last connection, settings and activity
  this browser saved, if it has connected the node. The server keeps none of those.
- **Owners**, for the people on the node and admins: display names and when each
  added the node. Anyone who connects a node can add it to their account, so an
  owner here means someone who has reached the node, not someone verified.
- **Details**, for the people on the node and admins: exact recorded position
  and elevation, whether members see it exactly, hardware ID, note, the node's
  last report of itself, and when it was registered.
- **Edit node**, for the same people: name and type, the deployment record, the
  exact-position opt-in, and a note. Fields the server would refuse are named
  before anything is sent. Firmware cannot be edited: it is recorded from what a
  connected node reports. The mesh ID and enabling are admin-only and not on
  this page yet.
- An unknown node and one the person may not see look the same: **Node not
  found**.

## Not yet

- A deployment tool for entering the deployment record in the field.
- Showing whether a node is attached to this computer right now.
- Hiding a node (backend#12, later).
- Admin controls for the mesh ID and enabling.
- Units: the edit form takes metres whatever the unit setting.
