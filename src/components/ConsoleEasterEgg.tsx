'use client'

import { useEffect } from 'react'
import { createBoxLineWithBorders, createEmptyBoxLine } from '@/lib/consoleBox'

type IncidentScenario = {
  service: string
  severity: 'SEV-1' | 'SEV-2'
  alert: string
  likelyCause: string
  metric: string
}

type JonasEmergencyApi = {
  status: () => {
    channel: string
    service: string
    severity: IncidentScenario['severity']
    metric: string
    likelyCause: string
  }
  fixProd: () => string
  blame: () => string
  rollback: () => string
  hire: () => string
}

const INCIDENT_SCENARIOS: IncidentScenario[] = [
  {
    service: 'checkout-api',
    severity: 'SEV-2',
    alert: 'p95 latency climbed high enough to develop opinions',
    likelyCause: 'someone taught the happy path about edge cases',
    metric: 'p95 4.8s',
  },
  {
    service: 'payment-router',
    severity: 'SEV-1',
    alert: 'retry storm detected near the card authorization path',
    likelyCause: 'an upstream gateway is having a character-building day',
    metric: 'retry rate 37%',
  },
  {
    service: 'cart-pipeline',
    severity: 'SEV-2',
    alert: 'queue backlog reached the “this feels personal” threshold',
    likelyCause: 'one worker discovered synchronous I/O and got attached',
    metric: 'queue depth 18,240',
  },
  {
    service: 'promo-engine',
    severity: 'SEV-2',
    alert: 'discount logic is free-styling in production',
    likelyCause: 'a coupon path escaped unit-test containment',
    metric: 'error rate 12.4%',
  },
]

const OPENING_LINES = [
  'bridge opened: senior engineers pretending this is fine',
  'incident room established: vibes low, observability high',
  'war room online: someone already asked who touched prod',
  'emergency comms active: caffeine levels rising normally',
]

const JONAS_LINES = [
  'jonas: give me traces, not vibes.',
  'jonas: if we need three dashboards to explain it, we need fewer dashboards.',
  'jonas: okay, who taught the queue to grow feelings?',
  'jonas: let me guess, the hot path got “just one more condition”.',
]

const ENGINEER_LINES = [
  'ops: I have logs, metrics, and one deeply unhelpful screenshot.',
  'backend: I can reproduce it locally, which feels threatening.',
  'on-call: status page drafted, dignity still pending.',
  'payments: gateway says everything is healthy, which is suspicious.',
]

const RESOLUTION_LINES = [
  'resolution: rate limited the noisy path, added guardrails, everyone exhaled.',
  'resolution: reverted the spicy code path and the graphs stopped screaming.',
  'resolution: cut alert noise, fixed the bottleneck, preserved weekend plans.',
  'resolution: one tiny config change, twelve minutes of dramatic storytelling.',
]

const FIX_RESPONSES = [
  'Applied calm, traces, and one annoyingly effective config tweak.',
  'Reduced alert noise by 80% and everyone suddenly remembered how to breathe.',
  'Fixed. Root cause: optimism in the hot path.',
  'Patched the pipeline. The queue has returned to being just a queue.',
]

const BLAME_RESPONSES = [
  'Officially: shared responsibility. Emotionally: one “small refactor”.',
  'Blame points to edge cases, timing, and human confidence.',
  'Root cause analysis says “systems are social creatures”.',
  'No single villain. Just a committee of bad timing.',
]

const ROLLBACK_RESPONSES = [
  'Rollback complete. Production has stopped exploring new emotions.',
  'Reverted safely. Graphs are boring again, as they should be.',
  'Rollback executed. Pager volume now back to polite levels.',
  'We have returned to the last known good reality.',
]

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function formatLogTime(baseDate: Date, minutesOffset: number): string {
  const date = new Date(baseDate.getTime() + minutesOffset * 60_000)
  return date.toTimeString().slice(0, 8)
}

