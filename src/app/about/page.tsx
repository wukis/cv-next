import { type Metadata } from 'next'
import Image from 'next/image'

import { Container } from '@/components/Container'
import { Button, DocumentIcon, MailIcon } from '@/components/Button'
import { ProfileSocialLinks } from '@/components/ProfileSocialLinks'
import { TerminalPageHeader } from '@/components/TerminalHeader'
import { TechStack } from '@/components/TechStack'
import portraitImage from '@/images/jonas-petrik-portrait-2.jpg'
import {
  aboutNarrative,
  currentPublicRole,
  publicBasics,
  publicEmail,
  publicLocationSummary,
  totalPublicExperienceYears,
} from '@/lib/siteProfile'

const howIWork = [
  'Stay close to production and use incidents, alerts, and failure modes as design feedback.',
  'Prefer simple systems with clear ownership over clever systems that are hard to reason about.',
  'Keep leadership hands-on so architecture, delivery, and operational quality move together.',
] as const

const systemExperience = [
  {
    label: 'Real-time betting',
    detail:
      'Worked on betting systems where correctness, speed, and financial safety mattered more than presentation.',
  },
  {
    label: 'Warehouse and logistics',
    detail:
      'Built warehouse workflows and shipping integrations for automotive e-commerce, including DHL, DPD, and UPS.',
  },
  {
    label: 'Startup product work',
    detail:
      'Helped take Atobi from an early startup product into a more mature engineering setup while the team scaled.',
  },
  {
    label: 'Search-heavy systems',
    detail:
      'Rebuilt search for anwalt.de with GraphQL, geolocation, aggregations, and range filters for millions of monthly users.',
  },
  {
    label: 'High-load commerce',
    detail:
      'Now focused on checkout at SCAYLE, where reliability and operational quality matter under heavy traffic and peak events.',
  },
] as const

const earlyEngineeringStory = [
  'My interest in engineering started early, when the mobile web still felt experimental. I built WML pages back when phones were only beginning to browse the internet, and I learned by working inside tight technical limits.',
  'Later I built a text-based game in PHP4 with SMS payments. Watching mobile operators take roughly 50% of the revenue was frustrating, but it also made the business side of software very real to me. That project is a big part of why I chose to pursue software engineering professionally.',
] as const

export const metadata: Metadata = {
  title: 'About',
  description:
    'Background and working style of Jonas Petrik, a staff engineer focused on backend systems, platform reliability, and high-availability commerce.',
  alternates: {
    canonical: '/about',
  },
}

export default function About() {
  return (
    <Container className="mt-10 sm:mt-16">
      <TerminalPageHeader
        command="cat"
        argument="about.md"
        description="A deeper look into who I am"
      />

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white/95 dark:border-neutral-700 dark:bg-neutral-900/95">
        <div className="flex h-6 items-center gap-2 border-b border-neutral-300 bg-neutral-100 px-4 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="truncate font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
            ~/about.md
          </span>
        </div>

        <div className="p-5 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="space-y-8">
              <div className="border-b border-neutral-200 pb-8 dark:border-neutral-700">
                <div className="mx-auto aspect-[4/4.4] w-full max-w-[9rem] overflow-hidden rounded-xl shadow-lg ring-4 ring-white sm:max-w-[14rem] dark:ring-neutral-800">
                  <Image
                    src={portraitImage}
                    alt="Jonas Petrik - Staff Engineer and Team Lead"
                    sizes="(min-width: 1024px) 14rem, (min-width: 640px) 14rem, 9rem"
                    className="h-full w-full object-cover"
                    priority={false}
                  />
                </div>

                <ProfileSocialLinks />

                <div className="mt-5">
                  <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    {publicBasics.label}
                  </div>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                    {publicBasics.name}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                    {publicLocationSummary}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                    {totalPublicExperienceYears}+ years across backend, platform,
                    search, and engineering leadership.
                  </p>
                </div>
              </div>

              <section className="border-b border-neutral-200 pb-8 dark:border-neutral-700">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-300">
                  current role
                </h3>
                <p className="mt-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {currentPublicRole.position}
                </p>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-200">
                  {currentPublicRole.name}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                  {currentPublicRole.scope}
                </p>
              </section>

              <section className="border-b border-neutral-200 pb-8 dark:border-neutral-700">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-300">
                  how I work
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                  {howIWork.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-neutral-400 dark:bg-neutral-500" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <p className="mb-4 text-sm text-neutral-700 dark:text-neutral-200">
                  If you want a cleaner summary of experience or prefer to reach
                  out directly, both are available here.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    href="/cv"
                    variant="secondary"
                    className="rounded-lg border border-neutral-300 bg-neutral-100 font-mono text-sm text-neutral-800 hover:border-emerald-300 hover:text-emerald-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-emerald-700 dark:hover:text-emerald-200"
                  >
                    <DocumentIcon className="h-4 w-4" />
                    view CV
                  </Button>
                  <Button
                    href={`mailto:${publicEmail}`}
                    variant="secondary"
                    className="rounded-lg border border-emerald-300 bg-emerald-50 font-mono text-sm text-emerald-900 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/70"
                  >
                    <MailIcon className="h-4 w-4" />
                    email
                  </Button>
                </div>
              </section>
            </aside>

            <div className="space-y-10">
              <section>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-300">
                  background
                </h3>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 sm:text-base">
                  {aboutNarrative.slice(0, 2).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>

              <section className="border-t border-neutral-200 pt-8 dark:border-neutral-700">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-300">
                  how it started
                </h3>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 sm:text-base">
                  {earlyEngineeringStory.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>

              <section className="border-t border-neutral-200 pt-8 dark:border-neutral-700">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-300">
                  current focus
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 sm:text-base">
                  Right now my work is centered on checkout reliability,
                  observability, and the operational quality of
                  payment-critical flows. That means staying close to incidents,
                  understanding where the system becomes hard to reason about,
                  and fixing the parts that create avoidable noise for the team.
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                  {currentPublicRole.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-neutral-400 dark:bg-neutral-500" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="border-t border-neutral-200 pt-8 dark:border-neutral-700">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-300">
                  different kinds of systems
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 sm:text-base">
                  A big part of my experience comes from working on systems
                  built for very different purposes. I have not stayed inside
                  one product category, and that range changed how I think
                  about tradeoffs, risk, and what good engineering looks like
                  in different environments.
                </p>
                <div className="mt-5 space-y-3">
                  {systemExperience.map((item) => (
                    <article
                      key={item.label}
                      className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-800/40"
                    >
                      <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {item.label}:
                        </span>{' '}
                        {item.detail}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="border-t border-neutral-200 pt-8 dark:border-neutral-700">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-300">
                  what matters to me
                </h3>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 sm:text-base">
                  {aboutNarrative.slice(2).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>

        <TechStack
          technologies={currentPublicRole.technologies}
          tone="plain"
          contentId="about-tech-stack"
        />
      </div>
    </Container>
  )
}
