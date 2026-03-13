'use client'
import React from 'react'

import { Container } from '@/components/Container'
import { TechStack } from '@/components/TechStack'
import { EducationInterface, WorkInterface } from '@/lib/experience'
import linkedIn from '@/data/linkedin.json'
import work from '@/data/work.json'
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

const groupedWorkExperiences = groupWorkExperiences(work as WorkInterface[])
const totalExperience = calculateTotalExperience(groupedWorkExperiences)
const totalExperienceYears =
  totalExperience.years + Math.floor(totalExperience.months / 12)

// Get role type for branch coloring
const getRoleType = (
  position: string,
): 'lead' | 'senior' | 'mid' | 'junior' => {
  const lower = position.toLowerCase()
  if (
    lower.includes('lead') ||
    lower.includes('manager') ||
    lower.includes('head')
  )
    return 'lead'
  if (lower.includes('senior')) return 'senior'
  if (lower.includes('junior') || lower.includes('intern')) return 'junior'
  return 'mid'
}

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

const getBranchColors = (roleType: 'lead' | 'senior' | 'mid' | 'junior') => {
  switch (roleType) {
    case 'lead':
      return {
        node: 'bg-emerald-500 dark:bg-emerald-400',
        ring: 'ring-emerald-500/30 dark:ring-emerald-400/30',
        glow: 'shadow-emerald-500/40 dark:shadow-emerald-400/40',
        ping: 'bg-emerald-500/40 dark:bg-emerald-400/40',
        border: 'border-emerald-300 dark:border-emerald-700',
        text: 'text-emerald-950 dark:text-emerald-100',
        bg: 'bg-emerald-100 dark:bg-emerald-950/60',
      }
    case 'senior':
      return {
        node: 'bg-sky-500 dark:bg-sky-400',
        ring: 'ring-sky-500/30 dark:ring-sky-400/30',
        glow: 'shadow-sky-500/40 dark:shadow-sky-400/40',
        ping: 'bg-sky-500/40 dark:bg-sky-400/40',
        border: 'border-sky-300 dark:border-sky-700',
        text: 'text-sky-950 dark:text-sky-100',
        bg: 'bg-sky-100 dark:bg-sky-950/60',
      }
    case 'mid':
      return {
        node: 'bg-violet-500 dark:bg-violet-400',
        ring: 'ring-violet-500/30 dark:ring-violet-400/30',
        glow: 'shadow-violet-500/40 dark:shadow-violet-400/40',
        ping: 'bg-violet-500/40 dark:bg-violet-400/40',
        border: 'border-violet-300 dark:border-violet-700',
        text: 'text-violet-950 dark:text-violet-100',
        bg: 'bg-violet-100 dark:bg-violet-950/60',
      }
    case 'junior':
      return {
        node: 'bg-amber-500 dark:bg-amber-400',
        ring: 'ring-amber-500/30 dark:ring-amber-400/30',
        glow: 'shadow-amber-500/40 dark:shadow-amber-400/40',
        ping: 'bg-amber-500/40 dark:bg-amber-400/40',
        border: 'border-amber-300 dark:border-amber-700',
        text: 'text-amber-950 dark:text-amber-100',
        bg: 'bg-amber-100 dark:bg-amber-950/60',
      }
  }
}

