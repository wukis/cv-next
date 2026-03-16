'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'

import {
  DesktopTooltip,
  headerControlClassName,
} from '@/components/HeaderShared'

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

export function ThemeToggleButton() {
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
