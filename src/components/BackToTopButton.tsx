'use client'

import { useEffect, useState } from 'react'

import { surfaceHoverMotionClassName } from '@/components/interactionStyles'

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimationHovering, setIsAnimationHovering] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(
    () =>
      typeof document !== 'undefined' &&
      document.body.dataset.mobileMenuOpen === 'true',
  )

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 400)
    }

    toggleVisibility()
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

  useEffect(() => {
    const handleMobileNavigationToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ isOpen: boolean }>
      setIsMobileMenuOpen(customEvent.detail.isOpen)
    }

    window.addEventListener(
      'mobile-navigation-toggle',
      handleMobileNavigationToggle as EventListener,
    )

    return () =>
      window.removeEventListener(
        'mobile-navigation-toggle',
        handleMobileNavigationToggle as EventListener,
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
      className={`fixed right-4 bottom-6 z-40 flex h-10 w-10 items-center justify-center rounded-sm bg-white/90 shadow-lg ring-1 shadow-neutral-800/5 ring-neutral-200/50 backdrop-blur-sm hover:shadow-emerald-500/10 hover:ring-emerald-500/50 sm:right-6 sm:bottom-8 lg:right-[max(2rem,calc((100vw-80rem)/2+1rem))] dark:bg-neutral-900/90 dark:ring-neutral-700/50 dark:hover:ring-emerald-400/50 ${surfaceHoverMotionClassName} ${
        isVisible && !isAnimationHovering && !isMobileMenuOpen
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
