import { useState } from 'react'

import type { StationCoordinates } from '@components/pages/build/satellite/useSatelliteReceiver'
import { FileField, NumberField } from '@components/shared/forms/NumericFields'
import { Box, Grid, Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Badge } from '@components/shared/widgets/Badge'
import { satelliteTrackerContent as copy } from '@core/content/build/satellite/panels/tracker'
import {
    booleanField,
    latest,
    numberField,
    satelliteProfiles,
    satelliteTles,
    stationLocation,
} from '@core/satellite/records'
import type { ReceiverLog, SatelliteProfileRecord } from '@core/satellite/records'
import type { SatelliteTle } from '@core/satellite/tle'

const epochFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export function TrackerPanel({
    log,
    connected,
    supported,
    location,
    localTles,
    busy,
    error,
    onLocationChange,
    onUseLocation,
    onSetMinimumElevation,
    onSetDoppler,
    onSendLocation,
    onFetchTles,
    onLoadTleFile,
    onSendTles,
}: {
    readonly log: ReceiverLog
    readonly connected: boolean
    readonly supported: boolean
    readonly location: StationCoordinates | null
    readonly localTles: readonly SatelliteTle[]
    readonly busy: boolean
    readonly error: boolean
    readonly onLocationChange: (location: StationCoordinates) => void
    readonly onUseLocation: () => Promise<StationCoordinates | null>
    readonly onSetMinimumElevation: (degrees: number) => Promise<void>
    readonly onSetDoppler: (enabled: boolean) => Promise<void>
    readonly onSendLocation: () => void
    readonly onFetchTles: () => void
    readonly onLoadTleFile: (file: File) => void
    readonly onSendTles: () => void
}) {
    const [latitude, setLatitude] = useState(location?.latitude ?? 0)
    const [longitude, setLongitude] = useState(location?.longitude ?? 0)
    const [altitudeM, setAltitudeM] = useState(location?.altitudeM ?? 0)
    const status = latest(log, 'status')
    const minimumElevationRecord = latest(log, 'min_el')
    const dopplerRecord = latest(log, 'doppler')
    const [minimumElevationDraft, setMinimumElevationDraft] = useState<number | null>(null)
    const [dopplerDraft, setDopplerDraft] = useState<boolean | null>(null)
    const [settingsError, setSettingsError] = useState(false)
    const minimumElevation =
        minimumElevationDraft ??
        numberField(minimumElevationRecord?.fields ?? {}, 'degrees') ??
        numberField(status?.fields ?? {}, 'min_el') ??
        5
    const dopplerEnabled =
        dopplerDraft ??
        booleanField(dopplerRecord?.fields ?? {}, 'enabled') ??
        booleanField(status?.fields ?? {}, 'doppler') ??
        false
    const stationTles = new Map(satelliteTles(log).map((tle) => [tle.norad, tle]))
    const localTleMap = new Map(localTles.map((tle) => [tle.norad, tle]))
    const catalog: SatelliteProfileRecord[] = []
    const catalogNorads = new Set<number>()
    for (const profile of satelliteProfiles(log)) {
        if (catalogNorads.has(profile.norad)) continue
        catalogNorads.add(profile.norad)
        catalog.push(profile)
    }
    const savedLocation = stationLocation(log)

    const chooseLocation = async () => {
        const current = await onUseLocation()
        if (!current) return
        setLatitude(current.latitude)
        setLongitude(current.longitude)
        setAltitudeM(current.altitudeM)
    }

    const saveTrackingSettings = async () => {
        setSettingsError(false)
        try {
            await onSetMinimumElevation(minimumElevation)
            setMinimumElevationDraft(null)
        } catch {
            setSettingsError(true)
        }
    }

    const changeDoppler = async () => {
        setSettingsError(false)
        try {
            await onSetDoppler(!dopplerEnabled)
            setDopplerDraft(null)
        } catch {
            setSettingsError(true)
        }
    }

    const saveLocationDraft = () => {
        onLocationChange({ latitude, longitude, altitudeM })
    }

    return (
        <Box padding={4} radius='md' tone='surface' className='satellite_panel'>
            <Stack gap={4}>
                <Text size='lg' weight={600}>
                    {copy.title}
                </Text>
                {supported ? (
                    <>
                        <Stack gap={2}>
                            <Text size='sm' weight={600}>
                                {copy.clock}
                            </Text>
                            <Text
                                size='xs'
                                tone={status?.fields['synced'] === true ? 'live' : 'warn'}
                            >
                                {status?.fields['synced'] === true ? copy.synced : copy.unsynced}
                            </Text>
                        </Stack>
                        <Stack gap={3}>
                            <Text size='sm' weight={600}>
                                {copy.trackingSettings}
                            </Text>
                            <Grid minColumnWidth={150} gap={3}>
                                <NumberField
                                    label={copy.minimumElevation}
                                    min={0}
                                    max={90}
                                    step={1}
                                    suffix='°'
                                    value={minimumElevation}
                                    onChange={setMinimumElevationDraft}
                                />
                                <Stack gap={2}>
                                    <Text size='2xs' tone='faint' uppercase weight={600}>
                                        {copy.dopplerCorrection}
                                    </Text>
                                    <Button
                                        variant={dopplerEnabled ? 'primary' : 'secondary'}
                                        pressed={dopplerEnabled}
                                        disabled={!connected || busy}
                                        onClick={() => {
                                            void changeDoppler()
                                        }}
                                    >
                                        {dopplerEnabled
                                            ? copy.dopplerEnabled
                                            : copy.dopplerDisabled}
                                    </Button>
                                </Stack>
                            </Grid>
                            <Button
                                disabled={!connected || busy}
                                onClick={() => {
                                    void saveTrackingSettings()
                                }}
                            >
                                {copy.saveTrackingSettings}
                            </Button>
                            {settingsError ? (
                                <Text size='xs' tone='warn'>
                                    {copy.error}
                                </Text>
                            ) : null}
                        </Stack>
                        <Stack gap={3}>
                            <Text size='sm' weight={600}>
                                {copy.location}
                            </Text>
                            <Grid minColumnWidth={150} gap={3}>
                                <NumberField
                                    label={copy.latitude}
                                    min={-90}
                                    max={90}
                                    step={0.000001}
                                    value={latitude}
                                    onChange={setLatitude}
                                />
                                <NumberField
                                    label={copy.longitude}
                                    min={-180}
                                    max={180}
                                    step={0.000001}
                                    value={longitude}
                                    onChange={setLongitude}
                                />
                                <NumberField
                                    label={copy.altitude}
                                    min={-500}
                                    max={10_000}
                                    step={1}
                                    suffix='m'
                                    value={altitudeM}
                                    onChange={setAltitudeM}
                                />
                            </Grid>
                            <Row gap={2}>
                                <Button
                                    variant='secondary'
                                    disabled={!connected || busy}
                                    onClick={() => {
                                        void chooseLocation()
                                    }}
                                >
                                    {copy.useLocation}
                                </Button>
                                <Button
                                    disabled={!connected || busy}
                                    onClick={() => {
                                        saveLocationDraft()
                                        onSendLocation()
                                    }}
                                >
                                    {copy.sendLocation}
                                </Button>
                            </Row>
                            <Text size='xs' tone='faint'>
                                {savedLocation
                                    ? `${copy.stored}: ${savedLocation.latitude.toFixed(5)}, ${savedLocation.longitude.toFixed(5)}, ${String(savedLocation.altitudeM)} m`
                                    : `${copy.stored}: ${copy.missing}`}
                            </Text>
                        </Stack>
                        <Stack gap={3}>
                            <Text size='sm' weight={600}>
                                TLE
                            </Text>
                            <Row gap={2}>
                                <Button variant='secondary' disabled={busy} onClick={onFetchTles}>
                                    {copy.fetchTles}
                                </Button>
                                <FileField
                                    label={copy.loadTleFile}
                                    accept='.txt,.tle,text/plain'
                                    onChange={(file) => {
                                        if (file) onLoadTleFile(file)
                                    }}
                                />
                                <Button
                                    disabled={!connected || busy || localTles.length === 0}
                                    onClick={onSendTles}
                                >
                                    {busy ? copy.busy : copy.sendTles}
                                </Button>
                            </Row>
                            {error ? (
                                <Text size='xs' tone='warn'>
                                    {copy.error}
                                </Text>
                            ) : null}
                            {catalog.length === 0 ? (
                                <Text size='xs' tone='faint'>
                                    {copy.supportedOnly}
                                </Text>
                            ) : (
                                <Stack gap={2}>
                                    {catalog.map((profile) => {
                                        const tle = localTleMap.get(profile.norad)
                                        const onBoard = stationTles.get(profile.norad)
                                        const age = tle?.ageDays
                                        return (
                                            <Box
                                                key={profile.norad}
                                                padding={3}
                                                radius='sm'
                                                tone='surface-2'
                                            >
                                                <Row gap={2} justify='between'>
                                                    <Stack gap={0}>
                                                        <Text size='sm' weight={600}>
                                                            {profile.name}
                                                        </Text>
                                                        <Text size='2xs' mono tone='faint'>
                                                            NORAD {String(profile.norad)}
                                                        </Text>
                                                    </Stack>
                                                    <Stack gap={1} align='end'>
                                                        {onBoard?.present ? (
                                                            <Badge kind='live' size='xs'>
                                                                {copy.stored}
                                                                {onBoard.epoch
                                                                    ? ` · ${epochFormat.format(onBoard.epoch * 1000)}`
                                                                    : ''}
                                                            </Badge>
                                                        ) : (
                                                            <Badge kind='neutral' size='xs'>
                                                                {copy.missing}
                                                            </Badge>
                                                        )}
                                                        {tle ? (
                                                            <Text
                                                                size='2xs'
                                                                tone={
                                                                    typeof age === 'number' &&
                                                                    age > 7
                                                                        ? 'warn'
                                                                        : 'faint'
                                                                }
                                                            >
                                                                {epochFormat.format(
                                                                    tle.epoch * 1000
                                                                )}{' '}
                                                                ·{' '}
                                                                {typeof age === 'number' && age > 7
                                                                    ? copy.stale
                                                                    : copy.fresh}{' '}
                                                                ({String(age)} d)
                                                            </Text>
                                                        ) : null}
                                                    </Stack>
                                                </Row>
                                            </Box>
                                        )
                                    })}
                                </Stack>
                            )}
                        </Stack>
                    </>
                ) : (
                    <Text size='sm' tone='faint'>
                        {copy.supportedOnly}
                    </Text>
                )}
            </Stack>
        </Box>
    )
}
