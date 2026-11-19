import type { Notice, Words } from '@core/content/types'

/** `/nodes/:id`: one node, and editing it for the people on it. */
export type NodeContent = {
    readonly title: string
    readonly back: string
    readonly loading: string
    readonly notFound: Notice
    readonly failed: Notice
    readonly yours: string
    readonly disabled: string
    readonly unset: string
    readonly use: Readonly<
        Record<'field' | 'computer' | 'recent' | 'quiet' | 'unused', Words<'label' | 'body'>>
    >
    readonly connectedHere: string
    readonly openConnect: string
    readonly viewOnMap: string
    readonly identity: Words<
        'meshId' | 'roles' | 'connections' | 'hardware' | 'firmware' | 'build' | 'heard' | 'status'
    >
    /**
     * When the node is expected to be heard, beside its status: how often, where
     * that comes from, how late its path runs, and when it becomes late.
     */
    readonly expected: Words<
        'label' | 'every' | 'configured' | 'observed' | 'default' | 'delay' | 'lateAfter'
    >
    readonly record: Words<'title' | 'lede' | 'position' | 'elevation' | 'antenna' | 'deployed'>
    readonly path: Words<
        | 'title'
        | 'lede'
        | 'loading'
        | 'failed'
        | 'none'
        | 'self'
        | 'server'
        | 'notehub'
        | 'broker'
        | 'internet'
        | 'notecard'
        | 'signal'
        | 'relayedBy'
        | 'allRoutes'
        | 'through'
        | 'fromGateway'
        | 'fromBrowser'
        | 'lastUsed'
        | 'fewerRoutes'
        | 'connect'
        | 'lora'
        | 'oneHop'
        | 'hops'
        | 'direct'
        | 'unknownHops'
        | 'via'
    > & {
        readonly nearby: Words<'title' | 'lede' | 'theyHear' | 'none'>
    }
    readonly approximate: string
    readonly details: Words<
        | 'title'
        | 'lede'
        | 'position'
        | 'elevation'
        | 'shown'
        | 'shownExact'
        | 'shownApproximate'
        | 'hardwareId'
        | 'note'
        | 'reported'
        | 'registered'
    >
    readonly owners: Words<'title' | 'lede' | 'you' | 'added' | 'none'>
    readonly more: Words<
        | 'open'
        | 'other'
        | 'fromServer'
        | 'fromBrowser'
        | 'notConnected'
        | 'shortName'
        | 'settingsAsOf'
        | 'lastConnected'
        | 'lastBackedUp'
        | 'notBackedUp'
        | 'notReported'
        | 'events'
        | 'noEvents'
        | 'eventsFailed'
        | 'activity'
        | 'noActivity'
    > & { readonly eventKinds: Words<'connected' | 'disconnected' | 'restarted' | 'malformed'> }
    readonly readings: Words<'loading' | 'failed' | 'sensors' | 'range'>
    readonly edit: Words<
        | 'open'
        | 'title'
        | 'name'
        | 'type'
        | 'notSet'
        | 'latitude'
        | 'longitude'
        | 'recordTitle'
        | 'recordLede'
        | 'positionHint'
        | 'elevation'
        | 'antenna'
        | 'deployed'
        | 'deployedHint'
        | 'note'
        | 'exactPosition'
        | 'exactHint'
        | 'save'
        | 'cancel'
        | 'saved'
    > & {
        readonly invalid: Words<'name' | 'number' | 'latitude' | 'longitude' | 'pair' | 'date'>
        /** Keyed by the API's error code, plus our own `rate_limited` and `unreachable`. */
        readonly errors: Words<'bad_request' | 'rate_limited' | 'unreachable' | 'fallback'>
    }
}
