import { type Metadata } from 'next'
import Link from 'next/link'

import { Button, CodeFileIcon, DownloadIcon } from '@/components/Button'
import { Container } from '@/components/Container'
import { TerminalPageHeader } from '@/components/TerminalHeader'
import {
  calculateTotalExperienceYears,
  type WorkInterface,
} from '@/lib/experience'
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

function dedupeItems(items: string[]) {
  const seen = new Set<string>()
  const uniqueItems: string[] = []

  for (const item of items) {
    const normalized = item.trim().toLowerCase()
    if (!normalized || seen.has(normalized)) continue

    seen.add(normalized)
    uniqueItems.push(item)
  }

  return uniqueItems
}

type WorkGroup = {
  company: string
  roles: WorkInterface[]
  startDate: string
  endDate: string
  technologies: string[]
}

function groupRolesByCompany(work: WorkInterface[]) {
  const groups: WorkGroup[] = []

  for (const role of work) {
    const currentGroup = groups[groups.length - 1]

    if (currentGroup && currentGroup.company === role.name) {
      currentGroup.roles.push(role)
      currentGroup.startDate = role.startDate
      currentGroup.technologies = dedupeItems([
        ...currentGroup.technologies,
        ...role.technologies,
      ])
      continue
    }

    groups.push({
      company: role.name,
      roles: [role],
      startDate: role.startDate,
      endDate: role.endDate,
      technologies: [...role.technologies],
    })
  }

  return groups
}

function getSharedLocation(roles: WorkInterface[]) {
  const locations = dedupeItems(
    roles.map((role) => role.location ?? '').filter(Boolean),
  )

  return locations.length === 1 ? locations[0] : null
}

function getRoleProgression(roles: WorkInterface[]) {
  return [...roles]
    .reverse()
    .map((role) => role.position)
    .join(' -> ')
}

const groupedPublicWork = groupRolesByCompany(publicWork)

