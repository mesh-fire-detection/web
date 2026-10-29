import { useRef } from 'react'

import { toNodeReports } from '@components/account/connectedNodes'
import { MembershipPanel } from '@components/account/MembershipPanel'
import { Page } from '@components/layout/Page'
import { NodeDetails } from '@components/pages/build/nearby/NodeDetails'
import { NodeList } from '@components/pages/build/nearby/NodeList'
import { useNearbyNodes } from '@components/pages/build/nearby/useNearbyNodes'
import { ExternalLink } from '@components/shared/navigation/ExternalLink'
import { Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Callout } from '@components/shared/widgets/Callout'
import { Icon } from '@components/shared/widgets/Icon'
import { nearbyNodesContent as copy } from '@core/content/build/nearby/nearbyNodes'
import { cx } from '@core/format/cx'
import { nodeName, TRANSPORTS } from '@core/nearby/model'

/** In the one-column layout the details sit below every card, out of view. */
function revealDetails(workspace: HTMLElement | null, details: HTMLElement | null) {
    if (!workspace || !details) return
    const stacked =
        details.getBoundingClientRect().left - workspace.getBoundingClientRect().left < 1
    if (stacked) details.scrollIntoView({ block: 'start' })
}

export function NearbyNodesPage() {
    const { session, snapshot, support } = useNearbyNodes()
    const workspaceRef = useRef<HTMLDivElement>(null)
    const detailsRef = useRef<HTMLDivElement>(null)
    const selected = snapshot.nodes.find((node) => node.id === snapshot.selectedId)
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
                                        variant={transport}
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
                    <MembershipPanel nodes={toNodeReports(snapshot.nodes)} />
                    <Text mono size='xs' tone='faint'>
                        {snapshot.nodes.length} added ·{' '}
                        {snapshot.nodes.filter((node) => node.state === 'connected').length}{' '}
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
                        {copy.nodesTitle}
                    </Heading>
                    {snapshot.removed ? (
                        <Row gap={3} wrap={false}>
                            <Text size='sm' tone='muted' truncate>
                                {copy.announcements.removed} ·{' '}
                                {nodeName(snapshot.removed) || copy.unnamed}
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
                            snapshot.nodes.length === 0 && 'nearby_workspace_empty'
                        )}
                    >
                        <NodeList
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
                                <NodeDetails node={selected} />
                            </div>
                        ) : null}
                    </div>
                </Stack>
            </Section>
        </Page>
    )
}
