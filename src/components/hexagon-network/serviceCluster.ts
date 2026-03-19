import type { EmergencyScenarioKey, EmergencyState } from '@/lib/ambientCluster'
import { getRequiredArrayItem } from '@/lib/assert'

import { COLORS, Y_AXIS_COMPRESSION } from './constants'
import { drawHexagon } from './drawing'
import {
  getHoneycombSlot,
  getRenderedHoneycombCellCount,
  getServiceClusterActivePodCount,
  getServiceClusterColorKey,
  getServiceClusterDegradedPodCount,
  getServiceClusterFootprintPodCount,
  getServiceClusterShellRadius,
  getServiceLayoutRadiusEstimate,
} from './honeycomb'
import { clamp, lerp, withOpacity } from './math'
import { project3D } from './projection'
import type {
  AppServiceConfig,
  OccupiedLayoutZone,
  OccupiedPanelZone,
} from './types'

export function getProjectedServiceClusterEnvelope(
  service: AppServiceConfig,
  canvasCenterX: number,
  canvasCenterY: number,
  rotX: number,
  rotY: number,
) {
  const projected = project3D(
    service.centerX,
    service.centerY,
    service.centerZ,
    canvasCenterX,
    canvasCenterY,
    rotX,
    rotY,
  )

  return {
    ...projected,
    radius:
      getServiceLayoutRadiusEstimate(service) *
      clamp(projected.scale, 0.4, 1.12),
  }
}

export function resolveServiceClusterCenters(
  services: Array<
    Pick<
      AppServiceConfig,
      | 'name'
      | 'baselineReplicas'
      | 'spikeReplicas'
      | 'maxReplicas'
      | 'trafficWeight'
      | 'layoutSeed'
      | 'downstream'
      | 'minReplicas'
      | 'displayLabel'
      | 'labelPrefix'
      | 'color'
    >
  >,
  bounds: {
    left: number
    right: number
    top: number
    bottom: number
    infraDepth: number
  },
  reservedZones: OccupiedLayoutZone[],
) {
  const placements = services.map((service) => {
    const radius = getServiceLayoutRadiusEstimate({
      ...service,
      centerX: 0,
      centerY: 0,
      centerZ: 0,
    } as AppServiceConfig)

    return {
      name: service.name,
      radius,
      seedX: lerp(bounds.left, bounds.right, service.layoutSeed.x),
      seedY: lerp(bounds.top, bounds.bottom, service.layoutSeed.y),
      z: service.layoutSeed.z * bounds.infraDepth,
      x: lerp(bounds.left, bounds.right, service.layoutSeed.x),
      y: lerp(bounds.top, bounds.bottom, service.layoutSeed.y),
      downstream: service.downstream,
      trafficWeight: service.trafficWeight,
    }
  })

  for (let iteration = 0; iteration < 90; iteration += 1) {
    placements.forEach((placement) => {
      let forceX = (placement.seedX - placement.x) * 0.08
      let forceY = (placement.seedY - placement.y) * 0.08

      placements.forEach((otherPlacement) => {
        if (otherPlacement.name === placement.name) {
          return
        }

        const dx = placement.x - otherPlacement.x
        const dy = placement.y - otherPlacement.y
        const distance = Math.hypot(dx, dy) || 1
        const desiredSeparation = placement.radius + otherPlacement.radius + 34

        if (distance < desiredSeparation) {
          const repel =
            ((desiredSeparation - distance) / desiredSeparation) * 8.5
          forceX += (dx / distance) * repel
          forceY += (dy / distance) * repel
        }
      })

      reservedZones.forEach((zone) => {
        const dx = placement.x - zone.x
        const dy = placement.y - zone.y
        const distance = Math.hypot(dx, dy) || 1
        const desiredSeparation = placement.radius + zone.radius + 24

        if (distance < desiredSeparation) {
          const repel =
            ((desiredSeparation - distance) / desiredSeparation) * 10.5
          forceX += (dx / distance) * repel
          forceY += (dy / distance) * repel
        }
      })

      placement.downstream.forEach((downstreamName) => {
        const downstreamPlacement = placements.find(
          (candidate) => candidate.name === downstreamName,
        )
        if (!downstreamPlacement) {
          return
        }

        const dx = downstreamPlacement.x - placement.x
        const dy = downstreamPlacement.y - placement.y
        const distance = Math.hypot(dx, dy) || 1
        const targetDistance =
          placement.radius +
          downstreamPlacement.radius +
          84 +
          (1 -
            Math.min(
              placement.trafficWeight,
              downstreamPlacement.trafficWeight,
            )) *
            18
        const pull = (distance - targetDistance) * 0.012
        forceX += (dx / distance) * pull
        forceY += (dy / distance) * pull
      })

      placement.x = clamp(
        placement.x + forceX,
        bounds.left + placement.radius,
        bounds.right - placement.radius,
      )
      placement.y = clamp(
        placement.y + forceY,
        bounds.top + placement.radius,
        bounds.bottom - placement.radius,
      )
    })
  }

  return new Map(
    placements.map((placement) => [
      placement.name,
      {
        x: placement.x,
        y: placement.y,
        z: placement.z,
      },
    ]),
  )
}

