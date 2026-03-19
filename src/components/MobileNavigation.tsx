'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  CloseIcon,
  headerControlClassName,
  type NavChild,
  navItems,
  TerminalPromptIcon,
} from '@/components/HeaderShared'

function MobileNavItem({
  href,
  label,
  isActive,
  isParentActive,
  close,
}: {
  href: string
  label: string
  isActive: boolean
  isParentActive?: boolean
  close: () => void
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={close}
        className={clsx(
          'flex min-h-11 items-center gap-2 rounded-sm px-4 py-2.5 font-mono text-sm font-medium transition-colors',
          isActive
            ? 'bg-emerald-500/10 text-emerald-800 shadow-[inset_2px_0_0_0] shadow-emerald-500/50 dark:bg-emerald-400/10 dark:text-emerald-200 dark:shadow-emerald-400/40'
            : isParentActive
              ? 'text-neutral-800 shadow-[inset_2px_0_0_0] shadow-emerald-500/50 dark:text-neutral-200 dark:shadow-emerald-400/40'
              : 'text-neutral-800 hover:bg-neutral-100 hover:text-emerald-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-emerald-300',
        )}
      >
        {isActive ? (
          <TerminalPromptIcon className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
        ) : null}
        <span>{label}</span>
      </Link>
    </li>
  )
}

function MobileSubNavItem({
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
    <li className="ml-4">
      <Link
        href={href}
        onClick={close}
        className={clsx(
          'flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-2 font-mono text-xs font-medium transition-colors',
          isActive
            ? 'bg-emerald-500/10 text-emerald-600 shadow-[inset_2px_0_0_0] shadow-emerald-500/50 dark:bg-emerald-400/10 dark:text-emerald-400 dark:shadow-emerald-400/40'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-emerald-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-emerald-300',
        )}
      >
        <span className="text-emerald-500/50 dark:text-emerald-400/50">└─</span>
        {isActive ? (
          <TerminalPromptIcon className="h-3 w-3 shrink-0 text-emerald-500" />
        ) : null}
        <span>{label}</span>
      </Link>
    </li>
  )
}

function hasActiveChild(
  children: NavChild[] | undefined,
  pathname: string,
): boolean {
  return children?.some((c) => pathname === c.href) ?? false
}

export default function MobileNavigation({
  className,
}: {
  className?: string
}) {
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

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const scrollY = window.scrollY
    const { style: htmlStyle } = document.documentElement
    const { style: bodyStyle } = document.body
    const previousHtmlOverflow = htmlStyle.overflow
    const previousBodyOverflow = bodyStyle.overflow
    const previousBodyPosition = bodyStyle.position
    const previousBodyTop = bodyStyle.top
    const previousBodyWidth = bodyStyle.width

    document.body.dataset.mobileMenuOpen = 'true'
    window.dispatchEvent(
      new CustomEvent('mobile-navigation-toggle', {
        detail: { isOpen: true },
      }),
    )
    htmlStyle.overflow = 'hidden'
    bodyStyle.overflow = 'hidden'
    bodyStyle.position = 'fixed'
    bodyStyle.top = `-${scrollY}px`
    bodyStyle.width = '100%'

    return () => {
      delete document.body.dataset.mobileMenuOpen
      window.dispatchEvent(
        new CustomEvent('mobile-navigation-toggle', {
          detail: { isOpen: false },
        }),
      )
      htmlStyle.overflow = previousHtmlOverflow
      bodyStyle.overflow = previousBodyOverflow
      bodyStyle.position = previousBodyPosition
      bodyStyle.top = previousBodyTop
      bodyStyle.width = previousBodyWidth
      window.scrollTo(0, scrollY)
    }
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
              className="fixed inset-0 z-60 bg-neutral-900/60 backdrop-blur-xs"
              onClick={close}
              aria-hidden="true"
            />
            <div className="fixed inset-x-4 top-4 z-70 overflow-hidden rounded-sm bg-white shadow-2xl ring-1 ring-neutral-200 dark:bg-neutral-950 dark:ring-neutral-800">
              <div className="flex h-6 items-center justify-between border-b border-neutral-200 bg-neutral-50/80 px-4 dark:border-neutral-800 dark:bg-neutral-900">
                <span className="font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
                  ~/navigation
                </span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="-mr-2 inline-flex h-6 w-6 items-center justify-center rounded-sm transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  <CloseIcon className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                </button>
              </div>

              <nav className="p-3">
                <ul className="space-y-1">
                  {navItems.map((item) => {
                    const parentActive = hasActiveChild(item.children, pathname)
                    return (
                      <li key={item.href} className="space-y-1">
                        <ul className="space-y-1">
                          <MobileNavItem
                            href={item.href}
                            label={item.label}
                            isActive={pathname === item.href}
                            isParentActive={parentActive}
                            close={close}
                          />
                          {parentActive &&
                            item.children?.map((child) => (
                              <MobileSubNavItem
                                key={child.href}
                                href={child.href}
                                label={child.label}
                                isActive={pathname === child.href}
                                close={close}
                              />
                            ))}
                        </ul>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
