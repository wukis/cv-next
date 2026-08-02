import type { EmergencyScenarioKey, EmergencyState } from '@/lib/ambientCluster'

import { CONNECTION_INTERVALS } from './constants'
import { isScenarioAffectingService } from './emergency'
import { randomInRange } from './math'
import type {
  AppServiceGroup,
  ConnectionKind,
  ServiceNode,
  StatusIndicator,
} from './types'

type PodCounts = {
  ready: number
  starting: number
  draining: number
  unhealthy: number
  total: number
  desired: number
}

type ServiceStatusContext = {
  emergencyState: EmergencyState
  emergencyScenarioKey: EmergencyScenarioKey
  isTrafficSpike: boolean
  isDark: boolean
  metaOpacity: number
}

type ServiceStatusDisplay = {
  text: string
  color: string
}

type ServiceStatusFactory = (
  counts: PodCounts,
  context: ServiceStatusContext,
) => ServiceStatusDisplay

const PACKET_SPEED_RANGES = {
  ingress: [0.009, 0.013],
  loadBalancer: [0.008, 0.0115],
  service: [0.006, 0.009],
  storage: [0.0055, 0.008],
  telemetry: [0.0045, 0.007],
} satisfies Record<ConnectionKind, readonly [number, number]>

const PACKET_SIZES = {
  ingress: 3.8,
  loadBalancer: 3.2,
  service: 2.2,
  storage: 2.6,
  telemetry: 2.2,
} satisfies Record<ConnectionKind, number>

const CONNECTION_OPACITY_BASE = {
  ingress: [0.14, 0.18],
  loadBalancer: [0.11, 0.16],
  service: [0.06, 0.08],
  storage: [0.07, 0.08],
  telemetry: [0.08, 0.09],
} satisfies Record<ConnectionKind, readonly [number, number]>

const STABLE_SERVICE_STATUS = {
  edge: {
    text: 'routing ingress',
    dark: '125, 211, 252',
    light: '3, 105, 161',
  },
  auth: {
    text: 'verifying jwt',
    dark: '110, 231, 183',
    light: '5, 150, 105',
  },
  basket: {
    text: 'holding carts',
    dark: '110, 231, 183',
    light: '4, 120, 87',
  },
  warehouse: {
    text: 'checking stock',
    dark: '251, 191, 36',
    light: '180, 83, 9',
  },
  catalog: {
    text: 'serving reads',
    dark: '251, 191, 36',
    light: '161, 98, 7',
  },
  checkout: {
    text: 'committing orders',
    dark: '196, 181, 253',
    light: '109, 40, 217',
  },
} satisfies Record<
  AppServiceGroup,
  { text: string; dark: string; light: string }
>

export function getBasePacketInterval(kind: ConnectionKind) {
  const [min, max] = CONNECTION_INTERVALS[kind]
  return randomInRange(min, max)
}

export function getPacketType(kind: ConnectionKind) {
  return kind === 'telemetry' || kind === 'service' ? 'udp' : 'tcp'
}

export function getPacketSpeed(kind: ConnectionKind) {
  const [min, max] = PACKET_SPEED_RANGES[kind]
  return randomInRange(min, max)
}

export function getPacketSize(kind: ConnectionKind) {
  return PACKET_SIZES[kind]
}

export function getPacketDirection(kind: ConnectionKind): 1 | -1 {
  if (kind === 'telemetry') {
    return -1
  }

  return Math.random() > 0.2 ? 1 : -1
}

export function createStatusIndicator(
  id: number,
  startTime: number,
  anchorNodeId: number,
  type: StatusIndicator['type'],
  label?: string,
): StatusIndicator {
  return {
    id,
    anchorNodeId,
    xOffset: randomInRange(-5, 5),
    yOffset: -18 + randomInRange(-4, 3),
    type,
    opacity: 1,
    scale: 0,
    startTime,
    duration: 1.8 + Math.random() * 0.5,
    ...(label ? { label } : {}),
  }
}

