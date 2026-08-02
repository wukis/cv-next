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

function GridCell({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white p-4 sm:p-5 dark:bg-neutral-950 ${className}`}>
      {children}
    </div>
  )
}

export default function DashboardVariant() {
  const recommendations = getHomepageRecommendations()
  const [featuredStory, ...otherStories] = selectedImpactStories

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      {/* Desktop grid */}
      <div className="mx-auto max-w-[1400px] p-1">
        {/* Main 12-col grid with 1px gap */}
        <div className="hidden gap-px lg:grid lg:grid-cols-12">
          {/* Identity — cols 1-5, spans 2 rows */}
          <GridCell className="col-span-5 row-span-2">
            <div className="flex items-start gap-5">
              <Image
                src={portraitImage}
                alt={publicBasics.name}
                className="h-24 w-24 rounded-sm"
                priority
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {publicBasics.name}
                </h1>
                <p className="mt-1 font-mono text-xs tracking-widest text-neutral-500 uppercase">
                  {publicBasics.label}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {heroIntro.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs">
              <a
                href="/jonas-petrik-cv.pdf"
                className="text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:decoration-emerald-500 dark:text-neutral-400 dark:decoration-neutral-700 dark:hover:decoration-emerald-400"
              >
                Download CV
              </a>
              <a
                href={`mailto:${publicEmail}`}
                className="text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:decoration-emerald-500 dark:text-neutral-400 dark:decoration-neutral-700 dark:hover:decoration-emerald-400"
              >
                {publicEmail}
              </a>
            </div>
            <ProfileSocialLinks />
          </GridCell>

          {/* 4 Metric cells — cols 6-12, rows 1-2 as 2x2 */}
          {homeImpactCards.map((card, i) => (
            <GridCell
              key={i}
              className="col-span-2 first:col-start-6 [&:nth-child(3)]:col-start-6"
            >
              <div className="border-l-2 border-emerald-500 pl-3 dark:border-emerald-600">
                <p className="font-mono text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {card.value}
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
                  {card.label}
                </p>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {card.detail}
                </p>
              </div>
            </GridCell>
          ))}

          {/* Featured story — cols 1-8, row 3 */}
          <GridCell className="col-span-8">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {featuredStory.title}
              </h2>
              <span className="font-mono text-sm text-neutral-300 dark:text-neutral-600">
                01
              </span>
            </div>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              <p>{featuredStory.context}</p>
              <p>{featuredStory.role}</p>
              <p>{featuredStory.impact}</p>
            </div>
            <p className="mt-2 font-mono text-xs text-neutral-500">
              {featuredStory.evidence}
            </p>
          </GridCell>

          {/* Info cell — cols 9-12, rows 3-4 */}
          <GridCell className="col-span-4 row-span-2">
            <h3 className="font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
              Profile
            </h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="font-mono text-[10px] tracking-[0.2em] text-neutral-400 uppercase">
                  Experience
                </dt>
                <dd className="text-neutral-700 dark:text-neutral-300">
                  {totalPublicExperienceYears}+ years
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.2em] text-neutral-400 uppercase">
                  Location
                </dt>
                <dd className="text-neutral-700 dark:text-neutral-300">
                  {publicBasics.location}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.2em] text-neutral-400 uppercase">
                  Current Role
                </dt>
                <dd className="text-neutral-700 dark:text-neutral-300">
                  {currentPublicRole.position} @ {currentPublicRole.name}
                </dd>
              </div>
            </dl>
          </GridCell>

          {/* Stories 02-03 — cols 1-4 and 5-8, row 4 */}
          {otherStories.map((story, i) => (
            <GridCell key={i} className="col-span-4">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {story.title}
                </h2>
                <span className="font-mono text-sm text-neutral-300 dark:text-neutral-600">
                  {String(i + 2).padStart(2, '0')}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                <p>{story.context}</p>
                <p>{story.role}</p>
                <p>{story.impact}</p>
              </div>
              <p className="mt-2 font-mono text-xs text-neutral-500">
                {story.evidence}
              </p>
            </GridCell>
          ))}

          {/* 6 Recommendation cells — 3x2 */}
          {recommendations.map((rec) => (
            <GridCell key={rec.slug} className="col-span-4">
              <div className="flex items-center gap-2">
                <Image
                  src={getRecommendationImage(rec.image)}
                  alt={rec.fullName}
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {rec.fullName}
                  </p>
                  <p className="text-xs text-neutral-500">{rec.position}</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                {rec.body}
              </p>
              <p className="mt-2 text-[10px] text-neutral-400">{rec.date}</p>
            </GridCell>
          ))}

          {/* Tech — full width */}
          <GridCell className="col-span-12">
            <TechStack technologies={currentPublicRole.technologies} />
          </GridCell>
        </div>

        {/* Tablet grid */}
        <div className="hidden gap-px md:grid md:grid-cols-6 lg:hidden">
          {/* Identity full width */}
          <GridCell className="col-span-6">
            <div className="flex items-start gap-5">
              <Image
                src={portraitImage}
                alt={publicBasics.name}
                className="h-24 w-24 rounded-sm"
                priority
              />
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {publicBasics.name}
                </h1>
                <p className="mt-1 font-mono text-xs tracking-widest text-neutral-500 uppercase">
                  {publicBasics.label}
                </p>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {heroIntro.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-xs">
                  <a
                    href="/jonas-petrik-cv.pdf"
                    className="text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:decoration-emerald-500 dark:text-neutral-400 dark:decoration-neutral-700 dark:hover:decoration-emerald-400"
                  >
                    Download CV
                  </a>
                  <a
                    href={`mailto:${publicEmail}`}
                    className="text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:decoration-emerald-500 dark:text-neutral-400 dark:decoration-neutral-700 dark:hover:decoration-emerald-400"
                  >
                    {publicEmail}
                  </a>
                </div>
                <ProfileSocialLinks />
              </div>
            </div>
          </GridCell>

          {/* Metrics 2x2 */}
          {homeImpactCards.map((card, i) => (
            <GridCell key={i} className="col-span-3">
              <div className="border-l-2 border-emerald-500 pl-3 dark:border-emerald-600">
                <p className="font-mono text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {card.value}
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
                  {card.label}
                </p>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {card.detail}
                </p>
              </div>
            </GridCell>
          ))}

          {/* Stories stacked */}
          {selectedImpactStories.map((story, i) => (
            <GridCell key={i} className="col-span-6">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {story.title}
                </h2>
                <span className="font-mono text-sm text-neutral-300 dark:text-neutral-600">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                <p>{story.context}</p>
                <p>{story.role}</p>
                <p>{story.impact}</p>
              </div>
              <p className="mt-2 font-mono text-xs text-neutral-500">
                {story.evidence}
              </p>
            </GridCell>
          ))}

          {/* Recs 2x3 */}
          {recommendations.map((rec) => (
            <GridCell key={rec.slug} className="col-span-3">
              <div className="flex items-center gap-2">
                <Image
                  src={getRecommendationImage(rec.image)}
                  alt={rec.fullName}
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {rec.fullName}
                  </p>
                  <p className="text-xs text-neutral-500">{rec.position}</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                {rec.body}
              </p>
              <p className="mt-2 text-[10px] text-neutral-400">{rec.date}</p>
            </GridCell>
          ))}

          {/* Tech */}
          <GridCell className="col-span-6">
            <TechStack technologies={currentPublicRole.technologies} />
          </GridCell>
        </div>

        {/* Mobile — single column */}
        <div className="flex flex-col gap-1 md:hidden">
          <GridCell>
            <div className="flex flex-col items-center text-center">
              <Image
                src={portraitImage}
                alt={publicBasics.name}
                className="h-24 w-24 rounded-sm"
                priority
              />
              <h1 className="mt-3 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {publicBasics.name}
              </h1>
              <p className="mt-1 font-mono text-xs tracking-widest text-neutral-500 uppercase">
                {publicBasics.label}
              </p>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {heroIntro.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
              <a
                href="/jonas-petrik-cv.pdf"
                className="text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:decoration-emerald-500 dark:text-neutral-400 dark:decoration-neutral-700 dark:hover:decoration-emerald-400"
              >
                Download CV
              </a>
              <a
                href={`mailto:${publicEmail}`}
                className="text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:decoration-emerald-500 dark:text-neutral-400 dark:decoration-neutral-700 dark:hover:decoration-emerald-400"
              >
                {publicEmail}
              </a>
            </div>
            <ProfileSocialLinks />
          </GridCell>

          {homeImpactCards.map((card, i) => (
            <GridCell key={i}>
              <div className="border-l-2 border-emerald-500 pl-3 dark:border-emerald-600">
                <p className="font-mono text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {card.value}
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
                  {card.label}
                </p>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {card.detail}
                </p>
              </div>
            </GridCell>
          ))}

          {selectedImpactStories.map((story, i) => (
            <GridCell key={i}>
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {story.title}
                </h2>
                <span className="font-mono text-sm text-neutral-300 dark:text-neutral-600">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                <p>{story.context}</p>
                <p>{story.role}</p>
                <p>{story.impact}</p>
              </div>
              <p className="mt-2 font-mono text-xs text-neutral-500">
                {story.evidence}
              </p>
            </GridCell>
          ))}

          {recommendations.map((rec) => (
            <GridCell key={rec.slug}>
              <div className="flex items-center gap-2">
                <Image
                  src={getRecommendationImage(rec.image)}
                  alt={rec.fullName}
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {rec.fullName}
                  </p>
                  <p className="text-xs text-neutral-500">{rec.position}</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                {rec.body}
              </p>
              <p className="mt-2 text-[10px] text-neutral-400">{rec.date}</p>
            </GridCell>
          ))}

          <GridCell>
            <TechStack technologies={currentPublicRole.technologies} />
          </GridCell>
        </div>
      </div>
    </div>
  )
}
