import { describe, expect, it, vi } from 'vitest'

import { type WorkInterface } from '@/lib/experience'
import {
  calculateGroupedExperienceYears,
  formatDuration,
  getAllUniqueItems,
  groupWorkExperiencesForDisplay,
} from '@/lib/experienceContent'

describe('experienceContent', () => {
  it('formats empty and non-empty durations', () => {
    expect(formatDuration({ years: 0, months: 0 })).toBe('0 mo')
    expect(formatDuration({ years: 2, months: 3 })).toBe('2 yr 3 mo')
  })

  it('groups work entries by company for display', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-02T00:00:00.000Z'))

    const grouped = groupWorkExperiencesForDisplay([
      createWork('Company A', '2024-01-01', '2024-07-01'),
      createWork('Company A', '2024-08-01', 'now'),
    ])

    expect(grouped['Company A']).toMatchObject({
      company: 'Company A',
      experiences: expect.arrayContaining([
        expect.objectContaining({ startDate: '2024-01-01' }),
        expect.objectContaining({ endDate: 'now' }),
      ]),
      totalDuration: { years: 2, months: 8 },
    })

    vi.useRealTimers()
  })

  it('calculates total years from grouped display experience', () => {
    const grouped = groupWorkExperiencesForDisplay([
      createWork('Company A', '2024-01-01', '2024-07-01'),
      createWork('Company B', '2024-08-01', '2025-01-01'),
    ])

    expect(calculateGroupedExperienceYears(grouped)).toBe(1)
  })

  it('deduplicates items case-insensitively while preserving first spelling', () => {
    expect(
      getAllUniqueItems([
        ['Go', 'PHP'],
        ['go', 'TypeScript'],
      ]),
    ).toEqual(['Go', 'PHP', 'TypeScript'])
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
    location: 'Remote',
    highlights: [],
    responsibilities: [],
    projects: [],
    technologies: [],
    url: 'https://example.com',
    image: 'company.png',
  }
}
