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

/**
 * Calculates the visual width of a string in a monospace font
 * Emojis and wide characters count as 2 characters
 * @param str The string to measure
 * @returns The visual width in character cells
 */
function getVisualWidth(str: string): number {
  let width = 0
  // Use for...of to properly handle surrogate pairs (emojis)
  for (const char of str) {
    const codePoint = char.codePointAt(0) || 0

    // Emojis and wide characters take 2 spaces in monospace fonts
    if (
      (codePoint >= 0x1f300 && codePoint <= 0x1f9ff) || // Emoticons & Symbols
      (codePoint >= 0x2600 && codePoint <= 0x26ff) || // Miscellaneous Symbols
      (codePoint >= 0x2700 && codePoint <= 0x27bf) || // Dingbats
      (codePoint >= 0xfe00 && codePoint <= 0xfe0f) || // Variation Selectors
      (codePoint >= 0x1f600 && codePoint <= 0x1f64f) || // Emoticons
      (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) || // Supplemental Symbols
      (codePoint >= 0x1fa00 && codePoint <= 0x1faff) || // Chess Symbols
      codePoint > 0xffff // Most wide characters (CJK, etc.)
    ) {
      width += 2
    } else {
      width += 1
    }
  }
  return width
}

/**
 * Checks if a string contains emojis
 * @param str The string to check
 * @returns True if the string contains emojis
 */
function hasEmoji(str: string): boolean {
  for (const char of str) {
    const codePoint = char.codePointAt(0) || 0
    if (
      (codePoint >= 0x1f300 && codePoint <= 0x1f9ff) ||
      (codePoint >= 0x2600 && codePoint <= 0x26ff) ||
      (codePoint >= 0x2700 && codePoint <= 0x27bf) ||
      (codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
      (codePoint >= 0x1f600 && codePoint <= 0x1f64f) ||
      (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
      (codePoint >= 0x1fa00 && codePoint <= 0x1faff) ||
      codePoint > 0xffff
    ) {
      return true
    }
  }
  return false
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
