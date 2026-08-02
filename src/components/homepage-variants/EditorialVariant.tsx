import Image from 'next/image'

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

export default function EditorialVariant() {
  const recommendations = getHomepageRecommendations()

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-black dark:text-neutral-100">
      <div className="mx-auto max-w-2xl px-6 py-20">
        {/* Hero */}
        <header>
          <p className="font-mono text-xs tracking-[0.3em] text-neutral-500 uppercase">
            {publicBasics.label}
          </p>
          <div className="mt-4 flex items-start">
            <div className="flex-1">
              <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
                {publicBasics.name}
              </h1>
            </div>
            <Image
              src={portraitImage}
              alt={publicBasics.name}
              className="ml-6 hidden h-32 w-32 rounded-sm sm:block"
              priority
            />
          </div>
          <div className="mt-4 flex justify-center sm:hidden">
            <Image
              src={portraitImage}
              alt={publicBasics.name}
              className="h-32 w-32 rounded-sm"
              priority
            />
          </div>
          <div className="mt-6 space-y-4 text-base leading-[1.85] text-neutral-700 dark:text-neutral-300">
            {heroIntro.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          <p className="mt-4 text-sm text-neutral-500">
            {totalPublicExperienceYears}+ years experience ·{' '}
            {currentPublicRole.position} @ {currentPublicRole.name}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-sm">
            <a
              href="/jonas-petrik-cv.pdf"
              className="text-neutral-700 underline decoration-neutral-300 underline-offset-4 hover:decoration-emerald-500 dark:text-neutral-300 dark:decoration-neutral-600 dark:hover:decoration-emerald-400"
            >
              Download CV
            </a>
            <a
              href={`mailto:${publicEmail}`}
              className="text-neutral-700 underline decoration-neutral-300 underline-offset-4 hover:decoration-emerald-500 dark:text-neutral-300 dark:decoration-neutral-600 dark:hover:decoration-emerald-400"
            >
              {publicEmail}
            </a>
          </div>
          <ProfileSocialLinks />
        </header>

        {/* Metrics — typographic pull-quote */}
        <section className="mt-24 border-y border-neutral-200 py-6 dark:border-neutral-800">
          <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
            {homeImpactCards.map((card, i) => (
              <span key={i}>
                {i > 0 && (
                  <span className="mx-2 text-neutral-400 dark:text-neutral-600">
                    ·
                  </span>
                )}
                <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                  {card.value}
                </span>{' '}
                {card.label}
              </span>
            ))}
          </p>
        </section>

        {/* Impact Stories */}
        <section className="mt-24">
          {selectedImpactStories.map((story, i) => (
            <article key={i} className={i > 0 ? 'mt-16' : ''}>
              <div className="flex items-start gap-4">
                <span className="font-mono text-2xl leading-none text-neutral-300 dark:text-neutral-600">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {story.title}
                  </h2>
                  <div className="mt-3 space-y-3 text-base leading-[1.85] text-neutral-700 dark:text-neutral-300">
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
          ))}
        </section>

        {/* Recommendations */}
        <section className="mt-24 space-y-10">
          {recommendations.map((rec) => (
            <blockquote
              key={rec.slug}
              className="border-l-2 border-neutral-300 pl-5 dark:border-neutral-700"
            >
              <p className="text-base leading-[1.85] text-neutral-700 dark:text-neutral-300">
                {rec.body}
              </p>
              <footer className="mt-3 flex items-center gap-2">
                <Image
                  src={getRecommendationImage(rec.image)}
                  alt={rec.fullName}
                  className="h-6 w-6 rounded-full"
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  — {rec.fullName}, {rec.position}
                </span>
              </footer>
            </blockquote>
          ))}
        </section>

        {/* Tech Stack */}
        <section className="mt-24">
          <p className="mb-6 font-mono text-xs tracking-[0.3em] text-neutral-500 uppercase">
            Tech Stack
          </p>
          <TechStack technologies={currentPublicRole.technologies} />
        </section>
      </div>
    </div>
  )
}
