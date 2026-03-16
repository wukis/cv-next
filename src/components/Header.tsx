import Link from 'next/link'

import { AnimationPreviewButton } from '@/components/AnimationPreviewButton'
import { DownloadIcon } from '@/components/Button'
import { Container } from '@/components/Container'
import { HeaderNavLink } from '@/components/HeaderNavLink'
import {
  DesktopTooltip,
  headerControlClassName,
  navItems,
  TerminalPromptIcon,
} from '@/components/HeaderShared'
import { HeaderVisibility } from '@/components/HeaderVisibility'
import { MobileNavigation } from '@/components/MobileNavigation'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'

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
                <TerminalPromptIcon className="h-4 w-4 text-emerald-500" />
              </Link>
            </DesktopTooltip>
          </li>
          {navItems.map((item) => (
            <HeaderNavLink
              key={item.href}
              href={item.href}
              label={item.label}
            />
          ))}
        </ul>
      </div>
    </nav>
  )
}

function CvDownloadButton() {
  return (
    <DesktopTooltip
      label="Download CV"
      description="Save the latest PDF version of the resume."
      align="right"
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

export function Header() {
  return (
    <header className="pointer-events-none relative z-50 flex-none">
      <div className="h-[5.5rem]" />
      <div className="fixed inset-x-0 top-0 z-50 pt-6">
        <Container>
          <HeaderVisibility>
            <div className="flex items-start gap-4">
              <div className="flex flex-1">
                <MobileNavigation className="pointer-events-auto md:hidden" />
                <DesktopNavigation className="pointer-events-auto hidden md:block" />
              </div>
              <div className="flex justify-end md:flex-1">
                <div className="pointer-events-auto flex items-center gap-2">
                  <CvDownloadButton />
                  <AnimationPreviewButton />
                  <ThemeToggleButton />
                </div>
              </div>
            </div>
          </HeaderVisibility>
        </Container>
      </div>
    </header>
  )
}
