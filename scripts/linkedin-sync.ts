import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import AdmZip from 'adm-zip'
import { parse } from 'csv-parse/sync'

import {
  LINKEDIN_SYNC_SCHEMA_VERSION,
  buildDesiredLinkedInProfile,
  createEducationSyncId,
  createExperienceSyncId,
  diffLinkedInProfiles,
  normalizeLinkedInDate,
  type LinkedInSyncEducationEntry,
  type LinkedInSyncExperienceEntry,
  type LinkedInSyncLink,
  type LinkedInSyncProfile,
  type LinkedInSyncProfileDiff,
} from '../src/lib/linkedinSync'

type SourceType = 'zip' | 'directory'

interface ImportedBaseline {
  schemaVersion: number
  importedAt: string | null
  sourceType: SourceType | null
  inputName: string | null
  manifest: string[]
  warnings: string[]
  profileHash: string | null
  profile: LinkedInSyncProfile | null
}

interface LatestSnapshotPointer {
  schemaVersion: number
  snapshotId: string | null
  createdAt: string | null
  importedAt: string | null
  baselineHash: string | null
  desiredHash: string | null
  summary: LinkedInSyncProfileDiff['summary'] | null
}

interface AppliedSnapshotPointer {
  schemaVersion: number
  snapshotId: string | null
  appliedAt: string | null
  desiredHash: string | null
}

interface LinkedInSyncSnapshot {
  schemaVersion: number
  snapshotId: string
  createdAt: string
  inputName: string
  sourceType: SourceType
  manifest: string[]
  warnings: string[]
  baselineHash: string
  desiredHash: string
  diff: LinkedInSyncProfileDiff
  baseline: LinkedInSyncProfile
  desired: LinkedInSyncProfile
}

interface PublicStatusArtifact {
  schemaVersion: number
  updatedAt: string | null
  baselineImportedAt: string | null
  baselineSourceType: SourceType | null
  latestSnapshotId: string | null
  appliedSnapshotId: string | null
  pendingChanges: boolean
  restoreAvailable: boolean
  diffSummary: LinkedInSyncProfileDiff['summary'] | null
  warnings: string[]
}

interface ExportFile {
  relativePath: string
  extension: string
  readText: () => Promise<string>
}

const repoRoot = process.cwd()
const storageRoot = process.env.LINKEDIN_SYNC_STORAGE_ROOT
  ? path.resolve(process.env.LINKEDIN_SYNC_STORAGE_ROOT)
  : repoRoot
const trackedDir = path.join(storageRoot, 'src', 'data', 'linkedin-sync')
const historyDir = path.join(trackedDir, 'history')
const importedPath = path.join(trackedDir, 'imported.json')
const latestPath = path.join(trackedDir, 'latest.json')
const appliedPath = path.join(trackedDir, 'applied.json')
const trackedStatusPath = path.join(trackedDir, 'status.json')
const generatedDir = path.join(storageRoot, '.generated', 'linkedin')
const payloadPath = path.join(generatedDir, 'payload.json')
const diffPath = path.join(generatedDir, 'diff.json')
const copyPackPath = path.join(generatedDir, 'copy-pack.md')
const restorePayloadPath = path.join(generatedDir, 'restore-payload.json')
const restorePackPath = path.join(generatedDir, 'restore-pack.md')

const defaultImportedBaseline: ImportedBaseline = {
  schemaVersion: LINKEDIN_SYNC_SCHEMA_VERSION,
  importedAt: null,
  sourceType: null,
  inputName: null,
  manifest: [],
  warnings: [],
  profileHash: null,
  profile: null,
}

const defaultLatestSnapshotPointer: LatestSnapshotPointer = {
  schemaVersion: LINKEDIN_SYNC_SCHEMA_VERSION,
  snapshotId: null,
  createdAt: null,
  importedAt: null,
  baselineHash: null,
  desiredHash: null,
  summary: null,
}

