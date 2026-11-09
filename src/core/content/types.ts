/**
 * Shapes for everything under `src/core/content`.
 *
 * Every content export closes with `as const satisfies <shape>` rather than
 * carrying a type annotation. The difference matters: an annotation widens the
 * literals away.
 *
 * Only the shapes another module names are exported.
 */

import type { MarkdownBlock } from '@core/format/markdown'
import type { MeasuredCopy } from '@core/format/units'
import type { DfuState, FirmwareUpdate } from '@core/nearby/firmware'

type PageHeading = {
    readonly title: string
    readonly eyebrow?: string
    readonly lede: string
}

export type TitledDetail = {
    readonly title: string
    readonly detail: MeasuredCopy
}

type LabeledValue = {
    readonly label: string
    readonly value: string
    readonly tone?: 'default' | 'warn'
}

type HomeHero = {
    readonly eyebrow: string
    readonly networkLine: string
    readonly titleBefore: string
    readonly titleAfter: string
    readonly lede: string
    readonly primaryCta: string
    readonly secondaryCta: string
}

type HomeSectionCopy = {
    readonly eyebrow: string
    readonly title: string
    readonly lede: string
}

export type HomeContent = {
    readonly hero: HomeHero
    readonly network: HomeSectionCopy & { readonly mapCta: string }
    readonly baseline: {
        readonly eyebrow: string
        readonly title: string
        readonly paragraphs: readonly string[]
        readonly cta: string
        readonly publishLabel: string
        readonly rows: readonly LabeledValue[]
    }
    readonly nodeTypes: HomeSectionCopy
    readonly problems: HomeSectionCopy & { readonly allCta: string }
    readonly closing: {
        readonly title: string
        readonly lede: string
        readonly primaryCta: string
        readonly secondaryCta: string
    }
}

type AboutGoal = {
    readonly n: string
    readonly title: string
    readonly detail: string
    readonly status: string
    readonly kind: 'warn' | 'live'
}

type AboutRoadmapItem = {
    readonly when: string
    readonly title: string
    readonly detail: string
    readonly done: boolean
}

export type AboutContent = PageHeading & {
    readonly goals: {
        readonly eyebrow: string
        readonly title: string
        readonly lede: string
        readonly items: readonly AboutGoal[]
    }
    readonly audience: {
        readonly eyebrow: string
        readonly title: string
        readonly paragraphs: readonly string[]
        readonly fleetLabel: string
        readonly fleetTotal: string
        readonly fleetNote: string
    }
    readonly roadmap: {
        readonly eyebrow: string
        readonly title: string
        readonly lede: string
        readonly items: readonly AboutRoadmapItem[]
    }
    readonly privacy: {
        readonly eyebrow: string
        readonly title: string
        readonly items: readonly string[]
        readonly policyCta: string
    }
    readonly licensing: {
        readonly eyebrow: string
        readonly title: string
        readonly hardwareLead: string
        readonly hardwareTrail: string
        readonly firmwareTrail: string
        readonly repoCta: string
        readonly contactCta: string
    }
    readonly closing: {
        readonly title: string
        readonly lede: string
        readonly primaryCta: string
        readonly secondaryCta: string
    }
}

type LegalSection = {
    /** Anchor id, so a clause can be linked directly. */
    readonly id: string
    readonly title: string
    readonly paragraphs?: readonly string[]
    readonly items?: readonly string[]
}

export type LegalContent = PageHeading & {
    /** ISO date of the latest revision. */
    readonly updatedOn: string
    readonly summary: { readonly title: string; readonly body: string }
    readonly sections: readonly LegalSection[]
}

/**
 * A post parsed out of the sibling `blog` repository. Only `blocks` is read
 * from the document body; everything else comes from its front matter.
 */
export type BlogPost = {
    readonly slug: string
    readonly title: string
    /** ISO date from the front matter, shown as written. */
    readonly date: string
    readonly excerpt: string
    readonly tags: readonly string[]
    readonly draft: boolean
    readonly blocks: readonly MarkdownBlock[]
}

export type BlogContent = PageHeading & {
    readonly draftLabel: string
    readonly emptyTitle: string
    readonly emptyBody: string
    readonly backCta: string
}

export type NotFoundContent = {
    readonly code: string
    readonly title: string
    readonly lede: string
    readonly homeCta: string
    readonly buildCta: string
}

