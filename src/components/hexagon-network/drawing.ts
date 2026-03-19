import { getRequiredArrayItem } from '@/lib/assert'

import { clamp, lerp } from './math'
import type { AmbientCallAssignment } from './types'

export function getQuadraticPoint(
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

export function drawQuadraticSegment(
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

function getHexPoints(
  cx: number,
  cy: number,
  size: number,
): [number, number][] {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2
    return [cx + size * Math.cos(angle), cy + size * Math.sin(angle)]
  })
}

export function drawHexagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  strokeColor: string,
  fillColor: string | null,
  lineWidth: number,
) {
  const points = getHexPoints(cx, cy, size)
  const firstPoint = getRequiredArrayItem(
    points,
    0,
    'Expected the first hexagon point.',
  )
  ctx.beginPath()
  ctx.moveTo(firstPoint[0], firstPoint[1])
  for (let index = 1; index < points.length; index += 1) {
    const point = getRequiredArrayItem(
      points,
      index,
      'Expected a hexagon point.',
    )
    ctx.lineTo(point[0], point[1])
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

export function drawRoundedRectPath(
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
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - effectiveRadius,
    y + height,
  )
  ctx.lineTo(x + effectiveRadius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - effectiveRadius)
  ctx.lineTo(x, y + effectiveRadius)
  ctx.quadraticCurveTo(x, y, x + effectiveRadius, y)
  ctx.closePath()
}

export function drawInfoPanel(
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
    radius = 3,
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
  drawRoundedRectPath(
    ctx,
    insetX,
    insetY,
    insetWidth,
    insetHeight,
    Math.max(6, radius - 1),
  )
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

export function drawPanelText(
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

export function drawPanelCallAssignments(
  ctx: CanvasRenderingContext2D,
  options: {
    assignments: AmbientCallAssignment[]
    panelX: number
    panelY: number
    panelWidth: number
    panelHeight: number
    viewportWidth: number
    isDark: boolean
    time: number
    metaOpacity: number
  },
) {
  const {
    assignments,
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    viewportWidth,
    isDark,
    time,
    metaOpacity,
  } = options

  if (assignments.length === 0) {
    return
  }

  const rowHeight = 16
  const totalHeight = assignments.length * rowHeight
  const centerY = panelY + panelHeight / 2
  const startY = centerY - totalHeight / 2 + rowHeight / 2
  const preferLeft = panelX + panelWidth + 82 > viewportWidth - 18
  const circleX = preferLeft ? panelX + 2 : panelX + panelWidth - 2
  const textAlign: CanvasTextAlign = preferLeft ? 'right' : 'left'
  const textX = preferLeft ? circleX - 10 : circleX + 10

  assignments.forEach((assignment, index) => {
    const y = startY + index * rowHeight
    const pulse = assignment.isSpeaker
      ? 1 + 0.2 * (0.5 + 0.5 * Math.sin(time * Math.PI * 2.8))
      : 1
    const opacity = assignment.isDropping
      ? metaOpacity * 0.52
      : metaOpacity * 0.92

    ctx.save()
    ctx.globalAlpha = opacity

    if (assignment.isSpeaker) {
      ctx.beginPath()
      ctx.fillStyle = assignment.accent.replace(/0\.\d+\)/, '0.24)')
      ctx.arc(circleX, y, 7.6 * pulse, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.beginPath()
    ctx.fillStyle = isDark
      ? 'rgba(15, 23, 42, 0.96)'
      : 'rgba(255, 255, 255, 0.96)'
    ctx.strokeStyle = assignment.accent.replace(
      /0\.\d+\)/,
      assignment.isDropping ? '0.46)' : '0.78)',
    )
    ctx.lineWidth = 1.2
    ctx.arc(circleX, y, 6.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '600 7px ui-monospace, monospace'
    ctx.fillStyle = isDark
      ? 'rgba(248, 250, 252, 0.96)'
      : 'rgba(15, 23, 42, 0.92)'
    ctx.fillText(assignment.initials, circleX, y + 0.5)

    ctx.textAlign = textAlign
    ctx.font = '6.5px ui-monospace, monospace'
    ctx.fillStyle = isDark
      ? `rgba(148, 163, 184, ${opacity})`
      : `rgba(71, 85, 105, ${opacity})`
    ctx.fillText(assignment.label.toUpperCase(), textX, y + 0.5)
    ctx.restore()
  })
}