function drawSuccessIndicator(ctx: CanvasRenderingContext2D, size: number) {
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(-size * 0.5, 0)
  ctx.lineTo(-size * 0.08, size * 0.42)
  ctx.lineTo(size * 0.52, -size * 0.28)
  ctx.stroke()
}

function drawWarningIndicator(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = ctx.strokeStyle
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.52)
  ctx.lineTo(-size * 0.45, size * 0.34)
  ctx.lineTo(size * 0.45, size * 0.34)
  ctx.closePath()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.12)
  ctx.lineTo(0, size * 0.1)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, size * 0.22, 1, 0, Math.PI * 2)
  ctx.fill()
}

function drawFailureIndicator(ctx: CanvasRenderingContext2D, size: number) {
  ctx.lineWidth = 1.55
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-size * 0.32, -size * 0.32)
  ctx.lineTo(size * 0.32, size * 0.32)
  ctx.moveTo(size * 0.32, -size * 0.32)
  ctx.lineTo(-size * 0.32, size * 0.32)
  ctx.stroke()
}

function getStatusIndicatorStroke(
  type: StatusIndicator['type'],
  isDark: boolean,
) {
  const colorMap = {
    success: isDark ? 'rgba(52, 211, 153, 1)' : 'rgba(16, 185, 129, 1)',
    warning: isDark ? 'rgba(251, 191, 36, 1)' : 'rgba(245, 158, 11, 1)',
    failure: isDark ? 'rgba(248, 113, 113, 1)' : 'rgba(239, 68, 68, 1)',
  }

  return colorMap[type]
}

function drawIndicatorGlyph(
  ctx: CanvasRenderingContext2D,
  type: StatusIndicator['type'],
  size: number,
) {
  const drawGlyph = {
    success: drawSuccessIndicator,
    warning: drawWarningIndicator,
    failure: drawFailureIndicator,
  }

  drawGlyph[type](ctx, size)
}

export function drawStatusIndicator(
  ctx: CanvasRenderingContext2D,
  indicator: StatusIndicator,
  time: number,
  isDark: boolean,
  nodeMap: Map<number, ServiceNode>,
) {
  const node = nodeMap.get(indicator.anchorNodeId)
  if (!node) {
    return false
  }

  const age = time - indicator.startTime
  const progress = age / indicator.duration

  if (progress >= 1) {
    return false
  }

  indicator.scale = Math.min(1, age * 6)
  indicator.opacity = progress > 0.55 ? 1 - (progress - 0.55) / 0.45 : 1

  const size = 7 * indicator.scale
  const baseOpacity = indicator.opacity * (isDark ? 0.72 : 0.56)

  ctx.save()
  ctx.translate(
    node.screenX + indicator.xOffset * indicator.scale,
    node.screenY + indicator.yOffset - age * 4,
  )
  ctx.globalAlpha = baseOpacity

  ctx.strokeStyle = getStatusIndicatorStroke(indicator.type, isDark)
  drawIndicatorGlyph(ctx, indicator.type, size)

  if (indicator.label) {
    ctx.fillStyle = isDark
      ? `rgba(226, 232, 240, ${baseOpacity})`
      : `rgba(15, 23, 42, ${baseOpacity})`
    ctx.font = '10px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(indicator.label, 0, -10)
  }

  ctx.restore()
  return true
}

export function getConnectionBaseOpacity(
  kind: ConnectionKind,
  focusLevel: number,
) {
  const [base, multiplier] = CONNECTION_OPACITY_BASE[kind]
  return base + focusLevel * multiplier
}

export function getConnectionStrokeColor(
  kind: ConnectionKind,
  hasIncident: boolean,
  isDark: boolean,
  opacity: number,
) {
  if (hasIncident) {
    return isDark
      ? `rgba(248, 113, 113, ${opacity})`
      : `rgba(220, 38, 38, ${opacity})`
  }

  if (kind === 'ingress' || kind === 'loadBalancer') {
    return isDark
      ? `rgba(226, 232, 240, ${opacity})`
      : `rgba(30, 41, 59, ${opacity * 1.15})`
  }

  return isDark
    ? `rgba(148, 163, 184, ${opacity})`
    : `rgba(71, 85, 105, ${opacity * 1.1})`
}