/** What the code step says on a particular page; the rest is `CodeStepContent`. */
type CodeStepWording = {
    /**
     * `{address}` is replaced with the address typed. Worded so it reads true
     * whether or not a code went out, because the page cannot know.
     */
    readonly lede: string
    readonly noEmail: string
    readonly submit: string
}

/** The Google option on a page that signs people in or lets them join. */
type GoogleWording = {
    /** On the rule between Google and the email form. */
    readonly or: string
    readonly cta: string
    /** Google came back turned away. One answer for every reason, so it reveals nothing. */
    readonly refused: string
    /** The backend has no Google client, or Google could not be started. */
    readonly unavailable: string
}

export type SignInContent = {
    readonly title: string
    /** Shown when a members-only page sent the person here. */
    readonly membersOnly: string
    readonly email: {
        readonly lede: string
        readonly label: string
        readonly submit: string
    }
    readonly code: CodeStepWording
    readonly google: GoogleWording
    readonly join: { readonly prompt: string; readonly link: string }
}

type PromptLink = { readonly prompt: string; readonly link: string }

export type JoinContent = PageHeading & {
    /** Shown when this browser has connected no node yet. */
    readonly noNodes: { readonly title: string; readonly body: string; readonly connect: string }
    readonly nodes: { readonly title: string; readonly body: string; readonly unnamed: string }
    readonly form: {
        readonly title: string
        readonly emailLabel: string
        readonly nameLabel: string
        readonly nameInvalid: string
        /** Recorded by the backend as consent; keep identical to its `JOIN_CONSENT`. */
        readonly updates: string
        readonly submit: string
    }
    readonly code: CodeStepWording
    readonly google: GoogleWording & {
        /** While the nodes from this browser are added, after Google signs the new member in. */
        readonly adding: string
    }
    readonly signIn: PromptLink
}

/** The "become a member" prompt, on `/connect` and in the footer. */
export type MembershipContent = {
    readonly connect: {
        readonly title: string
        readonly body: string
        readonly cta: string
        readonly signIn: PromptLink
    }
    readonly signedIn: {
        readonly title: string
        readonly add: string
        readonly added: string
        readonly allAdded: string
        readonly failed: string
        readonly backup: string
    }
    readonly footer: { readonly title: string; readonly body: string; readonly cta: string }
}

/** Project updates: the footer form, the confirmation page and the account setting. */
export type UpdatesContent = {
    readonly footer: {
        readonly title: string
        readonly label: string
        readonly submit: string
        /** Recorded by the backend as consent; keep identical to its `FOOTER_CONSENT`. */
        readonly consent: string
        readonly sent: string
    }
    readonly confirm: {
        readonly title: string
        readonly lede: string
        readonly button: string
        readonly done: string
        readonly invalid: string
        readonly missing: string
    }
    readonly account: {
        readonly title: string
        readonly on: string
        readonly off: string
        /** Recorded by the backend as consent; keep identical to its `ACCOUNT_CONSENT`. */
        readonly turnOn: string
        readonly turnOff: string
    }
}

/** Shared by every page that takes an emailed code. */
export type CodeStepContent = {
    readonly label: string
    readonly limits: string
    readonly resend: string
    /** `{seconds}` is replaced with the time left. */
    readonly resendIn: string
    readonly resent: string
    readonly changeEmail: string
    readonly invalidCode: string
    readonly invalidEmail: string
    /** Keyed by the API's error code, plus our own `rate_limited` and `unreachable`. */
    readonly errors: {
        readonly INVALID_OTP: string
        readonly OTP_EXPIRED: string
        readonly TOO_MANY_ATTEMPTS: string
        readonly NOT_INVITED: string
        readonly rate_limited: string
        readonly unreachable: string
        readonly fallback: string
    }
}

export type AccountContent = {
    readonly title: string
    readonly details: {
        readonly name: string
        readonly nameInvalid: string
        readonly email: string
        readonly emailFixed: string
        readonly save: string
        readonly saved: string
        readonly joined: string
    }
    readonly signOut: string
    readonly signIn: {
        readonly title: string
        readonly code: string
        readonly codeNote: string
        readonly google: string
        readonly googleNote: string
        readonly add: string
        readonly remove: string
        readonly addFailed: string
        readonly unavailable: string
    }
    readonly sessions: {
        readonly title: string
        readonly thisBrowser: string
        readonly lastActive: string
        readonly unknownDevice: string
        readonly end: string
        readonly everywhere: string
        readonly everywhereNote: string
    }
    readonly leave: {
        readonly title: string
        readonly body: readonly string[]
        readonly start: string
        readonly confirm: string
        readonly confirmNote: string
        readonly cancel: string
        readonly onlyAdmin: string
    }
    readonly nodes: {
        readonly title: string
        readonly empty: string
        readonly unnamed: string
        readonly connect: string
        readonly all: string
    }
}

