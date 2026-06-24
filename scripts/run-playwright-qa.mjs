import { mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const port = Number(process.env.QA_PORT ?? 4173)
const externalBaseUrl = process.env.QA_BASE_URL?.replace(/\/$/, '')
const baseUrl = externalBaseUrl ?? `http://127.0.0.1:${port}`
const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const screenshotDir = new URL('../docs/screenshots/', import.meta.url)
mkdirSync(screenshotDir, { recursive: true })
const screenshotPath = (name) => fileURLToPath(new URL(name, screenshotDir))
let server

const waitForServer = async () => {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 30_000) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) {
        return
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  throw new Error(`Preview server did not start at ${baseUrl}`)
}

const serverIsReady = async () => {
  try {
    const response = await fetch(baseUrl)
    return response.ok
  } catch {
    return false
  }
}

const startServer = async () => {
  if (externalBaseUrl) {
    console.log(`Using external QA target at ${baseUrl}`)
    return
  }

  if (await serverIsReady()) {
    console.log(`Reusing preview at ${baseUrl}`)
    return
  }

  server = spawn('npm', ['run', 'preview', '--', '--port', String(port)], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  })
  server.stdout.on('data', () => undefined)
  server.stderr.on('data', () => undefined)
}

const assertText = async (page, pattern, label) => {
  const text = await page.locator('body').innerText()
  if (!pattern.test(text)) {
    throw new Error(`Missing ${label}`)
  }
}

const run = async () => {
  await startServer()
  await waitForServer()
  console.log('Preview ready')
  const browser = await chromium.launch()

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true })
  mobile.setDefaultTimeout(10_000)
  await mobile.goto(`${baseUrl}/?qa=1`, { waitUntil: 'networkidle' })
  await mobile.screenshot({ path: screenshotPath('mobile-start.png'), fullPage: true })
  console.log('Mobile start captured')
  await assertText(mobile, /Velvet Alibi/i, 'brand on mobile')
  await mobile.getByTestId('case-card-reading-room').click()
  await mobile.getByTestId('case-card-reading-room').click()
  await assertText(mobile, /Case brief/i, 'case opened')
  await mobile.getByTestId('cell-0-1').click()
  await mobile.getByRole('button', { name: 'Check' }).click()
  await assertText(mobile, /contradict the case file/i, 'wrong-grid status')
  await mobile.getByRole('button', { name: 'Reveal hint' }).click()
  await assertText(mobile, /Begin linksboven/i, 'hint copy')
  await mobile.getByTestId('accuse-ada').click()
  await assertText(mobile, /not supported by the marked square/i, 'wrong accusation')
  await mobile.getByTestId('qa-fill').click()
  await mobile.getByTestId('accuse-mara').click()
  await mobile.getByRole('button', { name: 'Share result' }).click()
  const shareValue = await mobile.getByTestId('share-text').inputValue()
  if (!/Ik loste Dossier 01/i.test(shareValue)) {
    throw new Error('Missing share result')
  }
  await mobile.screenshot({ path: screenshotPath('mobile-solved.png'), fullPage: true })
  console.log('Mobile interaction passed')

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  desktop.setDefaultTimeout(10_000)
  await desktop.goto(`${baseUrl}/?qa=1`, { waitUntil: 'networkidle' })
  await desktop.screenshot({ path: screenshotPath('desktop-start.png'), fullPage: true })
  await assertText(desktop, /CLICK TO REVEAL|Het stilte-uur in de leeszaal/i, 'desktop catalog')
  console.log('Desktop start captured')

  const manifest = await fetch(`${baseUrl}/manifest.json`)
  if (!manifest.ok) {
    throw new Error(`Manifest request failed with ${manifest.status}`)
  }

  await browser.close()
  console.log('Playwright QA passed')
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    if (server) {
      server.kill()
    }
    setTimeout(() => process.exit(process.exitCode ?? 0), 250)
  })
