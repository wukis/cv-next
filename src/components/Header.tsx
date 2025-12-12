'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Popover, Transition } from '@headlessui/react'
import clsx from 'clsx'

import { Container } from '@/components/Container'

function CloseIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="m17.25 6.75-10.5 10.5M6.75 6.75l10.5 10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SunIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M8 12.25A4.25 4.25 0 0 1 12.25 8v0a4.25 4.25 0 0 1 4.25 4.25v0a4.25 4.25 0 0 1-4.25 4.25v0A4.25 4.25 0 0 1 8 12.25v0Z" />
      <path
        d="M12.25 3v1.5M21.5 12.25H20M18.791 18.791l-1.06-1.06M18.791 5.709l-1.06 1.06M12.25 20v1.5M4.5 12.25H3M6.77 6.77 5.709 5.709M6.77 17.73l-1.061 1.061"
        fill="none"
      />
    </svg>
  )
}

function MoonIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M17.25 16.22a6.937 6.937 0 0 1-9.47-9.47 7.451 7.451 0 1 0 9.47 9.47ZM12.75 7C17 7 17 2.75 17 2.75S17 7 21.25 7C17 7 17 11.25 17 11.25S17 7 12.75 7Z"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TerminalIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 15l5-5-5-5M13 19h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AnimatedTerminalIcon({ className }: { className?: string }) {
  const [cursorVisible, setCursorVisible] = useState(true)
  
  // Blinking cursor effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setCursorVisible(v => !v)
    }, 530) // Classic terminal blink rate
    
    return () => clearInterval(blinkInterval)
  }, [])
  
  return (
    <div className={clsx('relative flex items-center', className)}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-4 h-4 text-emerald-500">
        {/* Chevron > */}
        <path
          d="M7 15l5-5-5-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Blinking cursor _ */}
        <path
          d="M13 19h6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={clsx(
            'transition-opacity duration-100',
            cursorVisible ? 'opacity-100' : 'opacity-20'
          )}
        />
      </svg>
    </div>
  )
}

const navItems = [
  { href: '/', label: 'home', color: 'emerald' },
  { href: '/about', label: 'about', color: 'sky' },
  { href: '/experience', label: 'experience', color: 'violet' },
  { href: '/recommendations', label: 'testimonials', color: 'amber' },
]

function MobileNavItem({
  href,
  label,
  color,
  isActive,
  close,
}: {
  href: string
  label: string
  color: string
  isActive: boolean
  close: () => void
}) {
  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    sky: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
    violet: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  }

  return (
    <li>
      <Link 
        href={href} 
        onClick={close}
        className={clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm transition-colors',
          isActive 
            ? colorClasses[color]
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        )}
      >
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full',
          isActive ? 'bg-current' : 'bg-neutral-300 dark:bg-neutral-600'
        )} />
        <span>~/{label}</span>
      </Link>
    </li>
  )
}

function MobileNavigation(
  props: React.ComponentPropsWithoutRef<typeof Popover>,
) {
  const pathname = usePathname()
  
  return (
    <Popover {...props}>
      {({ close }) => (
        <>
          <Popover.Button className="group flex items-center gap-2 rounded-lg bg-white/80 dark:bg-neutral-800/80 px-3 py-2 text-sm font-mono text-neutral-700 dark:text-neutral-300 shadow-lg shadow-neutral-800/5 ring-1 ring-neutral-200/50 dark:ring-neutral-700/50 backdrop-blur transition hover:ring-neutral-300 dark:hover:ring-neutral-600">
            <AnimatedTerminalIcon />
            <span>menu</span>
            <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Popover.Button>
          <Transition.Root>
            <Transition.Child
              as={Fragment}
              enter="duration-150 ease-out"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="duration-150 ease-in"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Popover.Overlay className="fixed inset-0 z-[60] bg-neutral-900/60 backdrop-blur-sm" />
            </Transition.Child>
            <Transition.Child
              as={Fragment}
              enter="duration-200 ease-out"
              enterFrom="opacity-0 scale-95 -translate-y-2"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="duration-150 ease-in"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 -translate-y-2"
            >
              <Popover.Panel
                focus
                className="fixed inset-x-4 top-4 z-[70] origin-top rounded-lg bg-white dark:bg-neutral-900 overflow-hidden shadow-2xl ring-1 ring-neutral-200 dark:ring-neutral-700"
              >
                {/* Terminal header */}
                <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                  <Link 
                    href="/" 
                    onClick={close}
                    className="flex items-center gap-2 -ml-1 px-1 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                    aria-label="Go to home"
                  >
                    <AnimatedTerminalIcon />
                    <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">~/navigation</span>
                  </Link>
                  <Popover.Button aria-label="Close menu" className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                    <CloseIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                  </Popover.Button>
                </div>
                
                {/* Navigation items */}
                <nav className="p-3">
                  <ul className="space-y-1">
                    {navItems.map((item) => (
                      <MobileNavItem 
                        key={item.href} 
                        href={item.href} 
                        label={item.label}
                        color={item.color}
                        isActive={pathname === item.href}
                        close={close}
                      />
                    ))}
                  </ul>
                </nav>
              </Popover.Panel>
            </Transition.Child>
          </Transition.Root>
        </>
      )}
    </Popover>
  )
}

