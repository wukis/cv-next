import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(
  fileURLToPath(new URL('../package.json', import.meta.url)),
)
const outputPdfPath = 'public/jonas-petrik-cv.pdf'

const contentPathPatterns = [
  /^src\/app\/about\/page\.tsx$/,
  /^src\/app\/cv\/page\.tsx$/,
  /^src\/app\/page\.tsx$/,
  /^src\/components\/ExperiencePageContent\.tsx$/,
  /^src\/components\/HomePageContent\.tsx$/,
  /^src\/components\/RecommendationsWall\.tsx$/,
  /^src\/components\/TechStack\.tsx$/,
  /^src\/data\/.+\.json$/,
  /^src\/images\//,
  /^src\/lib\/profileContent\.ts$/,
  /^src\/lib\/publicResume\.ts$/,
  /^src\/lib\/recommendationsCopy\.ts$/,
  /^src\/lib\/siteProfile\.ts$/,
]

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  })

  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join('\n')
    throw new Error(
      [`Command failed: ${command} ${args.join(' ')}`, details]
        .filter(Boolean)
        .join('\n'),
    )
  }

  return result.stdout.trim()
}

function getNpmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}

function getGitFileList(args) {
  const output = runCommand('git', args)
  if (!output) {
    return []
  }

  return output
    .split('\n')
    .map((filePath) => filePath.trim())
    .filter(Boolean)
}

function isPortfolioContentFile(filePath) {
  return contentPathPatterns.some((pattern) => pattern.test(filePath))
}

function formatFileList(filePaths) {
  return filePaths.map((filePath) => `- ${filePath}`).join('\n')
}

function main() {
  const stagedFiles = getGitFileList([
    'diff',
    '--cached',
    '--name-only',
    '--diff-filter=ACMR',
  ])
  const stagedContentFiles = stagedFiles.filter(isPortfolioContentFile)

  if (stagedContentFiles.length === 0) {
    console.log(
      'Skipping CV PDF regeneration: no staged portfolio content changes.',
    )
    return
  }

  const unstagedFiles = getGitFileList(['diff', '--name-only'])
  const unstagedContentFiles = unstagedFiles.filter(isPortfolioContentFile)

  if (unstagedContentFiles.length > 0) {
    throw new Error(
      [
        'Cannot regenerate the CV PDF with unstaged portfolio content changes present.',
        'Stage or stash these files first so the committed PDF matches the committed content:',
        formatFileList(unstagedContentFiles),
      ].join('\n'),
    )
  }

  console.log(
    [
      'Regenerating the checked-in CV PDF because staged portfolio content changed:',
      formatFileList(stagedContentFiles),
    ].join('\n'),
  )

  const npmCommand = getNpmCommand()
  const cvPdfResult = spawnSync(npmCommand, ['run', 'cv:pdf'], {
    cwd: rootDir,
    stdio: 'inherit',
  })

  if (cvPdfResult.status !== 0) {
    process.exit(cvPdfResult.status ?? 1)
  }

  const gitAddResult = spawnSync('git', ['add', outputPdfPath], {
    cwd: rootDir,
    stdio: 'inherit',
  })

  if (gitAddResult.status !== 0) {
    process.exit(gitAddResult.status ?? 1)
  }

  console.log(`Staged refreshed CV PDF: ${outputPdfPath}`)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
