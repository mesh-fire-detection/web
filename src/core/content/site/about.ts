import type { AboutContent } from '@core/content/types'

export const aboutContent = {
    title: 'About',
    eyebrow: 'What this is',
    lede: 'An open hardware project trying to make wildfire detection cheap enough to deploy everywhere it is needed, instead of only where a budget already exists.',
    goals: {
        eyebrow: 'Goals',
        title: 'Three goals, honestly scored',
        lede: 'Two of the three are not met, and one of them cannot even be measured yet. Scoring them in public is cheaper than being caught out later.',
        items: [
            {
                n: '01',
                title: 'Reduce wildfire detection time',
                detail: 'The headline goal, and the one we cannot yet defend. It needs a measured baseline for a named district before it means anything. That work is open problem one.',
                status: 'Blocked on a baseline',
                kind: 'warn',
            },
            {
                n: '02',
                title: 'Radically reduce the cost of detection',
                detail: 'A Base node is {baseCost} against $10,000–20,000 for a camera install. This goal is met at the unit level; what is unproven is whether {baseCost} nodes detect anything useful.',
                status: 'Met at the unit level',
                kind: 'live',
            },
            {
                n: '03',
                title: 'Maximise the area covered',
                detail: 'Cheap units only matter if they cover ground. Fourteen nodes cover one branch of one valley. The constraint is not money — it is getting hardware to roadless ridges.',
                status: 'Bounded by delivery',
                kind: 'warn',
            },
        ],
    },
    audience: {
        eyebrow: 'Who this is for',
        title: 'Builders first, agencies second',
        paragraphs: [
            'This site is written for someone who would build and deploy a node themselves. That choice shapes everything: the bill of materials sits above the manifesto, the open problems are published rather than hidden, and every claim is either measured or marked unmeasured.',
            'Agencies and land trusts are the second audience, and they need something different — a false-positive rate, an alerting model, and a clear statement that this is not an emergency service. Those pages exist too, and they say honestly that the numbers are not in yet.',
        ],
        fleetLabel: 'One of each node type',
        fleetTotal: 'One of each',
        fleetNote: 'Less than one percent of a single camera install.',
    },
    roadmap: {
        eyebrow: 'Roadmap',
        title: 'What happens next, in order',
        lede: 'Deliberately short. A roadmap with twenty items on it is a wish list.',
        items: [
            {
                when: 'Now',
                title: 'Survive a winter',
                detail: 'Every deployed node still reporting in March. Nothing else matters until this is true.',
                done: false,
            },
            {
                when: 'Next',
                title: 'Publish a detection-time baseline',
                detail: 'One Washington district, five years of incidents, method and raw records alongside.',
                done: false,
            },
            {
                when: 'Next',
                title: 'Ninety days of labelled vision frames',
                detail: 'The false-positive number, measured through fog season rather than asserted.',
                done: false,
            },
            {
                when: 'Then',
                title: 'Ladder topology in the field',
                detail: 'Rebuild one branch so no single node is critical, and prove it by killing one on purpose.',
                done: false,
            },
            {
                when: 'Then',
                title: 'A second branch, built by someone else',
                detail: 'The real test of this site: can a stranger go from landing page to working node without asking us anything.',
                done: false,
            },
            {
                when: 'Done',
                title: 'One branch designed end to end',
                detail: 'Fourteen node positions along Rattlesnake Ridge, with a link budget for every hop. Nothing installed yet — the map shows the plan, not the field.',
                done: true,
            },
        ],
    },
    privacy: {
        eyebrow: 'Privacy',
        title: 'What this site collects',
        items: [
            'No analytics, no cookies, no third-party scripts. By default the map draws node geometry on a blank canvas and makes no tile requests.',
            'Node positions are published deliberately. They are on public land or on land whose owner agreed in writing to the position being public.',
            'Vision nodes point at terrain, not at roads, homes or trailheads. Frames that trigger an alert are kept; the rest are discarded on the node.',
            'Alert subscriptions are opt-in by area, and the list is never shared with an agency that has not been asked for in writing by the subscriber.',
        ],
        policyCta: 'Full privacy policy',
    },
    licensing: {
        eyebrow: 'Licensing',
        title: 'Both halves are open',
        hardwareLead: 'Hardware designs, enclosures and documentation are',
        hardwareTrail:
            ', which is strongly reciprocal — improve a shell and the improvement comes back. Firmware and this site are',
        firmwareTrail: ', so nothing stops a district from running its own fork.',
        repoCta: 'Repository',
        contactCta: 'Contact',
    },
    closing: {
        title: 'The next useful thing is a node that survives March.',
        lede: 'Not a donation, not a mailing list. If you want to help, build one and tell us what broke.',
        primaryCta: 'Build a Node',
        secondaryCta: 'Or take an open problem',
    },
} as const satisfies AboutContent
