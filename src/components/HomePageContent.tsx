import Image from 'next/image'
import Link from 'next/link'

import { Button, DocumentIcon, MailIcon } from '@/components/Button'
import { Container } from '@/components/Container'
import { ProfileSocialLinks } from '@/components/ProfileSocialLinks'
import { TechStack } from '@/components/TechStack'
import { TerminalSectionHeader } from '@/components/TerminalHeader'
import portraitImage from '@/images/jonas-petrik-portrait.png'
import { getRecommendationImage } from '@/lib/imageAssets'
import { type RecommendationInterface } from '@/lib/recommendations'
import { recommendationsCopy } from '@/lib/recommendationsCopy'
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

function truncate(text: string, length: number) {
  if (text.length <= length) {
    return text
  }
  return text.slice(0, length) + '...'
}

function Highlights() {
  const featuredStory = selectedImpactStories[0]

  return (
    <Container className="mt-8">
      <div className="overflow-hidden rounded-sm border border-neutral-200/70 bg-white/95 dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="flex h-6 items-center gap-2 border-b border-neutral-200 bg-neutral-50/80 px-4 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="truncate font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
            ~/impact-report.md
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold tracking-tight text-neutral-800 sm:text-2xl dark:text-neutral-100">
              What I worked on and what changed
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
              A quick view of the systems I worked on, the scale they ran at,
              and a few concrete examples of the work behind them.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-10 xl:grid-cols-[18rem_minmax(0,1fr)]">
            <aside>
              <h3 className="border-l-2 border-emerald-500/30 pl-2.5 font-mono text-[11px] tracking-[0.2em] text-neutral-600 uppercase dark:border-emerald-400/30 dark:text-neutral-300">
                impact at a glance
              </h3>
              <dl className="mt-4 border-t border-neutral-200 dark:border-neutral-700">
                {homeImpactCards.map((highlight) => (
                  <div
                    key={highlight.label}
                    className="border-b border-neutral-200 py-4 last:border-b-0 last:pb-0 dark:border-neutral-700"
                  >
                    <dt className="font-mono text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                      {highlight.value}
                    </dt>
                    <dd className="mt-2 text-[11px] font-semibold tracking-[0.18em] text-neutral-600 uppercase dark:text-neutral-300">
                      {highlight.label}
                    </dd>
                    <dd className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {highlight.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>

            <section>
              <h3 className="border-l-2 border-emerald-500/30 pl-2.5 font-mono text-[11px] tracking-[0.2em] text-neutral-600 uppercase dark:border-emerald-400/30 dark:text-neutral-300">
                selected impact
              </h3>

              <div className="mt-4 border-t border-neutral-200 pt-5 dark:border-neutral-700">
                <article className="grid grid-cols-1 gap-4 md:grid-cols-[2.75rem_minmax(0,1fr)]">
                  <div className="font-mono text-2xl text-neutral-600 dark:text-neutral-300">
                    01
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {featuredStory.title}
                    </h3>
                    <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                      <p>{featuredStory.context}</p>
                      <p>{featuredStory.role}</p>
                      <p>{featuredStory.impact}</p>
                    </div>
                    <p className="mt-4 font-mono text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                      Evidence: {featuredStory.evidence}
                    </p>
                  </div>
                </article>
              </div>

              <ol className="mt-8 border-t border-neutral-200 dark:border-neutral-700">
                {selectedImpactStories.slice(1).map((story, index) => (
                  <li
                    key={story.title}
                    className="grid grid-cols-1 gap-4 border-b border-neutral-200 py-5 last:border-b-0 last:pb-0 md:grid-cols-[2.75rem_minmax(0,1fr)] dark:border-neutral-700"
                  >
                    <div className="font-mono text-2xl text-neutral-600 dark:text-neutral-300">
                      {String(index + 2).padStart(2, '0')}
                    </div>
                    <article>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {story.title}
                      </h3>
                      <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                        <p>{story.context}</p>
                        <p>{story.role}</p>
                        <p>{story.impact}</p>
                      </div>
                      <p className="mt-4 font-mono text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                        Evidence: {story.evidence}
                      </p>
                    </article>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </Container>
  )
}

function RecommendationsPreview() {
  const displayedRecommendations = getHomepageRecommendations()

  return (
    <Container className="mt-10 sm:mt-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <TerminalSectionHeader
          command="cat"
          argument={`${recommendationsCopy.fileName} --limit 6 --short`}
        />
      </div>

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
          className="inline-flex items-center gap-2 rounded-sm border border-neutral-300 bg-neutral-50 px-4 py-2 font-mono text-sm text-neutral-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-800 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-emerald-700 dark:hover:text-emerald-200"
        >
          <span>view all recommendations</span>
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
      className="group block overflow-hidden rounded-sm border border-neutral-200/70 bg-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-950/90 dark:hover:border-emerald-700"
    >
      {/* Terminal header */}
      <div className="flex h-6 items-center gap-2 border-b border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900">
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
              className="h-9 w-9 shrink-0 rounded-sm object-cover ring-2 ring-white dark:ring-neutral-800"
              width={36}
              height={36}
              src={getRecommendationImage(recommendation.image)}
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

function HomeHeroCard() {
  return (
    <Container className="mt-10 sm:mt-16">
      <div className="overflow-hidden rounded-sm border border-neutral-200/70 bg-white/95 dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="flex h-6 items-center gap-2 border-b border-neutral-200 bg-neutral-50/80 px-4 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="truncate font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
            ~/README.md
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0">
              <div className="h-36 w-36 overflow-hidden rounded-sm shadow-lg ring-4 ring-white sm:h-40 sm:w-40 lg:h-48 lg:w-48 dark:ring-neutral-800">
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

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="mb-3">
                <span className="font-mono text-[11px] tracking-[0.2em] text-neutral-600 uppercase dark:text-neutral-300">
                  {publicBasics.label}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-800 sm:text-3xl lg:text-4xl xl:text-5xl dark:text-neutral-100">
                {publicBasics.name}
              </h1>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700 sm:text-base dark:text-neutral-200">
                {heroIntro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-4 flex justify-center sm:justify-start">
                <p className="inline-flex items-center rounded-sm border border-neutral-200/70 bg-neutral-50 px-3 py-1.5 font-mono text-[11px] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-300">
                  {totalPublicExperienceYears}+ years across fullstack
                  engineering, architecture, DevOps, and team leadership
                </p>
              </div>

              <div className="mt-5 flex flex-row flex-wrap items-center justify-center gap-3 sm:justify-start">
                <Button
                  href="/cv"
                  variant="secondary"
                  className="rounded-sm border border-neutral-300 bg-neutral-50 font-mono text-neutral-900 hover:border-emerald-300 hover:text-emerald-800 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 dark:hover:border-emerald-700 dark:hover:text-emerald-200"
                >
                  <DocumentIcon className="h-4 w-4" />
                  <span>view CV</span>
                </Button>
                <Button
                  href={`mailto:${publicEmail}`}
                  variant="secondary"
                  className="rounded-sm border border-emerald-300 bg-emerald-50 font-mono text-emerald-900 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/70"
                >
                  <MailIcon className="h-4 w-4" />
                  <span>email</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <TechStack
          technologies={currentPublicRole.technologies}
          tone="plain"
          contentId="home-tech-stack"
        />
      </div>
    </Container>
  )
}

export default function HomePageContent() {
  return (
    <>
      <HomeHeroCard />
      <Highlights />
      <RecommendationsPreview />
    </>
  )
}
