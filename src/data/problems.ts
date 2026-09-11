export type ProblemStatus = 'open' | 'in-progress' | 'has-candidate'

export type OpenProblem = {
  slug: string
  title: string
  question: string
  status: ProblemStatus
  /** Hard boundaries any solution has to live inside. */
  constraints: readonly string[]
  tried: readonly { approach: string; outcome: string }[]
  candidate?: { name: string; detail: string; blocker: string }
  /** What would have to be true to call this closed. */
  closesWhen: string
  help: string
}

export const PROBLEMS: readonly OpenProblem[] = [
  {
    slug: 'detection-baseline',
    title: 'No detection-time baseline',
    question: 'Reduce detection time from what, exactly?',
    status: 'in-progress',
    constraints: [
      'The baseline has to be a measured number for one named district, not a national average.',
      'It has to come from records we can cite, not from a vendor deck.',
      'Time is measured from ignition to first dispatched unit, not to first report.',
    ],
    tried: [
      {
        approach: 'National statistics on average time to containment',
        outcome: 'Wrong quantity. Containment time is dominated by response, not detection.',
      },
      {
        approach: 'ALERTWildfire camera timestamps against incident logs',
        outcome:
          'Promising, but camera coverage is biased towards places that already detect quickly.',
      },
    ],
    candidate: {
      name: 'Public records request, one Washington fire district',
      detail:
        'Ignition-time estimates and dispatch timestamps for every wildland incident in a five-year window, for a single district in the Cascade foothills.',
      blocker: 'Request drafted, not yet filed. Needs someone who has done one of these before.',
    },
    closesWhen:
      'A published median detection latency for one named district, with the method and the raw records alongside it.',
    help: 'If you have filed a public records request with a Washington fire district, we want twenty minutes of your time.',
  },
  {
    slug: 'roadless-delivery',
    title: 'Roadless delivery',
    question: 'How do you get a node to a ridge with no road and no trail?',
    status: 'open',
    constraints: [
      'A node with its mast weighs roughly 2.5 kg.',
      'Placement accuracy of about 50 m is enough; the mast is what has to be precise.',
      'Anything airborne has to stay inside Part 107 or it is not a solution for volunteers.',
      'No aircraft over designated wilderness.',
    ],
    tried: [
      {
        approach: 'Carry it in on foot',
        outcome:
          'Works, and it is what the current fourteen nodes used. Does not scale past a day hike from a trailhead.',
      },
      {
        approach: 'Drone drop with a release hook',
        outcome:
          'Payload is inside the range of a heavy-lift hobby airframe, but the mast is not, and beyond-line-of-sight is the whole point.',
      },
    ],
    closesWhen:
      'One node placed more than 5 km from the nearest road by a method any volunteer can repeat in a day.',
    help: 'Backcountry logistics, packhorse outfitters, and Part 107 operators all have pieces of this.',
  },
  {
    slug: 'no-critical-node',
    title: 'No node should be critical',
    question: 'What branch topology survives losing any single node?',
    status: 'has-candidate',
    constraints: [
      'Every node has to reach the internet through at least two disjoint paths.',
      'Redundancy cannot come from doubling the node count — that breaks the cost goal.',
      'LoRa duty-cycle limits cap how much chatter the redundancy can cost.',
    ],
    tried: [
      {
        approach: 'Simple chain from the cellular node',
        outcome:
          'What is deployed today, and exactly the failure the map shows: Mailbox Spur went down and orphaned Mailbox Bowl behind it.',
      },
      {
        approach: 'Full mesh between all Base nodes',
        outcome: 'Airtime collapses past about eight nodes on the long-fast preset.',
      },
    ],
    candidate: {
      name: 'Ladder topology — paired Base nodes with cross-links',
      detail:
        'Base nodes deployed in pairs on facing ridges, each pair cross-linked, so any single loss leaves a path. Costs about 40% more Base nodes, no more Cellular nodes.',
      blocker:
        'Unsimulated. Nobody has run it against real terrain to check whether the cross-links close at all.',
    },
    closesWhen:
      'A topology where killing any single node in simulation leaves every remaining node reachable, at under 1.5× the node count of a chain.',
    help: 'This is a graph problem with a propagation constraint. It wants someone who enjoys both.',
  },
  {
    slug: 'sensor-selection',
    title: 'Cheap smoke sensing',
    question: 'What is the cheapest sensor that detects a real fire before a camera would?',
    status: 'open',
    constraints: [
      'Under $60 per node for the whole sensing head.',
      'Has to survive five years outdoors with no cleaning.',
      'Average draw has to fit a 5000 mAh cell and one small panel.',
      'It only earns its place if it beats the Vision node to the alert.',
    ],
    tried: [
      {
        approach: 'Cheap MQ-series gas sensors',
        outcome: 'Heater current alone blows the power budget, and they drift badly outdoors.',
      },
      {
        approach: 'Particulate sensing with the SPS30',
        outcome:
          'Power and price work. Whether ground-level PM rises early enough, and far enough from the fire, is untested.',
      },
    ],
    closesWhen:
      'A controlled burn where a sensor node alerts before a vision node with the same fire in frame.',
    help: 'Anyone with access to a prescribed burn and permission to put hardware near it.',
  },
  {
    slug: 'false-positives',
    title: 'False positives',
    question: 'Fog, dust, morning mist, a neighbour burning brush. How often are we wrong?',
    status: 'open',
    constraints: [
      'A fire district will not take a meeting without a measured rate.',
      'The cost of a false negative is not symmetric with a false positive, and the threshold has to say so out loud.',
      'Whatever we measure has to be reproducible from published data.',
    ],
    tried: [
      {
        approach: 'Public wildfire smoke image datasets',
        outcome:
          'Reported accuracy is high and meaningless — the negatives are clear skies, not the fog bank that actually fools you.',
      },
    ],
    closesWhen:
      'Ninety days of continuous capture from two deployed Vision nodes, hand-labelled, published with the false-positive and false-negative rate and the confusion matrix.',
    help: 'Labelling is the bottleneck, and it is work anyone can do.',
  },
]

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
      answer:
        'Named people who have opted in for a specific geographic area. Nobody is subscribed by default, and no alert goes to an agency that has not asked for it in writing.',
    },
    {
      question: 'Through what channel?',
      answer:
        'Push notification and email, both carrying the frame or sensor trace that triggered it, so a person judges the evidence rather than a label.',
    },
    {
      question: 'What happens next?',
      answer:
        'A human decides whether to call it in. The network never contacts emergency services directly, and it never will.',
    },
  ],
}
