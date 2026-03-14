import clsx from 'clsx'

export function FileCard({
  fileLabel,
  headerMeta,
  className,
  children,
}: {
  fileLabel: string
  headerMeta?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={clsx(
        'overflow-hidden rounded-lg border border-neutral-200 bg-white/90 dark:border-neutral-700 dark:bg-neutral-900/90',
        className,
      )}
    >
      <div className="flex h-6 items-center justify-between gap-2 border-b border-neutral-300 bg-neutral-100 px-4 dark:border-neutral-700 dark:bg-neutral-800">
        <span className="truncate font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
          {fileLabel}
        </span>
        {headerMeta ? (
          <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {headerMeta}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  )
}
