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
      <span className="font-mono text-emerald-600 dark:text-emerald-400">
        &gt;
      </span>{' '}
      {command}
      {argument ? (
        <>
          {' '}
          <span className="text-neutral-500 dark:text-neutral-400">
            {argument}
          </span>
        </>
      ) : null}
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
        className="text-3xl font-bold tracking-tight text-neutral-800 sm:text-4xl lg:text-5xl dark:text-neutral-100"
      />
      <p className="mt-3 font-mono text-lg text-neutral-600 dark:text-neutral-400">
        <span className="text-neutral-500 dark:text-neutral-400"># </span>
        {description}
      </p>
    </div>
  )
}
