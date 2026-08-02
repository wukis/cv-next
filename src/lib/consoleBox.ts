/**
 * Helper function to create properly aligned console box lines
 * Ensures consistent padding and alignment for ASCII art boxes
 */

export interface BoxLineOptions {
  /** Number of leading spaces (default: 2) */
  leadingSpaces?: number
  /** Total width between borders (default: 61) */
  width?: number
}

const WIDE_GLYPH_RANGES = [
  [0x1f300, 0x1f9ff],
  [0x2600, 0x26ff],
  [0x2700, 0x27bf],
  [0xfe00, 0xfe0f],
  [0x1f600, 0x1f64f],
  [0x1f900, 0x1f9ff],
  [0x1fa00, 0x1faff],
] as const

function isWideGlyph(char: string): boolean {
  const codePoint = char.codePointAt(0) ?? 0

  return (
    codePoint > 0xffff ||
    WIDE_GLYPH_RANGES.some(
      ([rangeStart, rangeEnd]) =>
        codePoint >= rangeStart && codePoint <= rangeEnd,
    )
  )
}

function getGlyphMetrics(str: string): {
  visualWidth: number
  hasEmoji: boolean
} {
  let visualWidth = 0
  let containsWideGlyph = false

  for (const char of str) {
    if (isWideGlyph(char)) {
      visualWidth += 2
      containsWideGlyph = true
    } else {
      visualWidth += 1
    }
  }

  return { visualWidth, hasEmoji: containsWideGlyph }
}

function getVisualWidth(str: string): number {
  return getGlyphMetrics(str).visualWidth
}

/**
 * Checks if a string contains emojis
 * @param str The string to check
 * @returns True if the string contains emojis
 */
function hasEmoji(str: string): boolean {
  return getGlyphMetrics(str).hasEmoji
}

/**
 * Pads a string to a specific visual width, accounting for emoji width
 * For emoji lines, adds 1 extra space to account for browser rendering differences
 * @param str The string to pad
 * @param targetWidth The target visual width
 * @returns The padded string
 */
function padToVisualWidth(str: string, targetWidth: number): string {
  const currentWidth = getVisualWidth(str)
  // For emoji lines, browsers may render emojis slightly wider, so add 1 extra space
  // This compensates for the visual misalignment
  const emojiAdjustment = hasEmoji(str) ? 1 : 0
  const paddingNeeded = targetWidth - currentWidth + emojiAdjustment
  if (paddingNeeded <= 0) {
    return str
  }
  return str + ' '.repeat(paddingNeeded)
}

/**
 * Creates a properly padded line for an ASCII box
 * Adjusts target width for emoji lines to maintain visual alignment
 * @param content The text content for the line
 * @param options Configuration options
 * @returns The formatted line with proper padding
 */
function createBoxLine(content: string, options: BoxLineOptions = {}): string {
  const { leadingSpaces = 2, width = 61 } = options
  const trailingSpace = 1
  // For emoji lines, reduce target width by 1 to compensate for extra padding
  const emojiAdjustment = hasEmoji(content) ? -1 : 0
  const contentWidth = width - leadingSpaces - trailingSpace + emojiAdjustment

  const paddedContent = padToVisualWidth(content, contentWidth)
  const leading = ' '.repeat(leadingSpaces)

  return `${leading}${paddedContent} `
}

/**
 * Creates a complete box line with borders
 * @param content The text content for the line
 * @param options Configuration options
 * @returns The complete line with │ borders
 */
export function createBoxLineWithBorders(
  content: string,
  options: BoxLineOptions = {},
): string {
  const line = createBoxLine(content, options)
  return `│${line}│`
}

/**
 * Creates an empty box line
 * @param width Total width between borders (default: 61)
 * @returns An empty line with proper padding
 */
export function createEmptyBoxLine(width: number = 61): string {
  return `│${' '.repeat(width)}│`
}
