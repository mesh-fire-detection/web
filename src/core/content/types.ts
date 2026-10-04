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

export type NearbyDevicesContent = PageHeading & {
    readonly add: Readonly<Record<'bluetooth' | 'usb', string>>
    readonly transports: Readonly<Record<'bluetooth' | 'usb', string>>
    readonly helper: readonly string[]
    readonly recentStatus: string
    readonly emptyTitle: string
    readonly emptyBody: string
    readonly devicesTitle: string
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
        readonly nodeId: string
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
