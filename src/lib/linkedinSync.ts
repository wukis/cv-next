import overrides from '@/data/linkedin-sync/overrides.json'
import { getRequiredValue } from '@/lib/assert'
import { type EducationInterface, type WorkInterface } from '@/lib/experience'
import { profileContent } from '@/lib/profileContent'

export const LINKEDIN_SYNC_SCHEMA_VERSION = 1

export interface LinkedInSyncLink {
  label: string
  href: string
}

export interface LinkedInSyncIntro {
  name: string
  headline: string
  location: string
  currentCompany: string
  currentTitle: string
}

export interface LinkedInSyncExperienceEntry {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string
  location: string
  description: string
  url: string
}

export interface LinkedInSyncEducationEntry {
  id: string
  institution: string
  area: string
  studyType: string
  startDate: string
  endDate: string
}

export interface LinkedInSyncProfile {
  schemaVersion: number
  intro: LinkedInSyncIntro
  about: string
  experience: LinkedInSyncExperienceEntry[]
  education: LinkedInSyncEducationEntry[]
  topSkills: string[]
  links: LinkedInSyncLink[]
  meta: {
    source: 'desired' | 'imported' | 'snapshot'
    generatedAt: string
    profileUrl: string
    sourceLabel: string
  }
}

export interface LinkedInSyncCollectionChange<T> {
  id: string
  fields: string[]
  current: T
  desired: T
}

export interface LinkedInSyncProfileDiff {
  intro: Array<{
    path: keyof LinkedInSyncIntro
    status: 'changed' | 'unchanged'
    current: string
    desired: string
  }>
  about: {
    status: 'changed' | 'unchanged'
    current: string
    desired: string
  }
  topSkills: {
    status: 'changed' | 'unchanged'
    current: string[]
    desired: string[]
  }
  links: {
    status: 'changed' | 'unchanged'
    current: LinkedInSyncLink[]
    desired: LinkedInSyncLink[]
  }
  experience: {
    added: LinkedInSyncExperienceEntry[]
    removed: LinkedInSyncExperienceEntry[]
    changed: LinkedInSyncCollectionChange<LinkedInSyncExperienceEntry>[]
    unchanged: string[]
  }
  education: {
    added: LinkedInSyncEducationEntry[]
    removed: LinkedInSyncEducationEntry[]
    changed: LinkedInSyncCollectionChange<LinkedInSyncEducationEntry>[]
    unchanged: string[]
  }
  summary: {
    introChanges: number
    aboutChanged: boolean
    topSkillsChanged: boolean
    linksChanged: boolean
    experienceAdded: number
    experienceRemoved: number
    experienceChanged: number
    educationAdded: number
    educationRemoved: number
    educationChanged: number
    totalChanges: number
  }
}

interface LinkedInSyncOverrides {
  headline?: string
  about?: string
  topSkills?: string[]
  experienceSummaryOverrides?: Record<string, string>
}

const typedOverrides = overrides as LinkedInSyncOverrides

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueStrings(input: string[]) {
  const seen = new Set<string>()

  return input.filter((item) => {
    const normalized = item.trim().toLowerCase()

    if (!normalized || seen.has(normalized)) {
      return false
    }

    seen.add(normalized)
    return true
  })
}

export function normalizeLinkedInDate(date: string): string {
  const trimmed = date.trim()
  const lowered = trimmed.toLowerCase()

  if (!trimmed) {
    return ''
  }

  if (lowered === 'now' || lowered === 'present' || lowered === 'current') {
    return 'present'
  }

  const isoMonth = trimmed.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/)

  if (isoMonth) {
    const year = getRequiredValue(isoMonth[1], 'Expected ISO year capture.')
    const month = getRequiredValue(isoMonth[2], 'Expected ISO month capture.')
    return `${year}-${month}`
  }

  const yearOnly = trimmed.match(/^(\d{4})$/)

  if (yearOnly) {
    return getRequiredValue(yearOnly[1], 'Expected year capture.')
  }

  const monthYear = Date.parse(`1 ${trimmed}`)

  if (!Number.isNaN(monthYear)) {
    const parsedDate = new Date(monthYear)
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0')
    return `${parsedDate.getUTCFullYear()}-${month}`
  }

  return trimmed
}

export function createExperienceSyncId(
  company: string,
  title: string,
  startDate: string,
) {
  return `${slugify(company)}--${slugify(title)}--${normalizeLinkedInDate(startDate)}`
}

export function createEducationSyncId(
  institution: string,
  area: string,
  startDate: string,
) {
  return `${slugify(institution)}--${slugify(area)}--${normalizeLinkedInDate(startDate)}`
}

function toRoleOverrideKey(role: WorkInterface) {
  return `${role.name}::${role.position}::${role.startDate}`
}

function buildExperienceDescription(role: WorkInterface) {
  const summaryLines = uniqueStrings([
    role.scope ?? '',
    ...role.highlights,
    ...role.responsibilities,
  ])

  const projectLine =
    role.projects.length > 0 ? `Projects: ${role.projects.join('; ')}` : ''

  return [...summaryLines, projectLine].filter(Boolean).join('\n')
}

function buildDesiredExperienceEntry(
  role: WorkInterface,
): LinkedInSyncExperienceEntry {
  const overrideText =
    typedOverrides.experienceSummaryOverrides?.[toRoleOverrideKey(role)]?.trim()

  return {
    id: createExperienceSyncId(role.name, role.position, role.startDate),
    company: role.name,
    title: role.position,
    startDate: normalizeLinkedInDate(role.startDate),
    endDate: normalizeLinkedInDate(role.endDate),
    location: role.location ?? '',
    description: overrideText || buildExperienceDescription(role),
    url: role.url,
  }
}

