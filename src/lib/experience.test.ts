import { describe, expect, it, vi } from 'vitest'

import {
  addDuration,
  calculateDurationYears,
  calculateTotalExperienceYears,
  getDuration,
  type WorkInterface,
} from '@/lib/experience'

describe('experience', () => {
  it('calculates inclusive month duration across years', () => {
    expect(getDuration('2024-01-01', '2025-02-01')).toEqual({
      years: 1,
      months: 2,
    })
  })

  it('uses the current date for now end dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-02T00:00:00.000Z'))

    expect(getDuration('2025-08-01', 'now')).toEqual({
      years: 1,
      months: 1,
    })

    vi.useRealTimers()
  })

  it('normalizes added duration months', () => {
    expect(
      addDuration({ years: 1, months: 10 }, { years: 0, months: 5 }),
    ).toEqual({ years: 2, months: 3 })
  })

  it('calculates years from grouped durations', () => {
    expect(
      calculateDurationYears([
        { years: 1, months: 10 },
        { years: 0, months: 5 },
      ]),
    ).toBe(2)
  })

  it('groups same-company entries when calculating total experience years', () => {
    const work = [
      createWork('Company A', '2024-01-01', '2024-07-01'),
      createWork('Company A', '2024-08-01', '2025-01-01'),
      createWork('Company B', '2025-02-01', '2025-08-01'),
    ]

    expect(calculateTotalExperienceYears(work)).toBe(1)
  })
})

function createWork(
  name: string,
  startDate: string,
  endDate: string,
): WorkInterface {
  return {
    name,
    position: 'Engineer',
    startDate,
    endDate,
    highlights: [],
    responsibilities: [],
    projects: [],
    technologies: [],
    url: 'https://example.com',
    image: 'company.png',
  }
}
