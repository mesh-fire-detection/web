import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { decimal } from '@core/format/format'
import type { LinkInput, LinkResult } from '@core/map/linkBudget'

const W = 600
const H = 210
const PAD_X = 34
const PAD_BOTTOM = 40
const PAD_TOP = 26

/** Earth bulge at a point along the path, metres. 4/3-earth approximation. */
function bulgeM(d1Km: number, d2Km: number): number {
  return (d1Km * d2Km) / 17
}

/**
 * Schematic path profile. Vertical scale is exaggerated and there is no terrain
 * model behind it — this shows the geometry of the earth bulge and the Fresnel
 * zone, not the actual ridge between two points.
 */
export function LinkProfile({ input, result }: { input: LinkInput; result: LinkResult }) {
  const distance = Math.max(input.distanceKm, 0.01)
  const samples = 60

  // Vertical scale: fit the tallest thing on screen, with a floor so short
  // hops do not render as a flat line.
  const peakM = Math.max(
    Math.max(input.txHeightM, input.rxHeightM) + result.fresnelRadiusM,
    bulgeM(distance / 2, distance / 2) + result.fresnelRadiusM,
    12,
  )
  const yScale = (H - PAD_TOP - PAD_BOTTOM) / (peakM * 1.12)
  const groundY = H - PAD_BOTTOM
  const xAt = (km: number) => PAD_X + (km / distance) * (W - PAD_X * 2)
  const yAt = (m: number) => groundY - m * yScale

  // Curved ground, driven by the earth bulge relative to the chord.
  const ground: string[] = []
  for (let i = 0; i <= samples; i += 1) {
    const km = (distance * i) / samples
    const sag = bulgeM(km, distance - km)
    ground.push(`${i === 0 ? 'M' : 'L'} ${xAt(km).toFixed(1)} ${yAt(-sag).toFixed(1)}`)
  }

  const txTop = yAt(input.txHeightM)
  const rxTop = yAt(input.rxHeightM)

  // First Fresnel zone as an envelope around the line of sight.
  const upper: string[] = []
  const lower: string[] = []
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples
    const km = distance * t
    const losM = input.txHeightM + (input.rxHeightM - input.txHeightM) * t
    // Fresnel radius tapers to zero at both ends.
    const radius = result.fresnelRadiusM * 2 * Math.sqrt(Math.max(t * (1 - t), 0))
    upper.push(`${i === 0 ? 'M' : 'L'} ${xAt(km).toFixed(1)} ${yAt(losM + radius).toFixed(1)}`)
    lower.unshift(`L ${xAt(km).toFixed(1)} ${yAt(losM - radius).toFixed(1)}`)
  }

  const tone =
    result.verdict === 'no-link' ? 'dead' : result.verdict === 'marginal' ? 'warn' : 'live'

  return (
    <Box tone="surface" padding={5} radius="md">
      <Stack gap={3}>
        <Row justify="between" gap={3}>
          <Text as="div" size="2xs" mono uppercase weight={600} tone="faint">
            Path geometry
          </Text>
          <Text as="div" size="2xs" mono tone="faint">
            vertical scale exaggerated
          </Text>
        </Row>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="profile"
          role="img"
          aria-label={`Path profile over ${decimal(distance)} kilometres. ${
            result.beyondHorizon ? 'Path is beyond the radio horizon.' : 'Path is within the radio horizon.'
          }`}
        >
          <defs>
            <linearGradient id="fresnel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--fire)" stopOpacity="0.09" />
              <stop offset="100%" stopColor="var(--fire)" stopOpacity="0.015" />
            </linearGradient>
            <clipPath id="above-ground">
              <rect x="0" y="0" width={W} height={groundY} />
            </clipPath>
          </defs>

          <path
            d={`${upper.join(' ')} ${lower.join(' ')} Z`}
            fill="url(#fresnel)"
            clipPath="url(#above-ground)"
            className="profile_fresnel"
          />

          <path
            d={`${ground.join(' ')} L ${xAt(distance)} ${H} L ${xAt(0)} ${H} Z`}
            className="profile_ground"
          />
          <path d={ground.join(' ')} className="profile_horizon" />

          <line x1={xAt(0)} y1={groundY} x2={xAt(0)} y2={txTop} className="profile_mast" />
          <line x1={xAt(distance)} y1={groundY} x2={xAt(distance)} y2={rxTop} className="profile_mast" />

          <line
            x1={xAt(0)}
            y1={txTop}
            x2={xAt(distance)}
            y2={rxTop}
            className={`profile_los profile_los_${tone}`}
          />

          <circle cx={xAt(0)} cy={txTop} r={4} className={`profile_node_${tone}`} />
          <circle cx={xAt(distance)} cy={rxTop} r={4} className={`profile_node_${tone}`} />

          <text x={xAt(0)} y={groundY + 18} className="profile_label" textAnchor="middle">
            {input.txHeightM} m
          </text>
          <text x={xAt(distance)} y={groundY + 18} className="profile_label" textAnchor="middle">
            {input.rxHeightM} m
          </text>
          <text x={W / 2} y={groundY + 18} className="profile_label" textAnchor="middle">
            {decimal(distance)} km
          </text>
        </svg>

        <Text size="xs" tone="muted" measure={72}>
          The shaded band is the first Fresnel zone — {decimal(result.fresnelRadiusM)} m at mid-path.
          Anything intruding into it costs you signal, and this drawing has no terrain in it. Confirm
          against a real elevation model before you climb anything.
        </Text>
      </Stack>
    </Box>
  )
}
