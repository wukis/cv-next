'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { getRequiredArrayItem } from '@/lib/assert'

type TerminalTextSegment = {
  text: string
  className?: string
}

type SegmentWithCharacters = TerminalTextSegment & {
  characters: string[]
}

type AnimationStatus = 'ready' | 'pending' | 'animating' | 'settling' | 'done'

const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)'
const TYPING_RHYTHM_PATTERN = [-8, 4, 10, -3, 7, 1]
const SESSION_STORAGE_PREFIX = 'terminal-header-seen:'

function hasSeenAnimation(sessionStorageKey: string) {
  try {
    return window.sessionStorage.getItem(sessionStorageKey) === 'true'
  } catch {
    return false
  }
}

function markAnimationSeen(sessionStorageKey: string) {
  try {
    window.sessionStorage.setItem(sessionStorageKey, 'true')
  } catch {
    // Ignore storage access issues and fall back to current-render behavior.
  }
}

function clearScheduledFrames(timeoutIdsRef: { current: number[] }) {
  timeoutIdsRef.current.forEach((timeoutId) => {
    window.clearTimeout(timeoutId)
  })
  timeoutIdsRef.current = []
}

function buildTypingFrames(segments: SegmentWithCharacters[]) {
  const frames: Array<{ count: number; delay: number }> = []
  let revealedCharacters = 0
  let rhythmIndex = 0

  segments.forEach((segment, index) => {
    const isCommandSegment = index === 0
    const isWhitespace = segment.text.trim().length === 0

    if (isWhitespace) {
      revealedCharacters += segment.characters.length
      frames.push({ count: revealedCharacters, delay: 18 })
      return
    }

    const shouldAutocomplete =
      segment.characters.length > (isCommandSegment ? 6 : 4)
    const typedCharacters = shouldAutocomplete
      ? Math.min(isCommandSegment ? 4 : 3, segment.characters.length - 1)
      : segment.characters.length

    for (let index = 0; index < typedCharacters; index += 1) {
      revealedCharacters += 1
      const rhythmOffset = getRequiredArrayItem(
        TYPING_RHYTHM_PATTERN,
        rhythmIndex % TYPING_RHYTHM_PATTERN.length,
        'Expected typing rhythm value.',
      )
      rhythmIndex += 1

      frames.push({
        count: revealedCharacters,
        delay: Math.max(22, (isCommandSegment ? 42 : 34) + rhythmOffset),
      })
    }

    if (shouldAutocomplete && typedCharacters < segment.characters.length) {
      revealedCharacters += segment.characters.length - typedCharacters
      frames.push({
        count: revealedCharacters,
        delay: isCommandSegment ? 90 : 72,
      })
    }
  })

  return frames
}

function renderVisibleSegments(
  segments: SegmentWithCharacters[],
  visibleCharacters: number,
) {
  let remainingCharacters = visibleCharacters

  return segments.map((segment, index) => {
    if (remainingCharacters <= 0) {
      return null
    }

    const displayedLength = Math.min(
      remainingCharacters,
      segment.characters.length,
    )

    remainingCharacters -= displayedLength

    if (displayedLength === 0) {
      return null
    }

    return (
      <span
        key={`animated-terminal-segment-${index}`}
        className={segment.className}
      >
        {segment.characters.slice(0, displayedLength).join('')}
      </span>
    )
  })
}

