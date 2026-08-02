import { describe, expect, it } from 'vitest'

import {
  type ClusterSnapshot,
  DEFAULT_CLUSTER_SNAPSHOT,
} from '@/lib/ambientCluster'
import { deriveAmbientMonitoringState } from '@/lib/ambientMonitoring'

describe('ambientMonitoring', () => {
  it.each([
    ['steady', snapshot(), 'steady'],
    ['preview', snapshot({ focusMode: 'preview' }), 'preview'],
    ['surge', snapshot({ isTrafficSpike: true }), 'surge'],
    ['incident', snapshot({ emergencyState: 'emergency' }), 'incident'],
    ['recovery', snapshot({ emergencyState: 'recovery' }), 'recovery'],
  ])('derives %s mode state', (_, input, expectedMode) => {
    expect(deriveAmbientMonitoringState(input).mode).toBe(expectedMode)
  })
})

function snapshot(overrides: Partial<ClusterSnapshot> = {}): ClusterSnapshot {
  return {
    ...DEFAULT_CLUSTER_SNAPSHOT,
    ...overrides,
  }
}
