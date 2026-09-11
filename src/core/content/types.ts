/**
 * Shapes for everything under `src/core/content`.
 *
 * Every content export closes with `as const satisfies <shape>` rather than
 * carrying a type annotation. The difference matters: an annotation widens the
 * literals away.
 *
 * Only the shapes another module names are exported.
 */

type PageHeading = {
    readonly title: string
    readonly eyebrow?: string
    readonly lede: string
}

export type TitledDetail = {
    readonly title: string
    readonly detail: string
}

type LabeledValue = {
    readonly label: string
    readonly value: string
    readonly tone?: 'default' | 'warn'
}

type HomeHero = {
    readonly eyebrow: string
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
    readonly network: HomeSectionCopy & { readonly mapCta: string; readonly hardwareCost: string }
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
}

type MapLogEntry = {
    readonly date: string
    readonly event: string
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
    readonly nodeTypes: { readonly eyebrow: string; readonly title: string; readonly lede: string }
    readonly bom: {
        readonly eyebrow: string
        readonly title: string
        readonly lede: string
        readonly substitutionTitle: string
        readonly substitutionBody: string
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
