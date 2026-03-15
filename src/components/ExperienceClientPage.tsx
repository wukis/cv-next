import React from 'react'

import { Button, DocumentIcon } from '@/components/Button'
import { Container } from '@/components/Container'
import { TechStack } from '@/components/TechStack'
import { TerminalPageHeader } from '@/components/TerminalHeader'
import { EducationInterface, WorkInterface } from '@/lib/experience'
import { profileContent } from '@/lib/profileContent'
import Image from 'next/image'

const getDuration = (
  startDate: string,
  endDate: string,
): { years: number; months: number } => {
  const start = new Date(startDate)
  const end = endDate === 'now' ? new Date() : new Date(endDate)

  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth() + 1

  if (months >= 12) {
    years += 1
    months -= 12
  } else if (months < 0) {
    years -= 1
    months += 12
  }

  return { years, months }
}

const formatDuration = (duration: {
  years: number
  months: number
}): string => {
  const { years, months } = duration
  let formatted = ''
  if (years > 0) {
    formatted += `${years} yr`
  }
  if (months > 0) {
    if (formatted) formatted += ' '
    formatted += `${months} mo`
  }
  return formatted || '0 mo'
}

const getCompanyDuration = (experiences: WorkInterface[]) => {
  const startDates = experiences.map((exp) => new Date(exp.startDate).getTime())
  const endDates = experiences.map((exp) =>
    exp.endDate === 'now'
      ? new Date().getTime()
      : new Date(exp.endDate).getTime(),
  )

  const earliestStartDate = new Date(Math.min(...startDates))
  const latestEndDate = new Date(Math.max(...endDates))

  return {
    startDate: earliestStartDate,
    endDate: latestEndDate,
  }
}

const groupWorkExperiences = (workExperiences: WorkInterface[]) => {
  return workExperiences.reduce(
    (acc, experience) => {
      const { name, startDate, endDate } = experience
      if (!acc[name]) {
        acc[name] = {
          company: name,
          url: experience.url,
          location: experience.location ?? '',
          image: experience.image,
          experiences: [],
          totalDuration: { years: 0, months: 0 },
          startDate: new Date(startDate),
          endDate: endDate === 'now' ? new Date() : new Date(endDate),
        }
      }
      acc[name].experiences.push(experience)

      const experienceDuration = getDuration(startDate, endDate)
      acc[name].totalDuration.years += experienceDuration.years
      acc[name].totalDuration.months += experienceDuration.months

      if (acc[name].totalDuration.months >= 12) {
        acc[name].totalDuration.years += Math.floor(
          acc[name].totalDuration.months / 12,
        )
        acc[name].totalDuration.months = acc[name].totalDuration.months % 12
      }

      const companyDuration = getCompanyDuration(acc[name].experiences)
      acc[name].startDate = companyDuration.startDate
      acc[name].endDate = companyDuration.endDate

      return acc
    },
    {} as Record<
      string,
      {
        company: string
        url: string
        location: string
        image: string
        experiences: WorkInterface[]
        totalDuration: { years: number; months: number }
        startDate: Date
        endDate: Date
      }
    >,
  )
}

const calculateTotalExperience = (
  groupedWorkExperiences: Record<
    string,
    { totalDuration: { years: number; months: number } }
  >,
) => {
  return Object.values(groupedWorkExperiences).reduce(
    (acc, { totalDuration }) => {
      acc.years += totalDuration.years
      acc.months += totalDuration.months
      return acc
    },
    { years: 0, months: 0 },
  )
}

const groupedWorkExperiences = groupWorkExperiences(profileContent.work)
const totalExperience = calculateTotalExperience(groupedWorkExperiences)
const totalExperienceYears =
  totalExperience.years + Math.floor(totalExperience.months / 12)

