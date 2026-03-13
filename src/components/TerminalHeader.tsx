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
        <span className="flex items-center gap-2 border-r border-neutral-200 bg-neutral-100 px-3 py-2 text-emerald-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-emerald-300">
          <span className="font-mono text-[0.72em] leading-none">&gt;</span>
          <span className="h-[0.72em] w-1 rounded-[1px] bg-current opacity-70" />
        </span>
        <span className="flex min-w-0 items-center px-3 py-2">
          <span className="min-w-0 font-mono font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">
            {command}
            {argument ? (
              <>
                {' '}
                <span className="font-normal text-neutral-500 dark:text-neutral-400">
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
    <div className="mb-10">
      {eyebrow ? (
        <div className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          {eyebrow}
        </div>
      ) : null}
      <TerminalPrompt
        as={as}
        command={command}
        argument={argument}
        className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
      />
      <p className="mt-3 font-mono text-lg text-neutral-600 dark:text-neutral-400">
        <span className="text-neutral-500 dark:text-neutral-400"># </span>
        {description}
      </p>
    </div>
  )
}
