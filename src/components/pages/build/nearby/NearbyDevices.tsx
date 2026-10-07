import { useRef } from 'react'

import { Page } from '@components/layout/Page'
import { DeviceDetails } from '@components/pages/build/nearby/DeviceDetails'
import { DeviceList } from '@components/pages/build/nearby/DeviceList'
import { useNearbyDevices } from '@components/pages/build/nearby/useNearbyDevices'
import { ExternalLink } from '@components/shared/navigation/ExternalLink'
import { Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Callout } from '@components/shared/widgets/Callout'
import { Icon } from '@components/shared/widgets/Icon'
import { nearbyDevicesContent as copy } from '@core/content/build/nearby/nearbyDevices'
import { cx } from '@core/format/cx'
import { deviceName, TRANSPORTS } from '@core/nearby/model'

/** In the one-column layout the details sit below every card, out of view. */
function revealDetails(workspace: HTMLElement | null, details: HTMLElement | null) {
    if (!workspace || !details) return
    const stacked =
        details.getBoundingClientRect().left - workspace.getBoundingClientRect().left < 1
    if (stacked) details.scrollIntoView({ block: 'start' })
}

export function NearbyDevicesPage() {
    const { session, snapshot, support } = useNearbyDevices()
    const workspaceRef = useRef<HTMLDivElement>(null)
    const detailsRef = useRef<HTMLDivElement>(null)
    const selected = snapshot.devices.find((device) => device.id === snapshot.selectedId)
    const noSupport = TRANSPORTS.every((transport) => support[transport] !== 'available')
    return (
        <Page
            title={copy.title}
            eyebrow={copy.eyebrow}
            lede={copy.lede}
            aside={
                <Stack gap={3}>
                    <Row gap={3} align='start'>
                        {TRANSPORTS.map((transport) => {
                            const availability = support[transport]
                            return (
                                <div key={transport} className='nearby_add'>
                                    <Button
                                        variant='secondary'
                                        className={
                                            transport === 'usb'
                                                ? 'nearby_add_usb'
                                                : 'nearby_add_bluetooth'
                                        }
                                        iconBefore={<Icon name={transport} />}
                                        label={copy.add[transport]}
                                        disabled={availability !== 'available' || snapshot.busy}
                                        onClick={() => {
                                            void session.add(transport)
                                        }}
                                    >
                                        {copy.transports[transport]}
                                    </Button>
                                    {availability === 'available' || noSupport ? null : (
                                        <Text size='xs' tone='faint'>
                                            {copy.support[availability]}
                                        </Text>
                                    )}
                                </div>
                            )
                        })}
                    </Row>
                    {noSupport ? (
                        <Callout title={copy.noSupport.title} tone='warn'>
                            {support.bluetooth === 'insecure'
                                ? copy.noSupport.insecure
                                : copy.noSupport.unsupported}{' '}
                            <ExternalLink href={copy.noSupport.href}>
                                {copy.noSupport.link}
                            </ExternalLink>
                        </Callout>
                    ) : null}
                    {snapshot.error ? (
                        <div role='alert'>
                            <Callout title={copy.errorTitle} tone='warn'>
                                {copy.errors[snapshot.error]}
                            </Callout>
                        </div>
                    ) : null}
                    <Text mono size='xs' tone='faint'>
                        {snapshot.devices.length} added ·{' '}
                        {snapshot.devices.filter((device) => device.state === 'connected').length}{' '}
                        connected
                    </Text>
                    <Stack gap={1}>
                        {copy.helper.map((line) => (
                            <Text key={line} size='sm' tone='muted'>
                                {line}
                            </Text>
                        ))}
                    </Stack>
                </Stack>
            }
        >
            <Section space='sm' bordered>
                <Stack gap={5}>
                    <div role='status' aria-live='polite' className='nearby_announcement'>
                        {snapshot.announcement === null
                            ? null
                            : copy.announcements[snapshot.announcement]}
                    </div>
                    <Heading level={2} size='lg'>
                        {copy.devicesTitle}
                    </Heading>
                    {snapshot.removed ? (
                        <Row gap={3} wrap={false}>
                            <Text size='sm' tone='muted' className='nearby_line'>
                                {copy.announcements.removed} ·{' '}
                                {deviceName(snapshot.removed) || copy.unnamed}
                            </Text>
                            <Button
                                size='sm'
                                variant='secondary'
                                onClick={() => {
                                    session.undoRemove()
                                }}
                            >
                                {copy.actions.undo}
                            </Button>
                        </Row>
                    ) : null}
                    <div
                        ref={workspaceRef}
                        className={cx(
                            'nearby_workspace',
                            snapshot.devices.length === 0 && 'nearby_workspace_empty'
                        )}
                    >
                        <DeviceList
                            snapshot={snapshot}
                            session={session}
                            canConnect={{
                                bluetooth: support.bluetooth === 'available',
                                usb: support.usb === 'available',
                            }}
                            onSelect={(id) => {
                                session.select(id)
                                requestAnimationFrame(() => {
                                    revealDetails(workspaceRef.current, detailsRef.current)
                                })
                            }}
                        />
                        {selected ? (
                            <div ref={detailsRef} className='nearby_details'>
                                <DeviceDetails device={selected} />
                            </div>
                        ) : null}
                    </div>
                </Stack>
            </Section>
        </Page>
    )
}