function NavItem({
  href,
  label,
  color,
}: {
  href: string
  label: string
  color: string
}) {
  const isActive = usePathname() === href
  
  const activeColors: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    sky: 'text-sky-600 dark:text-sky-400',
    violet: 'text-violet-600 dark:text-violet-400',
    amber: 'text-amber-600 dark:text-amber-400',
  }
  
  const hoverColors: Record<string, string> = {
    emerald: 'hover:text-emerald-600 dark:hover:text-emerald-400',
    sky: 'hover:text-sky-600 dark:hover:text-sky-400',
    violet: 'hover:text-violet-600 dark:hover:text-violet-400',
    amber: 'hover:text-amber-600 dark:hover:text-amber-400',
  }
  
  const bgColors: Record<string, string> = {
    emerald: 'bg-emerald-500/10',
    sky: 'bg-sky-500/10',
    violet: 'bg-violet-500/10',
    amber: 'bg-amber-500/10',
  }

  return (
    <li>
      <Link
        href={href}
        className={clsx(
          'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-sm transition-all',
          isActive
            ? `${activeColors[color]} ${bgColors[color]}`
            : `text-neutral-600 dark:text-neutral-400 ${hoverColors[color]} hover:bg-neutral-100 dark:hover:bg-neutral-800`,
        )}
      >
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full transition-colors',
          isActive ? 'bg-current' : 'bg-neutral-300 dark:bg-neutral-600'
        )} />
        {label}
      </Link>
    </li>
  )
}

function DesktopNavigation(props: React.ComponentPropsWithoutRef<'nav'>) {
  return (
    <nav {...props}>
      <div className="flex items-center rounded-lg bg-white/80 dark:bg-neutral-800/80 shadow-lg shadow-neutral-800/5 ring-1 ring-neutral-200/50 dark:ring-neutral-700/50 backdrop-blur overflow-hidden">
        {/* Nav items including home terminal icon */}
        <ul className="flex items-center gap-1 px-2 py-1">
          {/* Terminal prompt icon - links to home (never shows active state) */}
          <li>
            <Link 
              href="/" 
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Go to home"
            >
              <AnimatedTerminalIcon />
            </Link>
          </li>
          {navItems.map((item) => (
            <NavItem 
              key={item.href} 
              href={item.href} 
              label={item.label}
              color={item.color}
            />
          ))}
        </ul>
      </div>
    </nav>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const otherTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <button
      type="button"
      aria-label={mounted ? `Switch to ${otherTheme} theme` : 'Toggle theme'}
      className="group flex items-center justify-center w-10 h-10 rounded-lg bg-white/80 dark:bg-neutral-800/80 shadow-lg shadow-neutral-800/5 ring-1 ring-neutral-200/50 dark:ring-neutral-700/50 backdrop-blur transition hover:ring-neutral-300 dark:hover:ring-neutral-600"
      onClick={() => setTheme(otherTheme)}
    >
      <SunIcon className="h-5 w-5 fill-amber-100 stroke-amber-500 transition group-hover:fill-amber-200 group-hover:stroke-amber-600 dark:hidden" />
      <MoonIcon className="hidden h-5 w-5 fill-sky-100 stroke-sky-500 transition group-hover:fill-sky-200 group-hover:stroke-sky-400 dark:block dark:fill-sky-400/20 dark:stroke-sky-400" />
    </button>
  )
}

