import { type Metadata } from 'next'
import Link from 'next/link'

import { Button, CodeFileIcon, DownloadIcon } from '@/components/Button'
import { Container } from '@/components/Container'
import { TerminalPageHeader } from '@/components/TerminalHeader'
import { calculateTotalExperienceYears } from '@/lib/experience'
import {
  cvSummary,
  publicBasics,
  publicEmail,
  publicProfileLinks,
  publicWork,
  selectedImpactStories,
} from '@/lib/siteProfile'

export const metadata: Metadata = {
  title: 'CV',
  description:
    'Recruiter-friendly CV for Jonas Petrik covering backend, platform reliability, checkout systems, and engineering leadership.',
  alternates: {
    canonical: '/cv',
  },
}

const totalExperienceYears = calculateTotalExperienceYears(publicWork)

function formatMonth(date: string) {
  if (date === 'now') return 'Present'

  return new Date(`${date}-01T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function WorkEntry({
  role,
}: {
  role: (typeof publicWork)[number]
}) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-5 print:break-inside-avoid dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {role.position}
          </h2>
          <p className="text-sm text-neutral-700 dark:text-neutral-200">
            {role.name}
          </p>
        </div>
        <div className="text-sm text-neutral-600 dark:text-neutral-300 sm:text-right">
          <p>
            {formatMonth(role.startDate)} - {formatMonth(role.endDate)}
          </p>
          {role.location ? <p>{role.location}</p> : null}
        </div>
      </div>

      {role.scope ? (
        <p className="mt-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
          {role.scope}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
            highlights
          </h3>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
            {role.highlights.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-emerald-600 dark:text-emerald-400">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
            scope
          </h3>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
            {role.responsibilities.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-neutral-500 dark:text-neutral-400">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
        {role.technologies.join(' · ')}
      </p>
    </article>
  )
}

export default function CvPage() {
  return (
    <Container className="mt-10 sm:mt-16 print:mt-0">
      <div className="print:hidden">
        <TerminalPageHeader
          command="cat"
          argument="jonas-petrik-cv.md"
          description="Recruiter-friendly summary"
        />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white/95 p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/95 print:border-none print:bg-white print:p-0 print:shadow-none">
        <div className="flex flex-col gap-6 border-b border-neutral-200 pb-6 print:gap-4 dark:border-neutral-700">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                {publicBasics.label}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {publicBasics.name}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-neutral-700 dark:text-neutral-200">
                {cvSummary}
              </p>
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                {totalExperienceYears}+ years of experience · Based in{' '}
                {publicBasics.location}
              </p>
            </div>

            <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
              <Link
                href={`mailto:${publicEmail}`}
                className="block hover:text-emerald-700 print:hidden dark:hover:text-emerald-300"
              >
                {publicEmail}
              </Link>
              <p className="hidden print:block">{publicEmail}</p>
              {publicProfileLinks.map((profile) => (
                <Link
                  key={profile.href}
                  href={profile.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-emerald-700 print:hidden dark:hover:text-emerald-300"
                >
                  {profile.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 print:hidden">
            <Button href="/jonas-petrik-cv.pdf" variant="secondary">
              <DownloadIcon className="h-4 w-4" />
              download PDF
            </Button>
            <Button href="/resume.json" variant="secondary">
              <CodeFileIcon className="h-4 w-4" />
              view JSON resume
            </Button>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
            selected impact
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {selectedImpactStories.map((story) => (
              <article
                key={story.title}
                className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 print:break-inside-avoid dark:border-neutral-700 dark:bg-neutral-950/60"
              >
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {story.title}
                </h3>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                  <p>{story.context}</p>
                  <p>{story.role}</p>
                  <p>{story.impact}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
            experience
          </h2>
          <div className="mt-4 space-y-4">
            {publicWork.map((role) => (
              <WorkEntry key={`${role.name}-${role.position}-${role.startDate}`} role={role} />
            ))}
          </div>
        </section>

        <section className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-700">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
            education
          </h2>
          <div className="mt-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              Vilniaus Universitetas
            </p>
            <p>Bachelor&apos;s degree in Software Engineering</p>
            <p className="text-neutral-600 dark:text-neutral-300">2011 - 2015</p>
          </div>
        </section>
      </div>
    </Container>
  )
}
