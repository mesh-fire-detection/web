import { SITE } from '@/data/site'
import { NavHit, Row, Stack, Text } from '@/ui'

/** The mark is the network: one cellular node, two hops. */
export function Wordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
    return (
        <NavHit accessibleLabel={`${SITE.name} — home`} className='wordmark' to='/'>
            <Row gap={3} wrap={false}>
                <svg
                    aria-hidden
                    className='wordmark_mark'
                    height={size === 'lg' ? 32 : 26}
                    viewBox='0 0 28 28'
                    width={size === 'lg' ? 32 : 26}
                >
                    <path
                        d='M5 20 L14 7 L23 20'
                        fill='none'
                        opacity='0.45'
                        stroke='currentColor'
                        strokeWidth='1.4'
                    />
                    <circle className='wordmark_hot' cx='14' cy='7' r='3' />
                    <circle className='wordmark_cool' cx='5' cy='20' r='2.4' />
                    <circle className='wordmark_cool' cx='23' cy='20' r='2.4' />
                </svg>
                <Stack gap={0}>
                    <Text
                        as='span'
                        className='wordmark_name'
                        size={size === 'lg' ? 'md' : 'sm'}
                        weight={600}
                    >
                        Mesh Fire Detection
                    </Text>
                    <Text as='span' mono size='2xs' tone='faint' uppercase>
                        Open network · $70 a node
                    </Text>
                </Stack>
            </Row>
        </NavHit>
    )
}