const defaultAppliedSnapshotPointer: AppliedSnapshotPointer = {
  schemaVersion: LINKEDIN_SYNC_SCHEMA_VERSION,
  snapshotId: null,
  appliedAt: null,
  desiredHash: null,
}

const defaultStatusArtifact: PublicStatusArtifact = {
  schemaVersion: LINKEDIN_SYNC_SCHEMA_VERSION,
  updatedAt: null,
  baselineImportedAt: null,
  baselineSourceType: null,
  latestSnapshotId: null,
  appliedSnapshotId: null,
  pendingChanges: false,
  restoreAvailable: false,
  diffSummary: null,
  warnings: ['LinkedIn sync has not been initialized yet. Run linkedin:import first.'],
}

async function ensurePaths() {
  await fs.mkdir(historyDir, { recursive: true })
  await fs.mkdir(generatedDir, { recursive: true })
  await ensureFile(importedPath, defaultImportedBaseline)
  await ensureFile(latestPath, defaultLatestSnapshotPointer)
  await ensureFile(appliedPath, defaultAppliedSnapshotPointer)
  await ensureFile(trackedStatusPath, defaultStatusArtifact)
}

function stableHash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function sanitizeFileName(inputPath: string) {
  return path.basename(inputPath)
}

function normalizeKey(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizeFileKey(value: string) {
  return normalizeKey(path.basename(value, path.extname(value)))
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value.trim())
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw) as T
}

async function writeJsonFile(filePath: string, value: unknown) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function ensureFile(filePath: string, defaultValue: unknown) {
  try {
    await fs.access(filePath)
  } catch {
    await writeJsonFile(filePath, defaultValue)
  }
}

function parseCsvRecords(content: string) {
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  }) as Record<string, unknown>[]
}

function flattenJsonRecord(input: unknown, prefix = ''): Record<string, string> {
  if (input === null || input === undefined) {
    return {}
  }

  if (typeof input !== 'object') {
    return prefix ? { [prefix]: String(input) } : {}
  }

  return Object.entries(input).reduce<Record<string, string>>((accumulator, [key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(accumulator, flattenJsonRecord(value, nextKey))
      return accumulator
    }

    accumulator[nextKey] =
      Array.isArray(value) ? value.map((item) => String(item)).join(', ') : String(value ?? '')

    return accumulator
  }, {})
}

function parseJsonRecords(content: string) {
  const parsed = JSON.parse(content) as unknown

  if (Array.isArray(parsed)) {
    return parsed.map((entry) => flattenJsonRecord(entry))
  }

  if (parsed && typeof parsed === 'object') {
    return [flattenJsonRecord(parsed)]
  }

  return [] as Record<string, string>[]
}

function extractRecords(content: string, extension: string) {
  if (extension === '.json') {
    return parseJsonRecords(content)
  }

  if (extension === '.csv') {
    return parseCsvRecords(content).map((record) =>
      Object.fromEntries(
        Object.entries(record).map(([key, value]) => [key, String(value ?? '')]),
      ),
    )
  }

  return [] as Record<string, string>[]
}

function findValue(record: Record<string, string>, aliases: string[]) {
  const entries = Object.entries(record)

  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias)
    const match = entries.find(([key]) => {
      const normalizedKey = normalizeKey(key)
      return (
        normalizedKey === normalizedAlias ||
        normalizedKey.includes(normalizedAlias) ||
        normalizedAlias.includes(normalizedKey)
      )
    })

    if (match && match[1].trim()) {
      return match[1].trim()
    }
  }

  return ''
}

function findUrls(record: Record<string, string>) {
  return Object.entries(record)
    .filter(([, value]) => isUrl(value))
    .map(([key, value]) => ({
      label: key,
      href: value.trim(),
    }))
}

