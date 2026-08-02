import type { EmergencyScenarioKey, EmergencyState } from '@/lib/ambientCluster'
import { getRequiredArrayItem } from '@/lib/assert'

import {
  EMERGENCY_SCENARIOS,
  SCENARIO_AFFECTED_SERVICES,
  STARTING_DURATION,
  TERMINATING_DURATION,
} from './constants'
import { clamp } from './math'
import type { AppServiceGroup, ColorKey, ServiceNode } from './types'

type NodePalette = { colorKey: ColorKey; attention: number }

const EMERGENCY_NODE_COLORS = {
  failover: 'red',
  dbDown: 'red',
  cacheReload: 'amber',
  queueFull: 'orange',
} satisfies Record<EmergencyScenarioKey, ColorKey>

const RECOVERY_NODE_COLORS = {
  failover: null,
  dbDown: 'indigo',
  cacheReload: null,
  queueFull: 'amber',
} satisfies Record<EmergencyScenarioKey, ColorKey | null>

const LIFECYCLE_PALETTES = {
  unhealthy: () => ({ colorKey: 'red', attention: 0.92 }),
  terminating: () => ({ colorKey: 'red', attention: 0.92 }),
  starting: () => ({ colorKey: 'amber', attention: 0.72 }),
  healthy: null,
  ready: null,
  draining: getDrainingNodePalette,
} satisfies Record<
  ServiceNode['lifecycleState'],
  ((node: ServiceNode, time: number) => NodePalette) | null
>

const LIFECYCLE_VISIBILITY = {
  starting: (node: ServiceNode, time: number) =>
    clamp((time - node.statusSince) / STARTING_DURATION, 0, 1),
  terminating: (node: ServiceNode, time: number) =>
    clamp(1 - (time - node.statusSince) / TERMINATING_DURATION, 0, 1),
  unhealthy: () => 0.92,
  draining: () => 0.84,
  healthy: () => 1,
  ready: () => 1,
} satisfies Record<ServiceNode['lifecycleState'], typeof getLifecycleValue>

const ROLE_SCALE_MULTIPLIERS = {
  ingress: 1.04,
  loadBalancer: 1.12,
  appPod: 1,
  worker: 1,
  queue: 1,
  cache: 1,
  database: 1,
  observability: 1,
} satisfies Record<ServiceNode['role'], number>

export function getEmergencyScenario(key: EmergencyScenarioKey) {
  return EMERGENCY_SCENARIOS[key]
}

export function pickRandomEmergencyScenario(): EmergencyScenarioKey {
  const scenarioKeys = Object.keys(
    EMERGENCY_SCENARIOS,
  ) as EmergencyScenarioKey[]
  return getRequiredArrayItem(
    scenarioKeys,
    Math.floor(Math.random() * scenarioKeys.length),
    'Expected at least one emergency scenario.',
  )
}

export function getScenarioAffectedServices(scenarioKey: EmergencyScenarioKey) {
  return SCENARIO_AFFECTED_SERVICES[scenarioKey]
}

export function getEmergencyLogBurst(
  scenarioKey: EmergencyScenarioKey,
  affectedServices: AppServiceGroup[],
) {
  const serviceSummary = affectedServices.join(',')

  switch (scenarioKey) {
    case 'failover':
      return [
        {
          level: 'error' as const,
          message: `lb-ext detected unstable targets in services=${serviceSummary}; failover policy engaged`,
        },
        {
          level: 'warn' as const,
          message:
            'traffic is draining from unhealthy pods while edge retries fan out across healthy targets',
        },
        {
          level: 'error' as const,
          message:
            'request errors are spiking during reroute convergence; checkout paths are shedding load',
        },
      ]
    case 'dbDown':
      return [
        {
          level: 'error' as const,
          message: `postgres primary writes are failing for services=${serviceSummary}; retry budget is burning`,
        },
        {
          level: 'warn' as const,
          message:
            'transaction workers are backing off while connection pools wait for durable storage',
        },
        {
          level: 'error' as const,
          message:
            'checkout and basket mutations are timing out against the primary database',
        },
      ]
    case 'cacheReload':
      return [
        {
          level: 'warn' as const,
          message: `redis cache warmup is active for services=${serviceSummary}; miss rate is climbing`,
        },
        {
          level: 'error' as const,
          message:
            'catalog reads are falling through to origin while hot keys repopulate the cache',
        },
        {
          level: 'warn' as const,
          message:
            'latency is rising as repeated cache misses fan out across backing services',
        },
      ]
    case 'queueFull':
      return [
        {
          level: 'error' as const,
          message: `queue backlog breached saturation threshold for services=${serviceSummary}; workers are throttling`,
        },
        {
          level: 'warn' as const,
          message:
            'dispatch latency is rising while consumers drain jobs slower than ingress arrival',
        },
        {
          level: 'error' as const,
          message:
            'checkout workflows are stalling behind queued work and retry pressure',
        },
      ]
  }
}

