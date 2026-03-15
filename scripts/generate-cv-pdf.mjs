import { once } from 'node:events'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { chromium } from 'playwright'

const rootDir = path.dirname(
  fileURLToPath(new URL('../package.json', import.meta.url)),
)
const outputPath = path.join(rootDir, 'public', 'jonas-petrik-cv.pdf')
const host = '127.0.0.1'
const startTimeoutMs = 30_000

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function getNpmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}

function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()

    server.on('error', reject)
    server.listen(0, host, () => {
      const address = server.address()

      if (!address || typeof address === 'string') {
        server.close(() =>
          reject(new Error('Unable to resolve a free localhost port.')),
        )
        return
      }

      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve(address.port)
      })
    })
  })
}

async function waitForServer(url) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < startTimeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {}

    await sleep(500)
  }

  throw new Error(`Timed out waiting for ${url} after ${startTimeoutMs}ms.`)
}

function startServer(port) {
  const server = spawn(
    getNpmCommand(),
    ['run', 'start', '--', '--hostname', host, '--port', String(port)],
    {
      cwd: rootDir,
      stdio: 'inherit',
    },
  )

  return server
}

async function stopServer(serverProcess) {
  if (serverProcess.exitCode !== null) {
    return
  }

  serverProcess.kill('SIGTERM')

  const exited = once(serverProcess, 'exit')
  const timeout = sleep(5_000).then(() => {
    if (serverProcess.exitCode === null) {
      serverProcess.kill('SIGKILL')
    }
  })

  await Promise.race([exited, timeout])
}

async function main() {
  const port = await findAvailablePort()
  const baseUrl = `http://${host}:${port}`
  const cvUrl = `${baseUrl}/cv`
  const serverProcess = startServer(port)

  serverProcess.once('exit', (code) => {
    if (code !== 0) {
      console.error(`CV export server exited early with code ${code}.`)
    }
  })

  try {
    await waitForServer(cvUrl)

    const browser = await chromium.launch({ headless: true })

    try {
      const page = await browser.newPage({
        viewport: {
          width: 1440,
          height: 2200,
        },
      })

      await page.addInitScript(() => {
        window.localStorage.setItem('theme', 'light')
        document.documentElement.classList.remove('dark')
        document.documentElement.style.colorScheme = 'light'
      })

      await page.emulateMedia({
        media: 'print',
        colorScheme: 'light',
      })
      await page.goto(cvUrl, { waitUntil: 'networkidle' })
      await page.getByRole('heading', { name: 'Jonas Petrik' }).waitFor()
      await page.evaluate(async () => {
        if (document.fonts?.ready) {
          await document.fonts.ready
        }
      })

      await page.pdf({
        path: outputPath,
        printBackground: true,
        preferCSSPageSize: true,
        scale: 0.94,
      })
    } finally {
      await browser.close()
    }

    console.log(`Saved CV PDF to ${outputPath}`)
  } finally {
    await stopServer(serverProcess)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