function CompanyWorkEntry({ company }: { company: WorkGroup }) {
  const sharedLocation = getSharedLocation(company.roles)
  const hasPromotion = company.roles.length > 1

  return (
    <article className="cv-company-card rounded-sm border border-neutral-200/70 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 print:break-inside-avoid print:p-3.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 print:text-[16px]">
            {company.company}
          </h2>
          {hasPromotion ? (
            <>
              <p className="mt-1 font-mono text-[11px] tracking-[0.18em] text-emerald-700 uppercase dark:text-emerald-300">
                promoted internally
              </p>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 print:mt-1 print:text-[12px]">
                {getRoleProgression(company.roles)}
              </p>
            </>
          ) : null}
        </div>
        <div className="text-sm text-neutral-600 sm:text-right dark:text-neutral-300 print:text-[12px]">
          <p>
            {formatMonth(company.startDate)} - {formatMonth(company.endDate)}
          </p>
          {sharedLocation ? <p>{sharedLocation}</p> : null}
        </div>
      </div>

      <div className="mt-5 space-y-5 print:mt-3 print:space-y-3">
        {company.roles.map((role, index) => (
          <section
            key={`${role.position}-${role.startDate}`}
            className={[
              'cv-role-section print:break-inside-avoid',
              index > 0
                ? 'border-t border-neutral-200 pt-5 dark:border-neutral-700 print:pt-3'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 print:text-[14px]">
                  {role.position}
                </h3>
              </div>
              <div className="text-sm text-neutral-600 sm:text-right dark:text-neutral-300 print:text-[12px]">
                <p>
                  {formatMonth(role.startDate)} - {formatMonth(role.endDate)}
                </p>
                {!sharedLocation && role.location ? (
                  <p>{role.location}</p>
                ) : null}
              </div>
            </div>

            {role.scope ? (
              <p className="mt-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 print:mt-2.5 print:text-[12px] print:leading-[1.35]">
                {role.scope}
              </p>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 print:mt-2.5 print:gap-2.5">
              <div>
                <h4 className="font-mono text-[11px] tracking-[0.2em] text-neutral-500 uppercase dark:text-neutral-400">
                  highlights
                </h4>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 print:mt-1 print:space-y-1 print:text-[12px] print:leading-[1.3]">
                  {role.highlights.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        -
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-mono text-[11px] tracking-[0.2em] text-neutral-500 uppercase dark:text-neutral-400">
                  scope
                </h4>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 print:mt-1 print:space-y-1 print:text-[12px] print:leading-[1.3]">
                  {role.responsibilities.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-neutral-500 dark:text-neutral-400">
                        -
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 print:mt-2.5 print:text-[9px] print:leading-[1.2]">
        {company.technologies.join(' · ')}
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

      <div className="rounded-sm border border-neutral-200/70 bg-white/95 p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-950/95 print:border-none print:bg-white print:p-0 print:shadow-none">
        <div className="flex flex-col gap-6 border-b border-neutral-200 pb-6 dark:border-neutral-700 print:gap-3 print:pb-3">
          <div className="hidden border-b border-neutral-200 pb-4 dark:border-neutral-700 print:block print:pb-2.5">
            <div className="grid grid-cols-2 gap-4 text-sm text-neutral-700 print:gap-2 print:text-[12px]">
              <div>
                <p className="font-mono text-[11px] tracking-[0.2em] text-neutral-500 uppercase">
                  email
                </p>
                <p className="mt-1">{publicEmail}</p>
              </div>
              <div>
                <p className="font-mono text-[11px] tracking-[0.2em] text-neutral-500 uppercase">
                  portfolio
                </p>
                <p className="mt-1">{publicBasics.url}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-mono text-[11px] tracking-[0.2em] text-neutral-500 uppercase dark:text-neutral-400">
                {publicBasics.label}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 print:mt-1 print:text-[26px]">
                {publicBasics.name}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-neutral-700 dark:text-neutral-200 print:mt-1.5 print:text-[13px] print:leading-[1.35]">
                {cvSummary}
              </p>
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 print:mt-1.5 print:text-[12px]">
                {totalExperienceYears}+ years of experience · Based in{' '}
                {publicBasics.location}
              </p>
            </div>

            <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-200 print:hidden">
              <Link
                href={`mailto:${publicEmail}`}
                className="block hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                {publicEmail}
              </Link>
              <Link
                href={publicBasics.url}
                className="block hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                {publicBasics.url}
              </Link>
              {publicProfileLinks.map((profile) => (
                <Link
                  key={profile.href}
                  href={profile.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  {profile.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 print:hidden">
            <Button
              href="/jonas-petrik-cv.pdf"
              variant="secondary"
              className="rounded-sm border border-emerald-300 bg-neutral-50 font-mono text-emerald-900 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-neutral-900/50 dark:text-emerald-100 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/70"
            >
              <DownloadIcon className="h-4 w-4" />
              download PDF
            </Button>
            <Button
              href="/resume.json"
              variant="secondary"
              className="rounded-sm border border-neutral-300 bg-neutral-50 font-mono text-neutral-900 hover:border-emerald-300 hover:text-emerald-800 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 dark:hover:border-emerald-700 dark:hover:text-emerald-200"
            >
              <CodeFileIcon className="h-4 w-4" />
              view JSON resume
            </Button>
          </div>
        </div>

        <section className="mt-8 print:mt-5">
          <h2 className="font-mono text-[11px] tracking-[0.2em] text-neutral-500 uppercase dark:text-neutral-400">
            selected impact
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3 print:mt-2.5 print:gap-2">
            {selectedImpactStories.map((story) => (
              <article
                key={story.title}
                className="rounded-sm border border-neutral-200/70 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/60 print:break-inside-avoid print:p-2.5"
              >
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 print:text-[14px]">
                  {story.title}
                </h3>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 print:mt-1.5 print:space-y-1 print:text-[12px] print:leading-[1.3]">
                  <p>{story.context}</p>
                  <p>{story.role}</p>
                  <p>{story.impact}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 print:mt-5">
          <h2 className="font-mono text-[11px] tracking-[0.2em] text-neutral-500 uppercase dark:text-neutral-400 print:hidden">
            experience
          </h2>
          <div className="mt-4 space-y-4 print:mt-2.5 print:space-y-2.5">
            {groupedPublicWork.map((company) => (
              <CompanyWorkEntry
                key={`${company.company}-${company.startDate}`}
                company={company}
              />
            ))}
          </div>
        </section>

        <section className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-700 print:mt-5 print:pt-3">
          <h2 className="font-mono text-[11px] tracking-[0.2em] text-neutral-500 uppercase dark:text-neutral-400">
            education
          </h2>
          <div className="mt-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 print:mt-2.5 print:text-[12px] print:leading-[1.3]">
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              Vilniaus Universitetas
            </p>
            <p>Bachelor&apos;s degree in Software Engineering</p>
            <p className="text-neutral-600 dark:text-neutral-300">
              2011 - 2015
            </p>
          </div>
        </section>
      </div>
    </Container>
  )
}
