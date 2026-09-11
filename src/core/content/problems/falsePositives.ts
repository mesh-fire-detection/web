import type { FalsePositiveState } from '@core/content/types'

export const FALSE_POSITIVE_STATE = {
    measured: false,
    headline: 'Unmeasured. Here is the test plan.',
    plan: [
        'Capture every frame from the two deployed Vision nodes for ninety days, September through November — fog season, which is the hard case.',
        'Hand-label each frame as smoke, no-smoke, or ambiguous. Two labellers, disagreements adjudicated by a third.',
        'Publish the confusion matrix, the threshold curve, and the raw frames alongside it.',
        'Re-run after any model change, and publish both numbers side by side.',
    ],
    alerting: [
        {
            question: 'Who receives an alert?',
            answer: 'Named people who have opted in for a specific geographic area. Nobody is subscribed by default, and no alert goes to an agency that has not asked for it in writing.',
        },
        {
            question: 'Through what channel?',
            answer: 'Push notification and email, both carrying the frame or sensor trace that triggered it, so a person judges the evidence rather than a label.',
        },
        {
            question: 'What happens next?',
            answer: 'A human decides whether to call it in. The network never contacts emergency services directly, and it never will.',
        },
    ],
} as const satisfies FalsePositiveState
