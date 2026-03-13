'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/Container'
import { TechStack } from '@/components/TechStack'
import { GitHubIcon, LinkedInIcon, GitLabIcon } from '@/components/SocialIcons'
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

function truncate(text: string, length: number) {
  if (text.length <= length) {
    return text
  }
  return text.slice(0, length) + '...'
}

function MailIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M6 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6Zm.245 2.187a.75.75 0 0 0-.99 1.126l6.25 5.5a.75.75 0 0 0 .99 0l6.25-5.5a.75.75 0 0 0-.99-1.126L12 12.251 6.245 7.187Z"
      />
    </svg>
  )
}

function Recommendations() {
  const displayedRecommendations = recommendations.slice(0, 6)

  return (
    <Container className="mt-16 sm:mt-24">
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-800 sm:text-4xl lg:text-5xl dark:text-neutral-100">
          <span className="font-mono text-violet-600 dark:text-violet-400">
            &gt;
          </span>{' '}
          cat{' '}
          <span className="text-neutral-500 dark:text-neutral-400">
            testimonials.md
          </span>
        </h2>
        <p className="mt-3 font-mono text-lg text-neutral-600 dark:text-neutral-400">
          <span className="text-neutral-500 dark:text-neutral-400"># </span>
          What colleagues say about working with me
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayedRecommendations.map((recommendation, index) => (
          <Recommendation
            key={recommendation.slug}
            recommendation={recommendation}
            index={index}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Link
          href="/recommendations"
          className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-100 px-4 py-2 font-mono text-sm text-amber-950 transition-colors hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100 dark:hover:bg-amber-900/80"
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
  index,
}: {
  recommendation: RecommendationInterface
  index: number
}) {
  const colors = [
    {
      border: 'border-emerald-500/30 dark:border-emerald-400/30',
      hover: 'hover:border-emerald-500/50 dark:hover:border-emerald-400/50',
      quote: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      border: 'border-sky-500/30 dark:border-sky-400/30',
      hover: 'hover:border-sky-500/50 dark:hover:border-sky-400/50',
      quote: 'text-sky-600 dark:text-sky-400',
    },
    {
      border: 'border-violet-500/30 dark:border-violet-400/30',
      hover: 'hover:border-violet-500/50 dark:hover:border-violet-400/50',
      quote: 'text-violet-600 dark:text-violet-400',
    },
    {
      border: 'border-amber-500/30 dark:border-amber-400/30',
      hover: 'hover:border-amber-500/50 dark:hover:border-amber-400/50',
      quote: 'text-amber-600 dark:text-amber-400',
    },
    {
      border: 'border-rose-500/30 dark:border-rose-400/30',
      hover: 'hover:border-rose-500/50 dark:hover:border-rose-400/50',
      quote: 'text-rose-600 dark:text-rose-400',
    },
    {
      border: 'border-cyan-500/30 dark:border-cyan-400/30',
      hover: 'hover:border-cyan-500/50 dark:hover:border-cyan-400/50',
      quote: 'text-cyan-600 dark:text-cyan-400',
    },
  ]
  const color = colors[index % colors.length]

  return (
    <Link
      href={`/recommendations#${recommendation.slug}`}
      className={`group block overflow-hidden rounded-lg border bg-white/85 dark:bg-neutral-900/85 ${color.border} ${color.hover} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
    >
      {/* Terminal header */}
      <div className="flex h-6 items-center gap-2 border-b border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
        <span className="truncate px-4 font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
          ~/testimonials/{recommendation.slug}.md
        </span>
      </div>

      <div className="p-4">
        <figure>
          <blockquote className="line-clamp-3 text-sm text-neutral-700 dark:text-neutral-200">
            <span className={`${color.quote} font-serif text-lg`}>&ldquo;</span>
            {truncate(recommendation.body, 120)}
            <span className={`${color.quote} font-serif text-lg`}>&rdquo;</span>
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
        <div className="overflow-hidden rounded-lg border border-emerald-300 bg-white/90 dark:border-emerald-700 dark:bg-neutral-900/90">
          {/* Terminal header */}
          <div className="flex h-6 items-center justify-between gap-2 border-b border-neutral-300 bg-neutral-100 px-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="truncate font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
              ~/README.md
            </span>
            <div className="flex items-center gap-1 rounded border border-emerald-300 bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-100">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
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

                {/* Social links - always inline row */}
                <div className="mt-3 flex flex-row justify-center gap-1.5">
                  <Link
                    href="mailto:jonas@petrik.dev"
                    className="rounded-md border border-neutral-300 bg-neutral-100 p-1.5 transition-colors hover:bg-emerald-100 hover:text-emerald-900 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-emerald-950/70 dark:hover:text-emerald-100"
                    aria-label="Email"
                  >
                    <MailIcon className="h-4 w-4 fill-neutral-700 dark:fill-neutral-200" />
                  </Link>
                  <Link
                    href="https://www.linkedin.com/in/jonas-petrik/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-neutral-300 bg-neutral-100 p-1.5 transition-colors hover:bg-sky-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-sky-950/70"
                    aria-label="LinkedIn"
                  >
                    <LinkedInIcon className="h-4 w-4 fill-neutral-700 dark:fill-neutral-200" />
                  </Link>
                  <Link
                    href="https://github.com/wukis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-neutral-300 bg-neutral-100 p-1.5 transition-colors hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                    aria-label="GitHub"
                  >
                    <GitHubIcon className="h-4 w-4 fill-neutral-700 dark:fill-neutral-200" />
                  </Link>
                  <Link
                    href="https://gitlab.com/jonas.petrik"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-neutral-300 bg-neutral-100 p-1.5 transition-colors hover:bg-orange-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-orange-950/70"
                    aria-label="GitLab"
                  >
                    <GitLabIcon className="h-4 w-4 fill-neutral-700 dark:fill-neutral-200" />
                  </Link>
                </div>
              </div>

              {/* Bio content */}
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="mb-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 font-mono text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {linkedin.basics.label}
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-800 sm:text-3xl lg:text-4xl xl:text-5xl dark:text-neutral-100">
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    &gt;
                  </span>{' '}
                  {linkedin.basics.name}
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base dark:text-neutral-200">
                  {linkedin.basics.summary.replace(
                    /(\d+)\+ years of experience/,
                    `${totalExperienceYears}+ years of experience`,
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack from current employment */}
          <TechStack technologies={currentEmployment.technologies} tone="plain" />
        </div>
      </Container>

      <Recommendations />
    </>
  )
}
