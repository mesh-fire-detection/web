The site's job is to convert skeptics into builders. That means the number and the map do the persuading, not the prose.

## Lead with the cost delta

An ALERTWildfire camera install runs $10–20k. Your Base node is $55. That ratio is the entire pitch and it should be the first thing on screen — a two-column comparison, not a paragraph. Everything below it exists to make that number believable.

## Live node map

Three real nodes in the Cascade foothills beat fifty pages of design docs. Show node type, last heartbeat, battery, and the RSSI/SNR of each link between them. When a node dies, show it dead. The willingness to display your own failures is what separates this from every vaporware hardware site.

MapLibre + Protomaps keeps tile costs at zero, which is on-brand.

## BOM as a live artifact, not a PDF

One table per node type: part, supplier link, current price, running total. A person should be able to go from landing page to filled cart in ten minutes. Host the enclosure STLs directly and the Meshtastic config presets as downloadable JSON. If someone has to ask you a question to build a node, the page failed.

## Coverage calculator

Input a lat/long and antenna height, get back a link-budget viewshed over real terrain (SRTM + Longley-Rice). This answers the only question a potential deployer actually has: *would this work where I live?* Same math serves Vision node placement — a camera viewshed is a propagation viewshed with different constants. Meshtastic Site Planner and Splat! are prior art you can lean on rather than build from scratch.

## Publish the open problems

Unusual, and I'd push hard for it. A page per unsolved piece — roadless delivery, no-critical-node topology, sensor selection, false-positive rate on cheap vision — each with constraints, what's been tried, current best candidate. Hiding unknowns gets you spectators. Publishing them gets you collaborators, and you have four already written.

## The false-positive page

Every cheap fire detection project dies on false positives. Dust, fog, morning mist, a neighbor's burn pile. A site that publishes measured FP/FN rates, or honestly states "unmeasured, here's the test plan," is the one a fire district will take a meeting about. Pair it with an explicit alerting model: who receives an alert, through what channel, and a clear disclaimer that this is not a 911 replacement.

## What to skip

No forum — use GitHub Discussions, where the people who would answer already are. No donate button until a node has survived a winter outdoors. No manifesto above the fold. And no detection-time claims you haven't measured; a specific unbacked number is the fastest way to lose the agency people you need.

## One gap in the plan itself

Goal 1 is "reduce detection time" with no baseline anywhere. Reduce from what? Without a measured current detection latency for a specific region — pick a Washington district and get the real number — that claim is unfalsifiable, and it's the claim the whole site rests on. The "problem, quantified" section should be the second thing you write, right after the map.

Who's the primary reader: someone who'd build and deploy nodes themselves, or an agency/land trust you want to fund a deployment? The site changes shape considerably depending on which.
