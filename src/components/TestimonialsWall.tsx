'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { RecommendationInterface } from '@/lib/recommendations'

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
          isHighlighted ? `ring-2 ${testimonialAccent.ring} scale-[1.02] shadow-lg` : ''
        }`}
      >
        {/* Terminal header */}
        <div className="flex h-6 items-center gap-2 border-b border-neutral-300 bg-neutral-100 px-4 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="truncate font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
            ~/testimonials/{recommendation.slug}.md
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
}: {
  recommendations: RecommendationInterface[]
}) {
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      setHighlightedSlug(hash)

      // Scroll to the element after a brief delay to ensure render
      setTimeout(() => {
        const element = document.getElementById(hash)
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
  }, [])

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash) {
        setHighlightedSlug(hash)

        setTimeout(() => {
          const element = document.getElementById(hash)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)

        const timer = setTimeout(() => {
          setHighlightedSlug(null)
        }, 3000)

        return () => clearTimeout(timer)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Categorize testimonials by length
  const featured: RecommendationInterface[] = [] // >1500 chars - full width
  const long: RecommendationInterface[] = [] // 700-1500 chars - span 2 columns
  const regular: RecommendationInterface[] = [] // <700 chars - single column masonry

  recommendations.forEach((rec) => {
    if (rec.body.length > 1500) {
      featured.push(rec)
    } else if (rec.body.length > 700) {
      long.push(rec)
    } else {
      regular.push(rec)
    }
  })

  // Sort featured by length (longest first)
  featured.sort((a, b) => b.body.length - a.body.length)

  return (
    <div className="space-y-6">
      {/* Featured testimonials - full width */}
      {featured.map((recommendation) => (
        <Recommendation
          key={recommendation.slug}
          recommendation={recommendation}
          isHighlighted={highlightedSlug === recommendation.slug}
        />
      ))}

      {/* Long testimonials - simple 2-column layout */}
      {long.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {long.map((recommendation) => (
            <Recommendation
              key={recommendation.slug}
              recommendation={recommendation}
              isHighlighted={highlightedSlug === recommendation.slug}
            />
          ))}
        </div>
      )}

      {/* Regular testimonials - true CSS columns masonry */}
      {regular.length > 0 && (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {regular.map((recommendation) => (
            <div key={recommendation.slug} className="mb-4 break-inside-avoid">
              <Recommendation
                recommendation={recommendation}
                isHighlighted={highlightedSlug === recommendation.slug}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
