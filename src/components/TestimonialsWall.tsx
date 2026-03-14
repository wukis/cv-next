'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { RecommendationInterface } from '@/lib/recommendations'
import { recommendationsCopy } from '@/lib/recommendationsCopy'

const testimonialAccent = {
  hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
  quote: 'text-amber-600 dark:text-amber-400',
  ring: 'ring-emerald-500/40 dark:ring-emerald-400/40',
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
        className={`relative overflow-hidden rounded-xl border border-neutral-200 bg-white/85 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-900/85 ${testimonialAccent.hoverBorder} ${
          isHighlighted
            ? `ring-2 ${testimonialAccent.ring} scale-[1.02] shadow-lg`
            : ''
        }`}
      >
        {/* Terminal header */}
        <div className="flex h-6 items-center gap-2 border-b border-neutral-300 bg-neutral-100 px-4 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="truncate font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
            ~/{recommendationsCopy.directoryName}/{recommendation.slug}.md
          </span>
        </div>

        <div className="p-5">
          {/* Quote */}
          <blockquote className="relative mb-4">
            <span
              className={`absolute -left-1 -top-1 font-serif text-3xl ${testimonialAccent.quote} opacity-40`}
            >
              &ldquo;
            </span>
            <p className="pl-4 pr-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
              {recommendation.body}
            </p>
          </blockquote>

          {/* Author info */}
          <div className="flex items-center gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <Image
              className="h-10 w-10 flex-shrink-0 rounded-lg object-cover ring-2 ring-white dark:ring-neutral-800"
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

export function TestimonialsWall({
  recommendations,
  allowSorting = false,
  headerLabel,
}: {
  recommendations: RecommendationInterface[]
  allowSorting?: boolean
  headerLabel?: string
}) {
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : window.location.hash.slice(1) || null,
  )
  const [sortMode, setSortMode] = useState<'natural' | 'recent'>('natural')

  useEffect(() => {
    if (highlightedSlug) {
      // Scroll to the element after a brief delay to ensure render
      setTimeout(() => {
        const element = document.getElementById(highlightedSlug)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)

      // Remove highlight after animation
      const timer = setTimeout(() => {
        setHighlightedSlug(null)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [highlightedSlug])

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setHighlightedSlug(window.location.hash.slice(1) || null)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
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

  return (
    <div className="space-y-6">
      {allowSorting || headerLabel ? (
        <div className="flex items-center justify-between gap-3">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
            {headerLabel}
          </div>
          {allowSorting ? (
            <button
              type="button"
              onClick={() => {
                setSortMode((current) =>
                  current === 'recent' ? 'natural' : 'recent',
                )
              }}
              className={`font-mono text-xs transition-colors ${
                sortMode === 'recent'
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-neutral-500 hover:text-emerald-700 dark:text-neutral-400 dark:hover:text-emerald-300'
              }`}
              aria-pressed={sortMode === 'recent'}
            >
              most recent
            </button>
          ) : null}
        </div>
      ) : null}

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
    </div>
  )
}