function Education({
  education,
  isLast,
}: {
  education: EducationInterface
  isLast: boolean
}) {
  const colors = getBranchColors('junior')
  const duration = getDuration(education.startDate, education.endDate)

  return (
    <div className="group relative flex gap-4 pb-6 sm:gap-6 sm:pb-8">
      {/* Timeline column - hidden on mobile */}
      <div className="relative hidden flex-col items-center sm:flex">
        {/* Vertical line */}
        {!isLast && (
          <div className="absolute bottom-0 top-6 w-px bg-neutral-300 dark:bg-neutral-600" />
        )}

        <div className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center">
          <div className="absolute inset-0 rounded-full ring-2 ring-neutral-300 dark:ring-neutral-700" />
          <div
            className="relative h-4 w-4 rounded-full bg-neutral-400 ring-2 ring-white dark:bg-neutral-500 dark:ring-neutral-900"
          />
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
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-700 dark:text-neutral-200">
                  <span className="font-mono text-neutral-500 dark:text-neutral-400">
                    {duration.years}y
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-600">
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
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-500" />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
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

        // Determine primary role type from the most senior position
        const primaryRole = companyData.experiences.reduce(
          (acc, exp) => {
            const type = getRoleType(exp.position)
            if (type === 'lead') return 'lead'
            if (type === 'senior' && acc !== 'lead') return 'senior'
            if (type === 'mid' && acc !== 'lead' && acc !== 'senior')
              return 'mid'
            return acc
          },
          'junior' as 'lead' | 'senior' | 'mid' | 'junior',
        )

        const colors = getBranchColors(primaryRole)

        return (
          <div
            key={company}
            className="group relative flex gap-4 pb-6 sm:gap-6 sm:pb-8"
          >
            {/* Timeline column - hidden on mobile */}
            <div className="relative hidden flex-col items-center sm:flex">
              {/* Vertical line */}
              {!isLast && (
                <div className="absolute bottom-0 top-6 w-px bg-neutral-300 dark:bg-neutral-600" />
              )}

              <div className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full ${
                    isFirst
                      ? `ring-4 ${colors.ring}`
                      : 'ring-2 ring-neutral-300 dark:ring-neutral-700'
                  }`}
                />
                <div
                  className={`relative h-4 w-4 rounded-full ring-2 ring-white dark:ring-neutral-900 ${
                    isFirst
                      ? colors.node
                      : 'bg-neutral-400 dark:bg-neutral-500'
                  }`}
                />
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
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 dark:bg-neutral-400" />
                        HEAD
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
                      <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                        {companyData.url ? (
                          <a
                            href={companyData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 transition-colors hover:text-sky-500 dark:hover:text-sky-400"
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
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-700 dark:text-neutral-200">
                        <span className="font-mono text-neutral-500 dark:text-neutral-400">
                          {formatDuration(companyData.totalDuration)}
                        </span>
                        <span className="text-neutral-300 dark:text-neutral-600">
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
                            <span className="text-neutral-300 dark:text-neutral-600">
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
                    const roleType = getRoleType(experience.position)
                    const roleColors = getBranchColors(roleType)
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
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                {experience.position}
                              </h4>
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
                                  label="new"
                                />
                              )}

                            {isBaseRole &&
                              responsibilitiesToShow.length > 0 && (
                                <div className="mt-3">
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                      base responsibilities
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
                <TechStack technologies={allTechnologies} tone="plain" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ExperienceClientContent() {
  return (
    <div>
      <Container className="mt-10 sm:mt-16">
        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 font-mono text-sm uppercase tracking-wider text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            currently employed
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-800 sm:text-4xl lg:text-5xl dark:text-neutral-100">
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              &gt;
            </span>{' '}
            git log{' '}
            <span className="text-neutral-500 dark:text-neutral-400">
              --oneline
            </span>
          </h1>
          <p className="mt-3 font-mono text-lg text-neutral-600 dark:text-neutral-400">
            <span className="text-neutral-500 dark:text-neutral-400"># </span>
            {totalExperienceYears}+ years of professional experience
          </p>
        </div>

        <div className="max-w-3xl">
          <Work groupedWorkExperiences={groupedWorkExperiences} />
        </div>
      </Container>

      <Container className="mt-16 sm:mt-24">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-800 sm:text-4xl lg:text-5xl dark:text-neutral-100">
            <span className="font-mono text-amber-600 dark:text-amber-400">
              &gt;
            </span>{' '}
            git checkout{' '}
            <span className="text-neutral-500 dark:text-neutral-400">
              education
            </span>
          </h2>
          <p className="mt-3 font-mono text-lg text-neutral-600 dark:text-neutral-400">
            <span className="text-neutral-500 dark:text-neutral-400"># </span>
            Academic background
          </p>
        </div>

        <div className="max-w-3xl">
          {linkedIn.education.map(
            (education: EducationInterface, index: number) => (
              <Education
                key={education.institution}
                education={education}
                isLast={index === linkedIn.education.length - 1}
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
