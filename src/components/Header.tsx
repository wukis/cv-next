'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import clsx from 'clsx'

import { DownloadIcon } from '@/components/Button'
import { Container } from '@/components/Container'
import { surfaceHoverMotionClassName } from '@/components/interactionStyles'
import {
  TRIGGER_NETWORK_EMERGENCY_EVENT,
  useAmbientClusterSnapshot,
} from '@/lib/ambientCluster'
import { deriveAmbientMonitoringState } from '@/lib/ambientMonitoring'
import { recommendationsCopy } from '@/lib/recommendationsCopy'
import { useAmbientEligibility } from '@/components/useAmbientEligibility'

const headerControlClassName = `group inline-flex min-h-11 items-center justify-center rounded-lg bg-white/90 text-neutral-800 shadow-lg shadow-neutral-800/5 ring-1 ring-neutral-300/70 backdrop-blur transition-colors hover:text-emerald-800 hover:ring-emerald-400/50 dark:bg-neutral-800/90 dark:text-neutral-200 dark:ring-neutral-700/70 dark:hover:text-emerald-200 dark:hover:ring-emerald-400/50 ${surfaceHoverMotionClassName}`

function useDesktopTooltipEnabled() {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      '(min-width: 768px) and (hover: hover) and (pointer: fine)',
    )

    const update = () => setIsEnabled(mediaQuery.matches)

    update()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update)
      return () => mediaQuery.removeEventListener('change', update)
    }

    mediaQuery.addListener(update)
    return () => mediaQuery.removeListener(update)
  }, [])

  return isEnabled
}

function DesktopTooltip({
  align = 'center',
  label,
  description,
  panelClassName,
  children,
}: {
  align?: 'left' | 'center' | 'right'
  label: string
  description: string
  panelClassName?: string
  children: React.ReactNode
}) {
  const isEnabled = useDesktopTooltipEnabled()

  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      {isEnabled ? (
        <span
          aria-hidden="true"
          className={clsx(
            'pointer-events-none absolute top-full z-30 mt-3 hidden md:block',
            align === 'left' && 'left-0',
            align === 'center' && 'left-1/2 -translate-x-1/2',
            align === 'right' && 'right-0',
          )}
        >
          <span
            className={clsx(
              'flex min-w-[11rem] max-w-64 flex-col gap-1 rounded-xl border border-emerald-500/15 bg-white/95 px-3 py-2 text-left shadow-xl shadow-neutral-900/10 ring-1 ring-neutral-200/60 backdrop-blur-md transition-all duration-200 ease-out dark:border-emerald-400/15 dark:bg-neutral-900/95 dark:ring-neutral-700/70',
              'translate-y-1 scale-[0.98] opacity-0 group-hover/tooltip:translate-y-0 group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100',
              align === 'left' && 'origin-top-left',
              align === 'center' && 'origin-top',
              align === 'right' && 'origin-top-right',
              panelClassName,
            )}
          >
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
              {label}
            </span>
            <span className="text-xs leading-5 text-neutral-600 dark:text-neutral-300">
              {description}
            </span>
          </span>
        </span>
      ) : null}
    </span>
  )
}

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

function AnimatedTerminalIcon({ className }: { className?: string }) {
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setCursorVisible((visible) => !visible)
    }, 530)

    return () => clearInterval(blinkInterval)
  }, [])

  return (
    <div className={clsx('relative flex items-center', className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-4 w-4 text-emerald-500"
      >
        <path
          d="M7 15l5-5-5-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 19h6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={clsx(
            'transition-opacity duration-100',
            cursorVisible ? 'opacity-100' : 'opacity-20',
          )}
        />
      </svg>
    </div>
  )
}

const navItems = [
  { href: '/', label: 'home' },
  { href: '/about', label: 'about' },
  { href: '/experience', label: 'experience' },
  { href: '/recommendations', label: recommendationsCopy.navLabel },
]

function MobileNavItem({
  href,
  label,
  isActive,
  close,
}: {
  href: string
  label: string
  isActive: boolean
  close: () => void
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={close}
        className={clsx(
          'flex min-h-11 items-center gap-3 rounded-lg px-4 py-2.5 font-mono text-sm font-medium transition-colors',
          isActive
            ? 'bg-emerald-500/15 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-100'
            : 'text-neutral-800 hover:bg-neutral-100 hover:text-emerald-800 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-emerald-200',
        )}
      >
        <span
          className={clsx(
            'h-1.5 w-1.5 rounded-full',
            isActive ? 'bg-current' : 'bg-neutral-400 dark:bg-neutral-500',
          )}
        />
        <span>~/{label}</span>
      </Link>
    </li>
  )
}

