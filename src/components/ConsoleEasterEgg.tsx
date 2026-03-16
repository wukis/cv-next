'use client'

import { useEffect } from 'react'
import { createBoxLineWithBorders, createEmptyBoxLine } from '@/lib/consoleBox'
import {
  getAmbientCallHistory,
  NETWORK_CALL_HISTORY_EVENT,
  type AmbientCallHistoryEntry,
} from '@/lib/ambientCluster'

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

const BOX_WIDTH = 78

const INCIDENT_SCENARIOS: IncidentScenario[] = [
  {
    service: 'checkout-api',
    severity: 'SEV-2',
    alert: 'p95 latency left the SLO and kept walking',
    likelyCause: 'the happy path collected three extra conditionals overnight',
    metric: 'p95 4.8s',
  },
  {
    service: 'payment-router',
    severity: 'SEV-1',
    alert: 'retry storm detected near the card authorization path',
    likelyCause:
      'an upstream gateway is answering every request with “interesting”',
    metric: 'retry rate 37%',
  },
  {
    service: 'cart-pipeline',
    severity: 'SEV-2',
    alert: 'queue backlog exceeded the “who merged on Friday” threshold',
    likelyCause:
      'one worker found blocking I/O in a place that promised not to',
    metric: 'queue depth 18,240',
  },
  {
    service: 'promo-engine',
    severity: 'SEV-2',
    alert: 'discount logic is now interpreting requirements creatively',
    likelyCause:
      'a coupon edge case slipped past review with a confident description',
    metric: 'error rate 12.4%',
  },
]

const OPENING_LINES = [
  'bridge opened: first message was “is this actually prod?”',
  'incident room established: someone already asked for a timeline',
  'war room online: one engineer is typing “looking” with purpose',
  'emergency comms active: coffee brewed, blame deferred',
]

const JONAS_LINES = [
  'jonas: give me traces, not vibes.',
  'jonas: if we need three dashboards to explain it, we need fewer dashboards.',
  'jonas: okay, which “small refactor” is about to become a postmortem?',
  'jonas: let me guess, the hot path got “just one more condition”.',
]

const ENGINEER_LINES = [
  'ops: I have logs, metrics, and one deeply unhelpful screenshot.',
  'backend: I can reproduce it locally, which feels threatening.',
  'on-call: status page drafted, dignity still pending.',
  'payments: gateway says everything is healthy, which helps nobody.',
  'frontend: I am here to confirm the button did not cause this one.',
  'platform: checking infra now, and yes we already looked at Redis.',
]

const FOLLOWUP_LINES = [
  'sre: correlating deploy time with graph shape and suspicious optimism.',
  'backend: I found the branch name and it is not helping the defense.',
  'ops: the logs are clear, concise, and devastating.',
  'incident-bot: reminder that “maybe cache?” is not a mitigation.',
  'db: query plan says hello and also absolutely not.',
  'platform: can confirm the node is healthy and disappointed in all of us.',
]

const DIAGNOSIS_LINES = [
  'tracing: one request path now does enough work for three microservices.',
  'metrics: the deploy marker lines up a little too perfectly here.',
  'profiling: hottest function is exactly the one described as “tiny helper”.',
  'logs: same stack trace, different ways of ruining the afternoon.',
  'alerts: noise floor reached, but at least it is consistently noisy.',
]

const INCIDENT_BOT_LINES = [
  'incident-bot: 1 person is blaming DNS out of muscle memory.',
  'incident-bot: somebody typed “rolling back” before saying hello.',
  'incident-bot: bridge participants now pretending this is routine.',
  'incident-bot: postmortem title suggestions already appearing in chat.',
]

const PM_LINES = [
  'pm: do we have a customer-safe summary that uses fewer than three acronyms?',
  'pm: checking impact now, also asking very politely about ETA.',
  'pm: can I say “degraded” or are we still in the “investigating” phase?',
]

const RESOLUTION_LINES = [
  'resolution: rate limited the noisy path, added guardrails, everyone exhaled.',
  'resolution: reverted the spicy code path and the graphs stopped screaming.',
  'resolution: cut alert noise, fixed the bottleneck, preserved weekend plans.',
  'resolution: one tiny config change, twelve minutes of very senior nodding.',
]

const FIX_RESPONSES = [
  'Applied traces, diffed the last deploy, and used one annoyingly effective config tweak.',
  'Reduced alert noise by 80% and replaced panic with a checklist.',
  'Fixed. Root cause: too much confidence too close to the hot path.',
  'Patched the pipeline. CI now agrees with the apology in Slack.',
]