// Get diff between two arrays (what's new in arr1 compared to arr2)
const getNewItems = (current: string[], previous: string[]): string[] => {
  const previousSet = new Set(previous.map((item) => item.toLowerCase().trim()))
  return current.filter((item) => !previousSet.has(item.toLowerCase().trim()))
}

// Get all unique items from multiple arrays
const getAllUniqueItems = (arrays: string[][]): string[] => {
  const seen = new Set<string>()
  const result: string[] = []
  arrays.forEach((arr) => {
    arr.forEach((item) => {
      const key = item.toLowerCase().trim()
      if (!seen.has(key)) {
        seen.add(key)
        result.push(item)
      }
    })
  })
  return result
}

// Get what's new in this role compared to previous
const getPromotionDiff = (
  current: WorkInterface,
  previous: WorkInterface | null,
) => {
  if (!previous) {
    return {
      newResponsibilities: current.responsibilities,
      inheritedResponsibilities: [],
    }
  }

  const newResponsibilities = getNewItems(
    current.responsibilities,
    previous.responsibilities,
  )
  const inheritedResponsibilities = current.responsibilities.filter(
    (item) => !newResponsibilities.includes(item),
  )

  return {
    newResponsibilities,
    inheritedResponsibilities,
  }
}

// Promotion diff display component
function PromotionDiff({
  newItems,
  label,
}: {
  newItems: string[]
  label: string
}) {
  if (newItems.length === 0) return null

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-sky-700 dark:text-sky-300">
          +{newItems.length} {label}
        </span>
      </div>
      <div className="space-y-1.5 border-l-2 border-sky-200 pl-2 dark:border-sky-900/70">
        {newItems.map((item, i) => (
          <div key={i} className="flex items-baseline gap-2 text-sm">
            <span className="flex-shrink-0 select-none font-mono text-sky-600 dark:text-sky-400">
              +
            </span>
            <span className="text-neutral-700 dark:text-neutral-200">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Highlights display component
function RoleHighlights({ highlights }: { highlights: string[] }) {
  if (highlights.length === 0) return null

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300">
          <svg
            className="mr-1 inline h-2.5 w-2.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          highlights
        </span>
      </div>
      <div className="space-y-1.5 border-l-2 border-amber-200 pl-2 dark:border-amber-900/70">
        {highlights.map((item, i) => (
          <div key={i} className="flex items-baseline gap-2 text-sm">
            <span className="flex-shrink-0 select-none font-mono text-amber-600 dark:text-amber-400">
              ★
            </span>
            <span className="text-neutral-700 dark:text-neutral-300">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Company-level projects display
function CompanyProjects({
  projects,
}: {
  projects: string[]
}) {
  if (projects.length === 0) return null

  return (
    <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
      <div className="mb-2 flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        Projects
      </div>
      <div className="space-y-1.5 border-l border-neutral-200 pl-3 dark:border-neutral-700">
        {projects.map((item, i) => (
          <div key={i} className="flex items-baseline gap-2 text-sm">
            <span className="flex-shrink-0 select-none font-mono text-neutral-400 dark:text-neutral-500">
              -
            </span>
            <span className="text-neutral-700 dark:text-neutral-200">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Education({
  education,
  isLast,
}: {
  education: EducationInterface
  isLast: boolean
}) {
  const duration = getDuration(education.startDate, education.endDate)

  return (
    <div className="group relative flex gap-4 pb-6 sm:gap-6 sm:pb-8">
      {/* Timeline column - hidden on mobile */}
      <div className="relative hidden flex-col items-center sm:flex">
        {/* Vertical line */}
        {!isLast && (
          <div className="absolute bottom-0 top-6 w-px bg-amber-200 dark:bg-amber-900/80" />
        )}

        <div className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center">
          <div className="absolute inset-[1px] rounded-full ring-2 ring-amber-200/80 dark:ring-amber-900/70" />
          <div className="relative h-3.5 w-3.5 rounded-full bg-amber-300/65 ring-2 ring-white opacity-75 dark:bg-amber-200/35 dark:ring-neutral-900" />
        </div>
      </div>

      <div className="min-w-0 flex-1 sm:-mt-1">
        <div
          className="overflow-hidden rounded-lg border border-neutral-200 bg-white/90 transition-all duration-300 dark:border-neutral-700 dark:bg-neutral-900/90 group-hover:shadow-lg"
        >
          <div className="flex h-6 items-center justify-between gap-2 border-b border-neutral-300 bg-neutral-100 px-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="hidden truncate font-mono text-[10px] text-neutral-700 sm:block dark:text-neutral-100">
              ~/education/
              {education.studyType.toLowerCase().replace(/\s+/g, '-')}.md
            </span>
            <div className="flex items-center gap-1 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                />
              </svg>
              {education.endDate}
            </div>
          </div>

          <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
            <div className="flex items-start gap-4">
              <Image
                className="h-12 w-12 flex-shrink-0 rounded-lg bg-white object-contain p-1 ring-1 ring-neutral-200 dark:ring-neutral-700"
                width={48}
                height={48}
                src={
                  require(`@/images/universities/vilniaus-universitetas.png`)
                    .default
                }
                alt={education.institution}
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                  {education.institution}
                </h3>
                <div className="mt-1 flex flex-col items-start gap-1 text-sm text-neutral-700 dark:text-neutral-200 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
                  <span className="font-mono text-neutral-500 dark:text-neutral-400">
                    {duration.years}y
                  </span>
                  <span className="hidden text-neutral-300 sm:inline dark:text-neutral-600">
                    ·
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Vilnius, Lithuania
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-300/65 dark:bg-amber-200/45" />

              <div className="min-w-0 flex-1">
                <div className="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                  <h4 className="font-medium text-neutral-800 dark:text-neutral-100">
                    {education.studyType} in {education.area}
                  </h4>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {education.startDate} → {education.endDate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Work({
  groupedWorkExperiences,
}: {
  groupedWorkExperiences: Record<
    string,
    {
      company: string
      url: string
      location: string
      image: string
      experiences: WorkInterface[]
      totalDuration: { years: number; months: number }
      startDate: Date
      endDate: Date
    }
  >
}) {
  const companies = Object.keys(groupedWorkExperiences)

  return (
    <div className="relative">
      {companies.map((company, companyIndex) => {
        const companyData = groupedWorkExperiences[company]
        const formattedEndDate = `${companyData.endDate.getFullYear()}-${String(companyData.endDate.getMonth() + 1).padStart(2, '0')}`
        const isFirst = companyIndex === 0
        const isLast = companyIndex === companies.length - 1
        const hasMultipleRoles = companyData.experiences.length > 1

        // Consolidate all technologies and projects from all positions
        const allTechnologies = getAllUniqueItems(
          companyData.experiences.map((exp) => exp.technologies),
        )
        const allProjects = getAllUniqueItems(
          companyData.experiences.map((exp) => exp.projects),
        )

        return (
          <div
            key={company}
            className="group relative flex gap-4 pb-6 sm:gap-6 sm:pb-8"
          >
            {/* Timeline column - hidden on mobile */}
            <div className="relative hidden flex-col items-center sm:flex">
              {/* Vertical line */}
              {!isLast && (
                <div
                  className={`absolute bottom-0 top-6 w-px ${
                    isFirst
                      ? 'bg-gradient-to-b from-emerald-200 via-amber-200 to-amber-200 dark:from-emerald-800/70 dark:via-amber-900/80 dark:to-amber-900/80'
                      : 'bg-amber-200 dark:bg-amber-900/80'
                  }`}
                />
              )}

              <div className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center">
                {isFirst ? (
                  <>
                    <div className="animate-git-head-pulse absolute -inset-1 rounded-full border border-emerald-400/50 bg-emerald-400/8 dark:border-emerald-300/45 dark:bg-emerald-300/10" />
                    <div className="absolute inset-[1px] rounded-full ring-2 ring-emerald-500/30 dark:ring-emerald-300/35" />
                    <div className="relative h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm dark:bg-emerald-400 dark:ring-neutral-900" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-[1px] rounded-full ring-2 ring-amber-200/80 dark:ring-amber-900/70" />
                    <div className="relative h-3.5 w-3.5 rounded-full bg-amber-300/65 ring-2 ring-white dark:bg-amber-200/40 dark:ring-neutral-900" />
                  </>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1 sm:-mt-1">
              <div
                className="overflow-hidden rounded-lg border border-neutral-200 bg-white/90 transition-all duration-300 dark:border-neutral-700 dark:bg-neutral-900/90 group-hover:shadow-lg"
              >
                <div className="flex h-6 items-center justify-between gap-2 border-b border-neutral-300 bg-neutral-100 px-4 dark:border-neutral-700 dark:bg-neutral-800">
                  <span className="hidden truncate font-mono text-[10px] text-neutral-700 sm:block dark:text-neutral-100">
                    ~/work/
                    {companyData.company
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '')}
                    .md
                  </span>
                  <div className="flex items-center gap-1 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {isFirst ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-300">
                          HEAD
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        {formattedEndDate}
                      </>
                    )}
                  </div>
                </div>

                <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
                  <div className="flex items-start gap-4">
                    <Image
                      className="h-12 w-12 flex-shrink-0 rounded-lg bg-white object-contain p-1 ring-1 ring-neutral-200 dark:ring-neutral-700"
                      width={48}
                      height={48}
                      src={
                        require(`@/images/companies/${companyData.image}`)
                          .default
                      }
                      alt={companyData.company}
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                        {companyData.url ? (
                          <a
                            href={companyData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-neutral-900 transition-colors hover:text-sky-700 dark:text-neutral-100 dark:hover:text-sky-300"
                          >
                            {companyData.company}
                            <svg
                              className="h-3.5 w-3.5 opacity-50"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        ) : (
                          companyData.company
                        )}
                      </h2>
                      <div className="mt-1 flex flex-col items-start gap-1 text-sm text-neutral-700 dark:text-neutral-200 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
                        <span className="font-mono text-neutral-500 dark:text-neutral-400">
                          {formatDuration(companyData.totalDuration)}
                        </span>
                        <span className="hidden text-neutral-300 sm:inline dark:text-neutral-600">
                          ·
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="text-neutral-500 dark:text-neutral-400">
                            {companyData.location}
                          </span>
                        </span>
                        {hasMultipleRoles && (
                          <>
                            <span className="hidden text-neutral-300 sm:inline dark:text-neutral-600">
                              ·
                            </span>
                            <span className="inline-flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                              </svg>
                              {companyData.experiences.length - 1} promotion
                              {companyData.experiences.length > 2 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {companyData.experiences.map((experience, index) => {
                    const previousExperience =
                      index < companyData.experiences.length - 1
                        ? companyData.experiences[index + 1]
                        : null
                    const isPromoted =
                      hasMultipleRoles &&
                      index < companyData.experiences.length - 1
                    const isBaseRole =
                      hasMultipleRoles &&
                      index === companyData.experiences.length - 1

                    const diff = getPromotionDiff(
                      experience,
                      previousExperience,
                    )

                    const responsibilitiesToShow = isPromoted
                      ? diff.newResponsibilities
                      : experience.responsibilities

                    return (
                      <div key={index} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-[7px] h-2 w-2 flex-shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-500" />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                                {experience.position}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                  {formatDuration(
                                    getDuration(
                                      experience.startDate,
                                      experience.endDate,
                                    ),
                                  )}
                                </span>
                                {isPromoted && (
                                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    <svg
                                      className="h-2.5 w-2.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                                      />
                                    </svg>
                                    promoted
                                  </span>
                                )}
                              </div>
                            </div>

                            {experience.scope ? (
                              <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                                {experience.scope}
                              </p>
                            ) : null}

                            {experience.highlights &&
                              experience.highlights.length > 0 && (
                                <RoleHighlights
                                  highlights={experience.highlights}
                                />
                              )}

                            {isPromoted &&
                              responsibilitiesToShow.length > 0 && (
                                <PromotionDiff
                                  newItems={responsibilitiesToShow}
                                  label="expanded scope"
                                />
                              )}

                            {isBaseRole &&
                              responsibilitiesToShow.length > 0 && (
                                <div className="mt-3">
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                      core scope
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 border-l-2 border-neutral-300 pl-2 dark:border-neutral-600">
                                    {responsibilitiesToShow.map((item, i) => (
                                      <div
                                        key={i}
                                        className="flex items-baseline gap-2 text-sm"
                                      >
                                        <span className="flex-shrink-0 select-none font-mono text-neutral-500 dark:text-neutral-400">
                                          •
                                        </span>
                                        <span className="text-neutral-700 dark:text-neutral-200">
                                          {item}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {!hasMultipleRoles &&
                              responsibilitiesToShow.length > 0 && (
                                <div className="mt-3">
                                  <div className="space-y-1.5 border-l-2 border-neutral-300 pl-2 dark:border-neutral-600">
                                    {responsibilitiesToShow.map((item, i) => (
                                      <div
                                        key={i}
                                        className="flex items-baseline gap-2 text-sm"
                                      >
                                        <span className="flex-shrink-0 select-none font-mono text-neutral-500 dark:text-neutral-400">
                                          •
                                        </span>
                                        <span className="text-neutral-700 dark:text-neutral-200">
                                          {item}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <CompanyProjects projects={allProjects} />
                <TechStack
                  technologies={allTechnologies}
                  tone="plain"
                  contentId={`tech-stack-${companyData.company
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '')}`}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RecruiterCvHint() {
  return (
    <div className="mb-8 rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm shadow-neutral-900/5 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/90 dark:shadow-none sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            recruiter view
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 sm:text-[15px]">
            Prefer a quicker skim? The{' '}
            <span className="font-mono text-[0.95em] text-neutral-900 dark:text-neutral-100">
              /cv
            </span>{' '}
            page shows the same experience in a cleaner, recruiter-friendly
            layout.
          </p>
        </div>

        <Button
          href="/cv"
          variant="secondary"
          className="w-full shrink-0 justify-center rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 font-mono text-neutral-900 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 sm:w-auto dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-100 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200"
        >
          <DocumentIcon className="h-4 w-4" />
          <span>open CV view</span>
        </Button>
      </div>
    </div>
  )
}

export default function ExperienceClientContent() {
  return (
    <div>
      <Container className="mt-10 sm:mt-16">
        <TerminalPageHeader
          command="git log"
          argument="--oneline"
          description={`${totalExperienceYears}+ years of professional experience`}
        />

        <div className="max-w-3xl">
          <RecruiterCvHint />
          <Work groupedWorkExperiences={groupedWorkExperiences} />
        </div>
      </Container>

      <Container className="mt-16 sm:mt-24">
        <TerminalPageHeader
          as="h2"
          command="cat"
          argument="education.md"
          description="Academic background"
        />

        <div className="max-w-3xl">
          {profileContent.education.map(
            (education: EducationInterface, index: number) => (
              <Education
                key={education.institution}
                education={education}
                isLast={index === profileContent.education.length - 1}
              />
            ),
          )}

          {/* End marker - hidden on mobile */}
          <div className="relative hidden items-center gap-6 sm:flex">
            <div className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-neutral-300 ring-2 ring-white dark:bg-neutral-600 dark:ring-neutral-900" />
            </div>
            <span className="font-mono text-sm text-neutral-600 dark:text-neutral-300">
              EOF
            </span>
          </div>
        </div>
      </Container>
    </div>
  )
}