export function isScenarioAffectingNode(
  node: ServiceNode,
  emergencyState: EmergencyState,
  emergencyScenarioKey: EmergencyScenarioKey,
) {
  if (emergencyState !== 'emergency' && emergencyState !== 'recovery') {
    return false
  }

  const scenario = getEmergencyScenario(emergencyScenarioKey)
  if (!scenario.affectedRoles.includes(node.role)) {
    return false
  }

  if (node.role !== 'appPod') {
    return true
  }

  return node.replicaGroup
    ? getScenarioAffectedServices(emergencyScenarioKey).includes(
        node.replicaGroup as AppServiceGroup,
      )
    : false
}

export function isScenarioAffectingService(
  serviceName: AppServiceGroup,
  emergencyState: EmergencyState,
  emergencyScenarioKey: EmergencyScenarioKey,
) {
  if (emergencyState !== 'emergency' && emergencyState !== 'recovery') {
    return false
  }

  return getScenarioAffectedServices(emergencyScenarioKey).includes(serviceName)
}

export function getNodePalette(
  node: ServiceNode,
  time: number,
  emergencyState: EmergencyState,
  emergencyScenarioKey: EmergencyScenarioKey,
): NodePalette {
  const lifecyclePalette = LIFECYCLE_PALETTES[node.lifecycleState]
  if (lifecyclePalette) return lifecyclePalette(node, time)

  const scenarioAffectsNode = isScenarioAffectingNode(
    node,
    emergencyState,
    emergencyScenarioKey,
  )
  if (scenarioAffectsNode)
    return getScenarioNodePalette(node, emergencyState, emergencyScenarioKey)

  return {
    colorKey: node.color,
    attention: node.role === 'loadBalancer' ? 0.95 : 0.8,
  }
}

export function getNodeVisibility(node: ServiceNode, time: number) {
  return LIFECYCLE_VISIBILITY[node.lifecycleState](node, time)
}

export function getNodeScaleMultiplier(node: ServiceNode, time: number) {
  const lifecycleScale = getLifecycleScaleMultiplier(node, time)
  return lifecycleScale ?? ROLE_SCALE_MULTIPLIERS[node.role]
}

function getLifecycleValue(_node: ServiceNode, _time: number) {
  return 1
}

function getDrainingNodePalette(node: ServiceNode, time: number): NodePalette {
  return {
    colorKey:
      node.scaleDownTarget || Math.sin(time * 8 + node.id) <= 0
        ? 'amber'
        : 'red',
    attention: 0.82,
  }
}

function getScenarioNodePalette(
  node: ServiceNode,
  emergencyState: EmergencyState,
  emergencyScenarioKey: EmergencyScenarioKey,
): NodePalette {
  if (emergencyState === 'emergency') {
    return {
      colorKey: EMERGENCY_NODE_COLORS[emergencyScenarioKey],
      attention: 0.9,
    }
  }

  return {
    colorKey: RECOVERY_NODE_COLORS[emergencyScenarioKey] ?? node.color,
    attention: 0.84,
  }
}

function getLifecycleScaleMultiplier(node: ServiceNode, time: number) {
  const age = time - node.statusSince
  const scaleMap = {
    starting: 0.34 + 0.66 * clamp(age / STARTING_DURATION, 0, 1),
    terminating: 0.72 + 0.28 * clamp(1 - age / TERMINATING_DURATION, 0, 1),
    healthy: null,
    ready: null,
    unhealthy: null,
    draining: null,
  } satisfies Record<ServiceNode['lifecycleState'], number | null>

  return scaleMap[node.lifecycleState]
}

export function getEmergencyStateFromRef(state: {
  isActive: boolean
  isRecovery: boolean
}): EmergencyState {
  if (state.isActive) {
    return 'emergency'
  }

  if (state.isRecovery) {
    return 'recovery'
  }

  return 'normal'
}
