'use client'

import { Children, useMemo, useState } from 'react'

export function TechStackDisclosure({
  children,
  contentId,
  tone,
}: {
  children: React.ReactNode
  contentId: string
  tone: 'default' | 'plain'
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [preview, details] = useMemo(
    () => Children.toArray(children),
    [children],
  )

  return (
    <div className="border-t border-neutral-200 bg-neutral-50/95 dark:border-neutral-800 dark:bg-neutral-900/90">
      <button
        type="button"
        className={`flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-left transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden dark:focus-visible:ring-offset-black ${
          tone === 'plain'
            ? 'hover:bg-neutral-100/50 focus-visible:ring-neutral-400 focus-visible:ring-offset-white dark:hover:bg-neutral-800/30'
            : 'hover:bg-neutral-100/80 focus-visible:ring-emerald-500 focus-visible:ring-offset-white dark:hover:bg-neutral-800/60'
        }`}
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`flex shrink-0 items-center gap-2 ${
              tone === 'plain'
                ? 'text-[11px] text-neutral-600 dark:text-neutral-300'
                : 'font-mono text-xs tracking-wider text-neutral-700 uppercase dark:text-neutral-100'
            }`}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <span className={isExpanded ? 'inline' : 'hidden sm:inline'}>
              Tech Stack
            </span>
          </div>

          {!isExpanded ? preview : null}
        </div>

        <svg
          className={`h-4 w-4 shrink-0 text-neutral-600 transition-transform duration-200 dark:text-neutral-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div
        id={contentId}
        className={`transition-all duration-300 ease-in-out ${
          isExpanded
            ? 'max-h-[1000px] opacity-100'
            : 'max-h-0 overflow-hidden opacity-0'
        }`}
      >
        {details}
      </div>
    </div>
  )
}