type Words<Key extends string> = Readonly<Record<Key, string>>
type Notice = Words<'title' | 'body'>

/** `/nodes`: the list of registered nodes, behind the session. */
export type NodesContent = PageHeading & {
    readonly loading: string
    readonly failed: Notice
    readonly filters: Words<
        | 'label'
        | 'show'
        | 'all'
        | 'mine'
        | 'role'
        | 'anyRole'
        | 'status'
        | 'anyStatus'
        | 'search'
        | 'searchDescription'
        | 'searchPlaceholder'
        | 'submit'
    >
    readonly types: Words<'base' | 'cellular' | 'sensor' | 'vision'>
    readonly roles: Words<'base' | 'gateway' | 'sensor' | 'vision'>
    readonly connections: {
        readonly via: Words<'mqtt' | 'notecard' | 'browser'>
        readonly network: Words<'wifi' | 'cellular' | 'satellite'>
        readonly never: string
    }
    readonly statuses: Words<'online' | 'degraded' | 'offline'>
    readonly table: Words<'caption' | 'node' | 'role' | 'status' | 'battery' | 'heard'>
    readonly viewOnMap: string
    readonly yours: string
    readonly disabled: string
    readonly noPosition: string
    readonly approximately: string
    readonly empty: {
        readonly none: Notice
        readonly noneMine: Notice
        readonly noResults: Notice
        readonly connect: string
        readonly clear: string
    }
}

/** `/gateways`: the paths into the server, and each gateway's latest deliveries (web#14). */
export type GatewaysContent = PageHeading & {
    readonly paths: readonly {
        readonly id: 'mqtt' | 'notecard' | 'browser'
        readonly title: string
        readonly via: string
        readonly route: readonly string[]
        readonly when: string
        readonly needs: readonly string[]
    }[]
    readonly routeLabel: string
    readonly whenLabel: string
    readonly needsLabel: string
    readonly live: Words<'title' | 'lede' | 'signIn' | 'loading' | 'broker' | 'caption'> & {
        readonly failed: Notice
        readonly none: Notice
        readonly brokerStates: Words<'connected' | 'disconnected' | 'disabled'>
        readonly columns: Words<'gateway' | 'paths' | 'last' | 'refused'>
        readonly disabled: string
        readonly never: string
        readonly states: Words<'live' | 'warn' | 'dead' | 'neutral'>
    }
}

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
    readonly use: Readonly<Record<'field' | 'quiet' | 'unused', Words<'label' | 'body'>>>
    readonly connectedHere: string
    readonly openConnect: string
    readonly viewOnMap: string
    readonly identity: Words<
        'meshId' | 'roles' | 'connections' | 'hardware' | 'firmware' | 'build' | 'heard' | 'status'
    >
    readonly record: Words<'title' | 'lede' | 'position' | 'elevation' | 'antenna' | 'deployed'>
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

type FooterLink = {
    readonly label: string
    readonly to: string
}

type FooterColumn = {
    readonly title: string
    readonly links: readonly FooterLink[]
}

export type FooterContent = {
    readonly columns: readonly FooterColumn[]
    readonly projectNote: string
}

type MapLogEntry = {
    readonly date: string
    readonly event: MeasuredCopy
    readonly kind: 'good' | 'warn' | 'bad'
}

export type MapContent = PageHeading & {
    readonly nodes: { readonly eyebrow: string; readonly title: string; readonly lede: string }
    readonly log: {
        readonly eyebrow: string
        readonly title: string
        readonly lede: string
        readonly older: string
        readonly entries: readonly MapLogEntry[]
    }
    readonly noBasemap: { readonly title: string; readonly body: string; readonly env: string }
}

