import clsx from 'clsx'

import { recommendationsCopy } from '@/lib/recommendationsCopy'

export type NavChild = { href: string; label: string }
export type NavItem = {
  href: string
  label: string
  children?: NavChild[]
}

export const navItems: NavItem[] = [
  { href: '/', label: 'home' },
  {
    href: '/about',
    label: 'about',
    children: [{ href: '/cv', label: 'cv' }],
  },
  { href: '/experience', label: 'experience' },
  { href: '/recommendations', label: recommendationsCopy.navLabel },
]

export const headerControlClassName =
  'group inline-flex min-h-11 items-center justify-center rounded-sm bg-white/95 text-neutral-800 shadow-lg shadow-neutral-800/5 ring-1 ring-neutral-300/70 backdrop-blur-sm transition-colors hover:text-emerald-700 hover:ring-emerald-500/40 dark:bg-neutral-900/95 dark:text-neutral-200 dark:ring-neutral-700/70 dark:hover:text-emerald-300 dark:hover:ring-emerald-400/40'

export const animationFocusButtonClassName =
  'group inline-flex min-h-11 items-center justify-center rounded-sm bg-white/95 text-neutral-800 shadow-lg shadow-neutral-800/5 ring-1 ring-neutral-300/70 backdrop-blur-sm transition-[color,box-shadow,ring-color] duration-200 hover:text-emerald-700 hover:shadow-lg hover:ring-emerald-500/40 dark:bg-neutral-900/95 dark:text-neutral-200 dark:ring-neutral-700/70 dark:hover:text-emerald-300 dark:hover:ring-emerald-400/40'

export function DesktopTooltip({
  align = 'center',
  label,
  description,
  panelClassName,
  isSuppressed = false,
  expiryDurationMs,
  expiryKey,
  children,
}: {
  align?: 'left' | 'center' | 'right'
  label: string
  description: string
  panelClassName?: string
  isSuppressed?: boolean
  expiryDurationMs?: number
  expiryKey?: number
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
            'flex max-w-64 min-w-44 flex-col gap-1 rounded-sm border border-emerald-500/15 bg-white/95 px-3 py-2 text-left shadow-xl ring-1 shadow-neutral-900/10 ring-neutral-200/60 backdrop-blur-md transition-all duration-200 ease-out dark:border-emerald-400/15 dark:bg-neutral-950/95 dark:ring-neutral-700/70',
            'translate-y-1 scale-[0.98] opacity-0 group-hover/tooltip:translate-y-0 group-hover/tooltip:scale-100',
            isSuppressed
              ? 'group-hover/tooltip:pointer-events-none group-hover/tooltip:opacity-0'
              : 'group-hover/tooltip:opacity-100',
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
          {expiryDurationMs != null && (
            <span
              key={expiryKey}
              className="mt-1 h-px bg-emerald-500/40 dark:bg-emerald-400/40"
              style={{
                animation: `tooltip-expiry-shrink ${expiryDurationMs}ms linear forwards`,
              }}
            />
          )}
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
        className="animate-terminal-caret-slow"
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

const HEX_ICON_CX = 12
const HEX_ICON_CY = 12
const HEX_ICON_ORBIT_R = 9.5
const HEX_ICON_SAT_R = 2.8
const HEX_ICON_ORBIT_DUR = '3s'

function hexPoints(x: number, y: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2
    return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`
  }).join(' ')
}

const SATELLITE_POINTS = hexPoints(
  HEX_ICON_CX,
  HEX_ICON_CY - HEX_ICON_ORBIT_R,
  HEX_ICON_SAT_R,
)

export function HexagonNetworkIcon({
  orbitActive,
  ...props
}: React.ComponentPropsWithoutRef<'svg'> & {
  orbitActive?: boolean
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      {/* Central hexagon */}
      <polygon
        points={hexPoints(HEX_ICON_CX, HEX_ICON_CY, 5.5)}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Orbiting satellite hexagons */}
      {[0, 1, 2].map((i) => {
        const startAngle = i * 120
        return (
          <g key={i}>
            {orbitActive ? (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`${startAngle} ${HEX_ICON_CX} ${HEX_ICON_CY}`}
                to={`${startAngle + 360} ${HEX_ICON_CX} ${HEX_ICON_CY}`}
                dur={HEX_ICON_ORBIT_DUR}
                repeatCount="2"
                fill="freeze"
              />
            ) : (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`${startAngle} ${HEX_ICON_CX} ${HEX_ICON_CY}`}
                to={`${startAngle} ${HEX_ICON_CX} ${HEX_ICON_CY}`}
                dur="0.01s"
                fill="freeze"
              />
            )}
            <polygon
              points={SATELLITE_POINTS}
              fill="currentColor"
              opacity={0.7}
            />
          </g>
        )
      })}
    </svg>
  )
}
