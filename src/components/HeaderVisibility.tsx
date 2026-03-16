'use client'

import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function HeaderVisibility({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollThreshold = 100

      if (currentScrollY < scrollThreshold) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY + 5) {
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true)
      }

      lastScrollY = currentScrollY
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname])

  return (
    <div
      className={clsx(
        'relative transition-all duration-300',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none -translate-y-4 opacity-0',
      )}
    >
      {children}
    </div>
  )
}
