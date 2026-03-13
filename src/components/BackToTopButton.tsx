'use client'

import { useEffect, useState } from 'react'

import { surfaceHoverMotionClassName } from '@/components/interactionStyles'

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimationHovering, setIsAnimationHovering] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 400)
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  useEffect(() => {
    const handleAnimationFocusHover = (event: Event) => {
      const customEvent = event as CustomEvent<{ isHovering: boolean }>
      setIsAnimationHovering(customEvent.detail.isHovering)
    }

    window.addEventListener(
      'animation-focus-hover',
      handleAnimationFocusHover as EventListener,
    )

    return () =>
      window.removeEventListener(
        'animation-focus-hover',
        handleAnimationFocusHover as EventListener,
      )
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-6 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-white/80 shadow-lg shadow-neutral-800/5 ring-1 ring-neutral-200/50 backdrop-blur hover:shadow-emerald-500/10 hover:ring-emerald-500/50 sm:right-8 lg:right-[max(2rem,calc((100vw-80rem)/2+5rem))] dark:bg-neutral-800/80 dark:ring-neutral-700/50 dark:hover:ring-emerald-400/50 ${surfaceHoverMotionClassName} ${
        isVisible && !isAnimationHovering
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      } `}
    >
      <svg
        className="h-5 w-5 text-emerald-500 dark:text-emerald-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  )
}
