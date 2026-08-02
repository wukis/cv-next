import Image from 'next/image'

import { Button, DocumentIcon, MailIcon } from '@/components/Button'
import { ProfileSocialLinks } from '@/components/ProfileSocialLinks'
import { TechStack } from '@/components/TechStack'
import portraitImage from '@/images/jonas-petrik-portrait.png'
import { getRecommendationImage } from '@/lib/imageAssets'
import { type RecommendationInterface } from '@/lib/recommendations'
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

const storyRecPairs = [
  { storyIndex: 0, recSlugs: ['daniel-motzev', 'simon-sattes'] },
  { storyIndex: 1, recSlugs: ['martin-will', 'roman-iudin'] },
  { storyIndex: 2, recSlugs: ['andrei-lungu', 'osman-turan'] },
]

export default function NarrativeVariant() {
  const recommendations = getHomepageRecommendations()
  const recBySlug = new Map(recommendations.map((r) => [r.slug, r]))

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        {/* Desktop: main + sticky sidebar */}
        <div className="hidden gap-12 lg:grid lg:grid-cols-[1fr_20rem]">
          {/* Sidebar */}
          <div className="order-2">
            <div className="sticky top-8">
              <div className="rounded-sm border-l border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex flex-col items-center text-center">
                  <Image
                    src={portraitImage}
                    alt={publicBasics.name}
                    className="h-24 w-24 rounded-sm"
                    priority
                  />
                  <h1 className="mt-3 text-xl font-bold">
                    {publicBasics.name}
                  </h1>
                  <p className="mt-1 font-mono text-xs tracking-widest text-neutral-500 uppercase">
                    {publicBasics.label}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-sm bg-emerald-50 px-2 py-0.5 font-mono text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    {totalPublicExperienceYears}+ years experience
                  </p>
                </div>

                {/* Metrics 2x2 */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {homeImpactCards.map((card, i) => (
                    <div key={i} className="text-center">
                      <p className="font-mono text-lg font-bold">
                        {card.value}
                      </p>
                      <p className="text-[10px] tracking-widest text-neutral-500 uppercase">
                        {card.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="mt-6 flex flex-col gap-2">
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

          {/* Main column */}
          <div className="order-1">
            {/* Intro */}
            <div className="space-y-4 text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
              {heroIntro.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* Story + Evidence blocks */}
            {storyRecPairs.map((pair, blockIndex) => {
              const story = selectedImpactStories[pair.storyIndex]
              if (!story) return null
              const pairedRecs = pair.recSlugs
                .map((slug) => recBySlug.get(slug))
                .filter((r): r is RecommendationInterface => r !== undefined)

              return (
                <div
                  key={blockIndex}
                  className="mt-12 border-t border-neutral-200 pt-12 dark:border-neutral-800"
                >
                  {/* Story */}
                  <article>
                    <h2 className="text-xl font-semibold">{story.title}</h2>
                    <div className="mt-4 space-y-3 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                      <p>{story.context}</p>
                      <p>{story.role}</p>
                      <p>{story.impact}</p>
                    </div>
                    <p className="mt-3 font-mono text-xs text-neutral-500">
                      {story.evidence}
                    </p>
                  </article>

                  {/* Corroborating recommendations */}
                  <div className="mt-8 space-y-6 border-l-2 border-neutral-200 pl-6 dark:border-neutral-800">
                    {pairedRecs.map((rec) => (
                      <div key={rec.slug}>
                        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                          {rec.body}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Image
                            src={getRecommendationImage(rec.image)}
                            alt={rec.fullName}
                            className="h-6 w-6 rounded-full"
                          />
                          <span className="text-xs text-neutral-500">
                            {rec.fullName}, {rec.position}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Tech */}
            <div className="mt-12 border-t border-neutral-200 pt-12 dark:border-neutral-800">
              <TechStack technologies={currentPublicRole.technologies} />
            </div>
          </div>
        </div>

        {/* Tablet layout */}
        <div className="hidden md:block lg:hidden">
          {/* Sticky summary bar */}
          <div className="sticky top-0 z-10 -mx-6 border-b border-neutral-200 bg-white/95 px-6 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
            <div className="flex items-center gap-4">
              <Image
                src={portraitImage}
                alt={publicBasics.name}
                className="h-10 w-10 rounded-sm"
                priority
              />
              <div className="flex-1">
                <p className="font-semibold">{publicBasics.name}</p>
                <p className="font-mono text-xs text-neutral-500">
                  {publicBasics.label} · {totalPublicExperienceYears}+ yrs
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  href="/jonas-petrik-cv.pdf"
                  variant="secondary"
                  className="text-xs"
                >
                  CV
                </Button>
                <Button
                  href={`mailto:${publicEmail}`}
                  variant="secondary"
                  className="text-xs"
                >
                  Email
                </Button>
              </div>
            </div>
          </div>

          {/* Hero content */}
          <div className="pt-8">
            <div className="flex items-start gap-6">
              <Image
                src={portraitImage}
                alt={publicBasics.name}
                className="h-24 w-24 rounded-sm"
              />
              <div>
                <h1 className="text-2xl font-bold">{publicBasics.name}</h1>
                <p className="mt-1 font-mono text-xs tracking-widest text-neutral-500 uppercase">
                  {publicBasics.label}
                </p>
                <ProfileSocialLinks />
              </div>
            </div>

            {/* Metrics row */}
            <div className="mt-6 grid grid-cols-4 gap-4">
              {homeImpactCards.map((card, i) => (
                <div key={i} className="text-center">
                  <p className="font-mono text-lg font-bold">{card.value}</p>
                  <p className="text-[10px] tracking-widest text-neutral-500 uppercase">
                    {card.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Intro */}
            <div className="mt-8 space-y-4 text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
              {heroIntro.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* Story blocks */}
            {storyRecPairs.map((pair, blockIndex) => {
              const story = selectedImpactStories[pair.storyIndex]
              if (!story) return null
              const pairedRecs = pair.recSlugs
                .map((slug) => recBySlug.get(slug))
                .filter((r): r is RecommendationInterface => r !== undefined)

              return (
                <div
                  key={blockIndex}
                  className="mt-10 border-t border-neutral-200 pt-10 dark:border-neutral-800"
                >
                  <article>
                    <h2 className="text-xl font-semibold">{story.title}</h2>
                    <div className="mt-4 space-y-3 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                      <p>{story.context}</p>
                      <p>{story.role}</p>
                      <p>{story.impact}</p>
                    </div>
                    <p className="mt-3 font-mono text-xs text-neutral-500">
                      {story.evidence}
                    </p>
                  </article>
                  <div className="mt-6 space-y-6 border-l-2 border-neutral-200 pl-6 dark:border-neutral-800">
                    {pairedRecs.map((rec) => (
                      <div key={rec.slug}>
                        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                          {rec.body}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Image
                            src={getRecommendationImage(rec.image)}
                            alt={rec.fullName}
                            className="h-6 w-6 rounded-full"
                          />
                          <span className="text-xs text-neutral-500">
                            {rec.fullName}, {rec.position}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            <div className="mt-10 border-t border-neutral-200 pt-10 dark:border-neutral-800">
              <TechStack technologies={currentPublicRole.technologies} />
            </div>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden">
          {/* Hero */}
          <div className="flex flex-col items-center text-center">
            <Image
              src={portraitImage}
              alt={publicBasics.name}
              className="h-24 w-24 rounded-sm"
              priority
            />
            <h1 className="mt-3 text-2xl font-bold">{publicBasics.name}</h1>
            <p className="mt-1 font-mono text-xs tracking-widest text-neutral-500 uppercase">
              {publicBasics.label}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-sm bg-emerald-50 px-2 py-0.5 font-mono text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              {totalPublicExperienceYears}+ years experience
            </p>
          </div>

          {/* Metrics 2x2 */}
          <div className="mt-6 grid grid-cols-2 gap-4 text-center">
            {homeImpactCards.map((card, i) => (
              <div key={i}>
                <p className="font-mono text-lg font-bold">{card.value}</p>
                <p className="text-[10px] tracking-widest text-neutral-500 uppercase">
                  {card.label}
                </p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-col gap-2">
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

          {/* Intro */}
          <div className="mt-8 space-y-4 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
            {heroIntro.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {/* Story + Evidence blocks */}
          {storyRecPairs.map((pair, blockIndex) => {
            const story = selectedImpactStories[pair.storyIndex]
            if (!story) return null
            const pairedRecs = pair.recSlugs
              .map((slug) => recBySlug.get(slug))
              .filter((r): r is RecommendationInterface => r !== undefined)

            return (
              <div
                key={blockIndex}
                className="mt-10 border-t border-neutral-200 pt-10 dark:border-neutral-800"
              >
                <article>
                  <h2 className="text-lg font-semibold">{story.title}</h2>
                  <div className="mt-3 space-y-3 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                    <p>{story.context}</p>
                    <p>{story.role}</p>
                    <p>{story.impact}</p>
                  </div>
                  <p className="mt-3 font-mono text-xs text-neutral-500">
                    {story.evidence}
                  </p>
                </article>
                <div className="mt-6 space-y-6 border-l-2 border-neutral-200 pl-6 dark:border-neutral-800">
                  {pairedRecs.map((rec) => (
                    <div key={rec.slug}>
                      <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {rec.body}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Image
                          src={getRecommendationImage(rec.image)}
                          alt={rec.fullName}
                          className="h-6 w-6 rounded-full"
                        />
                        <span className="text-xs text-neutral-500">
                          {rec.fullName}, {rec.position}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="mt-10 border-t border-neutral-200 pt-10 dark:border-neutral-800">
            <TechStack technologies={currentPublicRole.technologies} />
          </div>
        </div>
      </div>
    </div>
  )
}
