import Link from 'next/link'

import { ContainerInner, ContainerOuter } from '@/components/Container'

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
      className="text-neutral-600 transition-colors hover:text-blue-500 dark:text-neutral-400 dark:hover:text-blue-400"
    >
      {children}
    </Link>
  )
}

export function Footer() {
  return (
    <footer className="mt-16 sm:mt-24 flex-none">
      <ContainerOuter>
        <div className="border-t border-neutral-200/80 pb-12 pt-8 dark:border-neutral-700/50">
          <ContainerInner>
            <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
              <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/about">About</NavLink>
                <NavLink href="/experience">Experience</NavLink>
                <NavLink href="/recommendations">Recommendations</NavLink>
              </nav>
              <p className="text-sm text-neutral-500 dark:text-neutral-500">
                &copy; {new Date().getFullYear()} Jonas Petrik. All rights reserved.
              </p>
            </div>
          </ContainerInner>
        </div>
      </ContainerOuter>
    </footer>
  )
}
