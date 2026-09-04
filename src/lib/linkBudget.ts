/**
 * Link budget for 915 MHz LoRa.
 *
 * This is free-space path loss plus a distance-proportional clutter term, and a
 * 4/3-earth radio horizon. It is a first-order answer, good enough to tell you
 * whether a site is obviously fine or obviously hopeless. It is NOT a
 * terrain-aware viewshed — there is no elevation model behind it, so it cannot
 * see the ridge between two points. For that, use Meshtastic Site Planner or
 * Splat!, both linked from the Coverage page.
 */

export type Preset = 'short-fast' | 'medium-fast' | 'long-fast' | 'long-slow'
export type Terrain = 'open' | 'light-forest' | 'dense-forest' | 'built-up'

export interface PresetSpec {
  id: Preset
  label: string
  spreadingFactor: number
  bandwidthKHz: number
  /** Typical SX1262 sensitivity, dBm. */
  sensitivityDbm: number
  /** Rough airtime for a 40-byte payload, ms. */
  airtimeMs: number
}

export const PRESETS: readonly PresetSpec[] = [
  { id: 'short-fast', label: 'Short / Fast', spreadingFactor: 7, bandwidthKHz: 250, sensitivityDbm: -123, airtimeMs: 62 },
  { id: 'medium-fast', label: 'Medium / Fast', spreadingFactor: 9, bandwidthKHz: 250, sensitivityDbm: -129, airtimeMs: 226 },
  { id: 'long-fast', label: 'Long / Fast', spreadingFactor: 11, bandwidthKHz: 250, sensitivityDbm: -133, airtimeMs: 890 },
  { id: 'long-slow', label: 'Long / Slow', spreadingFactor: 12, bandwidthKHz: 125, sensitivityDbm: -137, airtimeMs: 3610 },
]

export interface TerrainSpec {
  id: Terrain
  label: string
  /** Excess loss above free space, dB per km. */
  excessDbPerKm: number
  note: string
}

export const TERRAINS: readonly TerrainSpec[] = [
  { id: 'open', label: 'Open / ridge to ridge', excessDbPerKm: 0, note: 'Clear line of sight, nothing in the first Fresnel zone.' },
  { id: 'light-forest', label: 'Light forest', excessDbPerKm: 2.5, note: 'Antennas above canopy, path clips treetops.' },
  { id: 'dense-forest', label: 'Dense forest', excessDbPerKm: 5, note: 'Path runs through standing timber. The Cascade default.' },
  { id: 'built-up', label: 'Built-up', excessDbPerKm: 8, note: 'Structures in the path. Rare for this network.' },
]

export interface LinkInput {
  distanceKm: number
  txHeightM: number
  rxHeightM: number
  txPowerDbm: number
  txGainDbi: number
  rxGainDbi: number
  cableLossDb: number
  frequencyMhz: number
  preset: Preset
  terrain: Terrain
  /** Headroom held back for rain, foliage growth and component drift. */
  fadeMarginDb: number
}

export interface LinkResult {
  fsplDb: number
  excessLossDb: number
  totalLossDb: number
  receivedDbm: number
  sensitivityDbm: number
  /** Received power above sensitivity, before the fade margin is applied. */
  marginDb: number
  /** True when margin clears the requested fade margin AND the path is inside the horizon. */
  closes: boolean
  radioHorizonKm: number
  beyondHorizon: boolean
  /** First Fresnel zone radius at mid-path, metres. */
  fresnelRadiusM: number
  /** Longest distance at which the link still closes, km. */
  maxRangeKm: number
  verdict: 'strong' | 'workable' | 'marginal' | 'no-link'
}

export const DEFAULT_LINK: LinkInput = {
  distanceKm: 3,
  txHeightM: 8,
  rxHeightM: 8,
  txPowerDbm: 22,
  txGainDbi: 2.15,
  rxGainDbi: 2.15,
  cableLossDb: 0.5,
  frequencyMhz: 915,
  preset: 'long-fast',
  terrain: 'dense-forest',
  fadeMarginDb: 10,
}

