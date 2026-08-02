import { describe, expect, it } from 'vitest'

import { createBoxLineWithBorders, createEmptyBoxLine } from '@/lib/consoleBox'

describe('consoleBox', () => {
  it('pads ASCII content to the configured width', () => {
    expect(createBoxLineWithBorders('OK', { leadingSpaces: 1, width: 6 })).toBe(
      '│ OK   │',
    )
  })

  it('accounts for emoji width when padding content', () => {
    expect(
      createBoxLineWithBorders('OK ✅', { leadingSpaces: 1, width: 8 }),
    ).toBe('│ OK ✅  │')
  })

  it('creates empty box lines with the requested width', () => {
    expect(createEmptyBoxLine(4)).toBe('│    │')
  })
})
