import type {
  ClusterNodeRole,
  EmergencyScenarioKey,
} from '@/lib/ambientCluster'

import type { AppServiceGroup, ColorKey, ConnectionKind } from './types'

export const APP_SERVICE_ORDER = [
  'edge',
  'auth',
  'catalog',
  'basket',
  'checkout',
  'warehouse',
] as const

export const AUTO_EMERGENCY_INTERVAL_SECONDS = 300
export const AUTO_EMERGENCY_JITTER_SECONDS = 45

export const EMERGENCY_SCENARIOS: Record<
  EmergencyScenarioKey,
  {
    title: string
    subtitle: string
    eventMessage: string
    affectedRoles: ClusterNodeRole[]
    failureTarget: number
    metricImpact: {
      errorRate: number
      latencyMs: number
      queueDepth: number
      trafficIntensity: number
    }
  }
> = {
  failover: {
    title: 'FAILOVER EVENT',
    subtitle: 'lb-ext rerouting around unhealthy pods',
    eventMessage:
      'lb-ext failover drill started; traffic is being rerouted around unstable pods',
    affectedRoles: ['loadBalancer', 'appPod'],
    failureTarget: 3,
    metricImpact: {
      errorRate: 4,
      latencyMs: 14,
      queueDepth: 12,
      trafficIntensity: 0.08,
    },
  },
  dbDown: {
    title: 'DATABASE OUTAGE',
    subtitle: 'primary storage unavailable; services retrying writes',
    eventMessage:
      'database incident detected; primary writes are failing and services are backing off',
    affectedRoles: ['database', 'worker', 'appPod'],
    failureTarget: 2,
    metricImpact: {
      errorRate: 6,
      latencyMs: 24,
      queueDepth: 18,
      trafficIntensity: 0.04,
    },
  },
  cacheReload: {
    title: 'CACHE RELOADING',
    subtitle: 'redis cluster warming keys and serving misses',
    eventMessage:
      'redis cluster reload started; cache misses are climbing while keys repopulate',
    affectedRoles: ['cache', 'appPod'],
    failureTarget: 1,
    metricImpact: {
      errorRate: 2.4,
      latencyMs: 11,
      queueDepth: 8,
      trafficIntensity: 0.03,
    },
  },
  queueFull: {
    title: 'QUEUE SATURATED',
    subtitle: 'workers are backpressured while backlog drains',
    eventMessage:
      'queue saturation detected; worker backlog is rising and dispatch is slowing',
    affectedRoles: ['queue', 'worker', 'appPod'],
    failureTarget: 1,
    metricImpact: {
      errorRate: 3.4,
      latencyMs: 10,
      queueDepth: 30,
      trafficIntensity: 0.05,
    },
  },
}

export const SCENARIO_AFFECTED_SERVICES: Record<
  EmergencyScenarioKey,
  AppServiceGroup[]
> = {
  failover: ['edge', 'checkout'],
  dbDown: ['auth', 'basket', 'checkout'],
  cacheReload: ['catalog', 'basket'],
  queueFull: ['checkout', 'warehouse'],
}

export const COLORS: Record<
  ColorKey,
  { main: string; glow: string; fill: string }
