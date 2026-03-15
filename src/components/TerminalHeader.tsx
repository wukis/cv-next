import { type ElementType } from 'react'

type TerminalPromptProps = {
  command: string
  argument?: string
  as?: ElementType
  className?: string
}

export function TerminalPrompt({
  command,
  argument,
  as: Component = 'p',
  className,
}: TerminalPromptProps) {
  return (
    <Component className={className}>
      <span className="inline-flex max-w-full items-stretch overflow-hidden rounded-lg border border-neutral-200/80 bg-white/80 align-middle shadow-sm shadow-neutral-800/5 dark:border-neutral-700 dark:bg-neutral-900/75">
        <span className="flex items-center gap-1.5 border-r border-neutral-200 bg-neutral-100 px-2 py-1 text-emerald-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-emerald-300 sm:gap-2 sm:px-3 sm:py-2">
          <span className="font-mono text-[0.56em] leading-none sm:text-[0.72em]">
            &gt;
          </span>
          <span className="h-[0.56em] w-0.5 rounded-[1px] bg-current opacity-70 sm:h-[0.72em] sm:w-1" />
        </span>
        <span className="flex min-w-0 items-center px-2.5 py-1.5 sm:px-3 sm:py-2">
          <span className="block min-w-0 font-mono font-semibold leading-tight tracking-tight text-neutral-800 dark:text-neutral-100">
            {command}
            {argument ? (
              <>
                {' '}
                <span className="font-normal break-words text-neutral-500 dark:text-neutral-400">
                  {argument}
                </span>
              </>
            ) : null}
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
}

export function TerminalPageHeader({
  command,
  argument,
  description,
  eyebrow,
  as = 'h1',
}: TerminalPageHeaderProps) {
  return (
    <div className="mb-8 sm:mb-10">
      {eyebrow ? (
        <div className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400 sm:mb-4 sm:text-[11px] sm:tracking-[0.2em]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          {eyebrow}
        </div>
      ) : null}
      <TerminalPrompt
        as={as}
        command={command}
        argument={argument}
        className="text-lg font-semibold tracking-tight sm:text-4xl sm:font-bold lg:text-5xl"
      />
      <p className="mt-2 font-mono text-xs text-neutral-600 dark:text-neutral-400 sm:mt-3 sm:text-lg">
        <span className="text-neutral-500 dark:text-neutral-400"># </span>
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
}

export function TerminalSectionHeader({
  command,
  argument,
  description,
  as = 'h2',
}: TerminalSectionHeaderProps) {
  return (
    <div className="mb-6">
      <TerminalPrompt
        as={as}
        command={command}
        argument={argument}
        className="text-base font-semibold tracking-tight sm:text-xl sm:font-bold"
      />
      {description ? (
        <p className="mt-2 font-mono text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
          <span className="text-neutral-500 dark:text-neutral-400"># </span>
          {description}
        </p>
      ) : null}
    </div>
  )
}
