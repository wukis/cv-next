'use client'

import {
  type ClusterSnapshot,
  type EmergencyScenarioKey,
  type TriggerSource,
} from '@/lib/ambientCluster'

export type AmbientSemanticMode =
  | 'steady'
  | 'preview'
  | 'surge'
  | 'incident'
  | 'recovery'

export type TerminalLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'OK' | 'DEBUG'

const SCENARIO_LABELS: Record<EmergencyScenarioKey, string> = {
  failover: 'failover',
  dbDown: 'db-outage',
  cacheReload: 'cache-warm',
  queueFull: 'queue-pressure',
}

function getScenarioLabel(scenarioKey: EmergencyScenarioKey | null) {
  return scenarioKey ? SCENARIO_LABELS[scenarioKey] : null
}

function getTriggerLabel(triggerSource: TriggerSource) {
  if (triggerSource === 'button-click') {
    return 'manual drill'
  }

  if (triggerSource === 'hover-auto') {
    return 'hover auto-drill'
  }

  return 'ambient'
}

export function getAmbientSemanticMode(
  snapshot: ClusterSnapshot,
): AmbientSemanticMode {
  if (snapshot.emergencyState === 'emergency') {
    return 'incident'
  }

  if (snapshot.emergencyState === 'recovery') {
    return 'recovery'
  }

  if (snapshot.focusMode === 'preview') {
    return 'preview'
  }

  if (snapshot.isTrafficSpike) {
    return 'surge'
  }

  return 'steady'
}

export function deriveAmbientMonitoringState(snapshot: ClusterSnapshot) {
  const mode = getAmbientSemanticMode(snapshot)
  const scenarioLabel = getScenarioLabel(snapshot.scenarioKey)
  const triggerLabel = getTriggerLabel(snapshot.triggerSource)
  const stateKey = [
    mode,
    snapshot.focusMode,
    snapshot.emergencyState,
    snapshot.scenarioKey ?? 'none',
    snapshot.triggerSource ?? 'none',
    snapshot.isTrafficSpike ? 'spike' : 'calm',
  ].join(':')

  switch (mode) {
    case 'preview':
      return {
        mode,
        stateKey,
        scenarioLabel,
        terminalTitle: 'cluster://prod operator-preview',
        terminalSummary:
          'Preview is live; load, queue depth, and traffic are rising while the cluster hints at surge and incident paths.',
        heartbeatSuffix: ' mode=preview outlook=surge|failover|cache|queue',
        heartbeatLevel: 'INFO' as TerminalLogLevel,
        modeAnnouncementLevel: 'INFO' as TerminalLogLevel,
        scrollDurationMs: 19000,
        terminalVisible: true,
        buttonLabel: 'Cluster preview',
        buttonDescription:
          'Preview mode raises live load and reveals likely next paths: surge scaling, reroute pressure, cache warmup misses, or queue buildup. While hovering, scroll to zoom the cluster view. Hold hover to auto-trigger a drill, or click for immediate failover.',
        statusPill: 'PREVIEW',
        accent: 'preview' as const,
      }
    case 'surge':
      return {
        mode,
        stateKey,
        scenarioLabel,
        terminalTitle: 'cluster://prod traffic-surge',
        terminalSummary:
          'Ambient ingress burst is active; autoscaler is adding service pods without a failure incident.',
        heartbeatSuffix: ' mode=surge autoscale=active',
        heartbeatLevel: 'INFO' as TerminalLogLevel,
        modeAnnouncementLevel: 'INFO' as TerminalLogLevel,
        scrollDurationMs: 26000,
        terminalVisible: snapshot.focusMode === 'preview',
        buttonLabel: 'Traffic surge',
        buttonDescription:
          'Autoscaling is reacting to ambient traffic pressure. Hover to inspect likely incident paths and scroll to zoom the cluster view, or click to force a failover drill.',
        statusPill: 'SURGE',
        accent: 'surge' as const,
      }
    case 'incident':
      return {
        mode,
        stateKey,
        scenarioLabel,
        terminalTitle: `cluster://prod ${scenarioLabel ?? 'incident'}`,
        terminalSummary: `${triggerLabel} active; monitoring is following the ${scenarioLabel ?? 'incident'} path and reroute pressure in real time.`,
        heartbeatSuffix: ` incident=active scenario=${scenarioLabel ?? 'incident'} source=${triggerLabel}`,
        heartbeatLevel: 'ERROR' as TerminalLogLevel,
        modeAnnouncementLevel: 'ERROR' as TerminalLogLevel,
        scrollDurationMs: 11000,
        terminalVisible: snapshot.focusMode === 'preview',
        buttonLabel: 'Incident active',
        buttonDescription:
          'A scenario drill is already active. Widgets are tracking the current impact path until recovery completes.',
        statusPill: 'INCIDENT',
        accent: 'incident' as const,
      }
    case 'recovery':
      return {
        mode,
        stateKey,
        scenarioLabel,
        terminalTitle: `cluster://prod ${scenarioLabel ?? 'incident'}-healing`,
        terminalSummary:
          'Recovery is active; replacement pods are joining the mesh and healthy targets are taking traffic back.',
        heartbeatSuffix: ` incident=recovering scenario=${scenarioLabel ?? 'incident'}`,
        heartbeatLevel: 'OK' as TerminalLogLevel,
        modeAnnouncementLevel: 'INFO' as TerminalLogLevel,
        scrollDurationMs: 16000,
        terminalVisible: snapshot.focusMode === 'preview',
        buttonLabel: 'Recovery active',
        buttonDescription:
          'Recovery is reconciling replicas and restoring traffic paths. Hover still previews live pressure and supports scroll zoom, but the active drill will finish first.',
        statusPill: 'RECOVERY',
        accent: 'recovery' as const,
      }
    default:
      return {
        mode,
        stateKey,
        scenarioLabel,
        terminalTitle: 'cluster://prod steady-state',
        terminalSummary:
          'Cluster is healthy. Hover previews likely outcomes such as surge scaling, reroute pressure, cache warmup, and queue backlog.',
        heartbeatSuffix: '',
        heartbeatLevel: 'DEBUG' as TerminalLogLevel,
        modeAnnouncementLevel: 'INFO' as TerminalLogLevel,
        scrollDurationMs: 60000,
        terminalVisible: false,
        buttonLabel: 'Background preview',
        buttonDescription:
          'Hover to preview cluster pressure paths like surge scaling, reroute pressure, cache warmup misses, and queue buildup. While hovering, scroll to zoom the cluster view. Click to start a failover drill immediately.',
        statusPill: 'STEADY',
        accent: 'steady' as const,
      }
  }
}
