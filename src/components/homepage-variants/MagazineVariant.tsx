import Image from 'next/image'

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

export default function MagazineVariant() {
  const recommendations = getHomepageRecommendations()
  const [featuredStory, ...otherStories] = selectedImpactStories

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto max-w-[1400px] px-6 py-12">
        {/* Desktop bento grid */}
        <div
          className="hidden gap-x-8 gap-y-12 lg:grid"
          style={{
            gridTemplateColumns: '1fr 1fr 20rem',
            gridTemplateAreas: `
              "hero     hero     metrics"
              "story1   story1   metrics"
              "story2   story3   recs"
              "tech     tech     recs"
            `,
          }}
        >
          {/* Hero */}
          <div
            className="border-b border-neutral-200 pb-12 dark:border-neutral-800"
            style={{ gridArea: 'hero' }}
          >
            <div className="flex items-start gap-8">
              <Image
                src={portraitImage}
                alt={publicBasics.name}
                className="h-28 w-28 rounded-sm"
                priority
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight">
                  {publicBasics.name}
                </h1>
                <p className="mt-1 font-mono text-xs tracking-widest text-neutral-500 uppercase">
                  {publicBasics.label} · {totalPublicExperienceYears}+ years ·{' '}
                  {currentPublicRole.position} @ {currentPublicRole.name}
                </p>
                <div className="mt-4 space-y-3 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {heroIntro.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button href="/jonas-petrik-cv.pdf" variant="secondary">
                    <DocumentIcon className="h-4 w-4" />
                    Download CV
                  </Button>
                  <Button href={`mailto:${publicEmail}`} variant="secondary">
                    <MailIcon className="h-4 w-4" />
                    Email
                  </Button>
                </div>
                <ProfileSocialLinks />
              </div>
            </div>
          </div>

          {/* Metrics sidebar */}
          <div style={{ gridArea: 'metrics' }}>
            {homeImpactCards.map((card, i) => (
              <div
                key={i}
                className={
                  i > 0
                    ? 'mt-0 border-t border-neutral-200 pt-5 dark:border-neutral-800'
                    : ''
                }
              >
                <div className={i > 0 ? '' : ''}>
                  <p className="font-mono text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                    {card.value}
                  </p>
                  <p className="mt-1 text-[10px] tracking-widest text-neutral-500 uppercase">
                    {card.label}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">{card.detail}</p>
                </div>
                {i < homeImpactCards.length - 1 && <div className="pb-5" />}
              </div>
            ))}
          </div>

          {/* Featured story */}
          <div style={{ gridArea: 'story1' }}>
            <article className="border-l-2 border-emerald-500 pl-6 dark:border-emerald-600">
              <h2 className="text-xl font-semibold">{featuredStory.title}</h2>
              <div className="mt-4 space-y-3 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                <p>{featuredStory.context}</p>
                <p>{featuredStory.role}</p>
                <p>{featuredStory.impact}</p>
              </div>
              <p className="mt-3 font-mono text-xs text-neutral-500">
                {featuredStory.evidence}
              </p>
            </article>
          </div>

          {/* Stories 02-03 */}
          {otherStories.map((story, i) => (
            <div key={i} style={{ gridArea: i === 0 ? 'story2' : 'story3' }}>
              <article className="rounded-sm bg-neutral-50 p-5 dark:bg-neutral-900">
                <h2 className="text-base font-semibold">{story.title}</h2>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  <p>{story.context}</p>
                  <p>{story.role}</p>
                  <p>{story.impact}</p>
                </div>
                <p className="mt-2 font-mono text-xs text-neutral-500">
                  {story.evidence}
                </p>
              </article>
            </div>
          ))}

          {/* Recommendations */}
          <div className="space-y-6" style={{ gridArea: 'recs' }}>
            {recommendations.map((rec) => (
              <div
                key={rec.slug}
                className="border-t border-neutral-200 pt-5 dark:border-neutral-800"
              >
                <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {rec.body}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Image
                    src={getRecommendationImage(rec.image)}
                    alt={rec.fullName}
                    className="h-6 w-6 rounded-full"
                  />
                  <span className="text-xs text-neutral-500">
                    {rec.fullName} · {rec.position}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Tech */}
          <div style={{ gridArea: 'tech' }}>
            <TechStack technologies={currentPublicRole.technologies} />
          </div>
        </div>

        {/* Tablet layout */}
        <div className="hidden md:block lg:hidden">
          {/* Hero full width */}
          <div className="border-b border-neutral-200 pb-8 dark:border-neutral-800">
            <div className="flex items-start gap-6">
              <Image
                src={portraitImage}
                alt={publicBasics.name}
                className="h-24 w-24 rounded-sm"
                priority
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  {publicBasics.name}
                </h1>
                <p className="mt-1 font-mono text-xs tracking-widest text-neutral-500 uppercase">
                  {publicBasics.label} · {totalPublicExperienceYears}+ years
                </p>
                <div className="mt-3 space-y-2 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {heroIntro.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
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
                <ProfileSocialLinks />
              </div>
            </div>
          </div>

          {/* Metrics horizontal 4-up */}
          <div className="grid grid-cols-4 gap-4 py-8">
            {homeImpactCards.map((card, i) => (
              <div key={i}>
                <p className="font-mono text-2xl font-bold">{card.value}</p>
                <p className="mt-1 text-[10px] tracking-widest text-neutral-500 uppercase">
                  {card.label}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{card.detail}</p>
              </div>
            ))}
          </div>

          {/* Stories */}
          <div className="space-y-8 py-8">
            <article className="border-l-2 border-emerald-500 pl-6 dark:border-emerald-600">
              <h2 className="text-xl font-semibold">{featuredStory.title}</h2>
              <div className="mt-3 space-y-2 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                <p>{featuredStory.context}</p>
                <p>{featuredStory.role}</p>
                <p>{featuredStory.impact}</p>
              </div>
              <p className="mt-2 font-mono text-xs text-neutral-500">
                {featuredStory.evidence}
              </p>
            </article>
            {otherStories.map((story, i) => (
              <article
                key={i}
                className="rounded-sm bg-neutral-50 p-5 dark:bg-neutral-900"
              >
                <h2 className="text-base font-semibold">{story.title}</h2>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  <p>{story.context}</p>
                  <p>{story.role}</p>
                  <p>{story.impact}</p>
                </div>
                <p className="mt-2 font-mono text-xs text-neutral-500">
                  {story.evidence}
                </p>
              </article>
            ))}
          </div>

          {/* Recs 2-column */}
          <div className="grid grid-cols-2 gap-6 py-8">
            {recommendations.map((rec) => (
              <div
                key={rec.slug}
                className="border-t border-neutral-200 pt-4 dark:border-neutral-800"
              >
                <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {rec.body}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Image
                    src={getRecommendationImage(rec.image)}
                    alt={rec.fullName}
                    className="h-6 w-6 rounded-full"
                  />
                  <span className="text-xs text-neutral-500">
                    {rec.fullName}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Tech */}
          <div className="py-8">
            <TechStack technologies={currentPublicRole.technologies} />
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden">
          {/* Hero */}
          <div className="border-b border-neutral-200 pb-8 dark:border-neutral-800">
            <div className="flex justify-center">
              <Image
                src={portraitImage}
                alt={publicBasics.name}
                className="h-24 w-24 rounded-sm"
                priority
              />
            </div>
            <h1 className="mt-4 text-center text-2xl font-bold tracking-tight">
              {publicBasics.name}
            </h1>
            <p className="mt-1 text-center font-mono text-xs tracking-widest text-neutral-500 uppercase">
              {publicBasics.label}
            </p>
            <div className="mt-4 space-y-3 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
              {heroIntro.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button href="/jonas-petrik-cv.pdf" variant="secondary">
                <DocumentIcon className="h-4 w-4" />
                Download CV
              </Button>
              <Button href={`mailto:${publicEmail}`} variant="secondary">
                <MailIcon className="h-4 w-4" />
                Email
              </Button>
            </div>
            <ProfileSocialLinks />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 py-8">
            {homeImpactCards.map((card, i) => (
              <div key={i}>
                <p className="font-mono text-2xl font-bold">{card.value}</p>
                <p className="mt-1 text-[10px] tracking-widest text-neutral-500 uppercase">
                  {card.label}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{card.detail}</p>
              </div>
            ))}
          </div>

          {/* Stories */}
          <div className="space-y-8 py-8">
            {selectedImpactStories.map((story, i) => (
              <article
                key={i}
                className={
                  i === 0
                    ? 'border-l-2 border-emerald-500 pl-4 dark:border-emerald-600'
                    : 'rounded-sm bg-neutral-50 p-4 dark:bg-neutral-900'
                }
              >
                <h2
                  className={`font-semibold ${i === 0 ? 'text-lg' : 'text-base'}`}
                >
                  {story.title}
                </h2>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  <p>{story.context}</p>
                  <p>{story.role}</p>
                  <p>{story.impact}</p>
                </div>
                <p className="mt-2 font-mono text-xs text-neutral-500">
                  {story.evidence}
                </p>
              </article>
            ))}
          </div>

          {/* Recs */}
          <div className="space-y-6 py-8">
            {recommendations.map((rec) => (
              <div
                key={rec.slug}
                className="border-t border-neutral-200 pt-4 dark:border-neutral-800"
              >
                <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {rec.body}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Image
                    src={getRecommendationImage(rec.image)}
                    alt={rec.fullName}
                    className="h-6 w-6 rounded-full"
                  />
                  <span className="text-xs text-neutral-500">
                    {rec.fullName}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Tech */}
          <div className="py-8">
            <TechStack technologies={currentPublicRole.technologies} />
          </div>
        </div>
      </div>
    </div>
  )
}
