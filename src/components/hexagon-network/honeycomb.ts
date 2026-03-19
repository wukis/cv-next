import { getRequiredArrayItem } from '@/lib/assert'

import { clamp } from './math'
import type { AppServiceConfig, ColorKey } from './types'

export function getHoneycombSlot(slotIndex: number) {
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
    const direction = getRequiredArrayItem(
      directions,
      side,
      'Expected a honeycomb direction.',
    )
    for (let step = 0; step < ring; step += 1) {
      if (offset === 0) {
        return { q, r }
      }
      q += direction.q
      r += direction.r
      offset -= 1
    }
  }

  return { q: 0, r: 0 }
}

export function getServiceClusterColorKey(service: AppServiceConfig): ColorKey {
  return service.color
}

export function getServiceClusterActivePodCount(counts: {
  ready: number
  starting: number
  draining: number
}) {
  return (
    counts.ready +
    counts.starting +
    Math.max(0, Math.round(counts.draining * 0.35))
  )
}

export function getServiceClusterFootprintPodCount(counts: {
  ready: number
  starting: number
  draining: number
}) {
  return (
    counts.ready +
    Math.max(0, Math.round(counts.starting * 0.78)) +
    Math.max(0, Math.round(counts.draining * 0.18))
  )
}

export function getServiceClusterDegradedPodCount(counts: {
  draining: number
  unhealthy: number
}) {
  return counts.draining + counts.unhealthy
}

export function getRenderedHoneycombCellCount(podCount: number) {
  if (podCount <= 0) {
    return 0
  }

  if (podCount <= 12) {
    return podCount
  }

  return Math.min(28, 12 + Math.round(Math.sqrt(podCount - 12) * 3.4))
}

export function getServiceClusterShellRadius(
  activeCount: number,
  capacity: number,
  scale: number,
  bounce = 1,
) {
  const renderedCells = Math.max(1, getRenderedHoneycombCellCount(activeCount))
  const density = clamp(activeCount / capacity, 0.16, 1)
  const planeScale = clamp(0.78 + scale * 0.46, 0.72, 1.18)
  const bounceInfluence = 1 + (bounce - 1) * 0.12
  const cellSize = clamp(
    (6.6 + renderedCells * 0.22 + planeScale * 4.8) * bounceInfluence,
    8,
    17.4,
  )
  const growthFactor = Math.min(1.2, Math.sqrt(Math.max(activeCount, 1)) * 0.08)
  return cellSize * (2.35 + density * 1.12 + growthFactor)
}

export function getServiceLayoutRadiusEstimate(service: AppServiceConfig) {
  const baselineAverage =
    (service.baselineReplicas[0] + service.baselineReplicas[1]) / 2
  const layoutDemand = Math.max(baselineAverage, service.spikeReplicas * 0.9)
  return clamp(
    34 +
      Math.sqrt(layoutDemand) * 5.2 +
      Math.log(service.maxReplicas + 1) * 6.4 +
      service.trafficWeight * 12,
    44,
    110,
  )
}
