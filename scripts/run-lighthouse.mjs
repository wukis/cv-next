import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { chromium } from 'playwright'

const audits = {
  home: {
    url: 'http://127.0.0.1:3000/',
    outputPath: '.generated/lighthouse-home.json',
  },
  about: {
    url: 'http://127.0.0.1:3000/about',
    outputPath: '.generated/lighthouse-about.json',
  },
  cv: {
    url: 'http://127.0.0.1:3000/cv',
    outputPath: '.generated/lighthouse-cv.json',
  },
  experience: {
    url: 'http://127.0.0.1:3000/experience',
    outputPath: '.generated/lighthouse-experience.json',
  },
  recommendations: {
    url: 'http://127.0.0.1:3000/recommendations',
    outputPath: '.generated/lighthouse-recommendations.json',
  },
}

const auditName = process.argv[2]
const selectedAudits =
  auditName === 'all'
    ? Object.entries(audits)
    : [[auditName, audits[auditName]]]

if (selectedAudits.some(([, audit]) => !audit)) {
  console.error(
    `Unknown Lighthouse audit "${auditName ?? ''}". Expected one of: all, ${Object.keys(audits).join(', ')}`,
  )
  process.exit(1)
}

mkdirSync('.generated', { recursive: true })

const lighthouseBin = join(
  process.cwd(),
  'node_modules',
  'lighthouse',
  'cli',
  'index.js',
)

const runAudit = ([name, audit]) =>
  new Promise((resolve, reject) => {
    console.log(`Running Lighthouse for ${name}: ${audit.url}`)

    const lighthouse = spawn(
      process.execPath,
      [
        lighthouseBin,
        audit.url,
        '--chrome-flags=--headless',
        '--output=json',
        `--output-path=${audit.outputPath}`,
        '--quiet',
      ],
      {
        env: {
          ...process.env,
          CHROME_PATH: chromium.executablePath(),
        },
        stdio: 'inherit',
      },
    )

    lighthouse.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`Lighthouse exited with signal ${signal}`))
        return
      }

      if (code !== 0) {
        reject(new Error(`Lighthouse exited with code ${code ?? 1}`))
        return
      }

      resolve()
    })
  })

for (const audit of selectedAudits) {
  await runAudit(audit)
}
