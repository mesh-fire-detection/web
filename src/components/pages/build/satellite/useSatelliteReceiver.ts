import { useCallback, useEffect, useRef, useState } from 'react'

import type { Transport } from '@core/nearby/model'
import { bluetoothSupport } from '@core/nearby/transport/bluetooth'
import { serialSupport } from '@core/nearby/transport/serial'
import { locationCommand, tleCommand } from '@core/satellite/commands'
import type { ReceiverLog } from '@core/satellite/records'
import {
    appendLine,
    EMPTY_LOG,
    startReplay,
    toJsonLines,
    satelliteProfiles,
    satelliteTles,
    stationLocation,
} from '@core/satellite/records'
import type { SatelliteTle } from '@core/satellite/tle'
import { mergeTles, parseTleCatalog } from '@core/satellite/tle'
import { openReceiver } from '@core/satellite/transport'
import type { ReceiverLink } from '@core/satellite/transport'

export type ReceiverConnection = {
    readonly state: 'idle' | 'connecting' | 'connected'
    readonly transport: Transport | null
    readonly name: string
}

export type StationCoordinates = {
    readonly latitude: number
    readonly longitude: number
    readonly altitudeM: number
}

const IDLE: ReceiverConnection = { state: 'idle', transport: null, name: '' }
const LOCATION_KEY = 'mfdr:satellite-location:v1'
const TLE_KEY = 'mfdr:satellite-tles:v1'
const CELESTRAK_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=amateur&FORMAT=TLE'

function readStoredLocation(): StationCoordinates | null {
    try {
        const raw: unknown = JSON.parse(localStorage.getItem(LOCATION_KEY) ?? 'null')
        if (typeof raw !== 'object' || raw === null) return null
        const record = raw as Record<string, unknown>
        return typeof record['latitude'] !== 'number' ||
            typeof record['longitude'] !== 'number' ||
            typeof record['altitudeM'] !== 'number'
            ? null
            : {
                  latitude: record['latitude'],
                  longitude: record['longitude'],
                  altitudeM: record['altitudeM'],
              }
    } catch {
        return null
    }
}

function readStoredTles(): readonly SatelliteTle[] {
    try {
        const raw: unknown = JSON.parse(localStorage.getItem(TLE_KEY) ?? '[]')
        if (!Array.isArray(raw)) return []
        const parsed: SatelliteTle[] = []
        for (const value of raw) {
            if (typeof value !== 'object' || value === null) continue
            const record = value as Record<string, unknown>
            if (
                typeof record['name'] !== 'string' ||
                typeof record['line1'] !== 'string' ||
                typeof record['line2'] !== 'string'
            )
                continue
            const tle = parseTleCatalog(
                `${record['name']}\n${record['line1']}\n${record['line2']}`
            )[0]
            if (tle) parsed.push(tle)
        }
        return parsed
    } catch {
        return []
    }
}

/** A short tone; the context is created on the connect click, which browsers require. */
function chime(audio: AudioContext | null) {
    if (!audio) return
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.15, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.4)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start()
    oscillator.stop(audio.currentTime + 0.4)
}

function download(name: string, text: string) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/x-ndjson' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = name
    anchor.click()
    URL.revokeObjectURL(url)
}

function sameLocation(left: StationCoordinates | null, right: StationCoordinates): boolean {
    return (
        left?.latitude === right.latitude &&
        left.longitude === right.longitude &&
        left.altitudeM === right.altitudeM
    )
}

