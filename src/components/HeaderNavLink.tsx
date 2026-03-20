'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { type NavChild } from '@/components/HeaderShared'

export default function HeaderNavLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children?: NavChild[]
}) {
  const pathname = usePathname()
  const isActive = pathname === href
  const activeChild = children?.find((c) => pathname === c.href)
  const isParentActive = !!activeChild

  return (
    <li className="relative">
      <Link
        href={href}
        className={clsx(
          'relative inline-flex min-h-11 items-center gap-1 rounded-sm px-4 py-2 font-mono text-sm font-medium transition-all',
          isActive || isParentActive
            ? 'bg-emerald-500/10 text-emerald-800 shadow-[inset_0_-2px_0_0] shadow-emerald-500/50 dark:bg-emerald-400/10 dark:text-emerald-200 dark:shadow-emerald-400/40'
            : 'text-neutral-800 hover:bg-neutral-100 hover:text-emerald-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-emerald-300',
        )}
      >
        {isActive || isParentActive ? (
          <>
            <span
              aria-hidden="true"
              className="text-emerald-500/70 dark:text-emerald-400/60"
            >
              ~/
            </span>
            <span>{label}</span>
            {activeChild && (
              <>
                <span
                  aria-hidden="true"
                  className="text-emerald-500/70 dark:text-emerald-400/60"
                >
                  /
                </span>
                <span>{activeChild.label}</span>
              </>
            )}
            <span
              aria-hidden="true"
              className="animate-terminal-caret-slow ml-0.5 inline-block h-3.5 w-1.5 bg-emerald-500/80 dark:bg-emerald-400/70"
            />
          </>
        ) : (
          label
        )}
      </Link>
    </li>
  )
}