export function AnimatedTerminalText({
  segments,
}: {
  segments: TerminalTextSegment[]
}) {
  const pathname = usePathname()
  const containerRef = useRef<HTMLSpanElement>(null)
  const timeoutIdsRef = useRef<number[]>([])
  const startedRef = useRef(false)

  const segmentData = useMemo(
    () =>
      segments.map((segment) => ({
        ...segment,
        characters: Array.from(segment.text),
      })),
    [segments],
  )
  const totalCharacters = useMemo(
    () =>
      segmentData.reduce(
        (characterCount, segment) => characterCount + segment.characters.length,
        0,
      ),
    [segmentData],
  )
  const fullText = useMemo(
    () => segmentData.map((segment) => segment.text).join(''),
    [segmentData],
  )
  const sessionStorageKey = useMemo(
    () => `${SESSION_STORAGE_PREFIX}${pathname ?? '/'}:${fullText}`,
    [fullText, pathname],
  )

  const [status, setStatus] = useState<AnimationStatus>('ready')
  const [displayedCharacters, setDisplayedCharacters] =
    useState(totalCharacters)

  useEffect(() => {
    startedRef.current = false

    if (typeof window === 'undefined') {
      return
    }

    clearScheduledFrames(timeoutIdsRef)

    const frameId = window.requestAnimationFrame(() => {
      if (window.matchMedia(REDUCED_MOTION_MEDIA_QUERY).matches) {
        setDisplayedCharacters(totalCharacters)
        setStatus('done')
        return
      }

      if (hasSeenAnimation(sessionStorageKey)) {
        setDisplayedCharacters(totalCharacters)
        setStatus('done')
        return
      }

      setDisplayedCharacters(0)
      setStatus('pending')
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      clearScheduledFrames(timeoutIdsRef)
    }
  }, [sessionStorageKey, totalCharacters])

  useEffect(() => {
    if (status !== 'pending') {
      return
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_MEDIA_QUERY)
    const finishImmediately = () => {
      clearScheduledFrames(timeoutIdsRef)
      setDisplayedCharacters(totalCharacters)
      setStatus('done')
    }

    const startAnimation = () => {
      if (startedRef.current) {
        return
      }

      startedRef.current = true
      markAnimationSeen(sessionStorageKey)
      setStatus('animating')

      let totalDelay = 0

      buildTypingFrames(segmentData).forEach((frame) => {
        totalDelay += frame.delay

        const timeoutId = window.setTimeout(() => {
          setDisplayedCharacters(frame.count)
        }, totalDelay)

        timeoutIdsRef.current.push(timeoutId)
      })

      const settlingTimeoutId = window.setTimeout(() => {
        setStatus('settling')
      }, totalDelay + 40)

      const finishTimeoutId = window.setTimeout(() => {
        setDisplayedCharacters(totalCharacters)
        setStatus('done')
      }, totalDelay + 240)

      timeoutIdsRef.current.push(settlingTimeoutId, finishTimeoutId)
    }

    const handleReducedMotionChange = () => {
      if (mediaQuery.matches) {
        finishImmediately()
      }
    }

    mediaQuery.addEventListener('change', handleReducedMotionChange)

    if (!('IntersectionObserver' in window)) {
      startAnimation()

      return () => {
        mediaQuery.removeEventListener('change', handleReducedMotionChange)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return
        }

        observer.disconnect()
        startAnimation()
      },
      {
        threshold: 0.35,
      },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    } else {
      startAnimation()
    }

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleReducedMotionChange)
    }
  }, [segmentData, sessionStorageKey, status, totalCharacters])

  return (
    <span ref={containerRef} className="inline-grid max-w-full align-baseline">
      <span
        aria-hidden="true"
        className="invisible col-start-1 row-start-1 wrap-break-word whitespace-pre-wrap"
      >
        {renderVisibleSegments(segmentData, totalCharacters)}
      </span>
      <span
        aria-hidden="true"
        className="col-start-1 row-start-1 wrap-break-word whitespace-pre-wrap"
      >
        {renderVisibleSegments(segmentData, displayedCharacters)}
        {status === 'animating' || status === 'settling' ? (
          <span className="animate-terminal-caret ml-0.5 inline-block h-[0.92em] w-[0.58em] rounded-[1px] bg-current align-[-0.12em]" />
        ) : null}
      </span>
      <span className="sr-only">{fullText}</span>
    </span>
  )
}
