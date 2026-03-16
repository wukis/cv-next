import clsx from 'clsx'

import { recommendationsCopy } from '@/lib/recommendationsCopy'

export const navItems = [
  { href: '/', label: 'home' },
  { href: '/about', label: 'about' },
  { href: '/experience', label: 'experience' },
  { href: '/recommendations', label: recommendationsCopy.navLabel },
]

export const headerControlClassName =
  'group inline-flex min-h-11 items-center justify-center rounded-lg bg-white/90 text-neutral-800 shadow-lg shadow-neutral-800/5 ring-1 ring-neutral-300/70 backdrop-blur-sm transition-colors hover:text-emerald-800 hover:ring-emerald-400/50 dark:bg-neutral-800/90 dark:text-neutral-200 dark:ring-neutral-700/70 dark:hover:text-emerald-200 dark:hover:ring-emerald-400/50'

export const animationFocusButtonClassName =
  'group inline-flex min-h-11 items-center justify-center rounded-lg bg-white/90 text-neutral-800 shadow-lg shadow-neutral-800/5 ring-1 ring-neutral-300/70 backdrop-blur-sm transition-[color,box-shadow,ring-color] duration-200 hover:text-emerald-800 hover:shadow-lg hover:ring-emerald-400/50 dark:bg-neutral-800/90 dark:text-neutral-200 dark:ring-neutral-700/70 dark:hover:text-emerald-200 dark:hover:ring-emerald-400/50'

export function DesktopTooltip({
  align = 'center',
  label,
  description,
  panelClassName,
  children,
}: {
  align?: 'left' | 'center' | 'right'
  label: string
  description: string
  panelClassName?: string
  children: React.ReactNode
}) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute top-full z-30 mt-3 hidden md:block',
          align === 'left' && 'left-0',
          align === 'center' && 'left-1/2 -translate-x-1/2',
          align === 'right' && 'right-0',
        )}
      >
        <span
          className={clsx(
            'flex max-w-64 min-w-44 flex-col gap-1 rounded-xl border border-emerald-500/15 bg-white/95 px-3 py-2 text-left shadow-xl ring-1 shadow-neutral-900/10 ring-neutral-200/60 backdrop-blur-md transition-all duration-200 ease-out dark:border-emerald-400/15 dark:bg-neutral-900/95 dark:ring-neutral-700/70',
            'translate-y-1 scale-[0.98] opacity-0 group-hover/tooltip:translate-y-0 group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100',
            align === 'left' && 'origin-top-left',
            align === 'center' && 'origin-top',
            align === 'right' && 'origin-top-right',
            panelClassName,
          )}
        >
          <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-emerald-700 uppercase dark:text-emerald-300">
            {label}
          </span>
          <span className="text-xs leading-5 text-neutral-600 dark:text-neutral-300">
            {description}
          </span>
        </span>
      </span>
    </span>
  )
}

export function TerminalPromptIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M7 15l5-5-5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 19h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-pulse"
      />
    </svg>
  )
}

export function CloseIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="m17.25 6.75-10.5 10.5M6.75 6.75l10.5 10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function HexagonNetworkIcon(
  props: React.ComponentPropsWithoutRef<'svg'>,
) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3L17.196 6V12L12 15L6.804 12V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="3" r="1.2" fill="currentColor" />
      <circle cx="17.196" cy="6" r="1.2" fill="currentColor" />
      <circle cx="17.196" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" />
      <circle cx="6.804" cy="12" r="1.2" fill="currentColor" />
      <circle cx="6.804" cy="6" r="1.2" fill="currentColor" />
      <path
        d="M12 15V19M6.804 12L3 14M17.196 12L21 14"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="2 2"
        className="opacity-60"
      />
      <circle
        cx="12"
        cy="20"
        r="1"
        fill="currentColor"
        className="opacity-60"
      />
      <circle
        cx="2.5"
        cy="14.5"
        r="1"
        fill="currentColor"
        className="opacity-60"
      />
      <circle
        cx="21.5"
        cy="14.5"
        r="1"
        fill="currentColor"
        className="opacity-60"
      />
    </svg>
  )
}
