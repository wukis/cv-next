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

export function getBasePacketInterval(kind: ConnectionKind) {
  const [min, max] = CONNECTION_INTERVALS[kind]
  return randomInRange(min, max)
}

export function getPacketType(kind: ConnectionKind) {
  return kind === 'telemetry' || kind === 'service' ? 'udp' : 'tcp'
}

export function getPacketSpeed(kind: ConnectionKind) {
  switch (kind) {
    case 'ingress':
      return randomInRange(0.009, 0.013)
    case 'loadBalancer':
      return randomInRange(0.008, 0.0115)
    case 'service':
      return randomInRange(0.006, 0.009)
    case 'storage':
      return randomInRange(0.0055, 0.008)
    case 'telemetry':
      return randomInRange(0.0045, 0.007)
  }
}

export function getPacketSize(kind: ConnectionKind) {
  switch (kind) {
    case 'ingress':
      return 3.8
    case 'loadBalancer':
      return 3.2
    case 'storage':
      return 2.6
    default:
      return 2.2
  }
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

  if (indicator.type === 'success') {
    ctx.strokeStyle = isDark ? 'rgba(52, 211, 153, 1)' : 'rgba(16, 185, 129, 1)'
    ctx.lineWidth = 1.6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(-size * 0.5, 0)
    ctx.lineTo(-size * 0.08, size * 0.42)
    ctx.lineTo(size * 0.52, -size * 0.28)
    ctx.stroke()
  } else if (indicator.type === 'warning') {
    ctx.strokeStyle = isDark ? 'rgba(251, 191, 36, 1)' : 'rgba(245, 158, 11, 1)'
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
  } else {
    ctx.strokeStyle = isDark ? 'rgba(248, 113, 113, 1)' : 'rgba(239, 68, 68, 1)'
    ctx.lineWidth = 1.55
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-size * 0.32, -size * 0.32)
    ctx.lineTo(size * 0.32, size * 0.32)
    ctx.moveTo(size * 0.32, -size * 0.32)
    ctx.lineTo(-size * 0.32, size * 0.32)
    ctx.stroke()
  }

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
  switch (kind) {
    case 'ingress':
      return 0.14 + focusLevel * 0.18
    case 'loadBalancer':
      return 0.11 + focusLevel * 0.16
    case 'storage':
      return 0.07 + focusLevel * 0.08
    case 'telemetry':
      return 0.08 + focusLevel * 0.09
    default:
      return 0.06 + focusLevel * 0.08
  }
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
  counts: {
    ready: number
    starting: number
    draining: number
    unhealthy: number
    total: number
    desired: number
  },
  context: {
    emergencyState: EmergencyState
    emergencyScenarioKey: EmergencyScenarioKey
    isTrafficSpike: boolean
    isDark: boolean
    metaOpacity: number
  },
) {
  const { ready, starting, draining, unhealthy, total, desired } = counts
  const {
    emergencyState,
    emergencyScenarioKey,
    isTrafficSpike,
    isDark,
    metaOpacity,
  } = context
  const missingReplicas = Math.max(desired - ready, 0)
  const serviceAffectedByScenario = isScenarioAffectingService(
    serviceName,
    emergencyState,
    emergencyScenarioKey,
  )

  if (
    unhealthy > 0 ||
    (emergencyState === 'emergency' && serviceAffectedByScenario)
  ) {
    return {
      text:
        unhealthy > 0
          ? `degraded ${unhealthy} failing`
          : `rerouting ${Math.max(missingReplicas, 1)} impact`,
      color: isDark
        ? `rgba(248, 113, 113, ${metaOpacity})`
        : `rgba(220, 38, 38, ${metaOpacity})`,
    }
  }

  if (starting > 0 && desired > total) {
    return {
      text: `scaling +${Math.max(desired - total, starting)}`,
      color: isDark
        ? `rgba(250, 204, 21, ${metaOpacity * 0.96})`
        : `rgba(180, 83, 9, ${metaOpacity})`,
    }
  }

  if (starting > 0) {
    return {
      text: `warming ${starting} pending`,
      color: isDark
        ? `rgba(251, 191, 36, ${metaOpacity * 0.94})`
        : `rgba(202, 138, 4, ${metaOpacity})`,
    }
  }

  if (draining > 0) {
    return {
      text: `rotating ${draining} drain`,
      color: isDark
        ? `rgba(251, 191, 36, ${metaOpacity * 0.9})`
        : `rgba(180, 83, 9, ${metaOpacity})`,
    }
  }

  if (emergencyState === 'recovery' && serviceAffectedByScenario) {
    return {
      text: 'stabilizing mesh',
      color: isDark
        ? `rgba(74, 222, 128, ${metaOpacity})`
        : `rgba(22, 163, 74, ${metaOpacity})`,
    }
  }

  if (isTrafficSpike && desired > ready) {
    return {
      text: `surge target ${desired}`,
      color: isDark
        ? `rgba(56, 189, 248, ${metaOpacity})`
        : `rgba(2, 132, 199, ${metaOpacity})`,
    }
  }

  if (serviceName === 'edge') {
    return {
      text: 'routing ingress',
      color: isDark
        ? `rgba(125, 211, 252, ${metaOpacity})`
        : `rgba(3, 105, 161, ${metaOpacity})`,
    }
  }

  if (serviceName === 'auth') {
    return {
      text: 'verifying jwt',
      color: isDark
        ? `rgba(110, 231, 183, ${metaOpacity})`
        : `rgba(5, 150, 105, ${metaOpacity})`,
    }
  }

  if (serviceName === 'basket') {
    return {
      text: 'holding carts',
      color: isDark
        ? `rgba(110, 231, 183, ${metaOpacity})`
        : `rgba(4, 120, 87, ${metaOpacity})`,
    }
  }

  if (serviceName === 'warehouse') {
    return {
      text: 'checking stock',
      color: isDark
        ? `rgba(251, 191, 36, ${metaOpacity})`
        : `rgba(180, 83, 9, ${metaOpacity})`,
    }
  }

  if (serviceName === 'catalog') {
    return {
      text: 'serving reads',
      color: isDark
        ? `rgba(251, 191, 36, ${metaOpacity})`
        : `rgba(161, 98, 7, ${metaOpacity})`,
    }
  }

  if (serviceName === 'checkout') {
    return {
      text: 'committing orders',
      color: isDark
        ? `rgba(196, 181, 253, ${metaOpacity})`
        : `rgba(109, 40, 217, ${metaOpacity})`,
    }
  }

  return {
    text: 'stable',
    color: isDark
      ? `rgba(148, 163, 184, ${metaOpacity})`
      : `rgba(71, 85, 105, ${metaOpacity})`,
  }
}
