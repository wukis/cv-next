import Link from 'next/link'

import { ContainerInner, ContainerOuter } from '@/components/Container'
import { CurrentYear } from '@/components/CurrentYear'
import { recommendationsCopy } from '@/lib/recommendationsCopy'

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-md px-2 text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-blue-600 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-blue-300"
    >
      {children}
    </Link>
  )
}

export function Footer() {
  return (
    <footer className="mt-16 flex-none sm:mt-24">
      <ContainerOuter>
        <div className="border-t border-neutral-200/80 pt-8 pb-12 dark:border-neutral-700/50">
          <ContainerInner>
            <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
              <nav className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-sm font-medium">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/about">About</NavLink>
                <NavLink href="/experience">Experience</NavLink>
                <NavLink href="/cv">CV</NavLink>
                <NavLink href="/recommendations">
                  {recommendationsCopy.label}
                </NavLink>
              </nav>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                &copy; <CurrentYear /> Jonas Petrik. All rights reserved.
              </p>
            </div>
          </ContainerInner>
        </div>
      </ContainerOuter>
    </footer>
  )
}
