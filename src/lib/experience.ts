export interface WorkInterface {
  name: string
  position: string
  enrollment?: string
  startDate: string
  endDate: string
  scope?: string
  highlights: string[]
  responsibilities: string[]
  projects: string[]
  technologies: string[]
  url: string
  location?: string
  image: string
}

export interface EducationInterface {
  institution: string
  area: string
  studyType: string
  startDate: string
  endDate: string
}

export interface Duration {
  years: number
  months: number
}

// Calculate duration between two dates
export const getDuration = (startDate: string, endDate: string): Duration => {
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

export function addDuration(total: Duration, duration: Duration): Duration {
  const months = total.months + duration.months

  return {
    years: total.years + duration.years + Math.floor(months / 12),
    months: months % 12,
  }
}

export function calculateDurationYears(durations: Iterable<Duration>): number {
  let total = { years: 0, months: 0 }

  for (const duration of durations) {
    total = addDuration(total, duration)
  }

  return total.years + Math.floor(total.months / 12)
}

// Group work experiences by company
const groupWorkExperiences = (workExperiences: WorkInterface[]) => {
  return workExperiences.reduce(
    (acc, experience) => {
      const { name, startDate, endDate } = experience
      if (!acc[name]) {
        acc[name] = {
          company: name,
          totalDuration: { years: 0, months: 0 },
        }
      }

      const experienceDuration = getDuration(startDate, endDate)
      acc[name].totalDuration = addDuration(
        acc[name].totalDuration,
        experienceDuration,
      )

      return acc
    },
    {} as Record<
      string,
      {
        company: string
        totalDuration: { years: number; months: number }
      }
    >,
  )
}

// Calculate total years of experience from grouped work experiences
export const calculateTotalExperienceYears = (
  workExperiences: WorkInterface[],
): number => {
  const grouped = groupWorkExperiences(workExperiences)
  return calculateDurationYears(
    Object.values(grouped).map(({ totalDuration }) => totalDuration),
  )
}
