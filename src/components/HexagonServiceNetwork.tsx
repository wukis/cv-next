'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import {
  type ClusterEventEntry,
  type ClusterNodeLifecycle,
  type ClusterNodeRole,
  type ClusterSnapshot,
  type EmergencyScenarioKey,
  type EmergencyState,
  type TriggerSource,
  TRIGGER_NETWORK_EMERGENCY_EVENT,
  dispatchClusterSnapshot,
} from '@/lib/ambientCluster'

type ColorKey =
  | 'emerald'
  | 'sky'
  | 'violet'
  | 'amber'
  | 'red'
  | 'neutral'
  | 'rose'
  | 'teal'
  | 'cyan'
  | 'lime'
  | 'indigo'
  | 'orange'
  | 'slate'
  | 'coral'
  | 'blue'
type ConnectionKind =
  | 'ingress'
  | 'loadBalancer'
  | 'service'
  | 'storage'
  | 'telemetry'

const APP_SERVICE_ORDER = [
  'edge',
  'auth',
  'catalog',
  'basket',
  'checkout',
  'warehouse',
] as const

const EMERGENCY_SCENARIOS: Record<
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
    eventMessage: 'lb-ext failover drill started; traffic is being rerouted around unstable pods',
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
    eventMessage: 'database incident detected; primary writes are failing and services are backing off',
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
    eventMessage: 'redis cluster reload started; cache misses are climbing while keys repopulate',
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
    eventMessage: 'queue saturation detected; worker backlog is rising and dispatch is slowing',
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

type AppServiceGroup = (typeof APP_SERVICE_ORDER)[number]

interface AppServiceConfig {
  name: AppServiceGroup
  displayLabel: string
  labelPrefix: string
  color: ColorKey
  minReplicas: number
  baselineReplicas: [number, number]
  spikeReplicas: number
  maxReplicas: number
  trafficWeight: number
  centerX: number
  centerY: number
  centerZ: number
  downstream: AppServiceGroup[]
}

interface ServiceNode {
  id: number
  role: ClusterNodeRole
  lifecycleState: ClusterNodeLifecycle
  acceptingTraffic: boolean
  scaleDownTarget?: boolean
  replacementLaunched?: boolean
  replacementFor?: string
  replicaGroup?: string
  instanceNumber?: number
  label: string
  color: ColorKey
  x: number
  y: number
  z: number
  targetX: number
  targetY: number
  targetZ: number
  velocityX: number
  velocityY: number
  velocityZ: number
  screenX: number
  screenY: number
  screenScale: number
  size: number
  pulse: number
  pulseSpeed: number
  statusSince: number
  bornAt: number
}

interface Connection {
  id: number
  key: string
  fromNodeId: number
  toNodeId: number
  kind: ConnectionKind
  establishProgress: number
  isEstablished: boolean
  establishSpeed: number
  lastPacketTime: number
  packetInterval: number
}

interface EventToast {
  id: number
  title: string
  subtitle: string
  mode: 'emergency' | 'recovery' | 'autoscale'
  accentColor: string
  duration: number
  shownAt: number
}

interface DataPacket {
  id: number
  connectionKey: string
  progress: number
  speed: number
  type: 'tcp' | 'udp'
  size: number
  direction: 1 | -1
}

interface StatusIndicator {
  id: number
  anchorNodeId: number
  xOffset: number
  yOffset: number
  type: 'success' | 'warning' | 'failure'
  opacity: number
  scale: number
  startTime: number
  duration: number
  label?: string
}

const COLORS: Record<
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

const ROLE_COLORS: Record<ClusterNodeRole, ColorKey> = {
  ingress: 'cyan',
  loadBalancer: 'lime',
  appPod: 'emerald',
  worker: 'coral',
  cache: 'blue',
  queue: 'orange',
  database: 'indigo',
  observability: 'neutral',
}

const CONNECTION_INTERVALS: Record<ConnectionKind, [number, number]> = {
  ingress: [0.8, 1.4],
  loadBalancer: [1.0, 1.8],
  service: [1.8, 2.6],
  storage: [2.0, 3.2],
  telemetry: [2.6, 3.8],
}

const BASE_HEX_SIZE = 22
const PERSPECTIVE = 860
const ROTATION_SPEED_NORMAL = 0.00012
const ROTATION_SPEED_FOCUSED = 0.00048
const DRAIN_DURATION = 2.1
const UNHEALTHY_DURATION = 1.8
const TERMINATING_DURATION = 1.6
const STARTING_DURATION = 3.2
const SNAPSHOT_INTERVAL = 0.45
const POD_LAYOUT_STIFFNESS = 0.09
const POD_LAYOUT_DAMPING = 0.76

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function lerp(start: number, end: number, factor: number) {
  return start + (end - start) * factor
}

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function withOpacity(template: string, opacity: number) {
  return template.replace('VAL', String(clamp(opacity, 0, 1)))
}

function project3D(
  x: number,
  y: number,
  z: number,
  centerX: number,
  centerY: number,
  rotX: number,
  rotY: number,
) {
  const cosY = Math.cos(rotY)
  const sinY = Math.sin(rotY)
  const x1 = x * cosY - z * sinY
  const z1 = x * sinY + z * cosY

  const cosX = Math.cos(rotX)
  const sinX = Math.sin(rotX)
  const y1 = y * cosX - z1 * sinX
  const z2 = y * sinX + z1 * cosX

  const scale = PERSPECTIVE / (PERSPECTIVE + z2)
  return {
    screenX: centerX + x1 * scale,
    screenY: centerY + y1 * scale,
    scale,
    z: z2,
  }
}

function getQuadraticPoint(
  startX: number,
  startY: number,
  controlX: number,
  controlY: number,
  endX: number,
  endY: number,
  t: number,
) {
  const clampedT = clamp(t, 0, 1)
  const inverseT = 1 - clampedT
  return {
    x:
      inverseT * inverseT * startX +
      2 * inverseT * clampedT * controlX +
      clampedT * clampedT * endX,
    y:
      inverseT * inverseT * startY +
      2 * inverseT * clampedT * controlY +
      clampedT * clampedT * endY,
  }
}

function drawQuadraticSegment(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  controlX: number,
  controlY: number,
  endX: number,
  endY: number,
  startT: number,
  endT: number,
) {
  const steps = Math.max(3, Math.ceil(Math.abs(endT - startT) * 12))
  const firstPoint = getQuadraticPoint(
    startX,
    startY,
    controlX,
    controlY,
    endX,
    endY,
    startT,
  )
  ctx.moveTo(firstPoint.x, firstPoint.y)

  for (let index = 1; index <= steps; index += 1) {
    const t = lerp(startT, endT, index / steps)
    const point = getQuadraticPoint(
      startX,
      startY,
      controlX,
      controlY,
      endX,
      endY,
      t,
    )
    ctx.lineTo(point.x, point.y)
  }
}

function getHexPoints(cx: number, cy: number, size: number): [number, number][] {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2
    return [cx + size * Math.cos(angle), cy + size * Math.sin(angle)]
  })
}

function drawHexagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  strokeColor: string,
  fillColor: string | null,
  lineWidth: number,
) {
  const points = getHexPoints(cx, cy, size)
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index][0], points[index][1])
  }
  ctx.closePath()

  if (fillColor) {
    ctx.fillStyle = fillColor
    ctx.fill()
  }

  ctx.strokeStyle = strokeColor
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const effectiveRadius = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + effectiveRadius, y)
  ctx.lineTo(x + width - effectiveRadius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + effectiveRadius)
  ctx.lineTo(x + width, y + height - effectiveRadius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - effectiveRadius, y + height)
  ctx.lineTo(x + effectiveRadius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - effectiveRadius)
  ctx.lineTo(x, y + effectiveRadius)
  ctx.quadraticCurveTo(x, y, x + effectiveRadius, y)
  ctx.closePath()
}

function drawInfoPanel(
  ctx: CanvasRenderingContext2D,
  options: {
    x: number
    y: number
    width: number
    height: number
    radius?: number
    isDark: boolean
    opacity: number
    accentColor?: string
    headerHeight?: number
    footerHeight?: number
  },
) {
  const {
    x,
    y,
    width,
    height,
    radius = 12,
    isDark,
    opacity,
    accentColor,
    headerHeight = Math.min(12, Math.max(10, height * 0.2)),
    footerHeight = Math.min(14, Math.max(12, height * 0.24)),
  } = options
  const panelIsDark = isDark
  const insetX = x + 1
  const insetY = y + 1
  const insetWidth = width - 2
  const insetHeight = height - 2
  const bodyY = insetY + headerHeight
  const bodyHeight = Math.max(18, insetHeight - headerHeight - footerHeight)
  const footerY = insetY + insetHeight - footerHeight

  ctx.save()
  ctx.shadowColor = panelIsDark
    ? `rgba(2, 6, 23, ${opacity * 0.52})`
    : `rgba(15, 23, 42, ${opacity * 0.18})`
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 4
  drawRoundedRectPath(ctx, x, y, width, height, radius)
  ctx.fillStyle = panelIsDark
    ? `rgba(2, 6, 23, ${opacity * 0.94})`
    : `rgba(255, 255, 255, ${opacity * 0.94})`
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  drawRoundedRectPath(ctx, insetX, insetY, insetWidth, insetHeight, Math.max(6, radius - 1))
  ctx.fillStyle = panelIsDark
    ? `rgba(15, 23, 42, ${opacity * 0.82})`
    : `rgba(248, 250, 252, ${opacity * 0.97})`
  ctx.fill()

  ctx.save()
  drawRoundedRectPath(
    ctx,
    insetX,
    insetY,
    insetWidth,
    insetHeight,
    Math.max(6, radius - 1),
  )
  ctx.clip()
  if (accentColor) {
    ctx.fillStyle = accentColor
    ctx.fillRect(insetX, insetY, insetWidth, headerHeight)
  }
  ctx.fillStyle = panelIsDark
    ? `rgba(255, 255, 255, ${opacity * 0.12})`
    : `rgba(255, 255, 255, ${opacity * 0.62})`
  ctx.fillRect(insetX, insetY, insetWidth, 1)
  ctx.fillStyle = panelIsDark
    ? `rgba(2, 6, 23, ${opacity * 0.36})`
    : `rgba(15, 23, 42, ${opacity * 0.14})`
  ctx.fillRect(insetX, insetY + headerHeight - 1, insetWidth, 1)

  ctx.fillStyle = panelIsDark
    ? `rgba(2, 6, 23, ${opacity * 0.18})`
    : `rgba(226, 232, 240, ${opacity * 0.72})`
  ctx.fillRect(insetX, footerY, insetWidth, footerHeight)
  ctx.fillStyle = panelIsDark
    ? `rgba(148, 163, 184, ${opacity * 0.18})`
    : `rgba(148, 163, 184, ${opacity * 0.24})`
  ctx.fillRect(insetX, footerY, insetWidth, 1)
  ctx.restore()

  ctx.lineWidth = 1.2
  ctx.strokeStyle = accentColor
    ? accentColor
    : panelIsDark
      ? `rgba(148, 163, 184, ${opacity * 0.72})`
      : `rgba(148, 163, 184, ${opacity * 0.58})`
  ctx.stroke()
  ctx.restore()

  return {
    header: {
      x: insetX,
      y: insetY,
      width: insetWidth,
      height: headerHeight,
      centerY: insetY + headerHeight / 2,
    },
    body: {
      x: insetX,
      y: bodyY,
      width: insetWidth,
      height: bodyHeight,
      centerY: bodyY + bodyHeight / 2,
    },
    footer: {
      x: insetX,
      y: footerY,
      width: insetWidth,
      height: footerHeight,
      centerY: footerY + footerHeight / 2,
    },
  }
}

function drawPanelText(
  ctx: CanvasRenderingContext2D,
  options: {
    text: string
    x: number
    y: number
    font: string
    fillStyle: string
    plateIsDark: boolean
    emphasis?: 'title' | 'meta' | 'status'
  },
) {
  const {
    text,
    x,
    y,
    font,
    fillStyle,
    plateIsDark,
    emphasis = 'meta',
  } = options
  const outlineColor = plateIsDark
    ? 'rgba(2, 6, 23, 0.98)'
    : 'rgba(255, 255, 255, 0.98)'
  const shadowColor = plateIsDark
    ? 'rgba(15, 23, 42, 0.82)'
    : 'rgba(241, 245, 249, 0.92)'
  const lineWidth =
    emphasis === 'title' ? 3.2 : emphasis === 'status' ? 2.8 : 2.6

  ctx.save()
  ctx.font = font
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = outlineColor
  ctx.lineWidth = lineWidth
  ctx.shadowColor = shadowColor
  ctx.shadowBlur = emphasis === 'title' ? 10 : 8
  ctx.strokeText(text, x, y)
  ctx.shadowBlur = 0
  ctx.fillStyle = fillStyle
  ctx.fillText(text, x, y)
  ctx.restore()
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return ['']
  }

  const lines: string[] = []
  let currentLine = words[0]

  for (let index = 1; index < words.length; index += 1) {
    const nextLine = `${currentLine} ${words[index]}`
    if (ctx.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine
      continue
    }

    lines.push(currentLine)
    currentLine = words[index]
  }

  lines.push(currentLine)
  return lines
}

function getBasePacketInterval(kind: ConnectionKind) {
  const [min, max] = CONNECTION_INTERVALS[kind]
  return randomInRange(min, max)
}

function getPacketType(kind: ConnectionKind) {
  return kind === 'telemetry' || kind === 'service' ? 'udp' : 'tcp'
}