export function getServiceClusterRotation(
  time: number,
  bounceEnergy: number,
  bouncePhase: number,
  focusLevel: number,
) {
  const motionFactor = 0.22 + focusLevel * 0.42
  const drift = time * 0.028 + bouncePhase * 0.18
  const focusBias =
    Math.sin(time * 0.09 + bouncePhase * 0.7) * 0.035 * focusLevel
  const wobble =
    Math.sin(time * (0.16 + 0.08 * focusLevel) + bouncePhase) *
    0.06 *
    motionFactor
  const impactSpin =
    Math.sin(
      time * (0.24 + (0.18 + bounceEnergy * 0.4) * focusLevel) + bouncePhase,
    ) *
    bounceEnergy *
    0.07 *
    motionFactor
  return drift + focusBias + wobble + impactSpin
}

function getServiceClusterRippleOffset(options: {
  x: number
  y: number
  shellRadius: number
  time: number
  bounceEnergy: number
  bouncePhase: number
}) {
  const { x, y, shellRadius, time, bounceEnergy, bouncePhase } = options
  const distance = Math.hypot(x, y) || 1
  const normalizedDistance = clamp(distance / Math.max(shellRadius, 1), 0, 1.25)
  const unitX = x / distance
  const unitY = y / distance
  const angle = Math.atan2(y, x)
  const impactAngle =
    bouncePhase * 0.92 + Math.sin(time * 0.34 + bouncePhase) * 0.24
  const angularDistance = Math.atan2(
    Math.sin(angle - impactAngle),
    Math.cos(angle - impactAngle),
  )
  const directionalFocus = Math.exp(-Math.abs(angularDistance) * 2.4)
  const travelWave = Math.sin(
    time * 4.1 - normalizedDistance * 6.4 + bouncePhase * 1.6,
  )
  const settleWave = Math.sin(
    time * 2.6 - normalizedDistance * 3.2 + bouncePhase * 0.9,
  )
  const crossWave = Math.sin(
    time * 3.2 + normalizedDistance * 4.4 + bouncePhase * 1.15,
  )
  const amplitude =
    bounceEnergy *
    (3.2 + normalizedDistance * 6.4) *
    (0.46 + normalizedDistance * 0.74) *
    (0.36 + directionalFocus * 1.1)
  const radialOffset = travelWave * amplitude + settleWave * amplitude * 0.42
  const tangentialOffset =
    crossWave *
    amplitude *
    0.22 *
    (0.34 + normalizedDistance * 0.66) *
    (0.45 + directionalFocus * 0.9)

  return {
    x: unitX * radialOffset - unitY * tangentialOffset,
    y: unitY * radialOffset + unitX * tangentialOffset,
  }
}

