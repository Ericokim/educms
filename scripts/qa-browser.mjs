// Browser QA driver: logs into the running app and walks the main pages.
// Usage: node scripts/qa-browser.mjs (expects api on :4000 and web on :5173)
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const CHROMIUM =
  process.env.QA_CHROMIUM ||
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`

const SHOTS = 'qa-screenshots'
fs.mkdirSync(SHOTS, { recursive: true })

const results = []
const consoleErrors = []

function record(step, ok, detail = '') {
  results.push({ step, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${step}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch({ executablePath: CHROMIUM, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})

try {
  // 1. Login page renders
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
  record('login page renders', await page.getByText('Sign in to manage your content').isVisible())

  // 2. Invalid login shows error
  await page.getByLabel('Email').fill('admin@educms.local')
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByRole('alert').waitFor({ timeout: 5000 })
  record('invalid login shows error', (await page.getByRole('alert').textContent())?.includes('Invalid'))

  // 3. Valid login lands on dashboard with real stats
  await page.getByLabel('Password').fill('Password123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByText('Welcome back, Alice').waitFor({ timeout: 10000 })
  await page.getByText('Published posts').waitFor()
  record('admin login -> dashboard with stats', true)
  await page.screenshot({ path: `${SHOTS}/01-dashboard.png`, fullPage: true })

  // 4. Posts page: table renders with seed data
  await page.getByRole('link', { name: 'Posts', exact: true }).click()
  await page.getByRole('link', { name: 'New post', exact: true }).waitFor()
  await page.getByText('Scholarship Applications for 2027 Now Open').waitFor({ timeout: 8000 })
  record('posts table renders seed content', true)
  await page.screenshot({ path: `${SHOTS}/02-posts.png`, fullPage: true })

  // 5. Posts search filters
  await page.getByLabel('Search posts').fill('python')
  await page.getByText('Getting Started with Python for Data Analysis').waitFor({ timeout: 5000 })
  record('post search filters results', true)

  // 6. Users page renders with role badges
  await page.getByRole('link', { name: 'Users', exact: true }).click()
  await page.getByText('Manage accounts and roles').waitFor()
  await page.getByText('(you)').waitFor({ timeout: 8000 })
  record('users page renders with self marker', true)
  await page.screenshot({ path: `${SHOTS}/03-users.png`, fullPage: true })

  // 7. Comments moderation page
  await page.getByRole('link', { name: 'Comments', exact: true }).click()
  await page.getByText('Review and moderate reader comments').waitFor({ timeout: 8000 })
  record('comments page renders', true)

  // 8. Analytics page with charts
  await page.getByRole('link', { name: 'Analytics', exact: true }).click()
  await page.getByText('Posts per month').waitFor({ timeout: 8000 })
  await page.getByText('Top content').waitFor()
  record('analytics page renders charts', true)
  await page.screenshot({ path: `${SHOTS}/04-analytics.png`, fullPage: true })

  // 9. Logout returns to login
  await page.getByRole('button', { name: /Alice Nguyen/ }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await page.getByText('Sign in to manage your content').waitFor({ timeout: 8000 })
  record('logout returns to login page', true)

  // 10. Subscriber sees a restricted experience
  await page.getByLabel('Email').fill('subscriber@educms.local')
  await page.getByLabel('Password').fill('Password123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByText('Welcome back, Sofia').waitFor({ timeout: 8000 })
  const postsLinkVisible = await page
    .getByRole('link', { name: 'Posts', exact: true })
    .isVisible()
    .catch(() => false)
  record('subscriber dashboard without staff nav', !postsLinkVisible)
  await page.screenshot({ path: `${SHOTS}/05-subscriber.png`, fullPage: true })
} catch (error) {
  record('UNEXPECTED FAILURE', false, String(error).slice(0, 200))
  await page.screenshot({ path: `${SHOTS}/99-failure.png`, fullPage: true }).catch(() => {})
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} QA steps passed`)
if (consoleErrors.length > 0) {
  console.log('console errors:', consoleErrors.slice(0, 5))
} else {
  console.log('no browser console errors')
}
process.exit(failed.length > 0 ? 1 : 0)
