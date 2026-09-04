# Mesh Fire Detection

Marketing and documentation site for an open wildfire-detection mesh network.
React 19 + TypeScript + Vite, built from `docs/idea.md`, `docs/idea.ext.md` and `docs/ui.md`.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # lint + typecheck, then bundle to dist/
npm run preview    # serve the production build
npm run lint       # structure rules + typecheck
npm run typecheck
```

## Layout

```
config/            vite.config.ts + tsconfig.json (root tsconfig.json is a shim
                   so editors and bare `tsc` still find it)
scripts/           check-structure.mjs — enforces the two rules below
index.html         Vite entry — must stay at the project root
public/files/      downloadable Meshtastic config presets
src/
  ui/              the primitive layer, behind an index.ts barrel
    core/          Text, Layout, Icon
    controls/      Action, Field
    display/       Badge, List, Table
  layout/          Header, Footer, Page shell, Wordmark, node counter
  components/
    common/        Callout, SectionHead, SampleDataBanner, CostComparison
    build/         BomTable, DownloadList, AssemblySteps, NodeTypeGrid
    network/       NetworkMap, NodePanel, MapLegend, NodeTable
    coverage/      CoverageCalculator, LinkProfile
    problems/      ProblemCard, FalsePositivePanel
  pages/           one file per route
  data/            network, bill of materials, open problems, site config
  lib/             pure logic — link budget, formatters, map geo + style
  styles/          every stylesheet in the project
```

## Two structure rules, enforced

`npm run lint` runs `scripts/check-structure.mjs` before the typecheck, and
`npm run build` runs `npm run lint` first, so neither rule can rot:

1. **No directory holds more than 7 files.** Subdirectories do not count toward
   the limit, so the fix is always to group, never to delete. The project root
   is exempt — npm and tooling own it.
2. **No stylesheet sits beside a `.tsx` file.** All CSS lives in `src/styles/`
   and is imported once from `src/main.tsx`, which also makes the cascade order
   explicit instead of dependent on module resolution order.

Both are directory-level rules, which is why they are a script rather than an
ESLint rule — ESLint reasons about one file's AST at a time. The limit and the
style directory are constants at the top of the script.

The one deliberate exception is `maplibre-gl/dist/maplibre-gl.css`, imported
inside `NetworkMap.tsx` so that 70 kB of vendor CSS stays in the lazily loaded
map chunk instead of the main bundle. The check only looks at files on disk, so
it does not flag vendor imports.

Tune the limit in `scripts/check-structure.mjs`:

```js
const CONFIG = {
  roots: ['src', 'scripts', 'config'],
  maxFilesPerDir: 7,
  styleDir: join('src', 'styles'),
  ...
}
```

## Importing primitives

Everything in `src/ui/` is re-exported from `src/ui/index.ts`, so consumers
write one import and never name a subfolder:

```tsx
import { Stack, Row, Heading, Text, Button, Badge } from '@/ui'
```

That means the `core` / `controls` / `display` grouping can change without
touching a single page.

## No raw HTML outside `src/ui/`

Pages and components are composed entirely from primitives. A `grep` for `<p`,
`<span`, `<div` and friends outside `src/ui/` returns nothing:

```bash
grep -rnE '<(p|span|div|h1|ul|li|table|section|button|a)[ />]' src/pages src/components src/layout
```

The exceptions are deliberate and confined to `src/ui/`: `Canvas` forwards a ref
so maplibre has a DOM node to mount into, and `Icon` / `LinkProfile` draw SVG
geometry, which has no meaningful component substitute.

Styling is plain CSS driven by tokens in `src/styles/tokens.css` — no CSS-in-JS,
no utility framework. Primitives map props to classes.

## Swapping in real data

Everything the site presents as network state comes from `src/data/network.ts`.

- `SOURCE.kind` is `'sample'`. Flip it to `'live'` and the sample-data banner
  disappears from every page at once.
- `NODES` and `LINKS` are shaped exactly like the intended feed, so replacing
  them with a fetch from `SOURCE.endpoint` touches nothing else.
- The footer node counter and every status metric derive from `NODES`, so the
  offline count cannot drift out of sync with the map.

## Map basemap

The map renders node geometry on a blank dark canvas — no tile requests, no API
key, no bill. To put terrain underneath it, set a style URL:

```bash
VITE_BASEMAP_STYLE="https://your-protomaps-or-maptiler-style.json" npm run dev
```

Nothing else changes; the node and link layers draw on top either way. maplibre
is lazy-loaded (`LazyNetworkMap`), so pages without a map do not download it.

## Coverage calculator

`src/lib/linkBudget.ts` implements free-space path loss, a distance-proportional
clutter term, the 4/3-earth radio horizon, first Fresnel zone radius, and a
bisection solve for maximum range. It has **no elevation model** — it cannot see
the ridge between two points, and the Coverage page says so. For terrain-aware
answers, use Meshtastic Site Planner or Splat!.

## Things the site deliberately does not claim

- No detection-time figure. There is no measured baseline yet, and the site says
  "unmeasured" rather than printing a number it cannot defend.
- No false-positive rate. The test plan is published instead.
- STL files are marked "not published yet" and link to the repository rather
  than serving dead download links.
- "Not an emergency service" appears in the footer on every page.

`SITE` in `src/data/site.ts` holds the GitHub, Discord and contact URLs — these
are placeholders and want replacing before launch.