function MobileNavigation({ className }: { className?: string }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const mounted = typeof document !== 'undefined'

  const close = () => setIsOpen(false)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${headerControlClassName} gap-2 px-4 py-2 font-mono text-sm font-medium`}
      >
        <AnimatedTerminalIcon />
        <span>menu</span>
        <svg
          className="h-3 w-3 text-neutral-500 dark:text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {mounted &&
        isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[60] bg-neutral-900/60 backdrop-blur-sm"
              onClick={close}
              aria-hidden="true"
            />
            <div className="fixed inset-x-4 top-4 z-[70] overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700">
              <div className="flex min-h-11 items-center justify-between border-b border-neutral-200 bg-neutral-100 px-4 dark:border-neutral-700 dark:bg-neutral-800">
                <Link
                  href="/"
                  onClick={close}
                  className="-ml-1 inline-flex min-h-11 items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  aria-label="Go to home"
                >
                  <AnimatedTerminalIcon />
                  <span className="font-mono text-[10px] text-neutral-700 dark:text-neutral-200">
                    ~/navigation
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="inline-flex h-11 w-11 items-center justify-center rounded transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  <CloseIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
                </button>
              </div>

              <nav className="p-3">
                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <MobileNavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      isActive={pathname === item.href}
                      close={close}
                    />
                  ))}
                </ul>
              </nav>
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}

function NavItem({ href, label }: { href: string; label: string }) {
  const isActive = usePathname() === href

  return (
    <li>
      <Link
        href={href}
        className={clsx(
          'relative inline-flex min-h-11 items-center gap-1.5 rounded-md px-4 py-2 font-mono text-sm font-medium transition-all',
          isActive
            ? 'bg-emerald-500/15 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-100'
            : 'text-neutral-800 hover:bg-neutral-100 hover:text-emerald-800 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-emerald-200',
        )}
      >
        <span
          className={clsx(
            'h-1.5 w-1.5 rounded-full transition-colors',
            isActive ? 'bg-current' : 'bg-neutral-400 dark:bg-neutral-500',
          )}
        />
        {label}
      </Link>
    </li>
  )
}

function DesktopNavigation(props: React.ComponentPropsWithoutRef<'nav'>) {
  return (
    <nav {...props}>
      <div className="flex items-center overflow-hidden rounded-lg bg-white/90 shadow-lg shadow-neutral-800/5 ring-1 ring-neutral-300/70 backdrop-blur dark:bg-neutral-800/90 dark:ring-neutral-700/70">
        <ul className="flex items-center gap-1 px-2 py-1">
          <li>
            <DesktopTooltip
              align="left"
              label="Home"
              description="Jump back to the main landing page."
            >
              <Link
                href="/"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-neutral-800 transition-colors hover:bg-neutral-100 hover:text-emerald-800 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-emerald-200"
                aria-label="Go to home"
              >
                <AnimatedTerminalIcon />
              </Link>
            </DesktopTooltip>
          </li>
          {navItems.map((item) => (
            <NavItem key={item.href} href={item.href} label={item.label} />
          ))}
        </ul>
      </div>
    </nav>
  )
}

function ThemeToggle() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const { resolvedTheme, setTheme } = useTheme()

  const otherTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
  const tooltipLabel = isMounted
    ? otherTheme === 'dark'
      ? 'Switch to dark mode'
      : 'Switch to light mode'
    : 'Toggle theme'

  return (
    <DesktopTooltip
      align="right"
      label={tooltipLabel}
      description="Change the site appearance for day or night reading."
    >
      <button
        type="button"
        aria-label={tooltipLabel}
        className={`${headerControlClassName} h-11 w-11`}
        onClick={() => setTheme(otherTheme)}
      >
        <SunIcon className="h-5 w-5 fill-amber-100 stroke-amber-600 transition group-hover:fill-amber-200 group-hover:stroke-amber-700 dark:hidden" />
        <MoonIcon className="hidden h-5 w-5 fill-sky-100 stroke-sky-600 transition group-hover:fill-sky-200 group-hover:stroke-sky-500 dark:block dark:fill-sky-400/20 dark:stroke-sky-300" />
      </button>
    </DesktopTooltip>
  )
}

function CvDownloadButton() {
  return (
    <DesktopTooltip
      label="Download CV"
      description="Save the latest PDF version of the resume."
    >
      <a
        href="/jonas-petrik-cv.pdf"
        download
        aria-label="Download CV PDF"
        className={`${headerControlClassName} h-11 w-11`}
      >
        <DownloadIcon className="h-5 w-5 text-neutral-700 transition group-hover:text-emerald-800 dark:text-neutral-200 dark:group-hover:text-emerald-200" />
      </a>
    </DesktopTooltip>
  )
}

function HexagonNetworkIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3L17.196 6V12L12 15L6.804 12V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="3" r="1.2" fill="currentColor" />
      <circle cx="17.196" cy="6" r="1.2" fill="currentColor" />
      <circle cx="17.196" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" />
      <circle cx="6.804" cy="12" r="1.2" fill="currentColor" />
      <circle cx="6.804" cy="6" r="1.2" fill="currentColor" />
      <path
        d="M12 15V19M6.804 12L3 14M17.196 12L21 14"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="2 2"
        className="opacity-60"
      />
      <circle
        cx="12"
        cy="20"
        r="1"
        fill="currentColor"
        className="opacity-60"
      />
      <circle
        cx="2.5"
        cy="14.5"
        r="1"
        fill="currentColor"
        className="opacity-60"
      />
      <circle
        cx="21.5"
        cy="14.5"
        r="1"
        fill="currentColor"
        className="opacity-60"
      />
    </svg>
  )
}

function AnimationFocus() {
  const [isHovering, setIsHovering] = useState(false)
  const cluster = useAmbientClusterSnapshot()
  const monitoring = deriveAmbientMonitoringState(cluster)
  const tooltipDescription = isHovering
    ? monitoring.buttonDescription
    : 'Hover to preview cluster pressure paths like surge scaling, reroute pressure, cache warmup misses, and queue buildup. While hovering, scroll to zoom the cluster view. Click to start a failover drill immediately.'

  useEffect(() => {
    if (isHovering) {
      document.documentElement.classList.add('animation-focus')
      window.dispatchEvent(
        new CustomEvent('animation-focus-hover', {
          detail: { isHovering: true },
        }),
      )
    } else {
      document.documentElement.classList.remove('animation-focus')
      window.dispatchEvent(
        new CustomEvent('animation-focus-hover', {
          detail: { isHovering: false },
        }),
      )
    }

    return () => {
      document.documentElement.classList.remove('animation-focus')
      window.dispatchEvent(
        new CustomEvent('animation-focus-hover', {
          detail: { isHovering: false },
        }),
      )
    }
  }, [isHovering])

  return (
    <DesktopTooltip
      align="right"
      label={monitoring.buttonLabel}
      description={tooltipDescription}
      panelClassName="min-w-[20rem] max-w-[26rem]"
    >
      <button
        type="button"
        className={`${headerControlClassName} h-11 w-11 cursor-pointer`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent(TRIGGER_NETWORK_EMERGENCY_EVENT, {
              detail: {
                scenarioKey: 'failover',
                triggerSource: 'button-click',
              },
            }),
          )
        }
        aria-label="Preview background animation"
      >
        <HexagonNetworkIcon
          className={clsx(
            'h-5 w-5 transition-all duration-300',
            isHovering
              ? 'scale-110 text-emerald-500 dark:text-emerald-400'
              : 'text-neutral-600 dark:text-neutral-300',
          )}
        />
        <span
          className={clsx(
            'absolute inset-0 rounded-lg ring-2 ring-emerald-400/50 transition-all duration-500',
            isHovering ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          )}
        />
      </button>
    </DesktopTooltip>
  )
}

export function Header() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const isAmbientEligible = useAmbientEligibility()

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
    <header className="pointer-events-none relative z-50 flex-none">
      <div className="h-[5.5rem]" />
      <div className="fixed inset-x-0 top-0 z-50 pt-6">
        <Container>
          <div
            className={clsx(
              'relative flex items-start gap-4 transition-all duration-300',
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none -translate-y-4 opacity-0',
            )}
          >
            <div className="flex flex-1">
              <MobileNavigation className="pointer-events-auto md:hidden" />
              <DesktopNavigation className="pointer-events-auto hidden md:block" />
            </div>
            <div className="flex justify-end md:flex-1">
              <div className="pointer-events-auto flex items-center gap-2">
                <CvDownloadButton />
                {isAmbientEligible ? <AnimationFocus /> : null}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </Container>
      </div>
    </header>
  )
}
