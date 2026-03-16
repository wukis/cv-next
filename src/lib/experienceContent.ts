import { getDuration, type WorkInterface } from '@/lib/experience'

export type FormattedDuration = {
  years: number
  months: number
}

export type GroupedWorkExperience = {
  company: string
  url: string
  location: string
  image: string
  experiences: WorkInterface[]
  totalDuration: FormattedDuration
  startDate: Date
  endDate: Date
}

export function formatDuration(duration: FormattedDuration): string {
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

function getCompanyDateRange(experiences: WorkInterface[]) {
  const startDates = experiences.map((experience) =>
    new Date(experience.startDate).getTime(),
  )
  const endDates = experiences.map((experience) =>
    experience.endDate === 'now'
      ? Date.now()
      : new Date(experience.endDate).getTime(),
  )

  return {
    startDate: new Date(Math.min(...startDates)),
    endDate: new Date(Math.max(...endDates)),
  }
}

export function groupWorkExperiencesForDisplay(
  workExperiences: WorkInterface[],
): Record<string, GroupedWorkExperience> {
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

      const companyDateRange = getCompanyDateRange(acc[name].experiences)
      acc[name].startDate = companyDateRange.startDate
      acc[name].endDate = companyDateRange.endDate

      return acc
    },
    {} as Record<string, GroupedWorkExperience>,
  )
}

export function calculateTotalExperienceYears(
  groupedWorkExperiences: Record<string, GroupedWorkExperience>,
) {
  const total = Object.values(groupedWorkExperiences).reduce(
    (acc, { totalDuration }) => {
      acc.years += totalDuration.years
      acc.months += totalDuration.months
      return acc
    },
    { years: 0, months: 0 },
  )

  return total.years + Math.floor(total.months / 12)
}

export function getAllUniqueItems(arrays: string[][]): string[] {
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

function getNewItems(current: string[], previous: string[]): string[] {
  const previousSet = new Set(previous.map((item) => item.toLowerCase().trim()))
  return current.filter((item) => !previousSet.has(item.toLowerCase().trim()))
}

export function getPromotionDiff(
  current: WorkInterface,
  previous: WorkInterface | null,
) {
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

  return {
    newResponsibilities,
    inheritedResponsibilities: current.responsibilities.filter(
      (item) => !newResponsibilities.includes(item),
    ),
  }
}
