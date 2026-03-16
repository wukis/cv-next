'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  appendAmbientCallHistoryEntry,
  NETWORK_CALL_ASSIGNMENTS_EVENT,
  type AmbientCallAssignment,
  type AmbientServiceName,
  type EmergencyScenarioKey,
  type TriggerSource,
  useAmbientClusterSnapshot,
} from '@/lib/ambientCluster'

type CallPhase = 'active' | 'holding' | 'winding'

type CallParticipant = {
  id: string
  initials: string
  name: string
  title?: string
  accent: string
  joinDelayMs: number
  leaveAfterHoldMs: number
}

type ParticipantScheduleEntry = {
  included: boolean
  optional: boolean
  joinAt: number
  leaveAt: number
}

type ScriptLine = {
  speakerId: string
  text: string
  variants?: string[]
}

type CallBubble = {
  kind: 'chat' | 'status' | 'hint'
  participantId: string
  initials: string
  text: string
  durationMs?: number
}

type SystemNotice = {
  id: string
  participantId: string
  initials: string
  text: string
  durationMs: number
}

type CallSession = {
  startedAt: number
  holdUntil: number
  scenarioKey: EmergencyScenarioKey
  triggerSource: TriggerSource
  incidentId: string
  cycleStartedAt: number
  scenarioParticipants: {
    core: string[]
    optional: string[]
  }
  participantSchedule: Record<string, ParticipantScheduleEntry>
}

type ScenarioParticipantPool = {
  core: string[]
  optionalPool: Array<{
    id: string
    chance: number
  }>
  minOptional: number
  maxOptional: number
  fullRoomChance?: number
}

const MIN_CALL_DURATION_MS = 60_000
const LEAVE_BUFFER_MS = 5_000
const REJOIN_COOLDOWN_MS = 8_000
const OPTIONAL_JOIN_DELAY_MS = 4_500
const PARTICIPANT_EXIT_ANIMATION_MS = 1_200
const SPEAKER_CHAT_DEBOUNCE_MS = 1_500
const WINDING_FINAL_OWNER_CHAT_DEBOUNCE_MS = 8_500
const SYSTEM_NOTICE_FADE_MS = 280
const CALL_PANEL_WIDTH_REM = 19
const MANUAL_REPEAT_WINDOW_MS = 45_000
const WINDING_FIRST_DROP_DELAY_MS = 8_000
const WINDING_DROP_SPACING_MS = 6_500
const WINDING_FINAL_OWNER_LINGER_MS = 11_000
const FINAL_OWNER_ID = 'jp'

const PARTICIPANTS: CallParticipant[] = [
  {
    id: 'jp',
    initials: 'JP',
    name: 'Jonas',
    title: 'Checkout',
    accent: 'rgba(248, 113, 113, 0.94)',
    joinDelayMs: 650,
    leaveAfterHoldMs: 35_000,
  },
  {
    id: 'sr',
    initials: 'SR',
    name: 'Sara',
    title: 'SRE',
    accent: 'rgba(56, 189, 248, 0.92)',
    joinDelayMs: 900,
    leaveAfterHoldMs: 28_000,
  },
  {
    id: 'be',
    initials: 'BE',
    name: 'Ben',
    title: 'Basket',
    accent: 'rgba(196, 181, 253, 0.94)',
    joinDelayMs: 1_900,
    leaveAfterHoldMs: 21_000,
  },
  {
    id: 'db',
    initials: 'DB',
    name: 'Dana',
    title: 'Data',
    accent: 'rgba(99, 102, 241, 0.92)',
    joinDelayMs: 2_800,
    leaveAfterHoldMs: 14_000,
  },
  {
    id: 'ed',
    initials: 'ED',
    name: 'Eli',
    title: 'Edge',
    accent: 'rgba(20, 184, 166, 0.92)',
    joinDelayMs: 3_700,
    leaveAfterHoldMs: 7_000,
  },
  {
    id: 'ic',
    initials: 'IC',
    name: 'Mira',
    title: 'Ops',
    accent: 'rgba(251, 191, 36, 0.96)',
    joinDelayMs: 4_700,
    leaveAfterHoldMs: 0,
  },
  {
    id: 'au',
    initials: 'AU',
    name: 'Aria',
    title: 'Auth',
    accent: 'rgba(52, 211, 153, 0.94)',
    joinDelayMs: 5_300,
    leaveAfterHoldMs: 12_000,
  },
  {
    id: 'ca',
    initials: 'CA',
    name: 'Cato',
    title: 'Catalog',
    accent: 'rgba(251, 191, 36, 0.92)',
    joinDelayMs: 5_900,
    leaveAfterHoldMs: 10_000,
  },
  {
    id: 'wh',
    initials: 'WH',
    name: 'Wes',
    title: 'Warehouse',
    accent: 'rgba(249, 115, 22, 0.94)',
    joinDelayMs: 6_500,
    leaveAfterHoldMs: 11_000,
  },
  {
    id: 'td',
    initials: 'TD',
    name: 'Theo',
    title: 'Tech Dir',
    accent: 'rgba(129, 140, 248, 0.94)',
    joinDelayMs: 7_100,
    leaveAfterHoldMs: 6_000,
  },
  {
    id: 'md',
    initials: 'MD',
    name: 'Mara',
    title: 'Managing Dir',
    accent: 'rgba(244, 114, 182, 0.94)',
    joinDelayMs: 7_800,
    leaveAfterHoldMs: 3_000,
  },
]

const PARTICIPANT_LOOKUP = Object.fromEntries(
  PARTICIPANTS.map((participant) => [participant.id, participant]),
) as Record<string, CallParticipant>

const SCENARIO_PARTICIPANT_POOLS: Record<
  EmergencyScenarioKey,
  ScenarioParticipantPool
> = {
  failover: {
    core: ['jp', 'sr', 'ed', 'be', 'ic'],
    optionalPool: [
      { id: 'au', chance: 0.62 },
      { id: 'db', chance: 0.34 },
      { id: 'ca', chance: 0.28 },
      { id: 'wh', chance: 0.26 },
      { id: 'td', chance: 0.58 },
      { id: 'md', chance: 0.24 },
    ],
    minOptional: 1,
    maxOptional: 3,
    fullRoomChance: 0.16,
  },
  dbDown: {
    core: ['jp', 'db', 'be', 'au', 'ic'],
    optionalPool: [
      { id: 'sr', chance: 0.82 },
      { id: 'wh', chance: 0.32 },
      { id: 'ed', chance: 0.22 },
      { id: 'td', chance: 0.72 },
      { id: 'md', chance: 0.46 },
    ],
    minOptional: 1,
    maxOptional: 4,
    fullRoomChance: 0.22,
  },
  cacheReload: {
    core: ['jp', 'ca', 'be', 'sr', 'ic'],
    optionalPool: [
      { id: 'ed', chance: 0.58 },
      { id: 'au', chance: 0.22 },
      { id: 'wh', chance: 0.18 },
      { id: 'td', chance: 0.18 },
      { id: 'md', chance: 0.04 },
    ],
    minOptional: 0,
    maxOptional: 2,
    fullRoomChance: 0.05,
  },
  queueFull: {
    core: ['jp', 'wh', 'be', 'sr', 'ic'],
    optionalPool: [
      { id: 'db', chance: 0.62 },
      { id: 'ed', chance: 0.26 },
      { id: 'au', chance: 0.24 },
      { id: 'td', chance: 0.42 },
      { id: 'md', chance: 0.16 },
    ],
    minOptional: 1,
    maxOptional: 3,
    fullRoomChance: 0.12,
  },
}

const SCENARIO_CHECKS: Record<
  EmergencyScenarioKey,
  Partial<Record<string, string>>
> = {
  failover: {
    jp: 'checkout traffic',
    sr: 'cluster health',
    be: 'orders flow',
    ed: 'edge ingress',
    db: 'db metrics',
    au: 'auth tokens',
    td: 'service impact',
    md: 'business pulse',
    ic: 'room sync',
  },
  dbDown: {
    jp: 'recovering orders',
    sr: 'retries + apm',
    be: 'order writes',
    db: 'primary db',
    au: 'login writes',
    td: 'risk view',
    md: 'customer impact',
    ic: 'incident flow',
  },
  cacheReload: {
    jp: 'checkout traffic',
    sr: 'redis health',
    be: 'order reads',
    ca: 'catalog cache',
    ed: 'edge cache',
    td: 'platform view',
    ic: 'bridge flow',
  },
  queueFull: {
    jp: 'order recovery',
    sr: 'worker cluster',
    be: 'async orders',
    db: 'write pressure',
    wh: 'stock jobs',
    td: 'delivery risk',
    md: 'ops pulse',
    ic: 'incident flow',
  },
}