export type BuildContent = PageHeading & {
    readonly nearbyCta: string
    readonly nodeTypes: { readonly eyebrow: string; readonly title: string; readonly lede: string }
    readonly bom: {
        readonly eyebrow: string
        readonly title: string
        readonly lede: string
        readonly substitutionTitle: string
        readonly substitutionBody: string
        /** ISO date the prices in the table were last checked against the stores. */
        readonly pricesCheckedOn: string
        readonly orders: {
            readonly label: string
            readonly title: string
            readonly lede: string
            /** Shipping policy captions. `{amount}` is filled from the store catalogue. */
            readonly freeOver: string
            readonly freeOverMet: string
            readonly flat: string
            readonly from: string
            readonly checkout: string
            readonly none: string
        }
        readonly shippingTitle: string
        readonly shippingBody: string
    }
    readonly enclosures: {
        readonly eyebrow: string
        readonly title: string
        readonly lede: string
        readonly unpublished: string
        readonly printTitle: string
        readonly print: readonly { readonly term: string; readonly value: string }[]
        readonly ipTitle: string
        readonly ipBody: string
        readonly ipWarn: string
    }
    readonly firmware: {
        readonly eyebrow: string
        readonly title: string
        readonly lede: string
        readonly presetsTitle: string
        readonly presetsNote: string
    }
    readonly smokeSensor: {
        readonly eyebrow: string
        readonly title: string
        readonly lede: string
        readonly requirementsTitle: string
        readonly measurementsTitle: string
        readonly firmwareTitle: string
        readonly firmwareBody: string
        readonly questionsTitle: string
        readonly questions: readonly string[]
        readonly readyTitle: string
        readonly ready: readonly string[]
    }
    readonly assembly: { readonly eyebrow: string; readonly title: string }
    readonly placement: {
        readonly eyebrow: string
        readonly title: string
        readonly items: readonly TitledDetail[]
        readonly coverageCta: string
    }
    readonly before: {
        readonly eyebrow: string
        readonly title: string
        readonly items: readonly { readonly lead: string; readonly body: string }[]
    }
    readonly jumpCta: string
    readonly sourceCta: string
}

export type NearbyNodesContent = PageHeading & {
    readonly add: Readonly<Record<'bluetooth' | 'usb', string>>
    readonly transports: Readonly<Record<'bluetooth' | 'usb', string>>
    readonly helper: readonly string[]
    readonly recentStatus: string
    readonly emptyTitle: string
    readonly emptyBody: string
    readonly nodesTitle: string
    readonly unnamed: string
    readonly errorTitle: string
    readonly battery: string
    readonly externalPower: string
    readonly lastPacket: string
    readonly notReported: string
    readonly previousTitle: string
    readonly previousBody: string
    readonly restoration: Readonly<Record<'checking' | 'unsupported' | 'failed', string>>
    readonly support: Readonly<Record<'insecure' | 'unsupported', string>>
    readonly noSupport: Readonly<Record<'title' | 'insecure' | 'unsupported' | 'link', string>> & {
        readonly href: `https://${string}`
    }
    readonly unavailable: Readonly<Record<'bluetooth' | 'usb', string>>
    readonly announcements: Readonly<
        Record<
            'connecting' | 'connected' | 'disconnected' | 'failed' | 'removed' | 'restored',
            string
        >
    >
    readonly errors: Readonly<Record<string, string>>
    readonly hints: Readonly<
        Record<'connected' | 'connecting' | 'initializing' | 'recent' | 'disconnected', string>
    >
    readonly states: Readonly<
        Record<'disconnected' | 'connecting' | 'initializing' | 'connected', string>
    >
    readonly actions: {
        readonly view: string
        readonly connect: string
        readonly disconnect: string
        readonly remove: string
        readonly undo: string
    }
}

export type SatelliteReceiverContent = PageHeading & {
    readonly connect: Readonly<Record<'bluetooth' | 'usb', string>>
    readonly transports: Readonly<Record<'bluetooth' | 'usb', string>>
    readonly helper: readonly string[]
    readonly support: Readonly<Record<'insecure' | 'unsupported', string>>
    readonly states: Readonly<Record<'idle' | 'connecting' | 'connected', string>>
    readonly errors: Readonly<Record<'failed' | 'closed', string>>
    readonly errorTitle: string
    readonly summaryTitle: string
    readonly summary: Readonly<
        Record<
            | 'radio'
            | 'listening'
            | 'fault'
            | 'frequency'
            | 'packets'
            | 'damaged'
            | 'stored'
            | 'noise'
            | 'mode'
            | 'profile',
            string
        >
    > & { readonly lastHeartbeat: string; readonly notYet: string }
    readonly views: Readonly<Record<'packets' | 'records', string>>
    readonly actions: Readonly<
        Record<'disconnect' | 'status' | 'history' | 'download' | 'clear', string>
    >
    readonly compatibility: string
    readonly txBuildTitle: string
    readonly txBuild: string
}

