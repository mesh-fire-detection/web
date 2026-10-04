import { Page } from '@components/layout/Page'
import { DeviceDetails } from '@components/pages/build/nearby/DeviceDetails'
import { DeviceList } from '@components/pages/build/nearby/DeviceList'
import { useNearbyDevices } from '@components/pages/build/nearby/useNearbyDevices'
import { Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Callout } from '@components/shared/widgets/Callout'
import { nearbyDevicesContent as copy } from '@core/content/build/nearby/nearbyDevices'
import { cx } from '@core/format/cx'

export function NearbyDevicesPage() {
    const { session, snapshot, support } = useNearbyDevices()
    const selected = snapshot.devices.find((device) => device.id === snapshot.selectedId)
    return (
        <Page
            title={copy.title}
            eyebrow={copy.eyebrow}
            lede={copy.lede}
            aside={
                <Stack gap={3}>
                    <Row gap={4}>
                        <Button
                            disabled={support !== 'available' || snapshot.busy}
                            onClick={() => {
                                void session.add()
                            }}
                        >
                            {copy.add}
                        </Button>
                        <Text mono size='xs' tone='faint'>
                            {snapshot.devices.length} added ·{' '}
                            {
                                snapshot.devices.filter((device) => device.state === 'connected')
                                    .length
                            }{' '}
                            connected
                        </Text>
                    </Row>
                    <Text size='sm' tone='muted'>
                        {copy.helper}
                    </Text>
                </Stack>
            }
        >
            <Section space='sm' bordered>
                <Stack gap={5}>
                    <div role='status' aria-live='polite' className='nearby_announcement'>
                        {snapshot.announcement}
                    </div>
                    {support === 'available' ? null : (
                        <Callout title={copy.unsupportedTitle} tone='warn'>
                            {copy.support[support]}
                        </Callout>
                    )}
                    {snapshot.error ? (
                        <div role='alert'>
                            <Callout title={copy.errorTitle} tone='warn'>
                                {copy.errors[snapshot.error]}
                            </Callout>
                        </div>
                    ) : null}
                    <Text size='xs' tone='faint'>
                        {copy.sessionNote}
                    </Text>
                    <Heading level={2} size='lg'>
                        {copy.devicesTitle}
                    </Heading>
                    <div
                        className={cx(
                            'nearby_workspace',
                            snapshot.devices.length === 0 && 'nearby_workspace_empty'
                        )}
                    >
                        <DeviceList
                            snapshot={snapshot}
                            session={session}
                            canConnect={support === 'available'}
                        />
                        {selected ? <DeviceDetails device={selected} /> : null}
                    </div>
                </Stack>
            </Section>
        </Page>
    )
}
