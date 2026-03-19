'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { type NavChild, TerminalPromptIcon } from '@/components/HeaderShared'

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
          'relative inline-flex min-h-11 items-center gap-1.5 rounded-sm px-4 py-2 font-mono text-sm font-medium transition-all',
          isActive
            ? 'bg-emerald-500/10 text-emerald-800 shadow-[inset_0_-2px_0_0] shadow-emerald-500/50 dark:bg-emerald-400/10 dark:text-emerald-200 dark:shadow-emerald-400/40'
            : isParentActive
              ? 'text-neutral-800 shadow-[inset_0_-2px_0_0] shadow-emerald-500/50 dark:text-neutral-200 dark:shadow-emerald-400/40'
              : 'text-neutral-800 hover:bg-neutral-100 hover:text-emerald-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-emerald-300',
        )}
      >
        {isActive ? (
          <TerminalPromptIcon className="h-3.5 w-3.5 text-emerald-500" />
        ) : null}
        {label}
      </Link>

      {activeChild && (
        <div className="absolute top-full left-1 z-10 mt-1">
          <Link
            href={activeChild.href}
            className="flex items-center gap-1 rounded-sm bg-white/95 px-2 py-0.5 font-mono text-xs font-medium whitespace-nowrap text-emerald-600 shadow-[inset_0_-1.5px_0_0_rgba(16,185,129,0.5),0_4px_6px_-1px_rgba(0,0,0,0.05)] ring-1 ring-emerald-500/25 backdrop-blur-sm transition-all dark:bg-neutral-900/95 dark:text-emerald-400 dark:shadow-[inset_0_-1.5px_0_0_rgba(52,211,153,0.4),0_4px_6px_-1px_rgba(0,0,0,0.2)] dark:ring-emerald-400/25"
          >
            <span className="text-emerald-500/60 dark:text-emerald-400/50">
              └─
            </span>
            <TerminalPromptIcon className="h-2.5 w-2.5 text-emerald-500" />
            {activeChild.label}
          </Link>
        </div>
      )}
    </li>
  )
}
