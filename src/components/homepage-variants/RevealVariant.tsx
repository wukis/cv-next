'use client'

import Image from 'next/image'
import { useState } from 'react'

import { Button, DocumentIcon, MailIcon } from '@/components/Button'
import { ProfileSocialLinks } from '@/components/ProfileSocialLinks'
import { TechStack } from '@/components/TechStack'
import portraitImage from '@/images/jonas-petrik-portrait.png'
import { getRecommendationImage } from '@/lib/imageAssets'
import {
  currentPublicRole,
  getHomepageRecommendations,
  heroIntro,
  homeImpactCards,
  publicBasics,
  publicEmail,
  selectedImpactStories,
  totalPublicExperienceYears,
} from '@/lib/siteProfile'

type TabId = 'impact' | 'voices' | 'stack'

const tabs: { id: TabId; label: string }[] = [
  { id: 'impact', label: 'Impact' },
  { id: 'voices', label: 'Voices' },
  { id: 'stack', label: 'Stack' },
]

export default function RevealVariant() {
  const recommendations = getHomepageRecommendations()
  const [activeTab, setActiveTab] = useState<TabId>('impact')
  const [expandedStories, setExpandedStories] = useState<Set<number>>(
    () => new Set([0]),
  )
  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(() => new Set())
  const [showFullIntro, setShowFullIntro] = useState(false)
  const [hoveredMetric, setHoveredMetric] = useState<number | null>(null)

  function toggleStory(index: number) {
    setExpandedStories((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function toggleRec(slug: string) {
    setExpandedRecs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Compact hero */}
        <header>
          <div className="flex items-center gap-4">
            <Image
              src={portraitImage}
              alt={publicBasics.name}
              className="h-16 w-16 rounded-sm"
              priority
            />
            <div className="flex-1">
              <h1 className="text-xl font-bold">{publicBasics.name}</h1>
              <p className="font-mono text-xs text-neutral-500">
                {publicBasics.label} · {totalPublicExperienceYears}+ yrs ·{' '}
                {currentPublicRole.position} @ {currentPublicRole.name}
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <ProfileSocialLinks />
            </div>
          </div>

          {/* Intro with show more */}
          <div className="mt-4">
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {heroIntro[0]}
            </p>
            {showFullIntro && heroIntro.length > 1 && (
              <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                {heroIntro[1]}
              </p>
            )}
            {heroIntro.length > 1 && (
              <button
                onClick={() => setShowFullIntro(!showFullIntro)}
                className="mt-1 font-mono text-xs text-neutral-500 underline decoration-neutral-300 underline-offset-4 hover:decoration-emerald-500 dark:decoration-neutral-700 dark:hover:decoration-emerald-400"
              >
                {showFullIntro ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          {/* Mobile social links */}
          <div className="mt-3 sm:hidden">
            <ProfileSocialLinks />
          </div>

          {/* CTAs */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button href="/jonas-petrik-cv.pdf" variant="secondary">
              <DocumentIcon className="h-4 w-4" />
              Download CV
            </Button>
            <Button href={`mailto:${publicEmail}`} variant="secondary">
              <MailIcon className="h-4 w-4" />
              Email
            </Button>
          </div>

          {/* Metric badges */}
          <div className="mt-5 flex flex-wrap gap-2">
            {homeImpactCards.map((card, i) => (
              <div key={i} className="relative">
                <button
                  onMouseEnter={() => setHoveredMetric(i)}
                  onMouseLeave={() => setHoveredMetric(null)}
                  onClick={() =>
                    setHoveredMetric(hoveredMetric === i ? null : i)
                  }
                  className="inline-flex items-center gap-1.5 rounded-sm bg-neutral-100 px-2.5 py-1.5 font-mono text-xs text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <span className="font-semibold">{card.value}</span>
                  <span className="text-neutral-500">{card.label}</span>
                </button>
                {hoveredMetric === i && (
                  <div className="absolute top-full left-0 z-10 mt-1 w-56 rounded-sm border border-neutral-200 bg-white p-2 text-xs text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                    {card.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
        </header>

        {/* Tab bar */}
        <nav className="mt-10 flex gap-6 border-b border-neutral-200 dark:border-neutral-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 font-mono text-xs tracking-wide uppercase transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-emerald-500 text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="mt-8">
          {/* Impact tab */}
          {activeTab === 'impact' && (
            <div className="space-y-6">
              {selectedImpactStories.map((story, i) => {
                const isExpanded = expandedStories.has(i)
                return (
                  <article
                    key={i}
                    className="border-b border-neutral-100 pb-6 dark:border-neutral-900"
                  >
                    <button
                      onClick={() => toggleStory(i)}
                      className="flex w-full items-start justify-between text-left"
                    >
                      <div className="flex-1">
                        <h2 className="text-base font-semibold">
                          {story.title}
                        </h2>
                        {!isExpanded && (
                          <p className="mt-1 text-sm text-neutral-500">
                            {story.context.slice(0, 100)}…
                          </p>
                        )}
                      </div>
                      <span className="mt-1 ml-3 font-mono text-xs text-neutral-400">
                        {isExpanded ? '−' : '+'}
                      </span>
                    </button>
                    <div
                      className={`grid transition-all duration-200 ${
                        isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                          <p>{story.context}</p>
                          <p>{story.role}</p>
                          <p>{story.impact}</p>
                        </div>
                        <p className="mt-3 font-mono text-xs text-neutral-500">
                          {story.evidence}
                        </p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* Voices tab */}
          {activeTab === 'voices' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {recommendations.map((rec) => {
                const isExpanded = expandedRecs.has(rec.slug)
                return (
                  <article key={rec.slug}>
                    <button
                      onClick={() => toggleRec(rec.slug)}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <Image
                        src={getRecommendationImage(rec.image)}
                        alt={rec.fullName}
                        className="h-10 w-10 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{rec.fullName}</p>
                        {!isExpanded && (
                          <p className="mt-1 text-xs text-neutral-500">
                            {rec.body.slice(0, 100)}…
                          </p>
                        )}
                      </div>
                      <span className="mt-1 ml-2 font-mono text-xs text-neutral-400">
                        {isExpanded ? '−' : '+'}
                      </span>
                    </button>
                    <div
                      className={`grid transition-all duration-200 ${
                        isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-3 pl-[52px]">
                          <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                            {rec.body}
                          </p>
                          <p className="mt-2 text-xs text-neutral-500">
                            {rec.position}
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            {rec.date}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* Stack tab */}
          {activeTab === 'stack' && (
            <TechStack technologies={currentPublicRole.technologies} />
          )}
        </div>
      </div>
    </div>
  )
}
