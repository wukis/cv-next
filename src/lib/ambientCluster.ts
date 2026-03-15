'use client'

export const NETWORK_CLUSTER_STATE_EVENT = 'network-cluster-state'

export type EmergencyState = 'normal' | 'emergency' | 'recovery'

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