export type SatellitePacketListContent = {
    readonly emptyPackets: string
    readonly emptyRecords: string
    readonly status: Readonly<Record<'ok' | 'damaged' | 'error', string>>
    readonly replayed: string
    readonly fields: Readonly<
        Record<
            'rssi' | 'snr' | 'offset' | 'length' | 'profile' | 'mode' | 'satellite' | 'doppler',
            string
        >
    >
    readonly payload: string
    readonly emptyPayload: string
    readonly unknownTime: string
    readonly boot: string
    readonly showJson: string
    readonly hideJson: string
    /** Words in the one-line record summaries. */
    readonly summary: Readonly<Record<'noise' | 'ok' | 'crc' | 'radio' | 'replayed', string>>
}

export type SatelliteModePanelContent = {
    readonly title: string
    readonly modes: Readonly<Record<'auto' | 'fixed' | 'scan' | 'range', string>>
    readonly profile: string
    readonly range: Readonly<
        Record<'start' | 'end' | 'bandwidth' | 'sf' | 'cad' | 'timeout', string>
    >
    readonly start: string
    readonly estimate: string
    readonly manualWarning: string
    readonly unsupported: string
    readonly cadDetected: string
    readonly decoded: string
    readonly identified: string
    readonly stageStatus: Readonly<Record<'observed' | 'notYet' | 'unconfirmed', string>>
    readonly identificationNote: string
    readonly commandFailed: string
}

export type SatelliteTrackerPanelContent = {
    readonly title: string
    readonly clock: string
    readonly synced: string
    readonly unsynced: string
    readonly location: string
    readonly trackingSettings: string
    readonly minimumElevation: string
    readonly saveTrackingSettings: string
    readonly dopplerCorrection: string
    readonly dopplerEnabled: string
    readonly dopplerDisabled: string
    readonly latitude: string
    readonly longitude: string
    readonly altitude: string
    readonly useLocation: string
    readonly sendLocation: string
    readonly fetchTles: string
    readonly loadTleFile: string
    readonly sendTles: string
    readonly stored: string
    readonly missing: string
    readonly stale: string
    readonly fresh: string
    readonly busy: string
    readonly error: string
    readonly supportedOnly: string
}

export type SatellitePassListContent = {
    readonly title: string
    readonly empty: string
    readonly computing: string
    readonly fields: Readonly<
        Record<
            'satellite' | 'aos' | 'tca' | 'los' | 'maximumElevation' | 'tleAge' | 'stale',
            string
        >
    >
    readonly selected: string
    readonly minutes: string
}

export type SatelliteProfileTableContent = {
    readonly title: string
    readonly empty: string
    readonly fields: Readonly<
        Record<
            | 'profile'
            | 'satellite'
            | 'frequency'
            | 'mode'
            | 'confidence'
            | 'packets'
            | 'crc'
            | 'cad'
            | 'falseCad'
            | 'last',
            string
        >
    >
}

export type SatelliteRangeResultsContent = {
    readonly title: string
    readonly empty: string
    readonly sortOrder: string
    readonly fields: Readonly<
        Record<
            | 'frequency'
            | 'bandwidth'
            | 'spreadingFactor'
            | 'cadHits'
            | 'packets'
            | 'timeouts'
            | 'crcErrors'
            | 'errors'
            | 'bestRssi'
            | 'lastRssi',
            string
        >
    >
}

type SensorGuideEntry = {
    readonly title: string
    readonly summary: string
    readonly rows: readonly { readonly term: string; readonly value: string }[]
}

export type NearbySensorGuideContent = {
    readonly entries: Readonly<Record<string, SensorGuideEntry>>
    readonly unknown: SensorGuideEntry
}

