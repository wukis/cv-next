import AnimationPreviewButton from '@/components/AnimationPreviewButton'
import { Container } from '@/components/Container'
import CvDownloadButton from '@/components/CvDownloadButton'
import HeaderNavLink from '@/components/HeaderNavLink'
import { navItems } from '@/components/HeaderShared'
import HeaderVisibility from '@/components/HeaderVisibility'
import MobileNavigation from '@/components/MobileNavigation'
import ThemeToggleButton from '@/components/ThemeToggleButton'

function DesktopNavigation(props: React.ComponentPropsWithoutRef<'nav'>) {
  return (
    <nav {...props}>
      <div className="flex items-center rounded-sm bg-white/95 shadow-lg ring-1 shadow-neutral-800/5 ring-neutral-300/70 backdrop-blur-sm dark:bg-neutral-900/95 dark:ring-neutral-700/70">
        <ul className="flex items-center gap-1 px-2 py-1">
          {navItems.map((item) => (
            <HeaderNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              {...(item.children ? { children: item.children } : {})}
            />
          ))}
        </ul>
      </div>
    </nav>
  )
}

export function Header() {
  return (
    <header className="pointer-events-none relative z-50 flex-none">
      <div className="h-22" />
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