export function getServiceStatusDisplay(
  serviceName: AppServiceGroup,
  counts: PodCounts,
  context: ServiceStatusContext,
) {
  const serviceAffectedByScenario = isScenarioAffectingService(
    serviceName,
    context.emergencyState,
    context.emergencyScenarioKey,
  )

  const factories: Array<{
    applies: boolean
    createDisplay: ServiceStatusFactory
  }> = [
    {
      applies:
        counts.unhealthy > 0 ||
        (context.emergencyState === 'emergency' && serviceAffectedByScenario),
      createDisplay: createDegradedServiceStatus,
    },
    {
      applies: counts.starting > 0 && counts.desired > counts.total,
      createDisplay: createScalingServiceStatus,
    },
    {
      applies: counts.starting > 0,
      createDisplay: createWarmingServiceStatus,
    },
    {
      applies: counts.draining > 0,
      createDisplay: createDrainingServiceStatus,
    },
    {
      applies:
        context.emergencyState === 'recovery' && serviceAffectedByScenario,
      createDisplay: createRecoveryServiceStatus,
    },
    {
      applies: context.isTrafficSpike && counts.desired > counts.ready,
      createDisplay: createTrafficSpikeServiceStatus,
    },
  ]

  return (
    factories
      .find((factory) => factory.applies)
      ?.createDisplay(counts, context) ??
    createStableServiceStatus(serviceName, context)
  )
}

function rgbaForTheme(
  context: Pick<ServiceStatusContext, 'isDark' | 'metaOpacity'>,
  darkRgb: string,
  lightRgb: string,
  opacityMultiplier = 1,
) {
  const rgb = context.isDark ? darkRgb : lightRgb
  const opacity = context.metaOpacity * opacityMultiplier
  return `rgba(${rgb}, ${opacity})`
}

function createDegradedServiceStatus(
  counts: PodCounts,
  context: ServiceStatusContext,
) {
  const missingReplicas = Math.max(counts.desired - counts.ready, 0)
  return {
    text:
      counts.unhealthy > 0
        ? `degraded ${counts.unhealthy} failing`
        : `rerouting ${Math.max(missingReplicas, 1)} impact`,
    color: rgbaForTheme(context, '248, 113, 113', '220, 38, 38'),
  }
}

function createScalingServiceStatus(
  counts: PodCounts,
  context: ServiceStatusContext,
) {
  return {
    text: `scaling +${Math.max(counts.desired - counts.total, counts.starting)}`,
    color: rgbaForTheme(context, '250, 204, 21', '180, 83, 9', 0.96),
  }
}

function createWarmingServiceStatus(
  counts: PodCounts,
  context: ServiceStatusContext,
) {
  return {
    text: `warming ${counts.starting} pending`,
    color: rgbaForTheme(context, '251, 191, 36', '202, 138, 4', 0.94),
  }
}

function createDrainingServiceStatus(
  counts: PodCounts,
  context: ServiceStatusContext,
) {
  return {
    text: `rotating ${counts.draining} drain`,
    color: rgbaForTheme(context, '251, 191, 36', '180, 83, 9', 0.9),
  }
}

function createRecoveryServiceStatus(
  _counts: PodCounts,
  context: ServiceStatusContext,
) {
  return {
    text: 'stabilizing mesh',
    color: rgbaForTheme(context, '74, 222, 128', '22, 163, 74'),
  }
}

function createTrafficSpikeServiceStatus(
  counts: PodCounts,
  context: ServiceStatusContext,
) {
  return {
    text: `surge target ${counts.desired}`,
    color: rgbaForTheme(context, '56, 189, 248', '2, 132, 199'),
  }
}

function createStableServiceStatus(
  serviceName: AppServiceGroup,
  context: ServiceStatusContext,
) {
  const display = STABLE_SERVICE_STATUS[serviceName]
  return {
    text: display.text,
    color: rgbaForTheme(context, display.dark, display.light),
  }
}
