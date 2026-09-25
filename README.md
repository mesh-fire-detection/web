# Mesh Fire Detection

Marketing and documentation site for an open wildfire-detection mesh network
(React 19 + TypeScript + Vite).

Code layout and contribution rules live in [`AGENTS.md`](AGENTS.md).

## Requirements

- Node.js 24+ (see `.nvmrc` and `package.json` `engines`)

## Setup

```bash
npm install
cp config/.env.example .env   # optional; edit as needed
npm run dev            # http://localhost:5173
```

```bash
npm run check          # types + lint + tests + production build
npm run build          # Vite bundle only → dist/
npm run preview        # serve the production build
```

## Environment

| Variable             | Purpose                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| `VITE_BASEMAP_STYLE` | MapLibre style URL. Unset = blank dark canvas (no tiles, no API key).    |
| `BASE_PATH`          | Vite `base` for GitHub Pages project sites (`/repo`). Local default `/`. |

Copy [`config/.env.example`](config/.env.example). Do not commit secrets.

Before publishing, confirm community URLs in [`src/core/config/site.ts`](src/core/config/site.ts)
(`SITE.github`, `SITE.discussions`, `SITE.contact`). `SITE.url` is the public site root used
for absolute `sitemap.xml` / `robots.txt` URLs — set it to the custom domain or to
`https://org.github.io/repo`, and do not fold `BASE_PATH` into those URLs.

## Map basemap

By default the map draws nodes on a blank dark canvas. To add terrain:

```bash
VITE_BASEMAP_STYLE="https://your-protomaps-or-maptiler-style.json" npm run dev
```

MapLibre loads lazily (`LazyNetworkMap`), so pages without a map do not download it.

## Swapping in live network data

Network state lives in [`src/core/content/network/network.ts`](src/core/content/network/network.ts).

- `SOURCE.kind` is `'sample'`. Flip it to `'live'` and the sample-data banner
  disappears site-wide.
- `NODES` and `LINKS` match the intended feed shape; replace them (or fetch
  `SOURCE.endpoint`) without touching page components.
- The footer counter and map status metrics all derive from `NODES`.

## Coverage calculator

[`src/core/map/linkBudget.ts`](src/core/map/linkBudget.ts) models free-space
path loss, clutter, radio horizon, Fresnel radius, and max range. It has **no
elevation model** — it cannot see a ridge between two points, and the Coverage
page says so. For terrain-aware planning, use Meshtastic Site Planner or Splat!.

## Things the site deliberately does not claim

- No detection-time figure (unmeasured; the site says so).
- No false-positive rate (test plan published instead).
- STL files marked “not published yet” rather than dead download links.
- “Not an emergency service” in the footer on every page.