function dedupeLinks(links: LinkedInSyncLink[]) {
  const seen = new Set<string>()

  return links.filter((link) => {
    const key = `${link.label.toLowerCase()}::${link.href.toLowerCase()}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

async function walkDirectory(
  directoryPath: string,
  parent = '',
): Promise<ExportFile[]> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true })
  const files: ExportFile[] = []

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name)
    const relativePath = parent ? path.join(parent, entry.name) : entry.name

    if (entry.isDirectory()) {
      files.push(...(await walkDirectory(absolutePath, relativePath)))
      continue
    }

    const extension = path.extname(entry.name).toLowerCase()

    files.push({
      relativePath,
      extension,
      readText: () => fs.readFile(absolutePath, 'utf8'),
    })
  }

  return files
}

async function loadExportFiles(inputPath: string) {
  const stats = await fs.stat(inputPath)

  if (stats.isDirectory()) {
    return {
      sourceType: 'directory' as const,
      inputName: sanitizeFileName(inputPath),
      files: await walkDirectory(inputPath),
    }
  }

  if (path.extname(inputPath).toLowerCase() !== '.zip') {
    throw new Error('LinkedIn import expects a ZIP export or an extracted folder.')
  }

  const archive = new AdmZip(inputPath)
  const files = archive
    .getEntries()
    .filter((entry) => !entry.isDirectory)
    .map<ExportFile>((entry) => ({
      relativePath: entry.entryName,
      extension: path.extname(entry.entryName).toLowerCase(),
      readText: async () => entry.getData().toString('utf8'),
    }))

  return {
    sourceType: 'zip' as const,
    inputName: sanitizeFileName(inputPath),
    files,
  }
}

function categorizeFiles(files: ExportFile[]) {
  const categories = {
    profile: [] as ExportFile[],
    positions: [] as ExportFile[],
    education: [] as ExportFile[],
    skills: [] as ExportFile[],
    contact: [] as ExportFile[],
  }

  for (const file of files) {
    const key = normalizeFileKey(file.relativePath)

    if (key.includes('profile')) {
      categories.profile.push(file)
      continue
    }

    if (key.includes('position') || key.includes('experience')) {
      categories.positions.push(file)
      continue
    }

    if (key.includes('education')) {
      categories.education.push(file)
      continue
    }

    if (key.includes('skill')) {
      categories.skills.push(file)
      continue
    }

    if (key.includes('contact') || key.includes('website')) {
      categories.contact.push(file)
    }
  }

  return categories
}

async function loadCategoryRecords(files: ExportFile[]) {
  const records: Record<string, string>[] = []

  for (const file of files) {
    if (!['.csv', '.json'].includes(file.extension)) {
      continue
    }

    const content = await file.readText()
    records.push(...extractRecords(content, file.extension))
  }

  return records
}

function pickBestProfileRecord(records: Record<string, string>[]) {
  return [...records].sort((left, right) => {
    const leftScore = Object.values(left).filter((value) => value.trim()).length
    const rightScore = Object.values(right).filter((value) => value.trim()).length
    return rightScore - leftScore
  })[0]
}

function mapExperienceRecord(record: Record<string, string>) {
  const company = findValue(record, [
    'company',
    'company name',
    'organization',
    'employer',
  ])
  const title = findValue(record, ['title', 'position', 'role', 'job title'])

  if (!company && !title) {
    return null
  }

  const startDate = normalizeLinkedInDate(
    findValue(record, ['started on', 'start date', 'date started', 'from']),
  )
  const currentFlag = findValue(record, ['currently works here', 'current', 'is current'])
  const rawEndDate = findValue(record, [
    'finished on',
    'end date',
    'date ended',
    'to',
  ])
  const endDate =
    currentFlag.toLowerCase() === 'true' || currentFlag.toLowerCase() === 'yes'
      ? 'present'
      : normalizeLinkedInDate(rawEndDate)

  return {
    id: createExperienceSyncId(company || 'company', title || 'title', startDate || 'unknown'),
    company,
    title,
    startDate,
    endDate,
    location: findValue(record, ['location', 'place']),
    description: findValue(record, ['description', 'summary', 'notes']),
    url: findValue(record, ['company url', 'url', 'link']),
  } satisfies LinkedInSyncExperienceEntry
}

function mapEducationRecord(record: Record<string, string>) {
  const institution = findValue(record, [
    'school',
    'school name',
    'institution',
    'university',
  ])
  const area = findValue(record, ['field of study', 'area', 'subject'])

  if (!institution && !area) {
    return null
  }

  const startDate = normalizeLinkedInDate(
    findValue(record, ['started on', 'start date', 'date started', 'from']),
  )

  return {
    id: createEducationSyncId(institution || 'institution', area || 'area', startDate || 'unknown'),
    institution,
    area,
    studyType: findValue(record, ['degree', 'study type']),
    startDate,
    endDate: normalizeLinkedInDate(
      findValue(record, ['finished on', 'end date', 'date ended', 'to']),
    ),
  } satisfies LinkedInSyncEducationEntry
}

function mapSkillRecords(records: Record<string, string>[]) {
  const skills = records.flatMap((record) => {
    const value = findValue(record, ['name', 'skill', 'skills'])

    if (!value) {
      return []
    }

    return value
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)
  })

  return [...new Set(skills)]
}

function pickCurrentExperience(entries: LinkedInSyncExperienceEntry[]) {
  const presentEntry = entries.find((entry) => entry.endDate === 'present')

  if (presentEntry) {
    return presentEntry
  }

  return [...entries].sort((left, right) => {
    return right.startDate.localeCompare(left.startDate)
  })[0]
}

function mapImportedLinks(
  profileRecord: Record<string, string> | undefined,
  contactRecords: Record<string, string>[],
) {
  const profileUrl = profileRecord
    ? findValue(profileRecord, ['public profile url', 'linkedin url', 'profile url'])
    : ''

  const links = [
    profileUrl ? { label: 'LinkedIn', href: profileUrl } : null,
    ...contactRecords.flatMap((record) => findUrls(record)),
  ].filter((link): link is LinkedInSyncLink => Boolean(link))

  return dedupeLinks(
    links.map((link) => ({
      label: link.label.replace(/[:_]/g, ' ').trim() || 'Website',
      href: link.href,
    })),
  )
}

async function importLinkedInBaseline(inputPath: string): Promise<ImportedBaseline> {
  const loaded = await loadExportFiles(inputPath)
  const categories = categorizeFiles(loaded.files)
  const profileRecords = await loadCategoryRecords(categories.profile)
  const positionRecords = await loadCategoryRecords(categories.positions)
  const educationRecords = await loadCategoryRecords(categories.education)
  const skillRecords = await loadCategoryRecords(categories.skills)
  const contactRecords = await loadCategoryRecords(categories.contact)

  const warnings: string[] = []

  if (profileRecords.length === 0) {
    warnings.push('No LinkedIn profile file was detected in the export.')
  }

  if (positionRecords.length === 0) {
    warnings.push('No LinkedIn positions/experience file was detected in the export.')
  }

  const profileRecord = pickBestProfileRecord(profileRecords)
  const experience = positionRecords
    .map(mapExperienceRecord)
    .filter((entry): entry is LinkedInSyncExperienceEntry => Boolean(entry))
  const education = educationRecords
    .map(mapEducationRecord)
    .filter((entry): entry is LinkedInSyncEducationEntry => Boolean(entry))
  const currentExperience = pickCurrentExperience(experience)
  const links = mapImportedLinks(profileRecord, contactRecords)
  const linkedInUrl = links.find((link) => link.label.toLowerCase().includes('linkedin'))?.href ?? ''

  const profile: LinkedInSyncProfile = {
    schemaVersion: LINKEDIN_SYNC_SCHEMA_VERSION,
    intro: {
      name:
        findValue(profileRecord ?? {}, ['full name', 'name']) ||
        [
          findValue(profileRecord ?? {}, ['first name', 'firstname']),
          findValue(profileRecord ?? {}, ['last name', 'lastname']),
        ]
          .filter(Boolean)
          .join(' ') ||
        '',
      headline: findValue(profileRecord ?? {}, ['headline', 'professional headline', 'tagline']),
      location: findValue(profileRecord ?? {}, ['location', 'geo location', 'address']),
      currentCompany: currentExperience?.company ?? '',
      currentTitle: currentExperience?.title ?? '',
    },
    about: findValue(profileRecord ?? {}, ['summary', 'about', 'biography', 'description']),
    experience,
    education,
    topSkills: mapSkillRecords(skillRecords),
    links,
    meta: {
      source: 'imported',
      generatedAt: new Date().toISOString(),
      profileUrl: linkedInUrl,
      sourceLabel: 'linkedin-export',
    },
  }

  return {
    schemaVersion: LINKEDIN_SYNC_SCHEMA_VERSION,
    importedAt: new Date().toISOString(),
    sourceType: loaded.sourceType,
    inputName: loaded.inputName,
    manifest: loaded.files.map((file) => file.relativePath).sort(),
    warnings,
    profileHash: stableHash(profile),
    profile,
  }
}

function createSnapshotId(baselineHash: string, desiredHash: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${stamp}-${baselineHash.slice(0, 6)}-${desiredHash.slice(0, 6)}`
}

function formatValue(value: string) {
  return value || '(empty)'
}

function formatLinks(links: LinkedInSyncLink[]) {
  if (links.length === 0) {
    return '- (no links)'
  }

  return links.map((link) => `- ${link.label}: ${link.href}`).join('\n')
}

function formatEducation(entries: LinkedInSyncEducationEntry[]) {
  if (entries.length === 0) {
    return 'No education changes in this pack.'
  }

  return entries
    .map(
      (entry) =>
        `### ${entry.institution}\n- Area: ${formatValue(entry.area)}\n- Degree: ${formatValue(entry.studyType)}\n- Dates: ${formatValue(entry.startDate)} -> ${formatValue(entry.endDate)}`,
    )
    .join('\n\n')
}

function renderExperienceSections(entries: LinkedInSyncExperienceEntry[]) {
  if (entries.length === 0) {
    return 'No experience text changes in this pack.'
  }

  return entries
    .map(
      (entry) => `### ${entry.title} @ ${entry.company}
- Dates: ${formatValue(entry.startDate)} -> ${formatValue(entry.endDate)}
- Location: ${formatValue(entry.location)}
- Company URL: ${formatValue(entry.url)}

\`\`\`text
${entry.description || '(empty)'}
\`\`\``,
    )
    .join('\n\n')
}

function renderRemovedExperienceSections(entries: LinkedInSyncExperienceEntry[]) {
  if (entries.length === 0) {
    return 'No experience removals in this pack.'
  }

  return entries
    .map(
      (entry) =>
        `- Remove or archive ${entry.title} @ ${entry.company} (${formatValue(entry.startDate)} -> ${formatValue(entry.endDate)})`,
    )
    .join('\n')
}

function renderCopyPack(options: {
  title: string
  snapshotId: string
  currentLabel: string
  targetLabel: string
  current: LinkedInSyncProfile
  target: LinkedInSyncProfile
  diff: LinkedInSyncProfileDiff
}) {
  const changedIntro = options.diff.intro.filter((entry) => entry.status === 'changed')
  const changedExperienceTargets = [
    ...options.diff.experience.added,
    ...options.diff.experience.changed.map((entry) => entry.desired),
  ]
  const changedEducationTargets = [
    ...options.diff.education.added,
    ...options.diff.education.changed.map((entry) => entry.desired),
  ]

  return `# ${options.title}

Snapshot: ${options.snapshotId}
Generated: ${new Date().toISOString()}
Current source: ${options.currentLabel}
Target source: ${options.targetLabel}

## Summary
- Total changes: ${options.diff.summary.totalChanges}
- Intro changes: ${options.diff.summary.introChanges}
- About changed: ${options.diff.summary.aboutChanged ? 'yes' : 'no'}
- Top skills changed: ${options.diff.summary.topSkillsChanged ? 'yes' : 'no'}
- Links changed: ${options.diff.summary.linksChanged ? 'yes' : 'no'}
- Experience changes: +${options.diff.summary.experienceAdded} / ~${options.diff.summary.experienceChanged} / -${options.diff.summary.experienceRemoved}
- Education changes: +${options.diff.summary.educationAdded} / ~${options.diff.summary.educationChanged} / -${options.diff.summary.educationRemoved}

## Headline
\`\`\`text
${options.target.intro.headline}
\`\`\`

## About
\`\`\`text
${options.target.about}
\`\`\`

## Intro fields
${changedIntro.length === 0 ? '- No intro field changes.' : changedIntro
  .map(
    (entry) =>
      `- ${entry.path}: ${formatValue(entry.current)} -> ${formatValue(entry.desired)}`,
  )
  .join('\n')}

## Current role
- Company: ${formatValue(options.target.intro.currentCompany)}
- Title: ${formatValue(options.target.intro.currentTitle)}
- Location: ${formatValue(options.target.intro.location)}

## Top skills
${options.target.topSkills.map((skill, index) => `${index + 1}. ${skill}`).join('\n')}

## Links
${formatLinks(options.target.links)}

## Experience updates
${renderExperienceSections(changedExperienceTargets)}

## Experience removals
${renderRemovedExperienceSections(options.diff.experience.removed)}

## Education updates
${formatEducation(changedEducationTargets)}

## Education removals
${options.diff.education.removed.length === 0
  ? 'No education removals in this pack.'
  : options.diff.education.removed
      .map(
        (entry) =>
          `- Remove or archive ${entry.institution} (${formatValue(entry.startDate)} -> ${formatValue(entry.endDate)})`,
      )
      .join('\n')}
`
}

async function writeStatusArtifact(warnings: string[] = []) {
  const imported = await readJsonFile<ImportedBaseline>(importedPath)
  const latest = await readJsonFile<LatestSnapshotPointer>(latestPath)
  const applied = await readJsonFile<AppliedSnapshotPointer>(appliedPath)

  const status: PublicStatusArtifact = {
    schemaVersion: LINKEDIN_SYNC_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    baselineImportedAt: imported.importedAt,
    baselineSourceType: imported.sourceType,
    latestSnapshotId: latest.snapshotId,
    appliedSnapshotId: applied.snapshotId,
    pendingChanges:
      Boolean(latest.snapshotId) &&
      latest.snapshotId !== applied.snapshotId &&
      Boolean(latest.summary?.totalChanges),
    restoreAvailable: Boolean(latest.snapshotId || applied.snapshotId),
    diffSummary: latest.summary,
    warnings: [...new Set([...imported.warnings, ...warnings])],
  }

  await writeJsonFile(trackedStatusPath, status)
}

async function commandImport(inputPath: string | undefined) {
  if (!inputPath) {
    throw new Error('Usage: npm run linkedin:import -- /path/to/linkedin-export')
  }

  await ensurePaths()

  const imported = await importLinkedInBaseline(path.resolve(repoRoot, inputPath))
  await writeJsonFile(importedPath, imported)
  await writeStatusArtifact([
    'LinkedIn baseline imported. Run linkedin:sync to create a snapshot and diff.',
  ])

  console.log(`Imported LinkedIn baseline from ${imported.inputName}.`)
  console.log(`Detected ${imported.manifest.length} files in the export.`)
  console.log(`Warnings: ${imported.warnings.length}`)
}

async function commandSync() {
  await ensurePaths()

  const imported = await readJsonFile<ImportedBaseline>(importedPath)

  if (!imported.profile || !imported.importedAt || !imported.sourceType || !imported.inputName) {
    throw new Error('No imported LinkedIn baseline found. Run linkedin:import first.')
  }

  const desired = buildDesiredLinkedInProfile()
  const baseline = imported.profile
  const diff = diffLinkedInProfiles(baseline, desired)
  const baselineHash = stableHash(baseline)
  const desiredHash = stableHash(desired)
  const snapshotId = createSnapshotId(baselineHash, desiredHash)

  const snapshot: LinkedInSyncSnapshot = {
    schemaVersion: LINKEDIN_SYNC_SCHEMA_VERSION,
    snapshotId,
    createdAt: new Date().toISOString(),
    inputName: imported.inputName,
    sourceType: imported.sourceType,
    manifest: imported.manifest,
    warnings: imported.warnings,
    baselineHash,
    desiredHash,
    diff,
    baseline,
    desired,
  }

  await writeJsonFile(path.join(historyDir, `${snapshotId}.json`), snapshot)
  await writeJsonFile(latestPath, {
    schemaVersion: LINKEDIN_SYNC_SCHEMA_VERSION,
    snapshotId,
    createdAt: snapshot.createdAt,
    importedAt: imported.importedAt,
    baselineHash,
    desiredHash,
    summary: diff.summary,
  } satisfies LatestSnapshotPointer)

  await writeJsonFile(payloadPath, desired)
  await writeJsonFile(diffPath, {
    snapshotId,
    baselineImportedAt: imported.importedAt,
    baselineSourceType: imported.sourceType,
    diff,
  })
  await fs.writeFile(
    copyPackPath,
    renderCopyPack({
      title: 'LinkedIn Sync Pack',
      snapshotId,
      currentLabel: 'Imported LinkedIn baseline',
      targetLabel: 'Repo desired state',
      current: baseline,
      target: desired,
      diff,
    }),
    'utf8',
  )

  await writeStatusArtifact()

  console.log(`Created snapshot ${snapshotId}.`)
  console.log(`Diff total changes: ${diff.summary.totalChanges}`)
}

async function commandAccept() {
  await ensurePaths()

  const latest = await readJsonFile<LatestSnapshotPointer>(latestPath)

  if (!latest.snapshotId || !latest.desiredHash) {
    throw new Error('No latest sync snapshot found. Run linkedin:sync first.')
  }

  await writeJsonFile(appliedPath, {
    schemaVersion: LINKEDIN_SYNC_SCHEMA_VERSION,
    snapshotId: latest.snapshotId,
    appliedAt: new Date().toISOString(),
    desiredHash: latest.desiredHash,
  } satisfies AppliedSnapshotPointer)

  await writeStatusArtifact()

  console.log(`Marked snapshot ${latest.snapshotId} as applied.`)
}

async function commandRestore(snapshotId: string | undefined) {
  if (!snapshotId) {
    throw new Error('Usage: npm run linkedin:restore -- <snapshot-id>')
  }

  await ensurePaths()

  const snapshotPath = path.join(historyDir, `${snapshotId}.json`)
  const snapshot = await readJsonFile<LinkedInSyncSnapshot>(snapshotPath)
  const rollbackDiff = diffLinkedInProfiles(snapshot.desired, snapshot.baseline)

  await writeJsonFile(restorePayloadPath, snapshot.baseline)
  await fs.writeFile(
    restorePackPath,
    renderCopyPack({
      title: 'LinkedIn Restore Pack',
      snapshotId,
      currentLabel: 'Repo desired state from snapshot',
      targetLabel: 'Snapshot baseline before sync',
      current: snapshot.desired,
      target: snapshot.baseline,
      diff: rollbackDiff,
    }),
    'utf8',
  )

  console.log(`Prepared rollback pack for snapshot ${snapshotId}.`)
}

async function main() {
  const [, , command, ...rest] = process.argv

  switch (command) {
    case 'import':
      await commandImport(rest[0])
      break
    case 'sync':
      await commandSync()
      break
    case 'accept':
      await commandAccept()
      break
    case 'restore':
      await commandRestore(rest[0])
      break
    default:
      throw new Error(
        'Unknown command. Use one of: import, sync, accept, restore.',
      )
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
})