> = {
  emerald: {
    main: 'rgba(16, 185, 129, VAL)',
    glow: 'rgba(52, 211, 153, VAL)',
    fill: 'rgba(16, 185, 129, VAL)',
  },
  sky: {
    main: 'rgba(14, 165, 233, VAL)',
    glow: 'rgba(56, 189, 248, VAL)',
    fill: 'rgba(14, 165, 233, VAL)',
  },
  violet: {
    main: 'rgba(139, 92, 246, VAL)',
    glow: 'rgba(167, 139, 250, VAL)',
    fill: 'rgba(139, 92, 246, VAL)',
  },
  amber: {
    main: 'rgba(245, 158, 11, VAL)',
    glow: 'rgba(251, 191, 36, VAL)',
    fill: 'rgba(245, 158, 11, VAL)',
  },
  rose: {
    main: 'rgba(244, 63, 94, VAL)',
    glow: 'rgba(251, 113, 133, VAL)',
    fill: 'rgba(244, 63, 94, VAL)',
  },
  teal: {
    main: 'rgba(20, 184, 166, VAL)',
    glow: 'rgba(45, 212, 191, VAL)',
    fill: 'rgba(20, 184, 166, VAL)',
  },
  cyan: {
    main: 'rgba(6, 182, 212, VAL)',
    glow: 'rgba(34, 211, 238, VAL)',
    fill: 'rgba(6, 182, 212, VAL)',
  },
  lime: {
    main: 'rgba(132, 204, 22, VAL)',
    glow: 'rgba(163, 230, 53, VAL)',
    fill: 'rgba(132, 204, 22, VAL)',
  },
  indigo: {
    main: 'rgba(99, 102, 241, VAL)',
    glow: 'rgba(129, 140, 248, VAL)',
    fill: 'rgba(99, 102, 241, VAL)',
  },
  orange: {
    main: 'rgba(249, 115, 22, VAL)',
    glow: 'rgba(251, 146, 60, VAL)',
    fill: 'rgba(249, 115, 22, VAL)',
  },
  slate: {
    main: 'rgba(100, 116, 139, VAL)',
    glow: 'rgba(148, 163, 184, VAL)',
    fill: 'rgba(100, 116, 139, VAL)',
  },
  coral: {
    main: 'rgba(251, 113, 133, VAL)',
    glow: 'rgba(253, 164, 175, VAL)',
    fill: 'rgba(251, 113, 133, VAL)',
  },
  blue: {
    main: 'rgba(59, 130, 246, VAL)',
    glow: 'rgba(96, 165, 250, VAL)',
    fill: 'rgba(59, 130, 246, VAL)',
  },
  red: {
    main: 'rgba(239, 68, 68, VAL)',
    glow: 'rgba(248, 113, 113, VAL)',
    fill: 'rgba(239, 68, 68, VAL)',
  },
  neutral: {
    main: 'rgba(148, 163, 184, VAL)',
    glow: 'rgba(203, 213, 225, VAL)',
    fill: 'rgba(148, 163, 184, VAL)',
  },
}

export const ROLE_COLORS: Record<ClusterNodeRole, ColorKey> = {
  ingress: 'cyan',
  loadBalancer: 'lime',
  appPod: 'emerald',
  worker: 'coral',
  cache: 'blue',
  queue: 'orange',
  database: 'indigo',
  observability: 'neutral',
}

export const CONNECTION_INTERVALS: Record<ConnectionKind, [number, number]> = {
  ingress: [0.8, 1.4],
  loadBalancer: [1.0, 1.8],
  service: [1.8, 2.6],
  storage: [2.0, 3.2],
  telemetry: [2.6, 3.8],
}

export const BASE_HEX_SIZE = 22
export const PERSPECTIVE = 860
export const ROTATION_SPEED_NORMAL = 0.00012
export const ROTATION_SPEED_FOCUSED = 0.00048
export const DRAIN_DURATION = 2.1
export const SCALE_DOWN_DRAIN_DURATION = 1.35
export const UNHEALTHY_DURATION = 1.8
export const TERMINATING_DURATION = 1.6
export const STARTING_DURATION = 3.2
export const SNAPSHOT_INTERVAL = 0.45
export const TOAST_EXIT_DURATION = 0.32
export const POD_LAYOUT_STIFFNESS = 0.09
export const POD_LAYOUT_DAMPING = 0.76
export const CAMERA_BASE_ZOOM_IDLE = 92
export const CAMERA_BASE_ZOOM_FOCUSED = 54
export const CAMERA_ZOOM_MIN = -340
export const CAMERA_ZOOM_MAX = 420

export const Y_AXIS_COMPRESSION = 0.96
