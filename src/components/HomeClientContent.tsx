'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/Container'
import { surfaceHoverMotionClassName } from '@/components/interactionStyles'
import { recommendationsCopy } from '@/lib/recommendationsCopy'
import { ProfileSocialLinks } from '@/components/ProfileSocialLinks'
import { TechStack } from '@/components/TechStack'
import { type RecommendationInterface } from '@/lib/recommendations'
import { calculateTotalExperienceYears, WorkInterface } from '@/lib/experience'
import portraitImage from '@/images/jonas-petrik-portrait.png'
import recommendations from '@/data/recommendations.json'
import linkedin from '@/data/linkedin.json'
import work from '@/data/work.json'

const totalExperienceYears = calculateTotalExperienceYears(
  work as WorkInterface[],
)

// Get current employment (first entry in work.json)
const currentEmployment = (work as WorkInterface[])[0]

const achievementHighlights = [
  {
    value: '~550/min',
    label: 'peak order rate',
    detail: 'Built for high-traffic, payment-critical checkout load.',
  },
  {
    value: '€6.5B+',
    label: 'annual platform volume',
    detail: 'Engineering work operating at meaningful business scale.',
  },
  {
    value: '100+ brands',
    label: 'platform reach',
    detail: 'Systems reused across a large multi-tenant commerce product.',
  },
  {
    value: '3 -> 10',
    label: 'team growth',
    detail: 'Helped scale teams while keeping execution pragmatic.',
  },
] as const

function truncate(text: string, length: number) {
  if (text.length <= length) {
    return text
  }
  return text.slice(0, length) + '...'
}

function MailIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 7.5 12 13l8-5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 6h13A1.5 1.5 0 0 1 20 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-9A1.5 1.5 0 0 1 5.5 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Highlights() {
  return (
    <Container className="mt-8">
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white/90 dark:border-neutral-700 dark:bg-neutral-900/90">
        <div className="flex h-6 items-center gap-2 border-b border-neutral-300 bg-neutral-100 px-4 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="truncate font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
            ~/impact.log
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold tracking-tight text-neutral-800 sm:text-2xl dark:text-neutral-100">
              Engineering impact at a glance
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
              A quick scan of load, impact, and team growth.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {achievementHighlights.map((highlight) => (
              <article
                key={highlight.label}
                className="rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-4 dark:border-neutral-700/80 dark:bg-neutral-950/60"
              >
                <p className="font-mono text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                  {highlight.value}
                </p>
                <h3 className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-neutral-700 dark:text-neutral-200">
                  {highlight.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {highlight.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </Container>
  )
}

function RecommendationsPreview() {
  const displayedRecommendations = recommendations.slice(0, 6)

  return (
    <Container className="mt-10 sm:mt-12">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayedRecommendations.map((recommendation) => (
          <Recommendation
            key={recommendation.slug}
            recommendation={recommendation}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Link
          href="/recommendations"
          className={`inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-100 px-4 py-2 font-mono text-sm text-neutral-800 hover:border-emerald-300 hover:text-emerald-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-emerald-700 dark:hover:text-emerald-200 ${surfaceHoverMotionClassName}`}
        >
          <span>view all {recommendations.length}</span>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    </Container>
  )
}

function Recommendation({
  recommendation,
}: {
  recommendation: RecommendationInterface
}) {
  return (
    <Link
      href={`/recommendations#${recommendation.slug}`}
      className="group block overflow-hidden rounded-lg border border-neutral-200 bg-white/85 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-900/85 dark:hover:border-emerald-700"
    >
      {/* Terminal header */}
      <div className="flex h-6 items-center gap-2 border-b border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
        <span className="truncate px-4 font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
          ~/{recommendationsCopy.directoryName}/{recommendation.slug}.md
        </span>
      </div>

      <div className="p-4">
        <figure>
          <blockquote className="line-clamp-3 text-sm text-neutral-700 dark:text-neutral-200">
            <span className="font-serif text-lg text-amber-600 dark:text-amber-400">
              &ldquo;
            </span>
            {truncate(recommendation.body, 120)}
            <span className="font-serif text-lg text-amber-600 dark:text-amber-400">
              &rdquo;
            </span>
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <Image
              className="h-9 w-9 flex-shrink-0 rounded-lg object-cover ring-2 ring-white dark:ring-neutral-800"
              width={36}
              height={36}
              src={
                require(`@/images/recommendations/${recommendation.image}`)
                  .default
              }
              alt={recommendation.fullName}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                {recommendation.fullName}
              </div>
              <div className="truncate text-xs text-neutral-700 dark:text-neutral-200">
                {recommendation.position}
              </div>
              <div className="text-[10px] text-neutral-600 dark:text-neutral-300">
                {recommendation.date}
              </div>
            </div>
          </figcaption>
        </figure>
      </div>
    </Link>
  )
}

export default function HomeClientContent() {
  return (
    <>
      <Container className="mt-10 sm:mt-16">
        {/* Main hero card - combines portrait and bio on mobile */}
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white/90 dark:border-neutral-700 dark:bg-neutral-900/90">
          {/* Terminal header */}
          <div className="flex h-6 items-center justify-between gap-2 border-b border-neutral-300 bg-neutral-100 px-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="truncate font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
              ~/README.md
            </span>
            <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              available
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {/* Mobile: Portrait centered at top, Desktop: Side by side */}
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              {/* Portrait - smaller on mobile, side column on desktop */}
              <div className="flex-shrink-0">
                <div className="h-36 w-36 overflow-hidden rounded-xl shadow-lg ring-4 ring-white sm:h-40 sm:w-40 lg:h-48 lg:w-48 dark:ring-neutral-800">
                  <Image
                    src={portraitImage}
                    alt="Jonas Petrik - Staff Engineer and Team Lead"
                    sizes="(min-width: 1024px) 12rem, (min-width: 640px) 10rem, 9rem"
                    className="h-full w-full object-cover"
                    priority={true}
                  />
                </div>

                <ProfileSocialLinks />
              </div>

              {/* Bio content */}
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="mb-3">
                  <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    {linkedin.basics.label}
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-800 sm:text-3xl lg:text-4xl xl:text-5xl dark:text-neutral-100">
                  {linkedin.basics.name}
                </h1>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700 sm:text-base dark:text-neutral-200">
                  <p>
                    Leading checkout at SCAYLE, the platform behind Harrods,
                    Deichmann, and 100+ brands.
                  </p>
                  <p>
                    I build high-availability commerce systems, pragmatic
                    architecture, and calmer on-call rotations so teams can ship
                    fast without creating 3am problems.
                  </p>
                </div>
                <div className="mt-4 flex justify-center sm:justify-start">
                  <p className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 font-mono text-[11px] text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-300">
                    {totalExperienceYears}+ years across fullstack engineering,
                    architecture, DevOps, and team leadership
                  </p>
                </div>

                <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="mailto:jonas@petrik.dev"
                    className={`inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 font-mono text-sm text-emerald-900 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/70 ${surfaceHoverMotionClassName}`}
                  >
                    <MailIcon className="h-4 w-4" />
                    <span>email contact</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Stack from current employment */}
          <TechStack
            technologies={currentEmployment.technologies}
            tone="plain"
          />
        </div>
      </Container>

      <Highlights />
      <RecommendationsPreview />
    </>
  )
}