const SCENARIO_PANEL_ASSIGNMENTS: Record<
  EmergencyScenarioKey,
  Partial<Record<string, AmbientServiceName>>
> = {
  failover: {
    jp: 'checkout',
    sr: 'edge',
    be: 'basket',
    ed: 'edge',
    db: 'warehouse',
    au: 'auth',
    td: 'checkout',
    md: 'edge',
    ic: 'auth',
  },
  dbDown: {
    jp: 'checkout',
    sr: 'auth',
    be: 'basket',
    db: 'warehouse',
    au: 'auth',
    td: 'checkout',
    md: 'checkout',
    ic: 'checkout',
  },
  cacheReload: {
    jp: 'checkout',
    sr: 'catalog',
    be: 'basket',
    ca: 'catalog',
    ed: 'edge',
    td: 'catalog',
    ic: 'catalog',
  },
  queueFull: {
    jp: 'checkout',
    sr: 'warehouse',
    be: 'basket',
    db: 'warehouse',
    wh: 'warehouse',
    td: 'checkout',
    md: 'warehouse',
    ic: 'checkout',
  },
}

const RESTART_REACTIONS: Record<EmergencyScenarioKey, ScriptLine[]> = {
  failover: [
    {
      speakerId: 'jp',
      text: 'Oh come on, checkout had literally just stopped yelling at me.',
    },
    {
      speakerId: 'sr',
      text: 'Yep, that is not a fluke. Something just fell over again.',
    },
    {
      speakerId: 'ic',
      text: 'Cool cool, nobody hang up. We are apparently still doing this.',
    },
  ],
  dbDown: [
    {
      speakerId: 'jp',
      text: 'Oh crap, writes just went weird again.',
    },
    {
      speakerId: 'db',
      text: 'Well that is rude. Primary looks grumpy again.',
    },
    {
      speakerId: 'ic',
      text: 'Night shift classic. Keep the room open.',
    },
  ],
  cacheReload: [
    {
      speakerId: 'ca',
      text: 'Ah no, cache is cold again. Product reads are faceplanting.',
    },
    {
      speakerId: 'jp',
      text: 'I was so ready to trust checkout again for like ten seconds.',
    },
    {
      speakerId: 'sr',
      text: 'Yep, this thing is doing the fake recovery bit again.',
    },
  ],
  queueFull: [
    {
      speakerId: 'wh',
      text: 'Ah great, queue is backing up again.',
    },
    {
      speakerId: 'jp',
      text: 'Nope, still not letting traffic feel normal yet.',
    },
    {
      speakerId: 'ic',
      text: 'Everybody stay put, the queue is doing queue nonsense again.',
    },
  ],
}

const MANUAL_REPEAT_REACTIONS: ScriptLine[] = [
  {
    speakerId: 'td',
    text: 'What is happening?',
  },
  {
    speakerId: 'ic',
    text: 'One after another... really?',
  },
  {
    speakerId: 'jp',
    text: 'Okay, who is farming emergencies now?',
  },
  {
    speakerId: 'sr',
    text: 'I was literally about to close the tabs.',
  },
]

const CALL_SCRIPT: Record<
  EmergencyScenarioKey,
  {
    active: ScriptLine[]
    holding: ScriptLine[]
    winding: ScriptLine[]
  }
> = {
  failover: {
    active: [
      {
        speakerId: 'jp',
        text: 'Keeping traffic on checkout.',
        variants: ['Watching checkout traffic.', 'Holding checkout steady.'],
      },
      {
        speakerId: 'sr',
        text: 'Checking ready replicas.',
      },
      {
        speakerId: 'be',
        text: 'Errors are easing off.',
        variants: [
          'Pushing a tiny hotfix now.',
          'Quick revert is rolling.',
        ],
      },
      {
        speakerId: 'ed',
        text: 'Target pool still looks thin.',
      },
      {
        speakerId: 'au',
        text: 'Checking auth.',
      },
      {
        speakerId: 'db',
        text: 'DB looks calm.',
      },
      {
        speakerId: 'td',
        text: 'What the hell is going on?',
      },
      {
        speakerId: 'md',
        text: 'How can I help without being noise?',
      },
      {
        speakerId: 'ic',
        text: 'Keep edge close.',
      },
      {
        speakerId: 'ic',
        text: 'Hold the room a minute.',
        variants: [
          'Wait till the hotfix settles.',
          'Give the rollback a minute.',
        ],
      },
    ],
    holding: [
      {
        speakerId: 'jp',
        text: 'Latency is settling.',
        variants: [
          'Checkout looks steadier now.',
          'Traffic is calming down.',
          'I want one more quiet minute.',
          'Just waiting to be sure it holds.',
        ],
      },
      {
        speakerId: 'sr',
        text: 'Dashboard looks clean.',
      },
      {
        speakerId: 'be',
        text: 'Orders normal again.',
      },
    ],
    winding: [
      {
        speakerId: 'ic',
        text: 'Looks okay. People can drop.',
      },
      {
        speakerId: 'jp',
        text: 'I am staying on checkout.',
        variants: [
          'I am still on checkout.',
          'Staying with checkout a bit longer.',
          'I just want to be sure this sticks.',
          'Not leaving until checkout stays boring.',
        ],
      },
    ],
  },
  dbDown: {
    active: [
      {
        speakerId: 'jp',
        text: 'Checkout writes are stuck.',
        variants: [
          'Checkout writes are still jammed.',
          'Writes are stuck on checkout.',
        ],
      },
      {
        speakerId: 'db',
        text: 'On primary. Lag is up.',
      },
      {
        speakerId: 'au',
        text: 'Checking auth writes.',
        variants: [
          'Auth is okay. Retrying pipeline now.',
          'Checking if we forgot the auth charts.',
        ],
      },
      {
        speakerId: 'be',
        text: 'Order traces point to writes.',
      },
      {
        speakerId: 'sr',
        text: 'Latency is only bad on writes.',
      },
      {
        speakerId: 'ic',
        text: 'Keeping SRE close.',
      },
      {
        speakerId: 'td',
        text: 'What the hell broke this time?',
      },
      {
        speakerId: 'md',
        text: 'How can I help from my side?',
      },
      {
        speakerId: 'ic',
        text: 'Leave the bridge up after recovery.',
      },
    ],
    holding: [
      {
        speakerId: 'db',
        text: 'Writes are back. Lag still there.',
        variants: [
          'Writes are back. Hotfix is in.',
          'Writes are back. Revert helped.',
        ],
      },
      {
        speakerId: 'jp',
        text: 'Checkout recovering. Waiting a minute.',
        variants: [
          'Checkout is back, just waiting.',
          'Checkout is steadier. Giving it a minute.',
          'I want another clean minute on checkout.',
          'Waiting to be sure writes stay boring.',
        ],
      },
      {
        speakerId: 'sr',
        text: 'Error rate is flat.',
      },
    ],
    winding: [
      {
        speakerId: 'ic',
        text: 'Shrink the room. Checkout and data stay.',
      },
      {
        speakerId: 'jp',
        text: 'I am last off once writes are boring.',
        variants: [
          'I am staying until writes are boring.',
          'Last off once checkout writes are calm.',
          'I want to see one more quiet stretch on writes.',
          'Not hopping off until checkout writes stay flat.',
        ],
      },
    ],
  },
  cacheReload: {
    active: [
      {
        speakerId: 'jp',
        text: 'Checkout is okay. Feels cachey.',
        variants: [
          'Checkout is fine. Smells like cache.',
          'Checkout looks okay. This feels like cache misses.',
        ],
      },
      {
        speakerId: 'ca',
        text: 'Checking miss rate.',
        variants: [
          'Looks like we forgot to deploy charts.',
          'Retriggering cache pipeline now.',
        ],
      },
      {
        speakerId: 'ed',
        text: 'Edge looks fine.',
      },
      {
        speakerId: 'be',
        text: 'Order reads are okay.',
      },
      {
        speakerId: 'sr',
        text: 'Redis says warm-up only.',
        variants: [
          'Charts look off. Checking deploy.',
          'Pipeline rerun is in flight.',
        ],
      },
      {
        speakerId: 'ic',
        text: 'Pull edge if needed.',
      },
      {
        speakerId: 'td',
        text: 'Okay, what is actually on fire?',
      },
      {
        speakerId: 'ic',
        text: 'Give hit rate a minute.',
      },
    ],
    holding: [
      {
        speakerId: 'sr',
        text: 'Hit rate climbing.',
      },
      {
        speakerId: 'jp',
        text: 'Latency is coming down.',
        variants: [
          'Checkout latency is easing.',
          'P95 is coming back down.',
          'I still want a quiet minute on checkout.',
          'Waiting to be sure the misses do not bounce back.',
        ],
      },
      {
        speakerId: 'be',
        text: 'Orders look boring again.',
      },
    ],
    winding: [
      {
        speakerId: 'ic',
        text: 'Looks fine. People can peel away.',
      },
      {
        speakerId: 'jp',
        text: 'I am staying on checkout a bit longer.',
        variants: [
          'Staying with checkout a bit longer.',
          'I want another quiet minute on checkout.',
          'I just want to make sure traffic stays boring.',
          'Holding here until checkout stays flat.',
        ],
      },
    ],
  },
  queueFull: {
    active: [
      {
        speakerId: 'jp',
        text: 'Checkout is okay. Orders are lagging.',
        variants: [
          'Checkout is stable. Orders are behind.',
          'Front door is okay. Orders are lagging.',
        ],
      },
      {
        speakerId: 'wh',
        text: 'Queue depth is ugly.',
        variants: [
          'Retriggering worker pipeline.',
          'Looks like charts never landed.',
        ],
      },
      {
        speakerId: 'sr',
        text: 'Worker health looks rough.',
      },
      {
        speakerId: 'be',
        text: 'Orders APM is mostly fine.',
        variants: [
          'Quick hotfix is building now.',
          'Might just revert the last fix.',
        ],
      },
      {
        speakerId: 'db',
        text: 'DB is fine.',
      },
      {
        speakerId: 'ic',
        text: 'Can pull data in if needed.',
      },
      {
        speakerId: 'td',
        text: 'What blew up in the queue?',
      },
      {
        speakerId: 'md',
        text: 'I can run cover if needed.',
      },
      {
        speakerId: 'ic',
        text: 'Keep the room open a bit.',
      },
    ],
    holding: [
      {
        speakerId: 'sr',
        text: 'Backlog draining.',
      },
      {
        speakerId: 'jp',
        text: 'Checkout normal. Waiting on queue tail.',
        variants: [
          'Checkout looks normal. Waiting on the tail.',
          'Traffic is back. Queue tail still needs time.',
          'Checkout is okay. I just want the tail gone.',
          'Waiting to be sure orders fully catch up.',
        ],
      },
      {
        speakerId: 'be',
        text: 'Delayed jobs are clearing.',
      },
    ],
    winding: [
      {
        speakerId: 'ic',
        text: 'Start dropping people. Checkout stays.',
      },
      {
        speakerId: 'jp',
        text: 'I am last off once orders stop lagging.',
        variants: [
          'I am staying until orders stop lagging.',
          'Last off once the order tail clears.',
          'I want to see the order tail fully flatten first.',
          'Not leaving until orders feel boring again.',
        ],
      },
    ],
  },
}

