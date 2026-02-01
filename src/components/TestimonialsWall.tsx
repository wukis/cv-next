'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { RecommendationInterface } from '@/lib/recommendations'

const colors = [
  { border: 'border-emerald-500/20 dark:border-emerald-400/20', hover: 'hover:border-emerald-500/50 dark:hover:border-emerald-400/50', accent: 'bg-emerald-500 dark:bg-emerald-400', quote: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/50 dark:ring-emerald-400/50' },
  { border: 'border-sky-500/20 dark:border-sky-400/20', hover: 'hover:border-sky-500/50 dark:hover:border-sky-400/50', accent: 'bg-sky-500 dark:bg-sky-400', quote: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-500/50 dark:ring-sky-400/50' },
  { border: 'border-violet-500/20 dark:border-violet-400/20', hover: 'hover:border-violet-500/50 dark:hover:border-violet-400/50', accent: 'bg-violet-500 dark:bg-violet-400', quote: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500/50 dark:ring-violet-400/50' },
  { border: 'border-amber-500/20 dark:border-amber-400/20', hover: 'hover:border-amber-500/50 dark:hover:border-amber-400/50', accent: 'bg-amber-500 dark:bg-amber-400', quote: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/50 dark:ring-amber-400/50' },
  { border: 'border-rose-500/20 dark:border-rose-400/20', hover: 'hover:border-rose-500/50 dark:hover:border-rose-400/50', accent: 'bg-rose-500 dark:bg-rose-400', quote: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-500/50 dark:ring-rose-400/50' },
  { border: 'border-cyan-500/20 dark:border-cyan-400/20', hover: 'hover:border-cyan-500/50 dark:hover:border-cyan-400/50', accent: 'bg-cyan-500 dark:bg-cyan-400', quote: 'text-cyan-600 dark:text-cyan-400', ring: 'ring-cyan-500/50 dark:ring-cyan-400/50' },
]

function Recommendation({
  recommendation,
  index,
  isHighlighted,
}: {
  recommendation: RecommendationInterface
  index: number
  isHighlighted: boolean
}) {
  const color = colors[index % colors.length]

  return (
    <article
      id={recommendation.slug}
      className="scroll-mt-20"
    >
      <div
        className={`relative rounded-xl border bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${color.border} ${color.hover} ${
          isHighlighted
            ? `ring-2 ${color.ring} shadow-lg scale-[1.02]`
            : ''
        }`}
      >
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 h-6 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200/60 dark:border-neutral-700/50">
          <span className="text-[10px] font-mono text-neutral-600 dark:text-neutral-300 truncate">
            ~/testimonials/{recommendation.slug}.md
          </span>
        </div>

        <div className="p-5">
          {/* Quote */}
          <blockquote className="relative mb-4">
            <span
              className={`absolute -top-1 -left-1 text-3xl font-serif ${color.quote} opacity-40`}
            >
              &ldquo;
            </span>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed pl-4 pr-2">
              {recommendation.body}
            </p>
          </blockquote>

          {/* Author info */}
          <div className="flex items-center gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <Image
              className="h-10 w-10 rounded-lg object-cover ring-2 ring-white dark:ring-neutral-800 flex-shrink-0"
              width={40}
              height={40}
              src={require(`@/images/recommendations/${recommendation.image}`).default}
              alt={recommendation.fullName}
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
                {recommendation.fullName}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {recommendation.position}
              </p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
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

  recommendations.forEach(rec => {
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
          index={recommendations.findIndex(r => r.slug === recommendation.slug)}
          isHighlighted={highlightedSlug === recommendation.slug}
        />
      ))}

      {/* Long testimonials - simple 2-column layout */}
      {long.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {long.map((recommendation) => (
            <Recommendation
              key={recommendation.slug}
              recommendation={recommendation}
              index={recommendations.findIndex(r => r.slug === recommendation.slug)}
              isHighlighted={highlightedSlug === recommendation.slug}
            />
          ))}
        </div>
      )}

      {/* Regular testimonials - true CSS columns masonry */}
      {regular.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {regular.map((recommendation) => (
            <div key={recommendation.slug} className="break-inside-avoid mb-4">
              <Recommendation
                recommendation={recommendation}
                index={recommendations.findIndex(r => r.slug === recommendation.slug)}
                isHighlighted={highlightedSlug === recommendation.slug}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