export function chooseServicePanelPlacement(options: {
  clusterX: number
  clusterY: number
  clusterRadius: number
  panelWidth: number
  panelHeight: number
  viewportWidth: number
  viewportHeight: number
  otherCenters: OccupiedLayoutZone[]
  otherPanels?: OccupiedPanelZone[]
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
    otherPanels = [],
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
    {
      x: clusterX - panelWidth - offset * 0.84,
      y: clusterY - panelHeight - offset * 0.5,
    },
    { x: clusterX + offset * 0.84, y: clusterY + offset * 0.16 },
    { x: clusterX - panelWidth - offset * 0.84, y: clusterY + offset * 0.16 },
  ]

  let bestCandidate = getRequiredArrayItem(
    candidates,
    0,
    'Expected at least one service panel placement candidate.',
  )
  let bestScore = Number.NEGATIVE_INFINITY

  candidates.forEach((candidate) => {
    const centerX = candidate.x + panelWidth / 2
    const centerY = candidate.y + panelHeight / 2
    const overflowLeft = Math.max(0, 12 - candidate.x)
    const overflowTop = Math.max(0, 12 - candidate.y)
    const overflowRight = Math.max(
      0,
      candidate.x + panelWidth - (viewportWidth - 12),
    )
    const overflowBottom = Math.max(
      0,
      candidate.y + panelHeight - (viewportHeight - 12),
    )
    const overflowPenalty =
      (overflowLeft + overflowTop + overflowRight + overflowBottom) * 8

    const nearestClusterDistance = otherCenters.reduce((nearest, center) => {
      const distance =
        Math.hypot(center.x - centerX, center.y - centerY) - center.radius
      return Math.min(nearest, distance)
    }, Number.POSITIVE_INFINITY)
    const crowdPenalty = Math.max(0, 190 - nearestClusterDistance) * 1.4
    const panelOverlapPenalty = otherPanels.reduce((penalty, panel) => {
      const overlapWidth =
        Math.min(candidate.x + panelWidth + 10, panel.x + panel.width + 10) -
        Math.max(candidate.x - 10, panel.x - 10)
      const overlapHeight =
        Math.min(candidate.y + panelHeight + 10, panel.y + panel.height + 10) -
        Math.max(candidate.y - 10, panel.y - 10)

      if (overlapWidth <= 0 || overlapHeight <= 0) {
        return penalty
      }

      return penalty + overlapWidth * overlapHeight * 0.22
    }, 0)
    const panelCrowdPenalty = otherPanels.reduce((penalty, panel) => {
      const panelCenterX = panel.x + panel.width / 2
      const panelCenterY = panel.y + panel.height / 2
      const distance = Math.hypot(
        panelCenterX - centerX,
        panelCenterY - centerY,
      )
      const desiredDistance =
        Math.max(panel.width, panelWidth) * 0.48 +
        Math.max(panel.height, panelHeight) * 0.42 +
        16
      return penalty + Math.max(0, desiredDistance - distance) * 1.4
    }, 0)
    const viewportRoomBonus =
      Math.abs(centerX - viewportCenterX) * 0.06 +
      Math.abs(centerY - viewportCenterY) * 0.03
    const alignmentBonus =
      Math.abs(centerX - clusterX) > Math.abs(centerY - clusterY) ? 12 : 6
    const score =
      viewportRoomBonus +
      alignmentBonus -
      overflowPenalty -
      crowdPenalty -
      panelOverlapPenalty -
      panelCrowdPenalty

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

function drawServiceClusterScaleRing(
  ctx: CanvasRenderingContext2D,
  options: {
    shellRadius: number
    progress: number
    direction: 1 | -1
    queueDepth: number
    palette: { main: string; glow: string; fill: string }
    isDark: boolean
  },
) {
  const { shellRadius, progress, direction, queueDepth, palette, isDark } =
    options

  if (progress <= 0) {
    return
  }

  const visibility = Math.sin(progress * Math.PI)
  if (visibility <= 0.04) {
    return
  }

  const ringRadius = shellRadius + 6.5
  const ringRadiusY = ringRadius * Y_AXIS_COMPRESSION
  const startAngle = -Math.PI / 2
  const endAngle = startAngle + direction * progress * Math.PI * 2
  const lineWidth = 1.05 + Math.min(queueDepth, 4) * 0.22
  const trackOpacity = (isDark ? 0.024 : 0.034) * visibility
  const accentOpacity = clamp(
    ((isDark ? 0.16 : 0.14) + Math.min(queueDepth, 4) * 0.03) * visibility,
    0.045,
    0.24,
  )
  const accentColor = withOpacity(
    direction > 0 ? palette.glow : palette.main,
    accentOpacity,
  )
  const headAngle = endAngle
  const headX = Math.cos(headAngle) * ringRadius
  const headY = Math.sin(headAngle) * ringRadiusY

  ctx.save()
  ctx.beginPath()
  ctx.ellipse(0, 0, ringRadius, ringRadiusY, 0, 0, Math.PI * 2)
  ctx.strokeStyle = withOpacity(palette.main, trackOpacity)
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(
    0,
    0,
    ringRadius,
    ringRadiusY,
    0,
    startAngle,
    endAngle,
    direction < 0,
  )
  ctx.strokeStyle = accentColor
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.shadowColor = accentColor
  ctx.shadowBlur = isDark ? 3 : 2
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(headX, headY, lineWidth * 0.48, 0, Math.PI * 2)
  ctx.fillStyle = withOpacity(
    direction > 0 ? palette.glow : palette.main,
    accentOpacity * 0.78,
  )
  ctx.fill()
  ctx.restore()
}

export function drawServiceClusterHoneycomb(
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
    scaleRing: {
      progress: number
      direction: 1 | -1 | 0
      queueDepth: number
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
    bounceEnergy,
    bouncePhase,
    localRotation,
    counts,
    scaleRing,
  } = options

  if (counts.total <= 0 || scale < 0.36) {
    return
  }

  const colorKey = getServiceClusterColorKey(service)
  const palette = COLORS[colorKey]
  const activeCount = getServiceClusterActivePodCount(counts)
  const footprintCount = getServiceClusterFootprintPodCount(counts)
  const degradedCount = getServiceClusterDegradedPodCount(counts)
  const readyCellCount = getRenderedHoneycombCellCount(counts.ready)
  const warmCellCountBase = Math.max(
    0,
    getRenderedHoneycombCellCount(counts.ready + counts.starting) -
      readyCellCount,
  )
  const warmCellCount = counts.starting > 0 ? Math.max(1, warmCellCountBase) : 0
  const footprintCellCount = Math.max(
    readyCellCount + warmCellCount,
    getRenderedHoneycombCellCount(footprintCount),
  )
  const degradedCellCount = Math.min(
    12,
    Math.max(
      degradedCount,
      getRenderedHoneycombCellCount(activeCount + degradedCount) -
        Math.max(readyCellCount + warmCellCount, 0),
    ),
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
    Math.sin(
      time * (5.4 + bounceEnergy * 3.6) + bouncePhase + x * 0.012 + y * 0.014,
    ) *
      bounceEnergy *
      0.08
  const density = clamp(footprintCount / counts.capacity, 0.16, 1)
  const cellSize = clamp(
    (6.4 + footprintCellCount * 0.2 + (0.76 + scale * 0.4) * 4.6) * bounce,
    8,
    17.2,
  )
  const stepX = cellSize * 1.58
  const stepY = cellSize * 1.36
  const shellRadius = getServiceClusterShellRadius(
    footprintCount,
    counts.capacity,
    scale,
    bounce,
  )
  const fillOpacity = isDark ? 0.16 + density * 0.12 : 0.18 + density * 0.1
  const strokeOpacity = isDark ? 0.68 + density * 0.18 : 0.72 + density * 0.12
  const shellGhostOpacity = isDark ? 0.11 : 0.14
  const warmFillOpacity = isDark ? 0.18 + density * 0.12 : 0.2 + density * 0.1
  const warmStrokeOpacity = isDark ? 0.74 : 0.76
  const degradedStrokeOpacity = isDark ? 0.2 : 0.24
  const degradedFillOpacity = isDark ? 0.04 : 0.05

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(localRotation)

  if (scaleRing.direction !== 0 && scaleRing.progress > 0) {
    drawServiceClusterScaleRing(ctx, {
      shellRadius,
      progress: scaleRing.progress,
      direction: scaleRing.direction,
      queueDepth: scaleRing.queueDepth,
      palette,
      isDark,
    })
  }

  const applyRipple = (baseX: number, baseY: number, strength = 1) => {
    const ripple = getServiceClusterRippleOffset({
      x: baseX,
      y: baseY,
      shellRadius,
      time,
      bounceEnergy: bounceEnergy * strength,
      bouncePhase,
    })

    return {
      x: baseX + ripple.x,
      y: baseY + ripple.y,
    }
  }

  ctx.beginPath()
  const shellSegments = 40
  for (let index = 0; index <= shellSegments; index += 1) {
    const angle = (index / shellSegments) * Math.PI * 2
    const ringX = Math.cos(angle) * shellRadius
    const ringY = Math.sin(angle) * shellRadius * Y_AXIS_COMPRESSION
    const point = applyRipple(ringX, ringY, 1.08)
    if (index === 0) {
      ctx.moveTo(point.x, point.y)
    } else {
      ctx.lineTo(point.x, point.y)
    }
  }
  ctx.closePath()
  ctx.fillStyle = withOpacity(
    palette.glow,
    isDark ? 0.09 + pressure * 0.07 : 0.08 + pressure * 0.05,
  )
  ctx.fill()

  for (let index = 0; index < footprintCellCount; index += 1) {
    const slot = getHoneycombSlot(index)
    const baseCellX = (slot.q + slot.r / 2) * stepX
    const baseCellY = slot.r * stepY
    const { x: cellX, y: cellY } = applyRipple(baseCellX, baseCellY, 1.02)

    drawHexagon(
      ctx,
      cellX,
      cellY,
      cellSize * 0.7,
      withOpacity(palette.main, shellGhostOpacity),
      null,
      0.9,
    )
  }

  for (
    let index = readyCellCount;
    index < readyCellCount + warmCellCount;
    index += 1
  ) {
    const slot = getHoneycombSlot(index)
    const baseCellX = (slot.q + slot.r / 2) * stepX
    const baseCellY = slot.r * stepY
    const { x: cellX, y: cellY } = applyRipple(baseCellX, baseCellY, 1.38)
    const arrivalPhase =
      time * 3.8 - index * 0.62 + bouncePhase + service.centerY * 0.004
    const arrivalWave = Math.sin(arrivalPhase)
    const reveal = 0.72 + (arrivalWave * 0.5 + 0.5) * 0.48
    const pulse =
      1 +
      Math.sin(
        time * 5.4 + bouncePhase + index * 0.7 + service.centerY * 0.008,
      ) *
        (0.014 + bounceEnergy * 0.04)
    const currentSize = cellSize * 0.7 * pulse * reveal

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(cellX, cellY)
    ctx.strokeStyle = withOpacity(palette.glow, (isDark ? 0.18 : 0.14) * reveal)
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(cellX, cellY, currentSize * 1.45, 0, Math.PI * 2)
    ctx.fillStyle = withOpacity(palette.glow, (isDark ? 0.16 : 0.14) * reveal)
    ctx.fill()

    drawHexagon(
      ctx,
      cellX,
      cellY,
      currentSize * 1.22,
      withOpacity(palette.glow, (isDark ? 0.44 : 0.34) * reveal),
      withOpacity(palette.fill, (isDark ? 0.08 : 0.07) * reveal),
      1,
    )
    drawHexagon(
      ctx,
      cellX,
      cellY,
      currentSize,
      withOpacity(palette.main, warmStrokeOpacity * reveal),
      withOpacity(palette.fill, warmFillOpacity * reveal),
      1.1,
    )
    drawHexagon(
      ctx,
      cellX,
      cellY,
      currentSize * 0.46,
      withOpacity(palette.main, (isDark ? 0.46 : 0.38) * reveal),
      null,
      0.8,
    )
  }

  for (let index = 0; index < readyCellCount; index += 1) {
    const slot = getHoneycombSlot(index)
    const baseCellX = (slot.q + slot.r / 2) * stepX
    const baseCellY = slot.r * stepY
    const { x: cellX, y: cellY } = applyRipple(baseCellX, baseCellY, 1.22)
    const pulse =
      1 +
      Math.sin(
        time * 6.2 + bouncePhase + index * 0.8 + service.centerX * 0.01,
      ) *
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

  for (let index = 0; index < degradedCellCount; index += 1) {
    const angle =
      (-Math.PI / 2 +
        (index / Math.max(degradedCellCount, 1)) * Math.PI * 2 +
        bouncePhase * 0.45 +
        time * 0.04) %
      (Math.PI * 2)
    const ringRadius = shellRadius + cellSize * (1.35 + (index % 3) * 0.28)
    const baseCellX =
      Math.cos(angle) * ringRadius + Math.sin(index * 0.9 + bouncePhase) * 2.4
    const baseCellY =
      Math.sin(angle) * ringRadius * 0.92 +
      Math.cos(index * 0.72 + bouncePhase) * 2
    const { x: cellX, y: cellY } = applyRipple(baseCellX, baseCellY, 1.28)
    const degradedSize =
      cellSize *
      (0.52 + ((index + 1) % 3) * 0.04) *
      (1 + Math.sin(time * 2.6 + index) * 0.03)

    ctx.save()
    ctx.setLineDash([3, 4])
    drawHexagon(
      ctx,
      cellX,
      cellY,
      degradedSize,
      withOpacity(palette.main, degradedStrokeOpacity),
      withOpacity(palette.fill, degradedFillOpacity),
      0.95,
    )
    ctx.restore()
  }

  ctx.beginPath()
  const innerRingRadius = shellRadius * 0.72
  for (let index = 0; index <= shellSegments; index += 1) {
    const angle = (index / shellSegments) * Math.PI * 2
    const ringX = Math.cos(angle) * innerRingRadius
    const ringY = Math.sin(angle) * innerRingRadius * Y_AXIS_COMPRESSION
    const point = applyRipple(ringX, ringY, 0.84)
    if (index === 0) {
      ctx.moveTo(point.x, point.y)
    } else {
      ctx.lineTo(point.x, point.y)
    }
  }
  ctx.closePath()
  ctx.strokeStyle = withOpacity(
    palette.main,
    isDark ? 0.24 + pressure * 0.14 : 0.2 + pressure * 0.1,
  )
  ctx.lineWidth = 1.1
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(
    0,
    0,
    Math.max(3.8, cellSize * (0.24 + density * 0.15)),
    0,
    Math.PI * 2,
  )
  ctx.fillStyle = withOpacity(palette.glow, isDark ? 0.5 : 0.36)
  ctx.fill()

  ctx.restore()
}