function clamp(number: number, a: number, b: number) {
  const min = Math.min(a, b)
  const max = Math.max(a, b)
  return Math.min(Math.max(number, min), max)
}

export function Header() {
  const isHomePage = usePathname() === '/'
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)
  const headerRef = useRef<React.ElementRef<'div'>>(null)
  const isInitial = useRef(true)

  // Handle scroll direction for hide/show animation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollThreshold = 100 // Don't hide until scrolled past this point
      
      if (currentScrollY < scrollThreshold) {
        // Always show near the top
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY.current + 5) {
        // Scrolling down (with 5px threshold to avoid jitter)
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY.current - 5) {
        // Scrolling up
        setIsVisible(true)
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const downDelay = 0
    const upDelay = 64

    function setProperty(property: string, value: string) {
      document.documentElement.style.setProperty(property, value)
    }

    function removeProperty(property: string) {
      document.documentElement.style.removeProperty(property)
    }

    function updateHeaderStyles() {
      if (!headerRef.current) {
        return
      }

      const { top, height } = headerRef.current.getBoundingClientRect()
      const scrollY = clamp(
        window.scrollY,
        0,
        document.body.scrollHeight - window.innerHeight,
      )

      if (isInitial.current) {
        setProperty('--header-position', 'sticky')
      }

      setProperty('--content-offset', `${downDelay}px`)

      if (isInitial.current || scrollY < downDelay) {
        setProperty('--header-height', `${downDelay + height}px`)
        setProperty('--header-mb', `${-downDelay}px`)
      } else if (top + height < -upDelay) {
        const offset = Math.max(height, scrollY - upDelay)
        setProperty('--header-height', `${offset}px`)
        setProperty('--header-mb', `${height - offset}px`)
      } else if (top === 0) {
        setProperty('--header-height', `${scrollY + height}px`)
        setProperty('--header-mb', `${-scrollY}px`)
      }

      if (top === 0 && scrollY > 0 && scrollY >= downDelay) {
        setProperty('--header-inner-position', 'fixed')
        removeProperty('--header-top')
      } else {
        removeProperty('--header-inner-position')
        setProperty('--header-top', '0px')
      }
    }


    function updateStyles() {
      updateHeaderStyles()
      isInitial.current = false
    }

    updateStyles()
    window.addEventListener('scroll', updateStyles, { passive: true })
    window.addEventListener('resize', updateStyles)

    return () => {
      window.removeEventListener('scroll', updateStyles)
      window.removeEventListener('resize', updateStyles)
    }
  }, [isHomePage])

  return (
    <>
      <header
        className="pointer-events-none relative z-50 flex flex-none flex-col"
        style={{
          height: 'var(--header-height)',
          marginBottom: 'var(--header-mb)',
        }}
      >
        {isHomePage && (
          <>
            <Container
              className="top-0 order-last -mb-3 pt-3"
              style={{
                position:
                  'var(--header-position)' as React.CSSProperties['position'],
              }}
            >
            </Container>
          </>
        )}
        <div
          ref={headerRef}
          className="top-0 z-10 h-16 pt-6"
          style={{
            position:
              'var(--header-position)' as React.CSSProperties['position'],
          }}
        >
          <Container
            className="top-[var(--header-top,theme(spacing.6))] w-full"
            style={{
              position:
                'var(--header-inner-position)' as React.CSSProperties['position'],
            }}
          >
            <div 
              className={clsx(
                'relative flex gap-4 transition-all duration-300',
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 -translate-y-4 pointer-events-none'
              )}
            >
              <div className="flex flex-1">
                <MobileNavigation className="pointer-events-auto md:hidden" />
                <DesktopNavigation className="pointer-events-auto hidden md:block" />
              </div>
              <div className="flex justify-end md:flex-1">
                <div className="pointer-events-auto">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </Container>
        </div>
      </header>
      {isHomePage && (
        <div
          className="flex-none"
          style={{ height: 'var(--content-offset)' }}
        />
      )}
    </>
  )
}
