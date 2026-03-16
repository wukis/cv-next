'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

import {
  CloseIcon,
  headerControlClassName,
  navItems,
  TerminalPromptIcon,
} from '@/components/HeaderShared'

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

export function MobileNavigation({ className }: { className?: string }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const mounted = typeof document !== 'undefined'

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const close = () => setIsOpen(false)

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${headerControlClassName} gap-2 px-4 py-2 font-mono text-sm font-medium`}
      >
        <TerminalPromptIcon className="h-4 w-4 text-emerald-500" />
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
                  <TerminalPromptIcon className="h-4 w-4 text-emerald-500" />
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