export function ConsoleEasterEgg() {
  useEffect(() => {
    const incident = pickRandom(INCIDENT_SCENARIOS)
    const baseDate = new Date()
    baseDate.setMinutes(baseDate.getMinutes() - randomInt(12, 28))
    baseDate.setSeconds(randomInt(0, 59))

    const channel = `#incident-${incident.service}`
    const participants = randomInt(4, 8)
    const openingLine = pickRandom(OPENING_LINES)
    const jonasLine = pickRandom(JONAS_LINES)
    const engineerLine = pickRandom(ENGINEER_LINES)
    const resolutionLine = pickRandom(RESOLUTION_LINES)

    const incidentCard = `
%c┌─────────────────────────────────────────────────────────────┐
${createEmptyBoxLine()}
${createBoxLineWithBorders(`incident-room://${incident.service}`)}
${createBoxLineWithBorders(`${incident.severity} · ${incident.alert}`)}
${createBoxLineWithBorders(`metric: ${incident.metric}`)}
${createBoxLineWithBorders(`cause?: ${incident.likelyCause}`)}
${createEmptyBoxLine()}
${createBoxLineWithBorders(openingLine)}
${createEmptyBoxLine()}
└─────────────────────────────────────────────────────────────┘`

    const transcript = [
      `${formatLogTime(baseDate, 0)} pagerduty: ${incident.severity} triggered for ${incident.service}`,
      `${formatLogTime(baseDate, 1)} ops: ${engineerLine.replace(/^ops: /, '')}`,
      `${formatLogTime(baseDate, 2)} ${jonasLine}`,
      `${formatLogTime(baseDate, 4)} tracing: found one request path doing way too much “just in case”`,
      `${formatLogTime(baseDate, 6)} metrics: ${incident.metric}, but emotionally worse`,
      `${formatLogTime(baseDate, 8)} incident-bot: ${participants} engineers in ${channel}, 1 blaming DNS out of habit`,
      `${formatLogTime(baseDate, 11)} ${resolutionLine}`,
    ].join('\n')

    const commandMenu = `
%cEmergency comms tools:

  jonas.status()   -> incident snapshot
  jonas.fixProd()  -> pretend remediation
  jonas.blame()    -> tasteful root-cause theater
  jonas.rollback() -> restore temporal stability
  jonas.hire()     -> contact the calm person in the bridge

%cIf you opened DevTools, you are now legally part of the incident review.
`

    console.log(
      incidentCard,
      'color: #94a3b8; font-family: monospace; font-size: 12px; line-height: 1.4;',
    )

    console.log(
      '%c' + transcript,
      `color: ${incident.severity === 'SEV-1' ? '#f97316' : '#22c55e'}; font-family: monospace; font-size: 11px; line-height: 1.6;`,
    )

    console.log(
      commandMenu,
      'color: #a78bfa; font-family: monospace; font-size: 11px;',
      'color: #94a3b8; font-family: monospace; font-size: 11px;',
    )

    if (typeof window !== 'undefined') {
      const windowWithJonas = window as Window & { jonas?: JonasEmergencyApi }
      const jonasApi: JonasEmergencyApi = {
        status: () => {
          const snapshot = {
            channel,
            service: incident.service,
            severity: incident.severity,
            metric: incident.metric,
            likelyCause: incident.likelyCause,
          }

          console.table(snapshot)
          return snapshot
        },
        fixProd: () => {
          const response = pickRandom(FIX_RESPONSES)
          console.log(
            '%c' + response,
            'color: #22c55e; font-family: monospace;',
          )
          return response
        },
        blame: () => {
          const response = pickRandom(BLAME_RESPONSES)
          console.log(
            '%c' + response,
            'color: #f59e0b; font-family: monospace;',
          )
          return response
        },
        rollback: () => {
          const response = pickRandom(ROLLBACK_RESPONSES)
          console.log(
            '%c' + response,
            'color: #38bdf8; font-family: monospace;',
          )
          return response
        },
        hire: () => {
          console.log(
            '%cOpening email... hopefully before the next alert.',
            'color: #0ea5e9; font-family: monospace;',
          )
          window.open(
            'mailto:jonas@petrik.dev?subject=Found your emergency comms easter egg!',
            '_blank',
          )
          return 'Email client opened. Incident morale improved.'
        },
      }

      windowWithJonas.jonas = jonasApi

      console.log(
        '%cTry: jonas.status(), jonas.fixProd(), jonas.blame(), jonas.rollback(), or jonas.hire()',
        'color: #c084fc; font-size: 11px; font-family: monospace;',
      )
    }
  }, [])

  return null
}