function buildDesiredEducationEntry(
  entry: EducationInterface,
): LinkedInSyncEducationEntry {
  return {
    id: createEducationSyncId(entry.institution, entry.area, entry.startDate),
    institution: entry.institution,
    area: entry.area,
    studyType: entry.studyType,
    startDate: normalizeLinkedInDate(entry.startDate),
    endDate: normalizeLinkedInDate(entry.endDate),
  }
}

function compareStringArrays(current: string[], desired: string[]) {
  return JSON.stringify(current) === JSON.stringify(desired)
}

function compareLinks(
  current: LinkedInSyncLink[],
  desired: LinkedInSyncLink[],
) {
  return JSON.stringify(current) === JSON.stringify(desired)
}

function diffCollection<T extends { id: string }>(current: T[], desired: T[]) {
  const currentMap = new Map(current.map((entry) => [entry.id, entry]))
  const desiredMap = new Map(desired.map((entry) => [entry.id, entry]))

  const added: T[] = []
  const removed: T[] = []
  const changed: Array<LinkedInSyncCollectionChange<T>> = []
  const unchanged: string[] = []

  for (const desiredEntry of desired) {
    const currentEntry = currentMap.get(desiredEntry.id)

    if (!currentEntry) {
      added.push(desiredEntry)
      continue
    }

    const fields = Object.keys(desiredEntry).filter((fieldName) => {
      const key = fieldName as keyof T
      return (
        JSON.stringify(currentEntry[key]) !== JSON.stringify(desiredEntry[key])
      )
    })

    if (fields.length === 0) {
      unchanged.push(desiredEntry.id)
      continue
    }

    changed.push({
      id: desiredEntry.id,
      fields,
      current: currentEntry,
      desired: desiredEntry,
    })
  }

  for (const currentEntry of current) {
    if (!desiredMap.has(currentEntry.id)) {
      removed.push(currentEntry)
    }
  }

  return { added, removed, changed, unchanged }
}

export function buildDesiredLinkedInProfile(
  generatedAt = new Date().toISOString(),
): LinkedInSyncProfile {
  const linkedInUrl =
    profileContent.links.find((link) => link.label === 'LinkedIn')?.href ?? ''

  return {
    schemaVersion: LINKEDIN_SYNC_SCHEMA_VERSION,
    intro: {
      name: profileContent.person.name,
      headline:
        typedOverrides.headline?.trim() ||
        `${profileContent.person.label} | ${profileContent.person.summary}`,
      location: profileContent.person.locationSummary,
      currentCompany: profileContent.currentRole.name,
      currentTitle: profileContent.currentRole.position,
    },
    about:
      typedOverrides.about?.trim() ||
      [
        profileContent.person.summary,
        ...profileContent.narratives.aboutNarrative,
      ]
        .filter(Boolean)
        .join('\n\n'),
    experience: profileContent.work.map(buildDesiredExperienceEntry),
    education: profileContent.education.map(buildDesiredEducationEntry),
    topSkills:
      typedOverrides.topSkills && typedOverrides.topSkills.length > 0
        ? uniqueStrings(typedOverrides.topSkills)
        : uniqueStrings(profileContent.expertise.keywords).slice(0, 12),
    links: [
      { label: 'Website', href: profileContent.site.url },
      ...profileContent.links.map((link) => ({
        label: link.label,
        href: link.href,
      })),
    ],
    meta: {
      source: 'desired',
      generatedAt,
      profileUrl: linkedInUrl,
      sourceLabel: 'profileContent',
    },
  }
}

export function diffLinkedInProfiles(
  current: LinkedInSyncProfile,
  desired: LinkedInSyncProfile,
): LinkedInSyncProfileDiff {
  const intro: LinkedInSyncProfileDiff['intro'] = Object.keys(
    desired.intro,
  ).map((fieldName) => {
    const key = fieldName as keyof LinkedInSyncIntro
    const currentValue = current.intro[key]
    const desiredValue = desired.intro[key]
    const status: 'changed' | 'unchanged' =
      currentValue === desiredValue ? 'unchanged' : 'changed'

    return {
      path: key,
      status,
      current: currentValue,
      desired: desiredValue,
    }
  })

  const aboutChanged = current.about !== desired.about
  const topSkillsChanged = !compareStringArrays(
    current.topSkills,
    desired.topSkills,
  )
  const linksChanged = !compareLinks(current.links, desired.links)
  const experience = diffCollection(current.experience, desired.experience)
  const education = diffCollection(current.education, desired.education)

  const introChanges = intro.filter(
    (entry) => entry.status === 'changed',
  ).length
  const totalChanges =
    introChanges +
    (aboutChanged ? 1 : 0) +
    (topSkillsChanged ? 1 : 0) +
    (linksChanged ? 1 : 0) +
    experience.added.length +
    experience.removed.length +
    experience.changed.length +
    education.added.length +
    education.removed.length +
    education.changed.length

  return {
    intro,
    about: {
      status: aboutChanged ? 'changed' : 'unchanged',
      current: current.about,
      desired: desired.about,
    },
    topSkills: {
      status: topSkillsChanged ? 'changed' : 'unchanged',
      current: current.topSkills,
      desired: desired.topSkills,
    },
    links: {
      status: linksChanged ? 'changed' : 'unchanged',
      current: current.links,
      desired: desired.links,
    },
    experience,
    education,
    summary: {
      introChanges,
      aboutChanged,
      topSkillsChanged,
      linksChanged,
      experienceAdded: experience.added.length,
      experienceRemoved: experience.removed.length,
      experienceChanged: experience.changed.length,
      educationAdded: education.added.length,
      educationRemoved: education.removed.length,
      educationChanged: education.changed.length,
      totalChanges,
    },
  }
}
