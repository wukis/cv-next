'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { TerminalPromptIcon } from '@/components/HeaderShared'

export default function HeaderNavLink({
  href,
  label,
}: {
  href: string
  label: string
}) {
  const isActive = usePathname() === href

  return (
    <li>
      <Link
        href={href}
        className={clsx(
          'relative inline-flex min-h-11 items-center gap-1.5 rounded-sm px-4 py-2 font-mono text-sm font-medium transition-all',
          isActive
            ? 'bg-emerald-500/10 text-emerald-800 shadow-[inset_0_-2px_0_0] shadow-emerald-500/50 dark:bg-emerald-400/10 dark:text-emerald-200 dark:shadow-emerald-400/40'
            : 'text-neutral-800 hover:bg-neutral-100 hover:text-emerald-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-emerald-300',
        )}
      >
        {isActive ? (
          <TerminalPromptIcon className="h-3.5 w-3.5 text-emerald-500" />
        ) : null}
        {label}
      </Link>
    </li>
  )
}
