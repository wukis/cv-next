'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { RecommendationInterface } from '@/lib/recommendations'
import { recommendationsCopy } from '@/lib/recommendationsCopy'

const recommendationAccent = {
  hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
  quote: 'text-amber-600 dark:text-amber-400',
  ring: 'ring-emerald-500/40 dark:ring-emerald-400/40',
}

function SortIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 4v12m0 0-2.5-2.5M6 16l2.5-2.5M14 16V4m0 0-2.5 2.5M14 4l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Recommendation({
  recommendation,
  isHighlighted,
}: {
  recommendation: RecommendationInterface
  isHighlighted: boolean
}) {
  return (
    <article id={recommendation.slug} className="scroll-mt-20">
      <div
        className={`relative overflow-hidden rounded-xl border border-neutral-200 bg-white/85 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-900/85 ${recommendationAccent.hoverBorder} ${
          isHighlighted
            ? `dark:bg-emerald-950/28 scale-[1.02] border-emerald-400 bg-emerald-50/85 shadow-xl shadow-emerald-500/15 ring-4 ring-emerald-300/65 dark:border-emerald-600 dark:ring-emerald-700/55`
            : ''
        }`}
      >
        {/* Terminal header */}
        <div
          className={`flex h-6 items-center gap-2 border-b px-4 ${
            isHighlighted
              ? 'border-emerald-300 bg-emerald-100/80 dark:border-emerald-800 dark:bg-emerald-950/60'
              : 'border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800'
          }`}
        >
          <span className="truncate font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
            ~/{recommendationsCopy.directoryName}/{recommendation.slug}.md
          </span>
        </div>

        <div className="p-5">
          {/* Quote */}
          <blockquote className="relative mb-4">
            <span
              className={`absolute -left-1 -top-1 font-serif text-3xl ${recommendationAccent.quote} opacity-40`}
            >
              &ldquo;
            </span>
            <p
              className={`pl-4 pr-2 text-sm leading-relaxed ${
                isHighlighted
                  ? 'font-medium text-neutral-900 dark:text-neutral-50'
                  : 'text-neutral-700 dark:text-neutral-200'
              }`}
            >
              {recommendation.body}
            </p>
          </blockquote>

          {/* Author info */}
          <div
            className={`flex items-center gap-3 border-t pt-4 ${
              isHighlighted
                ? 'border-emerald-300 dark:border-emerald-800'
                : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Image
              className={`h-10 w-10 flex-shrink-0 rounded-lg object-cover ring-2 ${
                isHighlighted
                  ? 'ring-emerald-300 dark:ring-emerald-700'
                  : 'ring-white dark:ring-neutral-800'
              }`}
              width={40}
              height={40}
              src={
                require(`@/images/recommendations/${recommendation.image}`)
                  .default
              }
              alt={recommendation.fullName}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                {recommendation.fullName}
              </h3>
              <p className="truncate text-xs text-neutral-700 dark:text-neutral-200">
                {recommendation.position}
              </p>
              <p className="text-[10px] text-neutral-600 dark:text-neutral-300">
                {recommendation.date}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export function RecommendationsWall({
  recommendations,
  allowSorting = false,
  headerLabel,
}: {
  recommendations: RecommendationInterface[]
  allowSorting?: boolean
  headerLabel?: string
}) {
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<'natural' | 'recent'>('natural')
  const autoScrollUntilRef = useRef(0)
  const interactionUnlockAtRef = useRef(0)

  const clearHighlight = () => {
    if (Date.now() <= interactionUnlockAtRef.current) return

    setHighlightedSlug(null)

    if (!window.location.hash) return

    const url = new URL(window.location.href)
    url.hash = ''
    window.history.replaceState(window.history.state, '', url)
  }

  useEffect(() => {
    if (highlightedSlug) {
      interactionUnlockAtRef.current = Date.now() + 500
      autoScrollUntilRef.current = Date.now() + 2000

      // Scroll to the element after a brief delay to ensure render
      const timer = window.setTimeout(() => {
        const element = document.getElementById(highlightedSlug)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)

      return () => window.clearTimeout(timer)
    }
  }, [highlightedSlug])

  useEffect(() => {
    if (!highlightedSlug) return

    const clearHighlightOnScroll = () => {
      if (Date.now() <= autoScrollUntilRef.current) return
      clearHighlight()
    }

    window.addEventListener('pointerdown', clearHighlight)
    window.addEventListener('click', clearHighlight)
    window.addEventListener('wheel', clearHighlight, { passive: true })
    window.addEventListener('touchmove', clearHighlight, { passive: true })
    window.addEventListener('keydown', clearHighlight)
    window.addEventListener('scroll', clearHighlightOnScroll, {
      passive: true,
    })

    return () => {
      window.removeEventListener('pointerdown', clearHighlight)
      window.removeEventListener('click', clearHighlight)
      window.removeEventListener('wheel', clearHighlight)
      window.removeEventListener('touchmove', clearHighlight)
      window.removeEventListener('keydown', clearHighlight)
      window.removeEventListener('scroll', clearHighlightOnScroll)
    }
  }, [highlightedSlug])

  useEffect(() => {
    const syncHighlightFromHash = () => {
      setHighlightedSlug(window.location.hash.slice(1) || null)
    }

    const timer = window.setTimeout(syncHighlightFromHash, 0)
    window.addEventListener('hashchange', syncHighlightFromHash)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('hashchange', syncHighlightFromHash)
    }
  }, [])

  const displayedRecommendations =
    sortMode === 'recent'
      ? [...recommendations].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
      : recommendations

  const featured: RecommendationInterface[] = []
  const long: RecommendationInterface[] = []
  const regular: RecommendationInterface[] = []

  displayedRecommendations.forEach((recommendation) => {
    if (recommendation.body.length > 1500) {
      featured.push(recommendation)
    } else if (recommendation.body.length > 700) {
      long.push(recommendation)
    } else {
      regular.push(recommendation)
    }
  })

  const headingId = 'recommendations-wall-heading'
  const headingLabel = headerLabel ?? 'Recommendations'

  return (
    <section className="space-y-6" aria-labelledby={headingId}>
      {allowSorting || headerLabel ? (
        <div className="flex items-center justify-between gap-3">
          <h2
            id={headingId}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-300"
          >
            {headingLabel}
          </h2>
          {allowSorting ? (
            <button
              type="button"
              onClick={() => {
                setSortMode((current) =>
                  current === 'recent' ? 'natural' : 'recent',
                )
              }}
              className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs transition-all sm:inline-flex ${
                sortMode === 'recent'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'border-neutral-200 text-neutral-500 hover:border-emerald-300 hover:bg-emerald-50/70 hover:text-emerald-700 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300'
              }`}
              aria-pressed={sortMode === 'recent'}
            >
              <SortIcon
                className={`h-3.5 w-3.5 transition-transform ${
                  sortMode === 'recent' ? 'rotate-180' : ''
                }`}
              />
              most recent
            </button>
          ) : null}
        </div>
      ) : (
        <h2 id={headingId} className="sr-only">
          {headingLabel}
        </h2>
      )}

      {sortMode === 'recent' ? (
        <div className="space-y-4">
          {displayedRecommendations.map((recommendation) => (
            <Recommendation
              key={recommendation.slug}
              recommendation={recommendation}
              isHighlighted={highlightedSlug === recommendation.slug}
            />
          ))}
        </div>
      ) : (
        <>
          {featured.map((recommendation) => (
            <Recommendation
              key={recommendation.slug}
              recommendation={recommendation}
              isHighlighted={highlightedSlug === recommendation.slug}
            />
          ))}
          {long.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {long.map((recommendation) => (
                <Recommendation
                  key={recommendation.slug}
                  recommendation={recommendation}
                  isHighlighted={highlightedSlug === recommendation.slug}
                />
              ))}
            </div>
          ) : null}
          {regular.length > 0 ? (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {regular.map((recommendation) => (
                <div
                  key={recommendation.slug}
                  className="mb-4 break-inside-avoid"
                >
                  <Recommendation
                    recommendation={recommendation}
                    isHighlighted={highlightedSlug === recommendation.slug}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
