import type { OpenProblemsContent } from '@core/content/types'

export const openProblemsContent = {
    title: 'Open problems',
    eyebrow: 'Unsolved',
    lede: 'Five things we have not figured out, each with its constraints, what has been tried, the current best candidate, and what would have to be true to call it closed.',
    contentsLabel: 'Contents',
    intro: 'This page is unusual and deliberately so. Most hardware projects publish what works and stay quiet about what does not, which reads as confidence and produces spectators. The list below is the actual state of the project. If one of these is your field, you can close it faster than we can.',
    claimCta: 'Claim a problem',
    closing: {
        title: 'How a problem gets closed',
        paragraphs: [
            'Open a discussion on the problem you want. Say what you would try and what you would need. When you have a result — including a negative one — it goes on this page under "what has been tried", with your name on it.',
            'Negative results are worth as much as positive ones here. Half the entries above are things that did not work, and each one saved somebody a month.',
        ],
        notBuildingTitle: 'What we are not building',
        notBuilding:
            'No forum — discussion happens on GitHub, where the people who would answer already are. No donate button until a node has survived a winter outdoors. No detection-time claim until the baseline is measured.',
    },
} as const satisfies OpenProblemsContent
