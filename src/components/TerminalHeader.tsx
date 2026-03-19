import { type ElementType, Fragment } from 'react'

import { AnimatedTerminalText } from '@/components/AnimatedTerminalText'

type TerminalPromptProps = {
  command: string
  argument?: string
  as?: ElementType
  className?: string
  animateOnFirstView?: boolean
}

type TerminalTextSegment = {
  text: string
  className?: string
}

function getArgumentTokenClassName(token: string) {
  if (token.startsWith('--')) {
    return 'font-medium text-amber-800 dark:text-amber-200'
  }

  if (token.includes('/') || /\.[a-z0-9]+$/i.test(token)) {
    return 'font-medium text-stone-700 dark:text-stone-300'
  }

  return 'text-neutral-600 dark:text-neutral-300'
}

function getArgumentSegments(argument: string): TerminalTextSegment[] {
  return argument.split(/(\s+)/).map((token) => {
    if (token.trim().length === 0) {
      return {
        text: token,
        className: 'font-normal',
      }
    }

    return {
      text: token,
      className: `font-normal ${getArgumentTokenClassName(token)}`,
    }
  })
}

function getPromptSegments(
  command: string,
  argument?: string,
): TerminalTextSegment[] {
  if (!argument) {
    return [
      {
        text: command,
        className: 'text-neutral-900 dark:text-neutral-50',
      },
    ]
  }

  return [
    {
      text: command,
      className: 'text-neutral-900 dark:text-neutral-50',
    },
    {
      text: ' ',
      className: 'font-normal',
    },
    ...getArgumentSegments(argument),
  ]
}

function renderSegments(segments: TerminalTextSegment[]) {
  return segments.map((segment, index) => {
    if (segment.text.trim().length === 0) {
      return <Fragment key={`segment-${index}`}>{segment.text}</Fragment>
    }

    return (
      <span key={`segment-${index}`} className={segment.className}>
        {segment.text}
      </span>
    )
  })
}

function TerminalPrompt({
  command,
  argument,
  as: Component = 'p',
  className,
  animateOnFirstView = false,
}: TerminalPromptProps) {
  const segments = getPromptSegments(command, argument)

  return (
    <Component className={className}>
      <span className="inline-flex max-w-full items-stretch overflow-hidden rounded-sm border border-neutral-200/80 bg-white/90 align-middle shadow-xs shadow-neutral-800/5 dark:border-neutral-800 dark:bg-neutral-950/80">
        <span className="flex items-center gap-1.5 border-r border-neutral-200 bg-neutral-50/80 px-2 py-1 text-emerald-700 sm:gap-2 sm:px-3 sm:py-2 dark:border-neutral-800 dark:bg-neutral-950 dark:text-emerald-300">
          <span className="font-mono text-[0.56em] leading-none sm:text-[0.72em]">
            &gt;
          </span>
          <span className="h-[0.56em] w-0.5 rounded-[1px] bg-current opacity-70 sm:h-[0.72em] sm:w-1" />
        </span>
        <span className="flex min-w-0 items-center px-2.5 py-1.5 sm:px-3 sm:py-2">
          <span className="block min-w-0 font-mono leading-tight font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">
            {animateOnFirstView ? (
              <AnimatedTerminalText segments={segments} />
            ) : (
              renderSegments(segments)
            )}
          </span>
        </span>
      </span>
    </Component>
  )
}

type TerminalPageHeaderProps = {
  command: string
  argument?: string
  description: string
  eyebrow?: string
  as?: 'h1' | 'h2'
  animateOnFirstView?: boolean
}

export function TerminalPageHeader({
  command,
  argument,
  description,
  eyebrow,
  as = 'h1',
  animateOnFirstView = true,
}: TerminalPageHeaderProps) {
  return (
    <div className="mb-8 sm:mb-10">
      {eyebrow ? (
        <div className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-neutral-600 uppercase sm:mb-4 sm:text-[11px] sm:tracking-[0.2em] dark:text-neutral-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          {eyebrow}
        </div>
      ) : null}
      <TerminalPrompt
        as={as}
        command={command}
        {...(argument ? { argument } : {})}
        animateOnFirstView={animateOnFirstView}
        className="text-lg font-semibold tracking-tight sm:text-4xl sm:font-bold lg:text-5xl"
      />
      <p className="mt-2 font-mono text-xs text-neutral-700 sm:mt-3 sm:text-lg dark:text-neutral-300">
        <span className="text-neutral-600 dark:text-neutral-300"># </span>
        {description}
      </p>
    </div>
  )
}

type TerminalSectionHeaderProps = {
  command: string
  argument?: string
  description?: string
  as?: 'h2' | 'h3'
  animateOnFirstView?: boolean
}

export function TerminalSectionHeader({
  command,
  argument,
  description,
  as = 'h2',
  animateOnFirstView = true,
}: TerminalSectionHeaderProps) {
  return (
    <div className="mb-6">
      <TerminalPrompt
        as={as}
        command={command}
        {...(argument ? { argument } : {})}
        animateOnFirstView={animateOnFirstView}
        className="text-base font-semibold tracking-tight sm:text-xl sm:font-bold"
      />
      {description ? (
        <p className="mt-2 font-mono text-xs text-neutral-700 sm:text-sm dark:text-neutral-300">
          <span className="text-neutral-600 dark:text-neutral-300"># </span>
          {description}
        </p>
      ) : null}
    </div>
  )
}