function presetSpec(id: Preset): PresetSpec {
  return PRESETS.find((preset) => preset.id === id) ?? PRESETS[2]!
}

function terrainSpec(id: Terrain): TerrainSpec {
  return TERRAINS.find((terrain) => terrain.id === id) ?? TERRAINS[2]!
}

/** Free-space path loss in dB. Distance in km, frequency in MHz. */
export function fspl(distanceKm: number, frequencyMhz: number): number {
  if (distanceKm <= 0) return 0
  return 20 * Math.log10(distanceKm) + 20 * Math.log10(frequencyMhz) + 32.44
}

/** 4/3-earth radio horizon between two antenna heights, km. */
export function radioHorizonKm(txHeightM: number, rxHeightM: number): number {
  return 4.12 * (Math.sqrt(Math.max(txHeightM, 0)) + Math.sqrt(Math.max(rxHeightM, 0)))
}

/** First Fresnel zone radius at mid-path, metres. */
export function fresnelRadiusM(distanceKm: number, frequencyMhz: number): number {
  if (distanceKm <= 0) return 0
  const frequencyGhz = frequencyMhz / 1000
  const half = distanceKm / 2
  return 17.31 * Math.sqrt((half * half) / (frequencyGhz * distanceKm))
}

function receivedAt(distanceKm: number, input: LinkInput): number {
  const loss = fspl(distanceKm, input.frequencyMhz) + terrainSpec(input.terrain).excessDbPerKm * distanceKm
  return input.txPowerDbm + input.txGainDbi + input.rxGainDbi - input.cableLossDb - loss
}

/** Longest distance where received power still clears sensitivity + fade margin. */
function solveMaxRange(input: LinkInput): number {
  const target = presetSpec(input.preset).sensitivityDbm + input.fadeMarginDb
  const horizon = radioHorizonKm(input.txHeightM, input.rxHeightM)

  if (receivedAt(0.05, input) < target) return 0

  let low = 0.05
  let high = 200
  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2
    if (receivedAt(mid, input) >= target) low = mid
    else high = mid
  }
  return Math.min(low, horizon)
}

export function computeLink(input: LinkInput): LinkResult {
  const preset = presetSpec(input.preset)
  const terrain = terrainSpec(input.terrain)
  const distance = Math.max(input.distanceKm, 0.01)

  const fsplDb = fspl(distance, input.frequencyMhz)
  const excessLossDb = terrain.excessDbPerKm * distance
  const totalLossDb = fsplDb + excessLossDb + input.cableLossDb
  const receivedDbm = input.txPowerDbm + input.txGainDbi + input.rxGainDbi - totalLossDb
  const marginDb = receivedDbm - preset.sensitivityDbm

  const horizon = radioHorizonKm(input.txHeightM, input.rxHeightM)
  const beyondHorizon = distance > horizon
  const closes = marginDb >= input.fadeMarginDb && !beyondHorizon

  let verdict: LinkResult['verdict']
  if (beyondHorizon || marginDb < 0) verdict = 'no-link'
  else if (marginDb < input.fadeMarginDb) verdict = 'marginal'
  else if (marginDb < input.fadeMarginDb + 10) verdict = 'workable'
  else verdict = 'strong'

  return {
    fsplDb,
    excessLossDb,
    totalLossDb,
    receivedDbm,
    sensitivityDbm: preset.sensitivityDbm,
    marginDb,
    closes,
    radioHorizonKm: horizon,
    beyondHorizon,
    fresnelRadiusM: fresnelRadiusM(distance, input.frequencyMhz),
    maxRangeKm: solveMaxRange(input),
    verdict,
  }
}

/** Nodes needed to span a corridor, given the achievable hop length. */
export function nodesForCorridor(corridorKm: number, hopKm: number): number {
  if (hopKm <= 0) return 0
  return Math.max(1, Math.ceil(corridorKm / hopKm) + 1)
}
