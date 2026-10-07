import { useSyncExternalStore } from 'react'

import { Text } from '@components/shared/typography/Text'
import { Badge, StatusDot, StatusLabel } from '@components/shared/widgets/Badge'
import type { StatusKind } from '@components/shared/widgets/Badge'
import { Icon } from '@components/shared/widgets/Icon'
import { nearbyDetailsContent } from '@core/content/build/nearby/deviceDetails'
import { nearbyDevicesContent as copy } from '@core/content/build/nearby/nearbyDevices'
import { cx } from '@core/format/cx'
import { parseFirmware } from '@core/nearby/firmware'
import type { NodeKind } from '@core/nearby/firmware'
import { age, localTime } from '@core/nearby/metrics'
import { nodeId } from '@core/nearby/model'
import type { ConnectionState, Device } from '@core/nearby/model'

// One shared ticker: only the elements that print an age re-render each second.
const listeners = new Set<() => void>()
const clock: { now: number; ticker: ReturnType<typeof setInterval> | undefined } = {
    now: Date.now(),
    ticker: undefined,
}

function subscribe(listener: () => void) {
    listeners.add(listener)
    if (clock.ticker === undefined) {
        clock.now = Date.now()
        clock.ticker = setInterval(() => {
            clock.now = Date.now()
            for (const notify of listeners) notify()
        }, 1000)
    }
    return () => {
        listeners.delete(listener)
        if (listeners.size > 0) {
            return
        }

        clearInterval(clock.ticker)
        clock.ticker = undefined
    }
}

function useNow(): number {
    return useSyncExternalStore(subscribe, () => clock.now)
}

/** Relative age; the local time is available on hover. */
export function Age({ time }: { readonly time: number }) {
    const current = useNow()
    return <span title={localTime(time, current)}>{age(time, current)}</span>
}

export function Timestamp({ time }: { readonly time: number }) {
    return <span>{localTime(time)}</span>
}

export function DeviceStatus({
    state,
    recent = false,
}: {
    readonly state: ConnectionState
    readonly recent?: boolean
}) {
    const pending = state === 'connecting' || state === 'initializing'
    return (
        <div className='nearby_connection_status'>
            <StatusLabel
                kind={state === 'connected' ? 'live' : pending ? 'warn' : 'neutral'}
                pulse={pending}
            >
                {recent ? copy.recentStatus : copy.states[state]}
            </StatusLabel>
        </div>
    )
}

/** Meshtastic names nodes by the last four hex digits of their ID, so those lead. */
/** Orange marks a node running our firmware; any other node is gray. */
export function NodeTag({
    num,
    ours,
    size = 'md',
}: {
    readonly num: number | null
    readonly ours: boolean
    readonly size?: 'sm' | 'md'
}) {
    return (
        <span
            className={cx(
                'nearby_node_tag',
                'nearby_selectable',
                size === 'sm' && 'nearby_node_tag_sm',
                !ours && 'nearby_node_tag_other',
                num === null && 'nearby_node_tag_empty'
            )}
            title={num === null ? undefined : nodeId(num)}
        >
            {num === null ? '····' : nodeId(num).slice(-4)}
        </span>
    )
}

export function NodeId({ num }: { readonly num: number }) {
    const id = nodeId(num)
    return (
        <span className='nearby_node_id nearby_selectable'>
            <span className='nearby_node_id_prefix'>{id.slice(0, -4)}</span>
            {id.slice(-4)}
        </span>
    )
}

export function FirmwareVersion({ raw }: { readonly raw: string }) {
    const firmware = parseFirmware(raw)
    if (firmware === null) return <>—</>
    const labels = nearbyDetailsContent.firmware
    return (
        <span
            className='nearby_firmware'
            title={firmware.ours ? `${labels.oursTitle} ${firmware.build}` : raw}
        >
            <Badge kind={firmware.ours ? 'fire' : 'neutral'} size='xs'>
                {firmware.ours ? labels.ours : labels.upstream}
            </Badge>
            <span>{firmware.version}</span>
        </span>
    )
}

export function FirmwareBuild({ raw }: { readonly raw: string }) {
    const build = parseFirmware(raw)?.build
    return <>{build === undefined || build === '' ? '—' : build}</>
}
/**
 * While a browser is connected, the firmware sends each sensor module's reading
 * straight to it about once a minute, even with LoRa transmission off. A module
 * with no sensor found at boot disables itself and sends nothing.
 */
const SENSOR_GRACE_MS = 3 * 60 * 1000

const SENSOR_GROUPS = {
    environment: { prefix: 'environmentMetrics.', setting: 'Environmental telemetry' },
    particles: { prefix: 'airQualityMetrics.', setting: 'Particle telemetry' },
} as const

export function SensorStatus({
    device,
    group,
}: {
    readonly device: Device
    readonly group: keyof typeof SENSOR_GROUPS
}) {
    const current = useNow()
    const labels = nearbyDetailsContent.sensors
    const { prefix, setting } = SENSOR_GROUPS[group]
    const times = Object.values(device.readings)
        .filter((reading) => reading.metric.startsWith(prefix))
        .map((reading) => reading.receivedAt)
    const latest = times.length === 0 ? null : Math.max(...times)
    const status = (): readonly [StatusKind, string] => {
        if (device.configuration[setting] === 'Disabled') return ['neutral', labels.off]
        if (latest !== null)
            return device.state === 'connected'
                ? ['live', `${labels.reporting} · ${age(latest, current)}`]
                : ['neutral', `${labels.lastReading} · ${age(latest, current)}`]
        if (device.state !== 'connected') return ['neutral', labels.offline]
        return device.connectedAt !== null && current - device.connectedAt > SENSOR_GRACE_MS
            ? ['dead', labels.missing]
            : ['warn', labels.waiting]
    }
    const [kind, text] = status()
    return (
        <div className='nearby_sensor_status'>
            <StatusDot kind={kind} pulse={kind === 'warn'} />
            <Text as='span' size='sm' weight={600}>
                {labels[group]}
            </Text>
            <Text
                as='span'
                size='sm'
                tone={kind === 'neutral' ? 'faint' : kind}
                className='nearby_line'
            >
                {text}
            </Text>
        </div>
    )
}

const KIND_ICON = {
    base: 'radio',
    cellular: 'cell',
    sensor: 'sensor',
    vision: 'camera',
    test: 'flask',
} as const

/** The node type read from an MFD name; nothing for other nodes. */
export function NodeKindIcon({ kind }: { readonly kind: NodeKind | null }) {
    if (kind === null) return null
    const label = nearbyDetailsContent.kinds[kind]
    return (
        <span className='nearby_kind' title={label}>
            <Icon name={KIND_ICON[kind]} size={20} label={label} />
        </span>
    )
}
