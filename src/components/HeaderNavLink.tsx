'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

export function HeaderNavLink({
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
