import { useState } from 'react'

import { Page } from '@components/layout/Page'
import { PacketList, RecordList } from '@components/pages/build/satellite/PacketList'
import { ModePanel } from '@components/pages/build/satellite/panels/ModePanel'
import { PassList } from '@components/pages/build/satellite/panels/PassList'
import { ProfileTable } from '@components/pages/build/satellite/panels/ProfileTable'
import { RangeResults } from '@components/pages/build/satellite/panels/RangeResults'
import { TrackerPanel } from '@components/pages/build/satellite/panels/TrackerPanel'
import { ReceiverSummary } from '@components/pages/build/satellite/ReceiverSummary'
import { useSatelliteReceiver } from '@components/pages/build/satellite/useSatelliteReceiver'
import { Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Callout } from '@components/shared/widgets/Callout'
import { Icon } from '@components/shared/widgets/Icon'
import { satelliteContent as copy } from '@core/content/build/satellite/satellite'
import { TRANSPORTS } from '@core/nearby/model'
import { dopplerCommand, minimumElevationCommand } from '@core/satellite/commands'
import {
    firmwareSupportsSatelliteControls,
    latest,
    satelliteProfiles,
} from '@core/satellite/records'

type View = 'packets' | 'records'
const VIEWS: readonly View[] = ['packets', 'records']

export function SatellitePage() {
    const receiver = useSatelliteReceiver()
    const { connection, log, support } = receiver
    const [view, setView] = useState<View>('packets')
    const connected = connection.state === 'connected'
    const supported = firmwareSupportsSatelliteControls(log)
    const status = latest(log, 'status')
    const currentMode = latest(log, 'mode')?.fields['mode'] ?? status?.fields['mode']
    const txBuild = status?.fields['tx_build'] === true
    const satelliteNames = new Map(
        satelliteProfiles(log).map((profile) => [profile.id, profile.name])
    )
    const packets = log.entries.filter((entry) => entry.type === 'pkt').length
    return (
        <Page
            title={copy.title}
            eyebrow={copy.eyebrow}
            lede={copy.lede}
            aside={
                <Stack gap={3}>
                    {connected ? (
                        <Row gap={3}>
                            <Text size='sm' tone='live' weight={600}>
                                {copy.states.connected}
                                {connection.transport
                                    ? ` · ${connection.name || copy.transports[connection.transport]}`
                                    : ''}
                            </Text>
                            <Button
                                size='sm'
                                variant='secondary'
                                onClick={() => {
                                    void receiver.disconnect()
                                }}
                            >
                                {copy.actions.disconnect}
                            </Button>
                        </Row>
                    ) : (
                        <Row gap={3} align='start'>
                            {TRANSPORTS.map((transport) => (
                                <Stack key={transport} gap={1}>
                                    <Button
                                        variant={transport}
                                        iconBefore={<Icon name={transport} />}
                                        disabled={
                                            support[transport] !== 'available' ||
                                            connection.state === 'connecting'
                                        }
                                        onClick={() => {
                                            void receiver.connect(transport)
                                        }}
                                    >
                                        {copy.connect[transport]}
                                    </Button>
                                    {support[transport] === 'available' ? null : (
                                        <Text size='xs' tone='faint'>
                                            {copy.support[support[transport]]}
                                        </Text>
                                    )}
                                </Stack>
                            ))}
                        </Row>
                    )}
                    {/* Connected is shown above, beside its Disconnect button. */}
                    <div role='status' aria-live='polite'>
                        {connected ? null : (
                            <Text mono size='xs' tone='faint'>
                                {copy.states[connection.state]}
                            </Text>
                        )}
                    </div>
                    {receiver.error ? (
                        <div role='alert'>
                            <Callout title={copy.errorTitle} tone='warn'>
                                {copy.errors[receiver.error]}
                            </Callout>
                        </div>
                    ) : null}
                    <Stack gap={1}>
                        {copy.helper.map((line) => (
                            <Text key={line} size='sm' tone='muted'>
                                {line}
                            </Text>
                        ))}
                    </Stack>
                    {connected && !supported ? (
                        <Text size='xs' tone='warn'>
                            {copy.compatibility}
                        </Text>
                    ) : null}
                </Stack>
            }
        >
            <Section space='sm' bordered>
                <Stack gap={6}>
                    <ReceiverSummary log={log} />
                    {connected && supported ? (
                        <Stack gap={3}>
                            <ModePanel
                                key={latest(log, 'mode')?.id ?? 'mode'}
                                log={log}
                                connected={connected}
                                supported={supported}
                                send={receiver.send}
                            />
                            <RangeResults log={log} visible={currentMode === 'range'} />
                            <TrackerPanel
                                log={log}
                                connected={connected}
                                supported={supported}
                                location={receiver.location}
                                localTles={receiver.localTles}
                                busy={receiver.transferBusy}
                                error={receiver.transferError}
                                onLocationChange={receiver.setLocation}
                                onUseLocation={receiver.useMyLocation}
                                onSetMinimumElevation={(degrees) =>
                                    receiver.send(minimumElevationCommand(degrees))
                                }
                                onSetDoppler={(enabled) => receiver.send(dopplerCommand(enabled))}
                                onSendLocation={() => {
                                    void receiver.sendLocation()
                                }}
                                onFetchTles={() => {
                                    void receiver.fetchTles()
                                }}
                                onLoadTleFile={(file) => {
                                    void receiver.loadTleFile(file)
                                }}
                                onSendTles={() => {
                                    void receiver.sendTles()
                                }}
                            />
                            <PassList log={log} />
                            <ProfileTable log={log} />
                        </Stack>
                    ) : null}
                    {txBuild ? (
                        <div role='status'>
                            <Callout title={copy.txBuildTitle} tone='warn'>
                                {copy.txBuild}
                            </Callout>
                        </div>
                    ) : null}
                    <Row gap={2}>
                        <Button
                            size='sm'
                            variant='ghost'
                            disabled={!connected}
                            onClick={() => {
                                void receiver.send('status')
                            }}
                        >
                            {copy.actions.status}
                        </Button>
                        <Button
                            size='sm'
                            variant='ghost'
                            disabled={!connected}
                            onClick={() => {
                                void receiver.requestHistory()
                            }}
                        >
                            {copy.actions.history}
                        </Button>
                        <Button
                            size='sm'
                            variant='ghost'
                            iconBefore={<Icon name='download' />}
                            disabled={log.entries.length === 0}
                            onClick={receiver.save}
                        >
                            {copy.actions.download}
                        </Button>
                        <Button
                            size='sm'
                            variant='ghost'
                            disabled={log.entries.length === 0}
                            onClick={receiver.clear}
                        >
                            {copy.actions.clear}
                        </Button>
                    </Row>
                    <Stack gap={4}>
                        <Row gap={2} role='group' ariaLabel={copy.views.packets}>
                            {VIEWS.map((option) => (
                                <Button
                                    key={option}
                                    size='sm'
                                    variant={view === option ? 'primary' : 'secondary'}
                                    pressed={view === option}
                                    onClick={() => {
                                        setView(option)
                                    }}
                                >
                                    {copy.views[option]}
                                    {option === 'packets'
                                        ? ` (${String(packets)})`
                                        : ` (${String(log.entries.length)})`}
                                </Button>
                            ))}
                        </Row>
                        {view === 'packets' ? (
                            <PacketList
                                entries={log.entries}
                                freshId={receiver.freshId}
                                satelliteNames={satelliteNames}
                            />
                        ) : (
                            <RecordList entries={log.entries} />
                        )}
                    </Stack>
                </Stack>
            </Section>
        </Page>
    )
}
