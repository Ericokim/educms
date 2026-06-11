// Browser QA driver: walks the public site, the admin panel, and the full
// publishing lifecycle end to end.
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
const QA_TITLE = `QA Publishing Flow ${Date.now()}`

function record(step, ok, detail = '') {
  results.push({ step, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${step}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch({ executablePath: CHROMIUM, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})

async function login(email) {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('Password123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByText(/Welcome back/).waitFor({ timeout: 10000 })
}

async function logout(name) {
  // The user menu lives in the admin header.
  if (!page.url().includes('/admin')) {
    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' })
  }
  await page.getByRole('button', { name }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await page.getByText('Sign in to manage your content').waitFor({ timeout: 8000 })
}

try {
  // ---------- Public site (anonymous) ----------
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.getByText('Learn. Discover.').waitFor()
  await page.getByText('Latest articles').waitFor()
  record('public homepage renders', true)
  await page.screenshot({ path: `${SHOTS}/01-public-home.png`, fullPage: true })

  await page.getByRole('link', { name: 'Articles', exact: true }).first().click()
  await page.getByRole('heading', { name: 'Articles' }).waitFor()
  await page
    .getByRole('link', { name: /Getting Started with Python/ })
    .first()
    .waitFor({ timeout: 8000 })
  record('public articles listing renders', true)

  await page
    .getByRole('link', { name: /Getting Started with Python/ })
    .first()
    .click()
  await page.getByRole('heading', { level: 1 }).waitFor()
  await page.getByText('Related articles').waitFor({ timeout: 8000 })
  record('public article page renders by slug', true)
  await page.screenshot({ path: `${SHOTS}/02-public-article.png`, fullPage: true })

  await page.goto('http://localhost:5173/search?q=python', { waitUntil: 'networkidle' })
  await page.getByText(/result(s)? for/).waitFor({ timeout: 8000 })
  record('public search returns results', true)

  await page.goto('http://localhost:5173/categories/tutorials', { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Tutorials' }).waitFor({ timeout: 8000 })
  record('public category page renders', true)

  // ---------- Admin core ----------
  await login('admin@educms.local')
  await page.getByText('Media files').waitFor()
  record('admin dashboard with six stat cards', true)
  await page.screenshot({ path: `${SHOTS}/03-admin-dashboard.png`, fullPage: true })

  // ---------- Publishing lifecycle ----------
  await page.getByRole('link', { name: 'Posts', exact: true }).click()
  await page.getByRole('link', { name: 'New post', exact: true }).click()
  await page.getByLabel('Title', { exact: true }).fill(QA_TITLE)
  await page.locator('.tiptap-content').click()
  await page.keyboard.type('This article was created by the automated QA flow.')
  await page.getByRole('button', { name: 'Create draft' }).click()
  await page.getByRole('button', { name: 'Save changes' }).waitFor({ timeout: 8000 })
  record('draft created', true)

  const editUrl = page.url()
  const postId = editUrl.match(/posts\/(\d+)\/edit/)?.[1]
  const qaSlug = QA_TITLE.toLowerCase().replace(/\s+/g, '-')

  // Draft must NOT be public.
  const draftPublic = await page.request.get(
    `http://localhost:4000/api/public/posts/${qaSlug}`
  )
  record('draft hidden from public API', draftPublic.status() === 404)

  // Preview without publishing.
  await page.getByRole('link', { name: 'Preview' }).click()
  await page.getByText('Preview mode — this post is not published yet.').waitFor()
  await page.getByRole('heading', { name: QA_TITLE }).waitFor()
  record('preview renders public layout without publishing', true)
  await page.screenshot({ path: `${SHOTS}/04-preview.png`, fullPage: true })

  const stillHidden = await page.request.get(
    `http://localhost:4000/api/public/posts/${qaSlug}`
  )
  record('preview did not publish the post', stillHidden.status() === 404)

  // Publish.
  await page.getByRole('link', { name: 'Back to editor' }).click()
  await page.getByRole('button', { name: 'Publish' }).click()
  await page.getByText('Post published').waitFor({ timeout: 8000 })
  record('post published from editor', true)

  // Public URL now works.
  await page.goto(`http://localhost:5173/articles/${qaSlug}`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: QA_TITLE }).waitFor({ timeout: 8000 })
  record('published article visible at public URL', true)

  await logout('Alice Nguyen')

  // ---------- Subscriber: read + comment ----------
  await login('subscriber@educms.local')
  await page.getByText('Latest articles').waitFor()
  record('subscriber reader dashboard renders', true)

  await page.goto(`http://localhost:5173/articles/${qaSlug}`, { waitUntil: 'networkidle' })
  await page.getByLabel('Leave a comment').fill('Great article! (QA comment)')
  await page.getByRole('button', { name: 'Submit comment' }).click()
  await page.getByText('Thanks! Your comment will appear once it is approved.').waitFor()
  record('subscriber submitted a comment', true)

  const publicComments = await (
    await page.request.get(`http://localhost:4000/api/public/posts/${qaSlug}/comments`)
  ).json()
  record(
    'pending comment hidden from public',
    !publicComments.data.some((c) => c.content.includes('QA comment'))
  )

  await logout('Sofia Marin')

  // ---------- Editor: moderate ----------
  await login('editor@educms.local')
  await page.getByRole('link', { name: 'Comments', exact: true }).click()
  await page.getByText('Great article! (QA comment)').waitFor({ timeout: 8000 })
  await page
    .getByRole('button', { name: /Approve comment by subscriber/ })
    .first()
    .click()
  await page.getByText('Comment approved').waitFor({ timeout: 8000 })
  const approvedComments = await (
    await page.request.get(`http://localhost:4000/api/public/posts/${qaSlug}/comments`)
  ).json()
  record(
    'approved comment visible publicly',
    approvedComments.data.some((c) => c.content.includes('QA comment'))
  )
  await logout('Edgar Reyes')

  // ---------- Cleanup: admin deletes the QA post ----------
  await login('admin@educms.local')
  await page.goto(`http://localhost:5173/admin/posts/${postId}/edit`, {
    waitUntil: 'networkidle',
  })
  await page.getByRole('button', { name: 'Delete post' }).click()
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByText('Post deleted').waitFor({ timeout: 8000 })
  const gone = await page.request.get(`http://localhost:4000/api/public/posts/${qaSlug}`)
  record('QA post cleaned up and gone from public', gone.status() === 404)
  await logout('Alice Nguyen')
} catch (error) {
  record('UNEXPECTED FAILURE', false, String(error).slice(0, 300))
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