function getShouldRenderEmergencyCall() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.innerWidth >= 1100 && window.innerHeight >= 760
}

function getNow() {
  if (typeof performance !== 'undefined') {
    return performance.now()
  }

  return Date.now()
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function softenAccent(accent: string, alpha: string) {
  return accent.replace(/0\.\d+\)/, `${alpha})`)
}

function resolveScriptLineText(line: ScriptLine, variationSeed: number) {
  const options = [line.text, ...(line.variants ?? [])]
  return options[Math.abs(variationSeed) % options.length]
}

function createSystemNotice(
  participant: CallParticipant,
  text: string,
  durationMs = 2_400,
): SystemNotice {
  return {
    id: `system-${Date.now()}-${participant.id}-${text}`,
    participantId: participant.id,
    initials: participant.initials,
    text,
    durationMs,
  }
}

function getCallRowLayout(tileCount: number) {
  if (tileCount <= 1) {
    return [1]
  }

  if (tileCount === 2) {
    return [2]
  }

  if (tileCount === 3) {
    return [3]
  }

  if (tileCount === 4) {
    return [2, 2]
  }

  if (tileCount === 5) {
    return [2, 3]
  }

  if (tileCount === 6) {
    return [3, 3]
  }

  if (tileCount === 7) {
    return [3, 4]
  }

  if (tileCount === 8) {
    return [4, 4]
  }

  const firstRow = Math.ceil(tileCount / 2)
  return [firstRow, tileCount - firstRow]
}

function getBubbleTypography(text: string) {
  if (text.length > 95) {
    return {
      fontSizePx: 8,
      lineHeight: '0.9rem',
      heightRem: 2.7,
    }
  }

  if (text.length > 72) {
    return {
      fontSizePx: 8.5,
      lineHeight: '0.95rem',
      heightRem: 2.62,
    }
  }

  return {
    fontSizePx: 9,
    lineHeight: '1rem',
    heightRem: 2.55,
  }
}

