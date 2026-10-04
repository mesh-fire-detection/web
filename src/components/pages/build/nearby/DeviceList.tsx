import { useId, useState } from 'react'

import { Age, DeviceStatus, NodeKindIcon, NodeTag } from '@components/pages/build/nearby/Indicators'
import { Box, Row, Stack } from '@components/shared/primitives/Layout'
import { Pressable } from '@components/shared/primitives/Pressable'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { nearbyDevicesContent as copy } from '@core/content/build/nearby/nearbyDevices'
import { cx } from '@core/format/cx'
import { isMfdNode, mfdKind } from '@core/nearby/firmware'
import { batteryCharge, batteryTone, readingValue } from '@core/nearby/metrics'
import { deviceName, isRecentDevice } from '@core/nearby/model'
import type { Device, Snapshot, Transport } from '@core/nearby/model'
import type { NearbySession } from '@core/nearby/session'

export function DeviceList({
    snapshot,
    session,
    canConnect,
    onSelect,
}: {
    readonly snapshot: Snapshot
    readonly session: NearbySession
    readonly canConnect: Readonly<Record<Transport, boolean>>
    readonly onSelect: (id: string) => void
}) {
    const [previousOpen, setPreviousOpen] = useState<boolean | null>(null)
    const previousId = useId()
    const active = snapshot.devices.filter(
        (device) => device.state !== 'disconnected' || isRecentDevice(device)
    )
    const previous = snapshot.devices.filter(
        (device) => device.state === 'disconnected' && !isRecentDevice(device)
    )
    const previousVisible =
        previousOpen ??
        (active.length === 0 &&
            (snapshot.restoration === 'unsupported' || snapshot.restoration === 'failed'))
    return (
        <Stack gap={4}>
            {snapshot.devices.length === 0 ? (
                <Box tone='surface' padding={5} radius='md'>
                    <Stack gap={2}>
                        <Heading level={3} size='sm'>
                            {copy.emptyTitle}
                        </Heading>
                        <Text size='sm' tone='muted'>
                            {copy.emptyBody}
                        </Text>
                    </Stack>
                </Box>
            ) : (
                active.map((device) => (
                    <DeviceEntry
                        key={device.id}
                        device={device}
                        snapshot={snapshot}
                        session={session}
                        canConnect={canConnect}
                        onSelect={onSelect}
                    />
                ))
            )}
            {previous.length > 0 ? (
                <Stack gap={3}>
                    <Button
                        variant='secondary'
                        ariaExpanded={previousVisible}
                        ariaControls={previousId}
                        onClick={() => {
                            setPreviousOpen(!previousVisible)
                        }}
                    >
                        {copy.previousTitle} ({previous.length})
                    </Button>
                    {previousVisible ? (
                        <div id={previousId}>
                            <Stack gap={3}>
                                <Text size='xs' tone='faint'>
                                    {snapshot.restoration
                                        ? copy.restoration[snapshot.restoration]
                                        : copy.previousBody}
                                </Text>
                                {previous.map((device) => (
                                    <DeviceEntry
                                        key={device.id}
                                        device={device}
                                        snapshot={snapshot}
                                        session={session}
                                        canConnect={canConnect}
                                        onSelect={onSelect}
                                    />
                                ))}
                            </Stack>
                        </div>
                    ) : null}
                </Stack>
            ) : null}
        </Stack>
    )
}

function BatteryPercent({
    percent,
    estimated,
}: {
    readonly percent: number
    readonly estimated: boolean
}) {
    const tone = batteryTone(percent)
    const text = `${estimated ? '≈' : ''}${String(percent)} %`
    return tone === 'default' ? (
        text
    ) : (
        <Text as='span' size='xs' mono tone={tone}>
            {text}
        </Text>
    )
}

function DeviceEntry({
    device,
    snapshot,
    session,
    canConnect,
    onSelect,
}: {
    readonly device: Device
    readonly snapshot: Snapshot
    readonly session: NearbySession
    readonly canConnect: Readonly<Record<Transport, boolean>>
    readonly onSelect: (id: string) => void
}) {
    const selected = snapshot.selectedId === device.id
    const name = deviceName(device) || copy.unnamed
    const battery = device.readings['deviceMetrics.batteryLevel']
    const { powered, percent } = batteryCharge(device)
    const active = device.state !== 'disconnected'
    const recent = isRecentDevice(device)
    const hint =
        !active && !canConnect[device.transport]
            ? copy.unavailable[device.transport]
            : recent
              ? copy.hints.recent
              : copy.hints[device.state]
    return (
        <Box
            tone='surface'
            padding={4}
            radius='md'
            className={cx(
                'nearby_card',
                selected && 'nearby_selected',
                device.state === 'connected' && 'nearby_connected',
                recent && 'nearby_recent'
            )}
        >
            <Stack gap={3}>
                <Row gap={3} wrap={false}>
                    <NodeTag num={device.nodeNum} ours={isMfdNode(device)} />
                    <Stack gap={1} grow minWidth0>
                        <Pressable
                            role='button'
                            className='bare nearby_select'
                            pressed={selected}
                            accessibleLabel={`${copy.actions.view}: ${name}`}
                            onActivate={() => {
                                onSelect(device.id)
                            }}
                        >
                            <Heading
                                level={3}
                                size='sm'
                                tone={recent ? 'muted' : 'default'}
                                className='nearby_line'
                            >
                                {name}
                            </Heading>
                        </Pressable>
                        <DeviceStatus state={device.state} recent={recent} />
                    </Stack>
                    <NodeKindIcon kind={mfdKind(device)} />
                </Row>
                <Stack gap={1}>
                    <Text mono size='xs' tone='faint' className='nearby_line'>
                        {copy.transports[device.transport]} · {copy.battery}{' '}
                        {percent === null ? (
                            battery ? (
                                readingValue(battery)
                            ) : (
                                '—'
                            )
                        ) : (
                            <BatteryPercent percent={percent} estimated={powered} />
                        )}
                        {powered ? ` · ${copy.externalPower}` : null}
                    </Text>
                    <Text mono size='xs' tone='faint' className='nearby_line'>
                        {copy.lastPacket}{' '}
                        {device.lastPacketAt === null ? '—' : <Age time={device.lastPacketAt} />}
                    </Text>
                    <Text size='xs' tone='faint' className='nearby_line'>
                        {hint}
                    </Text>
                </Stack>
                <Row gap={2} wrap={false} className='nearby_device_actions'>
                    <Button
                        size='sm'
                        variant='secondary'
                        full
                        disabled={!active && (snapshot.busy || !canConnect[device.transport])}
                        label={`${active ? copy.actions.disconnect : copy.actions.connect}: ${name}`}
                        onClick={() => {
                            if (active) void session.disconnect(device.id)
                            else void session.connect(device.id)
                        }}
                    >
                        {active ? copy.actions.disconnect : copy.actions.connect}
                    </Button>
                    <Button
                        size='sm'
                        variant='ghost'
                        full
                        disabled={snapshot.busy}
                        label={`${copy.actions.remove}: ${name}`}
                        onClick={() => {
                            session.remove(device.id)
                        }}
                    >
                        {copy.actions.remove}
                    </Button>
                </Row>
            </Stack>
        </Box>
    )
}