function getPacketSpeed(kind: ConnectionKind) {
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

function getPacketSize(kind: ConnectionKind) {
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

function getPacketDirection(kind: ConnectionKind): 1 | -1 {
  if (kind === 'telemetry') {
    return -1
  }

  return Math.random() > 0.2 ? 1 : -1
}

function createStatusIndicator(
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
    label,
  }
}

function drawStatusIndicator(
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
    ctx.strokeStyle = isDark
      ? 'rgba(52, 211, 153, 1)'
      : 'rgba(16, 185, 129, 1)'
    ctx.lineWidth = 1.6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(-size * 0.5, 0)
    ctx.lineTo(-size * 0.08, size * 0.42)
    ctx.lineTo(size * 0.52, -size * 0.28)
    ctx.stroke()
  } else if (indicator.type === 'warning') {
    ctx.strokeStyle = isDark
      ? 'rgba(251, 191, 36, 1)'
      : 'rgba(245, 158, 11, 1)'
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
    ctx.strokeStyle = isDark
      ? 'rgba(248, 113, 113, 1)'
      : 'rgba(239, 68, 68, 1)'
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

function getHoneycombSlot(slotIndex: number) {
  if (slotIndex === 0) {
    return { q: 0, r: 0 }
  }

  const directions = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ]

  let ring = 1
  let ringStart = 1
  while (ringStart + ring * 6 <= slotIndex) {
    ringStart += ring * 6
    ring += 1
  }

  let q = -ring
  let r = ring
  let offset = slotIndex - ringStart

  for (let side = 0; side < directions.length; side += 1) {
    for (let step = 0; step < ring; step += 1) {
      if (offset === 0) {
        return { q, r }
      }
      q += directions[side].q
      r += directions[side].r
      offset -= 1
    }
  }

  return { q: 0, r: 0 }
}

function getServiceClusterColorKey(
  service: AppServiceConfig,
  emergencyState: EmergencyState,
  emergencyScenarioKey: EmergencyScenarioKey,
  counts: {
    starting: number
    draining: number
    unhealthy: number
  },
): ColorKey {
  return service.color
}

function getServiceClusterActivePodCount(counts: {
  ready: number
  starting: number
  draining: number
}) {
  return counts.ready + counts.starting + Math.max(0, Math.round(counts.draining * 0.35))
}

function getRenderedHoneycombCellCount(podCount: number) {
  if (podCount <= 0) {
    return 0
  }

  if (podCount <= 12) {
    return podCount
  }

  return Math.min(28, 12 + Math.round(Math.sqrt(podCount - 12) * 3.4))
}

function getServiceClusterShellRadius(
  activeCount: number,
  capacity: number,
  scale: number,
  bounce = 1,
) {
  const renderedCells = Math.max(1, getRenderedHoneycombCellCount(activeCount))
  const density = clamp(activeCount / capacity, 0.16, 1)
  const cellSize = clamp((6.2 + renderedCells * 0.26 + scale * 6.2) * bounce, 8, 19.5)
  const growthFactor = Math.min(1.6, Math.sqrt(Math.max(activeCount, 1)) * 0.12)
  return cellSize * (2.1 + density * 1.35 + growthFactor)
}

function getServiceClusterRotation(
  time: number,
  bounceEnergy: number,
  bouncePhase: number,
) {
  const drift = time * 0.18 + bouncePhase * 0.42
  const wobble = Math.sin(time * 0.8 + bouncePhase) * 0.18
  const impactSpin = Math.sin(time * (2.4 + bounceEnergy * 2.6) + bouncePhase) * bounceEnergy * 0.22
  return drift + wobble + impactSpin
}

function chooseServicePanelPlacement(options: {
  clusterX: number
  clusterY: number
  clusterRadius: number
  panelWidth: number
  panelHeight: number
  viewportWidth: number
  viewportHeight: number
  otherCenters: Array<{ x: number; y: number }>
}) {
  const {
    clusterX,
    clusterY,
    clusterRadius,
    panelWidth,
    panelHeight,
    viewportWidth,
    viewportHeight,
    otherCenters,
  } = options

  const viewportCenterX = viewportWidth / 2
  const viewportCenterY = viewportHeight / 2
  const offset = clusterRadius + 18
  const candidates = [
    { x: clusterX - panelWidth / 2, y: clusterY - panelHeight - offset },
    { x: clusterX - panelWidth / 2, y: clusterY + offset },
    { x: clusterX + offset, y: clusterY - panelHeight / 2 },
    { x: clusterX - panelWidth - offset, y: clusterY - panelHeight / 2 },
    { x: clusterX + offset * 0.84, y: clusterY - panelHeight - offset * 0.5 },
    { x: clusterX - panelWidth - offset * 0.84, y: clusterY - panelHeight - offset * 0.5 },
    { x: clusterX + offset * 0.84, y: clusterY + offset * 0.16 },
    { x: clusterX - panelWidth - offset * 0.84, y: clusterY + offset * 0.16 },
  ]

  let bestCandidate = candidates[0]
  let bestScore = Number.NEGATIVE_INFINITY

  candidates.forEach((candidate) => {
    const centerX = candidate.x + panelWidth / 2
    const centerY = candidate.y + panelHeight / 2
    const overflowLeft = Math.max(0, 12 - candidate.x)
    const overflowTop = Math.max(0, 12 - candidate.y)
    const overflowRight = Math.max(0, candidate.x + panelWidth - (viewportWidth - 12))
    const overflowBottom = Math.max(0, candidate.y + panelHeight - (viewportHeight - 12))
    const overflowPenalty =
      (overflowLeft + overflowTop + overflowRight + overflowBottom) * 8

    const nearestClusterDistance = otherCenters.reduce((nearest, center) => {
      return Math.min(nearest, Math.hypot(center.x - centerX, center.y - centerY))
    }, Number.POSITIVE_INFINITY)
    const crowdPenalty = Math.max(0, 190 - nearestClusterDistance) * 1.4
    const viewportRoomBonus =
      Math.abs(centerX - viewportCenterX) * 0.06 +
      Math.abs(centerY - viewportCenterY) * 0.03
    const alignmentBonus =
      Math.abs(centerX - clusterX) > Math.abs(centerY - clusterY) ? 12 : 6
    const score = viewportRoomBonus + alignmentBonus - overflowPenalty - crowdPenalty

    if (score > bestScore) {
      bestScore = score
      bestCandidate = candidate
    }
  })

  return {
    x: clamp(bestCandidate.x, 12, viewportWidth - panelWidth - 12),
    y: clamp(bestCandidate.y, 12, viewportHeight - panelHeight - 12),
  }
}

function drawServiceClusterHoneycomb(
  ctx: CanvasRenderingContext2D,
  options: {
    service: AppServiceConfig
    x: number
    y: number
    scale: number
    time: number
    isDark: boolean
    emergencyState: EmergencyState
    emergencyScenarioKey: EmergencyScenarioKey
    bounceEnergy: number
    bouncePhase: number
    localRotation: number
    counts: {
      ready: number
      starting: number
      draining: number
      unhealthy: number
      total: number
      desired: number
      capacity: number
    }
  },
) {
  const {
    service,
    x,
    y,
    scale,
    time,
    isDark,
    emergencyState,
    emergencyScenarioKey,
    bounceEnergy,
    bouncePhase,
    localRotation,
    counts,
  } = options

  if (counts.total <= 0 || scale < 0.36) {
    return
  }

  const colorKey = getServiceClusterColorKey(
    service,
    emergencyState,
    emergencyScenarioKey,
    counts,
  )
  const palette = COLORS[colorKey]
  const activeCount = getServiceClusterActivePodCount(counts)
  const cellCount = getRenderedHoneycombCellCount(activeCount)
  const ghostCount = Math.max(
    cellCount,
    getRenderedHoneycombCellCount(Math.max(counts.desired, activeCount)),
  )
  const pressure = clamp(
    counts.starting * 0.18 +
      counts.draining * 0.16 +
      counts.unhealthy * 0.24 +
      Math.max(counts.desired - counts.total, 0) * 0.08,
    0,
    1,
  )
  const bounce =
    1 +
    Math.sin(time * (5.4 + bounceEnergy * 3.6) + bouncePhase + x * 0.012 + y * 0.014) *
      bounceEnergy *
      0.22
  const density = clamp(activeCount / counts.capacity, 0.16, 1)
  const cellSize = clamp((6.2 + cellCount * 0.26 + scale * 6.2) * bounce, 8, 19.5)
  const stepX = cellSize * 1.58
  const stepY = cellSize * 1.36
  const shellRadius = getServiceClusterShellRadius(
    activeCount,
    counts.capacity,
    scale,
    bounce,
  )
  const fillOpacity = isDark ? 0.16 + density * 0.12 : 0.18 + density * 0.1
  const strokeOpacity = isDark ? 0.68 + density * 0.18 : 0.72 + density * 0.12
  const ghostOpacity = isDark ? 0.14 : 0.18

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(localRotation)

  ctx.beginPath()
  ctx.arc(0, 0, shellRadius, 0, Math.PI * 2)
  ctx.fillStyle = withOpacity(palette.glow, isDark ? 0.09 + pressure * 0.07 : 0.08 + pressure * 0.05)
  ctx.fill()

  for (let index = 0; index < ghostCount; index += 1) {
    const slot = getHoneycombSlot(index)
    const cellX = (slot.q + slot.r / 2) * stepX
    const cellY = slot.r * stepY

    drawHexagon(
      ctx,
      cellX,
      cellY,
      cellSize * 0.72,
      withOpacity(palette.main, ghostOpacity),
      null,
      1,
    )
  }

  for (let index = 0; index < cellCount; index += 1) {
    const slot = getHoneycombSlot(index)
    const cellX = (slot.q + slot.r / 2) * stepX
    const cellY = slot.r * stepY
    const pulse =
      1 +
      Math.sin(time * 6.2 + bouncePhase + index * 0.8 + service.centerX * 0.01) *
        (0.012 + bounceEnergy * 0.055)
    const currentSize = cellSize * 0.78 * pulse

    drawHexagon(
      ctx,
      cellX,
      cellY,
      currentSize * 1.14,
      withOpacity(palette.glow, isDark ? 0.18 : 0.15),
      withOpacity(palette.fill, isDark ? 0.06 : 0.07),
      0.9,
    )
    drawHexagon(
      ctx,
      cellX,
      cellY,
      currentSize,
      withOpacity(palette.main, strokeOpacity),
      withOpacity(palette.fill, fillOpacity),
      1.4,
    )
    drawHexagon(
      ctx,
      cellX,
      cellY,
      currentSize * 0.42,
      withOpacity(palette.main, isDark ? 0.26 : 0.22),
      null,
      0.8,
    )
  }

  ctx.beginPath()
  ctx.arc(0, 0, shellRadius * 0.72, 0, Math.PI * 2)
  ctx.strokeStyle = withOpacity(
    palette.main,
    isDark ? 0.24 + pressure * 0.14 : 0.2 + pressure * 0.1,
  )
  ctx.lineWidth = 1.1
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(0, 0, Math.max(3.8, cellSize * (0.24 + density * 0.15)), 0, Math.PI * 2)
  ctx.fillStyle = withOpacity(palette.glow, isDark ? 0.5 : 0.36)
  ctx.fill()

  ctx.restore()
}

function getEmergencyScenario(key: EmergencyScenarioKey) {
  return EMERGENCY_SCENARIOS[key]
}

function pickRandomEmergencyScenario(): EmergencyScenarioKey {
  const scenarioKeys = Object.keys(EMERGENCY_SCENARIOS) as EmergencyScenarioKey[]
  return scenarioKeys[Math.floor(Math.random() * scenarioKeys.length)]
}

function getNodePalette(
  node: ServiceNode,
  time: number,
  emergencyState: EmergencyState,
  emergencyScenarioKey: EmergencyScenarioKey,
): { colorKey: ColorKey; attention: number } {
  if (node.lifecycleState === 'unhealthy' || node.lifecycleState === 'terminating') {
    return {
      colorKey: 'red',
      attention: 0.92,
    }
  }

  if (node.lifecycleState === 'draining') {
    return {
      colorKey: node.scaleDownTarget
        ? 'amber'
        : Math.sin(time * 8 + node.id) > 0
          ? 'red'
          : 'amber',
      attention: 0.82,
    }
  }

  if (node.lifecycleState === 'starting') {
    return {
      colorKey: 'amber',
      attention: 0.72,
    }
  }

  const scenario = getEmergencyScenario(emergencyScenarioKey)
  const scenarioActive = emergencyState === 'emergency' || emergencyState === 'recovery'
  const scenarioAffectsNode = scenarioActive && scenario.affectedRoles.includes(node.role)
  if (scenarioAffectsNode) {
    if (emergencyState === 'emergency') {
      return {
        colorKey:
          emergencyScenarioKey === 'cacheReload'
            ? 'amber'
            : emergencyScenarioKey === 'queueFull'
              ? 'orange'
              : 'red',
        attention: 0.9,
      }
    }

    return {
      colorKey:
        emergencyScenarioKey === 'dbDown'
          ? 'indigo'
          : emergencyScenarioKey === 'queueFull'
            ? 'amber'
            : node.color,
      attention: 0.84,
    }
  }

  return {
    colorKey: node.color,
    attention: node.role === 'loadBalancer' ? 0.95 : 0.8,
  }
}

function getNodeVisibility(node: ServiceNode, time: number) {
  const age = time - node.statusSince
  if (node.lifecycleState === 'starting') {
    return clamp(age / STARTING_DURATION, 0, 1)
  }

  if (node.lifecycleState === 'terminating') {
    return clamp(1 - age / TERMINATING_DURATION, 0, 1)
  }

  if (node.lifecycleState === 'unhealthy') {
    return 0.92
  }

  if (node.lifecycleState === 'draining') {
    return 0.84
  }

  return 1
}

function getNodeScaleMultiplier(node: ServiceNode, time: number) {
  if (node.lifecycleState === 'starting') {
    return 0.34 + 0.66 * clamp((time - node.statusSince) / STARTING_DURATION, 0, 1)
  }

  if (node.lifecycleState === 'terminating') {
    return 0.72 + 0.28 * clamp(1 - (time - node.statusSince) / TERMINATING_DURATION, 0, 1)
  }

  if (node.role === 'loadBalancer') {
    return 1.12
  }

  if (node.role === 'ingress') {
    return 1.04
  }

  return 1
}

function getConnectionBaseOpacity(kind: ConnectionKind, focusLevel: number) {
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

function getConnectionStrokeColor(
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

function getServiceStatusDisplay(
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
    isTrafficSpike: boolean
    isDark: boolean
    metaOpacity: number
  },
) {
  const { ready, starting, draining, unhealthy, total, desired } = counts
  const { emergencyState, isTrafficSpike, isDark, metaOpacity } = context
  const missingReplicas = Math.max(desired - ready, 0)

  if (unhealthy > 0 || emergencyState === 'emergency') {
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

  if (emergencyState === 'recovery') {
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

function getEmergencyStateFromRef(state: {
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

const HexagonServiceNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const nodesRef = useRef<ServiceNode[]>([])
  const connectionsRef = useRef<Connection[]>([])
  const packetsRef = useRef<DataPacket[]>([])
  const statusIndicatorsRef = useRef<StatusIndicator[]>([])
  const rotationRef = useRef({ x: 0, y: 0 })
  const timeRef = useRef(0)
  const nodeIdRef = useRef(0)
  const connectionIdRef = useRef(0)
  const packetIdRef = useRef(0)
  const statusIdRef = useRef(0)
  const toastIdRef = useRef(0)
  const lastAutoscaleToastAtRef = useRef(-100)
  const lastSnapshotAtRef = useRef(0)
  const lastEventIdRef = useRef(0)
  const focusTransitionRef = useRef(0)
  const frameSkipRef = useRef(0)
  const isFocusedRef = useRef(false)
  const appServicesRef = useRef<AppServiceConfig[]>([])
  const toastQueueRef = useRef<EventToast[]>([])
  const activeToastRef = useRef<EventToast[]>([])
  const toastSignatureRef = useRef('')
  const serviceInstanceCounterRef = useRef<Record<AppServiceGroup, number>>({
    edge: 0,
    auth: 0,
    catalog: 0,
    basket: 0,
    checkout: 0,
    warehouse: 0,
  })
  const serviceClusterMotionRef = useRef(
    APP_SERVICE_ORDER.reduce(
      (accumulator, serviceName, index) => {
        accumulator[serviceName] = {
          energy: 0,
          activeCount: 0,
          totalCount: 0,
          desiredCount: 0,
          phase: index * 0.82,
        }
        return accumulator
      },
      {} as Record<
        AppServiceGroup,
        {
          energy: number
          activeCount: number
          totalCount: number
          desiredCount: number
          phase: number
        }
      >,
    ),
  )
  const [isDark, setIsDark] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [visibleToasts, setVisibleToasts] = useState<EventToast[]>([])
  const mounted = typeof window !== 'undefined'

  const clusterRef = useRef({
    desiredReplicas: 6,
    nextAmbientFailureTime: 10,
    nextTrafficSpikeTime: 18,
    trafficSpikeEndTime: 0,
    isTrafficSpike: false,
    trafficSpikeLevel: 0,
    trafficSpikeSeverity: 0,
    nextScaleActionTime: 0,
    baselineServiceReplicas: {
      edge: 1,
      auth: 1,
      catalog: 1,
      basket: 1,
      checkout: 1,
      warehouse: 1,
    } as Record<AppServiceGroup, number>,
    desiredServiceReplicas: {
      edge: 1,
      auth: 1,
      catalog: 1,
      basket: 1,
      checkout: 1,
      warehouse: 1,
    } as Record<AppServiceGroup, number>,
  })

  const emergencyRef = useRef({
    isActive: false,
    isRecovery: false,
    scenarioKey: 'failover' as EmergencyScenarioKey,
    triggerSource: null as TriggerSource,
    startTime: 0,
    duration: 9,
    recoveryStartTime: 0,
    recoveryDuration: 4.5,
    lastEmergencyTime: 0,
    nextEmergencyInterval: 30,
    hasTriggeredFirstEmergency: false,
    hasEverFocused: false,
    accumulatedFocusTime: 0,
    firstEmergencyDelay: 2.6,
    nextFailureTime: 0,
    triggeredFailures: 0,
    failureTarget: 0,
    recoveryAnnounced: false,
  })

  const getEmergencyState = useCallback(
    () => getEmergencyStateFromRef(emergencyRef.current),
    [],
  )

  const createNode = useCallback(
    (
      role: ClusterNodeRole,
      label: string,
      x: number,
      y: number,
      z: number,
      overrides?: Partial<ServiceNode>,
    ): ServiceNode => {
      const defaultLifecycle: ClusterNodeLifecycle =
        role === 'appPod' ? 'ready' : 'healthy'

      return {
        id: nodeIdRef.current++,
        role,
        lifecycleState: defaultLifecycle,
        acceptingTraffic: role !== 'appPod' || defaultLifecycle === 'ready',
        scaleDownTarget: false,
        replacementLaunched: false,
        label,
        color: ROLE_COLORS[role],
        x,
        y,
        z,
        targetX: x,
        targetY: y,
        targetZ: z,
        velocityX: 0,
        velocityY: 0,
        velocityZ: 0,
        screenX: 0,
        screenY: 0,
        screenScale: 1,
        size:
          role === 'loadBalancer'
            ? BASE_HEX_SIZE + 5
            : role === 'database'
              ? BASE_HEX_SIZE + 3
              : role === 'appPod'
                ? BASE_HEX_SIZE + 1.5
                : BASE_HEX_SIZE,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.012 + Math.random() * 0.014,
        statusSince: timeRef.current,
        bornAt: timeRef.current,
        ...overrides,
      }
    },
    [],
  )

  const getAppServiceConfig = useCallback((serviceName: AppServiceGroup) => {
    return appServicesRef.current.find((service) => service.name === serviceName)
  }, [])

  const createAppPod = useCallback(
    (
      serviceName: AppServiceGroup,
      x: number,
      y: number,
      z: number,
      overrides?: Partial<ServiceNode>,
    ) => {
      const service = getAppServiceConfig(serviceName)
      const nextInstance = (serviceInstanceCounterRef.current[serviceName] ?? 0) + 1
      serviceInstanceCounterRef.current[serviceName] = nextInstance

      return createNode(
        'appPod',
        `${service?.labelPrefix ?? serviceName}-${nextInstance}`,
        x,
        y,
        z,
        {
          replicaGroup: serviceName,
          color: service?.color ?? 'emerald',
          instanceNumber: nextInstance,
          ...overrides,
        },
      )
    },
    [createNode, getAppServiceConfig],
  )

  const buildClusterSnapshot = useCallback(
    (recentEvent?: ClusterEventEntry): ClusterSnapshot => {
      const appPods = nodesRef.current.filter((node) => node.role === 'appPod')
      const loadBalancerTargets = appPods
        .filter(
          (node) =>
            node.replicaGroup === 'edge' &&
            node.lifecycleState === 'ready' &&
            node.acceptingTraffic,
        )
        .map((node) => node.label)
      const readyReplicas = appPods.filter(
        (node) => node.lifecycleState === 'ready' && node.acceptingTraffic,
      ).length
      const startingReplicas = appPods.filter(
        (node) => node.lifecycleState === 'starting',
      ).length
      const drainingReplicas = appPods.filter(
        (node) => node.lifecycleState === 'draining',
      ).length
      const unhealthyReplicas = appPods.filter(
        (node) => node.lifecycleState === 'unhealthy',
      ).length
      const terminatingReplicas = appPods.filter(
        (node) => node.lifecycleState === 'terminating',
      ).length
      const emergencyState = getEmergencyState()
      const emergencyScenario = getEmergencyScenario(emergencyRef.current.scenarioKey)
      const replicaTarget = clusterRef.current.desiredReplicas
      const pressureFactor = 1 - readyReplicas / Math.max(replicaTarget, 1)
      const emergencyFactor = emergencyState === 'emergency' ? 1 : emergencyState === 'recovery' ? 0.35 : 0
      const focusFactor = focusTransitionRef.current
      const spikeFactor = clusterRef.current.trafficSpikeLevel

      return {
        emergencyState,
        focusMode: isFocusedRef.current ? 'preview' : 'idle',
        scenarioKey:
          emergencyState === 'normal' ? null : emergencyRef.current.scenarioKey,
        isTrafficSpike: clusterRef.current.isTrafficSpike,
        triggerSource:
          emergencyState === 'normal' ? null : emergencyRef.current.triggerSource,
        replicaTarget,
        liveReplicas: appPods.length,
        readyReplicas,
        startingReplicas,
        drainingReplicas,
        unhealthyReplicas,
        terminatingReplicas,
        loadBalancerTargets,
        loadBalancerHealthy: loadBalancerTargets.length >= 1,
        requestRate:
          1200 +
          readyReplicas * 150 +
          focusFactor * 340 -
          pressureFactor * 280 +
          emergencyFactor * 120 +
          spikeFactor * 1650,
        errorRate:
          clamp(
            unhealthyReplicas * 4 +
              drainingReplicas * 1.4 +
              terminatingReplicas * 1.1 +
              emergencyFactor * (6 + emergencyScenario.metricImpact.errorRate),
            0.2,
            18,
          ),
        latencyMs:
          28 +
          pressureFactor * 48 +
          unhealthyReplicas * 10 +
          drainingReplicas * 7 +
          emergencyFactor * (18 + emergencyScenario.metricImpact.latencyMs),
        queueDepth: Math.round(
            8 +
              pressureFactor * 42 +
              emergencyFactor * (34 + emergencyScenario.metricImpact.queueDepth) +
              focusFactor * 10 +
              startingReplicas * 6 +
              spikeFactor * 28,
        ),
        trafficIntensity: clamp(
          0.3 +
            focusFactor * 0.55 +
            emergencyFactor * (0.15 + emergencyScenario.metricImpact.trafficIntensity) +
            spikeFactor * 0.26,
          0,
          1,
        ),
        recentEvent,
      }
    },
    [getEmergencyState],
  )

  const emitClusterSnapshot = useCallback(
    (force = false, recentEvent?: ClusterEventEntry) => {
      const now = timeRef.current
      if (!force && now - lastSnapshotAtRef.current < SNAPSHOT_INTERVAL) {
        return
      }

      lastSnapshotAtRef.current = now
      dispatchClusterSnapshot(buildClusterSnapshot(recentEvent))
    },
    [buildClusterSnapshot],
  )

  const pushClusterEvent = useCallback(
    (
      level: ClusterEventEntry['level'],
      message: string,
      forceSnapshot = true,
    ) => {
      const event: ClusterEventEntry = {
        id: ++lastEventIdRef.current,
        level,
        message,
        timestamp: Date.now(),
      }

      if (forceSnapshot) {
        emitClusterSnapshot(true, event)
      }

      return event
    },
    [emitClusterSnapshot],
  )

  const enqueueEventToast = useCallback(
    (toast: Omit<EventToast, 'id' | 'shownAt'>) => {
      const nextToast: EventToast = {
        id: ++toastIdRef.current,
        shownAt: 0,
        ...toast,
      }

      toastQueueRef.current.push(nextToast)

      while (activeToastRef.current.length + toastQueueRef.current.length > 3) {
        if (activeToastRef.current.length > 0) {
          activeToastRef.current.sort((left, right) => left.shownAt - right.shownAt)
          activeToastRef.current.shift()
        } else {
          toastQueueRef.current.shift()
        }
      }
    },
    [],
  )

  const syncVisibleToasts = useCallback(() => {
    const nextToasts = [...activeToastRef.current].sort(
      (left, right) => left.shownAt - right.shownAt,
    )
    const nextSignature = nextToasts
      .map((toast) => `${toast.id}:${toast.mode}:${toast.shownAt}`)
      .join('|')

    if (nextSignature === toastSignatureRef.current) {
      return
    }

    toastSignatureRef.current = nextSignature
    setVisibleToasts(nextToasts)
  }, [])

  const enqueueAutoscalerToast = useCallback(
    (title: string, subtitle: string, accentColor: string) => {
      if (timeRef.current - lastAutoscaleToastAtRef.current < 1.2) {
        return
      }

      lastAutoscaleToastAtRef.current = timeRef.current
      enqueueEventToast({
        title,
        subtitle,
        mode: 'autoscale',
        accentColor,
        duration: 4.4,
      })
    },
    [enqueueEventToast],
  )

  const getReadyAppPods = useCallback(() => {
    return nodesRef.current.filter(
      (node) =>
        node.role === 'appPod' &&
        node.lifecycleState === 'ready' &&
        node.acceptingTraffic,
    )
  }, [])

  const hasRollingReplacementInFlight = useCallback(() => {
    return nodesRef.current.some(
      (node) =>
        node.role === 'appPod' &&
        (node.lifecycleState === 'starting' ||
          node.lifecycleState === 'draining' ||
          node.lifecycleState === 'unhealthy' ||
          node.lifecycleState === 'terminating'),
    )
  }, [])

  const getScalingActivityCount = useCallback(() => {
    return nodesRef.current.filter(
      (node) =>
        node.role === 'appPod' &&
        (node.lifecycleState === 'starting' || node.lifecycleState === 'draining'),
    ).length
  }, [])

  const getActiveScalingServices = useCallback(() => {
    return new Set(
      nodesRef.current
        .filter(
          (node) =>
            node.role === 'appPod' &&
            node.replicaGroup &&
            (node.lifecycleState === 'starting' || node.lifecycleState === 'draining'),
        )
        .map((node) => node.replicaGroup as AppServiceGroup),
    )
  }, [])

  const getServiceReplicaCount = useCallback((serviceName: AppServiceGroup) => {
    return nodesRef.current.filter(
      (node) =>
        node.role === 'appPod' &&
        node.replicaGroup === serviceName &&
        node.lifecycleState !== 'terminating',
    ).length
  }, [])

  const getMostVisibleServiceGroups = useCallback((limit = 3) => {
    const canvas = canvasRef.current
    const services = appServicesRef.current

    if (!canvas || services.length === 0) {
      return APP_SERVICE_ORDER.slice(0, limit) as AppServiceGroup[]
    }

    const width = canvas.clientWidth || canvas.width || 1
    const height = canvas.clientHeight || canvas.height || 1
    const centerX = width / 2
    const centerY = height / 2
    const { x: rotX, y: rotY } = rotationRef.current

    return [...services]
      .map((service) => {
        const projected = project3D(
          service.centerX,
          service.centerY,
          service.centerZ,
          centerX,
          centerY,
          rotX,
          rotY,
        )
        const normalizedDx = (projected.screenX - centerX) / (width * 0.48)
        const normalizedDy = (projected.screenY - centerY) / (height * 0.48)
        const centrality = clamp(1 - Math.hypot(normalizedDx, normalizedDy), 0, 1)
        const depthWeight = clamp(projected.scale, 0.35, 1.35)
        const score = depthWeight * 0.7 + centrality * 0.9

        return {
          name: service.name,
          score,
        }
      })
      .sort((serviceA, serviceB) => serviceB.score - serviceA.score)
      .slice(0, limit)
      .map((service) => service.name)
  }, [])

  const sortServicesByVisibility = useCallback(
    (serviceNames: AppServiceGroup[]) => {
      const visibleServiceNames = getMostVisibleServiceGroups(3)
      const visibleRank = new Map(
        visibleServiceNames.map((serviceName, index) => [serviceName, index]),
      )

      return [...serviceNames].sort((serviceA, serviceB) => {
        const rankA = visibleRank.get(serviceA) ?? Number.POSITIVE_INFINITY
        const rankB = visibleRank.get(serviceB) ?? Number.POSITIVE_INFINITY

        if (rankA !== rankB) {
          return rankA - rankB
        }

        return APP_SERVICE_ORDER.indexOf(serviceA) - APP_SERVICE_ORDER.indexOf(serviceB)
      })
    },
    [getMostVisibleServiceGroups],
  )

  const getServicePodPlacement = useCallback(
    (serviceName: AppServiceGroup, slotIndex: number, totalSlots: number) => {
      const service = getAppServiceConfig(serviceName)

      if (!service) {
        return {
          x: randomInRange(-40, 40),
          y: randomInRange(-30, 30),
          z: randomInRange(-30, 30),
        }
      }

      const safeTotalSlots = Math.max(totalSlots, 1)
      const densityFactor = clamp(1 - (safeTotalSlots - 1) * 0.038, 0.6, 1)
      const cellRadius = 24 * densityFactor
      const honeycombX = cellRadius * Math.sqrt(3)
      const honeycombY = cellRadius * 1.5
      const depthGap = 18 * (0.72 + densityFactor * 0.28)
      const microJitter = 2.4 * densityFactor
      const slot = getHoneycombSlot(slotIndex)
      const xOffset = honeycombX * (slot.q + slot.r / 2)
      const yOffset = honeycombY * slot.r

      return {
        x:
          service.centerX +
          xOffset +
          Math.sin(slotIndex * 0.7 + service.centerX * 0.01) * microJitter,
        y:
          service.centerY +
          yOffset +
          Math.cos(slotIndex * 0.85 + service.centerY * 0.01) * microJitter,
        z:
          service.centerZ +
          ((slot.q + slot.r) % 2 === 0 ? 1 : -1) * depthGap +
          slot.q * 6 * densityFactor -
          slot.r * 5 * densityFactor +
          Math.sin(slotIndex * 0.62 + service.centerZ * 0.01) * microJitter,
      }
    },
    [getAppServiceConfig],
  )

  const getConnectionControlPoint = useCallback(
    (
      connection: Connection,
      fromNode: ServiceNode,
      toNode: ServiceNode,
      from: ReturnType<typeof project3D>,
      to: ReturnType<typeof project3D>,
      canvasCenterX: number,
      canvasCenterY: number,
      rotX: number,
      rotY: number,
    ) => {
      const midX = (from.screenX + to.screenX) / 2
      const midY = (from.screenY + to.screenY) / 2
      const dx = to.screenX - from.screenX
      const dy = to.screenY - from.screenY
      const distance = Math.hypot(dx, dy) || 1
      const normalX = -dy / distance
      const normalY = dx / distance
      const fromGroup = fromNode.replicaGroup ?? fromNode.role
      const toGroup = toNode.replicaGroup ?? toNode.role
      const bundleKey = `${fromGroup}:${toGroup}:${connection.kind}`
      const bundleHash = Array.from(bundleKey).reduce(
        (sum, character) => sum + character.charCodeAt(0),
        0,
      )
      const direction = bundleHash % 2 === 0 ? 1 : -1

      if (connection.kind === 'ingress') {
        return {
          x: midX,
          y: midY,
        }
      }

      let bend =
        connection.kind === 'loadBalancer'
          ? 22
          : connection.kind === 'service'
            ? 18
            : connection.kind === 'telemetry'
              ? 10
              : 14

      let anchorX = midX
      let anchorY = midY
      let anchorWeight = 0

      const fromService =
        fromNode.replicaGroup && APP_SERVICE_ORDER.includes(fromNode.replicaGroup as AppServiceGroup)
          ? getAppServiceConfig(fromNode.replicaGroup as AppServiceGroup)
          : undefined
      const toService =
        toNode.replicaGroup && APP_SERVICE_ORDER.includes(toNode.replicaGroup as AppServiceGroup)
          ? getAppServiceConfig(toNode.replicaGroup as AppServiceGroup)
          : undefined

      if (fromService && toService) {
        const fromCluster = project3D(
          fromService.centerX,
          fromService.centerY,
          fromService.centerZ,
          canvasCenterX,
          canvasCenterY,
          rotX,
          rotY,
        )
        const toCluster = project3D(
          toService.centerX,
          toService.centerY,
          toService.centerZ,
          canvasCenterX,
          canvasCenterY,
          rotX,
          rotY,
        )
        anchorX = (fromCluster.screenX + toCluster.screenX) / 2
        anchorY = (fromCluster.screenY + toCluster.screenY) / 2
        anchorWeight = 0.6
      } else if (fromService || toService) {
        const service = fromService ?? toService
        if (service) {
          const cluster = project3D(
            service.centerX,
            service.centerY,
            service.centerZ,
            canvasCenterX,
            canvasCenterY,
            rotX,
            rotY,
          )
          anchorX = lerp(midX, cluster.screenX, 0.62)
          anchorY = lerp(midY, cluster.screenY, 0.62)
          anchorWeight = 0.4
          bend *= 0.85
        }
      } else if (connection.kind === 'loadBalancer') {
        anchorY = lerp(midY, canvasCenterY - 36, 0.42)
        anchorWeight = 0.3
      }

      if (fromNode.replicaGroup && fromNode.replicaGroup === toNode.replicaGroup) {
        bend *= 0.45
      }

      return {
        x: lerp(midX, anchorX, anchorWeight) + normalX * bend * direction,
        y: lerp(midY, anchorY, anchorWeight) + normalY * bend * direction,
      }
    },
    [getAppServiceConfig],
  )

  const relayoutServicePods = useCallback(() => {
    APP_SERVICE_ORDER.forEach((serviceName) => {
      const service = getAppServiceConfig(serviceName)
      if (!service) {
        return
      }

      const serviceNodes = nodesRef.current.filter(
        (node) =>
          node.role === 'appPod' &&
          node.replicaGroup === serviceName &&
          node.lifecycleState !== 'terminating',
      )

      const activeNodes = serviceNodes
        .filter(
          (node) =>
            node.lifecycleState !== 'unhealthy' &&
            !(node.lifecycleState === 'draining' && node.scaleDownTarget),
        )
        .sort(
          (nodeA, nodeB) =>
            (nodeA.instanceNumber ?? 0) - (nodeB.instanceNumber ?? 0) ||
            nodeA.bornAt - nodeB.bornAt,
        )

      activeNodes.forEach((node, index) => {
        const placement = getServicePodPlacement(
          serviceName,
          index,
          activeNodes.length,
        )
        node.targetX = placement.x
        node.targetY = placement.y
        node.targetZ = placement.z
      })

      const exitingNodes = serviceNodes.filter(
        (node) => !activeNodes.some((activeNode) => activeNode.id === node.id),
      )
      const exitDirection = service.centerX >= 0 ? 1 : -1

      exitingNodes.forEach((node, index) => {
        node.targetX = service.centerX + exitDirection * (118 + index * 18)
        node.targetY = service.centerY - 26 + index * 18
        node.targetZ = service.centerZ + (index % 2 === 0 ? 22 : -22) + index * 8
      })
    })
  }, [getAppServiceConfig, getServicePodPlacement])

  const getTrafficSpikeReplicaTarget = useCallback(
    (serviceName: AppServiceGroup, severity: number) => {
      const baseline = clusterRef.current.baselineServiceReplicas[serviceName]
      const service = getAppServiceConfig(serviceName)

      if (!service) {
        return baseline
      }

      const spikeCeiling = Math.max(service.spikeReplicas, baseline)
      if (spikeCeiling <= baseline) {
        return baseline
      }

      const demandEnvelope = clamp(
        severity * (0.74 + service.trafficWeight * 0.68) + Math.random() * 0.22,
        0,
        1,
      )
      const spikeEnvelope = clamp(
        severity * (0.88 + service.trafficWeight * 0.42) + Math.random() * 0.16,
        0,
        1,
      )
      const burstHeadroom = Math.max(service.maxReplicas - spikeCeiling, 0)
      const burstEnvelope =
        burstHeadroom > 0
          ? clamp(
              Math.max(0, severity - 0.34) * (0.95 + service.trafficWeight * 0.9) +
                Math.random() * 0.14,
              0,
              1,
            )
          : 0
      const targetByDemand =
        baseline + Math.round((service.maxReplicas - baseline) * demandEnvelope)
      const targetBySpike = Math.round(
        baseline + (spikeCeiling - baseline) * spikeEnvelope,
      )
      const targetByBurst = Math.round(spikeCeiling + burstHeadroom * burstEnvelope)

      return clamp(
        Math.max(targetByDemand, targetBySpike, targetByBurst),
        baseline,
        service.maxReplicas,
      )
    },
    [getAppServiceConfig],
  )

  const createReplacementPod = useCallback(
    (failedNode: ServiceNode) => {
      const serviceName = (failedNode.replicaGroup as AppServiceGroup | undefined) ?? 'edge'
      const service = getAppServiceConfig(serviceName)
      if (!service) {
        return
      }
      const nextNode = createAppPod(
        serviceName,
        service.centerX + randomInRange(-10, 10),
        service.centerY + randomInRange(-8, 8),
        service.centerZ + randomInRange(-10, 10),
        {
          lifecycleState: 'starting',
          acceptingTraffic: false,
          replacementLaunched: false,
          replacementFor: failedNode.label,
          statusSince: timeRef.current,
        },
      )

      nodesRef.current.push(nextNode)
      pushClusterEvent(
        'info',
        `deployment/${serviceName} created replacement ${nextNode.label} for ${failedNode.label}`,
      )
    },
    [createAppPod, getAppServiceConfig, pushClusterEvent],
  )

  const triggerPodFailure = useCallback(
    (reason: 'ambient' | 'emergency') => {
      const candidates = getReadyAppPods()
      if (candidates.length === 0) {
        return false
      }

      const visibleServices = new Set(getMostVisibleServiceGroups(3))
      const preferredCandidates = candidates.filter((candidate) =>
        candidate.replicaGroup
          ? visibleServices.has(candidate.replicaGroup as AppServiceGroup)
          : false,
      )
      const selectionPool =
        preferredCandidates.length > 0 ? preferredCandidates : candidates
      const pod = selectionPool[Math.floor(Math.random() * selectionPool.length)]
      pod.lifecycleState = 'draining'
      pod.acceptingTraffic = false
      pod.statusSince = timeRef.current
      pod.replacementLaunched = false

      const message =
        reason === 'emergency'
          ? `readiness probe failed on ${pod.label}; lb-ext removed target and rerouted traffic`
          : `cluster controller marked ${pod.label} unhealthy; draining traffic from lb-ext`

      pushClusterEvent(reason === 'emergency' ? 'error' : 'warn', message)
      emitClusterSnapshot(true)
      return true
    },
    [emitClusterSnapshot, getMostVisibleServiceGroups, getReadyAppPods, pushClusterEvent],
  )

  const createScaleUpPod = useCallback(
    (serviceName: AppServiceGroup) => {
      const service = getAppServiceConfig(serviceName)
      if (!service) {
        return false
      }

      const node = createAppPod(
        serviceName,
        service.centerX + randomInRange(-12, 12),
        service.centerY + randomInRange(-10, 10),
        service.centerZ + randomInRange(-12, 12),
        {
          lifecycleState: 'starting',
          acceptingTraffic: false,
          replacementLaunched: false,
          statusSince: timeRef.current,
        },
      )

      nodesRef.current.push(node)
      pushClusterEvent(
        'info',
        `autoscaler is adding ${node.label} to ${serviceName} on the private network`,
      )
      enqueueAutoscalerToast(
        'AUTOSCALER SCALE OUT',
        `adding ${node.label} to ${serviceName}`,
        'rgba(96, 165, 250, 0.9)',
      )
      return true
    },
    [
      createAppPod,
      enqueueAutoscalerToast,
      getAppServiceConfig,
      pushClusterEvent,
    ],
  )

  const requestScaleDownPod = useCallback(
    (serviceName: AppServiceGroup) => {
      const candidates = nodesRef.current
        .filter(
          (node) =>
            node.role === 'appPod' &&
            node.replicaGroup === serviceName &&
            node.lifecycleState === 'ready' &&
            node.acceptingTraffic,
        )
        .sort((nodeA, nodeB) => nodeB.bornAt - nodeA.bornAt)

      const pod = candidates[0]
      if (!pod) {
        return false
      }

      pod.scaleDownTarget = true
      pod.acceptingTraffic = false
      pod.replacementLaunched = true
      pod.replacementFor = undefined
      pod.lifecycleState = 'draining'
      pod.statusSince = timeRef.current
      pushClusterEvent(
        'warn',
        `autoscaler is draining surplus ${pod.label} from ${serviceName}`,
      )
      enqueueAutoscalerToast(
        'AUTOSCALER SCALE IN',
        `draining ${pod.label} from ${serviceName}`,
        'rgba(251, 191, 36, 0.9)',
      )
      emitClusterSnapshot(true)
      return true
    },
    [emitClusterSnapshot, enqueueAutoscalerToast, pushClusterEvent],
  )

  const runAutoscaler = useCallback(() => {
    const cluster = clusterRef.current
    const maxConcurrentScalingPods = cluster.isTrafficSpike ? 5 : 4
    const maxConcurrentScalingServices = 3
    const activeScalingServices = getActiveScalingServices()
    const visibleServiceNames = getMostVisibleServiceGroups(3)
    const visibleServiceSet = new Set(visibleServiceNames)
    if (
      timeRef.current < cluster.nextScaleActionTime ||
      getScalingActivityCount() >= maxConcurrentScalingPods ||
      nodesRef.current.some((node) => node.role === 'appPod' && node.lifecycleState === 'unhealthy')
    ) {
      return false
    }

    const canScaleService = (serviceName: AppServiceGroup) =>
      activeScalingServices.has(serviceName) ||
      (visibleServiceSet.has(serviceName) &&
        activeScalingServices.size < maxConcurrentScalingServices)

    const scaleUpOrder = sortServicesByVisibility([
      'edge',
      'basket',
      'checkout',
      'warehouse',
      'catalog',
      'auth',
    ])
    for (const serviceName of scaleUpOrder) {
      const currentReplicas = getServiceReplicaCount(serviceName)
      const desiredReplicas = cluster.desiredServiceReplicas[serviceName]

      if (currentReplicas < desiredReplicas && canScaleService(serviceName)) {
        if (createScaleUpPod(serviceName)) {
          cluster.nextScaleActionTime = timeRef.current + 0.42 + Math.random() * 0.35
          return true
        }
      }
    }

    const scaleDownOrder = sortServicesByVisibility([
      'catalog',
      'warehouse',
      'checkout',
      'basket',
      'edge',
      'auth',
    ])
    for (const serviceName of scaleDownOrder) {
      const currentReplicas = getServiceReplicaCount(serviceName)
      const desiredReplicas = cluster.desiredServiceReplicas[serviceName]

      if (currentReplicas > desiredReplicas && canScaleService(serviceName)) {
        if (requestScaleDownPod(serviceName)) {
          cluster.nextScaleActionTime = timeRef.current + 0.58 + Math.random() * 0.4
          return true
        }
      }
    }

    return false
  }, [
    createScaleUpPod,
    getActiveScalingServices,
    getMostVisibleServiceGroups,
    getServiceReplicaCount,
    getScalingActivityCount,
    requestScaleDownPod,
    sortServicesByVisibility,
  ])

  const startEmergency = useCallback(
    (
      scenarioKey?: EmergencyScenarioKey,
      triggerSource: TriggerSource = null,
    ) => {
      const emergency = emergencyRef.current
      if (emergency.isActive || emergency.isRecovery) {
        return
      }

      const nextScenarioKey = scenarioKey ?? pickRandomEmergencyScenario()
      const scenario = getEmergencyScenario(nextScenarioKey)
      emergency.isActive = true
      emergency.scenarioKey = nextScenarioKey
      emergency.triggerSource = triggerSource
      emergency.startTime = timeRef.current
      emergency.hasTriggeredFirstEmergency = true
      emergency.nextFailureTime = timeRef.current + 0.4
      emergency.triggeredFailures = 0
      emergency.failureTarget = Math.min(
        scenario.failureTarget,
        Math.max(2, getReadyAppPods().length - 1),
      )
      emergency.recoveryAnnounced = false
      pushClusterEvent('error', scenario.eventMessage)
      enqueueEventToast({
        title: scenario.title,
        subtitle: scenario.subtitle,
        mode: 'emergency',
        accentColor: 'rgba(248, 113, 113, 0.92)',
        duration: 4.8,
      })
      window.dispatchEvent(
        new CustomEvent('network-emergency', { detail: { type: 'start' } }),
      )
      emitClusterSnapshot(true)
    },
    [emitClusterSnapshot, enqueueEventToast, getReadyAppPods, pushClusterEvent],
  )

  const initNodes = useCallback(
    (width: number, height: number) => {
      nodeIdRef.current = 0
      connectionIdRef.current = 0
      packetIdRef.current = 0
      statusIdRef.current = 0
      serviceInstanceCounterRef.current = {
        edge: 0,
        auth: 0,
        catalog: 0,
        basket: 0,
        checkout: 0,
        warehouse: 0,
      }

      clusterRef.current.desiredReplicas = 6
      clusterRef.current.nextAmbientFailureTime = 8 + Math.random() * 6
      clusterRef.current.nextTrafficSpikeTime = 5 + Math.random() * 6
      clusterRef.current.trafficSpikeEndTime = 0
      clusterRef.current.isTrafficSpike = false
      clusterRef.current.trafficSpikeLevel = 0
      clusterRef.current.trafficSpikeSeverity = 0
      clusterRef.current.nextScaleActionTime = 0
      const rightWidgetGutter = clamp(width * 0.16, 220, 300)
      const leftContentGutter = clamp(width * 0.12, 110, 180)
      const topPreviewGutter = clamp(height * 0.18, 120, 190)
      const bottomContentGutter = clamp(height * 0.14, 110, 170)
      const leftBound = -width / 2 + leftContentGutter
      const rightBound = width / 2 - rightWidgetGutter
      const topBound = -height / 2 + topPreviewGutter
      const bottomBound = height / 2 - bottomContentGutter
      const infraDepth = clamp(width * 0.12, 110, 180)
      const serviceConfigs: AppServiceConfig[] = [
        {
          name: 'edge',
          displayLabel: 'edge service',
          labelPrefix: 'edge',
          color: 'sky',
          minReplicas: 1,
          baselineReplicas: [3, 7],
          spikeReplicas: 12,
          maxReplicas: 18,
          trafficWeight: 1,
          centerX: lerp(leftBound, rightBound, 0.84),
          centerY: lerp(topBound, bottomBound, 0.46),
          centerZ: infraDepth * 0.72,
          downstream: ['auth', 'catalog', 'basket', 'checkout'],
        },
        {
          name: 'auth',
          displayLabel: 'auth service',
          labelPrefix: 'auth',
          color: 'emerald',
          minReplicas: 1,
          baselineReplicas: [2, 5],
          spikeReplicas: 7,
          maxReplicas: 12,
          trafficWeight: 0.56,
          centerX: lerp(leftBound, rightBound, 0.6),
          centerY: lerp(topBound, bottomBound, 0.18),
          centerZ: infraDepth * 0.16,
          downstream: [],
        },
        {
          name: 'catalog',
          displayLabel: 'catalog service',
          labelPrefix: 'catalog',
          color: 'amber',
          minReplicas: 1,
          baselineReplicas: [3, 6],
          spikeReplicas: 10,
          maxReplicas: 18,
          trafficWeight: 0.68,
          centerX: lerp(leftBound, rightBound, 0.52),
          centerY: lerp(topBound, bottomBound, 0.82),
          centerZ: -infraDepth * 0.26,
          downstream: ['warehouse'],
        },
        {
          name: 'basket',
          displayLabel: 'basket service',
          labelPrefix: 'basket',
          color: 'rose',
          minReplicas: 1,
          baselineReplicas: [3, 8],
          spikeReplicas: 14,
          maxReplicas: 24,
          trafficWeight: 0.84,
          centerX: lerp(leftBound, rightBound, 0.37),
          centerY: lerp(topBound, bottomBound, 0.5),
          centerZ: infraDepth * 0.28,
          downstream: [],
        },
        {
          name: 'checkout',
          displayLabel: 'checkout service',
          labelPrefix: 'checkout',
          color: 'violet',
          minReplicas: 1,
          baselineReplicas: [5, 10],
          spikeReplicas: 22,
          maxReplicas: 50,
          trafficWeight: 1.18,
          centerX: lerp(leftBound, rightBound, 0.16),
          centerY: lerp(topBound, bottomBound, 0.36),
          centerZ: infraDepth * 0.9,
          downstream: ['auth', 'basket', 'warehouse'],
        },
        {
          name: 'warehouse',
          displayLabel: 'warehouse service',
          labelPrefix: 'warehouse',
          color: 'teal',
          minReplicas: 1,
          baselineReplicas: [2, 6],
          spikeReplicas: 9,
          maxReplicas: 16,
          trafficWeight: 0.62,
          centerX: lerp(leftBound, rightBound, 0.18),
          centerY: lerp(topBound, bottomBound, 0.78),
          centerZ: -infraDepth * 0.62,
          downstream: [],
        },
      ]
      appServicesRef.current = serviceConfigs
      clusterRef.current.baselineServiceReplicas = serviceConfigs.reduce(
        (accumulator, service) => {
          const [baselineMin, baselineMax] = service.baselineReplicas
          accumulator[service.name] = clamp(
            baselineMin + Math.floor(Math.random() * (baselineMax - baselineMin + 1)),
            service.minReplicas,
            service.maxReplicas,
          )
          return accumulator
        },
        {
          edge: 1,
          auth: 1,
          catalog: 1,
          basket: 1,
          checkout: 1,
          warehouse: 1,
        } as Record<
          AppServiceGroup,
          number
        >,
      )
      clusterRef.current.desiredServiceReplicas = {
        ...clusterRef.current.baselineServiceReplicas,
      }
      clusterRef.current.desiredReplicas = Object.values(
        clusterRef.current.desiredServiceReplicas,
      ).reduce((sum, count) => sum + count, 0)

      const nodes: ServiceNode[] = [
        createNode(
          'ingress',
          'ingress',
          lerp(leftBound, rightBound, 0.95),
          lerp(topBound, bottomBound, 0.46),
          infraDepth * 1.4,
          {
          replicaGroup: 'edge',
          },
        ),
        createNode(
          'loadBalancer',
          'lb-ext',
          lerp(leftBound, rightBound, 0.88),
          lerp(topBound, bottomBound, 0.54),
          infraDepth,
          {
          replicaGroup: 'edge',
          },
        ),
        createNode(
          'cache',
          'redis-m',
          lerp(leftBound, rightBound, 0.46),
          lerp(topBound, bottomBound, 0.88),
          infraDepth * 0.08,
        ),
        createNode(
          'cache',
          'redis-r1',
          lerp(leftBound, rightBound, 0.38),
          lerp(topBound, bottomBound, 0.97),
          -infraDepth * 0.42,
        ),
        createNode(
          'cache',
          'redis-r2',
          lerp(leftBound, rightBound, 0.54),
          lerp(topBound, bottomBound, 0.92),
          -infraDepth * 0.66,
        ),
        createNode(
          'queue',
          'queue',
          lerp(leftBound, rightBound, 0.24),
          lerp(topBound, bottomBound, 0.78),
          0,
        ),
        createNode(
          'database',
          'pg-primary',
          lerp(leftBound, rightBound, 0.1),
          lerp(topBound, bottomBound, 0.89),
          -infraDepth * 1.15,
        ),
        createNode(
          'database',
          'pg-replica',
          lerp(leftBound, rightBound, 0.26),
          lerp(topBound, bottomBound, 0.93),
          -infraDepth * 1.34,
        ),
        createNode(
          'worker',
          'worker-a',
          lerp(leftBound, rightBound, 0.04),
          lerp(topBound, bottomBound, 0.82),
          infraDepth * 0.52,
        ),
        createNode(
          'worker',
          'worker-b',
          lerp(leftBound, rightBound, 0.14),
          lerp(topBound, bottomBound, 0.66),
          infraDepth * 0.22,
        ),
        createNode(
          'observability',
          'metrics',
          lerp(leftBound, rightBound, 0.92),
          lerp(topBound, bottomBound, 0.98),
          -infraDepth * 0.88,
        ),
        createNode(
          'observability',
          'logs',
          lerp(leftBound, rightBound, 0.05),
          lerp(topBound, bottomBound, 0.98),
          -infraDepth * 0.94,
        ),
      ]

      serviceConfigs.forEach((service) => {
        const initialReplicaCount =
          clusterRef.current.baselineServiceReplicas[service.name] ?? service.minReplicas

        for (let index = 0; index < initialReplicaCount; index += 1) {
          const placement = getServicePodPlacement(
            service.name,
            index,
            initialReplicaCount,
          )

          nodes.push(
            createAppPod(service.name, placement.x, placement.y, placement.z),
          )
        }
      })

      return nodes
    },
    [createAppPod, createNode, getServicePodPlacement],
  )

  const syncConnections = useCallback(() => {
    const nodes = nodesRef.current
    const ingress = nodes.find((node) => node.role === 'ingress')
    const loadBalancer = nodes.find((node) => node.role === 'loadBalancer')
    const caches = nodes.filter((node) => node.role === 'cache')
    const redisMaster =
      caches.find((node) => node.label === 'redis-m') ?? caches[0]
    const redisReplicas = caches.filter((node) => node.id !== redisMaster?.id)
    const queues = nodes.filter((node) => node.role === 'queue')
    const databases = nodes.filter((node) => node.role === 'database')
    const workers = nodes.filter((node) => node.role === 'worker')
    const observability = nodes.filter((node) => node.role === 'observability')
    const metricsNode = observability.find((node) => node.label === 'metrics')
    const logsNode = observability.find((node) => node.label === 'logs')
    const connectedAppPods = nodes.filter(
      (node) =>
        node.role === 'appPod' &&
        node.lifecycleState !== 'terminating' &&
        node.lifecycleState !== 'starting',
    )
    const podsByService = APP_SERVICE_ORDER.reduce(
      (accumulator, serviceName) => {
        accumulator[serviceName] = connectedAppPods.filter(
          (node) => node.replicaGroup === serviceName,
        )
        return accumulator
      },
      {
        edge: [],
        auth: [],
        catalog: [],
        basket: [],
        checkout: [],
        warehouse: [],
      } as Record<AppServiceGroup, ServiceNode[]>,
    )

    const desiredConnections: Array<{
      fromNodeId: number
      toNodeId: number
      kind: ConnectionKind
    }> = []

    if (ingress && loadBalancer) {
      desiredConnections.push({
        fromNodeId: ingress.id,
        toNodeId: loadBalancer.id,
        kind: 'ingress',
      })
    }

    podsByService.edge.forEach((pod, index) => {
      if (loadBalancer) {
        desiredConnections.push({
          fromNodeId: loadBalancer.id,
          toNodeId: pod.id,
          kind: 'loadBalancer',
        })
      }

      appServicesRef.current
        .find((service) => service.name === 'edge')
        ?.downstream.forEach((downstreamService) => {
          const downstreamPods = podsByService[downstreamService]
          const targetPod =
            downstreamPods[index % Math.max(downstreamPods.length, 1)]

          if (targetPod) {
            desiredConnections.push({
              fromNodeId: pod.id,
              toNodeId: targetPod.id,
              kind: 'service',
            })
          }
        })
    })

    connectedAppPods.forEach((pod, index) => {
      const queue = queues[0]
      const worker = workers[index % Math.max(workers.length, 1)]
      const telemetry = observability[index % Math.max(observability.length, 1)]
      const primaryDb = databases.find((node) => node.label === 'pg-primary') ?? databases[0]
      const replicaDb = databases.find((node) => node.label === 'pg-replica') ?? databases[1] ?? databases[0]
      const authTarget = podsByService.auth[index % Math.max(podsByService.auth.length, 1)]
      const catalogTarget =
        podsByService.catalog[index % Math.max(podsByService.catalog.length, 1)]
      const basketTarget =
        podsByService.basket[index % Math.max(podsByService.basket.length, 1)]
      const warehouseTarget =
        podsByService.warehouse[index % Math.max(podsByService.warehouse.length, 1)]

      if (pod.replicaGroup === 'auth') {
        if (redisMaster) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: redisMaster.id,
            kind: 'service',
          })
        }

        if (primaryDb) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: primaryDb.id,
            kind: 'storage',
          })
        }
      }

      if (pod.replicaGroup === 'catalog') {
        if (redisMaster) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: redisMaster.id,
            kind: 'service',
          })
        }

        if (replicaDb) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: replicaDb.id,
            kind: 'storage',
          })
        }

        if (warehouseTarget) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: warehouseTarget.id,
            kind: 'service',
          })
        }
      }

      if (pod.replicaGroup === 'basket') {
        if (authTarget) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: authTarget.id,
            kind: 'service',
          })
        }

        if (redisMaster) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: redisMaster.id,
            kind: 'service',
          })
        }

        if (primaryDb) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: primaryDb.id,
            kind: 'storage',
          })
        }
      }

      if (pod.replicaGroup === 'checkout') {
        if (authTarget) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: authTarget.id,
            kind: 'service',
          })
        }

        if (catalogTarget) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: catalogTarget.id,
            kind: 'service',
          })
        }

        if (basketTarget) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: basketTarget.id,
            kind: 'service',
          })
        }

        if (warehouseTarget) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: warehouseTarget.id,
            kind: 'service',
          })
        }

        if (queue) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: queue.id,
            kind: 'service',
          })
        }

        if (redisMaster) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: redisMaster.id,
            kind: 'service',
          })
        }

        if (primaryDb) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: primaryDb.id,
            kind: 'storage',
          })
        }
      }

      if (pod.replicaGroup === 'warehouse') {
        if (catalogTarget) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: catalogTarget.id,
            kind: 'service',
          })
        }

        if (queue) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: queue.id,
            kind: 'service',
          })
        }

        if (replicaDb) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: replicaDb.id,
            kind: 'storage',
          })
        }
      }

      if (pod.replicaGroup === 'edge' && worker) {
        desiredConnections.push({
          fromNodeId: worker.id,
          toNodeId: pod.id,
          kind: 'service',
        })
      }

      if (telemetry) {
        desiredConnections.push({
          fromNodeId: telemetry.id,
          toNodeId: pod.id,
          kind: 'telemetry',
        })
      }
    })

    APP_SERVICE_ORDER.forEach((serviceName) => {
      const servicePods = podsByService[serviceName]

      if (servicePods.length > 1) {
        servicePods.forEach((pod, index) => {
          const peerPod = servicePods[(index + 1) % servicePods.length]
          if (peerPod && peerPod.id !== pod.id) {
            desiredConnections.push({
              fromNodeId: pod.id,
              toNodeId: peerPod.id,
              kind: 'service',
            })
          }
        })
      }
    })

    if (queues[0] && redisMaster) {
      desiredConnections.push({
        fromNodeId: queues[0].id,
        toNodeId: redisMaster.id,
        kind: 'service',
      })
    }

    if (redisMaster) {
      redisReplicas.forEach((replica, index) => {
        desiredConnections.push({
          fromNodeId: redisMaster.id,
          toNodeId: replica.id,
          kind: 'storage',
        })

        const peerReplica =
          redisReplicas[(index + 1) % Math.max(redisReplicas.length, 1)]
        if (peerReplica && peerReplica.id !== replica.id) {
          desiredConnections.push({
            fromNodeId: replica.id,
            toNodeId: peerReplica.id,
            kind: 'telemetry',
          })
        }
      })
    }

    if (metricsNode && ingress) {
      desiredConnections.push({
        fromNodeId: metricsNode.id,
        toNodeId: ingress.id,
        kind: 'telemetry',
      })
    }

    if (metricsNode && loadBalancer) {
      desiredConnections.push({
        fromNodeId: metricsNode.id,
        toNodeId: loadBalancer.id,
        kind: 'telemetry',
      })
    }

    if (logsNode && loadBalancer) {
      desiredConnections.push({
        fromNodeId: logsNode.id,
        toNodeId: loadBalancer.id,
        kind: 'telemetry',
      })
    }

    if (metricsNode && queues[0]) {
      desiredConnections.push({
        fromNodeId: metricsNode.id,
        toNodeId: queues[0].id,
        kind: 'telemetry',
      })
    }

    if (logsNode && queues[0]) {
      desiredConnections.push({
        fromNodeId: logsNode.id,
        toNodeId: queues[0].id,
        kind: 'telemetry',
      })
    }

    caches.forEach((cacheNode) => {
      if (metricsNode) {
        desiredConnections.push({
          fromNodeId: metricsNode.id,
          toNodeId: cacheNode.id,
          kind: 'telemetry',
        })
      }

      if (logsNode) {
        desiredConnections.push({
          fromNodeId: logsNode.id,
          toNodeId: cacheNode.id,
          kind: 'telemetry',
        })
      }
    })

    if (redisMaster && queues[0]) {
      desiredConnections.push({
        fromNodeId: redisMaster.id,
        toNodeId: queues[0].id,
        kind: 'service',
      })
    }

    if (queues[0]) {
      workers.forEach((worker) => {
        desiredConnections.push({
          fromNodeId: queues[0].id,
          toNodeId: worker.id,
          kind: 'service',
        })
      })
    }

    workers.forEach((worker, index) => {
      const database = databases[index % Math.max(databases.length, 1)]
      if (database) {
        desiredConnections.push({
          fromNodeId: worker.id,
          toNodeId: database.id,
          kind: 'storage',
        })
      }

      if (metricsNode) {
        desiredConnections.push({
          fromNodeId: metricsNode.id,
          toNodeId: worker.id,
          kind: 'telemetry',
        })
      }

      if (logsNode) {
        desiredConnections.push({
          fromNodeId: logsNode.id,
          toNodeId: worker.id,
          kind: 'telemetry',
        })
      }
    })

    databases.forEach((database) => {
      if (metricsNode) {
        desiredConnections.push({
          fromNodeId: metricsNode.id,
          toNodeId: database.id,
          kind: 'telemetry',
        })
      }

      if (logsNode) {
        desiredConnections.push({
          fromNodeId: logsNode.id,
          toNodeId: database.id,
          kind: 'telemetry',
        })
      }
    })

    const existingByKey = new Map(
      connectionsRef.current.map((connection) => [connection.key, connection]),
    )

    connectionsRef.current = desiredConnections.map((descriptor) => {
      const key = `${descriptor.fromNodeId}:${descriptor.toNodeId}:${descriptor.kind}`
      const existing = existingByKey.get(key)
      if (existing) {
        return existing
      }

      return {
        id: connectionIdRef.current++,
        key,
        fromNodeId: descriptor.fromNodeId,
        toNodeId: descriptor.toNodeId,
        kind: descriptor.kind,
        establishProgress: 0,
        isEstablished: false,
        establishSpeed:
          descriptor.kind === 'ingress'
            ? 0.03
            : descriptor.kind === 'loadBalancer'
              ? 0.024
              : 0.018,
        lastPacketTime: timeRef.current,
        packetInterval: getBasePacketInterval(descriptor.kind),
      }
    })
  }, [])

  const createPacket = useCallback((connection: Connection): DataPacket => {
    return {
      id: packetIdRef.current++,
      connectionKey: connection.key,
      progress: 0,
      speed: getPacketSpeed(connection.kind),
      type: getPacketType(connection.kind),
      size: getPacketSize(connection.kind),
      direction: getPacketDirection(connection.kind),
    }
  }, [])

  useEffect(() => {
    const checkClasses = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
      setIsFocused(document.documentElement.classList.contains('animation-focus'))
    }

    checkClasses()

    const observer = new MutationObserver(checkClasses)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    isFocusedRef.current = isFocused
    emitClusterSnapshot(true)
  }, [emitClusterSnapshot, isFocused])

  useEffect(() => {
    const handleTriggerEmergency = (event: Event) => {
      const customEvent = event as CustomEvent<{
        scenarioKey?: EmergencyScenarioKey
        triggerSource?: TriggerSource
      }>
      startEmergency(
        customEvent.detail?.scenarioKey,
        customEvent.detail?.triggerSource ?? null,
      )
    }

    window.addEventListener(TRIGGER_NETWORK_EMERGENCY_EVENT, handleTriggerEmergency)
    return () =>
      window.removeEventListener(
        TRIGGER_NETWORK_EMERGENCY_EVENT,
        handleTriggerEmergency,
      )
  }, [startEmergency])

  useEffect(() => {
    if (!mounted) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    let width = window.innerWidth
    let height = window.innerHeight
    let centerX = width / 2
    let centerY = height / 2

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight
      centerX = width / 2
      centerY = height / 2
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      nodesRef.current = initNodes(width, height)
      connectionsRef.current = []
      packetsRef.current = []
      statusIndicatorsRef.current = []
      toastQueueRef.current = []
      activeToastRef.current = []
      toastSignatureRef.current = ''
      setVisibleToasts([])
      syncConnections()
      emitClusterSnapshot(true)
    }

    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      if (!isFocusedRef.current && frameSkipRef.current % 2 === 0) {
        frameSkipRef.current += 1
        timeRef.current += 0.016
        emitClusterSnapshot()
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      frameSkipRef.current += 1
      timeRef.current += 0.016

      ctx.clearRect(0, 0, width, height)

      const targetFocus = isFocusedRef.current ? 1 : 0
      focusTransitionRef.current +=
        (targetFocus - focusTransitionRef.current) * 0.05
      const focusLevel = focusTransitionRef.current

      const rotationSpeed =
        ROTATION_SPEED_NORMAL +
        (ROTATION_SPEED_FOCUSED - ROTATION_SPEED_NORMAL) * focusLevel
      rotationRef.current.y += rotationSpeed
      rotationRef.current.x = Math.sin(timeRef.current * 0.1) * 0.14

      const rotX = rotationRef.current.x
      const rotY = rotationRef.current.y

      if (isFocusedRef.current) {
        const emergency = emergencyRef.current
        if (!emergency.hasEverFocused) {
          emergency.hasEverFocused = true
        }
        emergency.accumulatedFocusTime += 0.016
      }

      const emergency = emergencyRef.current
      const currentEmergencyState = getEmergencyState()
      const cluster = clusterRef.current

      cluster.trafficSpikeLevel +=
        ((cluster.isTrafficSpike ? cluster.trafficSpikeSeverity : 0) -
          cluster.trafficSpikeLevel) *
        0.03

      if (
        currentEmergencyState === 'normal' &&
        !cluster.isTrafficSpike &&
        timeRef.current > cluster.nextTrafficSpikeTime
      ) {
        cluster.isTrafficSpike = true
        cluster.trafficSpikeEndTime = timeRef.current + 10 + Math.random() * 6
        cluster.trafficSpikeSeverity = 0.5 + Math.random() * 0.5
        cluster.desiredServiceReplicas = {
          edge: getTrafficSpikeReplicaTarget('edge', cluster.trafficSpikeSeverity),
          auth: getTrafficSpikeReplicaTarget('auth', cluster.trafficSpikeSeverity),
          catalog: getTrafficSpikeReplicaTarget('catalog', cluster.trafficSpikeSeverity),
          basket: getTrafficSpikeReplicaTarget('basket', cluster.trafficSpikeSeverity),
          checkout: getTrafficSpikeReplicaTarget('checkout', cluster.trafficSpikeSeverity),
          warehouse: getTrafficSpikeReplicaTarget('warehouse', cluster.trafficSpikeSeverity),
        }
        cluster.desiredReplicas = Object.values(cluster.desiredServiceReplicas).reduce(
          (sum, count) => sum + count,
          0,
        )
        cluster.nextScaleActionTime = timeRef.current + 0.5
        pushClusterEvent(
          'warn',
          'ingress traffic spike detected; autoscaler is rolling more service pods into the private network',
        )
      } else if (
        cluster.isTrafficSpike &&
        timeRef.current > cluster.trafficSpikeEndTime
      ) {
        cluster.isTrafficSpike = false
        cluster.trafficSpikeSeverity = 0
        cluster.desiredServiceReplicas = {
          ...cluster.baselineServiceReplicas,
        }
        cluster.desiredReplicas = Object.values(cluster.desiredServiceReplicas).reduce(
          (sum, count) => sum + count,
          0,
        )
        cluster.nextTrafficSpikeTime = timeRef.current + 5 + Math.random() * 7
        cluster.nextScaleActionTime = timeRef.current + 0.7
        pushClusterEvent(
          'info',
          'ingress traffic normalized; autoscaler is slowly rolling excess pods back out',
        )
      }

      if (currentEmergencyState === 'normal') {
        runAutoscaler()
      }

      if (
        emergency.hasEverFocused &&
        !emergency.hasTriggeredFirstEmergency &&
        !emergency.isActive &&
        !emergency.isRecovery &&
        emergency.accumulatedFocusTime > emergency.firstEmergencyDelay
      ) {
        startEmergency(undefined, 'hover-auto')
      } else if (
        emergency.hasTriggeredFirstEmergency &&
        !emergency.isActive &&
        !emergency.isRecovery &&
        timeRef.current - emergency.lastEmergencyTime > emergency.nextEmergencyInterval
      ) {
        startEmergency()
      }

      if (
        currentEmergencyState === 'normal' &&
        !cluster.isTrafficSpike &&
        !hasRollingReplacementInFlight() &&
        timeRef.current > cluster.nextAmbientFailureTime
      ) {
        if (triggerPodFailure('ambient')) {
          cluster.nextAmbientFailureTime =
            timeRef.current + 14 + Math.random() * 14
        }
      }

      if (emergency.isActive) {
        if (
          emergency.triggeredFailures < emergency.failureTarget &&
          timeRef.current >= emergency.nextFailureTime &&
          !hasRollingReplacementInFlight()
        ) {
          if (triggerPodFailure('emergency')) {
            emergency.triggeredFailures += 1
          }
          emergency.nextFailureTime = timeRef.current + 2.8
        }

        if (timeRef.current - emergency.startTime > emergency.duration) {
          emergency.isActive = false
          emergency.isRecovery = true
          emergency.recoveryStartTime = timeRef.current
          emergency.recoveryAnnounced = false
          window.dispatchEvent(
            new CustomEvent('network-emergency', {
              detail: { type: 'recovery' },
            }),
          )
        }
      }

      if (emergency.isRecovery) {
        if (!emergency.recoveryAnnounced) {
          emergency.recoveryAnnounced = true
          pushClusterEvent(
            'success',
            'deployment controller is reconciling replicas; healthy pods are taking traffic again',
          )
          enqueueEventToast({
            title: 'CLUSTER RECOVERING',
            subtitle: 'replacement pods are joining the service mesh',
            mode: 'recovery',
            accentColor: 'rgba(74, 222, 128, 0.84)',
            duration: 6,
          })
        }

        if (timeRef.current - emergency.recoveryStartTime > emergency.recoveryDuration) {
          emergency.isRecovery = false
          emergency.lastEmergencyTime = timeRef.current
          emergency.triggerSource = null
          emergency.nextEmergencyInterval = isFocusedRef.current
            ? 60
            : 60 + Math.random() * 120
          window.dispatchEvent(
            new CustomEvent('network-emergency', { detail: { type: 'end' } }),
          )
          emitClusterSnapshot(true)
        }
      }

      activeToastRef.current = activeToastRef.current.filter(
        (toast) => timeRef.current - toast.shownAt <= toast.duration,
      )

      while (
        activeToastRef.current.length < 3 &&
        toastQueueRef.current.length > 0
      ) {
        const nextToast = toastQueueRef.current.shift()
        if (nextToast) {
          nextToast.shownAt = timeRef.current
          activeToastRef.current.push(nextToast)
        }
      }

      syncVisibleToasts()

      nodesRef.current = nodesRef.current.flatMap((node) => {
        if (node.role !== 'appPod') {
          return [node]
        }

        const age = timeRef.current - node.statusSince
        if (node.lifecycleState === 'draining' && age > DRAIN_DURATION) {
          if (node.scaleDownTarget) {
            node.lifecycleState = 'terminating'
            node.statusSince = timeRef.current
            pushClusterEvent(
              'info',
              `autoscaler removed ${node.label} from ${node.replicaGroup} after traffic cooled`,
            )
          } else {
            node.lifecycleState = 'unhealthy'
            node.statusSince = timeRef.current
            node.replacementLaunched = false
            pushClusterEvent(
              'error',
              `${node.label} failed its last health check; replacement requested`,
            )
          }
        } else if (
          node.lifecycleState === 'unhealthy' &&
          age > UNHEALTHY_DURATION &&
          !node.replacementLaunched &&
          !nodesRef.current.some(
            (candidate) =>
              candidate.role === 'appPod' &&
              candidate.lifecycleState === 'starting',
          )
        ) {
          createReplacementPod(node)
          node.replacementLaunched = true
          pushClusterEvent(
            'info',
            `scheduler is bringing up a replacement for ${node.label} before shutdown`,
          )
        } else if (
          node.lifecycleState === 'terminating' &&
          age > TERMINATING_DURATION
        ) {
          return []
        } else if (node.lifecycleState === 'starting' && age > STARTING_DURATION) {
          node.lifecycleState = 'ready'
          node.acceptingTraffic = true
          node.scaleDownTarget = false
          node.statusSince = timeRef.current
          node.replacementLaunched = true
          if (node.replacementFor) {
            const previousPod = nodesRef.current.find(
              (candidate) =>
                candidate.role === 'appPod' &&
                candidate.label === node.replacementFor &&
                candidate.lifecycleState === 'unhealthy',
            )

            if (previousPod) {
              previousPod.lifecycleState = 'terminating'
              previousPod.statusSince = timeRef.current
              pushClusterEvent(
                'warn',
                `rolling update is shutting down ${previousPod.label} after ${node.label} joined the pool`,
              )
            }
          } else {
            pushClusterEvent(
              'success',
              `${node.label} is ready; ${node.replicaGroup} has one more pod on the private network`,
            )
          }
          if (node.replicaGroup === 'edge') {
            pushClusterEvent(
              'success',
              `${node.label} became ready; lb-ext added it back into rotation`,
            )
          }
        }

        return [node]
      })

      syncConnections()

      relayoutServicePods()

      nodesRef.current.forEach((node) => {
        if (node.role !== 'appPod') {
          return
        }

        node.velocityX =
          (node.velocityX + (node.targetX - node.x) * POD_LAYOUT_STIFFNESS) *
          POD_LAYOUT_DAMPING
        node.velocityY =
          (node.velocityY + (node.targetY - node.y) * POD_LAYOUT_STIFFNESS) *
          POD_LAYOUT_DAMPING
        node.velocityZ =
          (node.velocityZ + (node.targetZ - node.z) * POD_LAYOUT_STIFFNESS) *
          POD_LAYOUT_DAMPING

        node.x += node.velocityX
        node.y += node.velocityY
        node.z += node.velocityZ
      })

      nodesRef.current.forEach((node) => {
        node.pulse += node.pulseSpeed * (0.72 + focusLevel * 0.72)
        const projected = project3D(
          node.x,
          node.y,
          node.z,
          centerX,
          centerY,
          rotX,
          rotY,
        )
        node.screenX = projected.screenX
        node.screenY = projected.screenY
        node.screenScale = projected.scale
      })

      const nodeMap = new Map(nodesRef.current.map((node) => [node.id, node]))

      connectionsRef.current = connectionsRef.current.filter((connection) => {
        const fromNode = nodeMap.get(connection.fromNodeId)
        const toNode = nodeMap.get(connection.toNodeId)

        if (!fromNode || !toNode) {
          return false
        }

        if (!connection.isEstablished) {
          connection.establishProgress +=
            connection.establishSpeed * (0.68 + focusLevel * 0.8)
          if (connection.establishProgress >= 1) {
            connection.establishProgress = 1
            connection.isEstablished = true
          }
        }

        return true
      })

      const sortedNodes = [...nodesRef.current].sort((nodeA, nodeB) => {
        const a = project3D(nodeA.x, nodeA.y, nodeA.z, centerX, centerY, rotX, rotY)
        const b = project3D(nodeB.x, nodeB.y, nodeB.z, centerX, centerY, rotX, rotY)
        return a.z - b.z
      })

      connectionsRef.current.forEach((connection) => {
        const fromNode = nodeMap.get(connection.fromNodeId)
        const toNode = nodeMap.get(connection.toNodeId)

        if (!fromNode || !toNode) {
          return
        }

        const from = project3D(
          fromNode.x,
          fromNode.y,
          fromNode.z,
          centerX,
          centerY,
          rotX,
          rotY,
        )
        const to = project3D(
          toNode.x,
          toNode.y,
          toNode.z,
          centerX,
          centerY,
          rotX,
          rotY,
        )

        const lineProgress = connection.establishProgress
        const currentX = from.screenX + (to.screenX - from.screenX) * lineProgress
        const currentY = from.screenY + (to.screenY - from.screenY) * lineProgress
        const avgZ = (from.z + to.z) / 2
        const depthFade = clamp((PERSPECTIVE + avgZ) / (PERSPECTIVE * 1.8), 0.28, 1)
        const fromIncident =
          fromNode.lifecycleState === 'draining' ||
          fromNode.lifecycleState === 'unhealthy' ||
          fromNode.lifecycleState === 'terminating'
        const toIncident =
          toNode.lifecycleState === 'draining' ||
          toNode.lifecycleState === 'unhealthy' ||
          toNode.lifecycleState === 'terminating'
        const baseOpacity =
          getConnectionBaseOpacity(connection.kind, focusLevel) * depthFade
        const opacity = baseOpacity * (toIncident || fromIncident ? 0.9 : 1)

        ctx.strokeStyle = getConnectionStrokeColor(
          connection.kind,
          fromIncident || toIncident,
          isDark,
          opacity,
        )
        ctx.lineWidth =
          connection.kind === 'ingress'
            ? isDark
              ? 1.45
              : 1.75
            : connection.kind === 'loadBalancer'
              ? isDark
                ? 1.1
                : 1.3
              : connection.kind === 'telemetry'
                ? isDark
                  ? 0.95
                  : 1.15
              : isDark
                ? 0.75
                : 1.05

        if (connection.kind === 'loadBalancer' || connection.kind === 'service') {
          const dashOffset = (timeRef.current * 18) % 24
          ctx.setLineDash(connection.kind === 'loadBalancer' ? [5, 7] : [4, 9])
          ctx.lineDashOffset = -dashOffset
        } else if (connection.kind === 'telemetry') {
          ctx.setLineDash([2, 8])
        }

        ctx.beginPath()
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.moveTo(from.screenX, from.screenY)
        if (connection.isEstablished) {
          const control = getConnectionControlPoint(
            connection,
            fromNode,
            toNode,
            from,
            to,
            centerX,
            centerY,
            rotX,
            rotY,
          )
          ctx.quadraticCurveTo(control.x, control.y, to.screenX, to.screenY)
        } else {
          ctx.lineTo(currentX, currentY)
        }
        ctx.stroke()
        ctx.setLineDash([])

        const targetReady =
          connection.kind === 'loadBalancer'
            ? toNode.lifecycleState === 'ready' && toNode.acceptingTraffic
            : connection.kind === 'ingress'
              ? true
              : connection.kind === 'telemetry'
                ? toNode.lifecycleState !== 'starting' &&
                  toNode.lifecycleState !== 'terminating'
                : (fromNode.lifecycleState === 'ready' ||
                    fromNode.lifecycleState === 'healthy') &&
                  (toNode.lifecycleState === 'healthy' ||
                    toNode.lifecycleState === 'ready')

        const packetIntervalMultiplier =
          1.55 - focusLevel * 0.72 - (currentEmergencyState === 'emergency' ? 0.25 : 0)
        if (
          connection.isEstablished &&
          targetReady &&
          timeRef.current - connection.lastPacketTime >
            connection.packetInterval * packetIntervalMultiplier
        ) {
          packetsRef.current.push(createPacket(connection))
          connection.lastPacketTime = timeRef.current
          connection.packetInterval = getBasePacketInterval(connection.kind)

          if (
            connection.kind === 'loadBalancer' &&
            Math.random() < 0.2 + focusLevel * 0.25
          ) {
            const response = createPacket(connection)
            response.direction = -1
            response.type = 'udp'
            response.size = 2
            packetsRef.current.push(response)
          }
        }
      })

      const connectionMap = new Map(
        connectionsRef.current.map((connection) => [connection.key, connection]),
      )

      packetsRef.current = packetsRef.current.filter((packet) => {
        const connection = connectionMap.get(packet.connectionKey)
        if (!connection) {
          return false
        }

        const fromNode = nodeMap.get(connection.fromNodeId)
        const toNode = nodeMap.get(connection.toNodeId)
        if (!fromNode || !toNode) {
          return false
        }

        packet.progress += packet.speed * (0.62 + focusLevel * 0.9)
        if (packet.progress >= 1) {
          const targetNode = packet.direction === 1 ? toNode : fromNode
          let statusType: StatusIndicator['type'] = 'success'
          let label: string | undefined
          let shouldShowIndicator = false

          if (
            targetNode.lifecycleState === 'draining' ||
            targetNode.lifecycleState === 'unhealthy' ||
            currentEmergencyState === 'emergency'
          ) {
            statusType = 'failure'
            shouldShowIndicator = Math.random() < 0.5
          } else if (targetNode.lifecycleState === 'starting') {
            statusType = 'warning'
            shouldShowIndicator = Math.random() < 0.3
          } else if (currentEmergencyState === 'recovery') {
            shouldShowIndicator = Math.random() < 0.12
          } else if (connection.kind === 'telemetry') {
            statusType = 'warning'
            shouldShowIndicator = false
          } else {
            shouldShowIndicator = Math.random() < 0.05 + focusLevel * 0.03
          }

          if (shouldShowIndicator) {
            statusIndicatorsRef.current.push(
              createStatusIndicator(
                statusIdRef.current++,
                timeRef.current,
                targetNode.id,
                statusType,
                label,
              ),
            )
          }
          return false
        }

        const from = project3D(
          fromNode.x,
          fromNode.y,
          fromNode.z,
          centerX,
          centerY,
          rotX,
          rotY,
        )
        const to = project3D(
          toNode.x,
          toNode.y,
          toNode.z,
          centerX,
          centerY,
          rotX,
          rotY,
        )

        const control = getConnectionControlPoint(
          connection,
          fromNode,
          toNode,
          from,
          to,
          centerX,
          centerY,
          rotX,
          rotY,
        )
        const headT = packet.direction === 1 ? packet.progress : 1 - packet.progress
        const headPoint = getQuadraticPoint(
          from.screenX,
          from.screenY,
          control.x,
          control.y,
          to.screenX,
          to.screenY,
          headT,
        )
        const x = headPoint.x
        const y = headPoint.y
        const packetZ = from.z + (to.z - from.z) * headT
        const depthFade = clamp((PERSPECTIVE + packetZ) / (PERSPECTIVE * 1.9), 0.35, 1)
        const targetNode = packet.direction === 1 ? toNode : fromNode
        const palette = COLORS[
          getNodePalette(
            targetNode,
            timeRef.current,
            currentEmergencyState,
            emergencyRef.current.scenarioKey,
          ).colorKey
        ]

        const trailLength = packet.type === 'tcp' ? 0.16 : 0.1
        const tailT =
          packet.direction === 1
            ? Math.max(0, headT - trailLength)
            : Math.min(1, headT + trailLength)
        const tailPoint = getQuadraticPoint(
          from.screenX,
          from.screenY,
          control.x,
          control.y,
          to.screenX,
          to.screenY,
          tailT,
        )
        const trailX = tailPoint.x
        const trailY = tailPoint.y

        const gradient = ctx.createLinearGradient(trailX, trailY, x, y)
        gradient.addColorStop(0, 'transparent')
        gradient.addColorStop(
          1,
          withOpacity(palette.main, (isDark ? 0.38 : 0.46) * depthFade),
        )

        ctx.beginPath()
        drawQuadraticSegment(
          ctx,
          from.screenX,
          from.screenY,
          control.x,
          control.y,
          to.screenX,
          to.screenY,
          tailT,
          headT,
        )
        ctx.strokeStyle = gradient
        ctx.lineWidth =
          connection.kind === 'ingress'
            ? 2.4
            : connection.kind === 'loadBalancer'
              ? 2
              : packet.type === 'tcp'
                ? 1.8
                : 1.35
        if (packet.type === 'udp') {
          ctx.setLineDash([4, 4])
        }
        ctx.stroke()
        ctx.setLineDash([])

        const headOpacity = (isDark ? 0.78 : 0.88) * depthFade
        const size = packet.size * depthFade * (Math.sin(timeRef.current * 8 + packet.id) * 0.22 + 1)
        ctx.fillStyle = withOpacity(palette.main, headOpacity)

        if (packet.type === 'tcp') {
          ctx.beginPath()
          ctx.moveTo(x, y - size)
          ctx.lineTo(x + size, y)
          ctx.lineTo(x, y + size)
          ctx.lineTo(x - size, y)
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(x, y, size * 0.82, 0, Math.PI * 2)
          ctx.fill()
        }
        return true
      })

      sortedNodes.forEach((node) => {
        const { colorKey, attention } = getNodePalette(
          node,
          timeRef.current,
          currentEmergencyState,
          emergencyRef.current.scenarioKey,
        )
        const palette = COLORS[colorKey]
        const visibility = getNodeVisibility(node, timeRef.current)
        const scaleMultiplier = getNodeScaleMultiplier(node, timeRef.current)
        const scale = node.screenScale * scaleMultiplier
        const currentSize = node.size * scale
        const depthFade = clamp(scale, 0.28, 1)
        const pulseOpacity =
          (attention + Math.sin(node.pulse) * 0.05) * depthFade * visibility
        const fillColor = withOpacity(palette.fill, pulseOpacity * 0.22)
        const strokeColor = withOpacity(palette.main, pulseOpacity * 0.95)

        if (visibility <= 0) {
          return
        }

        if (node.role === 'appPod') {
          const microSize = currentSize * 0.46
          const microOpacity = pulseOpacity * 0.28

          drawHexagon(
            ctx,
            node.screenX,
            node.screenY,
            microSize,
            withOpacity(palette.main, microOpacity * 0.9),
            withOpacity(palette.fill, microOpacity * 0.16),
            0.9 * depthFade,
          )
          return
        }

        drawHexagon(
          ctx,
          node.screenX,
          node.screenY,
          currentSize * 1.12,
          withOpacity(palette.main, pulseOpacity * 0.28),
          null,
          0.52 * depthFade,
        )
        drawHexagon(
          ctx,
          node.screenX,
          node.screenY,
          currentSize,
          strokeColor,
          fillColor,
          1.15 * depthFade,
        )
        drawHexagon(
          ctx,
          node.screenX,
          node.screenY,
          currentSize * 0.42,
          withOpacity(palette.main, pulseOpacity * 0.36),
          null,
          0.58 * depthFade,
        )

        if (depthFade > 0.6) {
          const labelOpacity = (isDark ? 0.68 : 0.74) * depthFade * visibility
          const fontSize =
            node.role === 'loadBalancer' || node.role === 'ingress'
              ? 8
              : node.label.length > 7
                ? 5
                : 6
          ctx.font = `bold ${Math.round(fontSize * depthFade)}px ui-monospace, monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = isDark
            ? `rgba(248, 250, 252, ${labelOpacity})`
            : `rgba(15, 23, 42, ${labelOpacity})`
          ctx.fillText(node.label, node.screenX, node.screenY)
        }
      })

      statusIndicatorsRef.current = statusIndicatorsRef.current.filter((indicator) =>
        drawStatusIndicator(ctx, indicator, timeRef.current, isDark, nodeMap),
      )

      const serviceProjectionMap = new Map(
        appServicesRef.current.map((service) => [
          service.name,
          project3D(
            service.centerX,
            service.centerY,
            service.centerZ,
            centerX,
            centerY,
            rotX,
            rotY,
          ),
        ]),
      )

      appServicesRef.current.forEach((service) => {
        const serviceProjection = serviceProjectionMap.get(service.name)
        if (!serviceProjection) {
          return
        }

        const projected = project3D(
          service.centerX,
          service.centerY - 52,
          service.centerZ,
          centerX,
          centerY,
          rotX,
          rotY,
        )
        const depthFade = clamp(projected.scale, 0.3, 1)
        const servicePods = nodesRef.current.filter(
          (node) =>
            node.role === 'appPod' &&
            node.replicaGroup === service.name &&
            node.lifecycleState !== 'terminating',
        )

        if (depthFade < 0.48 || servicePods.length === 0) {
          return
        }

        const readyPods = servicePods.filter(
          (node) => node.lifecycleState === 'ready' && node.acceptingTraffic,
        ).length
        const startingPods = servicePods.filter(
          (node) => node.lifecycleState === 'starting',
        ).length
        const desiredPods =
          clusterRef.current.desiredServiceReplicas[service.name] ?? servicePods.length
        const capacityPods = service.maxReplicas
        const plateIsDark = isDark
        const captionOpacity = clamp((isDark ? 0.82 : 0.86) * depthFade + 0.14, 0.88, 1)
        const metaOpacity = clamp((isDark ? 0.72 : 0.76) * depthFade + 0.12, 0.76, 0.98)
        const drainingPods = servicePods.filter(
          (node) => node.lifecycleState === 'draining',
        ).length
        const unhealthyPods = servicePods.filter(
          (node) =>
            node.lifecycleState === 'unhealthy' ||
            node.lifecycleState === 'terminating',
        ).length
        const activeLifecycleCount = startingPods + drainingPods + unhealthyPods
        const motionState = serviceClusterMotionRef.current[service.name]
        const activeDelta = Math.abs(activeLifecycleCount - motionState.activeCount)
        const totalDelta = Math.abs(servicePods.length - motionState.totalCount)
        const desiredDelta = Math.abs(desiredPods - motionState.desiredCount)
        const scaleOutStarted = desiredPods > motionState.desiredCount
        const scaleInStarted = desiredPods < motionState.desiredCount
        const impactTarget = clamp(
          activeDelta * 0.18 +
            totalDelta * 0.14 +
            desiredDelta * 0.08 +
            (scaleOutStarted ? 0.08 : 0) +
            (scaleInStarted ? 0.06 : 0) +
            (activeDelta >= 2 ? 0.08 : 0),
          0,
          0.58,
        )

        if (impactTarget > 0.015) {
          motionState.energy = clamp(
            motionState.energy * 0.72 + impactTarget,
            0,
            0.82,
          )
        } else {
          motionState.energy *= 0.86
        }

        motionState.activeCount = activeLifecycleCount
        motionState.totalCount = servicePods.length
        motionState.desiredCount = desiredPods
        const statusDisplay = getServiceStatusDisplay(
          service.name,
          {
            ready: readyPods,
            starting: startingPods,
            draining: drainingPods,
            unhealthy: unhealthyPods,
            total: servicePods.length,
            desired: desiredPods,
          },
          {
            emergencyState: currentEmergencyState,
            isTrafficSpike: clusterRef.current.isTrafficSpike,
            isDark: plateIsDark,
            metaOpacity,
          },
        )

        const clusterProjected = {
          ...serviceProjection,
          screenY: serviceProjection.screenY + 4,
        }
        const clusterRotation = getServiceClusterRotation(
          timeRef.current,
          motionState.energy,
          motionState.phase,
        )
        drawServiceClusterHoneycomb(ctx, {
          service,
          x: clusterProjected.screenX,
          y: clusterProjected.screenY,
          scale: clusterProjected.scale,
          time: timeRef.current,
          isDark,
          emergencyState: currentEmergencyState,
          emergencyScenarioKey: emergencyRef.current.scenarioKey,
          bounceEnergy: motionState.energy,
          bouncePhase: motionState.phase,
          localRotation: clusterRotation,
          counts: {
            ready: readyPods,
            starting: startingPods,
            draining: drainingPods,
            unhealthy: unhealthyPods,
            total: servicePods.length,
            desired: desiredPods,
            capacity: capacityPods,
          },
        })

        const panelOpacity = clamp((isDark ? 0.96 : 0.88) * depthFade + 0.08, 0.86, 1)
        const titleFont = `bold ${Math.max(10, Math.round(10 * depthFade))}px ui-monospace, monospace`
        const metaFont = `${Math.max(9, Math.round(9 * depthFade))}px ui-monospace, monospace`
        const statusFont = `${Math.max(8, Math.round(8 * depthFade))}px ui-monospace, monospace`
        ctx.font = titleFont
        const titleWidth = ctx.measureText(service.displayLabel).width
        ctx.font = metaFont
        const readyWidth = ctx.measureText(`${readyPods}/${capacityPods} ready`).width
        ctx.font = statusFont
        const statusWidth = ctx.measureText(statusDisplay.text).width
        const panelWidth = Math.max(titleWidth, readyWidth, statusWidth, 92) + 34
        const panelHeight = 60
        const panelAccent = withOpacity(
          COLORS[service.color].main,
          isDark ? panelOpacity * 0.88 : panelOpacity * 0.78,
        )
        const activePodsForSizing =
          readyPods + startingPods + Math.max(0, Math.round(drainingPods * 0.35))
        const clusterRadius = getServiceClusterShellRadius(
          activePodsForSizing,
          capacityPods,
          clusterProjected.scale,
          1 + motionState.energy * 0.12,
        )
        const panelPosition = chooseServicePanelPlacement({
          clusterX: clusterProjected.screenX,
          clusterY: clusterProjected.screenY,
          clusterRadius,
          panelWidth,
          panelHeight,
          viewportWidth: width,
          viewportHeight: height,
          otherCenters: [...serviceProjectionMap.entries()]
            .filter(([serviceName]) => serviceName !== service.name)
            .map(([, projection]) => ({
              x: projection.screenX,
              y: projection.screenY,
            })),
        })
        const panelCenterX = panelPosition.x + panelWidth / 2

        const panelLayout = drawInfoPanel(ctx, {
          x: panelPosition.x,
          y: panelPosition.y,
          width: panelWidth,
          height: panelHeight,
          radius: 10,
          isDark,
          opacity: panelOpacity,
          accentColor: panelAccent,
          headerHeight: 12,
          footerHeight: 14,
        })

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = 'bold 8px ui-monospace, monospace'
        ctx.fillStyle = plateIsDark
          ? `rgba(226, 232, 240, ${Math.max(metaOpacity * 0.9, 0.74)})`
          : `rgba(71, 85, 105, ${Math.max(metaOpacity * 0.92, 0.74)})`
        ctx.fillText('SERVICE CLUSTER', panelCenterX, panelLayout.header.centerY)

        drawPanelText(ctx, {
          text: service.displayLabel,
          x: panelCenterX,
          y: panelLayout.body.y + panelLayout.body.height * 0.38,
          font: titleFont,
          fillStyle: plateIsDark
            ? `rgba(248, 250, 252, ${captionOpacity})`
            : `rgba(15, 23, 42, ${captionOpacity})`,
          plateIsDark,
          emphasis: 'title',
        })

        drawPanelText(ctx, {
          text: `${readyPods}/${capacityPods} ready`,
          x: panelCenterX,
          y: panelLayout.body.y + panelLayout.body.height * 0.72,
          font: metaFont,
          fillStyle: plateIsDark
            ? `rgba(226, 232, 240, ${metaOpacity})`
            : `rgba(51, 65, 85, ${metaOpacity})`,
          plateIsDark,
          emphasis: 'meta',
        })

        drawPanelText(ctx, {
          text: statusDisplay.text,
          x: panelCenterX,
          y: panelLayout.footer.centerY,
          font: statusFont,
          fillStyle: statusDisplay.color,
          plateIsDark,
          emphasis: 'status',
        })
      })

      if (emergency.isActive) {
        const emergencyAge = timeRef.current - emergency.startTime
        const blinkOn = Math.sin(emergencyAge * Math.PI * 1.8) > 0
        if (blinkOn) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.07)'
          ctx.fillRect(0, 0, width, height)
        }
      } else if (emergency.isRecovery) {
        const recoveryAge = timeRef.current - emergency.recoveryStartTime
        const fadeOut = clamp(1 - recoveryAge / emergency.recoveryDuration, 0, 1)
        ctx.fillStyle = `rgba(34, 197, 94, ${0.045 * fadeOut})`
        ctx.fillRect(0, 0, width, height)
      }

      emitClusterSnapshot()
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    createPacket,
    createReplacementPod,
    enqueueEventToast,
    emitClusterSnapshot,
    getAppServiceConfig,
    getConnectionControlPoint,
    getTrafficSpikeReplicaTarget,
    getEmergencyState,
    hasRollingReplacementInFlight,
    initNodes,
    mounted,
    isDark,
    pushClusterEvent,
    relayoutServicePods,
    runAutoscaler,
    startEmergency,
    syncVisibleToasts,
    syncConnections,
    triggerPodFailure,
  ])

  if (!mounted) {
    return null
  }

  const canvasOpacity = isFocused ? 0.92 : 0

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10 pointer-events-none transition-opacity duration-500"
        style={{ opacity: canvasOpacity }}
        aria-hidden="true"
      />

      {isFocused && visibleToasts.length > 0 ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-10 flex max-w-[360px] flex-col-reverse items-end gap-3">
          {visibleToasts.map((toast) => {
            const accentColor =
              toast.mode === 'emergency'
                ? isDark
                  ? 'rgba(248, 113, 113, 0.92)'
                  : 'rgba(220, 38, 38, 0.9)'
                : isDark
                  ? 'rgba(74, 222, 128, 0.84)'
                  : 'rgba(22, 163, 74, 0.84)'

            return (
              <div
                key={toast.id}
                className="w-full overflow-hidden rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md"
                style={{
                  backgroundColor: isDark
                    ? 'rgba(10, 14, 24, 0.92)'
                    : 'rgba(255, 255, 255, 0.94)',
                  borderColor: isDark
                    ? 'rgba(148, 163, 184, 0.14)'
                    : 'rgba(148, 163, 184, 0.28)',
                  boxShadow: `0 0 0 1px ${accentColor}, 0 18px 44px ${
                    isDark ? 'rgba(2, 6, 23, 0.35)' : 'rgba(15, 23, 42, 0.12)'
                  }`,
                }}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span
                    className="font-mono text-[11px] uppercase tracking-[0.18em]"
                    style={{ color: accentColor }}
                  >
                    {toast.mode === 'emergency'
                      ? 'Incident'
                      : toast.mode === 'recovery'
                        ? 'Recovery'
                        : 'Autoscale'}
                  </span>
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 0 10px ${accentColor}`,
                    }}
                  />
                </div>
                <div
                  className="font-mono text-[13px] font-semibold uppercase tracking-[0.08em]"
                  style={{
                    color: isDark ? 'rgba(248, 250, 252, 0.96)' : 'rgba(15, 23, 42, 0.92)',
                  }}
                >
                  {toast.title}
                </div>
                <div
                  className="mt-1 text-sm leading-5"
                  style={{
                    color: isDark ? 'rgba(226, 232, 240, 0.78)' : 'rgba(51, 65, 85, 0.8)',
                  }}
                >
                  {toast.subtitle}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </>
  )
}

export default HexagonServiceNetwork