export type NearbyDetailsContent = {
    readonly battery: string
    readonly solar: string
    readonly charging: string
    readonly externalPower: string
    readonly byVoltage: string
    readonly signal: string
    readonly readings: string
    readonly nearest: string
    readonly more: string
    readonly otherTelemetry: string
    readonly activity: string
    readonly lastPacket: string
    readonly notReported: string
    readonly voltageOver: string
    readonly trendWaiting: string
    readonly voltageSaved: string
    readonly voltageSavedServer: string
    readonly voltageWaiting: string
    readonly voltageNone: string
    readonly signalMissing: string
    readonly bestLink: string
    readonly channelUse: string
    readonly quality: Readonly<Record<'good' | 'fair' | 'weak', string>>
    readonly direct: string
    readonly hop: string
    readonly hops: string
    readonly routeUnknown: string
    readonly lastHeard: string
    readonly peersNote: string
    readonly unnamedNode: string
    readonly noPeers: string
    readonly showAll: string
    readonly showFewer: string
    readonly noActivity: string
    readonly waiting: string
    readonly sensorsDisabled: string
    readonly disconnected: string
    readonly recent: string
    readonly initializing: string
    readonly live: string
    readonly sensors: Readonly<
        Record<
            | 'environment'
            | 'particles'
            | 'off'
            | 'reporting'
            | 'lastReading'
            | 'waiting'
            | 'missing'
            | 'offline',
            string
        >
    >
    readonly timing: string
    readonly received: string
    readonly clockUnset: string
    readonly measured: string
    readonly cached: string
    readonly firmware: {
        readonly ours: string
        readonly upstream: string
        readonly oursTitle: string
    }
    readonly history: {
        readonly title: string
        readonly lowest: string
        readonly highest: string
        readonly average: string
        readonly rise: string
        readonly fall: string
        readonly span: string
        readonly reading: string
        readonly readings: string
        readonly empty: string
        readonly source: Readonly<Record<'browser' | 'server', string>>
    }
    readonly kinds: Readonly<Record<'base' | 'cellular' | 'sensor' | 'vision' | 'test', string>>
    readonly labels: {
        readonly meshId: string
        readonly connection: string
        readonly hardware: string
        readonly firmware: string
        readonly build: string
        readonly shortName: string
        readonly connectedAt: string
        readonly lastConnected: string
    }
}

export type FirmwareContent = PageHeading & {
    readonly connectCta: string
    readonly meshtastic: { readonly label: string; readonly href: `https://${string}` }
    readonly firmwareRepo: { readonly label: string; readonly href: `https://${string}` }
    readonly usb: Readonly<Record<'title' | 'lede' | 'enter' | 'flash' | 'unsupported', string>> & {
        readonly driveHelp: string
        readonly uf2Href: string
        readonly uf2Name: string
        readonly uf2Sha256: string
        readonly steps: readonly string[]
        readonly states: Readonly<Record<DfuState, string>>
    }
    readonly update: Readonly<Record<'title' | 'cta' | 'keepNote', string>> & {
        readonly status: Readonly<Record<FirmwareUpdate, string>>
        readonly steps: readonly string[]
    }
}

type CoveragePriorArt = {
    readonly name: string
    readonly detail: string
    readonly href: string
}

type CoverageEquation = {
    readonly term: string
    readonly value: string
}

export type CoverageContent = PageHeading & {
    readonly scope: {
        readonly eyebrow: string
        readonly title: string
        readonly lede: string
        readonly modelsTitle: string
        readonly models: readonly string[]
        readonly omitsTitle: string
        readonly omits: readonly string[]
        readonly calloutTitle: string
        readonly calloutBody: string
    }
    readonly priorArt: {
        readonly eyebrow: string
        readonly title: string
        readonly lede: string
        readonly openLabel: string
        readonly tools: readonly CoveragePriorArt[]
    }
    readonly maths: {
        readonly eyebrow: string
        readonly title: string
        readonly lede: string
        readonly equations: readonly CoverageEquation[]
        readonly footnote: string
    }
}

export type OpenProblemsContent = PageHeading & {
    readonly contentsLabel: string
    readonly intro: string
    readonly closing: {
        readonly title: string
        readonly paragraphs: readonly string[]
        readonly notBuildingTitle: string
        readonly notBuilding: string
    }
    readonly claimCta: string
    readonly discordCta: string
}

export type FalsePositiveState = {
    readonly measured: boolean
    readonly headline: string
    readonly plan: readonly string[]
    readonly alerting: readonly { readonly question: string; readonly answer: string }[]
}

export type NetworkSource = {
    readonly kind: 'sample' | 'live'
    readonly label: string
    readonly detail: string
    readonly endpoint: string
}
