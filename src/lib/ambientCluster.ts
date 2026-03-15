'use client'

import { useEffect, useState } from 'react'

export const NETWORK_CLUSTER_STATE_EVENT = 'network-cluster-state'
export const TRIGGER_NETWORK_EMERGENCY_EVENT = 'trigger-emergency'

export type EmergencyState = 'normal' | 'emergency' | 'recovery'
export type FocusMode = 'idle' | 'preview'
export type TriggerSource = 'hover-auto' | 'button-click' | null
export type EmergencyScenarioKey =
  | 'failover'
  | 'dbDown'
  | 'cacheReload'
  | 'queueFull'

export type ClusterNodeRole =
  | 'ingress'
  | 'loadBalancer'
  | 'appPod'
  | 'worker'
  | 'cache'
  | 'queue'
  | 'database'
  | 'observability'

export type ClusterNodeLifecycle =
  | 'healthy'
  | 'starting'
  | 'ready'
  | 'draining'
  | 'unhealthy'
  | 'terminating'

export type ClusterEventLevel = 'info' | 'warn' | 'error' | 'success'

export interface ClusterEventEntry {
  id: number
  level: ClusterEventLevel
  message: string
  timestamp: number
}

export interface ClusterSnapshot {
  emergencyState: EmergencyState
  focusMode: FocusMode
  scenarioKey: EmergencyScenarioKey | null
  isTrafficSpike: boolean
  triggerSource: TriggerSource
  replicaTarget: number
  liveReplicas: number
  readyReplicas: number
  startingReplicas: number
  drainingReplicas: number
  unhealthyReplicas: number
  terminatingReplicas: number
  loadBalancerTargets: string[]
  loadBalancerHealthy: boolean
  requestRate: number
  errorRate: number
  latencyMs: number
  queueDepth: number
  trafficIntensity: number
  recentEvent?: ClusterEventEntry
}

export const DEFAULT_CLUSTER_SNAPSHOT: ClusterSnapshot = {
  emergencyState: 'normal',
  focusMode: 'idle',
  scenarioKey: null,
  isTrafficSpike: false,
  triggerSource: null,
  replicaTarget: 4,
  liveReplicas: 4,
  readyReplicas: 4,
  startingReplicas: 0,
  drainingReplicas: 0,
  unhealthyReplicas: 0,
  terminatingReplicas: 0,
  loadBalancerTargets: ['app-1', 'app-2', 'app-3', 'app-4'],
  loadBalancerHealthy: true,
  requestRate: 1680,
  errorRate: 0.3,
  latencyMs: 34,
  queueDepth: 8,
  trafficIntensity: 0.4,
}

export function dispatchClusterSnapshot(snapshot: ClusterSnapshot) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent<ClusterSnapshot>(NETWORK_CLUSTER_STATE_EVENT, {
      detail: snapshot,
    }),
  )
}

export function useAmbientClusterSnapshot() {
  const [snapshot, setSnapshot] = useState<ClusterSnapshot>(DEFAULT_CLUSTER_SNAPSHOT)

  useEffect(() => {
    const handleClusterUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ClusterSnapshot>
      if (customEvent.detail) {
        setSnapshot(customEvent.detail)
      }
    }

    window.addEventListener(NETWORK_CLUSTER_STATE_EVENT, handleClusterUpdate)
    return () => window.removeEventListener(NETWORK_CLUSTER_STATE_EVENT, handleClusterUpdate)
  }, [])

  return snapshot
}