const BLAME_RESPONSES = [
  'Officially: shared responsibility. Unofficially: one “small refactor”.',
  'Blame points to edge cases, timing, and a suspiciously cheerful pull request.',
  'Postmortem draft says “regression introduced during harmless cleanup”.',
  'No single villain. Just bad timing and a passing test suite.',
]

const ROLLBACK_RESPONSES = [
  'Rollback complete. Production is boring again, as intended.',
  'Reverted safely. Graphs are flat and nobody is screen-sharing.',
  'Rollback executed. Pager volume now back to polite levels.',
  'We have returned to the last known good commit and a healthier branch policy.',
]

const HIRE_RESPONSES = [
  'Email client opened. Incident morale improved.',
  'Email draft opened. This is the calmest escalation path available.',
  'Message queued for the engineer least likely to panic in Slack.',
  'Email opened. Consider this a proactive postmortem action item.',
]

function pickRandomIndex(length: number): number {
  return Math.floor(Math.random() * length)
}

function createNonRepeatingPicker<T>(items: T[]) {
  let lastIndex = -1

  return () => {
    if (items.length === 1) {
      return items[0]
    }

    let nextIndex = pickRandomIndex(items.length)
    while (nextIndex === lastIndex) {
      nextIndex = pickRandomIndex(items.length)
    }

    lastIndex = nextIndex
    return items[nextIndex]
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function formatLogTime(baseDate: Date, minutesOffset: number): string {
  const date = new Date(baseDate.getTime() + minutesOffset * 60_000)
  return date.toTimeString().slice(0, 8)
}

function createBoxBorder(char: string): string {
  return char.repeat(BOX_WIDTH)
}

function createIncidentBoxLine(content: string): string {
  return createBoxLineWithBorders(content, { width: BOX_WIDTH })
}

function formatAmbientHistoryTime(timestamp: number) {
  return new Date(timestamp).toTimeString().slice(0, 8)
}

function formatAmbientHistoryEntry(entry: AmbientCallHistoryEntry) {
  const incidentPrefix = entry.incidentId ? `[${entry.incidentId}] ` : ''

  if (entry.kind === 'status') {
    return `${formatAmbientHistoryTime(entry.timestamp)} ${incidentPrefix}system: ${entry.text}`
  }

  return `${formatAmbientHistoryTime(entry.timestamp)} ${incidentPrefix}${entry.speakerLabel.toLowerCase()}: ${entry.text}`
}

function getAmbientHistoryColor(entry: AmbientCallHistoryEntry) {
  if (entry.kind === 'status') {
    return '#94a3b8'
  }

  if (entry.kind === 'hint') {
    return '#f59e0b'
  }

  return '#22c55e'
}

export function ConsoleEasterEgg() {
  useEffect(() => {
    const incident = createNonRepeatingPicker(INCIDENT_SCENARIOS)()
    const baseDate = new Date()
    baseDate.setMinutes(baseDate.getMinutes() - randomInt(12, 28))
    baseDate.setSeconds(randomInt(0, 59))

    const channel = `#incident-${incident.service}`
    const participants = randomInt(4, 8)
    const openingLine = createNonRepeatingPicker(OPENING_LINES)()
    const jonasLine = createNonRepeatingPicker(JONAS_LINES)()
    const engineerLine = createNonRepeatingPicker(ENGINEER_LINES)()
    const followupLine = createNonRepeatingPicker(FOLLOWUP_LINES)()
    const diagnosisLine = createNonRepeatingPicker(DIAGNOSIS_LINES)()
    const incidentBotLine = createNonRepeatingPicker(INCIDENT_BOT_LINES)()
    const pmLine = createNonRepeatingPicker(PM_LINES)()
    const resolutionLine = createNonRepeatingPicker(RESOLUTION_LINES)()
    const ambientHistory = getAmbientCallHistory()
    const loggedHistoryIds = new Set(ambientHistory.map((entry) => entry.id))

    const incidentCard = `
%c┌${createBoxBorder('─')}┐
${createEmptyBoxLine(BOX_WIDTH)}
${createIncidentBoxLine(`incident-room://${incident.service}`)}
${createIncidentBoxLine(`${incident.severity} · ${incident.alert}`)}
${createIncidentBoxLine(`metric: ${incident.metric}`)}
${createIncidentBoxLine(`cause?: ${incident.likelyCause}`)}
${createEmptyBoxLine(BOX_WIDTH)}
${createIncidentBoxLine(openingLine)}
${createEmptyBoxLine(BOX_WIDTH)}
└${createBoxBorder('─')}┘`

    const transcript = [
      `${formatLogTime(baseDate, 0)} pagerduty: ${incident.severity} triggered for ${incident.service}`,
      `${formatLogTime(baseDate, 1)} ops: ${engineerLine.replace(/^ops: /, '')}`,
      `${formatLogTime(baseDate, 2)} ${jonasLine}`,
      `${formatLogTime(baseDate, 3)} ${followupLine}`,
      `${formatLogTime(baseDate, 5)} ${diagnosisLine}`,
      `${formatLogTime(baseDate, 7)} metrics: ${incident.metric} after the deploy, which narrows things down nicely`,
      `${formatLogTime(baseDate, 9)} incident-bot: ${participants} engineers in ${channel}; ${incidentBotLine.replace(/^incident-bot: /, '')}`,
      `${formatLogTime(baseDate, 10)} ${pmLine}`,
      `${formatLogTime(baseDate, 12)} ${resolutionLine}`,
    ].join('\n')
    const ambientTranscript = ambientHistory
      .map((entry) => formatAmbientHistoryEntry(entry))
      .join('\n')

    const commandMenu = `
%cEmergency comms tools:

  jonas.status()   -> current bridge snapshot
  jonas.fixProd()  -> optimistic remediation message
  jonas.blame()    -> postmortem-compatible blame
  jonas.rollback() -> approved rollback comms
  jonas.hire()     -> page the calm engineer

%cIf you opened DevTools, you are now legally part of the incident review.
`

    console.log(
      incidentCard,
      'color: #94a3b8; font-family: monospace; font-size: 12px; line-height: 1.4;',
    )

    console.log(
      '%c' + (ambientTranscript || transcript),
      `color: ${ambientTranscript ? '#22c55e' : incident.severity === 'SEV-1' ? '#f97316' : '#22c55e'}; font-family: monospace; font-size: 11px; line-height: 1.6;`,
    )

    console.log(
      commandMenu,
      'color: #a78bfa; font-family: monospace; font-size: 11px;',
      'color: #94a3b8; font-family: monospace; font-size: 11px;',
    )

    if (typeof window !== 'undefined') {
      const windowWithJonas = window as Window & { jonas?: JonasEmergencyApi }
      const nextFixResponse = createNonRepeatingPicker(FIX_RESPONSES)
      const nextBlameResponse = createNonRepeatingPicker(BLAME_RESPONSES)
      const nextRollbackResponse = createNonRepeatingPicker(ROLLBACK_RESPONSES)
      const nextHireResponse = createNonRepeatingPicker(HIRE_RESPONSES)

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
          const response = nextFixResponse()
          console.log(
            '%c' + response,
            'color: #22c55e; font-family: monospace;',
          )
          return response
        },
        blame: () => {
          const response = nextBlameResponse()
          console.log(
            '%c' + response,
            'color: #f59e0b; font-family: monospace;',
          )
          return response
        },
        rollback: () => {
          const response = nextRollbackResponse()
          console.log(
            '%c' + response,
            'color: #38bdf8; font-family: monospace;',
          )
          return response
        },
        hire: () => {
          const response = nextHireResponse()
          console.log(
            '%cOpening email... hopefully before the next alert.',
            'color: #0ea5e9; font-family: monospace;',
          )
          window.open(
            'mailto:jonas@petrik.dev?subject=Found your emergency comms easter egg!',
            '_blank',
          )
          return response
        },
      }

      windowWithJonas.jonas = jonasApi

      console.log(
        '%cTry: jonas.status(), jonas.fixProd(), jonas.blame(), jonas.rollback(), or jonas.hire()',
        'color: #c084fc; font-size: 11px; font-family: monospace;',
      )

      const handleAmbientHistory = (event: Event) => {
        const customEvent = event as CustomEvent<{
          entries: AmbientCallHistoryEntry[]
          latestEntry: AmbientCallHistoryEntry
        }>
        const latestEntry = customEvent.detail?.latestEntry

        if (!latestEntry || loggedHistoryIds.has(latestEntry.id)) {
          return
        }

        loggedHistoryIds.add(latestEntry.id)
        console.log(
          '%c' + formatAmbientHistoryEntry(latestEntry),
          `color: ${getAmbientHistoryColor(latestEntry)}; font-family: monospace; font-size: 11px; line-height: 1.6;`,
        )
      }

      window.addEventListener(NETWORK_CALL_HISTORY_EVENT, handleAmbientHistory)

      return () => {
        delete windowWithJonas.jonas
        window.removeEventListener(
          NETWORK_CALL_HISTORY_EVENT,
          handleAmbientHistory,
        )
      }
    }
  }, [])

  return null
}
