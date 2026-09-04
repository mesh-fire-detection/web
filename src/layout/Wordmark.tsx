import { Link } from 'react-router-dom'
import { Row, Stack, Text } from '@/ui'
import { SITE } from '@/data/site'

/** The mark is the network: one cellular node, two hops. */
export function Wordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <Link to="/" className="wordmark" aria-label={`${SITE.name} — home`}>
      <Row gap={3} wrap={false}>
        <svg className="wordmark__mark" viewBox="0 0 28 28" width={size === 'lg' ? 32 : 26} height={size === 'lg' ? 32 : 26} aria-hidden>
          <path d="M5 20 L14 7 L23 20" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
          <circle cx="14" cy="7" r="3" className="wordmark__hot" />
          <circle cx="5" cy="20" r="2.4" className="wordmark__cool" />
          <circle cx="23" cy="20" r="2.4" className="wordmark__cool" />
        </svg>
        <Stack gap={0}>
          <Text as="span" size={size === 'lg' ? 'md' : 'sm'} weight={600} className="wordmark__name">
            Mesh Fire Detection
          </Text>
          <Text as="span" size="2xs" tone="faint" mono uppercase>
            Open network · $70 a node
          </Text>
        </Stack>
      </Row>
    </Link>
  )
}