function createEmergencyIncidentId(scenarioKey: EmergencyScenarioKey) {
  const scenarioCode = scenarioKey.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase()
  const randomCode = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${scenarioCode || 'EMG'}-${randomCode}`
}

function chooseScenarioParticipants(scenarioKey: EmergencyScenarioKey) {
  const scenario = SCENARIO_PARTICIPANT_POOLS[scenarioKey]
  const shuffledPool = [...scenario.optionalPool].sort(
    () => Math.random() - 0.5,
  )

  if (scenario.fullRoomChance && Math.random() < scenario.fullRoomChance) {
    return {
      core: scenario.core,
      optional: shuffledPool.map((entry) => entry.id),
    }
  }

  const pickedOptional = shuffledPool.filter(
    (entry) => Math.random() < entry.chance,
  )

  if (pickedOptional.length < scenario.minOptional) {
    shuffledPool.forEach((entry) => {
      if (
        pickedOptional.length < scenario.minOptional &&
        !pickedOptional.some((picked) => picked.id === entry.id)
      ) {
        pickedOptional.push(entry)
      }
    })
  }

  return {
    core: scenario.core,
    optional: pickedOptional
      .slice(0, scenario.maxOptional)
      .map((entry) => entry.id),
  }
}

function mergeScenarioParticipants(
  currentParticipants: CallSession['scenarioParticipants'] | undefined,
  nextParticipants: CallSession['scenarioParticipants'],
) {
  if (!currentParticipants) {
    return nextParticipants
  }

  return {
    core: Array.from(
      new Set([...currentParticipants.core, ...nextParticipants.core]),
    ),
    optional: Array.from(
      new Set([...currentParticipants.optional, ...nextParticipants.optional]),
    ),
  }
}

function buildParticipantSchedule(
  scenarioParticipants: CallSession['scenarioParticipants'],
  cycleStartedAt: number,
  holdUntil: number,
  previousSchedule?: Record<string, ParticipantScheduleEntry>,
) {
  const includedIds = new Set([
    ...scenarioParticipants.core,
    ...scenarioParticipants.optional,
  ])
  const includedParticipants = PARTICIPANTS.filter((participant) =>
    includedIds.has(participant.id),
  )
  const leaveOrder = [...includedParticipants].sort((left, right) => {
    if (left.id === FINAL_OWNER_ID) {
      return 1
    }

    if (right.id === FINAL_OWNER_ID) {
      return -1
    }

    return left.leaveAfterHoldMs - right.leaveAfterHoldMs
  })
  const leaveOffsetsByParticipantId = new Map<string, number>()
  let previousLeaveOffset = 0

  leaveOrder.forEach((participant, index) => {
    const minimumOffset =
      index === 0
        ? WINDING_FIRST_DROP_DELAY_MS
        : previousLeaveOffset + WINDING_DROP_SPACING_MS
    const targetOffset =
      participant.id === FINAL_OWNER_ID
        ? Math.max(
            participant.leaveAfterHoldMs,
            minimumOffset + WINDING_FINAL_OWNER_LINGER_MS,
          )
        : Math.max(participant.leaveAfterHoldMs, minimumOffset)

    leaveOffsetsByParticipantId.set(participant.id, targetOffset)
    previousLeaveOffset = targetOffset
  })

  return Object.fromEntries(
    PARTICIPANTS.map((participant, index) => {
      const previousEntry = previousSchedule?.[participant.id]
      const included = includedIds.has(participant.id)

      if (!included) {
        return [
          participant.id,
          {
            included: false,
            optional: false,
            joinAt: cycleStartedAt,
            leaveAt: cycleStartedAt,
          },
        ]
      }

      const isOptional = scenarioParticipants.optional.includes(participant.id)
      const optionalOffset = isOptional ? OPTIONAL_JOIN_DELAY_MS : 0
      const rejoinOffset =
        previousEntry && previousEntry.leaveAt <= cycleStartedAt
          ? REJOIN_COOLDOWN_MS + index * 850
          : 0

      const joinAt =
        previousEntry &&
        previousEntry.included &&
        previousEntry.joinAt <= cycleStartedAt &&
        previousEntry.leaveAt > cycleStartedAt
          ? previousEntry.joinAt
          : Math.max(
              cycleStartedAt + participant.joinDelayMs + optionalOffset,
              (previousEntry?.leaveAt ?? cycleStartedAt) + rejoinOffset,
            )

      return [
        participant.id,
        {
          included: true,
          optional: isOptional,
          joinAt,
          leaveAt:
            holdUntil +
            (leaveOffsetsByParticipantId.get(participant.id) ??
              participant.leaveAfterHoldMs),
        },
      ]
    }),
  ) as Record<string, ParticipantScheduleEntry>
}

export default function EmergencyCallOverlay() {
  const cluster = useAmbientClusterSnapshot()
  const [shouldRender, setShouldRender] = useState(getShouldRenderEmergencyCall)
  const [isDark, setIsDark] = useState(true)
  const [session, setSession] = useState<CallSession | null>(null)
  const [now, setNow] = useState(0)
  const [displayedBubble, setDisplayedBubble] = useState<CallBubble | null>(
    null,
  )
  const [transientBubble, setTransientBubble] = useState<CallBubble | null>(
    null,
  )
  const [activeSystemNotice, setActiveSystemNotice] = useState<SystemNotice | null>(
    null,
  )
  const [isSystemNoticeVisible, setIsSystemNoticeVisible] = useState(false)
  const [systemNoticeVersion, setSystemNoticeVersion] = useState(0)
  const previousEmergencyRef = useRef<{
    state: typeof cluster.emergencyState
    scenarioKey: EmergencyScenarioKey | null
  }>({
    state: 'normal',
    scenarioKey: null,
  })
  const previousConnectedIdsRef = useRef<string[]>([])
  const lastBubbleByParticipantRef = useRef<Record<string, string>>({})
  const lastBubbleShownAtRef = useRef<Record<string, number>>({})
  const displayedBubbleTimeoutRef = useRef<number | null>(null)
  const lastHistorySignatureRef = useRef<string | null>(null)
  const systemNoticeQueueRef = useRef<SystemNotice[]>([])
  const activeSystemNoticeTimeoutRef = useRef<number | null>(null)
  const systemNoticeFadeTimeoutRef = useRef<number | null>(null)
  const participantTileRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const previousParticipantRectsRef = useRef<Record<string, DOMRect>>({})
  const lastEmergencyEndedAtRef = useRef<number | null>(null)
  const consecutiveManualEmergencyCountRef = useRef(0)

  const checkScreenSize = useCallback(() => {
    setShouldRender(getShouldRenderEmergencyCall())
  }, [])

  const enqueueSystemNotice = useCallback((notice: SystemNotice) => {
    const lastQueuedNotice =
      systemNoticeQueueRef.current[systemNoticeQueueRef.current.length - 1]
    const isDuplicateOfActive =
      activeSystemNotice?.participantId === notice.participantId &&
      activeSystemNotice.text === notice.text
    const isDuplicateOfQueued =
      lastQueuedNotice?.participantId === notice.participantId &&
      lastQueuedNotice.text === notice.text

    if (isDuplicateOfActive || isDuplicateOfQueued) {
      return
    }

    systemNoticeQueueRef.current = [...systemNoticeQueueRef.current, notice]
    setSystemNoticeVersion((version) => version + 1)
  }, [activeSystemNotice])

  useEffect(() => {
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [checkScreenSize])

  useEffect(() => {
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    syncTheme()

    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!session) {
      return
    }

    const intervalId = window.setInterval(() => {
      setNow(getNow())
    }, 240)

    return () => window.clearInterval(intervalId)
  }, [session])

  useEffect(() => {
    if (!session) {
      lastBubbleByParticipantRef.current = {}
      lastBubbleShownAtRef.current = {}
      lastHistorySignatureRef.current = null
      systemNoticeQueueRef.current = []
      previousParticipantRectsRef.current = {}

      if (displayedBubbleTimeoutRef.current !== null) {
        window.clearTimeout(displayedBubbleTimeoutRef.current)
        displayedBubbleTimeoutRef.current = null
      }

      if (activeSystemNoticeTimeoutRef.current !== null) {
        window.clearTimeout(activeSystemNoticeTimeoutRef.current)
        activeSystemNoticeTimeoutRef.current = null
      }

      if (systemNoticeFadeTimeoutRef.current !== null) {
        window.clearTimeout(systemNoticeFadeTimeoutRef.current)
        systemNoticeFadeTimeoutRef.current = null
      }

      const timeoutId = window.setTimeout(() => {
        setActiveSystemNotice(null)
        setIsSystemNoticeVisible(false)
        setDisplayedBubble(null)
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }
  }, [session])

  useEffect(() => {
    if (!session || cluster.emergencyState !== 'normal') {
      return
    }

    const latestLeaveAt = Object.values(session.participantSchedule).reduce(
      (latest, schedule) =>
        schedule.included ? Math.max(latest, schedule.leaveAt) : latest,
      session.holdUntil,
    )
    const latestEndAt = latestLeaveAt + LEAVE_BUFFER_MS
    if (now >= latestEndAt) {
      const timeoutId = window.setTimeout(() => {
        setSession(null)
        setNow(0)
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }
  }, [cluster.emergencyState, now, session])

  const currentTime = session ? now || getNow() : 0

  const phase: CallPhase | null = useMemo(() => {
    if (!session) {
      return null
    }

    if (cluster.emergencyState !== 'normal') {
      return 'active'
    }

    if (currentTime < session.holdUntil) {
      return 'holding'
    }

    return 'winding'
  }, [cluster.emergencyState, currentTime, session])

  const participants = useMemo(() => {
    if (!session || !phase) {
      return []
    }

    return PARTICIPANTS.map((participant) => {
      const schedule = session.participantSchedule[participant.id]
      if (!schedule?.included) {
        return null
      }

      const joinedAt = schedule.joinAt
      const leaveAt = schedule.leaveAt
      const hasJoined = currentTime >= joinedAt
      const isConnected = hasJoined && currentTime < leaveAt
      const isVisible =
        hasJoined &&
        (phase !== 'winding' ||
          currentTime < leaveAt + PARTICIPANT_EXIT_ANIMATION_MS)
      const isJoining = hasJoined && currentTime - joinedAt < 1_600
      const isDropping =
        phase === 'winding' &&
        currentTime >= leaveAt - 1_800 &&
        currentTime < leaveAt + PARTICIPANT_EXIT_ANIMATION_MS

      return {
        ...participant,
        hasJoined,
        isConnected,
        isVisible,
        isJoining,
        isDropping,
        leaveAt,
        isOptional: schedule.optional,
      }
    }).filter(
      (
        participant,
      ): participant is CallParticipant & {
        hasJoined: boolean
        isConnected: boolean
        isVisible: boolean
        isJoining: boolean
        isDropping: boolean
        leaveAt: number
        isOptional: boolean
      } => Boolean(participant?.hasJoined),
    )
  }, [currentTime, phase, session])

  const connectedParticipants = useMemo(
    () => participants.filter((participant) => participant.isConnected),
    [participants],
  )

  const visibleParticipants = useMemo(
    () => participants.filter((participant) => participant.isVisible),
    [participants],
  )

  useLayoutEffect(() => {
    const nextRects = Object.fromEntries(
      visibleParticipants
        .map((participant) => {
          const node = participantTileRefs.current[participant.id]
          return node ? ([participant.id, node.getBoundingClientRect()] as const) : null
        })
        .filter((entry): entry is readonly [string, DOMRect] => entry !== null),
    ) as Record<string, DOMRect>

    visibleParticipants.forEach((participant) => {
      const node = participantTileRefs.current[participant.id]
      const previousRect = previousParticipantRectsRef.current[participant.id]
      const nextRect = nextRects[participant.id]

      if (!node || !previousRect || !nextRect) {
        return
      }

      const deltaX = previousRect.left - nextRect.left
      const deltaY = previousRect.top - nextRect.top

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        return
      }

      node.animate(
        [
          {
            transform: `translate(${deltaX}px, ${deltaY}px)`,
          },
          {
            transform: 'translate(0, 0)',
          },
        ],
        {
          duration: 460,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        },
      )
    })

    previousParticipantRectsRef.current = nextRects
  }, [visibleParticipants])

  const connectedParticipantIds = useMemo(
    () => connectedParticipants.map((participant) => participant.id),
    [connectedParticipants],
  )

  useEffect(() => {
    if (!session || phase !== 'winding' || visibleParticipants.length > 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setSession(null)
      setNow(0)
      setTransientBubble(null)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [phase, session, visibleParticipants.length])

  useEffect(() => {
    const previous = previousEmergencyRef.current
    const scenarioChanged = cluster.scenarioKey !== previous.scenarioKey
    const enteredIncident =
      cluster.emergencyState !== 'normal' &&
      (previous.state === 'normal' || scenarioChanged)

    if (previous.state !== 'normal' && cluster.emergencyState === 'normal') {
      lastEmergencyEndedAtRef.current = getNow()
    }

    if (enteredIncident && cluster.scenarioKey) {
      const scenarioKey = cluster.scenarioKey
      const sessionNow = getNow()
      const isFreshIncident = previous.state === 'normal'
      const isRapidManualRepeat =
        cluster.triggerSource === 'button-click' &&
        session !== null &&
        isFreshIncident &&
        lastEmergencyEndedAtRef.current !== null &&
        sessionNow - lastEmergencyEndedAtRef.current <= MANUAL_REPEAT_WINDOW_MS
      const nextIncidentId =
        session && !isFreshIncident
          ? session.incidentId
          : createEmergencyIncidentId(scenarioKey)
      const timeoutId = window.setTimeout(() => {
        if (isRapidManualRepeat) {
          const reactionIndex = Math.min(
            consecutiveManualEmergencyCountRef.current,
            MANUAL_REPEAT_REACTIONS.length - 1,
          )
          const seededReaction = MANUAL_REPEAT_REACTIONS[reactionIndex]
          const availableReaction =
            connectedParticipantIds.includes(seededReaction.speakerId)
              ? seededReaction
              : MANUAL_REPEAT_REACTIONS.find((line) =>
                  connectedParticipantIds.includes(line.speakerId),
                ) ?? seededReaction
          const reactionParticipant =
            PARTICIPANT_LOOKUP[availableReaction.speakerId] ??
            connectedParticipants[0]

          if (reactionParticipant) {
            setTransientBubble((current) => {
              if (
                lastBubbleByParticipantRef.current[reactionParticipant.id] ===
                  availableReaction.text ||
                (current?.participantId === reactionParticipant.id &&
                  current.text === availableReaction.text)
              ) {
                return current
              }

              return {
                kind: 'chat',
                participantId: reactionParticipant.id,
                initials: reactionParticipant.initials,
                text: availableReaction.text,
                durationMs: 3_400,
              }
            })
          }
        } else if (session && previous.state !== 'normal') {
          const reactionPool = RESTART_REACTIONS[scenarioKey]
          const seededReaction =
            reactionPool[Math.floor(sessionNow / 1000) % reactionPool.length]
          const availableReaction =
            reactionPool.find((line) =>
              connectedParticipantIds.includes(line.speakerId),
            ) ?? seededReaction
          const reactionParticipant =
            PARTICIPANT_LOOKUP[availableReaction.speakerId] ??
            connectedParticipants[0]

          if (reactionParticipant) {
            setTransientBubble((current) => {
              if (
                lastBubbleByParticipantRef.current[reactionParticipant.id] ===
                  availableReaction.text ||
                (current?.participantId === reactionParticipant.id &&
                  current.text === availableReaction.text)
              ) {
                return current
              }

              return {
                kind: 'chat',
                participantId: reactionParticipant.id,
                initials: reactionParticipant.initials,
                text: availableReaction.text,
                durationMs: 3_200,
              }
            })
          }
        }

        if (cluster.triggerSource === 'button-click') {
          consecutiveManualEmergencyCountRef.current = isRapidManualRepeat
            ? consecutiveManualEmergencyCountRef.current + 1
            : 0
        } else {
          consecutiveManualEmergencyCountRef.current = 0
        }

        if (isFreshIncident) {
          appendAmbientCallHistoryEntry({
            id: `call-${nextIncidentId}-started`,
            kind: 'status',
            participantId: 'system',
            initials: 'SYS',
            speakerLabel: 'system',
            text: 'Emergency call started.',
            timestamp: Date.now(),
            scenarioKey,
            incidentId: nextIncidentId,
          })
          appendAmbientCallHistoryEntry({
            id: `call-${nextIncidentId}-waiting`,
            kind: 'status',
            participantId: 'system',
            initials: 'SYS',
            speakerLabel: 'system',
            text: 'Waiting for participants...',
            timestamp: Date.now() + 1,
            scenarioKey,
            incidentId: nextIncidentId,
          })
        }

        setSession((current) => {
          const chosenScenarioParticipants =
            chooseScenarioParticipants(scenarioKey)
          const scenarioParticipants =
            current && previous.state !== 'normal'
              ? mergeScenarioParticipants(
                  current.scenarioParticipants,
                  chosenScenarioParticipants,
                )
              : chosenScenarioParticipants
          const holdUntil = Math.max(
            current?.holdUntil ?? 0,
            sessionNow + MIN_CALL_DURATION_MS,
          )

          return {
            startedAt: current?.startedAt ?? sessionNow,
            holdUntil,
            scenarioKey,
            triggerSource:
              cluster.triggerSource ?? current?.triggerSource ?? null,
            incidentId: current && !isFreshIncident ? current.incidentId : nextIncidentId,
            cycleStartedAt: sessionNow,
            scenarioParticipants,
            participantSchedule: buildParticipantSchedule(
              scenarioParticipants,
              sessionNow,
              holdUntil,
              current?.participantSchedule,
            ),
          }
        })
      }, 0)

      previousEmergencyRef.current = {
        state: cluster.emergencyState,
        scenarioKey: cluster.scenarioKey,
      }

      return () => window.clearTimeout(timeoutId)
    }

    previousEmergencyRef.current = {
      state: cluster.emergencyState,
      scenarioKey: cluster.scenarioKey,
    }
  }, [
    cluster.emergencyState,
    cluster.scenarioKey,
    cluster.triggerSource,
    connectedParticipantIds,
    connectedParticipants,
    session,
  ])

  const pendingOptionalParticipant = useMemo(() => {
    if (!session || phase !== 'active') {
      return null
    }

    const nextOptionalId = session.scenarioParticipants.optional.find(
      (participantId) => {
        const schedule = session.participantSchedule[participantId]
        return schedule?.included && currentTime < schedule.joinAt
      },
    )

    return nextOptionalId ? PARTICIPANT_LOOKUP[nextOptionalId] : null
  }, [currentTime, phase, session])

  const finalOwnerParticipant = useMemo(
    () =>
      connectedParticipants.find(
        (participant) => participant.id === FINAL_OWNER_ID,
      ) ?? null,
    [connectedParticipants],
  )

  const scriptLine = useMemo(() => {
    if (!session || !phase || connectedParticipants.length === 0) {
      return null
    }

    if (
      phase === 'winding' &&
      connectedParticipants.length === 1 &&
      finalOwnerParticipant
    ) {
      return {
        speakerId: finalOwnerParticipant.id,
        text: 'I am staying on checkout a little longer, then I will write the post-mortem.',
      }
    }

    const script = CALL_SCRIPT[session.scenarioKey][phase]
    const elapsedBase =
      phase === 'winding'
        ? Math.max(0, currentTime - session.holdUntil)
        : Math.max(0, currentTime - session.cycleStartedAt)
    const step = Math.floor(elapsedBase / 6_200)
    const variationBase =
      step + Math.floor((session.startedAt + session.cycleStartedAt) / 1000)
    const rotated = script
      .map((line, index) => ({
        index,
        line: {
          ...line,
          text: resolveScriptLineText(line, variationBase + index),
        },
      }))
      .slice(step % script.length)
      .concat(
        script
          .map((line, index) => ({
            index,
            line: {
              ...line,
              text: resolveScriptLineText(line, variationBase + index),
            },
          }))
          .slice(0, step % script.length),
      )
    const optionalHint = pendingOptionalParticipant
      ? ` Maybe ${pendingOptionalParticipant.title?.toLowerCase() ?? pendingOptionalParticipant.name.toLowerCase()} joins if this keeps leaning that way.`
      : ''
    const connectedEntries = rotated.filter(({ line }) =>
      connectedParticipants.some(
        (participant) => participant.id === line.speakerId,
      ),
    )
    const getPreviousSpeakerText = (scriptIndex: number, speakerId: string) => {
      for (let offset = 1; offset < script.length; offset += 1) {
        const previousIndex =
          (scriptIndex - offset + script.length) % script.length
        const previousLine = {
          ...script[previousIndex],
          text: resolveScriptLineText(
            script[previousIndex],
            variationBase + previousIndex,
          ),
        }

        if (previousLine.speakerId === speakerId) {
          return `${previousLine.text}${optionalHint}`
        }
      }

      return null
    }

    return (
      connectedEntries.find(({ line, index }) => {
        const previousSpeakerText = getPreviousSpeakerText(
          index,
          line.speakerId,
        )
        return previousSpeakerText !== `${line.text}${optionalHint}`
      })?.line ??
      connectedEntries[0]?.line ??
      script[0]
    )
  }, [
    connectedParticipants,
    currentTime,
    finalOwnerParticipant,
    pendingOptionalParticipant,
    phase,
    session,
  ])

  const speaker = useMemo(() => {
    if (!scriptLine) {
      return connectedParticipants[0] ?? null
    }

    return (
      connectedParticipants.find(
        (participant) => participant.id === scriptLine.speakerId,
      ) ??
      connectedParticipants[0] ??
      null
    )
  }, [connectedParticipants, scriptLine])

  useEffect(() => {
    const currentConnectedIds = connectedParticipants.map(
      (participant) => participant.id,
    )
    const previousConnectedIds = previousConnectedIdsRef.current

    if (!session) {
      previousConnectedIdsRef.current = []
      return
    }

    const joinedId = currentConnectedIds.find(
      (participantId) => !previousConnectedIds.includes(participantId),
    )
    const leftId = previousConnectedIds.find(
      (participantId) => !currentConnectedIds.includes(participantId),
    )

    if (joinedId) {
      const participant = PARTICIPANT_LOOKUP[joinedId]
      const text = `${participant.title ?? participant.name} joined the call.`
      const timeoutId = window.setTimeout(() => {
        enqueueSystemNotice(createSystemNotice(participant, text))
      }, 0)

      previousConnectedIdsRef.current = currentConnectedIds
      return () => window.clearTimeout(timeoutId)
    }

    if (leftId) {
      const participant = PARTICIPANT_LOOKUP[leftId]
      const text = `${participant.title ?? participant.name} left the call.`
      const timeoutId = window.setTimeout(() => {
        enqueueSystemNotice(createSystemNotice(participant, text))
      }, 0)

      previousConnectedIdsRef.current = currentConnectedIds
      return () => window.clearTimeout(timeoutId)
    }

    previousConnectedIdsRef.current = currentConnectedIds
  }, [connectedParticipants, enqueueSystemNotice, session])

  useEffect(() => {
    if (!transientBubble) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setTransientBubble(null)
    }, transientBubble.durationMs ?? 2_200)

    return () => window.clearTimeout(timeoutId)
  }, [transientBubble])

  useEffect(() => {
    if (activeSystemNotice || systemNoticeQueueRef.current.length === 0) {
      return
    }

    const [nextNotice, ...remainingQueue] = systemNoticeQueueRef.current
    systemNoticeQueueRef.current = remainingQueue
    setActiveSystemNotice(nextNotice)
    setIsSystemNoticeVisible(true)
  }, [activeSystemNotice, systemNoticeVersion])

  useEffect(() => {
    if (!activeSystemNotice) {
      return
    }

    activeSystemNoticeTimeoutRef.current = window.setTimeout(() => {
      setIsSystemNoticeVisible(false)

      systemNoticeFadeTimeoutRef.current = window.setTimeout(() => {
        setActiveSystemNotice(null)
        systemNoticeFadeTimeoutRef.current = null
      }, SYSTEM_NOTICE_FADE_MS)

      activeSystemNoticeTimeoutRef.current = null
    }, activeSystemNotice.durationMs)

    return () => {
      if (activeSystemNoticeTimeoutRef.current !== null) {
        window.clearTimeout(activeSystemNoticeTimeoutRef.current)
        activeSystemNoticeTimeoutRef.current = null
      }

      if (systemNoticeFadeTimeoutRef.current !== null) {
        window.clearTimeout(systemNoticeFadeTimeoutRef.current)
        systemNoticeFadeTimeoutRef.current = null
      }
    }
  }, [activeSystemNotice])

  const nextBubble: CallBubble | null = useMemo(() => {
    if (transientBubble) {
      return transientBubble
    }

    if (!scriptLine) {
      return null
    }

    return {
      kind: pendingOptionalParticipant ? 'hint' : 'chat',
      participantId: speaker?.id ?? scriptLine.speakerId,
      initials: speaker?.initials ?? scriptLine.speakerId.toUpperCase(),
      text: pendingOptionalParticipant
        ? `${scriptLine.text} Maybe ${pendingOptionalParticipant.title?.toLowerCase() ?? pendingOptionalParticipant.name.toLowerCase()} joins if this keeps leaning that way.`
        : scriptLine.text,
    }
  }, [pendingOptionalParticipant, scriptLine, speaker, transientBubble])
  useEffect(() => {
    if (displayedBubbleTimeoutRef.current !== null) {
      window.clearTimeout(displayedBubbleTimeoutRef.current)
      displayedBubbleTimeoutRef.current = null
    }

    if (!nextBubble) {
      const timeoutId = window.setTimeout(() => {
        setDisplayedBubble(null)
      }, 0)
      displayedBubbleTimeoutRef.current = timeoutId

      return () => {
        if (displayedBubbleTimeoutRef.current !== null) {
          window.clearTimeout(displayedBubbleTimeoutRef.current)
          displayedBubbleTimeoutRef.current = null
        }
      }
    }

    const isSameDisplayedBubble =
      displayedBubble?.participantId === nextBubble.participantId &&
      displayedBubble.text === nextBubble.text &&
      displayedBubble.kind === nextBubble.kind

    if (isSameDisplayedBubble) {
      return
    }

    const lastShownAt =
      lastBubbleShownAtRef.current[nextBubble.participantId] ?? 0
    const shouldDebounceSpeaker =
      displayedBubble?.participantId === nextBubble.participantId &&
      displayedBubble.text !== nextBubble.text
    const speakerDebounceMs =
      phase === 'winding' && nextBubble.participantId === FINAL_OWNER_ID
        ? WINDING_FINAL_OWNER_CHAT_DEBOUNCE_MS
        : SPEAKER_CHAT_DEBOUNCE_MS
    const delay = shouldDebounceSpeaker
      ? Math.max(0, speakerDebounceMs - (getNow() - lastShownAt))
      : 0

    const timeoutId = window.setTimeout(() => {
      setDisplayedBubble(nextBubble)
      lastBubbleByParticipantRef.current[nextBubble.participantId] =
        nextBubble.text
      lastBubbleShownAtRef.current[nextBubble.participantId] = getNow()
      displayedBubbleTimeoutRef.current = null
    }, delay)

    displayedBubbleTimeoutRef.current = timeoutId

    return () => {
      if (displayedBubbleTimeoutRef.current !== null) {
        window.clearTimeout(displayedBubbleTimeoutRef.current)
        displayedBubbleTimeoutRef.current = null
      }
    }
  }, [displayedBubble, nextBubble, phase])

  useEffect(() => {
    if (!displayedBubble || !session) {
      return
    }

    const speakerLabel =
      displayedBubble.kind === 'status'
        ? 'system'
        : (PARTICIPANT_LOOKUP[displayedBubble.participantId]?.title ??
          PARTICIPANT_LOOKUP[displayedBubble.participantId]?.name ??
          displayedBubble.initials)
    const historySignature = `${session.incidentId}:${displayedBubble.kind}:${displayedBubble.participantId}:${displayedBubble.text}`

    if (lastHistorySignatureRef.current === historySignature) {
      return
    }

    lastHistorySignatureRef.current = historySignature

    appendAmbientCallHistoryEntry({
      id: `call-${Date.now()}-${displayedBubble.participantId}`,
      kind: displayedBubble.kind,
      participantId: displayedBubble.participantId,
      initials: displayedBubble.initials,
      speakerLabel,
      text: displayedBubble.text,
      timestamp: Date.now(),
      scenarioKey: session.scenarioKey,
      incidentId: session.incidentId,
    })
  }, [displayedBubble, session])

  useEffect(() => {
    if (!activeSystemNotice || !session) {
      return
    }

    const historySignature = `${session.incidentId}:status:${activeSystemNotice.participantId}:${activeSystemNotice.text}`
    if (lastHistorySignatureRef.current === historySignature) {
      return
    }

    lastHistorySignatureRef.current = historySignature

    appendAmbientCallHistoryEntry({
      id: activeSystemNotice.id,
      kind: 'status',
      participantId: activeSystemNotice.participantId,
      initials: activeSystemNotice.initials,
      speakerLabel: 'system',
      text: activeSystemNotice.text,
      timestamp: Date.now(),
      scenarioKey: session.scenarioKey,
      incidentId: session.incidentId,
    })
  }, [activeSystemNotice, session])

  const activeSpeakerId = displayedBubble
    ? displayedBubble.participantId
    : (speaker?.id ?? null)
  const bubbleParticipant = displayedBubble
    ? PARTICIPANT_LOOKUP[displayedBubble.participantId] ?? speaker ?? null
    : speaker
  const bubbleTypography = displayedBubble
    ? getBubbleTypography(displayedBubble.text)
    : getBubbleTypography('')

  const liveAssignments = useMemo<AmbientCallAssignment[]>(() => {
    if (!session) {
      return []
    }

    return connectedParticipants
      .map((participant) => {
        const serviceName =
          SCENARIO_PANEL_ASSIGNMENTS[session.scenarioKey][participant.id]
        if (!serviceName) {
          return null
        }

        return {
          participantId: participant.id,
          initials: participant.initials,
          accent: participant.accent,
          serviceName,
          label:
            SCENARIO_CHECKS[session.scenarioKey][participant.id] ??
            'cluster view',
          isSpeaker: participant.id === activeSpeakerId,
          isDropping: participant.isDropping,
        }
      })
      .filter(
        (assignment): assignment is AmbientCallAssignment =>
          assignment !== null,
      )
  }, [activeSpeakerId, connectedParticipants, session])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const assignments =
      shouldRender && cluster.focusMode === 'preview' ? liveAssignments : []

    window.dispatchEvent(
      new CustomEvent<AmbientCallAssignment[]>(NETWORK_CALL_ASSIGNMENTS_EVENT, {
        detail: assignments,
      }),
    )

    return () => {
      window.dispatchEvent(
        new CustomEvent<AmbientCallAssignment[]>(
          NETWORK_CALL_ASSIGNMENTS_EVENT,
          { detail: [] },
        ),
      )
    }
  }, [cluster.focusMode, liveAssignments, shouldRender])

  const visible =
    shouldRender && cluster.focusMode === 'preview' && !!session && !!phase

  if (!visible || !session || !phase) {
    return null
  }

  const hasVisibleParticipants = visibleParticipants.length > 0
  const tileCount = Math.max(1, visibleParticipants.length)
  const rowLayout = getCallRowLayout(tileCount)
  const maxRowCount = Math.max(...rowLayout)
  const participantRows = rowLayout.reduce(
    (rows, rowCount) => {
      const nextIndex = rows.flat().length
      rows.push(visibleParticipants.slice(nextIndex, nextIndex + rowCount))
      return rows
    },
    [] as Array<typeof visibleParticipants>,
  )
  const isDenseCallGrid = tileCount > 6 || maxRowCount >= 4
  const gridColumnGapRem = maxRowCount >= 4 ? 0.48 : isDenseCallGrid ? 0.55 : 0.75
  const gridRowGapRem = isDenseCallGrid ? 0.7 : 0.92
  const participantContentWidthRem = CALL_PANEL_WIDTH_REM - 3.2
  const tileOuterSizeRem = Math.min(
    isDenseCallGrid ? 3.7 : 4.35,
    (participantContentWidthRem -
      Math.max(0, maxRowCount - 1) * gridColumnGapRem) /
      maxRowCount,
  )
  const tileInnerInsetRem = tileOuterSizeRem <= 3.6 ? 0.22 : isDenseCallGrid ? 0.24 : 0.32
  const tileCoreSizeRem = tileOuterSizeRem * 0.74
  const tileInitialsFontSizePx = Math.round(tileCoreSizeRem * 4.1)
  const participantStageMinHeightRem =
    rowLayout.length * tileOuterSizeRem +
    Math.max(0, rowLayout.length - 1) * gridRowGapRem
  const accentColor =
    phase === 'active'
      ? isDark
        ? 'rgba(248, 113, 113, 0.8)'
        : 'rgba(220, 38, 38, 0.78)'
      : phase === 'holding'
        ? isDark
          ? 'rgba(250, 204, 21, 0.82)'
          : 'rgba(180, 83, 9, 0.78)'
        : isDark
          ? 'rgba(74, 222, 128, 0.8)'
          : 'rgba(22, 163, 74, 0.76)'

  return (
    <div className="pointer-events-none fixed bottom-5 left-5 z-10 hidden origin-bottom-left scale-[0.8] xl:block">
      <div
        className="overflow-hidden rounded-[1.4rem] border shadow-2xl backdrop-blur-xl"
        style={{
          width: `${CALL_PANEL_WIDTH_REM}rem`,
          backgroundColor: isDark
            ? 'rgba(8, 12, 20, 0.9)'
            : 'rgba(255, 255, 255, 0.88)',
          borderColor: isDark
            ? 'rgba(148, 163, 184, 0.18)'
            : 'rgba(148, 163, 184, 0.24)',
          boxShadow: `0 0 0 1px ${accentColor}, 0 24px 60px ${
            isDark ? 'rgba(2, 6, 23, 0.44)' : 'rgba(15, 23, 42, 0.14)'
          }`,
        }}
        aria-hidden="true"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-3.5 py-3">
          <div>
            <div
              className="font-mono text-[10px] uppercase tracking-[0.22em]"
              style={{ color: accentColor }}
            >
              Emergency call
            </div>
          </div>
          <div className="text-right">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{
                color: isDark
                  ? 'rgba(248, 250, 252, 0.92)'
                  : 'rgba(15, 23, 42, 0.9)',
              }}
            >
              {formatDuration(currentTime - session.startedAt)}
            </div>
          </div>
        </div>

        <div className="px-3.5 py-3">
          <div
            className="relative flex items-center justify-center rounded-[1rem] border px-2 py-1"
            style={{
              minHeight: `${participantStageMinHeightRem}rem`,
              backgroundColor: isDark
                ? 'rgba(15, 23, 42, 0.28)'
                : 'rgba(248, 250, 252, 0.82)',
              borderColor: isDark
                ? 'rgba(148, 163, 184, 0.12)'
                : 'rgba(148, 163, 184, 0.16)',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center transition-all duration-300"
              style={{
                opacity: hasVisibleParticipants ? 0 : 1,
                transform: hasVisibleParticipants
                  ? 'scale(0.98)'
                  : 'scale(1)',
                color: isDark
                  ? 'rgba(226, 232, 240, 0.72)'
                  : 'rgba(71, 85, 105, 0.82)',
              }}
            >
              <div className="space-y-2">
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: accentColor }}
                >
                  Bridge opening
                </div>
                <div className="font-mono text-[12px]">
                  Waiting for participants ...
                </div>
              </div>
            </div>

            <div
              className="relative flex w-full flex-col justify-center transition-all duration-300"
              style={{
                rowGap: `${gridRowGapRem}rem`,
                opacity: hasVisibleParticipants ? 1 : 0,
                transform: hasVisibleParticipants
                  ? 'translateY(0) scale(1)'
                  : 'translateY(3px) scale(0.985)',
              }}
            >
              {participantRows.map((rowParticipants, rowIndex) => (
                <div
                  key={`row-${rowIndex}-${rowParticipants.length}`}
                  className="flex justify-center"
                  style={{
                    columnGap: `${gridColumnGapRem}rem`,
                  }}
                >
                  {rowParticipants.map((participant) => {
                    const isSpeaker = participant.id === activeSpeakerId
                    const accentTone = participant.isDropping
                      ? isDark
                        ? 'rgba(148, 163, 184, 0.68)'
                        : 'rgba(100, 116, 139, 0.72)'
                      : participant.accent
                    const isFullyLeaving =
                      phase === 'winding' && currentTime >= participant.leaveAt

                    return (
                      <div
                        key={participant.id}
                        ref={(node) => {
                          participantTileRefs.current[participant.id] = node
                        }}
                        className="flex flex-col items-center text-center will-change-transform"
                      >
                        <div
                          className="transition-all duration-500"
                          style={{
                            opacity: isFullyLeaving
                              ? 0
                              : participant.isDropping
                                ? 0.72
                                : 1,
                            transform: isFullyLeaving
                              ? 'scale(0.78)'
                              : participant.isJoining
                                ? 'scale(0.94)'
                                : 'scale(1)',
                          }}
                        >
                          <div
                            className="relative flex items-center justify-center"
                            style={{
                              height: `${tileOuterSizeRem}rem`,
                              width: `${tileOuterSizeRem}rem`,
                            }}
                          >
                            <div
                              className={`absolute inset-0 rounded-full transition-all duration-500 ${
                                isSpeaker || participant.isJoining
                                  ? 'animate-pulse'
                                  : ''
                              }`}
                              style={{
                                background: `radial-gradient(circle, ${softenAccent(
                                  participant.accent,
                                  isSpeaker ? '0.28' : '0.18',
                                )}, transparent 68%)`,
                                transform: isFullyLeaving
                                  ? 'scale(0.86)'
                                  : isSpeaker
                                    ? 'scale(1.3)'
                                    : 'scale(1.02)',
                                opacity: isFullyLeaving
                                  ? 0.18
                                  : isSpeaker
                                    ? 1
                                    : 0.82,
                              }}
                            />
                            <div
                              className="absolute rounded-full border transition-all duration-500"
                              style={{
                                inset: `${tileInnerInsetRem}rem`,
                                borderColor: accentTone,
                                opacity: isSpeaker ? 1 : 0.84,
                                boxShadow: isSpeaker
                                  ? `0 0 0 1px ${accentTone}, 0 0 30px ${softenAccent(
                                      participant.accent,
                                      '0.34',
                                    )}`
                                  : 'none',
                              }}
                            />
                            <div
                              className="relative flex items-center justify-center rounded-full border font-mono font-semibold transition-all duration-500"
                              style={{
                                height: `${tileCoreSizeRem}rem`,
                                width: `${tileCoreSizeRem}rem`,
                                backgroundColor: isDark
                                  ? 'rgba(15, 23, 42, 0.94)'
                                  : 'rgba(255, 255, 255, 0.96)',
                                borderColor: softenAccent(accentTone, '0.78'),
                                color: isDark
                                  ? 'rgba(248, 250, 252, 0.96)'
                                  : 'rgba(15, 23, 42, 0.92)',
                                fontSize: `${tileInitialsFontSizePx}px`,
                              }}
                            >
                              {participant.initials}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 min-h-[2.1rem]">
            <div
              className="rounded-[0.9rem] border px-2.5 py-1.5 transition-all duration-300"
              style={{
                opacity: activeSystemNotice && isSystemNoticeVisible ? 1 : 0,
                transform:
                  activeSystemNotice && isSystemNoticeVisible
                    ? 'translateY(0) scale(1)'
                    : 'translateY(6px) scale(0.98)',
                backgroundColor: isDark
                  ? 'rgba(30, 41, 59, 0.3)'
                  : 'rgba(255, 255, 255, 0.68)',
                borderColor: isDark
                  ? 'rgba(148, 163, 184, 0.12)'
                  : 'rgba(148, 163, 184, 0.14)',
                color: isDark
                  ? 'rgba(191, 219, 254, 0.82)'
                  : 'rgba(71, 85, 105, 0.84)',
              }}
            >
              {activeSystemNotice ? (
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border font-mono text-[8px] font-semibold uppercase"
                    style={{
                      backgroundColor: isDark
                        ? 'rgba(15, 23, 42, 0.94)'
                        : 'rgba(248, 250, 252, 0.96)',
                      borderColor: isDark
                        ? 'rgba(148, 163, 184, 0.22)'
                        : 'rgba(148, 163, 184, 0.2)',
                      color: isDark
                        ? 'rgba(191, 219, 254, 0.9)'
                        : 'rgba(71, 85, 105, 0.86)',
                    }}
                  >
                    {activeSystemNotice.initials}
                  </span>
                  <span className="line-clamp-1 block min-w-0 font-mono text-[9px] uppercase tracking-[0.12em]">
                    {activeSystemNotice.text}
                  </span>
                </div>
              ) : (
                <div className="h-[1.1rem]" />
              )}
            </div>
          </div>

          <div
            className="mt-1 h-[3.75rem] rounded-[0.95rem] border px-2 py-1.5"
            style={{
              backgroundColor: isDark
                ? 'rgba(15, 23, 42, 0.44)'
                : 'rgba(248, 250, 252, 0.82)',
              borderColor: isDark
                ? 'rgba(148, 163, 184, 0.08)'
                : 'rgba(148, 163, 184, 0.14)',
            }}
          >
            {displayedBubble ? (
              <div className="grid h-full grid-cols-[1.55rem_minmax(0,1fr)] items-center gap-2">
                <span
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border font-mono text-[8px] font-semibold uppercase"
                  style={{
                    backgroundColor: bubbleParticipant?.accent ?? accentColor,
                    borderColor: softenAccent(
                      bubbleParticipant?.accent ?? accentColor,
                      '0.5',
                    ),
                    color: 'rgba(15, 23, 42, 0.94)',
                    boxShadow: `0 0 0 1px ${softenAccent(
                      bubbleParticipant?.accent ?? accentColor,
                      '0.22',
                    )}`,
                  }}
                >
                  {displayedBubble.initials}
                </span>
                <div className="flex h-full min-w-0 items-center">
                  <div
                    className="flex w-full items-center rounded-[0.95rem] px-2.5"
                    style={{
                      height: `${bubbleTypography.heightRem}rem`,
                      backgroundColor: isDark
                        ? 'rgba(30, 41, 59, 0.64)'
                        : 'rgba(255, 255, 255, 0.7)',
                      border: `1px solid ${
                        isDark
                          ? 'rgba(148, 163, 184, 0.16)'
                          : 'rgba(148, 163, 184, 0.14)'
                      }`,
                      color: isDark
                        ? 'rgba(226, 232, 240, 0.84)'
                        : 'rgba(30, 41, 59, 0.84)',
                    }}
                  >
                    <span
                      className="line-clamp-2 block min-w-0 tracking-[0.01em]"
                      style={{
                        fontSize: `${bubbleTypography.fontSizePx}px`,
                        lineHeight: bubbleTypography.lineHeight,
                      }}
                    >
                      {displayedBubble.text}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
