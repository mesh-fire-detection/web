# Mesh Fire Detection

An open-source, non-commercial experimental research network for early wildfire detection. A Base node's estimated parts cost is about $55 before shipping and tax, which lets us explore ground coverage in places a $10–20k camera installation cannot reach.

No products or services are currently offered for sale.

This is not an emergency service. The network does not call 911 and does not replace a dispatch desk. A person looks at the frame or the sensor trace and decides whether to call it in.

## Why it exists

Wildfire detection fails on the cost of coverage, not on the algorithm. A typical ALERTWildfire camera install runs $10–20k. One fourteen-node Mesh Fire Detection branch is about $1,200 of hardware. That two-order-of-magnitude gap is the entire argument.

Three goals, scored honestly:

1. **Reduce detection time.** The headline goal, and the one we cannot yet defend. There is no measured baseline of “ignition to first dispatched unit” for a named district. Without that number the goal is unfalsifiable.
2. **Radically reduce the cost of detection.** Met at the unit level: an estimated parts cost of ~$55 for a Base node against ~$15,000 for a camera installation. Unproven is whether nodes at this parts cost detect anything useful.
3. **Maximise the area covered.** Cheap units only matter if they actually reach roadless ridges. The constraint today is delivery, not money.

The site and this document are written for people who would build and deploy a node themselves. Agencies and land trusts are the second audience: they need a false-positive rate, an alerting model, and a clear disclaimer.

## How the network is built

Radio is LoRa 915 MHz (US915) on Meshtastic. Nodes are RAKwireless WisBlock, powered by a small solar panel and a protected 21700 cell (3450 mAh).

A branch starts at a **Cellular** node (LTE backhaul) and runs as a chain of **Base** nodes. **Sensor** and **Vision** nodes attach where they are useful for detection, not where the topology needs them.

| Type | Role | Estimated parts cost | On top of Base |
| --- | --- | ---: | --- |
| **Base** | Carries the mesh; strongest LoRa signal | ~$55 | WisBlock Meshtastic Starter Kit, panel, 915 MHz whip, 21700, printed IP65 enclosure |
| **Cellular** | One per branch; reaches the internet | ~$147 | RAK13102 NoteCarrier + NoteCard, LTE antenna |
| **Sensor** | Samples particulate matter at ground level | ~$113 + power interface | SPS30 (current candidate), BME688 and a 5 V sensor interface |
| **Vision** | Sees smoke | ~$99 | ESP32-S3 with camera, on-device classifier ~1 frame/min, second cell and panel |

A Base node is five parts, no soldering, about 25 minutes. Every other type is a Base plus add-ons. Smoke-sensor selection is not closed: SPS30 is the current best candidate, not a recommendation.

Today’s topology is a simple chain. That is deliberately fragile: if an intermediate Base dies, everything behind it is orphaned. The candidate replacement is a ladder — paired Base nodes on facing ridges with cross-links. Roughly +40% Base nodes, no extra Cellular. Unsimulated against real terrain.

Placement rules:

- Get the antenna high, then get it vertical. Height buys more link budget than any part on the bill of materials.
- Ridge to ridge, not ridge to valley.
- Point Vision nodes across a drainage at the valley floor, not at the next ridge.
- Never make one node the only parent of everything behind it.

## What a node detects

Two independent channels, both cheap, both unproven:

- **Sensor.** Particulate (PM2.5) plus gas/humidity to tell smoke from fog. It only earns its place if it alerts before a camera would on the same fire.
- **Vision.** A ridge-mounted camera with on-device inference. The alert carries the frame, not a label. Other frames are discarded on the node. Cameras point at terrain, not at homes, roads, or trailheads.

Alerts are opt-in by area: push and email, both carrying the frame or sensor trace. The subscriber list is never shared with an agency the subscriber has not asked for in writing. The network never contacts emergency services itself.

## This repository

The project’s marketing and documentation site: React 19, TypeScript, Vite, MapLibre. The job is to convert skeptics into builders. The number and the map do the persuading, not the manifesto.

Pages:

- **Home** — cost comparison, branch map, refusal to print an unbacked detection-time figure.
- **Map** — node type, last heartbeat, battery, RSSI/SNR of every link. Dead nodes stay on the map, coloured red.
- **Build** — BOM with supplier links, enclosure STLs, Meshtastic JSON presets, assembly.
- **Coverage** — link-budget calculator (FSPL, clutter, 4/3-earth radio horizon, Fresnel zone). No elevation model: it cannot see the ridge between two points. For that, use Meshtastic Site Planner or Splat!.
- **Open Problems** — what is unsolved, with constraints, what has been tried, and what would close it.
- **About** — goals, roadmap, licenses, privacy.

Network state lives in `src/data/network.ts` and is currently sample data: the fourteen nodes of the planned Rattlesnake Ridge branch (Cascade foothills, Washington). Nothing here is in the field yet. When a live feed exists, flipping `SOURCE.kind` drops the sample banner from every page at once.

The map draws node geometry on a blank dark canvas — no tiles, no API key. A basemap can be enabled with `VITE_BASEMAP_STYLE`.

## Open problems

Five of them. Hiding unknowns gets spectators. Publishing them gets collaborators.

1. **No detection-time baseline.** Need a median of ignition → first dispatched unit for one named Washington district over five years, with the raw records alongside. A public-records request is drafted, not filed.
2. **Roadless delivery.** A node with its mast weighs under 500 g / 1.1 lb. Carrying it in on foot works, and does not scale past a day hike from a trailhead. Drone drop stalls on the mast and on beyond-line-of-sight flight.
3. **No node should be critical.** The chain already shows the failure on the map (Mailbox Spur took Mailbox Bowl with it). Ladder topology is a candidate, not a result.
4. **Cheap smoke sensing.** Sensing head under $60, five years outdoors with no cleaning, powered by one 21700 and one small panel. MQ-series heaters blow the power budget. SPS30 needs a 5 V interface and custom firmware; whether ground-level PM rises early enough on a real fire is untested.
5. **False positives.** Fog, dust, morning mist, a neighbour’s burn pile. No measured FP/FN rate. Plan: ninety days of continuous capture from two Vision nodes through fog season, hand-labelled, confusion matrix and raw frames published.

A problem closes only against the criterion on its card, not against a feeling.

## Where the project is

Done: one branch designed end to end — fourteen positions along Rattlesnake Ridge, a link budget for every hop. The map shows the plan, not the field.

Next, in order:

1. A node that survives a winter (still reporting in March).
2. A published detection-time baseline.
3. Ninety days of labelled Vision frames.
4. Ladder topology in the field: kill one node on purpose and show the branch still reaches the internet.
5. A second branch, built by someone else from this site, without asking the authors anything.

Node positions are published deliberately: public land, or land whose owner agreed in writing. No analytics, no cookies, no third-party scripts.

## Licenses and how to help

Hardware, enclosures, and documentation are [CERN-OHL-S v2](https://cern-ohl.web.cern.ch/) (strongly reciprocal: improve a shell and the improvement comes back). Firmware and this site are [MIT](https://opensource.org/license/mit).

The next useful thing is not a donation or a mailing list. It is a node that makes it to March. Build from `/build`: supplier-linked parts list, firmware presets, enclosure. If you have to ask a question to finish a node, that is a bug in the site.

- Repository: https://github.com/mesh-fire-detection
- Discussions: https://github.com/orgs/mesh-fire-detection/discussions/
- Discord: https://discord.gg/mesh-fire-detection
- Contact: contact@meshfiredetection.org

The GitHub, Discord, and email URLs in `src/data/site.ts` are placeholders and should be replaced before launch.