export function useSatelliteReceiver() {
    const [log, setLog] = useState<ReceiverLog>(EMPTY_LOG)
    const [connection, setConnection] = useState<ReceiverConnection>(IDLE)
    const [error, setError] = useState<'failed' | 'closed' | null>(null)
    const [freshId, setFreshId] = useState<number | null>(null)
    const [support] = useState(() => ({ bluetooth: bluetoothSupport(), usb: serialSupport() }))
    const [location, setLocation] = useState<StationCoordinates | null>(readStoredLocation)
    const [localTles, setLocalTles] = useState<readonly SatelliteTle[]>(readStoredTles)
    const [transferBusy, setTransferBusy] = useState(false)
    const [transferError, setTransferError] = useState(false)
    const logRef = useRef<ReceiverLog>(EMPTY_LOG)
    const linkRef = useRef<ReceiverLink | null>(null)
    const audioRef = useRef<AudioContext | null>(null)
    const locationRef = useRef<StationCoordinates | null>(location)
    const tlesRef = useRef<readonly SatelliteTle[]>(localTles)
    const syncRequestedRef = useRef(false)
    const legacyHistoryRequestedRef = useRef(false)
    const passesTimerRef = useRef<number | null>(null)

    const commit = useCallback((next: ReceiverLog) => {
        logRef.current = next
        setLog(next)
    }, [])

    const send = useCallback(async (command: string) => {
        await linkRef.current?.send(command)
    }, [])

    const requestHistory = useCallback(async () => {
        const link = linkRef.current
        if (!link) return
        commit(startReplay(logRef.current))
        await link.send('history')
    }, [commit])

    const synchronize = useCallback(async () => {
        const link = linkRef.current
        if (!link || syncRequestedRef.current) return
        syncRequestedRef.current = true
        setTransferError(false)
        try {
            const currentLog = logRef.current
            const boardLocation = stationLocation(currentLog)
            const localLocation = locationRef.current
            if (localLocation && !sameLocation(boardLocation, localLocation)) {
                await link.send(
                    locationCommand(
                        localLocation.latitude,
                        localLocation.longitude,
                        localLocation.altitudeM
                    )
                )
            }

            const boardTles = new Map(satelliteTles(currentLog).map((tle) => [tle.norad, tle]))
            for (const tle of tlesRef.current) {
                const onStation = boardTles.get(tle.norad)
                if (onStation && tle.epoch > (onStation.epoch ?? 0))
                    await link.send(tleCommand(tle))
            }
            await requestHistory()
            await link.send('profiles')
            await link.send('stats')
            await link.send('passes')
        } catch {
            setTransferError(true)
        }
    }, [requestHistory])

    const receive = useCallback(
        (text: string) => {
            const result = appendLine(logRef.current, text, Date.now())
            if (result.log === logRef.current) return
            commit(result.log)
            const latestEntry = result.log.entries.at(-1)
            if (latestEntry?.type === 'tles') void synchronize()
            if (
                latestEntry?.type === 'status' &&
                typeof latestEntry.fields['fw'] !== 'string' &&
                !legacyHistoryRequestedRef.current
            ) {
                legacyHistoryRequestedRef.current = true
                void requestHistory()
            }
            if (latestEntry?.type === 'passes' && latestEntry.fields['computing'] === true) {
                if (passesTimerRef.current !== null) window.clearTimeout(passesTimerRef.current)
                passesTimerRef.current = window.setTimeout(() => {
                    passesTimerRef.current = null
                    void linkRef.current?.send('passes')
                }, 3000)
            }
            if (!result.livePacket) return
            setFreshId(result.livePacket.id)
            chime(audioRef.current)
        },
        [commit, requestHistory, synchronize]
    )

    const persistLocation = useCallback((next: StationCoordinates) => {
        locationRef.current = next
        setLocation(next)
        try {
            localStorage.setItem(LOCATION_KEY, JSON.stringify(next))
            setTransferError(false)
        } catch {
            setTransferError(true)
        }
    }, [])

    const persistTles = useCallback((incoming: readonly SatelliteTle[]) => {
        const merged = mergeTles(tlesRef.current, incoming)
        tlesRef.current = merged
        setLocalTles(merged)
        try {
            localStorage.setItem(TLE_KEY, JSON.stringify(merged))
            setTransferError(false)
        } catch {
            setTransferError(true)
        }
    }, [])

    const connect = useCallback(
        async (transport: Transport) => {
            setError(null)
            audioRef.current ??= new AudioContext()
            setConnection({ state: 'connecting', transport, name: '' })
            try {
                const link = await openReceiver(transport, {
                    line: receive,
                    closed: () => {
                        if (!linkRef.current) return
                        linkRef.current = null
                        setConnection(IDLE)
                        setError('closed')
                    },
                })
                if (!link) {
                    setConnection(IDLE)
                    return
                }
                linkRef.current = link
                syncRequestedRef.current = false
                legacyHistoryRequestedRef.current = false
                setConnection({ state: 'connected', transport, name: link.name })
                const unixSeconds = Math.floor(Date.now() / 1000)
                await link.send(`time ${String(unixSeconds)}`)
                await link.send('status')
            } catch {
                linkRef.current = null
                setConnection(IDLE)
                setError('failed')
            }
        },
        [receive]
    )

    const disconnect = useCallback(async () => {
        const link = linkRef.current
        linkRef.current = null
        setConnection(IDLE)
        await link?.disconnect()
    }, [])

    const clear = useCallback(() => {
        commit(EMPTY_LOG)
        setFreshId(null)
    }, [commit])

    const save = useCallback(() => {
        const stamp = new Date().toISOString().replaceAll(':', '-').slice(0, 19)
        download(`satellite-rx-${stamp}.jsonl`, toJsonLines(logRef.current))
    }, [])

    const useMyLocation = useCallback(async (): Promise<StationCoordinates | null> => {
        setTransferError(false)
        try {
            const coordinates = await new Promise<GeolocationCoordinates>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    ({ coords }) => {
                        resolve(coords)
                    },
                    reject,
                    {
                        enableHighAccuracy: false,
                        maximumAge: 300_000,
                        timeout: 15_000,
                    }
                )
            })
            const nextLocation = {
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                altitudeM: Math.round(coordinates.altitude ?? 0),
            }
            persistLocation(nextLocation)
            return nextLocation
        } catch {
            setTransferError(true)
            return null
        }
    }, [persistLocation])

    const fetchTles = useCallback(async () => {
        setTransferBusy(true)
        setTransferError(false)
        try {
            const response = await fetch(CELESTRAK_URL)
            if (!response.ok) throw new Error(`HTTP ${String(response.status)}`)
            const incoming = parseTleCatalog(await response.text())
            if (incoming.length === 0) throw new Error('No valid TLE records')
            persistTles(incoming)
        } catch {
            setTransferError(true)
        } finally {
            setTransferBusy(false)
        }
    }, [persistTles])

    const loadTleFile = useCallback(
        async (file: File) => {
            setTransferBusy(true)
            setTransferError(false)
            try {
                const incoming = parseTleCatalog(await file.text())
                if (incoming.length === 0) throw new Error('No valid TLE records')
                persistTles(incoming)
            } catch {
                setTransferError(true)
            } finally {
                setTransferBusy(false)
            }
        },
        [persistTles]
    )

    const sendLocation = useCallback(async () => {
        const current = locationRef.current
        if (!current) return
        try {
            await send(locationCommand(current.latitude, current.longitude, current.altitudeM))
        } catch {
            setTransferError(true)
        }
    }, [send])

    const sendTles = useCallback(async () => {
        setTransferBusy(true)
        setTransferError(false)
        try {
            const boardTles = new Map(satelliteTles(logRef.current).map((tle) => [tle.norad, tle]))
            const catalogNorads = new Set(
                satelliteProfiles(logRef.current).map((profile) => profile.norad)
            )
            for (const tle of tlesRef.current) {
                const onStation = boardTles.get(tle.norad)
                if (catalogNorads.has(tle.norad) && tle.epoch > (onStation?.epoch ?? 0))
                    await send(tleCommand(tle))
            }
            await send('passes')
        } catch {
            setTransferError(true)
        } finally {
            setTransferBusy(false)
        }
    }, [send])

    useEffect(() => {
        return () => {
            if (passesTimerRef.current !== null) window.clearTimeout(passesTimerRef.current)
            const link = linkRef.current
            linkRef.current = null
            void link?.disconnect()
            void audioRef.current?.close()
        }
    }, [])

    return {
        log,
        connection,
        error,
        freshId,
        support,
        location,
        localTles,
        transferBusy,
        transferError,
        connect,
        disconnect,
        send,
        requestHistory,
        setLocation: persistLocation,
        useMyLocation,
        fetchTles,
        loadTleFile,
        sendLocation,
        sendTles,
        clear,
        save,
    }
}
